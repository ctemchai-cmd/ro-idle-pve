import { dailyRewardCount } from '../../src/client/daily-rewards.ts';
// TASK-036: daily multi-phase bosses on the shared engine/save protocol (server Bangkok day).
import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, BattleCheckpoint } from '../../src/contracts/index.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { advanceUntil, restoreBattle, serializeBattle } from '../../src/domain/combat/index.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { bangkokDay, dailyBoss, dailyChest, dailyPhaseStats, modePolicy } from '../../src/domain/modes/daily.ts';
import { captureReplay, runScenario } from '../../src/simulation/index.ts';
import { content, unwrap } from './combat-fixtures.ts';
import { fixture, unlocked } from './daily-fixtures.ts';
import { shouldAdvanceBattleFrame } from '../../src/client/battle-frame.ts';

const rules = new AccountCommandRules();
const record = (state: AccountState, boss: string, day: string) => state.daily_records.find(row => row.boss_id === boss && row.ticket_day === day);
test('D150 daily command accepts a completed chapter9 snapshot, preserves Bangkok attempt/HP semantics and serializes its battle',()=>{
 const state=unlocked();state.story.cleared_stage_ids=storyStages(content).filter(s=>s.chapter<=9).map(s=>s.id);
 const f=fixture(state,'2026-10-23T05:00:00.000Z');assert.equal(f.run('battle.start_daily',{boss_id:'essence'}).result.code,'DAILY_STARTED');
 const row=record(f.state,'essence','2026-10-23')!;assert.equal(row.chapter_snapshot,9);assert.equal(row.attempts_used,0);assert.equal((f.stored!.payload as BattleCheckpoint).mode.ref,'essence@9');assert.doesNotThrow(()=>rules.validateAccount(f.state));
 const hp=row.current_hp;assert.equal(f.run('battle.retreat',{battle_id:f.state.active_battle!.battle_id},0).result.code,'DAILY_RETREATED');assert.equal(record(f.state,'essence','2026-10-23')!.attempts_used,0);assert.equal(record(f.state,'essence','2026-10-23')!.current_hp,hp);
});
test('daily spatial combat at1x/2x/4x preserves exact events, phases, RNG and all final metrics', () => {
 const f=fixture(unlocked());assert.equal(f.run('battle.start_daily',{boss_id:'essence'}).outcome,'committed');const initial=structuredClone(f.stored!.payload);
 const runs=[1,2,4].map(speed=>{
  let state=unwrap(restoreBattle(initial,content)),logical=state.game_time_ms;const events=[];
  while(!state.terminal_result){logical=Math.min(state.mode.time_limit_ms,logical+17*speed);if(shouldAdvanceBattleFrame(state.game_time_ms,logical,state.mode.time_limit_ms)){const step=unwrap(advanceUntil(state,logical,content,modePolicy(state.mode,content)));state=step.state;events.push(...step.events);}}
  return{events,state:serializeBattle(state)};
 });
 assert.deepEqual(runs[1],runs[0]);assert.deepEqual(runs[2],runs[0]);
});

test('T036 AC-01: 3 bosses × 3 attempts per Bangkok day; the attempt is spent with rewards, HP carries over and the party restarts full', () => {
  const f = fixture(unlocked([])), day = bangkokDay(f.now + 1000);
  for (const boss of ['treasury', 'forge', 'essence']) {
    for (let n = 1; n <= 3; n++) {
      assert.equal(f.run('battle.start_daily', { boss_id: boss }).result.code, 'DAILY_STARTED');
      const start = f.stored!.payload as BattleCheckpoint, enemy = start.actors.find(a => a.actor_id === 'enemy_front')!;
      assert.equal(start.mode.time_limit_ms, 60000); assert.ok(start.actors.filter(a => a.team === 'player').every(a => a.hp === a.stats.max_hp && a.sp === a.stats.max_sp), 'party full');
      assert.equal(enemy.hp, record(f.state, boss, day)!.current_hp, 'boss enters with the HP left from earlier attempts');
      f.advance(5); assert.equal(f.run('battle.retreat', { battle_id: f.state.active_battle!.battle_id }).result.code, 'DAILY_RETREATED');
      const claims=f.state.pending_rewards.filter(c=>c.daily_attempt?.boss_id===boss&&!c.daily_attempt.charged);
      if(claims.length) f.run('reward.claim',{claim_ids:claims.map(c=>c.claim_id)});
      assert.ok(record(f.state, boss, day)!.attempts_used <= n,'only rewarded runs paid');
    }
    assert.equal(f.run('battle.start_daily', { boss_id: boss }).result.code, 'DAILY_STARTED');
    f.run('battle.retreat',{battle_id:f.state.active_battle!.battle_id},0);
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
  assert.equal(chests.length, 1); assert.equal(dailyRewardCount(chests),respawns.length); assert.deepEqual(row.rewarded_phases, respawns.map((_, i) => i + 1)); assert.equal(row.phase, respawns.length + 1);
  assert.equal(chests[0]!.resource_vector.gold,respawns.reduce((sum,_,i)=>sum+dailyChest(dailyBoss('treasury',content),i+1).gold!,0));
  assert.ok(chests.every(c=>c.source_keys.some(k=>k.startsWith(`daily:treasury:${day}:`))),'batch retains per-phase claim keys');
});

test('T036 AC-03: an attempt started 23:59:45 Bangkok and finished after midnight writes only its own ticket day; the new day starts fresh', () => {
  const f = fixture(unlocked(), '2026-10-20T16:59:44.000Z'), oldDay = bangkokDay(f.now + 1000);
  f.run('battle.start_daily', { boss_id: 'forge' }); assert.equal(f.state.active_battle!.ticket_day, oldDay);
  f.advance(); const newDay = bangkokDay(f.now); assert.notEqual(newDay, oldDay);
  const archived = record(f.state, 'forge', oldDay)!; assert.equal(archived.attempts_used, 0); assert.ok(archived.rewarded_phases.length >= 1);
  assert.equal(record(f.state, 'forge', newDay), undefined, 'new day untouched by the old ticket');
  f.run('battle.start_daily', { boss_id: 'forge' }); const fresh = record(f.state, 'forge', newDay)!;
  assert.equal(fresh.attempts_used, 0); assert.equal(fresh.phase, 1); assert.deepEqual(fresh.rewarded_phases, []);
  assert.ok(f.state.pending_rewards.some(c => c.source_keys.some(k=>k.startsWith(`daily:forge:${oldDay}:`))), 'old-day chests stay claimable');
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
