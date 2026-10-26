import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, Command, BattleActor } from '../../src/contracts/index.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { equipmentFit, validateInventory } from '../../src/domain/progression/equipment.ts';
import { equippedSources } from '../../src/domain/build/equipment.ts';
import { compileCharacterSkills } from '../../src/domain/progression/skills.ts';
import { storyParty, storyInput } from '../../src/domain/build/story.ts';
import { storyStage, storyBoss } from '../../src/domain/modes/story.ts';
import { createBattle } from '../../src/domain/combat/index.ts';
import { equipmentPreview, equipmentStats } from '../../src/client/equipment.ts';
import { characterSkillOptions } from '../../src/client/skills.ts';
import { content } from './combat-fixtures.ts';
import { jobBonus } from '../../src/domain/build/character.ts';
import { equipStarterSet } from './gear-fixtures.ts';
const at='2026-10-20T00:00:00.000Z';
function fixture(){
 const rules=new AccountCommandRules();let state=equipStarterSet(initializeAccount(content,{root_job_id:'swordsman',gender:'male'},at,'2026-10-20',1)),revision=1,serial=0;
 function run(type:Command['type'],params:unknown){const command={type,params,request_id:`22222222-2222-4222-8222-${String(++serial).padStart(12,'0')}`,expected_revision:revision,schema_version:1,...rules.versions}as Command;rules.parse(command);const result=rules.decide(command,state,null,{server_at:at,now_ms:Date.parse(at),farm_from_ms:Date.parse(at)}as CommandTime,'a'.repeat(64));if(result.receipt.outcome==='committed'){state=result.state;revision++;}return result;}
 return{run,get state(){return state;},get revision(){return revision;}};
}
function gear(id:string,definition='equipment_sword_1',rarity:'common'|'epic'='common'):AccountState['inventory'][number]{return{instance_id:id,definition_id:definition,kind:'equipment',rarity_id:rarity,locked:false,training:false,options:[]};}
function level60(actor:AccountState['roster'][number]){actor.level=60;actor.local_cap=80;actor.completed_gate_ids=[20,40,60];actor.unspent_status_points=519;}
test('six slots/job and level restrictions, moving one canonical item across main/off-team owner preserves both slot investments',()=>{
 const f=fixture(),before=structuredClone(f.state),slot=before.roster[0]!.slot_progress.weapon;
 f.state.roster[0]!.slot_progress.weapon.refine=3;f.state.roster.find(a=>a.character_id==='npc_swordsman')!.slot_progress.weapon.refine=7;
 const move=f.run('equipment.equip',{character_id:'main',slot:'weapon',item_instance_id:'starter_npc_swordsman_weapon'});assert.equal(move.receipt.result.code,'EQUIPMENT_ASSIGNED');assert.equal(f.state.inventory.length,42);assert.equal(f.state.roster[0]!.equipment.weapon,'starter_npc_swordsman_weapon');assert.equal(f.state.roster.find(a=>a.character_id==='npc_swordsman')!.equipment.weapon,null);assert.equal(f.state.roster[0]!.slot_progress.weapon.refine,3);assert.equal(f.state.roster.find(a=>a.character_id==='npc_swordsman')!.slot_progress.weapon.refine,7);assert.equal(slot.refine,0);
 const unchanged=structuredClone(f.state);assert.equal(f.run('equipment.equip',{character_id:'main',slot:'weapon',item_instance_id:'starter_npc_archer_weapon'}).receipt.result.code,'WEAPON_INCOMPATIBLE');assert.deepEqual(f.state,unchanged);assert.equal(f.run('equipment.equip',{character_id:'main',slot:'head',item_instance_id:'starter_npc_archer_weapon'}).receipt.result.code,'ITEM_SLOT_MISMATCH');
 f.state.inventory.push(gear('high','equipment_sword_20'));assert.equal(f.run('equipment.equip',{character_id:'main',slot:'weapon',item_instance_id:'high'}).receipt.result.code,'ITEM_LEVEL_REQUIRED');
 for(const slot of ['head','armor','garment','shoes','accessory'])assert.equal(f.run('equipment.equip',{character_id:'main',slot,item_instance_id:`starter_npc_thief_${slot}`}).receipt.result.code,'EQUIPMENT_ASSIGNED');
});
test('all19 jobs use authored weapon compatibility; all equipment rarity/type definitions fit shared compiler without implicit stat growth',()=>{
 const f=fixture(),actor=f.state.roster[0]!,data=content.documents['equipment.json']!.weapon_compatibility as unknown as Record<string,string>;
 for(const[job,weapon]of Object.entries(data)){const copy={...actor,job_id:job as typeof actor.job_id};assert.equal(equipmentFit(copy,'weapon',gear('probe',`equipment_${weapon}_1`),content),null,job);assert.equal(equipmentFit(copy,'weapon',gear('probe',`equipment_${weapon}_20`),content),'ITEM_LEVEL_REQUIRED');}
 assert.equal(content.jobs.order.length,32);assert.ok(content.jobs.order.every(job=>job in data));assert.equal(Object.keys(data).length,32); // 13 inactive Hi fits are prepared independently of admission.
});
test('rarity affects only item base; Refine/Enchant/card sources remain on each owner, sleep when empty, and preview exactly matches battle snapshot',()=>{
 const f=fixture(),actor=f.state.roster[0]!;level60(actor);const progress=actor.slot_progress.weapon;progress.refine=10;progress.enchant={line_id:'offense',level:2};progress.cards=['gold_card',null,null];
 f.state.inventory.push(gear('common60','equipment_sword_60'),gear('epic60','equipment_sword_60','epic'),{kind:'card',instance_id:'gold_card',definition_id:'card_weapon_1',rarity_id:'gold',level:5,locked:false});
 f.run('equipment.equip',{character_id:'main',slot:'weapon',item_instance_id:'common60'});
 const sources=equippedSources(f.state.roster[0]!,f.state,content),weaponSources=sources.filter(s=>['common60','slot_main_weapon_refine','slot_main_weapon_enchant','gold_card'].includes(s.source.instance_id));
 assert.equal(weaponSources.flatMap(s=>s.modifiers).filter(m=>m.stat==='physical_attack'&&m.op==='add_flat').reduce((n,m)=>n+Number(m.value),0),300); //190+80+30; D183 Wolf adds15.75%ATK at legacyGold Lv5.
 assert.ok(Math.abs(weaponSources.flatMap(s=>s.modifiers).filter(m=>m.stat==='physical_attack'&&m.op==='add_percent').reduce((n,m)=>n+Number(m.value),0)-.4875)<1e-9);
 const original=structuredClone(f.state.roster[0]!.slot_progress),preview=equipmentPreview(f.state,'main','weapon','epic60');assert.ok(Math.abs(preview.after.stats.physical_attack-preview.before.stats.physical_attack-141.3125)<1e-8);f.run('equipment.equip',{character_id:'main',slot:'weapon',item_instance_id:'epic60'});assert.deepEqual(f.state.roster[0]!.slot_progress,original);assert.deepEqual(equipmentStats(f.state,'main'),preview.after); //95 extra base ATK ×(1+15.75%Wolf+30%Refine+3%Enchant).
 const compiled=Object.fromEntries(f.state.team.map(p=>[p.character_id,compileCharacterSkills(f.state.roster.find(a=>a.character_id===p.character_id)!,content)])),hashes=Object.fromEntries(f.state.team.map(p=>[p.character_id,'a'.repeat(64)])),stage=storyStage('1-1',content)!;
 const battle=createBattle(storyInput(stage,storyBoss(stage),storyParty(f.state,content,compiled as Record<string,Pick<BattleActor,'active_slots'|'resolved_skills'>>,hashes),content),content,1);assert.ok(battle.ok);if(battle.ok)assert.deepEqual(battle.value.actors.find(a=>a.actor_id==='main')!.stats,preview.after.stats);
 f.run('equipment.unequip',{character_id:'main',slot:'weapon'});assert.deepEqual(f.state.roster[0]!.slot_progress,original);assert.ok(equippedSources(f.state.roster[0]!,f.state,content).every(s=>!s.source.instance_id.includes('weapon')&&s.source.instance_id!=='gold_card'));
 f.run('equipment.equip',{character_id:'main',slot:'weapon',item_instance_id:'epic60'});assert.deepEqual(equipmentStats(f.state,'main'),preview.after);
});
test('500-item bag keeps pending reward fixed; equip/unlock/salvage still work and protected batch rejects atomically',()=>{
 const f=fixture();for(let i=f.state.inventory.length;i<500;i++)f.state.inventory.push(gear(`bag_${i}`));
 const vector=Object.fromEntries(Object.keys(f.state.wallet).map(k=>[k,0]))as AccountState['wallet'];vector.gold=500;
 f.state.pending_rewards.push({claim_id:'pending_probe',kind:'farm',resource_vector:vector,items:[gear('fixed_drop')],content_version:content.manifest.content_version,reserved_at:at,source_keys:['probe'],status:'pending'});
 const frozen=structuredClone(f.state);assert.equal(f.run('reward.claim',{claim_id:'pending_probe'}).receipt.result.code,'INVENTORY_FULL');assert.deepEqual(f.state,frozen);assert.equal(f.run('equipment.purchase_weapon',{character_id:'main',weapon_type:'sword',tier_level:1}).receipt.result.code,'INVENTORY_FULL');
 assert.equal(f.run('equipment.equip',{character_id:'main',slot:'weapon',item_instance_id:'bag_42'}).receipt.outcome,'committed');assert.equal(f.run('equipment.unequip',{character_id:'main',slot:'weapon'}).receipt.outcome,'committed');f.run('equipment.lock',{item_instance_id:'bag_43',locked:true});const before=structuredClone(f.state),revision=f.revision;
 assert.equal(f.run('equipment.salvage',{instance_ids:['bag_42','bag_43']}).receipt.result.code,'ITEM_LOCKED');assert.deepEqual(f.state,before);assert.equal(f.revision,revision);assert.equal(f.run('equipment.salvage',{instance_ids:['starter_npc_archer_weapon']}).receipt.result.code,'ITEM_EQUIPPED');assert.throws(()=>f.run('equipment.salvage',{instance_ids:['bag_42','bag_42']}));
 const result=f.run('equipment.salvage',{instance_ids:['bag_42']});assert.deepEqual(result.receipt.result.removed_instance_ids,['bag_42']);assert.equal(result.receipt.result.resource_delta.gold,10);assert.equal(result.receipt.result.resource_delta.refine_ore,1);assert.equal(f.state.inventory.length,499);assert.deepEqual(f.state.pending_rewards,frozen.pending_rewards);
 assert.equal(f.run('reward.claim',{claim_id:'pending_probe'}).receipt.outcome,'committed');assert.equal(f.state.inventory.length,500);assert.equal(f.state.inventory.filter(i=>i.instance_id==='fixed_drop').length,1);assert.equal(f.run('reward.claim',{claim_id:'pending_probe'}).receipt.result.code,'CLAIM_NOT_FOUND');
});
test('training weapon costs125 once per command, is a distinct unequipped instance, discard yields zero and cannot buy incompatible type',()=>{
 const f=fixture();assert.equal(f.run('equipment.purchase_weapon',{character_id:'main',weapon_type:'book',tier_level:1}).receipt.result.code,'WEAPON_INCOMPATIBLE');
 const bought=f.run('equipment.purchase_weapon',{character_id:'main',weapon_type:'sword',tier_level:1}),id=bought.receipt.result.created_instance_ids[0]!;assert.equal(f.state.wallet.gold,875);assert.equal(f.state.inventory.length,43);assert.equal(f.state.inventory.find(i=>i.instance_id===id)!.kind,'equipment');assert.equal(f.state.roster[0]!.equipment.weapon,'starter_main_weapon');
 f.run('equipment.equip',{character_id:'main',slot:'weapon',item_instance_id:id});f.run('equipment.unequip',{character_id:'main',slot:'weapon'});const before=structuredClone(f.state.wallet);const discarded=f.run('equipment.salvage',{instance_ids:[id]});assert.deepEqual(f.state.wallet,before);assert.deepEqual(discarded.receipt.result.removed_instance_ids,[id]);
});
test('semantic validation rejects duplicate owners/definitions/card slots and all equipment commands lock during live battle',()=>{
 const f=fixture(),bad=structuredClone(f.state);bad.roster[1]!.equipment.weapon='starter_main_weapon';assert.throws(()=>validateInventory(bad,content),/DUPLICATE_ITEM_ASSIGNMENT/);bad.roster[1]!.equipment.weapon='starter_npc_swordsman_weapon';bad.inventory[0]!.definition_id='unknown';assert.throws(()=>validateInventory(bad,content),/INVALID_ITEM_DEFINITION/);
 const cards=structuredClone(f.state);cards.inventory.push({kind:'card',instance_id:'c',definition_id:'card_weapon_1',rarity_id:'bronze',level:1,locked:false});cards.roster[0]!.slot_progress.weapon.cards[1]='c';assert.throws(()=>validateInventory(cards,content),/INVALID_CARD_ASSIGNMENT/);
 f.state.active_battle={battle_id:'33333333-3333-4333-8333-333333333333',mode:'story',mode_ref:'1-1',ticket_day:null,started_at:at,last_ack_at:at,lease_expires_at:'2026-10-20T00:00:15.000Z',content_hash:content.manifest.content_hash,content_version:content.manifest.content_version,rules_version:content.manifest.rules_version};
 for(const[type,params]of[['equipment.unequip',{character_id:'main',slot:'weapon'}],['equipment.lock',{item_instance_id:'starter_main_weapon',locked:true}],['equipment.purchase_weapon',{character_id:'main',weapon_type:'sword',tier_level:1}]]as const)assert.equal(f.run(type,params).receipt.result.code,'BUILD_LOCKED_DURING_BATTLE');
});
test('equipment precision enters primary DEX once and skill CT/ACD preview shares that exact cast speed',()=>{
 const f=fixture(),actor=f.state.roster.find(a=>a.character_id==='npc_mage')!;actor.slot_progress.weapon.enchant={line_id:'precision',level:10};const saved=structuredClone(actor.primary_stats),resolved=equipmentStats(f.state,actor.character_id),options=characterSkillOptions(actor,f.state);assert.equal(resolved.stats.dex,actor.primary_stats.dex+jobBonus(actor,content).dex+10);assert.equal(options.intervalMs,resolved.intervalMs);const fire=options.skills.find(s=>s.id==='mage_fire_bolt')!,cast=resolved.casts.find(s=>s.id==='mage_fire_bolt')!;assert.equal(fire.castMs,cast.ct);assert.equal(fire.afterCastMs,cast.acd);assert.deepEqual(actor.primary_stats,saved);
});
