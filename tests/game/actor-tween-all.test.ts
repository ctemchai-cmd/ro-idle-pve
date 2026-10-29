import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createJobCatalog } from '../../src/content/jobs.ts';
import { actorTweenSample, rootNeckTransform } from '../../src/renderer/actor-tween.ts';
import { actorAction, actorDuration, type ActorParts } from '../../src/renderer/native.mjs';
import { actorPreviewLayout } from '../../src/renderer/actor-preview.ts';
import { presetSwing, ActorAnimation } from '../../src/renderer/actor-animation.ts';
import { attackContactMs } from '../../src/renderer/impact-timing.ts';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
import { DemoSession } from '../../src/client/demo.ts';
const index=JSON.parse(readFileSync('runtime/ro/manifest.json','utf8')) as RuntimeAssetIndex;
const load=(ref:{meta:string}|undefined)=>ref?{meta:JSON.parse(readFileSync('runtime/ro/payload/'+ref.meta,'utf8')),image:null!}:undefined;
const rigs=index.actor_jobs.flatMap(j=>j.presets.map(p=>({job:j.job_id,preset:p,parts:{body:load(p.body)!,head:load(p.head),weapon:load(p.weapon),...presetSwing(p)} as ActorParts,states:['attack',...(p.attack_variant_indices??[]).slice(1).map((_,i)=>'attack'+(i+2))]})));
test('D199 all32playable jobs,60gender rigs and68actual attack clips are covered',()=>{
 const catalog=createJobCatalog(JSON.parse(readFileSync('plan/data/progression.json','utf8')));
 assert.deepEqual([...new Set(rigs.map(r=>r.job))].sort(),[...catalog.order].sort());assert.equal(rigs.length,60);assert.equal(rigs.flatMap(r=>r.states).length,68);
 for(const r of rigs){assert(r.parts.head);assert.equal(r.states.length,r.preset.attack_variant_indices?.length??1);for(const[stateIndex,state]of r.states.entries())assert.equal(actorAction(r.parts,state)!.source_action_index,stateIndex?r.preset.attack_variant_indices![stateIndex]:r.preset.attack_source_action_index);}
});
test('D199 every native interval produces finite root/neck attached intermediate geometry, including large bends',()=>{
 let count=0;for(const r of rigs)for(const state of r.states){const action=actorAction(r.parts,state)!,before=JSON.stringify(r.parts);
  for(let frame=0;frame<action.frames.length;frame++)for(const sub of[1,25,50,75,99]){
   const sample=actorTweenSample(r.parts,state,frame*100+sub);assert(sample,r.job+':'+r.preset.gender+':'+state+':'+frame+':'+sub);count++;
   for(const source of[sample.from.frame!.anchor!,sample.to.frame!.anchor!]){const[a,b,c,d]=rootNeckTransform([source[0]!,source[1]!],sample.anchor,sample.rotate);assert([a,b,c,d].every(Number.isFinite));assert(a*d-b*c>0);assert(Math.abs(a*source[0]!+c*source[1]!-sample.anchor[0])<1e-9);assert(Math.abs(b*source[0]!+d*source[1]!-sample.anchor[1])<1e-9);}
  }assert.equal(JSON.stringify(r.parts),before);
 }assert.equal(count,2870);
});
test('D199 transforms have no guard-switch jumps through a deep Bard recovery',()=>{
 const r=rigs.find(r=>r.job==='bard')!,source=actorAction(r.parts,'attack')!.frames.at(-1)!.anchor!,to=actorAction(r.parts,'idle')!.frames[0]!.anchor!;let prior:number[]|undefined;
 for(let n=0;n<=100;n++){const t=n/100,target=[source[0]!+(to[0]!-source[0]!)*t,source[1]!+(to[1]!-source[1]!)*t] as const,matrix=rootNeckTransform([source[0]!,source[1]!],target);if(prior)for(let i=0;i<4;i++)assert(Math.abs(matrix[i]!-prior[i]!)<.08);prior=[...matrix];}
});
test('D199 native key times, all release markers, variant cadence and clip lengths stay unchanged',()=>{
 const actor=new DemoSession().view().actors.find(a=>a.actor_id==='main')!;
 for(const r of rigs){const animation=new ActorAnimation(()=>r.parts);let at=0;
  for(const[i,state]of r.states.entries()){const action=actorAction(r.parts,state)!,duration=action.frames.length*action.frame_duration_ms;
   assert.equal(actorDuration(r.parts,state),duration);for(let t=0;t<=duration;t+=action.frame_duration_ms)assert.equal(actorTweenSample(r.parts,state,t),null);
   const contact=attackContactMs(r.parts,state);assert(contact>=0&&contact<duration);if(r.preset.attack_release_frame!=null&&state==='attack')assert.equal(contact,r.preset.attack_release_frame*action.frame_duration_ms);
   const event={type:'normal_attack' as const,actor_id:'main',at_ms:at,phase:0,sequence:i};animation.accept(event);assert.equal(animation.attackState(event),state);const pose=animation.sample(actor,at+50);assert.equal(pose.state,state);assert.equal(animation.sample(actor,at+duration).state,'idle');at+=2000;
  }
 }
});
test('D199 preview fitting is stable perclip, finite and uses the same scale in both facings',()=>{
 for(const r of rigs)for(const state of r.states){const a=actorPreviewLayout(r.parts,state,false),b=actorPreviewLayout(r.parts,state,true);assert(a.scale>0&&a.scale<=2.8);assert.deepEqual(a,{...b,xOffset:-b.xOffset});assert(Object.values(a).every(Number.isFinite));}
});
