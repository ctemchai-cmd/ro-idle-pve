import test from 'node:test';
import assert from 'node:assert/strict';
import { SkillPreviewSession, previewJobs, previewSkills, previewSelection } from '../../src/client/skill-preview.ts';
import { restoreBattle, serializeBattle } from '../../src/domain/combat/index.ts';
import { content } from './combat-fixtures.ts';

test('D152 catalog covers19 actual jobs and126 logical skills, inherited trees and valid ranks/genders', () => {
 assert.equal(previewJobs.length,19);
 const ids=new Set<string>();
 for(const job of previewJobs){
  const skills=previewSkills(job.id);assert.ok(skills.length>=5);
  assert.ok(skills.every(s=>s.class_id===job.id||s.class_id===job.root));
  for(const s of skills)ids.add(s.id);
 }
 assert.equal(ids.size,126);
 assert.equal(previewSelection({job:'dancer',gender:'male'}).gender,'female');
 assert.equal(previewSelection({job:'monk',skill:'wizard_meteor',rank:NaN}).skill,'acolyte_heal');
 assert.deepEqual(previewSelection({job:'missing',rank:-Infinity}),previewSelection({}));
 assert.equal(previewSelection({job:'monk',skill:'monk_asura',rank:1000}).rank,10);
});
test('D152 all126 skills at ranks1/max run actual engine; active resolves and passive never fabricates its own cast',()=>{
 const seen=new Set<string>(),before=JSON.stringify(content.documents);
 for(const job of previewJobs)for(const skill of previewSkills(job.id))if(!seen.has(skill.id)){
  seen.add(skill.id);
  for(const rank of new Set([1,skill.max_level])){
   const session=new SkillPreviewSession({job:job.id,skill:skill.id,rank}),initial=serializeBattle(session.initial);
   assert.ok(restoreBattle(initial,content).ok,skill.id);
   assert.equal(session.selection.rank,rank);assert.equal(session.definition.id,skill.id);
   session.advanceTo(10000);
   if(skill.kind==='active')assert.ok(session.history.some(e=>e.type==='cast_resolve'&&e.skill_id===skill.id),skill.id+'@'+rank);
   else assert.ok(!session.history.some(e=>e.type==='cast_start'&&e.skill_id===skill.id),skill.id);
   assert.deepEqual(serializeBattle(session.initial),initial,'initial immutable '+skill.id);
   assert.ok(restoreBattle(serializeBattle(session.state),content).ok,skill.id);
  }
 }
 assert.equal(seen.size,126);assert.equal(JSON.stringify(content.documents),before,'catalog is never changed by a preview');
});
test('D152 previews real heal, timed healing, buff, summon, sphere cost and interrupt outcomes',()=>{
 for(const [job,skill,event]of [['acolyte','acolyte_heal','heal'],['bard','bard_healing_song','heal'],['acolyte','acolyte_blessing','status_applied'],['alchemist','alchemist_hell_plant','summon'],['monk','monk_call_spirits','resource_change'],['monk','monk_asura','damage'],['sage','sage_spell_breaker','cast_interrupt']]as const){
  const session=new SkillPreviewSession({job,skill,rank:10});session.advanceTo(10000);
  assert.ok(session.history.some(e=>e.type===event&&(event==='cast_interrupt'||e.actor_id==='caster'||event==='summon'&&e.skill_id===skill)),skill+' '+event);
  if(skill==='monk_asura'){
   assert.equal(session.initial.actors.find(a=>a.actor_id==='caster')!.spirit_spheres,5);
   assert.equal(session.state.actors.find(a=>a.actor_id==='caster')!.spirit_spheres,0);
   assert.ok(session.state.metrics.actors.caster!.sp_spent>=1000);
  }
 }
});
test('D152 replay and1x2x4 use identical deterministic effects and timestamps',()=>{
 const run=(speed:number)=>{const session=new SkillPreviewSession({job:'wizard',skill:'wizard_storm_gust',rank:10});for(let t=50*speed;t<10000;t+=50*speed)session.advanceTo(t);session.advanceTo(10000);return{events:session.history,state:serializeBattle(session.state)};};
 assert.deepEqual(run(1),run(2));assert.deepEqual(run(1),run(4));
});
