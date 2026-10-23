import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogSkillInformation,skillCatalogJobs,skillCatalogCount,skillDefinitionsForJob,timelineSkillInformation } from '../../src/client/skill-catalog.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { createBattle,serializeBattle } from '../../src/domain/combat/index.ts';
import type { ActorInput } from '../../src/domain/combat/index.ts';
import type { SkillDefinition } from '../../src/contracts/index.ts';
import { actor,content,unwrap,type Active } from './combat-fixtures.ts';

test('D153 catalog covers19 jobs/126 skills, inherited/passive/copy/unlearned without enemies and descriptions follow every real rank',()=>{
 const before=JSON.stringify(content.documents),seen=new Set<string>();assert.equal(skillCatalogJobs.length,32);assert.equal(skillCatalogCount,152);
 for(const job of skillCatalogJobs){
  const rows=skillDefinitionsForJob(job.id);assert.ok(rows.length>=5);
  assert.ok(rows.every(s=>content.jobs.byId[job.id]!.ancestors.includes(s.class_id)));
  assert.equal(new Set(rows.map(s=>s.id)).size,rows.length);
  for(const row of rows)if(!seen.has(row.id)){
   seen.add(row.id);
   for(let rank=1;rank<=row.max_level;rank++){
    const info=catalogSkillInformation(row.id,rank)!;assert.equal(info.level,rank);assert.equal(info.name.includes('_'),false,row.id);
    assert.deepEqual(info.definition,resolveSkill(row.id,rank,content).definition,row.id+'@'+rank);
    assert.ok(info.effects.length>0,row.id);assert.ok(info.targetNote.length>0);
   }
  }
 }
 assert.equal(seen.size,152);assert.ok(seen.has('rogue_copy_swordsman_bash'));
 assert.equal(catalogSkillInformation('enemy_bite',1),null);assert.equal(catalogSkillInformation('unknown',1),null);
 assert.deepEqual(skillDefinitionsForJob('unknown'),[]);
 assert.equal(catalogSkillInformation('monk_call_spirits',NaN)!.level,1);
 assert.equal(catalogSkillInformation('monk_call_spirits',100)!.level,10);
 assert.equal(JSON.stringify(content.documents),before);
});

test('D153 Timeline reads the actor snapshot rank and exact patched program, including copied skills and enemy borrowed programs',()=>{
 const make=(id:string,level:number,team:'player'|'enemy'):ActorInput=>{
  const resolved=structuredClone(resolveSkill(id,level,content));
  return{...actor(team,team,[resolved.definition as unknown as Active]),resolved_skills:{[id]:resolved} as ActorInput['resolved_skills']};
 };
 for(const[id,level,team]of[['monk_finger_offensive',7,'player'],['rogue_copy_swordsman_bash',6,'player'],['enemy_holy_cross',1,'enemy']]as const){
  const own=make(id,level,team),definition=own.resolved_skills[id]!.definition as Active;
  const damage=definition.effects.find(e=>e.type==='damage')!;if(damage.type!=='damage')throw Error('fixture');
  damage.formula={id:'physical_power',params:{attack_ratio:9.875,flat_power:0}};
  const initial=unwrap(createBattle({actors:[own,actor('other',team==='player'?'enemy':'player')],mode:{kind:'story',ref:'catalog',time_limit_ms:40000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,17));
  const scene={title:'test',subtitle:'test',background_meta:'unused',music_meta:'unused',actors:[],skill_labels:{[id]:'Actual skill'},enemy_recipes:{}};
  let simulations=0;const session={initial,scene,timeline(){simulations++;throw Error('must not simulate');}};
  const before=serializeBattle(initial),info=timelineSkillInformation(session,team,id)!;
  assert.equal(info.level,level);assert.equal(info.name,'Actual skill');assert.ok(info.effects.some(e=>e.includes('987.5%')),id);
  assert.deepEqual(info.definition,definition);assert.equal(simulations,0);assert.deepEqual(serializeBattle(initial),before);
  assert.equal(timelineSkillInformation(session,'missing',id),null);assert.equal(timelineSkillInformation(session,team,'missing'),null);
 }
});

test('D153 concise descriptions retain Call Spirit rank effects, Provoke target rules and passive modifiers',()=>{
 const sphere1=catalogSkillInformation('monk_call_spirits',1)!,sphere5=catalogSkillInformation('monk_call_spirits',5)!,sphere10=catalogSkillInformation('monk_call_spirits',10)!;
 assert.ok(sphere1.effects.join().includes('+1 ลูก'));assert.ok(sphere5.effects.join().includes('+5 ลูก'));
 assert.ok(sphere5.effects.join().includes('1%'));assert.ok(sphere10.effects.join().includes('2%'));
 const provoke=catalogSkillInformation('swordsman_provoke',10)!;assert.ok(provoke.notes.some(n=>n.includes('ผู้ยั่วยุ')));
 const passive=catalogSkillInformation('monk_iron_fist',7)!;assert.equal((passive.definition as SkillDefinition).kind,'passive');assert.equal(passive.targetNote,'ทำงานอัตโนมัติ');assert.ok(passive.effects.length>0);
});
