import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import type {AccountState,Command} from '../../src/contracts/index.ts';
import {content} from './combat-fixtures.ts';
import {initializeAccount} from '../../src/domain/progression/initialize.ts';
import {applyCraftingCommand,craftingStock,emptyCrafting,validateCrafting} from '../../src/domain/progression/equipment-crafting.ts';
import {rollItemOptions,optionRules} from '../../src/domain/build/item-options.ts';
import {applyShopPurchase,shopMaxQuantity,shopOffer} from '../../src/domain/progression/shop.ts';
import {migrateAccountState} from '../../src/domain/account/migrate.ts';
import {AccountCommandRules,type CommandTime} from '../../src/domain/account/commands.ts';
import {shopBatchFixture} from './shop-batch-fixture.ts';
const at='2026-10-27T00:00:00.000Z',rules=new AccountCommandRules(content);
function initial(){const s=initializeAccount(content,{root_job_id:'swordsman',gender:'male'},at,'2026-10-27',1);s.wallet.gold=2000000;s.equipment_crafting={stock:{option_stone:100,rarity_stone:100},pending_roll:null};s.inventory.push({instance_id:'craft_test',definition_id:'equipment_sword_1',kind:'equipment',rarity_id:'epic',locked:false,training:false,options:[{id:'opt_atk',roll:500},{id:'opt_hp',roll:700}]});s.roster[0]!.equipment.weapon='craft_test';return s;}
const command=(type:Command['type'],params:unknown)=>({type,params,request_id:randomUUID(),expected_revision:1,schema_version:1,...rules.versions})as Command;
function run(s:AccountState,type:Command['type'],params:unknown){const c=command(type,params);rules.parse(c);return rules.decide(c,s,null,{server_at:at,now_ms:Date.parse(at),battle_seed:71}as CommandTime,'a'.repeat(64));}

test('D188 rarity preserves exact instance/Tier/old options/owner/slot investments and appends only new unique stats',()=>{
 const s=initial(),old=structuredClone(s),result=run(s,'equipment.rarity_up',{item_instance_id:'craft_test',expected_rarity:'epic'});
 assert.equal(result.receipt.result.code,'EQUIPMENT_RARITY_UPGRADED');assert.equal(result.receipt.result.resource_delta.gold,-16000);
 const g=result.state.inventory.at(-1)!;assert.equal(g.kind,'equipment');if(g.kind!=='equipment')throw Error('gear');
 assert.equal(g.instance_id,'craft_test');assert.equal(g.definition_id,'equipment_sword_1');assert.equal(g.rarity_id,'legendary');assert.equal(g.options.length,3);assert.deepEqual(g.options.slice(0,2),(old.inventory.at(-1)!as typeof g).options);
 assert.equal(new Set(g.options.map(o=>optionRules(content).pool.find(p=>p.id===o.id)!.stat)).size,3);assert.deepEqual(result.state.roster,old.roster);assert.equal(craftingStock(result.state,'rarity_stone'),96);assert.deepEqual(s,old);
 assert.deepEqual(result.receipt.result.created_instance_ids,[]);assert.deepEqual(result.receipt.result.removed_instance_ids,[]);
});
test('D188 paid reroll keeps original active until decide, survives JSON/reload, and cannot be rolled/destructed twice',()=>{
 const s=initial(),original=structuredClone(s.inventory.at(-1)!);const result=run(s,'equipment.option_roll',{item_instance_id:'craft_test',option_index:0,expected_option:{id:'opt_atk',roll:500}});
 assert.equal(result.receipt.result.code,'OPTION_ROLLED');const pending=result.state.equipment_crafting!.pending_roll!;assert.equal(craftingStock(result.state,'option_stone'),99);assert.deepEqual(result.state.inventory.at(-1),original);
 const loaded=rules.validateAccount(JSON.parse(JSON.stringify(result.state)));assert.deepEqual(loaded.equipment_crafting,result.state.equipment_crafting);
 for(const[type,params]of [['equipment.option_roll',{item_instance_id:'craft_test',option_index:0,expected_option:pending.original}],['equipment.rarity_up',{item_instance_id:'craft_test',expected_rarity:'epic'}],['equipment.salvage',{instance_ids:['craft_test']}]]as const){const r=run(loaded,type,params);assert.equal(r.receipt.outcome,'rejected');assert.deepEqual(r.state,loaded);}
 for(const accept of[true,false]){const r=run(loaded,'equipment.option_decide',{item_instance_id:'craft_test',roll_id:pending.roll_id,accept});assert.equal(r.receipt.result.code,accept?'OPTION_REPLACED':'OPTION_RETAINED');assert.equal(r.state.equipment_crafting!.pending_roll,null);assert.equal(craftingStock(r.state,'option_stone'),99);const g=r.state.inventory.at(-1)!as typeof original;assert.equal(g.kind,'equipment');if(g.kind==='equipment')assert.deepEqual(g.options[0],accept?pending.replacement:pending.original);const again=run(r.state,'equipment.option_decide',{item_instance_id:'craft_test',roll_id:pending.roll_id,accept});assert.equal(again.receipt.outcome,'rejected');assert.deepEqual(again.state,r.state);}
});
test('D188 stale rarity/option, locked/training/insufficient/absent line reject before payment/RNG; malformed pending rejects validation',()=>{
 const cases:[string,(s:AccountState)=>void,Command['type'],unknown][]=[
 ['RARITY_CHANGED',()=>{},'equipment.rarity_up',{item_instance_id:'craft_test',expected_rarity:'rare'}],
 ['INSUFFICIENT_CRAFTING_STONES',s=>{s.equipment_crafting!.stock.rarity_stone=0;},'equipment.rarity_up',{item_instance_id:'craft_test',expected_rarity:'epic'}],
 ['ITEM_LOCKED',s=>{s.inventory.at(-1)!.locked=true;},'equipment.rarity_up',{item_instance_id:'craft_test',expected_rarity:'epic'}],
 ['OPTION_ROLL_STALE',()=>{},'equipment.option_roll',{item_instance_id:'craft_test',option_index:0,expected_option:{id:'opt_atk',roll:1}}],
 ['OPTION_LINE_MISSING',()=>{},'equipment.option_roll',{item_instance_id:'craft_test',option_index:4,expected_option:{id:'opt_atk',roll:1}}]
 ];for(const[code,mutate,type,params]of cases){const s=initial();mutate(s);const before=structuredClone(s),r=run(s,type,params);assert.equal(r.receipt.result.code,code);assert.equal(r.receipt.outcome,'rejected');assert.deepEqual(r.state,before);}
 const s=initial();const rolled=run(s,'equipment.option_roll',{item_instance_id:'craft_test',option_index:0,expected_option:{id:'opt_atk',roll:500}}).state;
 rolled.equipment_crafting!.pending_roll!.replacement={id:'opt_hp',roll:2};assert.throws(()=>validateCrafting(rolled,content),/INVALID_PENDING_OPTION/);
});
test('D188 all six rarity steps consume stated costs, stop at Supreme, and regular default option RNG remains two draws per line',()=>{
 const s=initial(),g=s.inventory.at(-1)!;if(g.kind!=='equipment')throw Error('gear');g.rarity_id='common';g.options=[];let draws=0;
 for(const[from,to,cost]of [['common','uncommon',1],['uncommon','rare',1],['rare','epic',2],['epic','legendary',4],['legendary','immortal',12],['immortal','supreme',30]]as const){const prior=s.equipment_crafting!.stock.rarity_stone;applyCraftingCommand(s,command('equipment.rarity_up',{item_instance_id:'craft_test',expected_rarity:from})as never,content,()=>{draws++;return .17;});assert.equal(g.rarity_id,to);assert.equal(s.equipment_crafting!.stock.rarity_stone,prior-cost);assert.equal(g.options.length,optionRules(content).lines_by_rarity[to]);}
 assert.equal(draws,10);const before=structuredClone(s);assert.throws(()=>applyCraftingCommand(s,command('equipment.rarity_up',{item_instance_id:'craft_test',expected_rarity:'supreme'})as never,content,()=>0),/RARITY_MAX_REACHED/);assert.deepEqual(s,before);
 let n=0;rollItemOptions('supreme',()=>{n++;return .1;},content);assert.equal(n,10);
});
test('D189 shops enforce independent per-save Bangkok daily limits, affordable max, and stock overflow without partial spending',()=>{
 const a=initial(),b=initial();assert.equal(shopOffer('rarity_stone',content).daily_limit,2);assert.equal(shopOffer('option_stone',content).daily_limit,3);
 applyShopPurchase(a,'rarity_stone',2,'2026-10-27',content);assert.equal(a.equipment_crafting!.stock.rarity_stone,104);assert.equal(a.wallet.gold,1960000);assert.equal(shopMaxQuantity(a,'rarity_stone','2026-10-27',content),0);assert.equal(shopMaxQuantity(a,'rarity_stone','2026-10-28',content),2);assert.equal(shopMaxQuantity(b,'rarity_stone','2026-10-27',content),2);
 const frozen=structuredClone(a);assert.throws(()=>applyShopPurchase(a,'rarity_stone',1,'2026-10-27',content),/SHOP_LIMIT_REACHED/);assert.deepEqual(a,frozen);
 b.equipment_crafting!.stock.option_stone=Number.MAX_SAFE_INTEGER;const old=structuredClone(b);assert.throws(()=>applyShopPurchase(b,'option_stone',1,'2026-10-27',content),/RESOURCE_OVERFLOW/);assert.deepEqual(b,old);
});
test('D188 migration initializes empty stock once, preserves paid pending result and never grants/refunds stones on reload',()=>{
 const s=initial();delete s.equipment_crafting;const m=migrateAccountState(s,content).state;assert.deepEqual(m.equipment_crafting,emptyCrafting());assert.deepEqual(m.wallet,s.wallet);assert.deepEqual(migrateAccountState(m,content).state,m);
 const r=run(initial(),'equipment.option_roll',{item_instance_id:'craft_test',option_index:0,expected_option:{id:'opt_atk',roll:500}}).state;assert.deepEqual(migrateAccountState(r,content).state.equipment_crafting,r.equipment_crafting);
});
test('D188/D189 real API signed persistence replays exact roll/purchase UUID and decision without paying twice',async()=>{
 const f=shopBatchFixture('funded',at,s=>{const prepared=initial();s.inventory=prepared.inventory;s.roster=prepared.roster;s.equipment_crafting=prepared.equipment_crafting;});
 const call=async(type:Command['type'],params:unknown,id=randomUUID(),revision=f.revision)=>{const c={...command(type,params),request_id:id,expected_revision:revision};const r=await f.api.fetch(new Request('http://local/api/commands',{method:'POST',headers:{authorization:'Bearer fixture','content-type':'application/json'},body:JSON.stringify(c)}));return{response:r,body:await r.json(),command:c};};
 const first=await call('equipment.option_roll',{item_instance_id:'craft_test',option_index:0,expected_option:{id:'opt_atk',roll:500}});assert.equal(first.response.status,200);assert.equal(first.body.receipt.result.code,'OPTION_ROLLED');const pending=f.state.equipment_crafting!.pending_roll!,state=f.state;
 const replay=await call(first.command.type,first.command.params,first.command.request_id,first.command.expected_revision);assert.deepEqual(replay.body.receipt,first.body.receipt);assert.equal(f.writes,1);assert.deepEqual(f.state,state);
 const accepted=await call('equipment.option_decide',{item_instance_id:'craft_test',roll_id:pending.roll_id,accept:true});assert.equal(accepted.body.receipt.result.code,'OPTION_REPLACED');assert.equal(f.writes,2);
 const bought=await call('shop.buy',{offer_id:'rarity_stone',quantity:2});assert.equal(bought.body.receipt.result.code,'SHOP_PURCHASED');const before=f.state;
 const buyAgain=await call(bought.command.type,bought.command.params,bought.command.request_id,bought.command.expected_revision);assert.deepEqual(buyAgain.body.receipt,bought.body.receipt);assert.equal(f.writes,3);assert.deepEqual(f.state,before);
});
