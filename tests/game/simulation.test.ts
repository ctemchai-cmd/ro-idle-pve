import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, FIXTURES } from '../../src/simulation/fixtures.ts';
import { captureReplay, distribution, runBatch, runScenario, winInterval } from '../../src/simulation/index.ts';
import { advanceUntil } from '../../src/domain/combat/index.ts';
import { canonical } from '../../src/content/value.ts';
import { content, unwrap } from './combat-fixtures.ts';

test('all six CPU-only probes use shared content, record actor/skill/support metrics and finish90s', () => {
  for (const id of FIXTURES) {
    const result = unwrap(runScenario(createFixture(id, 1, content), content)); assert.equal(result.report.content_hash, content.manifest.content_hash); assert.equal(result.report.end_ms, 90000);
    assert.equal(Object.keys(result.report.actors).length, id === 'area' ? 7 : 5); assert.ok(result.report.team.player!.dps > 0); assert.equal(result.report.events, undefined); assert.doesNotThrow(() => canonical(result.report));
    if (id === 'healer') assert.ok(result.report.team.player!.effective_hps > 0);
    if (id === 'guard') assert.ok(result.report.team.player!.metrics.shield_absorbed > 0);
    if (id === 'sp_starved') assert.ok(result.report.team.player!.metrics.sp_skips > 0);
  }
});
test('same scenario/seed produces identical report, ordered trace, RNG and final checkpoint', () => {
  const input = createFixture('cc_resistance', 7, content, 'baseline', true), before = canonical(input);
  const a = unwrap(runScenario(input, content)), b = unwrap(runScenario(input, content)); assert.deepEqual(a, b); assert.ok(a.report.events!.length > 0); assert.equal(canonical(input), before);
});
test('actual midcast checkpoint replay matches uninterrupted suffix and cumulative metrics', () => {
  const input = createFixture('single_target', 1, content, 'baseline', true);
  const middle = unwrap(advanceUntil(input.initial_checkpoint, 1600, content)); assert.ok(middle.state.actors.some(actor => actor.cast));
  const replay = captureReplay(input.scenario, middle.state, input.variant_id, input.spent_budget), resumed = unwrap(runScenario(replay, content));
  const uninterrupted = unwrap(runScenario(input, content)); assert.deepEqual(resumed.final_state, uninterrupted.final_state); assert.deepEqual(resumed.report.events, uninterrupted.report.events!.filter(event => event.at_ms > 1600));
});
test('unsupported schema/content/rules/RNG never falls back to latest', () => {
  for (const mutate of [
    (input: ReturnType<typeof createFixture>) => { input.scenario.content_hash = 'older'; },
    (input: ReturnType<typeof createFixture>) => { input.scenario.rules_version = 'future'; },
    (input: ReturnType<typeof createFixture>) => { input.initial_checkpoint.content_hash = 'older'; },
    (input: ReturnType<typeof createFixture>) => { (input.initial_checkpoint.rng_version as string) = 'other'; },
    (input: ReturnType<typeof createFixture>) => { input.schema_version = 2 as 1; },
  ]) { const input = createFixture('single_target', 1, content); mutate(input); assert.equal(runScenario(input, content).ok, false); }
});
test('batch rejects unmatched seeds, duplicate samples and unequal resource vectors', () => {
  const a = createFixture('single_target', 1, content), b = createFixture('single_target', 2, content, 'power_plus10pct'); assert.equal(runBatch([a, b], content).ok, false);
  b.scenario.seed = 1; b.initial_checkpoint.initial_seed = 1; b.spent_budget.gold = 1; const mismatch = runBatch([a, b], content); assert.equal(mismatch.ok, false); if (!mismatch.ok) assert.equal(mismatch.errors[0]!.code, 'BUDGET_MISMATCH');
  assert.equal(runBatch([a, a], content).ok, false);
});
test('matched A/B groups preserve all seeds and include support, spread and uncertainty', () => {
  const inputs = [1, 2, 3].flatMap(seed => ['baseline', 'power_plus10pct'].map(variant => createFixture('healer', seed, content, variant)));
  const result = unwrap(runBatch(inputs, content)); assert.equal(result.groups.length, 2); assert.equal(result.groups[0]!.sample_count, 3); assert.deepEqual(result.paired[0]!.seeds, [1, 2, 3]); assert.ok(result.groups[0]!.player_hps.mean > 0); assert.ok(result.paired[0]!.player_dps_delta_b_minus_a.mean_ci95);
});
test('small-sample uncertainty is explicit and all-zero wins retain a positive upper bound', () => {
  assert.equal(distribution([1]).mean_ci95, null); assert.equal(distribution([1, 2, 3]).p50, 2); assert.equal(distribution([1, 2, 3]).p90, 2.8); assert.ok(winInterval(0, 100)[1] > 0); assert.ok(winInterval(100, 100)[0] < 1);
});
test('A/B rejects a changed opponent or a midbattle starting advantage', () => {
  const a = createFixture('single_target', 1, content), b = createFixture('single_target', 1, content, 'power_plus10pct'); b.initial_checkpoint.actors.find(actor => actor.team === 'enemy')!.hp--;
  const mismatch = runBatch([a, b], content); assert.equal(mismatch.ok, false); if (!mismatch.ok) assert.equal(mismatch.errors[0]!.code, 'ENCOUNTER_MISMATCH');
  const c = createFixture('single_target', 1, content, 'power_plus10pct'); c.initial_checkpoint.game_time_ms = 100;
  assert.equal(runBatch([a, c], content).ok, false);
});
test('summary reports retain status applications and actual reactive resistance before cleanup', () => {
  const report = unwrap(runScenario(createFixture('cc_resistance', 1, content), content)).report;
  assert.ok(report.status_timeline.some(event => event.status_change?.status_id === 'cc_resistance_up' && event.status_change.control_resistance_after > 0));
  assert.equal(report.metric_scope, 'cumulative_fight'); assert.equal(report.event_scope, 'checkpoint_to_end');
});
test('matched class A/B cannot silently use different rotation pacing profiles', () => {
  const a = createFixture('single_target', 1, content), b = createFixture('single_target', 1, content, 'power_plus10pct');
  b.initial_checkpoint.timing = { skill_interval_base_ms: 3000, normal_attack_base_ms: 1500 };
  const result = runBatch([a, b], content); assert.equal(result.ok, false); if (!result.ok) assert.equal(result.errors[0]!.code, 'ENCOUNTER_MISMATCH');
});
