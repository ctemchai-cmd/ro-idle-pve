import test from 'node:test';
import assert from 'node:assert/strict';
import type { SkillDefinition } from '../../src/contracts/index.ts';
import type { BattlePresentationEvent } from '../../src/contracts/presentation.ts';
import { FinisherEffects, FINISHER_LIMITS, FINISHER_PROFILES } from '../../src/renderer/finishers.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { actor, battle, content, skill, step } from './combat-fixtures.ts';

const hit=(patch:Partial<BattlePresentationEvent>={}):BattlePresentationEvent=>({type:'damage',at_ms:4000,phase:1,sequence:1,actor_id:'main',target_id:'boss',skill_id:'monk_asura',action_id:'cast1',origin:'skill',amount:1000,...patch});
test('finisher follows successful damage only, never charge/interruption/miss/normal/proc/zero',()=>{
 const fx=new FinisherEffects();for(const e of [hit({type:'cast_start'}),hit({type:'cast_interrupt'}),hit({type:'miss'}),hit({amount:0}),hit({origin:'proc'}),hit({origin:'normal'}),hit({skill_id:'normal_attack'}),hit({type:'heal'})])fx.queue(e,4200);fx.advance(5000,0);assert.deepEqual(fx.buffers(),{pending:0,active:0,seen:0});
});
test('visual contact gates first successful hit; multihit/AoE/receipt replay make one cue per action',()=>{
 const fx=new FinisherEffects(),event=hit(),before=JSON.stringify(event);fx.queue(event,4200);fx.queue(hit({target_id:'other',hit_index:1,sequence:2}),4400);fx.queue(event,4200);
 fx.advance(4199,10);assert.deepEqual(fx.frames(10,true),[]);fx.advance(4200,11);assert.equal(fx.frames(11,true).length,1);assert.equal(fx.frames(11,true)[0]!.at_ms,4200);assert.equal(fx.buffers().seen,1);assert.equal(JSON.stringify(event),before);
});
test('a successful shield-absorbed hit still lands; quiet farm retains impact without title',()=>{
 const fx=new FinisherEffects();fx.queue(hit({amount:0,absorbed:1000}),4200);fx.advance(4200,100);
 assert.equal(fx.frames(100,true,false).length,1);assert.equal(fx.frames(100,true,false)[0]!.title,false);assert.deepEqual(fx.frames(100,false,false),[]);fx.advance(4700,600);assert.deepEqual(fx.frames(600,true,false),[]);
});
test('1×/2×/4× preserve impact time and keep Asura title readable for the same wall duration',()=>{
 for(const speed of [1,2,4]){const fx=new FinisherEffects();fx.queue(hit(),4200);fx.advance(4200,100);fx.advance(4200+speed*650,750);const cue=fx.frames(750,true)[0]!;assert.ok(cue.title);assert.equal(cue.age_ms,650);assert.equal(cue.at_ms,4200);fx.advance(4200+speed*1000,1100);assert.deepEqual(fx.frames(1100,true),[]);}
});
test('shake stays subtle/bounded, expires quickly, and reduced motion keeps only static title',()=>{
 const fx=new FinisherEffects();fx.queue(hit(),4000);fx.advance(4000,0);
 for(let wall=0;wall<200;wall+=7){const [x,y]=fx.shake(wall,true);assert.ok(Math.abs(x)<=5&&Math.abs(y)<=5);assert.deepEqual(fx.shake(wall,false),[0,0]);}
 assert.deepEqual(fx.shake(FINISHER_LIMITS.shakeMs,true),[0,0]);assert.equal(fx.frames(200,false).filter(f=>f.title).length,1);
});
test('stale catch-up cannot replay an old ultimate; buffers remain bounded under repeated events',()=>{
 const fx=new FinisherEffects();fx.queue(hit(),4000);fx.advance(6000,0);assert.deepEqual(fx.frames(0,true),[]);
 for(let i=0;i<1100;i++)fx.queue(hit({action_id:'cast'+i,sequence:i,at_ms:6000}),6000);fx.advance(6000,10);const sizes=fx.buffers();assert.ok(sizes.pending<=12&&sizes.active<=3&&sizes.seen<=1024);assert.equal(fx.frames(10,true).filter(f=>f.title).length,1);
});
test('all configured large attacks exist in current content and represent all six class trees',()=>{
 const roots=new Set<string>(),tree=content.documents['progression.json']!.class_tree as unknown as Record<string,string[]>;
 for(const[id,p]of Object.entries(FINISHER_PROFILES)){const s=resolveSkill(id,1,content).definition as SkillDefinition;assert.equal(s.kind,'active');if(s.kind!=='active')throw Error('ACTIVE');assert.ok(s.effects.some(e=>e.type==='damage'||e.type==='handler'),id);const root=Object.keys(tree).find(root=>s.class_id===root||tree[root]!.includes(s.class_id))!;roots.add(root);assert.ok(p.hold>=750&&p.hold<=1000&&p.shake<=5);assert.match(p.color,/^#[a-f\d]{6}$/i);}
 assert.equal(roots.size,6);
});
test('actual resolved Asura interruption produces no finisher, successful Asura produces exactly one',()=>{
 const asura=resolveSkill('monk_asura',1,content).definition as Extract<SkillDefinition,{kind:'active'}>;
 for(const interrupted of [false,true]){const cancel=skill('cancel',100,10000,0);cancel.effects=[{id:'cancel',type:'interrupt',target:'foe'}];const initial=battle([actor('main','player',[asura]),actor('boss','enemy',interrupted?[cancel]:[])]),state={...initial,actors:initial.actors.map(a=>a.actor_id==='main'?{...a,spirit_spheres:5}:a)},result=step(state,5000),fx=new FinisherEffects(),before=JSON.stringify(result.state);
  for(const e of result.events)fx.queue(e,e.at_ms+200);const successful=result.events.filter(e=>e.type==='damage'&&e.skill_id==='monk_asura');assert.equal(successful.length,interrupted?0:1);if(interrupted)assert.ok(result.events.some(e=>e.type==='cast_interrupt'&&e.skill_id==='monk_asura'));assert.equal(fx.buffers().pending,interrupted?0:1);assert.equal(JSON.stringify(result.state),before);
 }
});
