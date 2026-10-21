// TASK-041 balance runner: real Story battles for the stages-spec reference teams at each stage's
// recommended level (equal budgets), matched seeds, JSON + CSV reports. Never edits game data.
//   node --import tsx scripts/game/balance.ts story [--samples 100] [--team id] [--stages 1-1,3-10] [--out plan/evidence/balance/story.json]
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadValidatedContent } from '../../src/content/index.ts';
import type { AccountState } from '../../src/contracts/index.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { distribution, winInterval } from '../../src/simulation/index.ts';
import { arrangeInterrupts, referenceAccount, storyFight, withoutInterrupts, type BuildProfile, type ReferenceTeam, type FightSample } from '../../src/simulation/balance.ts';

const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors)); const content = loaded.value;
const [command = 'story', ...options] = process.argv.slice(2);
const option = (name: string) => { const index = options.indexOf(name); return index < 0 ? undefined : options[index + 1]; };
const roots = ['swordsman', 'acolyte', 'archer', 'mage', 'thief', 'merchant'] as const;
const builds = new Map<string, BuildProfile>();
for (const root of roots) for (const build of (JSON.parse(await readFile(`plan/data/skills/${root}.json`, 'utf8')) as { builds: BuildProfile[] }).builds) builds.set(build.id, build);
const member = (character_id: string, root: (typeof roots)[number], position: string, build: string) => ({ character_id, root, position: position as AccountState['team'][number]['position'], build: builds.get(build)! });
/** stages-spec reference_teams; branch builds chosen per role (tank/heal/dps/support) once Class 2 opens. */
export const TEAMS: ReferenceTeam[] = [
  { id: 'balanced_root_team', members: [member('main', 'mage', 'back_1', 'wizard_artillery'), member('npc_swordsman', 'swordsman', 'front_1', 'crusader_guardian'), member('npc_acolyte', 'acolyte', 'back_2', 'priest_healer'), member('npc_archer', 'archer', 'front_2', 'hunter_sniper')] },
  { id: 'physical_control_team', members: [member('main', 'thief', 'front_1', 'assassin_critical'), member('npc_merchant', 'merchant', 'front_2', 'blacksmith_hammer'), member('npc_acolyte', 'acolyte', 'back_2', 'priest_buffer'), member('npc_archer', 'archer', 'back_1', 'hunter_trapper')] },
];
const rules = new AccountCommandRules(), accounts = new Map<string, AccountState>();
function account(team: ReferenceTeam, level: number) {
  const key = `${team.id}@${level}`; let state = accounts.get(key);
  if (!state) { state = referenceAccount(team, level, content); rules.validateAccount(state); accounts.set(key, state); }
  return state;
}
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
export function summarize(samples: FightSample[], target: { first_clear_seconds: [number, number]; minimum_success_rate: number; minimum_survivors: number }) {
  const wins = samples.filter(s => s.kind === 'victory' && s.survivors >= target.minimum_survivors), times = distribution(wins.map(s => s.end_ms / 1000));
  const rate = wins.length / samples.length, [low, high] = winInterval(wins.length, samples.length), median = wins.length ? times.p50 : null;
  const verdict = rate < target.minimum_success_rate ? 'too_hard' : median !== null && median < target.first_clear_seconds[0] ? 'too_fast' : median !== null && median > target.first_clear_seconds[1] ? 'too_slow' : 'in_range';
  return { n: samples.length, wins: wins.length, win_rate: round(rate), win_ci95: [round(low), round(high)], median_s: median === null ? null : round(median, 2), p10_s: wins.length ? round([...wins].map(s => s.end_ms / 1000).sort((a, b) => a - b)[Math.floor(wins.length * 0.1)]!, 2) : null, p90_s: wins.length ? round(times.p90, 2) : null,
    defeats: samples.filter(s => s.kind === 'defeat').length, timeouts: samples.filter(s => s.kind === 'time_limit').length, mean_boss_hp_left: round(samples.reduce((n, s) => n + s.boss_hp_ratio, 0) / samples.length), mean_survivors: round(samples.reduce((n, s) => n + s.survivors, 0) / samples.length, 2), mean_pressure: round(samples.reduce((n, s) => n + s.pressure, 0) / samples.length), mean_deaths: round(samples.reduce((n, s) => n + s.deaths, 0) / samples.length, 2), verdict };
}
/**
 * D-065 level-design targets (assistant baseline inside the D-066 bands, 40 s fights): clear time of the
 * reference teams and boss pressure (party damage received / party max HP) rise through each chapter; chapter
 * finals are the longest and hardest. Bands: 1-1 1–6 s, chapters 1–2 4–25 s, chapters 3–8 12–35 s, win ≥ 0.8.
 */
export function designTarget(stage: { id: string; chapter: number; index: number }, perChapter: number): { time_s: number; pressure: number } {
  const final = stage.index === perChapter, x = perChapter > 1 ? (stage.index - 1) / (perChapter - 1) : 1;
  if (stage.id === '1-1') return { time_s: 3, pressure: 0.05 };
  if (stage.chapter === 1) return final ? { time_s: 15, pressure: 0.35 } : { time_s: 6 + 5 * x, pressure: 0.08 + 0.12 * x };
  if (stage.chapter === 2) return final ? { time_s: 19, pressure: 0.5 } : { time_s: 9 + 5 * x, pressure: 0.2 + 0.15 * x };
  return final ? { time_s: 30, pressure: 0.7 } : { time_s: 15 + 9 * x, pressure: 0.3 + 0.2 * x };
}
/** D-065 targets for the economy-derived journey player at the recommended level (just-in-time content). */
export function journeyTarget(stage: { id: string; chapter: number; index: number }, perChapter: number): { time_s: number; pressure: number } {
  const final = stage.index === perChapter, x = perChapter > 1 ? (stage.index - 1) / (perChapter - 1) : 1;
  if (stage.id === '1-1') return { time_s: 3, pressure: 0.05 };
  // D-067 heavy-cast stages run long enough for two Cataclysm casts in chapters 1–2.
  if ([5, 10, 15].includes(stage.index) && stage.chapter <= 2) return stage.chapter === 1 ? { time_s: final ? 18 : 15, pressure: final ? 0.4 : 0.3 } : { time_s: final ? 24 : 21, pressure: final ? 0.5 : 0.4 };
  if (stage.chapter === 1) return final ? { time_s: 13, pressure: 0.35 } : { time_s: 6 + 4 * x, pressure: 0.08 + 0.12 * x };
  if (stage.chapter === 2) return final ? { time_s: 26, pressure: 0.5 } : { time_s: 14 + 8 * x, pressure: 0.2 + 0.15 * x };
  return final ? { time_s: 30, pressure: 0.6 } : { time_s: 22 + 6 * x, pressure: 0.28 + 0.17 * x };
}
/**
 * D-065 difficulty (user, 20 Oct 2026: "อย่าให้ง่ายไป"): at its recommended level the economy-derived team should
 * not win every time — regular stages about 0.8 (band 0.7–0.9), chapter finals about 0.65 (0.55–0.8). Losing means
 * farming a little more or rearranging the queue; retries are free.
 */
export function winBand(stage: { index: number }, perChapter: number): [number, number] { return stage.index === perChapter ? [0.55, 0.8] : [0.7, 0.9]; }
/** Journey snapshots (scripts/game/journey.ts --schedule): stage id -> account just before it is credited. */
async function loadSnapshots(paths: string[]) { return Promise.all(paths.map(async file => (JSON.parse(gunzipSync(await readFile(file)).toString()) as { main: string; snapshots: Record<string, AccountState> }))); }
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
if (command === 'calibrate') {
  // Multiplicative update of stages-spec calibration from measured medians/pressure (time ∝ HP; pressure ∝ ATK × time).
  const samples = Number(option('--samples') ?? 10), damping = Number(option('--damping') ?? 1), specPath = 'plan/generators/stages-spec.json';
  const spec = JSON.parse(await readFile(specPath, 'utf8')) as { calibration?: Record<string, { hp: number; atk: number; matk?: number; cast_share?: number }> }, calibration = spec.calibration ?? {};
  const all = storyStages(content), perChapter = (c: number) => all.filter(s => s.chapter === c).length, report: Record<string, unknown>[] = [];
  const snapshotSets = option('--snapshots') ? await loadSnapshots(option('--snapshots')!.split(',')) : null, targetFor = snapshotSets ? journeyTarget : designTarget;
  for (const stage of all) {
    const raw = snapshotSets ? snapshotSets.map(set => set.snapshots[stage.id]).filter((x): x is AccountState => !!x) : TEAMS.map(team => account(team, (stage as unknown as { recommended_party_level: number }).recommended_party_level));
    // D-067 heavy-cast stages: tune against a team that brings up to two interrupters; the same team without any must fail.
    const heavy = stage.encounter[0]!.active_slots.some(id => !!id && ((content.skills[id] as unknown as { tags?: string[] } | undefined)?.tags ?? []).includes('heavy_cast')), states = heavy && !snapshotSets ? raw.map(state => arrangeInterrupts(state, 2, content)) : raw; // journey snapshots already carry the searched interrupt queue
    const n = heavy ? samples * 3 : samples, runs = states.map(state => Array.from({ length: n }, (_, i) => storyFight(state, stage.id, i + 1, content).sample));
    const bare = heavy ? raw.map(state => withoutInterrupts(state, content)).map(state => Array.from({ length: n }, (_, i) => storyFight(state, stage.id, i + 1, content).sample)) : [];
    const bareWin = bare.length ? Math.max(...bare.map(list => list.filter(s => s.kind === 'victory').length / list.length)) : null;
    // Mean over both snapshot teams: one team's weaker interrupts must not push the cast so low that the other never needs to interrupt.
    const bareMean = bare.length ? bare.flat().filter(s => s.kind === 'victory').length / bare.flat().length : null;
    const medians = runs.map(list => { const wins = list.filter(s => s.kind === 'victory').map(s => s.end_ms / 1000).sort((a, b) => a - b); return wins.length ? wins[Math.floor(wins.length / 2)]! : stage.time_limit_ms / 1000 * (1 + list.reduce((n, s) => n + s.boss_hp_ratio, 0) / list.length); });
    const time = Math.exp(medians.reduce((n, t) => n + Math.log(t), 0) / medians.length), pressure = runs.flat().reduce((n, s) => n + s.pressure, 0) / runs.flat().length;
    const win = Math.min(...runs.map(list => list.filter(s => s.kind === 'victory').length / list.length)), target = targetFor(stage, perChapter(stage.chapter));
    // Dead band: inside ±6 % time / ±12 % pressure nothing moves, so the table settles instead of chasing seed noise.
    const timeRatio = Math.abs(target.time_s / time - 1) < 0.06 ? 1 : target.time_s / time, pressureRatio = Math.abs(target.pressure / Math.max(1e-4, pressure) - 1) < 0.12 ? 1 : target.pressure / Math.max(1e-4, pressure);
    const meanWin = runs.flat().filter(s => s.kind === 'victory').length / runs.flat().length, band = winBand(stage, perChapter(stage.chapter));
    // Snapshot mode steers boss ATK by the measured win rate (difficulty), reference mode by pressure (legacy).
    const kHp = clamp(timeRatio ** damping, 0.4, 4), kAtk = snapshotSets ? (meanWin >= 0.99 ? 1.2 : meanWin > band[1] ? 1.07 : meanWin <= 0.4 ? 0.85 : meanWin < band[0] ? 0.93 : 1) : win < 0.9 ? Math.min(0.9, clamp((pressureRatio / kHp) ** damping, 0.4, 8)) : clamp((pressureRatio / kHp) ** damping, 0.4, 8);
    const old = calibration[stage.id] ?? { hp: 1, atk: 1 }, next: { hp: number; atk: number; matk?: number; heavy_atk_scale?: number } = { hp: Math.round(old.hp * kHp * 1000) / 1000, atk: Math.round(old.atk * kAtk * 1000) / 1000 };
    if (heavy) { // physical pressure follows the neighbouring stages; the threat of this stage is the cast
      // …scaled down while the stage stays too hard even with the weakest allowed cast (early heavy stages stacked both threats).
      const near = [-1, 1].map(d => calibration[`${stage.chapter}-${stage.index + d}`]?.atk).filter((x): x is number => typeof x === 'number');
      const floor = stage.chapter <= 2 ? 0.25 : 0.3, oldShare = (old as { cast_share?: number }).cast_share ?? 0.6, oldScale = (old as { heavy_atk_scale?: number }).heavy_atk_scale ?? 1;
      const scale = clamp(oldScale * (meanWin < band[0] && oldShare <= floor + 1e-9 ? 0.9 : meanWin > band[1] && bareMean! <= 0.3 ? 1.07 : 1), 0.4, 1.5);
      next.heavy_atk_scale = Math.round(scale * 1000) / 1000;
      if (near.length) next.atk = Math.round(Math.exp(near.reduce((a, x) => a + Math.log(x), 0) / near.length) * scale * 1000) / 1000;
    }
    if (heavy) {
      // One uncancelled Cataclysm should take `cast_share` of a median member's HP after MDEF; the share moves 0.05 per round
      // until the interrupt team wins ≥ 0.8 and the same team without interrupts wins ≤ 0.3.
      // Winning with interrupts comes first (≥ 0.8); only then is the cast pushed until the same team without them fails.
      // D-067 target on the two-team mean: with interrupts inside the win band, without them ≤ 0.3. Steps of 0.05.
      const share = clamp((old.cast_share ?? 0.6) + (meanWin < band[0] ? -0.05 : bareMean! > 0.3 ? 0.05 : 0), stage.chapter <= 2 ? 0.25 : 0.3, stage.chapter <= 2 ? 0.6 : 1.2);
      const party = storyFight(raw[0]!, stage.id, 1, content).final.actors.filter(a => a.team === 'player' && a.kind === 'party'), median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
      const hp = median(party.map(a => a.stats.max_hp)), mdef = median(party.map(a => a.stats.magical_defense)), armor = 1 - 0.9 * mdef / (mdef + 400);
      const coefficient = 3, baseAtk = Math.round(8 + 2.4 * stage.encounter[0]!.level), matk = share * hp / (coefficient * armor);
      next.matk = Math.round(matk / baseAtk * 1000) / 1000; (next as { cast_share?: number }).cast_share = Math.round(share * 1000) / 1000;
    }
    calibration[stage.id] = next; report.push({ stage: stage.id, time: Math.round(time * 10) / 10, target_time: target.time_s, pressure: Math.round(pressure * 1000) / 1000, target_pressure: target.pressure, worst_win: win, mean_win: meanWin, without_interrupt_win: bareWin, next });
    console.log([stage.id, `t ${time.toFixed(1)}/${target.time_s.toFixed(0)}`, `p ${pressure.toFixed(2)}/${target.pressure.toFixed(2)}`, `win ${win}`, `mean ${meanWin.toFixed(2)}`, `hp×${next.hp}`, `atk×${next.atk}`, ...(heavy ? [`matk×${next.matk}`, `bare ${bareMean}`, `bare_max ${bareWin}`] : [])].join('\t'));
  }
  spec.calibration = Object.fromEntries(Object.entries(calibration).sort(([a], [b]) => { const [ca, ia] = a.split('-').map(Number), [cb, ib] = b.split('-').map(Number); return ca! - cb! || ia! - ib!; }));
  if (options.includes('--write')) await writeFile(specPath, JSON.stringify(spec, null, 2) + '\n');
  console.log(JSON.stringify({ stages: report.length, written: options.includes('--write') }));
} else if (command === 'story') {
  const samples = Number(option('--samples') ?? 100), teamFilter = option('--team'), stageFilter = option('--stages')?.split(',');
  const stages = storyStages(content).filter(s => !stageFilter || stageFilter.includes(s.id)), teams = TEAMS.filter(t => !teamFilter || t.id === teamFilter);
  const started = performance.now(), rows: Record<string, unknown>[] = [];
  for (const stage of stages) {
    const target = (stage as unknown as { balance_target: { first_clear_seconds: [number, number]; minimum_success_rate: number; minimum_survivors: number } }).balance_target;
    const effective = stage.id === '1-1' ? { ...target, first_clear_seconds: [1, 6] as [number, number] } : target;
    for (const team of teams) {
      const state = account(team, (stage as unknown as { recommended_party_level: number }).recommended_party_level), runs = Array.from({ length: samples }, (_, i) => storyFight(state, stage.id, i + 1, content).sample);
      const row = { stage: stage.id, chapter: stage.chapter, level: (stage as unknown as { recommended_party_level: number }).recommended_party_level, team: team.id, target_s: effective.first_clear_seconds, ...summarize(runs, effective) };
      rows.push(row); console.log([row.stage, row.team.slice(0, 8), `L${row.level}`, `win ${row.win_rate}`, `med ${row.median_s}s`, `p90 ${row.p90_s}s`, `def ${row.defeats}`, `tmo ${row.timeouts}`, `prs ${row.mean_pressure}`, `dth ${row.mean_deaths}`, row.verdict].join('\t'));
    }
  }
  const elapsed = performance.now() - started, fights = rows.length * samples;
  const verdicts = rows.reduce<Record<string, number>>((m, r) => { m[r.verdict as string] = (m[r.verdict as string] ?? 0) + 1; return m; }, {});
  const out = option('--out');
  if (out) {
    await mkdir(path.dirname(path.resolve(out)), { recursive: true });
    await writeFile(out, JSON.stringify({ task_id: 'TASK-041', kind: 'story_reference_batch', content_hash: content.manifest.content_hash, samples_per_row: samples, seeds: `1..${samples}`, teams: TEAMS.map(t => ({ id: t.id, members: t.members.map(m => ({ character_id: m.character_id, position: m.position, build: m.build.id })) })), budget: 'stages-spec balance_reference_gear: recommended level, Common highest wearable tier, Refine 0/3/5 (<20/20-39/40+), no cards/enchant, all status points spent toward the build profile, skills capped by level, Class 2 from Lv.20', elapsed_ms: Math.round(elapsed), fights, verdicts, rows }, null, 1) + '\n');
    const header = ['stage', 'chapter', 'level', 'team', 'n', 'wins', 'win_rate', 'median_s', 'p10_s', 'p90_s', 'defeats', 'timeouts', 'mean_boss_hp_left', 'mean_survivors', 'mean_pressure', 'mean_deaths', 'target_min_s', 'target_max_s', 'verdict'];
    await writeFile(out.replace(/\.json$/, '.csv'), [header.join(','), ...rows.map(r => header.map(h => h === 'target_min_s' ? (r.target_s as number[])[0] : h === 'target_max_s' ? (r.target_s as number[])[1] : r[h] ?? '').join(','))].join('\n') + '\n');
  }
  console.log(JSON.stringify({ rows: rows.length, fights, elapsed_ms: Math.round(elapsed), fights_per_second: Math.round(fights / (elapsed / 1000)), verdicts }));
} else throw new Error(`UNKNOWN_COMMAND:${command}`);
