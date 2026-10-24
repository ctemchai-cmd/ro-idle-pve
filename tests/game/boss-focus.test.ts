import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import raw from '../../src/generated/content.json';
import tuning from './fixtures/boss-focus-131.json';
import tuning132 from './fixtures/assassin-balance-132.json';
import {actor,skill,content,unwrap,type Active} from './combat-fixtures.ts';
import {createBattle,advanceUntil,type BattleState} from '../../src/domain/combat/index.ts';
import {resolveSkill} from '../../src/domain/build/resolve-skill.ts';
import {describeResolvedSkill} from '../../src/client/skills.ts';
import type {BattleCheckpoint} from '../../src/contracts/index.ts';
const focused=()=>{const s=skill('wizard_heavens_drive',1000,60000,12,100);s.single_target_damage_bonus=.35;s.selectors.foe!.select='all';return s;};
const run=(s:Active,extra=0,bonus=0,normal=false)=>{
 const a=actor('caster','player',[s],normal);if(bonus)a.stat_blueprint.permanent_sources.push({source:{instance_id:'test_bonus',owner_actor_id:'caster',origin_actor_id:'caster',origin_life_epoch:0,definition_id:'test_bonus'},modifiers:[{id:'skill',stat:'skill_damage_bonus',op:'add_flat',bucket:'bonus',value:bonus}],triggers:[]});
 return structuredClone(unwrap(createBattle({actors:[a,actor('friend','player'),actor('boss','enemy'),...Array.from({length:extra},(_,i)=>actor('extra'+i,'enemy'))],mode:{kind:'story',ref:'focus',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,17))) as BattleCheckpoint;
};
test('D161 focus is additive in the existing skill bucket; multiple enemies keep AoE and normal/heal stay unchanged',()=>{
 const first=unwrap(advanceUntil(run(focused()),5000,content));assert.equal(first.events.find(e=>e.type==='damage')!.amount,135);
 const buff=unwrap(advanceUntil(run(focused(),0,.5),5000,content));assert.equal(buff.events.find(e=>e.type==='damage')!.amount,185);
 const many=unwrap(advanceUntil(run(focused(),1,.5),5000,content));assert.deepEqual(many.events.filter(e=>e.type==='damage').map(e=>e.amount),[150,150]);
 assert.equal(first.state.actors.find(a=>a.actor_id==='caster')!.stats.skill_damage_bonus??0,0,'temporary resolve context never becomes an actor buff');
 const s=focused();s.effects.push({id:'heal',type:'heal',target:'self',formula:{id:'flat_power',params:{amount:100}}});const h=run(s);h.actors.find(a=>a.actor_id==='caster')!.hp-=1000;
 assert.equal(unwrap(advanceUntil(h,5000,content)).events.find(e=>e.type==='heal')!.amount,100);
 const without=focused();delete without.single_target_damage_bonus;
 const normals=(s:Active)=>unwrap(advanceUntil(run(s,0,0,true),10000,content)).events.filter(e=>e.type==='damage'&&e.origin==='normal').map(e=>({at:e.at_ms,amount:e.amount}));
 assert.ok(normals(focused()).length>0);assert.deepEqual(normals(focused()),normals(without));
});
test('D161 counts living targetable hostiles at resolve, once before all hit effects; dead and untargetable actors do not suppress focus',()=>{
 for(const mode of ['dead','untargetable']){const state=run(focused(),1),other=state.actors.find(a=>a.actor_id==='extra0')!;if(mode==='dead'){other.hp=0;other.action_phase='dead';}else other.targetable=false;
  assert.equal(unwrap(advanceUntil(state,5000,content)).events.find(e=>e.type==='damage')!.amount,135,mode);
 }
 const state=run(focused(),1);state.actors.find(a=>a.actor_id==='boss')!.hp=1;
 const hits=unwrap(advanceUntil(state,5000,content)).events.filter(e=>e.type==='damage');assert.equal(hits.find(e=>e.target_id==='extra0')!.amount,100,'first kill cannot add focus to second AoE target');
 const late=run(focused(),1);late.actors.find(a=>a.actor_id==='extra0')!.targetable=false;const casting=structuredClone(unwrap(advanceUntil(late,1700,content)).state) as BattleCheckpoint;assert.ok(casting.actors.find(a=>a.actor_id==='caster')!.cast);casting.actors.find(a=>a.actor_id==='extra0')!.targetable=true;
 assert.deepEqual(unwrap(advanceUntil(casting,5000,content)).events.filter(e=>e.type==='damage').map(e=>e.amount),[100,100]);
});
test('D161 Storm Gust snapshots focus once for its periodic field, checkpoint and speed chunking reproduce identical events',()=>{
 const s=structuredClone(resolveSkill('wizard_storm_gust',10,content).definition)as Active;s.timing.after_cast_ms=60000;
 const initial=run(s),applied=unwrap(advanceUntil(initial,4900,content));const state=structuredClone(applied.state)as BattleCheckpoint;
 const field=state.actors.find(a=>a.actor_id==='boss')!.statuses.find(a=>a.status_id==='frost_field')!;
 assert.equal(field.offense_snapshot.skill_damage_bonus,.35);assert.equal(state.actors.find(a=>a.actor_id==='caster')!.cast?.offense_snapshot.skill_damage_bonus??0,0);
 const full=unwrap(advanceUntil(initial,10000,content));const tick=full.events.filter(e=>e.type==='damage');assert.equal(tick.length,4);assert.ok(tick.every(e=>e.raw===tick[0]!.raw&&e.amount===tick[0]!.amount));
 const restored=unwrap(advanceUntil(state,10000,content));assert.deepEqual(restored.state,full.state);assert.deepEqual(restored.events,full.events.filter(e=>e.at_ms>4900));
 for(const speed of [1,2,4]){let current:BattleState=initial;const events=[];for(let at=250*speed;at<10000;at+=250*speed){const r=unwrap(advanceUntil(current,at,content));current=r.state;events.push(...r.events);}const end=unwrap(advanceUntil(current,10000,content));events.push(...end.events);assert.deepEqual(events,full.events);assert.deepEqual(end.state,full.state);}
 const many=unwrap(advanceUntil(run(s,1),10000,content));assert.ok(many.state.actors.filter(a=>a.team==='enemy').every(a=>a.statuses.filter(s=>s.status_id==='frost_field').every(s=>(s.offense_snapshot.skill_damage_bonus??0)===0)));
 const wave=run(s,1);wave.actors.find(a=>a.actor_id==='extra0')!.targetable=false;
 const placed=structuredClone(unwrap(advanceUntil(wave,3500,content)).state)as BattleCheckpoint;placed.actors.find(a=>a.actor_id==='extra0')!.targetable=true;
 assert.ok(unwrap(advanceUntil(placed,10000,content)).events.filter(e=>e.type==='damage').every(e=>e.amount===tick[0]!.amount),'new add cannot change an already placed field snapshot');
});
test('D161 interruption spends SP but cannot create a focused field; old queue timing and cost stay intact',()=>{
 const s=structuredClone(resolveSkill('wizard_storm_gust',10,content).definition)as Active,interrupt=skill('interrupt',500,60000,0);interrupt.effects=[{id:'stop',type:'interrupt',target:'foe'}];
 const state=run(s),enemy=actor('boss','enemy',[interrupt]);
 // Use ordinary input rather than mutating a running actor's scheduled skill state.
 const fresh=unwrap(createBattle({actors:[actor('caster','player',[s]),enemy],mode:state.mode},content,17));
 const result=unwrap(advanceUntil(fresh,10000,content));assert.ok(result.events.some(e=>e.type==='cast_interrupt'&&e.actor_id==='caster'));assert.equal(result.state.metrics.actors.caster!.sp_spent,52);assert.ok(!result.events.some(e=>e.type==='status_applied'&&e.status_change?.status_id==='frost_field'));
});
test('D161 all base changes are the declared power scales/focus only; native IDs, CT/ACD/SP, every price and paid progression remain identical',()=>{
 const before=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-131/content-before.json.gz',import.meta.url))).toString())as typeof raw;
 for(const root of ['swordsman','acolyte','archer','mage','thief','merchant']as const){const key=`skills/${root}.json`as 'skills/mage.json',old=before.documents[key],now=raw.documents[key];
  for(const group of ['skills','hi_class_skills']as const)for(const original of old[group]){const expected=structuredClone(original)as unknown as Record<string,any>,change=tuning.skills.find(r=>r.id===original.id);
   if(change?.focus_bonus)expected.single_target_damage_bonus=change.focus_bonus;
   for(const [param,scale]of Object.entries(change?.power_scales??{})){
    const actual=(now[group].find(s=>s.id===original.id)!.level_parameters as Partial<Record<string,number[]>>)[param]!;
    expected.level_parameters[param].forEach((v:number,i:number)=>assert.ok(Math.abs(actual[i]!-v*scale)<.000001,`${original.id}:${param}:${i}`));
    expected.level_parameters[param]=actual;
   }
   const subsequent=(tuning132.base_changes as Record<string,Record<string,number[]>>)[original.id];
   for(const [param,values]of Object.entries(subsequent??{}))expected.level_parameters[param]=values;
   assert.deepEqual(now[group].find(s=>s.id===original.id),expected,original.id);
  }
  for(const prices of ['upgrades','hi_class_upgrades','awakened_upgrades']as const)assert.deepEqual(now[prices],old[prices]);
 }
 for(const row of tuning.skills.filter(s=>s.focus_bonus))for(const awaken of [false,true])for(const rank of [1,5,10]){const s=resolveSkill(row.id,rank,content,awaken).definition as Active;assert.equal(s.single_target_damage_bonus,.35);assert.ok(describeResolvedSkill(s,rank).effects.some(t=>t.includes('ศัตรูเหลือ 1 ตัว')&&t.includes('35%')));}
});
