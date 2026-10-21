import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, SkillDefinition } from '../../src/contracts/index.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { applySkillCommand, characterSkillCap, compileCharacterSkills, skillQuote, type SkillCommand } from '../../src/domain/progression/skills.ts';
import { applyRosterCommand } from '../../src/domain/progression/characters.ts';
import { characterBlueprint, previewCharacterStats } from '../../src/domain/build/character.ts';
import { castDurationMs, resolveStats, skillIntervalMs } from '../../src/domain/math/index.ts';
import { content, actor, battle, step } from './combat-fixtures.ts';
import { equipStarterSet } from './gear-fixtures.ts';
const at='2026-10-20T00:00:00.000Z',versions={content_hash:content.manifest.content_hash,content_version:content.manifest.content_version,rules_version:content.manifest.rules_version};
function fixture(root:AccountState['roster'][number]['root_job_id']='swordsman',level=1){const state=equipStarterSet(initializeAccount(content,{root_job_id:root,gender:'male'},at,'2026-10-20',1)),selected=state.roster[0];selected.level=level;selected.unspent_status_points=Array.from({length:level-1},(_,i)=>3+Math.floor((i+2)/5)).reduce((a,b)=>a+b,0);selected.completed_gate_ids=level>60?[20,40,60]:level>40?[20,40]:level>20?[20]:[];selected.local_cap=level>60?80:level>40?60:level>20?40:20;let n=0;const run=(params:SkillCommand['params'],type:SkillCommand['type']='skill.upgrade')=>applySkillCommand(state,{type,params,request_id:`11111111-1111-4111-8111-${String(++n).padStart(12,'0')}`,expected_revision:n,schema_version:1,...versions}as SkillCommand,content);return{state,selected,run};}
test('skill unlock/cap and selected branch are enforced before spending; level unlock never auto-learns',()=>{
 const f=fixture();const before=structuredClone(f.state);assert.throws(()=>f.run({character_id:'main',skill_id:'swordsman_bash',target_level:2}),/SKILL_CAP_REACHED/);assert.throws(()=>f.run({character_id:'main',skill_id:'swordsman_magnum_break',target_level:1}),/SKILL_LOCKED/);assert.throws(()=>f.run({character_id:'main',skill_id:'mage_fire_bolt',target_level:1}),/SKILL_UNAVAILABLE/);assert.deepEqual(f.state,before);
 f.selected.level=10;f.selected.unspent_status_points=34;assert.equal(f.selected.skill_levels.swordsman_sword_mastery,undefined);f.run({character_id:'main',skill_id:'swordsman_sword_mastery',target_level:1});assert.equal(f.selected.skill_levels.swordsman_sword_mastery,1);assert.equal(f.state.wallet.gold,1000);assert.equal(f.state.paid_ledger.at(-1)!.paid_resources.gold,0);
});
test('upgrade prices come from tables; reset refunds exact purchased vector once and root grants remain free',()=>{
 const f=fixture('mage',6);assert.deepEqual(skillQuote(f.selected,'mage_fire_bolt',2,content),{gold:50,skill_manual:10});f.run({character_id:'main',skill_id:'mage_fire_bolt',target_level:2});assert.equal(f.state.wallet.gold,950);assert.equal(f.state.wallet.skill_manual,70);assert.equal(f.state.paid_ledger[0]!.feature_id,'skill');assert.throws(()=>f.run({character_id:'main',skill_id:'mage_fire_bolt',target_level:2}),/SKILL_LEVEL_UNCHANGED/);
 const reset={type:'character.reset_build',params:{character_id:'main',features:['skills']},request_id:'22222222-2222-4222-8222-222222222222',expected_revision:1,schema_version:1,...versions}as const;applyRosterCommand(f.state,reset as never,content);assert.equal(f.state.wallet.gold,1000);assert.equal(f.state.wallet.skill_manual,80);assert.equal(f.selected.skill_levels.mage_fire_bolt,1);applyRosterCommand(f.state,{...reset,request_id:'33333333-3333-4333-8333-333333333333'} as never,content);assert.equal(f.state.wallet.gold,1000);
});
test('all126 player skill definitions have valid owning-class learn/upgrade quotes through their max without mutating shared content',()=>{
 let count=0;const original=JSON.stringify(content.skills);
 for(const root of ['swordsman','acolyte','archer','mage','thief','merchant']as const){const doc=content.documents[`skills/${root}.json`]!;for(const definition of doc.skills as unknown as SkillDefinition[]){const f=fixture(root,70);f.selected.job_id=definition.class_id as typeof f.selected.job_id;f.state.wallet.gold=1e7;f.state.wallet.skill_manual=1e7;const cap=characterSkillCap(f.selected,definition),cost=skillQuote(f.selected,definition.id,cap,content);f.run({character_id:'main',skill_id:definition.id,target_level:cap});assert.equal(f.selected.skill_levels[definition.id],cap);assert.equal(f.state.wallet.gold,1e7-(cost.gold??0));assert.equal(f.state.wallet.skill_manual,1e7-(cost.skill_manual??0));count++;}}
 assert.equal(count,126);assert.equal(JSON.stringify(content.skills),original);
});
test('four ordered active slots reject duplicate/unlearned/passive IDs; learned Passives enter engine automatically and change actual damage stats',()=>{
 const f=fixture('swordsman',10);f.run({character_id:'main',skill_id:'swordsman_sword_mastery',target_level:1});f.run({character_id:'main',skill_id:'swordsman_magnum_break',target_level:1});
 const previous=structuredClone(f.selected.active_slots);assert.throws(()=>f.run({character_id:'main',skill_ids:['swordsman_bash','swordsman_bash',null,null]},'skill.set_loadout'),/DUPLICATE_SKILL_SLOT/);assert.throws(()=>f.run({character_id:'main',skill_ids:['swordsman_sword_mastery',null,null,null]},'skill.set_loadout'),/SKILL_NOT_LEARNED_ACTIVE/);assert.deepEqual(f.selected.active_slots,previous);
 f.run({character_id:'main',skill_ids:['swordsman_magnum_break',null,'swordsman_bash','swordsman_provoke']},'skill.set_loadout');const compiled=compileCharacterSkills(f.selected,content),input={...actor('main','player'),...compiled,stat_blueprint:characterBlueprint(f.selected,content)};const state=battle([input,actor('foe','enemy')]);const player=state.actors.find(a=>a.actor_id==='main')!;assert.ok(player.stats.physical_attack>resolveStats(characterBlueprint(f.selected,content),content).physical_attack);assert.deepEqual(player.stats,previewCharacterStats(f.selected,compiled.resolved_skills,content));assert.ok(player.resolved_skills.swordsman_sword_mastery);assert.equal(player.active_slots.includes('swordsman_sword_mastery'),false);
 const casts=step(state,10000).events.filter(e=>e.type==='cast_start'&&e.actor_id==='main');assert.deepEqual(casts.slice(0,3).map(e=>e.skill_id),['swordsman_magnum_break','swordsman_bash','swordsman_provoke']);
});
test('preview timing uses shared math and learned Passive speed, empty loadout stays normal-only; active battle rejects upgrade',()=>{
 const f=fixture('mage',10),compiled=compileCharacterSkills(f.selected,content),stats=previewCharacterStats(f.selected,compiled.resolved_skills,content);const fire=compiled.resolved_skills.mage_fire_bolt!.definition;assert.equal(fire.kind,'active');if(fire.kind!=='active')throw new Error('fixture');const input={...actor('main','player'),...compiled,stat_blueprint:characterBlueprint(f.selected,content)};const state=battle([input,actor('foe','enemy')]);const cast=step(state,3000).events.find(e=>e.type==='cast_start'&&e.actor_id==='main')!;assert.equal(cast.at_ms,skillIntervalMs(stats.attack_speed));assert.equal(cast.cast_duration_ms,castDurationMs(Number(fire.timing.cast_ms),stats.cast_speed));
 f.run({character_id:'main',skill_ids:[null,null,null,null]},'skill.set_loadout');const empty=battle([{...input,...compileCharacterSkills(f.selected,content)},actor('foe','enemy')]);assert.equal(empty.actors.find(a=>a.actor_id==='main')!.action_phase,'normal_only');
 f.state.active_battle={battle_id:'x',mode:'story',mode_ref:'1-1',ticket_day:null,started_at:at,last_ack_at:at,lease_expires_at:at,...versions};const old=structuredClone(f.state);assert.throws(()=>f.run({character_id:'main',skill_id:'mage_fire_bolt',target_level:2}),/BUILD_LOCKED_DURING_BATTLE/);assert.deepEqual(f.state,old);
});
test('all class previews resolve human-readable deltas without NaN or hidden cap bypasses',async()=>{
 const {characterSkillOptions}=await import('../../src/client/skills.ts');
 const mage=fixture('mage',6);assert.equal(characterSkillOptions(mage.selected).skills.find(s=>s.id==='mage_fire_bolt')!.targetNote,'ศัตรู · เป้าหมายเดียว');
 const intervals:Record<string,number>={};for(const root of ['swordsman','acolyte','archer','mage','thief','merchant']as const){const doc=content.documents['progression.json']!.class_tree as unknown as Record<string,string[]>;for(const job of [root,...doc[root]!]){const f=fixture(root,70);f.selected.job_id=job as typeof f.selected.job_id;const view=characterSkillOptions(f.selected);assert.ok(view.skills.length>=5);assert.ok(view.skills.every(s=>!JSON.stringify(s.effects).includes('NaN')));assert.ok(view.intervalMs<3000,`${job} ${view.intervalMs}`);intervals[root]=view.intervalMs;}}
 assert.equal(new Set(Object.values(intervals)).size,6,'D-061 job bonus staggers every Class 1 tree');
});
test('exclusive copy groups are enforced by catalog metadata instead of permitting two differently named copies',()=>{
 const f=fixture('thief',70);f.selected.job_id='rogue';const ids=['rogue_copy_swordsman_bash','rogue_copy_mage_fire_bolt'];for(const id of ids)f.run({character_id:'main',skill_id:id,target_level:1});const before=structuredClone(f.selected.active_slots);assert.throws(()=>f.run({character_id:'main',skill_ids:[...ids,null,null]as never},'skill.set_loadout'),/EXCLUSIVE_SKILL_GROUP/);assert.deepEqual(f.selected.active_slots,before);
});

test('skill-first equip (user, 21 Oct 2026): a new skill replaces the slot, a moved skill swaps with the occupant, remove empties only its slot', async () => {
  const { placeSkill, removeSkill } = await import('../../src/client/skills.ts');
  const slots: [string | null, string | null, string | null, string | null] = ['bash', 'provoke', null, 'magnum'];
  assert.deepEqual(placeSkill(slots, 'endure', 1), ['bash', 'endure', null, 'magnum'], 'new skill replaces');
  assert.deepEqual(placeSkill(slots, 'provoke', 2), ['bash', null, 'provoke', 'magnum'], 'move into an empty slot');
  assert.deepEqual(placeSkill(slots, 'magnum', 0), ['magnum', 'provoke', null, 'bash'], 'move onto an occupied slot swaps');
  assert.deepEqual(placeSkill(slots, 'bash', 0), slots, 'same slot is a no-op');
  assert.deepEqual(removeSkill(slots, 'provoke'), ['bash', null, null, 'magnum']);
  assert.deepEqual(slots, ['bash', 'provoke', null, 'magnum'], 'input untouched');
});
