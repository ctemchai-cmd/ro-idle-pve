import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { loadValidatedContent } from '../../src/content/index.ts';
import { createFixture, FIXTURES } from '../../src/simulation/fixtures.ts';
import type { FixtureId } from '../../src/simulation/fixtures.ts';
import { runBatch, runScenario } from '../../src/simulation/index.ts';
import type { ReplayInput } from '../../src/simulation/index.ts';
import { canonical } from '../../src/content/value.ts';

const [command = 'list', argument, ...options] = process.argv.slice(2);
const option = (name: string) => { const index = options.indexOf(name); return index < 0 ? undefined : options[index + 1]; };
async function output(file: string, value: unknown) { await mkdir(path.dirname(path.resolve(file)), { recursive: true }); await writeFile(file, JSON.stringify(value, null, 2) + '\n'); }
const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors)); const content = loaded.value;
if (command === 'list') console.log(JSON.stringify({ fixtures: FIXTURES, scope: 'controlled engine probes, not release balance', content_hash: content.manifest.content_hash }));
else if (command === 'run' || command === 'replay') {
  const input: ReplayInput = command === 'replay' ? JSON.parse(await readFile(argument!, 'utf8')) as ReplayInput : createFixture(argument as FixtureId, Number(option('--seed') ?? 1), content, option('--variant') ?? 'baseline', options.includes('--trace'));
  const result = runScenario(input, content); if (!result.ok) throw new Error(JSON.stringify(result.errors));
  if (option('--replay-out')) await output(option('--replay-out')!, input);
  if (option('--out')) await output(option('--out')!, result.value.report);
  console.log(JSON.stringify({ scenario: input.scenario.id, variant: input.variant_id, seed: input.scenario.seed, result: result.value.report.result, report_sha256: createHash('sha256').update(canonical(result.value.report)).digest('hex'), content_hash: content.manifest.content_hash }));
} else if (command === 'batch') {
  const count = Number(option('--samples') ?? argument ?? 100); if (!Number.isSafeInteger(count) || count < 1 || count > 1000) throw new Error('SAMPLE_COUNT_1_TO_1000');
  const fixtures = option('--fixture') ? [option('--fixture') as FixtureId] : [...FIXTURES];
  const inputs = fixtures.flatMap(id => Array.from({ length: count }, (_, index) => ['baseline', 'power_plus10pct'].map(variant => createFixture(id, index + 1, content, variant))).flat());
  const start = performance.now(), result = runBatch(inputs, content), elapsed = performance.now() - start; if (!result.ok) throw new Error(JSON.stringify(result.errors));
  const csv = ['scenario,variant,n,wins,win_rate,dps_mean,hps_mean,time_p50_ms,time_p90_ms', ...result.value.groups.map(row => [row.scenario_id, row.variant_id, row.sample_count, row.wins, row.win_rate, row.player_dps.mean, row.player_hps.mean, row.time_ms.p50, row.time_ms.p90].join(','))].join('\n') + '\n';
  const destination = option('--out') ?? 'plan/evidence/task-018-batch.json';
  const { reports, ...aggregate } = result.value;
  const compressed = gzipSync(JSON.stringify(reports)), artifact = destination.replace(/\.json$/, '') + '.reports.json.gz';
  await mkdir(path.dirname(path.resolve(destination)), { recursive: true }); await writeFile(artifact, compressed);
  await output(destination, { content_hash: content.manifest.content_hash, elapsed_ms: elapsed, fixture_scope: 'controlled equal declared budgets; not full-class/economy balance', reports_count: reports.length, reports_artifact: { path: path.basename(artifact), encoding: 'gzip JSON array', bytes: compressed.length, sha256: createHash('sha256').update(compressed).digest('hex') }, ...aggregate });
  await writeFile(destination.replace(/\.json$/, '') + '.csv', csv);
  console.log(JSON.stringify({ reports: result.value.reports.length, groups: result.value.groups.length, paired: result.value.paired.length, elapsed_ms: elapsed, output: destination }));
} else if (command === 'benchmark') {
  const fixture = (argument ?? 'area') as FixtureId;
  const inputs = Array.from({ length: 100 }, (_, index) => createFixture(fixture, index + 1, content));
  for (const input of inputs.slice(0, 10)) { const result = runScenario(input, content); if (!result.ok) throw new Error(JSON.stringify(result.errors)); }
  const start = performance.now();
  for (const input of inputs) { const result = runScenario(input, content); if (!result.ok || result.value.final_state.game_time_ms !== 90000) throw new Error('BENCHMARK_INVALID_FIGHT'); }
  const seconds = (performance.now() - start) / 1000;
  const report = { content_hash: content.manifest.content_hash, fixture, fights: 100, warmup: 10, virtual_ms_per_fight: 90000, measured_seconds: seconds, target_seconds: 5, passed: seconds <= 5, includes: 'schema restore/shared engine/report aggregation/event fingerprint, summary logs; input generation/install excluded', machine: { platform: os.platform(), release: os.release(), arch: os.arch(), cpu: os.cpus()[0]?.model, logical_cpus: os.cpus().length, node: process.version, total_memory_bytes: os.totalmem() } };
  await output(option('--out') ?? 'plan/evidence/task-018-benchmark.json', report); console.log(JSON.stringify(report));
  if (!report.passed) process.exitCode = 1;
} else throw new Error('COMMAND:list|run ID|replay FILE|batch N|benchmark ID');
