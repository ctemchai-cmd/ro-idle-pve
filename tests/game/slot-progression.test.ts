import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, Command, BattleActor } from '../../src/contracts/index.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { cardCapacity } from '../../src/domain/progression/slots.ts';
import { compactPaidLedger } from '../../src/domain/progression/ledger.ts';
import { equippedSources } from '../../src/domain/build/equipment.ts';
import { equipmentStats } from '../../src/client/equipment.ts';
import { slotChangePreview, nextRefineChance } from '../../src/client/slots.ts';
import { compileCharacterSkills } from '../../src/domain/progression/skills.ts';
import { storyParty, storyInput } from '../../src/domain/build/story.ts';
import { storyStage, storyBoss } from '../../src/domain/modes/story.ts';
import { createBattle } from '../../src/domain/combat/index.ts';
import { content } from './combat-fixtures.ts';
import { jobBonus } from '../../src/domain/build/character.ts';
import { equipStarterSet } from './gear-fixtures.ts';
const at='2026-10-20T00:00:00.000Z';
// Server-injected per-command seeds: lcg32 first draw of SUCCESS is 0, of FAIL is ~0.995.
const SUCCESS=634785765,FAIL=1568006588;
function fixture(){
 const rules=new AccountCommandRules();let state=equipStarterSet(initializeAccount(content,{root_job_id:'mage',gender:'female'},at,'2026-10-20',1)),revision=1,serial=0;
 state.wallet.gold=1000000;state.wallet.refine_ore=10000;state.wallet.enchant_dust=10000;state.wallet.card_dust=10000;
 function run(type:Command['type'],params:unknown,seed:number|null=SUCCESS){const command={type,params,request_id:`22222222-2222-4222-8222-${String(++serial).padStart(12,'0')}`,expected_revision:revision,schema_version:1,...rules.versions}as Command;rules.parse(command);const result=rules.decide(command,state,null,{server_at:at,now_ms:Date.parse(at),farm_from_ms:Date.parse(at),...(seed===null?{}:{battle_seed:seed})}as CommandTime,'a'.repeat(64));if(result.receipt.outcome==='committed'){state=result.state;revision++;}return result;}
 return{run,rules,get state(){return state;},get actor(){return state.roster[0]!;},get revision(){return revision;}};
}
const params={character_id:'main',slot:'weapon'};
function refineTo(f:ReturnType<typeof fixture>,target:number,slot:'weapon'='weapon'){for(let level=f.actor.slot_progress[slot].refine+1;level<=target;level++)assert.equal(f.run('slot.refine',{character_id:'main',slot,target_level:level}).receipt.result.code,'SLOT_REFINED');}
function card(id:string,rarity:'bronze'|'silver'|'gold'='bronze',level=1):Extract<AccountState['inventory'][number],{kind:'card'}>{return{instance_id:id,definition_id:'card_weapon_1',kind:'card',rarity_id:rarity,level,locked:false};}
test('Refine4→5 and9→10 open exact sockets, costs total77000gold/275ore when every step succeeds; max11/duplicate target do not debit',()=>{
 const f=fixture(),before=structuredClone(f.state.wallet);refineTo(f,4);assert.equal(cardCapacity(f.actor.slot_progress.weapon.refine,content),1);assert.equal(before.gold-f.state.wallet.gold,6000);assert.equal(before.refine_ore-f.state.wallet.refine_ore,50);
 refineTo(f,5);assert.equal(cardCapacity(f.actor.slot_progress.weapon.refine,content),2);refineTo(f,9);assert.equal(cardCapacity(f.actor.slot_progress.weapon.refine,content),2);refineTo(f,10);assert.equal(cardCapacity(f.actor.slot_progress.weapon.refine,content),3);assert.equal(before.gold-f.state.wallet.gold,77000);assert.equal(before.refine_ore-f.state.wallet.refine_ore,275);
 const state=structuredClone(f.state),revision=f.revision;assert.throws(()=>f.run('slot.refine',{...params,target_level:11}));assert.equal(f.run('slot.refine',{...params,target_level:10}).receipt.result.code,'UPGRADE_LEVEL_UNCHANGED');assert.deepEqual(f.state,state);assert.equal(f.revision,revision);assert.equal(f.state.paid_ledger.length,0);
});
test('Enchant merges old/current actual paid costs and changing line refunds exact2800gold/11dust once into immutable receipt, not current4200 price',()=>{
 const f=fixture(),progress=f.actor.slot_progress.weapon;progress.enchant={line_id:'offense',level:2};const before=structuredClone(f.state.wallet);f.state.wallet.gold-=100;f.state.wallet.enchant_dust-=2;
 f.state.paid_ledger.push({entry_id:'old_enchant',character_id:'main',feature_id:'enchant_weapon',skill_id:'offense',quantity:2,cost_version:'old-v0',cost_versions:['old-v0'],paid_resources:{...Object.fromEntries(Object.keys(before).map(k=>[k,0])),gold:100,enchant_dust:2}as AccountState['wallet'],refund_state:'active',refund_command_id:null});
 f.run('slot.enchant',{...params,line_id:'offense',target_level:3});assert.equal(f.state.paid_ledger.length,1);assert.equal(f.state.paid_ledger[0]!.paid_resources.gold,2800);assert.equal(f.state.paid_ledger[0]!.quantity,3);assert.deepEqual(f.state.paid_ledger[0]!.cost_versions,['old-v0',content.manifest.content_version]);
 const changed=f.run('slot.change_enchant',{...params,line_id:'precision'});assert.equal(changed.receipt.result.resource_delta.gold,2800);assert.equal(changed.receipt.result.resource_delta.enchant_dust,11);assert.equal(changed.receipt.result.refunded_ledger_entries[0]!.refund_state,'refunded');assert.equal(changed.receipt.result.refunded_ledger_entries[0]!.entry_id,'old_enchant');assert.equal(f.state.paid_ledger.length,0);assert.deepEqual(f.state.wallet,before);assert.deepEqual(f.actor.slot_progress.weapon.enchant,{line_id:'precision',level:0});
 assert.equal(f.run('slot.change_enchant',{...params,line_id:'precision'}).receipt.result.code,'ENCHANT_LINE_UNCHANGED');const back=f.run('slot.change_enchant',{...params,line_id:'offense'});assert.equal(back.receipt.result.resource_delta.gold,0);assert.equal(back.receipt.result.refunded_ledger_entries.length,0);assert.deepEqual(f.state.wallet,before);
});
test('distinct duplicate cards add per source; a single instance moves owners, and investments sleep when gear removed',()=>{
 const f=fixture();f.state.inventory.push(card('gold1','gold',5),card('gold2','gold',5),card('bronze'));refineTo(f,5);const before=equipmentStats(f.state,'main').stats.physical_attack;
 f.run('card.assign',{...params,card_slot:0,card_instance_id:'gold1'});f.run('card.assign',{...params,card_slot:1,card_instance_id:'gold2'});assert.equal(equipmentStats(f.state,'main').stats.physical_attack,before+48);assert.equal(f.run('card.assign',{...params,card_slot:2,card_instance_id:'bronze'}).receipt.result.code,'CARD_SLOT_LOCKED');
 refineTo(f,10);f.run('card.assign',{...params,card_slot:2,card_instance_id:'bronze'});const investment=structuredClone(f.actor.slot_progress.weapon);f.run('equipment.unequip',params);assert.deepEqual(f.actor.slot_progress.weapon,investment);assert.ok(equippedSources(f.actor,f.state,content).every(s=>!['gold1','gold2','bronze'].includes(s.source.instance_id)));
 f.run('equipment.equip',{...params,item_instance_id:'starter_main_weapon'});f.run('card.assign',{character_id:'npc_mage',slot:'weapon',card_slot:0,card_instance_id:'gold1'});assert.equal(f.actor.slot_progress.weapon.cards[0],null);assert.equal(f.state.roster.find(a=>a.character_id==='npc_mage')!.slot_progress.weapon.cards[0],'gold1');assert.equal(f.actor.slot_progress.weapon.refine,10);assert.equal(f.state.inventory.filter(i=>i.instance_id==='gold1').length,1);
});
test('card level1→5 charges7500gold/300dust once; salvage yields rarity dust only and protected batches reject before mutation',()=>{
 const f=fixture();f.state.inventory.push(card('bronze'),card('silver','silver'),card('gold','gold'));const before=structuredClone(f.state.wallet);f.run('card.upgrade',{card_instance_id:'bronze',target_level:5});assert.equal(before.gold-f.state.wallet.gold,7500);assert.equal(before.card_dust-f.state.wallet.card_dust,300);assert.equal(f.run('card.upgrade',{card_instance_id:'bronze',target_level:5}).receipt.result.code,'UPGRADE_LEVEL_UNCHANGED');
 f.run('equipment.lock',{item_instance_id:'silver',locked:true});const unchanged=structuredClone(f.state);assert.equal(f.run('card.salvage',{instance_ids:['bronze','silver']}).receipt.result.code,'ITEM_LOCKED');assert.deepEqual(f.state,unchanged);f.run('equipment.lock',{item_instance_id:'silver',locked:false});f.run('card.assign',{...params,card_slot:0,card_instance_id:'gold'});assert.equal(f.run('card.salvage',{instance_ids:['gold']}).receipt.result.code,'ITEM_EQUIPPED');f.run('card.unassign',{...params,card_slot:0});
 const result=f.run('card.salvage',{instance_ids:['bronze','silver','gold']});assert.equal(result.receipt.result.resource_delta.card_dust,140);assert.equal(result.receipt.result.resource_delta.gold,0);assert.deepEqual(result.receipt.result.removed_instance_ids,['bronze','silver','gold']);assert.equal(f.state.paid_ledger.length,0);
});
test('Precision affects preview/engine DEX and CT/ACD through shared primary pipeline; poor-wallet preview works without mutation',()=>{
 const f=fixture(),base=structuredClone(f.actor.primary_stats),poor=structuredClone(f.state);poor.wallet.gold=0;poor.wallet.enchant_dust=0;
 const preview=slotChangePreview(poor,'main','slot.enchant',{...params,line_id:'precision',target_level:10});assert.equal(preview.after.stats.dex,base.dex+jobBonus(f.actor,content).dex+10);assert.equal(poor.wallet.gold,0);assert.equal(poor.roster[0]!.slot_progress.weapon.enchant.level,0);
 f.run('slot.enchant',{...params,line_id:'precision',target_level:10});assert.deepEqual(equipmentStats(f.state,'main'),preview.after);assert.deepEqual(f.actor.primary_stats,base);
 const skills=Object.fromEntries(f.state.team.map(p=>[p.character_id,compileCharacterSkills(f.state.roster.find(a=>a.character_id===p.character_id)!,content)])),hashes=Object.fromEntries(f.state.team.map(p=>[p.character_id,'a'.repeat(64)])),stage=storyStage('1-1',content)!;
 const battle=createBattle(storyInput(stage,storyBoss(stage),storyParty(f.state,content,skills as Record<string,Pick<BattleActor,'active_slots'|'resolved_skills'>>,hashes),content),content,1);assert.ok(battle.ok);if(battle.ok){assert.deepEqual(battle.value.actors.find(a=>a.actor_id==='main')!.stats,preview.after.stats);const bonus=jobBonus(f.actor,content);assert.equal(battle.value.actors.find(a=>a.actor_id==='main')!.stats.cast_speed,100+1.5*(f.actor.primary_stats.dex+bonus.dex+10-1)+.25*(f.actor.primary_stats.int+bonus.int-1));/* DEX+10 precision on top of the D-061 job bonus */}
});
test('repeated level/enchant/reset operations keep only bounded active scopes and archive exact refund evidence without growing save history',()=>{
 const f=fixture(),before=structuredClone(f.state.wallet);for(let i=0;i<30;i++){f.run('slot.enchant',{...params,line_id:i%2?'precision':'offense',target_level:2});assert.equal(f.state.paid_ledger.length,1);const refund=f.run('slot.change_enchant',{...params,line_id:i%2?'offense':'precision'});assert.equal(refund.receipt.result.refunded_ledger_entries.length,1);assert.equal(refund.receipt.result.refunded_ledger_entries[0]!.paid_resources.gold,1500);assert.equal(f.state.paid_ledger.length,0);}assert.deepEqual(f.state.wallet,before);
 const entries=compactPaidLedger([{entry_id:'old',character_id:'main',feature_id:'enchant_weapon',skill_id:'offense',quantity:1,cost_version:'a',cost_versions:['a'],paid_resources:{...Object.fromEntries(Object.keys(before).map(k=>[k,0])),gold:10}as AccountState['wallet'],refund_state:'active',refund_command_id:null},{entry_id:'new',character_id:'main',feature_id:'enchant_weapon',skill_id:'offense',quantity:1,cost_version:'b',cost_versions:['b'],paid_resources:{...Object.fromEntries(Object.keys(before).map(k=>[k,0])),gold:20}as AccountState['wallet'],refund_state:'active',refund_command_id:null}]);assert.equal(entries.length,1);assert.equal(entries[0]!.paid_resources.gold,30);assert.deepEqual(entries[0]!.cost_versions,['a','b']);
});
test('equipped-card payload changes build fingerprints, unassigned rewards do not; all slot/card mutations reject while a battle is active',()=>{
 const f=fixture();f.state.inventory.push(card('bound'),card('free'));f.run('card.assign',{...params,card_slot:0,card_instance_id:'bound'});const before=f.rules.canonical(f.rules.buildInputs(f.state));f.run('card.upgrade',{card_instance_id:'bound',target_level:2});assert.notEqual(f.rules.canonical(f.rules.buildInputs(f.state)),before);const next=f.rules.canonical(f.rules.buildInputs(f.state));f.run('card.upgrade',{card_instance_id:'free',target_level:2});assert.equal(f.rules.canonical(f.rules.buildInputs(f.state)),next);
 f.state.active_battle={battle_id:'33333333-3333-4333-8333-333333333333',mode:'story',mode_ref:'1-1',ticket_day:null,started_at:at,last_ack_at:at,lease_expires_at:'2026-10-20T00:00:15.000Z',content_hash:content.manifest.content_hash,content_version:content.manifest.content_version,rules_version:content.manifest.rules_version};const saved=structuredClone(f.state);for(const[type,p]of[['slot.refine',{...params,target_level:1}],['slot.enchant',{...params,line_id:'precision',target_level:1}],['card.upgrade',{card_instance_id:'free',target_level:3}],['card.unassign',{...params,card_slot:0}]]as const)assert.equal(f.run(type,p).receipt.result.code,'BUILD_LOCKED_DURING_BATTLE');assert.deepEqual(f.state,saved);
});
test('D-057 Refine: +1..+4 always succeed, later steps roll a server seed; failure spends only the step cost, keeps the level and adds pity',()=>{
 const f=fixture();for(let level=1;level<=4;level++)assert.equal(f.run('slot.refine',{...params,target_level:level},FAIL).receipt.result.code,'SLOT_REFINED');
 assert.equal(nextRefineChance(f.actor.slot_progress.weapon),.8);assert.equal(f.run('slot.refine',{...params,target_level:6}).receipt.result.code,'REFINE_ONE_STEP');
 const before=structuredClone(f.state.wallet),failed=f.run('slot.refine',{...params,target_level:5},FAIL);
 assert.equal(failed.receipt.outcome,'committed');assert.equal(failed.receipt.result.code,'REFINE_FAILED');assert.equal(before.gold-f.state.wallet.gold,5000);assert.equal(before.refine_ore-f.state.wallet.refine_ore,25);
 assert.equal(f.actor.slot_progress.weapon.refine,4);assert.equal(f.actor.slot_progress.weapon.refine_failures,1);assert.ok(Math.abs(nextRefineChance(f.actor.slot_progress.weapon)-.9)<1e-12);
 assert.equal(f.run('slot.refine',{...params,target_level:5}).receipt.result.code,'SLOT_REFINED');assert.equal(f.actor.slot_progress.weapon.refine,5);assert.equal(f.actor.slot_progress.weapon.refine_failures,0);
});
test('D-057 Refine pity reaches the cap so +9→+10 (20%) is guaranteed after 8 failures; unseeded rolls are refused',()=>{
 const f=fixture();refineTo(f,9);for(let i=0;i<8;i++)assert.equal(f.run('slot.refine',{...params,target_level:10},FAIL).receipt.result.code,'REFINE_FAILED');
 assert.equal(f.actor.slot_progress.weapon.refine_failures,8);assert.equal(nextRefineChance(f.actor.slot_progress.weapon),1);assert.equal(f.run('slot.refine',{...params,target_level:10},FAIL).receipt.result.code,'SLOT_REFINED');
 const g=fixture();refineTo(g,4);assert.throws(()=>g.run('slot.refine',{...params,target_level:5},null),/SERVER_ROLL_REQUIRED/);
});
