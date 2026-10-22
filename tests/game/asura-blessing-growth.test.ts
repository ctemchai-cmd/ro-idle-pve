// Narrow deterministic rule regressions; no balance/calibration batch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { rawPower } from '../../src/domain/math/index.ts';
import { recomputeStats } from '../../src/domain/combat/status.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { characterSkillOptions, skillLevelComparison } from '../../src/client/skills.ts';
import { actor, battle, checkpoint, content, step, type Active } from './combat-fixtures.ts';
const resolve=(id:string,level:number)=>structuredClone(resolveSkill(id,level,content).definition)as Active;
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const oldSp=[2.75625,3.018751,3.281249,3.54375,3.806251,4.068749,4.33125,4.593751,4.856249,5.11875];
const oldAttack=[5.90625,6.34375,6.781249,7.218749,7.656248,8.093752,8.531251,8.968751,9.40625,9.84375];
test('Asura all ten ranks: unchanged ATK plus fourfold SP term, zero/low/high SP never compounded',()=>{
 const stats={...battle().actors[0]!.stats,physical_attack:100};
 for(let level=1;level<=10;level++){
  const s=resolve('monk_asura',level),hit=s.effects[0]!;assert.equal(hit.type,'damage');if(hit.type!=='damage'||hit.formula.id!=='sp_burst_power')throw Error('FORMULA');
  close(Number(hit.formula.params.attack_ratio),oldAttack[level-1]!);close(Number(hit.formula.params.sp_ratio),oldSp[level-1]!*4);
  for(const sp of[0,30,100,200,500,1000])close(rawPower(hit.formula,stats,sp),100*oldAttack[level-1]!+sp*oldSp[level-1]!*4);
  assert.deepEqual(s.cost,{sp:{mode:'all_current',minimum_sp:30},spirit_spheres:5});
 }
});
test('actual Asura pays all current SP and five spheres before offense snapshot, then deals the stronger raw power once',()=>{
 const s=resolve('monk_asura',10),source=actor('monk','player',[s]);source.stat_blueprint.derived_offsets.max_sp=1000;
 const initial=checkpoint(battle([source,actor('boss','enemy')])),monk=initial.actors.find(a=>a.actor_id==='monk')!;monk.sp=500;monk.spirit_spheres=5;recomputeStats(monk,content);
 const started=step(initial,1500).state.actors.find(a=>a.actor_id==='monk')!,cast=started.cast!;assert.ok(cast);assert.equal(started.sp,0);assert.equal(started.spirit_spheres,0);assert.ok(cast.pre_cost.sp>=500);
 const result=step(initial,2800),hits=result.events.filter(e=>e.type==='damage'&&e.skill_id==='monk_asura');assert.equal(hits.length,1);
 close(hits[0]!.raw!,cast.offense_snapshot.physical_attack*9.84375+cast.pre_cost.sp*20.475);
});
test('Blessing ranks1/5/10 last5.5/7.5/10s on both modifiers and expire at the exact boundary',()=>{
 for(const level of[1,5,10]){
  const s=resolve('acolyte_blessing',level),duration=5000+level*500;
  assert.deepEqual(s.cost,{sp:24,spirit_spheres:0});assert.deepEqual(s.timing,{cast_ms:450,after_cast_ms:800,interruptible:true});
  const initial=battle([actor('support','player',[s]),actor('boss','enemy')]),resolved=checkpoint(step(initial,1950).state),source=resolved.actors.find(a=>a.actor_id==='support')!;
  assert.equal(source.statuses.length,2);for(const status of source.statuses)assert.equal(status.expires_at-status.applied_at,duration);
  const expiry=source.statuses[0]!.expires_at;source.active_slots=[null,null,null,null];
  assert.equal(step(resolved,expiry-1).state.actors.find(a=>a.actor_id==='support')!.statuses.length,2);assert.equal(step(resolved,expiry).state.actors.find(a=>a.actor_id==='support')!.statuses.length,0);
 }
});
test('same caster Blessing recast adds independent instances; old stacks expire without deleting the newer pair',()=>{
 const s=resolve('acolyte_blessing',10),initial=battle([actor('support','player',[s]),actor('boss','enemy')]);
 const result=step(initial,5000),mutable=checkpoint(result.state),source=mutable.actors.find(a=>a.actor_id==='support')!;assert.equal(source.statuses.length,4);
 assert.equal(new Set(source.statuses.map(s=>s.instance_id)).size,4);const expiries=[...new Set(source.statuses.map(s=>s.expires_at))].sort((a,b)=>a-b);assert.equal(expiries.length,2);
 source.active_slots=[null,null,null,null];const later=step(mutable,expiries[0]!).state.actors.find(a=>a.actor_id==='support')!;assert.equal(later.statuses.length,2);assert.ok(later.statuses.every(s=>s.expires_at===expiries[1]));
});
test('skill level descriptions expose exact Asura SP growth and Blessing durations without UI-only balance values',()=>{
 const state=initializeAccount(content,{root_job_id:'acolyte',gender:'male'},'2026-10-22T00:00:00Z','2026-10-22',1),source=state.roster[0]!;source.job_id='monk';source.level=70;
 const skills=characterSkillOptions(source,state).skills,asura=skillLevelComparison(skills.find(s=>s.id==='monk_asura')!),blessing=skillLevelComparison(skills.find(s=>s.id==='acolyte_blessing')!);
 assert.match(asura.rows[0]!.effects.join(' '),/1,102.5% SP/);assert.match(asura.rows[9]!.effects.join(' '),/2,047.5% SP/);
 for(const [i,row]of blessing.rows.entries())assert.ok(row.effects.join(' ').includes(`${5.5+i*.5}s`));
});
