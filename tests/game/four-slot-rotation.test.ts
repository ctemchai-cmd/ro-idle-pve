import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, advanceUntil, serializeBattle, restoreBattle, type ActorInput, type BattleState } from '../../src/domain/combat/index.ts';
import { projectBattleTimeline } from '../../src/client/battle-timeline.ts';
import { actor, content, skill, unwrap } from './combat-fixtures.ts';

function initial(actors:ActorInput[]):BattleState {
  return unwrap(createBattle({actors,timing:{skill_interval_base_ms:3000,normal_attack_base_ms:1500},mode:{kind:'story',ref:'four-slots',time_limit_ms:30000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,17));
}
const casts=(events:readonly {type:string;actor_id?:string;at_ms:number}[],id='a')=>events.filter(e=>e.type==='cast_start'&&e.actor_id===id).map(e=>e.at_ms);

test('D147 one active slot keeps all four intervals; leading holes delay the first cast, normals keep attacking',()=>{
  for(const slot of [0,1,2,3]){
    const a=actor('a','player',[skill('hit',0,0,0)],true);
    a.active_slots=[null,null,null,null];a.active_slots[slot]='hit';
    const result=unwrap(advanceUntil(initial([a,actor('b','enemy')]),30000,content));
    // The terminal deadline wins over actions at exactly 30s.
    const expected=[3000*(slot+1),3000*(slot+1)+12000,3000*(slot+1)+24000].filter(t=>t<30000);
    assert.deepEqual(casts(result.events),expected);
    assert.ok(result.events.some(e=>e.type==='normal_attack'&&e.actor_id==='a'&&e.at_ms>expected[0]!&&e.at_ms<expected[0]!+12000));
    assert.equal(result.state.metrics.actors.a!.sp_spent,0);
  }
});
test('D147 two/four skills and empty-only loadouts retain their own intervals without phantom casts',()=>{
  for(const count of [0,2,4]){
    const a=actor('a','player',Array.from({length:count},(_,i)=>skill('s'+i,0,0,0)),true);
    const result=unwrap(advanceUntil(initial([a,actor('b','enemy')]),12000,content));
    assert.deepEqual(casts(result.events),count===0?[]:count===2?[3000,6000]:[3000,6000,9000,12000]);
    if(!count){assert.equal(result.state.actors[0]!.action_phase,'normal_only');assert.equal(result.state.actors[0]!.phase_ready_at,null);}
  }
});
test('D147 CT/ACD apply only to real skills, and ASPD snapshots scale empty slots too',()=>{
  const a=actor('a','player',[skill('hit',1000,500,0)]);
  const result=unwrap(advanceUntil(initial([a,actor('b','enemy')]),20000,content));
  assert.deepEqual(casts(result.events),[3000,16500]); // 1s CT + .5s ACD + four 3s SI
  a.stat_blueprint.derived_offsets.attack_speed=100;
  const fast=unwrap(advanceUntil(initial([a,actor('b','enemy')]),15000,content));
  assert.deepEqual(casts(fast.events),[1500,9000]);
});
test('D147 insufficient SP spends that slot once, rather than accelerating the next occupied slot',()=>{
  const a=actor('a','player',[skill('expensive',0,0,999999),skill('free',0,0,0)]);
  const result=unwrap(advanceUntil(initial([a,actor('b','enemy')]),19000,content));
  assert.deepEqual(result.events.filter(e=>e.actor_id==='a'&&e.type==='sp_skip').map(e=>e.at_ms),[3000,15000]);
  assert.deepEqual(casts(result.events),[6000,18000]);
});
test('D147 Stun waits at the action gate; an interrupted cast remains spent with its normal recovery',()=>{
  const stun=skill('stun',0,0,0);stun.effects=[{id:'stun',type:'apply_status',target:'foe',status_id:'stun',duration_ms:4000,params:{},chance:1}];
  const enemy=actor('b','enemy',[stun]);enemy.stat_blueprint.derived_offsets.attack_speed=50;
  const waiting=unwrap(advanceUntil(initial([actor('a','player',[skill('hit',0,0,0)]),enemy]),19000,content));
  assert.equal(casts(waiting.events)[0],6000);
  const cut=skill('cut',0,0,0);cut.effects=[{id:'cut',type:'interrupt',target:'foe'}];
  const cutter=actor('a','player',[cut]);cutter.stat_blueprint.derived_offsets.attack_speed=-25;
  const result=unwrap(advanceUntil(initial([cutter,actor('b','enemy',[skill('long',3000,500,10)])]),17000,content));
  assert.deepEqual(casts(result.events,'b'),[3000,16500]);
  assert.ok(result.events.some(e=>e.type==='cast_interrupt'&&e.actor_id==='b'&&e.at_ms===4000));
  assert.equal(result.state.metrics.actors.b!.sp_spent,20);
});
test('D147 checkpoint continuation, timeline and 1/2/4x chunking share exact cast/CC/RNG outcomes',async()=>{
  const stop=skill('cut',0,500,0);stop.effects=[{id:'cut',type:'interrupt',target:'foe'}];
  const a=actor('a','player',[stop],true),b=actor('b','enemy',[skill('long',2500,500,0)],true);
  b.stat_blueprint.derived_offsets.attack_speed=100;
  const start=initial([a,b]),whole=unwrap(advanceUntil(start,30000,content));
  assert.ok(whole.events.some(e=>e.type==='cast_interrupt'));
  for(const speed of [1,2,4]){
    let state=start;const events:typeof whole.events=[];
    while(state.game_time_ms<30000){const next=unwrap(advanceUntil(state,Math.min(30000,state.game_time_ms+500*speed),content));state=next.state;events.push(...next.events);}
    assert.deepEqual(state,whole.state);assert.deepEqual(events,whole.events);
  }
  const middle=unwrap(advanceUntil(start,8000,content));
  const resumed=unwrap(advanceUntil(unwrap(restoreBattle(serializeBattle(middle.state),content)),30000,content));
  assert.deepEqual(resumed.state,whole.state);assert.deepEqual(resumed.events,whole.events.filter(e=>e.at_ms>8000));
  const timeline=await projectBattleTimeline(start,content,()=>Promise.resolve());
  assert.deepEqual(timeline.entries.map(e=>[e.actor_id,e.skill_id,e.start_ms]),whole.events.filter(e=>e.type==='cast_start').map(e=>[e.actor_id,e.skill_id,e.at_ms]));
});
