// TASK-041 AC-02/AC-03 comparison matrix: every Class 2 build at equal budgets (Lv.20/40/66 reference accounts) against
// controlled boss variants, plus one-vs-two support A/B, all on matched seeds through the shared engine. Report only;
// it never edits game data.  node --import tsx scripts/game/matrix.ts [--seeds 20] [--out plan/evidence/balance/matrix.json]
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadValidatedContent } from '../../src/content/index.ts';
import type { AccountState } from '../../src/contracts/index.ts';
import type { ActorInput, BattleInput } from '../../src/contracts/battle-input.ts';
import { compileCharacterSkills } from '../../src/domain/progression/skills.ts';
import { fixedEnemyBlueprint, storyParty } from '../../src/domain/build/story.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { advanceUntil, createBattle } from '../../src/domain/combat/index.ts';
import { distribution, winInterval } from '../../src/simulation/index.ts';
import { referenceAccount, type BuildProfile, type ReferenceTeam } from '../../src/simulation/balance.ts';

const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors)); const content = loaded.value;
const options = process.argv.slice(2), option = (name: string, fallback: string) => { const i = options.indexOf(name); return i < 0 ? fallback : options[i + 1]!; };
const SEEDS = Number(option('--seeds', '20')), OUT = option('--out', 'plan/evidence/balance/matrix.json');
type Root = 'swordsman' | 'acolyte' | 'archer' | 'mage' | 'thief' | 'merchant';
const ROOTS: Root[] = ['swordsman', 'acolyte', 'archer', 'mage', 'thief', 'merchant'], builds = new Map<string, BuildProfile & { role: string }>(), byRoot = new Map<Root, string[]>();
for (const root of ROOTS) { const list = (JSON.parse(await readFile(`plan/data/skills/${root}.json`, 'utf8')) as { builds: (BuildProfile & { role: string })[] }).builds; byRoot.set(root, list.map(b => b.id)); for (const b of list) builds.set(b.id, b); }
const DEFAULTS: Record<Root, string> = { swordsman: 'crusader_guardian', acolyte: 'priest_healer', archer: 'hunter_sniper', mage: 'wizard_artillery', thief: 'assassin_critical', merchant: 'blacksmith_hammer' };
const FRONT: Root[] = ['swordsman', 'merchant', 'thief'], PRIORITY: Root[] = ['swordsman', 'acolyte', 'archer', 'mage', 'merchant', 'thief'];
const LEVELS = [20, 40, 66];
const rootOf = (buildId: string) => ROOTS.find(r => byRoot.get(r)!.includes(buildId))!;

function team(members: { root: Root; build: string }[]): ReferenceTeam {
  const sorted = [...members].sort((a, b) => Number(FRONT.includes(b.root)) - Number(FRONT.includes(a.root)));
  return { id: members.map(m => m.build).join('+'), members: sorted.map((m, i) => ({ character_id: i === 0 ? 'main' : `npc_${m.root}`, root: m.root, position: (['front_1', 'front_2', 'back_1', 'back_2'] as const)[i]!, build: builds.get(m.build)! })) };
}
/** Fixed partners for a build under test: the first three other roots by priority, each with its default build. */
function partnersFor(root: Root) { return PRIORITY.filter(r => r !== root).slice(0, 3).map(r => ({ root: r, build: DEFAULTS[r] })); }
// The main is whoever sits first; referenceAccount needs exactly one 'main', so the build under test is always main.
function teamWith(buildId: string) { const root = rootOf(buildId); const t = team([{ root, build: buildId }, ...partnersFor(root)]); const lead = t.members.find(m => m.build.id === buildId)!; return { ...t, members: t.members.map(m => m === lead ? { ...m, character_id: 'main' } : m.character_id === 'main' ? { ...m, character_id: `npc_${m.root}` } : m) }; }

type Variant = { id: string; describe: string; limit_ms: number; target_s: number; enemies: (level: number, k?: number) => ActorInput[] };
const stageFor = (level: number, heavy: boolean) => storyStages(content).filter(s => [5, 10, 15].includes(s.index) === heavy && s.index !== 1).reduce((best, s) => Math.abs((s as unknown as { recommended_party_level: number }).recommended_party_level - level) < Math.abs((best as unknown as { recommended_party_level: number }).recommended_party_level - level) ? s : best);
function enemy(level: number, id: string, scale: { hp?: number; def?: number; mdef?: number; atk?: number }, slots: (string | null)[], passives: string[] = [], heavy = false): ActorInput {
  const boss = stageFor(level, heavy).encounter[0]!, base = { ...boss.resolved_base };
  base.max_hp = Math.round(base.max_hp * (scale.hp ?? 1)); base.physical_defense = Math.round(base.physical_defense * (scale.def ?? 1)); base.magical_defense = Math.round(base.magical_defense * (scale.mdef ?? 1)); base.physical_attack = Math.round(base.physical_attack * (scale.atk ?? 1));
  const ids = [...slots.filter((x): x is string => !!x), ...passives];
  return { actor_id: id, kind: 'enemy', team: 'enemy', position: id === 'enemy_front' ? 'front_1' : id.endsWith('0') ? 'front_2' : 'back_1', stat_blueprint: fixedEnemyBlueprint(boss.level, base, boss.element, content), active_slots: [slots[0] ?? null, slots[1] ?? null, slots[2] ?? null, slots[3] ?? null] as never, resolved_skills: Object.fromEntries(ids.map(s => [s, structuredClone(resolveSkill(s, 1, content))])) as never, normal_attack_enabled: true, tags: [`element:${boss.element}`], spatial: { x: id === 'enemy_front' ? 520 : 600, y: id === 'enemy_front' ? 400 : id.endsWith('0') ? 300 : 500, move_speed: 85, radius: 30, normal_range: 80 }, build_hash: `matrix_${id}` };
}
// Boss HP is normalised per level/scenario with the default team (k): it clears in about `target_s`, so builds are compared
// on time/DPS/survival instead of all winning or all losing against Story bosses tuned for geared journey players.
const VARIANTS: Variant[] = [
  { id: 'single_armored', describe: 'one boss, DEF ×1.6 / MDEF ×0.6 (physical check)', limit_ms: 40000, target_s: 25, enemies: (L, k = 1) => [enemy(L, 'enemy_front', { hp: k, def: 1.6, mdef: 0.6 }, ['enemy_bite'])] },
  { id: 'single_warded', describe: 'one boss, DEF ×0.6 / MDEF ×1.6 (magic check)', limit_ms: 40000, target_s: 25, enemies: (L, k = 1) => [enemy(L, 'enemy_front', { hp: k, def: 0.6, mdef: 1.6 }, ['enemy_bite'])] },
  { id: 'multi_target', describe: 'boss + two adds at 0.75× boss HP each, all must die (area value)', limit_ms: 40000, target_s: 28, enemies: (L, k = 1) => [enemy(L, 'enemy_front', { hp: k }, ['enemy_bite']), enemy(L, 'enemy_add_0', { hp: k * 0.75, atk: 0.6 }, ['enemy_bite']), enemy(L, 'enemy_add_1', { hp: k * 0.75, atk: 0.6 }, ['enemy_bite'])] },
  { id: 'long_sp', describe: 'one boss over 90 s (SP sustain)', limit_ms: 90000, target_s: 70, enemies: (L, k = 1) => [enemy(L, 'enemy_front', { hp: k }, ['enemy_bite'])] },
  { id: 'heavy_cast', describe: 'stage 5/10/15 boss with Cataclysm (interrupts decide it)', limit_ms: 40000, target_s: 25, enemies: (L, k = 1) => [enemy(L, 'enemy_front', { hp: k }, stageFor(L, true).encounter[0]!.active_slots, [], true)] },
  { id: 'cc_resistant', describe: 'boss with adaptive CC resistance (+0.10 per hard CC, 6 s)', limit_ms: 40000, target_s: 25, enemies: (L, k = 1) => [enemy(L, 'enemy_front', { hp: k }, ['enemy_bite', 'enemy_quake'], ['enemy_adaptive_cc'])] },
];
const scale = new Map<string, number>(); // `${level}:${variant}` -> HP multiplier
function fight(state: AccountState, variant: Variant, level: number, seed: number, k = scale.get(`${level}:${variant.id}`) ?? 1) {
  const compiled = Object.fromEntries(state.team.map(p => [p.character_id, compileCharacterSkills(state.roster.find(a => a.character_id === p.character_id)!, content)]));
  const input: BattleInput = { actors: [...storyParty(state, content, compiled, Object.fromEntries(state.roster.map(a => [a.character_id, 'x']))), ...variant.enemies(level, k)], arena: { width: 720, height: 820, step_ms: 50 }, timing: { skill_interval_base_ms: 3000, normal_attack_base_ms: 1500 }, mode: { kind: 'story', ref: `matrix_${variant.id}`, time_limit_ms: variant.limit_ms, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] } } as never;
  const created = createBattle(input, content, seed); if (!created.ok) throw new Error(`MATRIX_BUILD:${JSON.stringify(created.errors).slice(0, 200)}`);
  const run = advanceUntil(created.value, variant.limit_ms, content); if (!run.ok) throw new Error('MATRIX_RUN');
  const final = run.value.state, party = final.actors.filter(a => a.team === 'player' && a.kind === 'party'), m = final.metrics;
  const buffs = run.value.events.filter(e => e.type === 'status_applied' && party.some(a => a.actor_id === e.actor_id) && (content.documents['status-effects.json']!.statuses as unknown as { id: string; polarity: string }[]).find(s => s.id === e.status_change?.status_id)?.polarity === 'buff').length;
  return { win: final.terminal_result?.kind === 'victory', time: final.game_time_ms, team_damage: m.team.player.hp_damage, deaths: party.filter(a => a.hp <= 0).length, sp_skips: party.reduce((n, a) => n + (m.actors[a.actor_id]?.sp_skips ?? 0), 0), heal: m.team.player.effective_heal, buffs_applied: buffs, damage_by_actor: Object.fromEntries(party.map(a => [a.actor_id, m.actors[a.actor_id]?.hp_damage ?? 0])), seed };
}
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
function summarize(runs: ReturnType<typeof fight>[], focus?: string) {
  const wins = runs.filter(r => r.win), times = wins.length ? distribution(wins.map(r => r.time / 1000)) : null, dps = distribution(runs.map(r => r.team_damage / (r.time / 1000))), [lo, hi] = winInterval(wins.length, runs.length);
  const sortedTimes = [...runs].sort((a, b) => a.time - b.time);
  return { n: runs.length, win_rate: round(wins.length / runs.length), win_ci95: [round(lo), round(hi)], median_win_s: times ? round(times.p50) : null, team_dps_mean: round(dps.mean, 1), team_dps_ci95: dps.mean_ci95?.map(x => round(x, 1)) ?? null,
    deaths_mean: round(runs.reduce((n, r) => n + r.deaths, 0) / runs.length), sp_skips_mean: round(runs.reduce((n, r) => n + r.sp_skips, 0) / runs.length, 1), heal_mean: Math.round(runs.reduce((n, r) => n + r.heal, 0) / runs.length), buffs_applied_mean: round(runs.reduce((n, r) => n + r.buffs_applied, 0) / runs.length, 1),
    ...(focus ? { focus_damage_share: round(runs.reduce((n, r) => n + r.damage_by_actor[focus]! / Math.max(1, r.team_damage), 0) / runs.length) } : {}), fastest_seed: sortedTimes[0]!.seed, slowest_seed: sortedTimes.at(-1)!.seed };
}
const started = performance.now(), rows: Record<string, unknown>[] = [], seeds = Array.from({ length: SEEDS }, (_, i) => i + 1);
const baseline = team(PRIORITY.slice(0, 4).map(root => ({ root, build: DEFAULTS[root] })));
for (const level of LEVELS) { const state = referenceAccount(baseline, level, content); for (const variant of VARIANTS) {
  // Damage the default team deals to a 20× HP copy in the limit, then size the boss so it clears in about target_s.
  const probes = [1, 2, 3].map(seed => fight(state, variant, level, seed, 20)), dps = probes.reduce((n, r) => n + r.team_damage / (r.time / 1000), 0) / probes.length;
  const hp = variant.enemies(level, 1).reduce((n, e) => n + (e.stat_blueprint.derived_offsets.max_hp ?? 0), 0) || 1;
  scale.set(`${level}:${variant.id}`, Math.max(0.05, dps * variant.target_s / Math.max(1, hp)));
} }
for (const level of LEVELS) for (const buildId of builds.keys()) {
  const ref = teamWith(buildId), state = referenceAccount(ref, level, content);
  for (const variant of VARIANTS) { const s = summarize(seeds.map(seed => fight(state, variant, level, seed)), 'main'); rows.push({ kind: 'build', level, build: buildId, root: rootOf(buildId), role: builds.get(buildId)!.role, scenario: variant.id, team: ref.members.map(m => m.build.id), ...s }); }
  process.stdout.write('.');
}
// AC-03: one vs two supports at the same budget; the swapped member's own damage is the cost of the slot.
const SUPPORT_TEAMS = {
  one_support: [{ root: 'mage', build: 'wizard_artillery' }, { root: 'swordsman', build: 'knight_striker' }, { root: 'archer', build: 'hunter_sniper' }, { root: 'acolyte', build: 'priest_buffer' }],
  two_supports: [{ root: 'mage', build: 'wizard_artillery' }, { root: 'swordsman', build: 'knight_striker' }, { root: 'archer', build: 'bard_support' }, { root: 'acolyte', build: 'priest_buffer' }],
  two_supports_desynced: [{ root: 'mage', build: 'wizard_artillery' }, { root: 'swordsman', build: 'knight_striker' }, { root: 'archer', build: 'dancer_support' }, { root: 'acolyte', build: 'priest_healer' }],
  no_support: [{ root: 'mage', build: 'wizard_artillery' }, { root: 'swordsman', build: 'knight_striker' }, { root: 'archer', build: 'hunter_sniper' }, { root: 'acolyte', build: 'monk_finisher' }],
} as Record<string, { root: Root; build: string }[]>;
const support: Record<string, unknown>[] = [];
for (const level of LEVELS) for (const [id, members] of Object.entries(SUPPORT_TEAMS)) {
  const ref = team(members), state = referenceAccount(ref, level, content);
  for (const variant of VARIANTS.filter(v => ['single_armored', 'multi_target', 'long_sp'].includes(v.id))) support.push({ kind: 'support_ab', level, team_id: id, team: members.map(m => m.build), scenario: variant.id, ...summarize(seeds.map(seed => fight(state, variant, level, seed))) });
}
const elapsed = performance.now() - started;
await mkdir(path.dirname(path.resolve(OUT)), { recursive: true });
await writeFile(OUT, JSON.stringify({ task_id: 'TASK-041', kind: 'matrix', content_hash: content.manifest.content_hash, seeds: `1..${SEEDS} matched across every row`, budget: 'referenceAccount at Lv.20/40/66: Common highest wearable tier, Refine 0/3/5, all status points toward the build profile, skills capped by level, no cards', partners: 'fixed default builds of the first three other roots by priority swordsman>acolyte>archer>mage>merchant>thief; build under test is the main', scenarios: VARIANTS.map(v => ({ id: v.id, describe: v.describe, limit_ms: v.limit_ms })), buff_policy: 'D-037/D-038 additive, no cap (engine default)', hp_scale: Object.fromEntries(scale), elapsed_ms: Math.round(elapsed), rows, support }, null, 1) + '\n');
const header = ['kind', 'level', 'build', 'role', 'team_id', 'scenario', 'n', 'win_rate', 'median_win_s', 'team_dps_mean', 'deaths_mean', 'sp_skips_mean', 'heal_mean', 'buffs_applied_mean', 'focus_damage_share'];
await writeFile(OUT.replace(/\.json$/, '.csv'), [header.join(','), ...[...rows, ...support].map(r => header.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n') + '\n');
console.log(JSON.stringify({ rows: rows.length, support: support.length, fights: (rows.length + support.length) * SEEDS, elapsed_ms: Math.round(elapsed) }));
