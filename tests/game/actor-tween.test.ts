import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { actorTweenSample, NativeActorTween } from '../../src/renderer/actor-tween.ts';
import { actorDuration, actorFrame, type ActorParts } from '../../src/renderer/native.mjs';
import { attackContactMs } from '../../src/renderer/impact-timing.ts';
const index=JSON.parse(readFileSync('runtime/ro/manifest.json','utf8'));
const presets=index.actor_jobs.find((j:{job_id:string})=>j.job_id==='swordsman').presets;
const load=(path:string)=>({meta:JSON.parse(readFileSync('runtime/ro/payload/'+path,'utf8')),image:null!});
const rigs:ActorParts[]=presets.map((p:{body:{meta:string};head:{meta:string};weapon:{meta:string};attack_source_action_index:number})=>({body:load(p.body.meta),head:load(p.head.meta),weapon:load(p.weapon.meta),attackIndex:p.attack_source_action_index}));
test('D198 all original900ms attack keys/contact remain native in both Swordsman rigs',()=>{
 for(const p of rigs){assert.equal(actorDuration(p,'attack'),900);const contact=attackContactMs(p);assert.equal(contact%100,0);
  for(let at=0;at<=900;at+=100){assert.equal(actorTweenSample(p,'attack',at),null);assert.equal(actorFrame(p,'attack',at).index,Math.min(8,at/100));}
 }
});
test('D198 intermediate neck/root geometry uses the same native pair, with one narrow24ms mix and exact recovery endpoint',()=>{
 for(const p of rigs){const before=JSON.stringify([p.body.meta,p.head!.meta,p.weapon!.meta]);
  for(let frame=0;frame<9;frame++){const s=actorTweenSample(p,'attack',frame*100+50)!;assert(s);assert.equal(s.amount,.5);assert.equal(s.blend,.5);const a=s.from.frame!.anchor!,b=s.to.frame!.anchor!;assert.deepEqual(s.anchor,[(a[0]!+b[0]!)/2,(a[1]!+b[1]!)/2]);}
  assert.equal(actorTweenSample(p,'attack',337)!.blend,0);assert.equal(actorTweenSample(p,'attack',363)!.blend,1);
  assert.equal(actorTweenSample(p,'attack',850)!.to.action!.state,'idle');assert.equal(JSON.stringify([p.body.meta,p.head!.meta,p.weapon!.meta]),before);
 }
});
test('D198 unsupported states, missing head/anchors and invalid time use original rendering without scratch allocation',()=>{
 const p=rigs[0]!;for(const state of['idle','walk','standby','hurt','dead'])assert.equal(actorTweenSample(p,state,350),null);
 assert.equal(actorTweenSample({...p,head:undefined},'attack',350),null);assert.equal(actorTweenSample(p,'attack',-1),null);assert.equal(actorTweenSample(p,'attack',Infinity),null);assert.equal(new NativeActorTween().scratchBytes,0);
});
