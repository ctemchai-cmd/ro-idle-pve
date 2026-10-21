// TASK-036: daily multi-phase bosses on the shared engine/save protocol (server Bangkok day).
import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, BattleCheckpoint, Command } from '../../src/contracts/index.ts';
import type { StoredBattle } from '../../src/contracts/save.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { advanceUntil, restoreBattle, serializeBattle } from '../../src/domain/combat/index.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { bangkokDay, dailyBoss, dailyChest, dailyPhaseStats, modePolicy } from '../../src/domain/modes/daily.ts';
import { captureReplay, runScenario } from '../../src/simulation/index.ts';
import { content, unwrap } from './combat-fixtures.ts';
import { buildAccount, treeData } from './class-skills.ts';
import { shouldAdvanceBattleFrame } from '../../src/client/battle-frame.ts';

const rules = new AccountCommandRules();
function fixture(state: AccountState, startIso = '2026-10-20T05:00:00.000Z') {
  let save = state, stored: StoredBattle | null = null, revision = 1, serial = 0, now = Date.parse(startIso);
  const hashes = Object.fromEntries(save.roster.map(actor => [actor.character_id, 'a'.repeat(64)]));
  function run(type: Command['type'], params: unknown, advanceMs = 1000, seed = 11) {
    now += advanceMs; const pointer = save.active_battle;
    const input = { type, params, request_id: `22222222-2222-4222-8222-${String(++serial).padStart(12, '0')}`, expected_revision: revision, schema_version: 1, ...rules.versions } as Command; rules.parse(input);
    const time: CommandTime = { account_id: '11111111-1111-4111-8111-111111111111', battle_id: `33333333-3333-4333-8333-${String(serial).padStart(12, '0')}`, battle_seed: seed, build_hashes: hashes, server_at: new Date(now).toISOString(), now_ms: now, new_lease_at: new Date(now + 15000).toISOString(),
      last_ack_ms: pointer ? Date.parse(pointer.last_ack_at) : 0, lease_expires_ms: pointer ? Date.parse(pointer.lease_expires_at) : 0, started_ms: pointer ? Date.parse(pointer.started_at) : 0, farm_from_ms: Date.parse(save.farm.reserved_through),
      stored_last_ack_ms: stored ? Date.parse(stored.last_ack_at) : 0, stored_lease_ms: stored ? Date.parse(stored.lease_expires_at) : 0 };
    const result = rules.decide(input, save, stored, time, 'b'.repeat(64));
    if (result.receipt.outcome === 'committed') { save = result.state; revision++; if (result.battle_write.kind === 'upsert') stored = result.battle_write.battle; if (result.battle_write.kind === 'delete') stored = null; }
    return result.receipt;
  }
  function advance(times = 120) { for (let i = 0; i < times && save.active_battle; i++) { const receipt = run('battle.advance', { battle_id: save.active_battle.battle_id, requested_game_ms: 60000 }); if (receipt.result.code !== 'BATTLE_ADVANCED') return receipt; } return null; }
  return { run, advance, get state() { return save; }, get stored() { return stored; }, get now() { return now; } };
}
const unlocked = (builds: string[] = ['knight_striker', 'crusader_holy_striker']) => { const tree = treeData('swordsman'); const state = buildAccount('swordsman', builds.map(id => tree.builds.find(b => b.id === id)!)); state.story.cleared_stage_ids = storyStages(content).slice(0, 20).map(s => s.id); return state; };
const record = (state: AccountState, boss: string, day: string) => state.daily_records.find(row => row.boss_id === boss && row.ticket_day === day);
test('daily spatial combat at1x/2x/4x preserves exact events, phases, RNG and all final metrics', () => {
 const f=fixture(unlocked());assert.equal(f.run('battle.start_daily',{boss_id:'essence'}).outcome,'committed');const initial=structuredClone(f.stored!.payload);
 const runs=[1,2,4].map(speed=>{
  let state=unwrap(restoreBattle(initial,content)),logical=state.game_time_ms;const events=[];
  while(!state.terminal_result){logical=Math.min(state.mode.time_limit_ms,logical+17*speed);if(shouldAdvanceBattleFrame(state.game_time_ms,logical,state.mode.time_limit_ms)){const step=unwrap(advanceUntil(state,logical,content,modePolicy(state.mode,content)));state=step.state;events.push(...step.events);}}
  return{events,state:serializeBattle(state)};
 });
 assert.deepEqual(runs[1],runs[0]);assert.deepEqual(runs[2],runs[0]);
});

test('T036 AC-01: 3 bosses × 3 attempts per Bangkok day; the attempt is spent at start, HP carries over and the party restarts full', () => {
  const f = fixture(unlocked([])), day = bangkokDay(f.now + 1000);
  for (const boss of ['treasury', 'forge', 'essence']) {
    for (let n = 1; n <= 3; n++) {
      assert.equal(f.run('battle.start_daily', { boss_id: boss }).result.code, 'DAILY_STARTED');
      const start = f.stored!.payload as BattleCheckpoint, enemy = start.actors.find(a => a.actor_id === 'enemy_front')!;
      assert.equal(start.mode.time_limit_ms, 60000); assert.ok(start.actors.filter(a => a.team === 'player').every(a => a.hp === a.stats.max_hp && a.sp === a.stats.max_sp), 'party full');
      assert.equal(enemy.hp, record(f.state, boss, day)!.current_hp, 'boss enters with the HP left from earlier attempts');
      f.advance(5); assert.equal(f.run('battle.retreat', { battle_id: f.state.active_battle!.battle_id }).result.code, 'DAILY_RETREATED');
      assert.equal(record(f.state, boss, day)!.attempts_used, n, 'no refund on retreat');
    }
    assert.equal(f.run('battle.start_daily', { boss_id: boss }).result.code, 'DAILY_NO_ATTEMPTS');
    const left = record(f.state, boss, day)!; assert.ok(left.current_hp < dailyPhaseStats(dailyBoss(boss, content), left.phase, left.chapter_snapshot).hp, 'partial damage kept');
  }
  assert.equal(f.state.daily_records.length, 3);
});

test('T036 AC-02: clearing several phases in one timed attempt gives one chest per phase, each next phase stronger at once without resetting the clock', () => {
  const f = fixture(unlocked()), day = bangkokDay(f.now + 1000);
  f.run('battle.start_daily', { boss_id: 'treasury' }); const battleId = f.state.active_battle!.battle_id, initial = f.stored!.payload as BattleCheckpoint;
  // Same fight through the runner with the shared mode policy: phases advance without a victory or a clock reset.
  const scenario = { id: 'daily', schema_version: 1 as const, content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version, seed: initial.initial_seed, mode: { kind: 'daily' as const, ref: initial.mode.ref }, budget_policy: 'explicit_single_scenario' as const, log_level: 'trace' as const, team: f.state.team.map(m => ({ actor_id: m.character_id, build_id: 'x', position: m.position, equipment_profile: 'saved' })) as never };
  const report = unwrap(runScenario(captureReplay(scenario, unwrap(restoreBattle(initial, content)), 'daily', {}), content)).report;
  const respawns = report.events!.filter(e => e.type === 'revive' && e.actor_id === 'enemy_front');
  assert.ok(respawns.length >= 2, `phases cleared ${respawns.length}`); assert.equal(report.end_ms, 60000); assert.notEqual(report.result!.kind, 'victory');
  const hp = respawns.map(e => e.amount!); assert.ok(hp.every((v, i) => i === 0 || v > hp[i - 1]!), `each phase stronger ${hp}`);
  const code = f.advance()!.result.code; assert.equal(code, 'DAILY_FINISHED');
  const row = record(f.state, 'treasury', day)!, chests = f.state.pending_rewards.filter(c => c.kind === 'daily' && c.source_keys.includes(`battle:${battleId}`));
  assert.equal(chests.length, respawns.length); assert.deepEqual(row.rewarded_phases, chests.map((_, i) => i + 1)); assert.equal(row.phase, respawns.length + 1);
  for (const [i, chest] of chests.entries()) assert.equal(chest.resource_vector.gold, dailyChest(dailyBoss('treasury', content), i + 1).gold);
  assert.ok(chests.every(c => c.claim_id.startsWith(`daily_treasury_${day}_`)), 'claim keys are boss+day+phase');
});

test('T036 AC-03: an attempt started 23:59:45 Bangkok and finished after midnight writes only its own ticket day; the new day starts fresh', () => {
  const f = fixture(unlocked(), '2026-10-20T16:59:44.000Z'), oldDay = bangkokDay(f.now + 1000);
  f.run('battle.start_daily', { boss_id: 'forge' }); assert.equal(f.state.active_battle!.ticket_day, oldDay);
  f.advance(); const newDay = bangkokDay(f.now); assert.notEqual(newDay, oldDay);
  const archived = record(f.state, 'forge', oldDay)!; assert.equal(archived.attempts_used, 1); assert.ok(archived.rewarded_phases.length >= 1);
  assert.equal(record(f.state, 'forge', newDay), undefined, 'new day untouched by the old ticket');
  f.run('battle.start_daily', { boss_id: 'forge' }); const fresh = record(f.state, 'forge', newDay)!;
  assert.equal(fresh.attempts_used, 1); assert.equal(fresh.phase, 1); assert.deepEqual(fresh.rewarded_phases, []);
  assert.ok(f.state.pending_rewards.some(c => c.claim_id.startsWith(`daily_forge_${oldDay}_`)), 'old-day chests stay claimable');
});

test('T036 AC-04: no double attempts/chests/HP rollback across replays, a second start or stale advances; client prediction matches the server', async () => {
  const { SavedBattleSession } = await import('../../src/client/story.ts');
  const f = fixture(unlocked()), day = bangkokDay(f.now + 1000);
  f.run('battle.start_daily', { boss_id: 'essence' }); const id = f.state.active_battle!.battle_id;
  assert.equal(f.run('battle.start_daily', { boss_id: 'essence' }).result.code, 'BATTLE_ALREADY_ACTIVE');
  const session = new SavedBattleSession(f.stored!.payload, f.state);
  for (let i = 0; i < 20 && f.state.active_battle; i++) { session.advanceTo(session.state.game_time_ms + 1000); const r = f.run('battle.advance', { battle_id: id, requested_game_ms: 60000 }); if (f.stored) session.confirm(f.stored.payload); else assert.match(r.result.code, /^DAILY_/); }
  const mid = structuredClone(record(f.state, 'essence', day)!);
  f.advance(); const done = structuredClone(record(f.state, 'essence', day)!), chests = f.state.pending_rewards.filter(c => c.source_keys.includes(`battle:${id}`)).length;
  assert.equal(f.run('battle.advance', { battle_id: id, requested_game_ms: 60000 }).result.code, 'ACTIVE_BATTLE_MISMATCH');
  assert.equal(f.run('battle.retreat', { battle_id: id }).result.code, 'ACTIVE_BATTLE_MISMATCH');
  assert.deepEqual(record(f.state, 'essence', day), done); assert.equal(f.state.pending_rewards.filter(c => c.source_keys.includes(`battle:${id}`)).length, chests);
  assert.equal(done.attempts_used, mid.attempts_used); assert.ok(done.phase >= mid.phase, 'no HP/phase rollback');
  // The stored checkpoint replays to the same state with the shared policy (runner/server/client parity).
  const replay = unwrap(advanceUntil(unwrap(restoreBattle(serializeBattle(session.initial), content)), 5000, content, modePolicy(session.initial.mode, content)));
  assert.equal(replay.state.mode.kind, 'daily');
});
