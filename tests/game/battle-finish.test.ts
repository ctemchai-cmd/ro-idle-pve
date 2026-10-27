import test from 'node:test';
import assert from 'node:assert/strict';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import type { AccountState, BattleCheckpoint, Command } from '../../src/contracts/index.ts';
import type { StoredBattle } from '../../src/contracts/save.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { SavedBattleSession } from '../../src/client/story.ts';
import { createBattle, advanceUntil, serializeBattle, restoreBattle } from '../../src/domain/combat/index.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { modePolicy } from '../../src/domain/modes/daily.ts';
import { content, unwrap, actor } from './combat-fixtures.ts';

const epoch = Date.parse('2026-10-20T16:59:40.000Z'), owner = '11111111-1111-4111-8111-111111111111';
function fixture() {
  const rules = new AccountCommandRules();
  let state = initializeAccount(content, { root_job_id: 'mage', gender: 'male' }, new Date(epoch).toISOString(), '2026-10-20', 1);
  for (const key of Object.keys(state.wallet) as (keyof AccountState['wallet'])[]) state.wallet[key] = 10_000_000;
  for (const a of [...state.roster]) state = applySandboxRoster(state, 'character.level_up', { character_id: a.character_id, target_level: 20 });
  for (const a of [...state.roster]) state = applySandboxRoster(state, 'character.allocate_status', { character_id: a.character_id, allocation: { ...a.primary_stats, vit: 20 } });
  state.story.cleared_stage_ids = storyStages(content).slice(0, 20).map(s => s.id);
  let stored: StoredBattle | null = null, revision = 1, serial = 0, now = epoch;
  const input = (type: Command['type'], params: unknown) => ({ type, params, request_id: `22222222-2222-4222-8222-${String(++serial).padStart(12, '0')}`, expected_revision: revision, schema_version: 1, ...rules.versions }) as Command;
  function run(type: Command['type'], params: unknown, delta = 0) {
    now += delta; const pointer = state.active_battle, command = input(type, params); rules.parse(command);
    const time: CommandTime = { account_id: owner, battle_id: `33333333-3333-4333-8333-${String(serial).padStart(12, '0')}`, battle_seed: 1, build_hashes: Object.fromEntries(state.roster.map(a => [a.character_id, 'a'.repeat(64)])), server_at: new Date(now).toISOString(), now_ms: now, new_lease_at: new Date(now + 15000).toISOString(), last_ack_ms: pointer ? Date.parse(pointer.last_ack_at) : 0, lease_expires_ms: pointer ? Date.parse(pointer.lease_expires_at) : 0, started_ms: pointer ? Date.parse(pointer.started_at) : 0, farm_from_ms: Date.parse(state.farm.reserved_through), stored_last_ack_ms: stored ? Date.parse(stored.last_ack_at) : 0, stored_lease_ms: stored ? Date.parse(stored.lease_expires_at) : 0 };
    const proposal = rules.decide(command, state, stored, time, 'b'.repeat(64));
    if (proposal.receipt.outcome === 'committed') { state = proposal.state; revision++; if (proposal.battle_write.kind === 'upsert') stored = proposal.battle_write.battle; if (proposal.battle_write.kind === 'delete') stored = null; }
    return proposal;
  }
  return { rules, input, run, get state() { return state; }, get stored() { return stored; }, get revision() { return revision; }, replace(payload: BattleCheckpoint) { stored!.payload = payload; } };
}
const replay = (stored: StoredBattle) => { const initial = unwrap(restoreBattle(stored.payload, content)); return unwrap(advanceUntil(initial, initial.mode.time_limit_ms, content, modePolicy(initial.mode, content))).state; };

test('finish replays the same seeded battle after >15s without any intermediate checkpoint/revision; Story rewards once', () => {
  const f = fixture(); f.run('battle.start_story', { stage_id: '2-1' }); const id = f.state.active_battle!.battle_id;
  const before = structuredClone(f.state), initial = structuredClone(f.stored!), revision = f.revision;
  const session = new SavedBattleSession(initial.payload, f.state); for (let ms = 50; ms <= 90000 && !session.state.terminal_result; ms += 50) session.advanceTo(ms);
  assert.deepEqual(session.state.terminal_result, replay(initial).terminal_result);
  assert.deepEqual(f.state, before); assert.deepEqual(f.stored, initial); assert.equal(f.revision, revision);
  const result = f.run('battle.finish', { battle_id: id }, 30000); assert.equal(result.receipt.result.code, 'STORY_WON');
  assert.equal(f.revision, revision + 1); assert.equal(f.stored, null); assert.ok(f.state.story.cleared_stage_ids.includes('2-1'));
  const after = structuredClone(f.state); assert.equal(f.run('battle.finish', { battle_id: id }).receipt.outcome, 'rejected'); assert.deepEqual(f.state, after);
});

test('finish refuses too-early, foreign id, expired ticket, clock regression and client-supplied results without paying', () => {
  for (const [delta, params, code] of [[0, {}, 'BATTLE_FINISH_TOO_EARLY'], [1000, { battle_id: 'other' }, 'ACTIVE_BATTLE_MISMATCH'], [180000, {}, 'BATTLE_TICKET_EXPIRED'], [-1, {}, 'CLOCK_REGRESSION']] as const) {
    const f = fixture(); f.run('battle.start_story', { stage_id: '2-1' }); const before = structuredClone(f.state);
    const result = f.run('battle.finish', { battle_id: f.state.active_battle!.battle_id, ...params }, delta);
    assert.equal(result.receipt.result.code, code); assert.deepEqual(f.state, before); assert.equal(result.battle_write.kind, 'keep');
    assert.throws(() => f.rules.parse({ ...f.input('battle.finish', { battle_id: 'x', damage: 999999 }), wallet: { gold: 999999 } }));
  }
});

test('finish handles timeout and defeat without first-clear rewards; no heartbeat is required', () => {
  for (const kind of ['time_limit', 'defeat'] as const) {
    const f = fixture(); f.run('battle.start_story', { stage_id: '2-1' });
    const mode = (f.stored!.payload as BattleCheckpoint).mode;
    if (kind === 'time_limit') f.replace(serializeBattle(unwrap(createBattle({ actors: [actor('main', 'player'), actor('enemy_front', 'enemy')], mode }, content, 1))));
    else { const payload = structuredClone(f.stored!.payload) as BattleCheckpoint; for (const a of payload.actors.filter(a => a.team === 'player')) a.hp = 1; f.replace(payload); }
    const expected = replay(f.stored!); assert.equal(expected.terminal_result!.kind, kind);
    const result = f.run('battle.finish', { battle_id: f.state.active_battle!.battle_id }, 90000);
    assert.equal(result.receipt.result.code, kind === 'time_limit' ? 'STORY_TIME_LIMIT' : 'STORY_DEFEATED');
    assert.equal(f.state.active_battle, null); assert.ok(!f.state.pending_rewards.some(c => c.kind === 'story'));
  }
});

test('Tower and daily finish match shared replay; daily crosses midnight and preserves only the ticket day/partial HP', () => {
  for (const mode of ['tower', 'daily'] as const) {
    const f = fixture(); f.run(mode === 'tower' ? 'battle.start_tower' : 'battle.start_daily', mode === 'tower' ? { floor: 1 } : { boss_id: 'treasury' });
    const initial = structuredClone(f.stored!), expected = replay(initial), id = f.state.active_battle!.battle_id;
    const result = f.run('battle.finish', { battle_id: id }, 70000); assert.equal(result.receipt.outcome, 'committed'); assert.equal(f.state.active_battle, null);
    if (mode === 'tower') assert.equal(f.state.tower.highest_cleared_floor, expected.terminal_result!.kind === 'victory' ? 1 : 0);
    else {
      const record = f.state.daily_records.find(r => r.boss_id === 'treasury')!;
      assert.equal(record.ticket_day, '2026-10-20'); assert.equal(record.attempts_used, 0);
      assert.equal(record.current_hp, Math.max(1, expected.actors.find(a => a.actor_id === 'enemy_front')!.hp));
      assert.deepEqual(record.rewarded_phases.map(String), expected.mode.reserved_phase_keys);
      assert.equal(f.state.daily_records.length, 1);
    }
  }
});

test('manual daily retreat replays only bounded played time; reconnect without a time claim leaves the initial daily HP/attempt', () => {
  for (const manual of [true, false]) {
    const f = fixture(); f.run('battle.start_daily', { boss_id: 'forge' }); const initial = structuredClone(f.stored!), id = f.state.active_battle!.battle_id;
    const start = unwrap(restoreBattle(initial.payload, content)); const target = manual ? 5000 : 0;
    const expected = unwrap(advanceUntil(start, target, content, modePolicy(start.mode, content))).state;
    const result = f.run('battle.retreat', { battle_id: id, ...(manual ? { requested_game_ms: 5000 } : {}) }, 20000);
    assert.equal(result.receipt.result.code, 'DAILY_RETREATED');
    const record = f.state.daily_records.find(r => r.boss_id === 'forge')!;
    assert.equal(record.attempts_used, 0); assert.equal(record.current_hp, Math.max(1, expected.actors.find(a => a.actor_id === 'enemy_front')!.hp));
  }
  const f = fixture(); f.run('battle.start_daily', { boss_id: 'forge' }); const initial = unwrap(restoreBattle(f.stored!.payload, content)), expected = unwrap(advanceUntil(initial, 400, content, modePolicy(initial.mode, content))).state;
  f.run('battle.retreat', { battle_id: f.state.active_battle!.battle_id, requested_game_ms: 90000 }, 100);
  assert.equal(f.state.daily_records[0]!.current_hp, Math.max(1, expected.actors.find(a => a.actor_id === 'enemy_front')!.hp));
});
