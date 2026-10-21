import test from 'node:test';
import assert from 'node:assert/strict';
import { actor, battle, checkpoint, content, skill, step, unwrap } from './combat-fixtures.ts';
import { advanceUntil, createBattle, restoreBattle, serializeBattle, type ActorInput, type BattleEvent } from '../../src/domain/combat/index.ts';
import { normalTarget } from '../../src/domain/combat/spatial.ts';
import { DemoSession } from '../../src/client/demo.ts';

function spatial(input: ActorInput, x: number, y = 200, speed = 100, range = 60): ActorInput {
  return { ...input, spatial: { x, y, move_speed: speed, radius: 15, normal_range: range } };
}
function setup(actors = [spatial(actor('a', 'player', [], true), 100), spatial(actor('b', 'enemy'), 600, 200, 0)]) {
  return unwrap(createBattle({ actors, mode: { ...battle().mode, reserved_phase_keys: [] }, arena: { width: 720, height: 820, step_ms: 50 } }, content, 2));
}
test('melee walks to actual range; ready attack waits for arrival and cannot burst catch-up hits', () => {
  const initial = setup(), before = step(initial, 4000);
  assert.equal(before.events.filter(e => e.type === 'normal_attack').length, 0);
  assert.equal(before.state.actors[0]!.normal_clock.due_at, 1500);
  assert.equal(before.state.actors[0]!.spatial!.x, 500);
  const after = step(before.state, 7000), hits = after.events.filter(e => e.type === 'normal_attack');
  assert.deepEqual(hits.map(e => e.at_ms), [4400, 5900]);
  for (const hit of hits) assert.ok(Math.hypot(hit.world_source![0] - hit.world_target![0], hit.world_source![1] - hit.world_target![1]) <= 60.00001);
});
test('skills use any range and spend SP on cast start while normal attacks remain out of range', () => {
  const initial = setup([spatial(actor('a', 'player', [skill()], true), 100, 200, 0), spatial(actor('b', 'enemy'), 650, 200, 0)]);
  const cast = step(initial, 1500);
  assert.equal(cast.events.find(e => e.type === 'cast_start')!.at_ms, 1500);
  assert.equal(cast.state.actors[0]!.sp, initial.actors[0]!.sp - 12);
  assert.equal(cast.events.filter(e => e.type === 'normal_attack').length, 0);
  const resolved = step(cast.state, 2500); assert.ok(resolved.events.some(e => e.type === 'cast_resolve'));
  assert.equal(resolved.state.actors[0]!.spatial!.x, 100);
});
test('nearest living enemy wins with stable ID ties, Provoke overrides, stale/dead origin does not', () => {
  const s = checkpoint(setup([spatial(actor('a', 'player'), 100), spatial(actor('b', 'enemy'), 500), spatial(actor('c', 'enemy'), 200)]));
  const [a, b, c] = s.actors;
  assert.equal(normalTarget(a!, s.actors)!.actor_id, 'c');
  a!.statuses.push({ instance_id: 'taunt', status_id: 'provoke', params: {}, applied_at: 0, expires_at: 5000, next_tick_at: null, source: { instance_id: 'p', definition_id: 'provoke', owner_actor_id: 'b', origin_actor_id: 'b', origin_life_epoch: 0 }, carrier_actor_id: a!.actor_id, offense_snapshot: structuredClone(a!.stats), weapon_element_snapshot: 'neutral' });
  assert.equal(normalTarget(a!, s.actors)!.actor_id, 'b');
  b!.hp = 0; assert.equal(normalTarget(a!, s.actors)!.actor_id, 'c');
  b!.hp = 100; b!.life_epoch = 1; assert.equal(normalTarget(a!, s.actors)!.actor_id, 'c');
  a!.statuses = []; b!.spatial!.x = c!.spatial!.x; assert.equal(normalTarget(a!, s.actors)!.actor_id, 'b');
});
test('hard CC stops walking while queue time continues; casting stops walking but silence does not', () => {
  const frozen = checkpoint(setup([spatial(actor('a', 'player', [skill()], true), 100), spatial(actor('b', 'enemy'), 650, 200, 0)]));
  const a = frozen.actors[0]!;
  a.statuses.push({ instance_id: 'cc', status_id: 'stun', params: {}, applied_at: 0, expires_at: 2000, next_tick_at: null, source: { instance_id: 'stun', definition_id: 'stun', owner_actor_id: 'b', origin_actor_id: 'b', origin_life_epoch: 0 }, carrier_actor_id: a!.actor_id, offense_snapshot: structuredClone(a!.stats), weapon_element_snapshot: 'neutral' });
  const stunned = step(frozen, 1800); assert.equal(stunned.state.actors[0]!.spatial!.x, 100); assert.equal(stunned.state.actors[0]!.phase_ready_at, 1500); assert.equal(stunned.state.actors[0]!.sp, a.sp);
  const released = step(stunned.state, 2000); assert.ok(released.events.some(e => e.type === 'cast_start')); const x = released.state.actors[0]!.spatial!.x;
  assert.equal(step(released.state, 2500).state.actors[0]!.spatial!.x, x);
  const silenced = checkpoint(setup()); silenced.actors[0]!.statuses = [{ ...a.statuses[0]!, status_id: 'silence' }];
  assert.ok(step(silenced, 1000).state.actors[0]!.spatial!.x > 100);
});
test('checkpoint resume mid-walk and irregular UI calls match one fast run exactly, including RNG/events', () => {
  const session = new DemoSession('field', 2), fast = unwrap(advanceUntil(session.initial, 90000, session.content));
  let state = session.initial; const events: BattleEvent[] = []; let i = 0;
  while (!state.terminal_result) { const next = Math.min(90000, state.game_time_ms + [17, 83, 139, 1, 417][i++ % 5]!); const result = unwrap(advanceUntil(state, next, session.content)); state = result.state; events.push(...result.events); if (i === 11) state = unwrap(restoreBattle(serializeBattle(state), session.content)); }
  assert.deepEqual(state, fast.state); assert.deepEqual(events, fast.events);
});
test('movement bounds and ally separation are deterministic; invalid profiles and missing motion timers fail', () => {
  const initial = setup([spatial(actor('a', 'player', [], true), 100), spatial(actor('c', 'player', [], true), 100, 205), spatial(actor('b', 'enemy'), 600, 200, 0)]);
  const state = step(initial, 5000).state;
  for (const a of state.actors) { assert.ok(a.spatial!.x >= 15 && a.spatial!.x <= 705); assert.ok(a.spatial!.y >= 15 && a.spatial!.y <= 805); }
  const [a, , c] = state.actors; assert.ok(Math.hypot(a!.spatial!.x - c!.spatial!.x, a!.spatial!.y - c!.spatial!.y) >= 35.9);
  const missing = serializeBattle(initial); missing.pending_events = missing.pending_events.filter(e => e.kind !== 'motion_tick'); assert.equal(restoreBattle(missing, content).ok, false);
  const future = serializeBattle(initial); future.actors[0]!.spatial!.updated_at = 100; assert.equal(restoreBattle(future, content).ok, false);
  const invalid = [spatial(actor('a', 'player'), -1), spatial(actor('b', 'enemy'), 600)]; assert.equal(createBattle({ actors: invalid, arena: { width: 720, height: 820, step_ms: 50 }, mode: { ...battle().mode, reserved_phase_keys: [] } }, content, 1).ok, false);
});
