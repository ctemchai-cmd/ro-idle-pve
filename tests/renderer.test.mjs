import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {frameAt,resolveLayer,modulo,actorFrame,actorDuration,attachmentFrame} from '../preview/asset-lab/renderer.mjs';
test('death clamps while looping frames continue at duration boundaries',()=>{
 const action={frame_duration_ms:100,frames:[{id:0},{id:1},{id:2}]};
 assert.equal(frameAt(action,300,true).index,0);assert.equal(frameAt(action,300,false).index,2);assert.equal(frameAt(action,99,true).index,0);assert.equal(frameAt(action,100,true).index,1);
});
test('STR playback agrees with independently baked native effect reference',()=>{
 const {fixtures}=JSON.parse(fs.readFileSync(new URL('./fixtures/str-reference.json',import.meta.url)));
 for(const fixture of fixtures)for(const expected of fixture.expected){
  const actual=resolveLayer(fixture.layer,expected.time);assert.equal(actual.texture,expected.texture);assert.equal(actual.blend,expected.blend);
  for(let i=0;i<4;i++){assert.ok(Math.abs(actual.color[i]-expected.color[i])<1e-6);for(let j=0;j<2;j++)assert.ok(Math.abs(actual.points[i][j]-expected.points[i][j])<1e-6)}
 }
 assert.equal(modulo(-1,3),2);
});

const runtime=JSON.parse(fs.readFileSync(new URL('../runtime/ro/manifest.json',import.meta.url)));
const loadPart=reference=>({meta:JSON.parse(fs.readFileSync(new URL('../assets/ro/'+reference.meta,import.meta.url)))});
test('every shipped human preset keeps body and head together throughout idle, using actual ACT anchors',()=>{
 let presets=0;
 for(const job of runtime.actor_jobs)for(const preset of job.presets){
  const parts={body:loadPart(preset.body),head:loadPart(preset.head),attackIndex:preset.attack_source_action_index};
  const first=actorFrame(parts,'idle',0),anchor=attachmentFrame(parts.head,first.action,first.frame,first.index,'idle');
  for(const elapsed of [0,99,100,199,200,299,300,450,750,1200,5800]){
   const body=actorFrame(parts,'idle',elapsed),head=attachmentFrame(parts.head,body.action,body.frame,body.index,'idle');
   assert.deepEqual(body.frame,first.frame,preset.preset_id+' body moved while idle');
   assert.deepEqual(head,anchor,preset.preset_id+' head detached while idle');
  }
  // Attack frames must use their own head anchor and stop on the final pose.
  const duration=actorDuration(parts,'attack');
  for(let elapsed=0;elapsed<duration;elapsed+=50){
   const body=actorFrame(parts,'attack',elapsed),head=attachmentFrame(parts.head,body.action,body.frame,body.index,'attack');
   assert.ok(head,preset.preset_id+' missing attack head');
   const expectedAction=parts.head.meta.animation.actions.find(a=>a.source_action_index===body.action.source_action_index);
   assert.deepEqual(head.frame,expectedAction.frames[Math.min(body.index,expectedAction.frames.length-1)]);
   const own=head.frame.anchor??body.frame.anchor;
   assert.deepEqual(head.offset.map((v,i)=>v+own[i]),body.frame.anchor);
  }
  assert.equal(actorFrame(parts,'attack',duration+500).index,actorFrame(parts,'attack',duration-1).index);
  presets++;
 }
 assert.equal(presets,36);
});
test('monsters keep looping idle while a shorter attachment holds instead of wrapping',()=>{
 const action={state:'idle',source_action_index:6,frame_duration_ms:100,frames:[{layers:[],anchor:[2,-50]},{layers:[],anchor:[3,-49]},{layers:[],anchor:[4,-48]}]};
 const parts={body:{meta:{animation:{actions:[action]}}}};
 assert.equal(actorFrame(parts,'idle',100).index,1);assert.equal(actorFrame(parts,'idle',300).index,0);
 const overlay={meta:{animation:{actions:[{...action,frames:[{layers:[],anchor:[1,-40]}]}]}}};
 const selected=attachmentFrame(overlay,action,action.frames[2],2,'idle');
 assert.deepEqual(selected.offset,[3,-8]);assert.equal(selected.frame,overlay.meta.animation.actions[0].frames[0]);
});
