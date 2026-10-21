import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBattleCredit, canonicalCommand } from '../../src/domain/account/protocol.ts';
import type { Command } from '../../src/contracts/index.ts';
const command: Command = { request_id: '11111111-1111-4111-8111-111111111111', type: 'account.create', params: { root_job_id: 'mage', gender: 'female' }, expected_revision: 0, schema_version: 1, content_version: 'test-content', rules_version: 'test-rules', content_hash: 'a'.repeat(64) };
test('command payload fingerprint excludes receipt UUID and preserves all semantic/version fields', () => {
  assert.equal(canonicalCommand(command), canonicalCommand({ ...command, request_id: '22222222-2222-4222-8222-222222222222' }));
  assert.notEqual(canonicalCommand(command), canonicalCommand({ ...command, params: { root_job_id: 'mage', gender: 'male' } }));
  assert.notEqual(canonicalCommand(command), canonicalCommand({ ...command, expected_revision: 1 }));
  assert.notEqual(canonicalCommand(command), canonicalCommand({ ...command, content_hash: 'b'.repeat(64) }));
});
const base = { last_ack_ms: 100000, lease_expires_ms: 115000, database_now_ms: 102000, game_time_ms: 8000, requested_game_ms: 90000, max_wall_gap_ms: 5000 };
test('requested90000 cannot grant more battle time than actual DB interval', () => {
  assert.deepEqual(calculateBattleCredit(base), { ok: true, game_time_ms: 10000, credited_ms: 2000, ack_at_ms: 102000 });
  assert.deepEqual(calculateBattleCredit({ ...base, database_now_ms: 100000 }), { ok: true, game_time_ms: 8000, credited_ms: 0, ack_at_ms: 100000 });
});
test('credited battle time respects the authorized5000ms gap and requested interval', () => {
  assert.deepEqual(calculateBattleCredit({ ...base, database_now_ms: 112000 }), { ok: true, game_time_ms: 13000, credited_ms: 5000, ack_at_ms: 112000 });
  assert.deepEqual(calculateBattleCredit({ ...base, requested_game_ms: 8250 }), { ok: true, game_time_ms: 8250, credited_ms: 250, ack_at_ms: 102000 });
});
test('DB regression, exact lease expiry and game-time regression never produce partial credit', () => {
  assert.deepEqual(calculateBattleCredit({ ...base, database_now_ms: 99999 }), { ok: false, code: 'CLOCK_REGRESSION' });
  assert.deepEqual(calculateBattleCredit({ ...base, database_now_ms: 115000 }), { ok: false, code: 'BATTLE_LEASE_EXPIRED' });
  assert.deepEqual(calculateBattleCredit({ ...base, requested_game_ms: 7000 }), { ok: false, code: 'BATTLE_TIME_REGRESSION' });
  assert.deepEqual(calculateBattleCredit({ ...base, game_time_ms: NaN }), { ok: false, code: 'INVALID_CLOCK_INPUT' });
});
test('D-071 fast-forward: speed 2/4 credits the DB interval ×speed, still bounded by the scaled gap and the request; other speeds are refused', () => {
  assert.deepEqual(calculateBattleCredit({ ...base, speed: 2 }), { ok: true, game_time_ms: 12000, credited_ms: 4000, ack_at_ms: 102000 });
  assert.deepEqual(calculateBattleCredit({ ...base, speed: 4, database_now_ms: 112000 }), { ok: true, game_time_ms: 28000, credited_ms: 20000, ack_at_ms: 112000 }, '10 s wall at 4× is capped at 5 s × 4');
  assert.deepEqual(calculateBattleCredit({ ...base, speed: 4, requested_game_ms: 9000 }), { ok: true, game_time_ms: 9000, credited_ms: 1000, ack_at_ms: 102000 });
  assert.deepEqual(calculateBattleCredit({ ...base, speed: 1 }), calculateBattleCredit(base));
  for (const speed of [0, 3, 8, 1.5]) assert.deepEqual(calculateBattleCredit({ ...base, speed }), { ok: false, code: 'INVALID_CLOCK_INPUT' }, `speed ${speed}`);
  assert.deepEqual(calculateBattleCredit({ ...base, speed: 4, database_now_ms: 115000 }), { ok: false, code: 'BATTLE_LEASE_EXPIRED' }, 'the wall lease is not scaled');
});
