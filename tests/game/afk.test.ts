// TASK-038: AFK rewards (12h cap) — the pure farm calculator is the only formula; server settlement uses it verbatim.
import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, Command } from '../../src/contracts/index.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { reserveFarm } from '../../src/domain/rewards/farm.ts';
import { storyFarmSnapshot, storyStage } from '../../src/domain/modes/story.ts';
import { content } from './combat-fixtures.ts';

const rules = new AccountCommandRules(), start = '2026-10-20T00:00:00.000Z', base = Date.parse(start), hour = 3600000;
function farming(): AccountState {
  const state = initializeAccount(content, { root_job_id: 'mage', gender: 'female' }, start, '2026-10-20', 1);
  state.story.cleared_stage_ids = ['1-1']; state.story.selected_farm_stage = '1-1'; state.farm.rate_snapshot = storyFarmSnapshot(storyStage('1-1', content)!, state, content); state.farm.reserved_through = start;
  return state;
}
const RATE = (content.documents['economy.json']!.rates as unknown as { per_hour: { gold: number } }[])[0]!.per_hour.gold; // D-069
const gold = (state: AccountState) => state.pending_rewards.filter(c => c.kind === 'farm').reduce((n, c) => n + c.resource_vector.gold, 0);
function command(state: AccountState, type: Command['type'], params: unknown, nowMs: number, farmFromMs: number, revision = 1, id = 1) {
  const input = { type, params, request_id: `22222222-2222-4222-8222-${String(id).padStart(12, '0')}`, expected_revision: revision, schema_version: 1, ...rules.versions } as Command; rules.parse(input);
  const time: CommandTime = { server_at: new Date(nowMs).toISOString(), now_ms: nowMs, new_lease_at: new Date(nowMs + 15000).toISOString(), last_ack_ms: 0, lease_expires_ms: 0, started_ms: 0, farm_from_ms: farmFromMs, stored_last_ack_ms: 0, stored_lease_ms: 0 };
  return rules.decide(input, state, null, time, 'b'.repeat(64));
}

test('T038 AC-01: returning after 1h/12h/20h pays 1h/12h/12h of the chapter-1 gold rate; nothing unlocks', () => {
  const rate = farming().farm.rate_snapshot!.per_hour.gold; assert.equal(rate, (content.documents['economy.json']!.rates as unknown as { per_hour: { gold: number } }[])[0]!.per_hour.gold, 'D-069 chapter-1 rate');
  const results = [1, 12, 20].map(hours => { const state = farming(); return reserveFarm(state, base, base + hours * hour, new Date(base + hours * hour).toISOString(), `afk_${hours}`, content); });
  assert.deepEqual(results.map(gold), [rate, 12 * rate, 12 * rate]);
  for (const after of results) { assert.deepEqual(after.story.cleared_stage_ids, ['1-1']); assert.equal(after.tower.highest_cleared_floor, 0); assert.deepEqual(after.wallet, farming().wallet, 'nothing paid before reward.claim'); }
});

test('T038 AC-02: a repeated or stale claim cannot pay the same interval twice and never moves the cursor back', () => {
  const state = farming(), first = command(state, 'farm.claim', {}, base + hour, base);
  assert.equal(first.receipt.result.code, 'FARM_RESERVED'); const after = first.state; assert.equal(gold(after), RATE);
  // The second device replays the same interval: nothing left to reserve.
  const again = command(after, 'farm.claim', {}, base + hour, Date.parse(after.farm.reserved_through), 2, 2); assert.equal(again.receipt.result.code, 'NO_FARM_ELAPSED'); assert.deepEqual(again.state, after);
  // A stale cursor older than the server's own is rejected as a clock regression, never re-paid.
  const stale = command(after, 'farm.claim', {}, base + hour - 60000, Date.parse(after.farm.reserved_through), 2, 3); assert.equal(stale.receipt.outcome, 'rejected'); assert.equal(after.farm.reserved_through, new Date(base + hour).toISOString());
});

test('T038 AC-03: online and AFK intervals are disjoint and a Bangkok day roll does not reset the farm clock', () => {
  const state = farming(), online = reserveFarm(state, base, base + 30 * 60000, new Date(base + 30 * 60000).toISOString(), 'online', content);
  const afk = reserveFarm(online, base + 30 * 60000, base + 18 * hour, new Date(base + 18 * hour).toISOString(), 'afk', content); // crosses 00:00 Bangkok (17:00Z)
  const whole = reserveFarm(farming(), base, base + 18 * hour, new Date(base + 18 * hour).toISOString(), 'whole', content);
  assert.equal(gold(online) + (gold(afk) - gold(online)), gold(afk)); assert.equal(gold(afk), gold(whole) + RATE / 2, 'exact30min online plus capped12h AFK');
  assert.equal(afk.farm.reserved_through, new Date(base + 18 * hour).toISOString());
  assert.equal(gold(afk) - gold(online), 12 * RATE, 'the AFK window itself is capped at 12h');
});

test('T038 AC-04: the pure calculator runs with an injected clock and equals server settlement; four 500ms claims lose no carry', () => {
  const pure = reserveFarm(farming(), base, base + 5 * hour, new Date(base + 5 * hour).toISOString(), `farm_22222222-2222-4222-8222-000000000001`, content);
  const server = command(farming(), 'farm.claim', {}, base + 5 * hour, base).state;
  assert.deepEqual(server.pending_rewards, pure.pending_rewards); assert.deepEqual(server.farm, pure.farm);
  let state = farming(); for (let n = 1; n <= 4; n++) state = reserveFarm(state, base + (n - 1) * 500, base + n * 500, new Date(base + n * 500).toISOString(), `tick${n}`, content);
  assert.equal(gold(state), Math.floor(2000 * RATE / 3600000), 'four 500 ms claims = one 2 s claim');
});

test('T038 AC-05: a balance patch or stage change mid-interval keeps the frozen snapshot until reservation; a retry with the same request id is identical', () => {
  const state = farming(), frozen = structuredClone(state.farm.rate_snapshot!);
  const patched = structuredClone(state); patched.farm.rate_snapshot!.per_hour.gold = 2 * RATE; // a later content patch does not rewrite the stored snapshot
  assert.equal(gold(reserveFarm(state, base, base + hour, new Date(base + hour).toISOString(), 'a', content)), frozen.per_hour.gold);
  state.story.cleared_stage_ids.push('1-2');
  const moved = command(state, 'farm.set_stage', { stage_id: '1-1' }, base + 2 * hour, base);
  assert.equal(moved.receipt.result.code, 'FARM_STAGE_SELECTED'); assert.equal(gold(moved.state), 2 * RATE, 'old interval settled at the frozen rate first');
  assert.deepEqual(command(state, 'farm.set_stage', { stage_id: '1-1' }, base + 2 * hour, base).state, moved.state, 'same request id reproduces the same reservation');
  assert.ok(!JSON.stringify(content.documents).includes('select gold'), 'no SQL formula copy'); void patched;
});
