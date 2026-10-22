import test from 'node:test';
import assert from 'node:assert/strict';
import {content,actor,battle,step,checkpoint,skill,type Active} from './combat-fixtures.ts';
import {resolveSkill} from '../../src/domain/build/resolve-skill.ts';
import {critMultiplier} from '../../src/domain/math/index.ts';
import {EffectPipeline} from '../../src/domain/combat/effects.ts';
import {initializeAccount} from '../../src/domain/progression/initialize.ts';
import {characterSkillOptions} from '../../src/client/skills.ts';
const active=(id:string,lv=10)=>structuredClone(resolveSkill(id,lv,content).definition) as Active;
const damage=(s:Active)=>s.effects.find(e=>e.type==='damage')! as Extract<Active['effects'][number],{type:'damage'}>;
const ratio=(s:Active)=>Number((damage(s).formula.params as {attack_ratio:number}).attack_ratio)*damage(s).hits;

test('D138 major budgets at all ten ranks; Finger and Asura keep their paid sphere/SP rules',()=>{
 const single=['hunter_rapid_fire','wizard_jupitel','sage_psychic_bolt','sage_magic_barrier','assassin_sonic_blow','assassin_detonate','alchemist_acid_terror'];
 const aoe=['knight_brandish','crusader_grand_cross','hunter_claymore','wizard_meteor','wizard_heavens_drive','rogue_raid','blacksmith_cart_crash'];
 for(let lv=1;lv<=10;lv++){
  const finger=active('monk_finger_offensive',lv),power=ratio(finger);
  for(const id of [...single,...aoe]){
   const actual=ratio(active(id,lv))*(id==='sage_psychic_bolt'?1.5:1),wanted=power*(single.includes(id)?.7:.5);
   assert.ok(Math.abs(actual-wanted)<.00001,`${id} rank${lv}: ${actual}/${wanted}`);
  }
  assert.equal(finger.cost.spirit_spheres,5);assert.deepEqual(active('monk_asura',lv).cost,{sp:{mode:'all_current',minimum_sp:30},spirit_spheres:5});
  assert.equal(damage(active('blacksmith_cart_crash',lv)).hits,4);
 }
});

test('D138 successful interrupt outcomes are per target and action; no bonus against idle or interrupt-immune casts',()=>{
 for(const mode of ['casting','idle','immune','uninterruptible','same_time'] as const){
  const breaker=active('sage_spell_breaker'),enemySkill=skill('long_cast',mode==='same_time'?500:6000,500,0);if(mode==='uninterruptible')enemySkill.timing.interruptible=false;
  const p=actor('a','player',[breaker]),b=actor('b','enemy',mode==='idle'?[]:[enemySkill]);
  p.stat_blueprint.derived_offsets.max_sp=1000;p.stat_blueprint.derived_offsets.magical_attack=100;
  b.stat_blueprint.derived_offsets.attack_speed=50;
  if(mode==='immune')b.stat_blueprint.permanent_sources.push({source:{instance_id:'immune',owner_actor_id:'b',origin_actor_id:'b',origin_life_epoch:0,definition_id:'immune'},modifiers:[{id:'immune',stat:'interrupt_resistance',op:'add_flat',bucket:'bonus',value:1}],triggers:[]});
  const events=step(battle([p,b]),2000).events,interrupts=events.filter(e=>e.type==='cast_interrupt'&&e.actor_id==='b'),hits=events.filter(e=>e.type==='damage'&&e.skill_id==='sage_spell_breaker');
  assert.equal(Number(breaker.timing.cast_ms),0);
  assert.equal(hits.length,mode==='casting'?1:0,mode);assert.equal(interrupts.length,hits.length,mode);
  if(hits.length){assert.equal(hits[0]!.at_ms,interrupts[0]!.at_ms);assert.ok(hits[0]!.raw!>=1000);}
 }
});

test('D138 guaranteed and skill-local crit use shared pipeline and cannot change later normal attacks',()=>{
 const s=checkpoint(battle([actor('a','player'),actor('b','enemy')])),a=s.actors[0]!,b=s.actors[1]!,events:unknown[]=[];
 a.stats.physical_attack=100;a.stats.magical_attack=100;a.stats.crit_chance_bonus=-1;b.stats.crit_resistance=0;b.stats.physical_defense=0;b.stats.magical_defense=0;
 const pipeline=new EffectPipeline(s,content,{emit:e=>events.push(e),metric:()=>{},interrupt:()=>{},revive:()=>{}});
 const before=structuredClone(a.stats),ctx=pipeline.context(a,'sage_psychic_bolt','skill','critical');ctx.selected={foe:[b]};pipeline.program(active('sage_psychic_bolt').effects,ctx);
 const hit=events.find(e=>(e as {type:string}).type==='damage') as {detail:string;amount:number};assert.equal(hit.detail,'critical');assert.ok(hit.amount>0);assert.deepEqual(a.stats,before);
 events.length=0;const rolled=active('assassin_detonate');const fx=damage(rolled);fx.crit_chance_bonus=2;
 const next=pipeline.context(a,'assassin_detonate','skill','rolled');next.selected={foe:[b]};pipeline.program([fx],next);assert.equal((events[0] as {detail:string}).detail,'critical');assert.deepEqual(a.stats,before);
 events.length=0;const plain=skill().effects[0]!;if(plain.type==='damage')plain.can_crit=true;const normal=pipeline.context(a,'normal_attack','normal','normal');normal.selected={foe:[b]};pipeline.program([plain],normal);assert.equal((events[0] as {detail:string}).detail,'normal');assert.deepEqual(a.stats,before);assert.equal(critMultiplier(a.stats),1.5);
});

test('D138 all-rank utility changes and exact descriptions use resolved definitions',()=>{
 for(const lv of[1,10]){
  const dispel=active('sage_dispel',lv),effect=dispel.effects[0]!;assert.equal(dispel.timing.cast_ms,lv===1?1000:0);if(effect.type==='remove_status')assert.equal(effect.max_instances,lv===1?1:4);
  const voice=active('sage_magic_barrier',lv);assert.equal(voice.effects[1]!.type,'apply_status');if(voice.effects[1]!.type==='apply_status')assert.equal(voice.effects[1]!.duration_ms,lv===1?5000:8000);
  const intimidate=active('rogue_intimidate',lv).effects[0]!;if(intimidate.type==='apply_status')assert.equal(intimidate.duration_ms,lv===1?3000:6000);
  assert.equal(active('alchemist_hell_plant',lv).effects[0]!.type,'summon');
 }
 const state=initializeAccount(content,{root_job_id:'mage',gender:'male'},'2026-10-23T00:00:00Z','2026-10-23',1),main=state.roster[0]!;main.job_id='sage';main.level=70;main.skill_levels={...main.skill_levels,sage_spell_breaker:10,sage_psychic_bolt:10,sage_magic_barrier:10,sage_dispel:10};
 main.active_slots=['sage_spell_breaker','sage_psychic_bolt','sage_magic_barrier','sage_dispel'];
 const options=characterSkillOptions(main,state).skills;assert.ok(options.find(s=>s.id==='sage_spell_breaker')!.effects.some(t=>t.includes('เมื่อขัดร่ายสำเร็จ')));assert.ok(options.find(s=>s.id==='sage_psychic_bolt')!.effects.some(t=>t.includes('คริเสมอ')));assert.equal(options.find(s=>s.id==='sage_magic_barrier')!.name,'Voice Breaker');
});

test('D138 speed1/2/4 preserves event order, interrupt outcomes, RNG and checkpoints',()=>{
 const enemy=skill('long_cast',6000,500,0),p=actor('a','player',[active('sage_spell_breaker')]),b=actor('b','enemy',[enemy]);p.stat_blueprint.derived_offsets.max_sp=1000;p.stat_blueprint.derived_offsets.magical_attack=100;b.stat_blueprint.derived_offsets.attack_speed=50;
 const results=[1,2,4].map(speed=>{let state=battle([p,b]),events:unknown[]=[];for(let to=50*speed;to<=8000;to+=50*speed){const r=step(state,to);state=r.state;events.push(...r.events);}return{state,events};});
 assert.deepEqual(results[1],results[0]);assert.deepEqual(results[2],results[0]);assert.ok(results[0]!.events.some(e=>(e as {type:string}).type==='cast_interrupt'));
});
