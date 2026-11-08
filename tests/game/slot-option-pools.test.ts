import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import raw from '../../src/generated/content.json';
import {validateContent} from '../../src/content/loader.ts';
import {content} from './combat-fixtures.ts';
import {initializeAccount} from '../../src/domain/progression/initialize.ts';
import {AccountCommandRules} from '../../src/domain/account/commands.ts';
import {applyOptionTarget} from '../../src/domain/progression/option-target.ts';
import {applyCraftingCommand,optionStoneOutcomes} from '../../src/domain/progression/equipment-crafting.ts';
import {availableItemOptions,optionRules,rollItemOptions,optionModifiers} from '../../src/domain/build/item-options.ts';
import {equipmentSlots} from '../../src/domain/build/equipment-definition.ts';
import {equippedSources} from '../../src/domain/build/equipment.ts';
import {previewCharacterStats} from '../../src/domain/build/character.ts';
import {migrateAccountState} from '../../src/domain/account/migrate.ts';
import {nextRandom} from '../../src/content/random.ts';
import {shopBatchFixture} from './shop-batch-fixture.ts';
import type {AccountState,Command} from '../../src/contracts/index.ts';
const at='2026-11-08T00:00:00Z',rules=new AccountCommandRules(content);
type Gear=Extract<AccountState['inventory'][number],{kind:'equipment'}>;
function initial(){const s=initializeAccount(content,{root_job_id:'mage',gender:'male'},at,'2026-11-08',1);s.wallet.gold=10000000;s.equipment_crafting={stock:{option_stone:1000,rarity_stone:100},pending_roll:null};s.inventory.push({instance_id:'slot_options',definition_id:'equipment_staff_1',kind:'equipment',rarity_id:'supreme',locked:false,training:false,options:Array.from({length:5},()=>({id:'opt_atk',roll:500})) as Gear['options']});s.roster[0]!.equipment.weapon='slot_options';return s;}
const gear=(s:AccountState)=>s.inventory.find(i=>i.instance_id==='slot_options') as Gear;
const command=<T extends Command['type']>(type:T,params:Extract<Command,{type:T}>['params'])=>({type,params,request_id:randomUUID(),expected_revision:1,schema_version:1,...rules.versions})as Extract<Command,{type:T}>;
const target=(s:AccountState,index:number,id:string)=>command('equipment.option_target',{item_instance_id:'slot_options',option_index:index,expected_option:gear(s).options[index]!,target_option_id:id,max_attempts:10000});
test('D223 all six slots/Tiers use explicit, distinct pools; endpoints/odds and two draws per row remain exact',()=>{
 const unique=new Set<string>();for(const slot of equipmentSlots){unique.add(optionRules(content).slot_pools![slot].join(','));for(const tier of[1,20,40,60,80,100]){
  const def=Object.values(content.items).find(d=>d.kind==='equipment'&&d.slot===slot&&d.tier_level===tier)!;
  const item={...gear(initial()),definition_id:String(def.id)},pool=availableItemOptions(content,[],item.definition_id),sum=pool.reduce((n,r)=>n+r.weight,0);
  assert.equal(pool.length,optionRules(content).slot_pools![slot].length);
  const outcomes=optionStoneOutcomes(item,0,tier,content);assert(Math.abs(outcomes.reduce((n,r)=>n+r.probability,0)-1)<1e-12);
  let start=0;for(const row of pool){const pick=(start+row.weight/2)/sum;for(const value of[0,.999999]){let draws=0;const rolled=rollItemOptions('supreme',()=>draws++%2?value:pick,content,{definition_id:item.definition_id,excluded_stats:pool.map(p=>p.stat)});assert.equal(draws,10);assert(rolled.every(r=>r.id===row.id&&r.roll===(value?1000:0)));const mods=optionModifiers({...item,options:rolled},tier,content);assert.equal(new Set(mods.map(m=>m.id)).size,5);assert(mods.every(m=>m.value===outcomes.find(p=>p.id===row.id)![value?'max':'min']));}start+=row.weight;}
 }}assert.equal(unique.size,6);assert.throws(()=>rollItemOptions('rare',()=>0,content),/DEFINITION_REQUIRED/);
});
test('D223 five M.ATK lines persist and add to the real combat/preview stat exactly once',()=>{
 const s=initial(),g=gear(s),actor=s.roster[0]!;g.options=[];const before=previewCharacterStats(actor,{},content,equippedSources(actor,s,content));g.options=Array.from({length:5},()=>({id:'opt_matk',roll:1000})) as Gear['options'];const after=previewCharacterStats(actor,{},content,equippedSources(actor,s,content));assert(Math.abs(after.magical_attack-before.magical_attack*1.15)<.0001);rules.validateAccount(JSON.parse(JSON.stringify(s)));assert.deepEqual(migrateAccountState(s,content).state.inventory,s.inventory);
});
test('D223 duplicate and same-row targets match sequential paid rolls; same type never free-completes',()=>{
 for(const same of[false,true])for(const seed of[1,71,200]){const a=initial();gear(a).options[1]={id:'opt_matk',roll:1000};if(same)gear(a).options[0]={id:'opt_matk',roll:1000};const b=structuredClone(a),ar={state:seed,draw_count:0},br={...ar};const summary=applyOptionTarget(a,target(a,0,'opt_matk'),content,()=>nextRandom(ar));let n=0;do{const c=command('equipment.option_roll',{item_instance_id:'slot_options',option_index:0,expected_option:gear(b).options[0]!});applyCraftingCommand(b,c,content,()=>nextRandom(br));applyCraftingCommand(b,command('equipment.option_decide',{item_instance_id:'slot_options',roll_id:c.request_id,accept:true}),content,null);n++;}while(gear(b).options[0]!.id!=='opt_matk'&&b.equipment_crafting!.stock.option_stone>0);assert(n>=1);assert.equal(summary.attempts,n);assert.deepEqual(ar,br);assert.deepEqual(a,b);}
});
test('D223 old out-of-slot options and already-paid pending choices survive patch/reload and can be accepted',()=>{
 const s=initial(),g=gear(s);g.options[0]={id:'opt_hp',roll:900};s.equipment_crafting!.pending_roll={item_instance_id:g.instance_id,option_index:0,roll_id:randomUUID(),original:{...g.options[0]},replacement:{id:'opt_def',roll:1000}};const old=structuredClone(s);const migrated=rules.migrateSave(s).state;assert.deepEqual(migrated.inventory,old.inventory);assert.deepEqual(migrated.equipment_crafting,old.equipment_crafting);rules.validateAccount(JSON.parse(JSON.stringify(migrated)));applyCraftingCommand(migrated,command('equipment.option_decide',{item_instance_id:g.instance_id,roll_id:s.equipment_crafting!.pending_roll!.roll_id,accept:true}),content,null);assert.deepEqual(gear(migrated).options[0],old.equipment_crafting!.pending_roll!.replacement);assert.equal(migrated.equipment_crafting!.stock.option_stone,1000);
 assert.throws(()=>applyOptionTarget(migrated,target(migrated,1,'opt_hp'),content,()=>{throw Error('NO_DRAW');}),/INVALID_OPTION_TARGET/);
});
test('D223 repeated-row target API replays one signed receipt/revision without a second debit',async()=>{
 const f=shopBatchFixture('funded',at,s=>{const source=initial();s.inventory.push(gear(source));s.equipment_crafting=source.equipment_crafting;});const c=target(f.state,0,'opt_atk');const send=()=>f.api.fetch(new Request('http://local/api/commands',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(c)}));const response=await send();assert.equal(response.status,200);const receipt=(await response.json()).receipt;assert.equal(receipt.outcome,'committed');assert(receipt.result.option_batch.attempts>=1);assert.equal(f.state.equipment_crafting!.stock.option_stone,1000-receipt.result.option_batch.stones_spent);assert.deepEqual((await(await send()).json()).receipt,receipt);assert.equal(f.writes,1);assert.equal(f.revision,2);
});
test('D223 frozen legacy catalogs retain global uniqueness and original RNG outcomes',()=>{
 const before=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-200/before.json.gz')).toString()),old=JSON.parse(before['plan/data/equipment.json']).random_options,c=structuredClone(content);(c.documents['equipment.json'] as any).random_options=old;let calls=0;const rolled=rollItemOptions('supreme',()=>{calls++;return 0;},c);assert.equal(calls,10);assert.equal(new Set(rolled.map(o=>o.id)).size,5);assert.deepEqual(rolled.map(o=>o.id),old.pool.slice(0,5).map((o:any)=>o.id));
});
test('D223 malformed slot tables fail content validation instead of silently using all stats',()=>{
 for(const mutate of[(r:any)=>delete r.slot_pools.shoes,(r:any)=>r.slot_pools.armor=[],(r:any)=>r.slot_pools.head=['opt_unknown'],(r:any)=>r.slot_pools.weapon=['opt_atk','opt_atk']]){const data=structuredClone(raw);mutate((data.documents['equipment.json'] as any).random_options);const result=validateContent(data);assert.equal(result.ok,false);if(!result.ok)assert(result.errors.some(e=>e.code.startsWith('option_pool_')));}
});
