import type { BattleCheckpoint, MetricRow, Scenario } from '../contracts/index.ts';
import type { Result, ValidatedContent } from '../content/model.ts';
import type { ObjectValue } from '../content/value.ts';
import { canonical } from '../content/value.ts';
import { ContentValidator, InvalidContent } from '../content/validation.ts';
import { advanceUntil, restoreBattle, serializeBattle } from '../domain/combat/index.ts';
import { metricRates } from '../domain/combat/statistics.ts';
import { modePolicy } from '../domain/modes/daily.ts';
import type { BattleEvent, BattleState, PureModePolicy, RunLimits } from '../domain/combat/index.ts';

export interface ReplayInput {
  schema_version: 1; scenario: Scenario; variant_id: string;
  /** Produced by the runtime build/encounter adapter; no second combat compiler. */
  initial_checkpoint: BattleCheckpoint;
  /** Resource vector from the build adapter, separate from fight SP. */
  spent_budget: Record<string, number>;
}
export interface Rates { dps: number; effective_hps: number; metrics: MetricRow }
export interface SimulationReport {
  schema_version: 1; scenario_id: string; variant_id: string; seed: number;
  content_hash: string; rules_version: string; rng_version: string;
  start_ms: number; end_ms: number; duration_ms: number;
  result: BattleCheckpoint['terminal_result']; rng: BattleCheckpoint['rng']; spent_budget: Record<string, number>;
  team: Record<string, Rates>; actors: Record<string, Rates>; skills: Record<string, Rates>;
  metric_scope: 'cumulative_fight'; event_scope: 'checkpoint_to_end';
  status_timeline: Pick<BattleEvent, 'at_ms' | 'type' | 'actor_id' | 'target_id' | 'status_change'>[];
  damage_breakdown: Record<string, { hp_damage: number; absorbed: number; hits: number }>;
  sources: { actor_id: string; build_hash: string; blueprint: BattleCheckpoint['actors'][number]['stat_blueprint']; initial_statuses: BattleCheckpoint['actors'][number]['statuses']; final_statuses: BattleCheckpoint['actors'][number]['statuses']; final_control_resistance: number }[];
  event_digest: { algorithm: 'fnv1a32-v1'; value: string }; events?: BattleEvent[];
}
export interface SimulationRun { report: SimulationReport; final_state: BattleState }
const validators = new WeakMap<ValidatedContent, ContentValidator>();
function failure(code: string): Result<never> { return { ok: false, errors: [{ code, source: 'simulation', path: '', message: code }] }; }
function eventDigest(events: readonly BattleEvent[]) {
  // A deterministic regression fingerprint, never an integrity/authentication hash.
  const text = canonical(events); let hash = 2166136261;
  for (let index = 0; index < text.length; index++) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619) >>> 0; }
  return { algorithm: 'fnv1a32-v1' as const, value: hash.toString(16).padStart(8, '0') };
}
function rates(rows: Record<string, MetricRow>, durationMs: number): Record<string, Rates> {
  return Object.fromEntries(Object.entries(rows).map(([id, metrics]) => [id, { ...metricRates(metrics, durationMs), metrics: structuredClone(metrics) }]));
}
/** CPU-only runner: content and a compiled runtime checkpoint are injected. */
export function runScenario(input: ReplayInput, content: ValidatedContent, policy: PureModePolicy = modePolicy(input.initial_checkpoint.mode, content), limits: RunLimits = { max_events: 100000 }): Result<SimulationRun> {
  try {
    if (input.schema_version !== 1) return failure('INCOMPATIBLE_REPLAY');
    let validator = validators.get(content);
    if (!validator) { validator = new ContentValidator(structuredClone(content.schemas) as Record<string, ObjectValue>); validators.set(content, validator); }
    validator.shape('simulation-scenario', input.scenario as unknown as ObjectValue, { source: 'simulation', path: '/scenario' });
    const scenario = input.scenario;
    if (scenario.content_hash !== content.manifest.content_hash || scenario.rules_version !== content.manifest.rules_version) return failure('INCOMPATIBLE_SCENARIO');
    if (!input.variant_id || !input.spent_budget || Object.values(input.spent_budget).some(value => !Number.isSafeInteger(value) || value < 0)) return failure('INVALID_INVESTMENT_BUDGET');
    const restored = restoreBattle(input.initial_checkpoint, content); if (!restored.ok) return restored;
    const initial = restored.value;
    if (scenario.seed !== initial.initial_seed || scenario.mode.kind !== initial.mode.kind || scenario.mode.ref !== initial.mode.ref) return failure('SCENARIO_CHECKPOINT_MISMATCH');
    const party = initial.actors.filter(actor => actor.team === 'player' && actor.kind === 'party');
    if (new Set(scenario.team.map(row => row.actor_id)).size !== 4 || new Set(scenario.team.map(row => row.position)).size !== 4 || party.length !== 4 || scenario.team.some(row => !party.some(actor => actor.actor_id === row.actor_id && actor.position === row.position))) return failure('SCENARIO_PARTY_MISMATCH');
    const result = advanceUntil(initial, initial.mode.time_limit_ms, content, policy, limits); if (!result.ok) return result;
    const { state, events } = result.value;
    // Metrics are cumulative when resuming; duration uses the same entire fight.
    const metrics = state.metrics as BattleCheckpoint['metrics'];
    const damage: SimulationReport['damage_breakdown'] = {};
    for (const event of events) if (event.type === 'damage') {
      const key = JSON.stringify([event.actor_id, event.skill_id, event.effect_id, event.origin]);
      const row = damage[key] ??= { hp_damage: 0, absorbed: 0, hits: 0 }; row.hp_damage += event.amount ?? 0; row.absorbed += event.absorbed ?? 0; row.hits++;
    }
    const report: SimulationReport = { schema_version: 1, scenario_id: scenario.id, variant_id: input.variant_id, seed: scenario.seed, content_hash: initial.content_hash, rules_version: initial.rules_version, rng_version: initial.rng_version,
      metric_scope: 'cumulative_fight', event_scope: 'checkpoint_to_end', status_timeline: events.filter(event => !!event.status_change).map(({ at_ms, type, actor_id, target_id, status_change }) => ({ at_ms, type, actor_id, ...(target_id ? { target_id } : {}), status_change: status_change! })),
      start_ms: initial.game_time_ms, end_ms: state.game_time_ms, duration_ms: state.game_time_ms, result: structuredClone(state.terminal_result), rng: structuredClone(state.rng), spent_budget: structuredClone(input.spent_budget),
      team: rates(metrics.team, state.game_time_ms), actors: rates(metrics.actors, state.game_time_ms), skills: rates(metrics.skills, state.game_time_ms), damage_breakdown: damage,
      sources: initial.actors.map(actor => ({ actor_id: actor.actor_id, build_hash: actor.build_hash, blueprint: structuredClone(actor.stat_blueprint) as BattleCheckpoint['actors'][number]['stat_blueprint'], initial_statuses: structuredClone(actor.statuses) as BattleCheckpoint['actors'][number]['statuses'], final_statuses: structuredClone(state.actors.find(row => row.actor_id === actor.actor_id)?.statuses ?? []) as BattleCheckpoint['actors'][number]['statuses'], final_control_resistance: state.actors.find(row => row.actor_id === actor.actor_id)?.stats.control_resistance ?? 0 })), event_digest: eventDigest(events),
      ...(scenario.log_level === 'trace' ? { events } : {}),
    };
    return { ok: true, value: { report, final_state: state } };
  } catch (error) { return error instanceof InvalidContent ? { ok: false, errors: [error.issue] } : failure(error instanceof Error ? error.message : String(error)); }
}
export function captureReplay(scenario: Scenario, state: BattleState, variantId: string, spentBudget: Record<string, number>): ReplayInput {
  return { schema_version: 1, scenario: structuredClone(scenario), variant_id: variantId, initial_checkpoint: serializeBattle(state), spent_budget: structuredClone(spentBudget) };
}
export interface Distribution { n: number; mean: number; p50: number; p90: number; min: number; max: number; mean_ci95: [number, number] | null }
export function distribution(values: readonly number[]): Distribution {
  if (!values.length || values.some(value => !Number.isFinite(value))) throw new TypeError('EMPTY_OR_NONFINITE_SAMPLE');
  const sorted = values.slice().sort((a, b) => a - b), n = values.length, mean = values.reduce((sum, value) => sum + value, 0) / n;
  const quantile = (p: number) => { const position = (n - 1) * p, lower = Math.floor(position), upper = Math.ceil(position); return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower); };
  const margin = n > 1 ? 1.96 * Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1) / n) : null;
  return { n, mean, p50: quantile(.5), p90: quantile(.9), min: sorted[0]!, max: sorted[n - 1]!, mean_ci95: margin === null ? null : [mean - margin, mean + margin] };
}
export function winInterval(wins: number, count: number): [number, number] {
  if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(wins) || wins < 0 || wins > count) throw new TypeError('INVALID_WIN_SAMPLE');
  const z2 = 1.96 ** 2, probability = wins / count, denominator = 1 + z2 / count;
  const middle = (probability + z2 / (2 * count)) / denominator, margin = 1.96 * Math.sqrt(probability * (1 - probability) / count + z2 / (4 * count ** 2)) / denominator;
  return [Math.max(0, middle - margin), Math.min(1, middle + margin)];
}
export interface BatchReport {
  reports: SimulationReport[];
  groups: { scenario_id: string; variant_id: string; sample_count: number; wins: number; win_rate: number; win_ci95: [number, number]; time_ms: Distribution; player_dps: Distribution; player_hps: Distribution }[];
  paired: { scenario_id: string; a: string; b: string; seeds: number[]; player_dps_delta_b_minus_a: Distribution }[];
  uncertainty_method: string;
}
/** Inputs already carry each exact seed/variant/checkpoint; no random seed selection. */
export function runBatch(inputs: readonly ReplayInput[], content: ValidatedContent): Result<BatchReport> {
  if (!inputs.length) return failure('EMPTY_BATCH');
  const seen = new Set<string>(), groups = new Map<string, ReplayInput[]>();
  for (const input of inputs) {
    const identity = canonical([input.scenario.id, input.variant_id, input.scenario.seed]); if (seen.has(identity)) return failure('DUPLICATE_BATCH_SAMPLE'); seen.add(identity);
    const key = input.scenario.id, rows = groups.get(key) ?? []; rows.push(input); groups.set(key, rows);
  }
  for (const rows of groups.values()) {
    const variants = new Map<string, ReplayInput[]>(); for (const input of rows) { const values = variants.get(input.variant_id) ?? []; values.push(input); variants.set(input.variant_id, values); }
    const sets = [...variants.values()].map(values => canonical(values.map(value => value.scenario.seed).sort((a, b) => a - b)));
    if (sets.some(value => value !== sets[0])) return failure('UNMATCHED_SEEDS');
    if (rows.some(input => canonical(input.spent_budget) !== canonical(rows[0]!.spent_budget))) return failure('BUDGET_MISMATCH');
    if (variants.size > 1) {
      if (rows.some(input => input.scenario.budget_policy !== 'equal_spent_for_AB' || input.initial_checkpoint.game_time_ms !== 0 || input.initial_checkpoint.rng.draw_count !== 0)) return failure('AB_REQUIRES_FRESH_EQUAL_BUDGET_INPUTS');
      const environment = (input: ReplayInput) => canonical({ arena: input.initial_checkpoint.arena ?? null, party_spatial: input.initial_checkpoint.actors.filter(actor => actor.team === 'player').map(actor => ({ actor_id: actor.actor_id, spawn: actor.spatial ? { x: actor.spatial.x, y: actor.spatial.y } : null })), timing: input.initial_checkpoint.timing ?? { skill_interval_base_ms: 1500, normal_attack_base_ms: 1500 }, mode: input.initial_checkpoint.mode, enemies: input.initial_checkpoint.actors.filter(actor => actor.team !== 'player').map(actor => ({ actor_id: actor.actor_id, position: actor.position, spatial: actor.spatial ?? null, blueprint: actor.stat_blueprint, hp: actor.hp, sp: actor.sp, skills: actor.resolved_skills, slots: actor.active_slots, targetable: actor.targetable, counts_for_terminal: actor.counts_for_terminal })) });
      if (rows.some(input => environment(input) !== environment(rows[0]!))) return failure('ENCOUNTER_MISMATCH');
    }
  }
  const reports: SimulationReport[] = [];
  for (const input of inputs) { const run = runScenario(input, content); if (!run.ok) return run; reports.push(run.value.report); }
  const grouped = new Map<string, SimulationReport[]>(); for (const report of reports) { const key = canonical([report.scenario_id, report.variant_id]); const values = grouped.get(key) ?? []; values.push(report); grouped.set(key, values); }
  const summary: BatchReport['groups'] = [...grouped.values()].map(rows => { const first = rows[0]!, wins = rows.filter(row => row.result?.kind === 'victory').length; return { scenario_id: first.scenario_id, variant_id: first.variant_id, sample_count: rows.length, wins, win_rate: wins / rows.length, win_ci95: winInterval(wins, rows.length), time_ms: distribution(rows.map(row => row.duration_ms)), player_dps: distribution(rows.map(row => row.team.player!.dps)), player_hps: distribution(rows.map(row => row.team.player!.effective_hps)) }; });
  const paired: BatchReport['paired'] = [];
  for (const [scenarioId, rows] of groups) {
    const variants = [...new Set(rows.map(row => row.variant_id))].sort();
    for (const variant of variants.slice(1)) {
      const a = reports.filter(row => row.scenario_id === scenarioId && row.variant_id === variants[0]).sort((x, y) => x.seed - y.seed), b = reports.filter(row => row.scenario_id === scenarioId && row.variant_id === variant).sort((x, y) => x.seed - y.seed);
      paired.push({ scenario_id: scenarioId, a: variants[0]!, b: variant, seeds: a.map(row => row.seed), player_dps_delta_b_minus_a: distribution(a.map((row, index) => b[index]!.team.player!.dps - row.team.player!.dps)) });
    }
  }
  return { ok: true, value: { reports, groups: summary, paired, uncertainty_method: 'Wilson95 for win proportion; normal-approximation95 for sample means and paired deltas (null for n1); report spread and n, no automatic significance/balance verdict' } };
}
export { runBatch as runMatchedBatch, runScenario as replayBattle };
