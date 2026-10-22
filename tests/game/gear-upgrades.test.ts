import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, Command } from '../../src/contracts/index.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { resolvedEquipmentModifiers } from '../../src/domain/build/equipment.ts';
import { equipmentStats } from '../../src/client/equipment.ts';
import { gearGrowthOptions } from '../../src/client/gear-upgrades.ts';
import { content } from './combat-fixtures.ts';
import { equipStarterSet } from './gear-fixtures.ts';
const at='2026-10-20T00:00:00.000Z';
type Gear=Extract<AccountState['inventory'][number],{kind:'equipment'}>;
function gear(id:string,rarity:Gear['rarity_id']='common',definition='equipment_sword_1'):Gear{return{instance_id:id,definition_id:definition,kind:'equipment',rarity_id:rarity,locked:false,training:false,options:[]};}
function fixture(){const rules=new AccountCommandRules();let state=equipStarterSet(initializeAccount(content,{root_job_id:'swordsman',gender:'male'},at,'2026-10-20',1)),revision=1,serial=0;state.wallet.gold=100000;state.wallet.refine_ore=1000;
 function run(type:Command['type'],params:unknown){const command={type,params,request_id:`22222222-2222-4222-8222-${String(++serial).padStart(12,'0')}`,expected_revision:revision,schema_version:1,...rules.versions}as Command;rules.parse(command);const result=rules.decide(command,state,null,{server_at:at,now_ms:Date.parse(at),farm_from_ms:Date.parse(at)}as CommandTime,'a'.repeat(64));if(result.receipt.outcome==='committed'){state=result.state;revision++;}return result;}
 return{run,rules,get state(){return state;},get actor(){return state.roster[0]!;},get revision(){return revision;}};
}
test('all six rarity fusions consume exactly3/create1 with authored floor14/16/19/23/28/35 and no fee or slot mutation',()=>{
 const rarities=['common','uncommon','rare','epic','legendary','immortal','supreme']as const,expected=[14,16,19,23,28,35];
 for(let index=0;index<6;index++){const f=fixture();for(const id of['a','b','c'])f.state.inventory.push(gear(id,rarities[index]));const before=structuredClone(f.state),result=f.run('equipment.fuse',{instance_ids:['a','b','c']});assert.equal(result.receipt.result.code,'EQUIPMENT_FUSED');assert.deepEqual(result.receipt.result.removed_instance_ids,['a','b','c']);assert.equal(result.receipt.result.created_instance_ids.length,1);assert.equal(f.state.inventory.length,43);const output=f.state.inventory.find(i=>i.instance_id===result.receipt.result.created_instance_ids[0])as Gear;assert.equal(output.rarity_id,rarities[index+1]);assert.equal(output.definition_id,'equipment_sword_1');assert.equal(resolvedEquipmentModifiers(output,content)[0]!.value,expected[index]);assert.deepEqual(f.state.wallet,before.wallet);assert.deepEqual(f.state.roster,before.roster);}
});
test('wrong tier/type, duplicate/missing IDs, equipped/locked/training and Supreme reject without losing any item or resources',()=>{
 const cases:[Gear[],string[],string][]=[
  [[gear('a'),gear('b'),gear('c','common','equipment_sword_20')],['a','b','c'],'FUSION_MISMATCH'],
  [[gear('a'),gear('b'),gear('c','common','equipment_bow_1')],['a','b','c'],'FUSION_MISMATCH'],
  [[gear('a'),gear('b'),{...gear('c'),locked:true}],['a','b','c'],'ITEM_LOCKED'],
  [[gear('a'),gear('b'),{...gear('c'),training:true}],['a','b','c'],'TRAINING_WEAPON_RESTRICTED'],
  [[gear('a'),gear('b')],['a','b','starter_main_weapon'],'ITEM_EQUIPPED'],
  [[gear('a','supreme'),gear('b','supreme'),gear('c','supreme')],['a','b','c'],'RARITY_MAX_REACHED'],
  [[gear('a'),gear('b')],['a','b','missing'],'ITEM_NOT_FOUND']
 ];
 for(const[items,ids,code]of cases){const f=fixture();f.state.inventory.push(...items);const before=structuredClone(f.state);assert.equal(f.run('equipment.fuse',{instance_ids:ids}).receipt.result.code,code);assert.deepEqual(f.state,before,code);assert.equal(f.revision,1);}
 const f=fixture();f.state.inventory.push(gear('a'));assert.throws(()=>f.run('equipment.fuse',{instance_ids:['a','a','a']}));
});
test('Tier1→20→40→60 preserves exact ID/rarity/lock/refine/enchant/cards and costs26000gold/170ore, equipment sources increase only base',()=>{
 const f=fixture();f.actor.level=60;f.actor.local_cap=80;f.actor.completed_gate_ids=[20,40,60];f.actor.unspent_status_points=519;f.state.inventory.push({...gear('invested','epic'),locked:true},{kind:'card',instance_id:'card',definition_id:'card_weapon_1',rarity_id:'gold',level:5,locked:false});f.actor.equipment.weapon='invested';f.actor.slot_progress.weapon={refine:10,refine_failures:0,enchant:{line_id:'offense',level:2},cards:['card',null,null]};const progress=structuredClone(f.actor.slot_progress),before=structuredClone(f.state.wallet),attack=equipmentStats(f.state,'main').stats.physical_attack;
 for(const target of[20,40,60]){const preview=gearGrowthOptions(f.state,'main','invested').tier!;assert.equal(preview.definition.tier_level,target);f.run('equipment.tier_up',{item_instance_id:'invested',target_tier:target});assert.deepEqual(equipmentStats(f.state,'main'),preview.after);}
 const final=f.state.inventory.find(i=>i.instance_id==='invested')as Gear;assert.equal(final.definition_id,'equipment_sword_60');assert.equal(final.rarity_id,'epic');assert.equal(final.locked,true);assert.equal(f.actor.equipment.weapon,'invested');assert.deepEqual(f.actor.slot_progress,progress);assert.equal(before.gold-f.state.wallet.gold,26000);assert.equal(before.refine_ore-f.state.wallet.refine_ore,170);assert.equal(equipmentStats(f.state,'main').stats.physical_attack-attack,266*(1+.42+.30+.03));assert.equal(f.state.paid_ledger.length,0);
});
test('equipped level gate/training/jump/downward tier fail; unequipped upgrade is allowed but cannot bypass equip requirement',()=>{
 const f=fixture(),before=structuredClone(f.state);assert.equal(f.run('equipment.tier_up',{item_instance_id:'starter_main_weapon',target_tier:20}).receipt.result.code,'ITEM_LEVEL_REQUIRED');assert.deepEqual(f.state,before);assert.equal(f.run('equipment.tier_up',{item_instance_id:'starter_main_weapon',target_tier:40}).receipt.result.code,'INVALID_TIER_STEP');
 f.run('equipment.unequip',{character_id:'main',slot:'weapon'});assert.equal(f.run('equipment.tier_up',{item_instance_id:'starter_main_weapon',target_tier:20}).receipt.outcome,'committed');assert.equal(f.run('equipment.equip',{character_id:'main',slot:'weapon',item_instance_id:'starter_main_weapon'}).receipt.result.code,'ITEM_LEVEL_REQUIRED');
 const bought=f.run('equipment.purchase_weapon',{character_id:'main',weapon_type:'sword',tier_level:1}),id=bought.receipt.result.created_instance_ids[0]!;assert.equal(f.run('equipment.tier_up',{item_instance_id:id,target_tier:20}).receipt.result.code,'TRAINING_WEAPON_RESTRICTED');
});
test('500-item bag may fuse to free two spaces, leaves pending fixed reward untouched, then pays the exact original instance once',()=>{
 const f=fixture();for(let i=42;i<500;i++)f.state.inventory.push(gear(`bag_${i}`));const vector={...Object.fromEntries(Object.keys(f.state.wallet).map(k=>[k,0]))}as AccountState['wallet'];f.state.pending_rewards.push({claim_id:'fixed',kind:'farm',items:[gear('fixed_drop')],resource_vector:vector,content_version:content.manifest.content_version,reserved_at:at,source_keys:['probe'],status:'pending'});
 const pending=structuredClone(f.state.pending_rewards);f.run('equipment.fuse',{instance_ids:['bag_42','bag_43','bag_44']});assert.equal(f.state.inventory.length,498);assert.deepEqual(f.state.pending_rewards,pending);f.run('reward.claim',{claim_id:'fixed'});assert.equal(f.state.inventory.length,499);assert.equal(f.state.inventory.filter(i=>i.instance_id==='fixed_drop').length,1);
});
test('poor-wallet preview does not mutate account; actual insufficient funds and active-battle upgrades do not change build fingerprint',()=>{
 const f=fixture();f.actor.level=20;f.actor.unspent_status_points=91;f.state.wallet.gold=0;f.state.wallet.refine_ore=0;const state=structuredClone(f.state),key=f.rules.canonical(f.rules.buildInputs(f.state));const preview=gearGrowthOptions(f.state,'main','starter_main_weapon');assert.ok(preview.tier);assert.ok(preview.tier!.after!.stats.physical_attack>preview.tier!.before.stats.physical_attack);assert.deepEqual(f.state,state);assert.equal(f.run('equipment.tier_up',{item_instance_id:'starter_main_weapon',target_tier:20}).receipt.result.code,'INSUFFICIENT_RESOURCES');assert.equal(f.rules.canonical(f.rules.buildInputs(f.state)),key);
 f.state.active_battle={battle_id:'33333333-3333-4333-8333-333333333333',mode:'story',mode_ref:'1-1',ticket_day:null,started_at:at,last_ack_at:at,lease_expires_at:'2026-10-20T00:00:15.000Z',content_hash:content.manifest.content_hash,content_version:content.manifest.content_version,rules_version:content.manifest.rules_version};assert.equal(f.run('equipment.tier_up',{item_instance_id:'starter_main_weapon',target_tier:20}).receipt.result.code,'BUILD_LOCKED_DURING_BATTLE');assert.equal(f.run('equipment.fuse',{instance_ids:['x','y','z']}).receipt.result.code,'BUILD_LOCKED_DURING_BATTLE');
});
