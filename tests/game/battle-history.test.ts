import test from 'node:test';
import assert from 'node:assert/strict';
import type { BattlePresentationEvent } from '../../src/contracts/presentation.ts';
import { recordedBattleTimeline, skillHistoryEvents } from '../../src/client/battle-history.ts';
import { SavedBattleSession } from '../../src/client/story.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { serializeBattle } from '../../src/domain/combat/index.ts';
import { canonical } from '../../src/content/value.ts';
import { actor, battle, content, skill } from './combat-fixtures.ts';

const initial = () => battle([actor('main', 'player', [skill('hit'), skill('stop'), skill('empty')]), actor('boss', 'enemy', [skill('doom'), skill('ball')])]);
const event = (sequence: number, at_ms: number, type: BattlePresentationEvent['type'], actor_id: string, skill_id: string, action_id?: string): BattlePresentationEvent => ({ sequence, at_ms, phase: 0, type, actor_id, skill_id, ...(action_id ? { action_id } : {}) });
const trace = () => [
  event(1, 1000, 'cast_start', 'main', 'hit', 'hit_1'),
  event(2, 1000, 'cast_start', 'boss', 'doom', 'doom_1'),
  event(3, 1200, 'cast_resolve', 'main', 'hit', 'hit_1'),
  event(4, 1500, 'normal_attack', 'main', 'normal'),
  event(5, 1500, 'cast_start', 'main', 'stop', 'stop_1'),
  event(6, 1500, 'cast_resolve', 'main', 'stop', 'stop_1'),
  event(7, 1500, 'cast_interrupt', 'boss', 'doom', 'stop_1'),
  event(8, 2000, 'sp_skip', 'main', 'empty'),
  event(9, 2100, 'sphere_skip', 'boss', 'ball'),
  event(10, 3500, 'cast_start', 'main', 'hit', 'hit_2'),
  event(11, 5000, 'cast_start', 'boss', 'doom', 'future'),
];

test('recorded Timeline preserves exact starts, slots, instant casts, skips and interruption attribution', () => {
  const source = trace(), before = canonical(source), result = recordedBattleTimeline(initial(), source, 4000);
  assert.deepEqual(result.entries.map(e => [e.actor_id, e.skill_id, e.start_ms, e.end_ms, e.slot, e.outcome]), [
    ['main', 'hit', 1000, 1200, 0, 'resolved'], ['boss', 'doom', 1000, 1500, 0, 'interrupted'],
    ['main', 'stop', 1500, 1500, 1, 'resolved'], ['main', 'empty', 2000, 2000, 2, 'sp_skip'],
    ['boss', 'ball', 2100, 2100, 1, 'sphere_skip'], ['main', 'hit', 3500, 4000, 0, 'pending'],
  ]);
  const victim = result.entries[1]!, cause = result.entries[2]!;
  assert.equal(victim.interrupted_by, cause.id); assert.deepEqual(cause.interrupts, [{ actor_id: 'boss', skill_id: 'doom', at_ms: 1500 }]);
  assert.ok(result.entries.every(e => e.recovery_end_ms === e.end_ms), 'history never invents ACD');
  assert.equal(canonical(source), before); assert.equal(result.through_ms, 4000);
});

test('skill log excludes normal hits/future entries and keeps original equal-time engine order', () => {
  const events = skillHistoryEvents(trace(), 4000);
  assert.deepEqual(events.map(e => e.sequence), [1, 2, 3, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(events.filter(e => e.at_ms === 1500).map(e => e.type), ['cast_start', 'cast_resolve', 'cast_interrupt']);
  assert.deepEqual(recordedBattleTimeline(initial(), [], 200).entries, []);
});

test('SavedBattleSession records actual advances once; confirm/reading history never forecasts or mutates the live battle', () => {
  const payload = serializeBattle(battle([actor('main', 'player', [skill('probe', 500, 100, 0)]), actor('enemy_front', 'enemy')])); payload.mode.ref = '1-10';
  const account = initializeAccount(content, { root_job_id: 'mage', gender: 'female' }, '2026-10-21T00:00:00.000Z', '2026-10-21', 1), session = new SavedBattleSession(payload, account);
  const actual = session.advanceTo(3000).filter(e => ['cast_start', 'cast_resolve'].includes(e.type)); assert.equal(actual.length, 2);
  assert.deepEqual(session.recordedEvents().map(e => e.sequence), actual.map(e => e.sequence));
  session.confirm(session.checkpoint()); session.advanceTo(3000); session.advanceTo(2000);
  assert.equal(session.recordedEvents().length, 2, 'confirm and old clock do not duplicate log');
  session.timeline = () => { throw new Error('HISTORY_MUST_NOT_FORECAST'); };
  const before = canonical(session.checkpoint()), a = session.recordedTimeline(), b = session.recordedTimeline();
  assert.deepEqual(a, b); assert.equal(a.entries[0]!.end_ms, 2000); assert.equal(canonical(session.checkpoint()), before);
  const copy = session.recordedEvents().slice(); copy.length = 0; assert.equal(session.recordedEvents().length, 2);
});
