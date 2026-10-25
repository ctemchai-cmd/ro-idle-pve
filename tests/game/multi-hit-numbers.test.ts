import test from 'node:test';
import assert from 'node:assert/strict';
import type { BattlePresentationEvent } from '../../src/contracts/presentation.ts';
import { MultiHitNumbers, multiHitOrdinals, MULTI_HIT_HOLD_MS, MULTI_HIT_FADE_MS } from '../../src/renderer/multi-hit-numbers.ts';

const hit=(sequence:number,overrides:Partial<BattlePresentationEvent>={}):BattlePresentationEvent=>({type:'damage',at_ms:1000,phase:3,sequence,actor_id:'mage',target_id:'boss',skill_id:'mage_fire_bolt',action_id:'cast_1',effect_id:'hit',hit_index:sequence-1,amount:100,origin:'skill',...overrides});
test('one cast shows100→200→300 at the actual visual contacts, without counting a frame twice',()=>{
 const numbers=new MultiHitNumbers();for(let i=1;i<=3;i++)numbers.queue(hit(i),1000+i*130);
 assert.deepEqual(numbers.frames(1129,'mage'),[]);
 for(const [at,amount]of[[1130,100],[1260,200],[1390,300]] as const){const frame=numbers.frames(at,'mage')[0]!;assert.equal(frame.amount,amount);assert.equal(frame.at_ms,at);assert.equal(frame.started_at_ms,1130,'flight origin stays at first impact when the displayed sum increases');assert.equal(frame.age_ms,0);assert.equal(numbers.frames(at,'mage')[0]!.amount,amount);}
});
test('single-hit skills, normal attacks, periodic damage, procs and healing have no yellow total',()=>{
 const numbers=new MultiHitNumbers();numbers.queue(hit(1),1000);
 for(const origin of['normal','periodic','proc','reflect'])for(let i=1;i<=3;i++)numbers.queue(hit(i,{origin,action_id:origin}),1000);
 numbers.queue(hit(8,{type:'heal'}),1000);assert.deepEqual(numbers.frames(1000,'mage'),[]);
});
test('totals separate targets and casters; a new cast replaces the old counter without inheriting its sum',()=>{
 const numbers=new MultiHitNumbers();for(let i=1;i<=2;i++){numbers.queue(hit(i),1000);numbers.queue(hit(i+2,{actor_id:'other'}),1000);numbers.queue(hit(i+4,{target_id:'second',amount:20}),1000);}
 assert.deepEqual(numbers.frames(1000,'mage').map(f=>[f.target,f.amount]),[['boss',200],['second',40]]);assert.equal(numbers.frames(1000,'other')[0]!.amount,200);assert.deepEqual(numbers.frames(1000,'unfocused'),[]);
 numbers.queue(hit(10,{action_id:'cast_2',amount:30}),1100);numbers.queue(hit(11,{action_id:'cast_2',amount:40}),1200);
 assert.equal(numbers.frames(1100,'mage').find(f=>f.target==='boss')!.amount,30);assert.equal(numbers.frames(1200,'mage').find(f=>f.target==='boss')!.amount,70);
});
test('a single-hit area attack never becomes multi-hit by adding up different victims',()=>{
 const numbers=new MultiHitNumbers(),events=[hit(1),hit(2,{target_id:'second'})];for(const e of events)numbers.queue(e,1000);
 assert.equal(multiHitOrdinals(events).size,0);assert.deepEqual(numbers.frames(1000,'mage'),[]);
});
test('replayed events are deduplicated and fully absorbed hits add zero, with no artificial damage',()=>{
 const numbers=new MultiHitNumbers();const first=hit(1,{amount:0});numbers.queue(first,1000);numbers.queue(first,1000);assert.deepEqual(numbers.frames(1000,'mage'),[]);
 numbers.queue(hit(2,{amount:75}),1100);numbers.queue(hit(2,{amount:75}),1100);assert.equal(numbers.frames(1100,'mage')[0]!.amount,75);
});
test('final sum holds then fades; reduced motion uses engine times and still shows the correct total',()=>{
 const numbers=new MultiHitNumbers();numbers.queue(hit(1),1200);numbers.queue(hit(2),1300);
 assert.equal(numbers.frames(1000,'mage',false)[0]!.amount,200);assert.equal(numbers.frames(1300+MULTI_HIT_HOLD_MS,'mage')[0]!.alpha,1);
 assert.equal(numbers.frames(1300+MULTI_HIT_HOLD_MS+MULTI_HIT_FADE_MS/2,'mage')[0]!.alpha,.5);
 assert.deepEqual(numbers.frames(1300+MULTI_HIT_HOLD_MS+MULTI_HIT_FADE_MS,'mage'),[]);
});
test('multi-hit ordinals preserve hit indices and only identify direct hits of one skill on one target',()=>{
 const events=[hit(1),hit(2),hit(3),hit(4,{origin:'normal'}),hit(5,{action_id:'single'})];
 assert.deepEqual([...multiHitOrdinals(events)],[[1,0],[2,1],[3,2]]);
});
