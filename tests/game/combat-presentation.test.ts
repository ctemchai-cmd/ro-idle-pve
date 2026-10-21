import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DemoSession, DEMO_ENCOUNTERS } from '../../src/client/demo.ts';
import { createBattle, advanceUntil, serializeBattle, restoreBattle } from '../../src/domain/combat/index.ts';
import { projectilePoint, impactDelay, isFocusedDamage, validateCombatVisuals } from '../../src/renderer/projectiles.ts';
import { skillIntervalMs } from '../../src/domain/math/index.ts';
import { actor, content, skill, unwrap } from './combat-fixtures.ts';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
import type { BattlePresentationEvent } from '../../src/contracts/presentation.ts';
const index = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetIndex;

test('demo bosses are solo, field retains monsters;3s skill and1.5s normal bases scale with each actor ASPD', () => {
  for (const scene of DEMO_ENCOUNTERS) {
    const session = new DemoSession(scene.id);
    assert.equal(session.initial.actors.filter(row => row.team === 'enemy').length, scene.id === 'field' ? 3 : 1);
    assert.deepEqual(session.initial.timing, { skill_interval_base_ms: 3000, normal_attack_base_ms: 1500 });
    const firstDue = Math.min(...session.initial.actors.map(actor => actor.phase_ready_at!));
    session.advanceTo(firstDue - 1); assert.equal(session.history.filter(event => event.type === 'cast_start').length, 0);
    assert.ok(session.history.some(event => event.type === 'normal_attack' && event.at_ms < firstDue));
    session.advanceTo(3000);
    for (const actor of session.initial.actors) assert.equal(session.history.find(event => event.type === 'cast_start' && event.actor_id === actor.actor_id)!.at_ms, actor.phase_ready_at);
  }
  assert.equal(skillIntervalMs(125, 3000), 2400); assert.equal(skillIntervalMs(125, 1500), 1200);
});
test('explicit timing survives checkpoint restore and rejects invalid tuning; baseline remains replayable', () => {
  const mode = { kind: 'story' as const, ref: 'timing-test', time_limit_ms: 90000, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] };
  const actors = [actor('a', 'player', [skill()]), actor('b', 'enemy')];
  const initial = unwrap(createBattle({ actors, mode, timing: { skill_interval_base_ms: 3000, normal_attack_base_ms: 1500 } }, content, 2));
  const mid = unwrap(advanceUntil(initial, 3275, content)).state;
  const restored = unwrap(restoreBattle(serializeBattle(mid), content));
  assert.deepEqual(unwrap(advanceUntil(restored, 90000, content)), unwrap(advanceUntil(mid, 90000, content)));
  const legacy = unwrap(createBattle({ actors, mode }, content, 2)); assert.equal(legacy.timing, undefined); assert.equal(legacy.actors.find(row => row.actor_id === 'a')!.phase_ready_at, 1500);
  for (const base of [0, -1, NaN, Infinity, 60001]) assert.equal(createBattle({ actors, mode, timing: { skill_interval_base_ms: base, normal_attack_base_ms: 1500 } }, content, 2).ok, false);
});
test('projectiles travel continuously from the shooter to the actual target with deterministic staggering', () => {
  const spec = index.combat_visuals.skills.archer_double_strafe!.special_sfx[0]!;
  const from = [10, 20], to = [210, 80];
  assert.equal(projectilePoint(spec, from, to, 0, 0), null);
  const start = projectilePoint(spec, from, to, spec.release_ms, 0)!; assert.equal(start.x, 10); assert.equal(start.y, 20);
  const end = projectilePoint(spec, from, to, spec.release_ms + spec.travel_ms, 0)!; assert.equal(end.x, 210); assert.ok(Math.abs(end.y - 80) < 1e-8);
  let previous = start;
  for (let elapsed = spec.release_ms + 5; elapsed <= spec.release_ms + spec.travel_ms; elapsed += 5) { const current = projectilePoint(spec, from, to, elapsed, 0)!; assert.ok(current.x >= previous.x); assert.ok(Math.hypot(current.x - previous.x, current.y - previous.y) < 5); previous = current; }
  assert.equal(projectilePoint(spec, from, to, spec.release_ms, 1), null);
  assert.equal(impactDelay([spec], 1), spec.release_ms + spec.travel_ms + spec.stagger_ms);
});
test('focus filters by outgoing source, never hides or changes actual damage events', () => {
  const event: BattlePresentationEvent = { type: 'damage', actor_id: 'npc_archer', target_id: 'enemy_front', amount: 30, at_ms: 0, phase: 3, sequence: 1 };
  assert.ok(isFocusedDamage(event, 'npc_archer')); assert.ok(!isFocusedDamage(event, 'main')); assert.ok(!isFocusedDamage(event, 'enemy_front')); assert.ok(!isFocusedDamage({ ...event, amount: 0 }, 'npc_archer'));
});
test('special_sfx validates shapes, bounds, logical skill IDs and native glyph/frame mappings', () => {
  validateCombatVisuals(index.combat_visuals, Object.keys(index.skills));
  for (const mutate of [(v: typeof index.combat_visuals) => { v.skills.archer_double_strafe!.special_sfx[0]!.travel_ms = 0; }, (v: typeof index.combat_visuals) => { v.skills.archer_double_strafe!.special_sfx[0]!.count = 999; }]) { const value = structuredClone(index.combat_visuals); mutate(value); assert.throws(() => validateCombatVisuals(value, Object.keys(index.skills)), /INVALID_COMBAT_VISUALS/); }
  const font = JSON.parse(readFileSync('assets/ro/' + index.combat_visuals.numbers.meta, 'utf8'));
  assert.ok(index.combat_visuals.numbers.digit_frames.every(frame => font.sprite_sheet.source_frame_indices[frame] === frame));
  const critical = JSON.parse(readFileSync('assets/ro/' + index.combat_visuals.numbers.critical_meta, 'utf8'));
  assert.equal(critical.sprite_sheet.source_frame_indices[index.combat_visuals.numbers.critical_frame], 3);
});
