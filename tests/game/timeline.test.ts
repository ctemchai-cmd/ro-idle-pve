import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoSession, DEMO_ENCOUNTERS } from '../../src/client/demo.ts';
import { projectBattleTimeline } from '../../src/client/battle-timeline.ts';
import { advanceUntil, serializeBattle, type BattleEvent } from '../../src/domain/combat/index.ts';
import { canonical } from '../../src/content/value.ts';
import { actor, battle, content, skill, step } from './combat-fixtures.ts';

test('timeline replay matches every real cast/skip and recovery barrier in all demo encounters', async () => {
  let casts = 0, interrupted = 0, skipped = 0, instant = 0, recoveries = 0;
  for (const scene of DEMO_ENCOUNTERS) {
    const session = new DemoSession(scene.id), initial = canonical(session.initial);
    // Projection is allowed while live battle is already underway.
    session.advanceTo(1750); const live = canonical(session.state), history = canonical(session.history);
    const pending = session.timeline(); assert.equal(session.timeline(), pending);
    const projection = await pending;
    assert.equal(canonical(session.initial), initial); assert.equal(canonical(session.state), live); assert.equal(canonical(session.history), history);
    const actual = advanceUntil(session.initial, session.initial.mode.time_limit_ms, session.content); assert.ok(actual.ok);
    assert.equal(projection.through_ms, actual.value.state.game_time_ms);
    assert.deepEqual(projection.entries.map(entry => [entry.actor_id, entry.skill_id, entry.start_ms]), actual.value.events.filter(event => ['cast_start', 'sp_skip', 'sphere_skip'].includes(event.type)).map(event => [event.actor_id, event.skill_id, event.at_ms]));
    let checkpoint = session.initial;
    for (const entry of [...projection.entries].sort((a, b) => a.end_ms - b.end_ms)) {
      assert.ok(entry.start_ms <= entry.end_ms && entry.end_ms <= entry.recovery_end_ms);
      assert.equal(session.initial.actors.find(actor => actor.actor_id === entry.actor_id)!.active_slots[entry.slot], entry.skill_id);
      if (entry.outcome === 'sp_skip' || entry.outcome === 'sphere_skip') { skipped++; continue; }
      casts++;
      const resolved: BattleEvent | undefined = actual.value.events.find(event => event.actor_id === entry.actor_id && event.skill_id === entry.skill_id && event.at_ms === entry.end_ms && (event.type === 'cast_resolve' || event.type === 'cast_interrupt'));
      if (entry.outcome !== 'pending') assert.equal(resolved?.type, entry.outcome === 'resolved' ? 'cast_resolve' : 'cast_interrupt');
      if (entry.outcome === 'interrupted') interrupted++;
      if (entry.end_ms === entry.start_ms && entry.outcome === 'resolved') instant++;
      const step = advanceUntil(checkpoint, entry.end_ms, session.content); assert.ok(step.ok); checkpoint = step.value.state;
      const actor = checkpoint.actors.find(actor => actor.actor_id === entry.actor_id)!;
      if (actor.phase_ready_at !== null && actor.action_phase === 'after_cast' && actor.phase_started_at === entry.end_ms) {
        assert.equal(entry.recovery_end_ms, Math.min(actor.phase_ready_at!, projection.through_ms)); recoveries++;
      }
    }
  }
  assert.ok(casts > 50 && recoveries > 20 && instant > 0, JSON.stringify({ casts, recoveries, interrupted, skipped, instant }));
});
test('Timeline interruption and cast-duration facts match a controlled unequal-speed cast, independent of demo balance', async () => {
  const stop = skill('stop', 0, 500, 0); stop.effects = [{ id: 'cut', type: 'interrupt', target: 'foe' }];
  const boss = actor('b', 'enemy', [skill('long_cast', 2000, 500, 0)]); boss.stat_blueprint.derived_offsets.attack_speed = 200;
  const initial = battle([actor('a', 'player', [stop]), boss]), projection = await projectBattleTimeline(initial, content, () => Promise.resolve());
  const actual = step(initial, 1500), start = actual.events.find(e => e.type === 'cast_start' && e.actor_id === 'b')!, cut = actual.events.find(e => e.type === 'cast_interrupt' && e.actor_id === 'b')!;
  assert.equal(start.at_ms, 500); assert.equal(start.cast_duration_ms, 2000); assert.equal(cut.at_ms, 1500);
  assert.equal(actual.events.find(e => e.type === 'cast_start' && e.actor_id === 'a')!.cast_duration_ms, 0);
  const projected = projection.entries.find(e => e.actor_id === 'b')!;
  assert.equal(projected.start_ms, start.at_ms); assert.equal(projected.end_ms, cut.at_ms); assert.equal(projected.outcome, 'interrupted');
  assert.equal(actual.state.metrics.actors.b!.casts_interrupted, 1);
});
test('timeline yields between engine chunks and a new rotation has its own forecast', async () => {
  const a = new DemoSession(), slots = [...a.initial.actors.find(row => row.actor_id === 'main')!.active_slots]; [slots[0], slots[1]] = [slots[1]!, slots[0]!];
  const b = new DemoSession('boss', 2, { main: slots }); let yielded = 0;
  const first = await projectBattleTimeline(a.initial, a.content, async () => { yielded++; });
  const second = await b.timeline(); assert.ok(yielded > 1);
  assert.notEqual(first.entries.find(entry => entry.actor_id === 'main')!.skill_id, second.entries.find(entry => entry.actor_id === 'main')!.skill_id);
});

test('timeline includes exact SP skips for a resource-starved checkpoint without inventing cooldowns', async () => {
  const session = new DemoSession(), depleted = serializeBattle(session.initial);
  for (const actor of depleted.actors) if (actor.team === 'player') actor.sp = 0;
  const projection = await projectBattleTimeline(depleted, session.content, () => Promise.resolve());
  const actual = advanceUntil(depleted, depleted.mode.time_limit_ms, session.content); assert.ok(actual.ok);
  const skips = projection.entries.filter(entry => entry.outcome === 'sp_skip'); assert.ok(skips.length > 0);
  assert.deepEqual(skips.map(entry => [entry.actor_id, entry.skill_id, entry.start_ms]), actual.value.events.filter(event => event.type === 'sp_skip').map(event => [event.actor_id, event.skill_id, event.at_ms]));
  for (const entry of skips) assert.ok(entry.start_ms === entry.end_ms && entry.end_ms === entry.recovery_end_ms);
});
test('D-060: an interrupting skill is credited on the timeline and the interrupted cast points back to it', async () => {
  const { resolveSkill } = await import('../../src/domain/build/resolve-skill.ts');
  const bash = structuredClone(resolveSkill('swordsman_bash', 10, content).definition) as ReturnType<typeof skill>;
  const long = skill('boss_long_cast', 2500, 200, 0, 1);
  for (let seed = 1; seed < 40; seed++) {
    const caster = actor('hero', 'player', [bash]); caster.stat_blueprint.derived_offsets.max_sp = 100000;
    const timeline = await projectBattleTimeline(battle([caster, actor('boss', 'enemy', [long])], seed, 30000), content, () => Promise.resolve());
    const victim = timeline.entries.find(entry => entry.outcome === 'interrupted');
    if (!victim) continue;
    const cause = timeline.entries.find(entry => entry.id === victim.interrupted_by)!;
    assert.equal(victim.actor_id, 'boss'); assert.equal(cause.actor_id, 'hero'); assert.equal(cause.skill_id, 'swordsman_bash');
    assert.ok(cause.interrupts!.some(row => row.actor_id === 'boss' && row.skill_id === 'boss_long_cast' && row.at_ms === victim.end_ms), 'cause lists the interrupted cast');
    assert.ok(timeline.entries.filter(entry => entry.interrupts?.length).every(entry => entry.actor_id === 'hero'), 'only real interrupters are credited');
    return;
  }
  assert.fail('no seed produced a Stun interrupt');
});
