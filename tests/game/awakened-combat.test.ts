// Execute one application of each authored variant; rule/parity proof, not team balance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {hiContent} from './hi-content-fixtures.ts';
import {actor,unwrap,type Active} from './combat-fixtures.ts';
import {createBattle,advanceUntil,type BattleState,type BattleEvent} from '../../src/domain/combat/index.ts';
import {resolveSkill} from '../../src/domain/build/resolve-skill.ts';
import type {BattleCheckpoint,SkillDefinition} from '../../src/contracts/index.ts';
const future=hiContent(true);
function scenario(id:string){
 const definition=structuredClone(resolveSkill(id,1,future,true).definition)as SkillDefinition;
 if(definition.kind==='active')definition.timing.after_cast_ms=60000;
 const caster=actor('caster','player',definition.kind==='active'?[definition as Active]:[],definition.kind==='passive');
 caster.resolved_skills[id]={level:1,definition};caster.stat_blueprint.derived_offsets.max_sp=2000;
 const state=structuredClone(unwrap(createBattle({actors:[caster,actor('friend','player'),actor('boss','enemy',[],true)],mode:{kind:'story',ref:'awaken-application',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},future,17)))as BattleCheckpoint;
 if(definition.kind==='active'&&Number(definition.cost.spirit_spheres)>0)state.actors.find(a=>a.actor_id==='caster')!.spirit_spheres=5;
 for(const a of state.actors.filter(a=>a.team==='player'))a.hp-=100000;
 return{state,definition};
}
test('all152 Awaken variants execute and serialize using the same engine, with1x2x4 event/RNG/state parity',()=>{
 const ids=Object.values(future.skills).filter(s=>s.class_id!=='enemy').map(s=>String(s.id));assert.equal(ids.length,152);
 for(const id of ids){
  const {state:initial,definition}=scenario(id),expected=unwrap(advanceUntil(initial,14000,future));
  if(definition.kind==='active')assert.equal(expected.events.filter(e=>e.actor_id==='caster'&&e.skill_id===id&&e.type==='cast_resolve').length,1,id);
  for(const speed of[1,2,4]){
   let state:BattleState=initial;const events:BattleEvent[]=[];
   for(let to=500*speed;to<14000;to+=500*speed){const next=unwrap(advanceUntil(state,to,future));state=JSON.parse(JSON.stringify(next.state));events.push(...next.events);}
   const end=unwrap(advanceUntil(state,14000,future));events.push(...end.events);assert.deepEqual(events,expected.events,id);assert.deepEqual(end.state,expected.state,id);
  }
 }
});
