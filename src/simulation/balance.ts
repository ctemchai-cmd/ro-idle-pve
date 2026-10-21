import type { AccountState, PrimaryStats } from '../contracts/index.ts';
import type { BattleState } from '../domain/combat/model.ts';
import type { ValidatedContent } from '../content/model.ts';
import { initializeAccount } from '../domain/progression/initialize.ts';
import { progressionData } from '../domain/progression/characters.ts';
import { characterSkillCap, compileCharacterSkills } from '../domain/progression/skills.ts';
import { storyParty, storyInput } from '../domain/build/story.ts';
import { storyBoss, storyStages } from '../domain/modes/story.ts';
import { modePolicy } from '../domain/modes/daily.ts';
import { advanceUntil, createBattle } from '../domain/combat/index.ts';

/**
 * TASK-041 balance harness (D-029): builds the stages-spec "reference budget" team at a level and
 * runs real Story battles through the shared engine. Everything a player could not have at that
 * level is withheld: Class 2 only from Lv.20, skill levels capped by character level, Common gear of
 * the highest tier the level can wear, Refine 0/3/5 by level band, no cards/enchant, every status
 * point spent toward the build's Lv.70 profile with the real RO-style point costs.
 */
type Character = AccountState['roster'][number];
type Root = Character['root_job_id'];
export interface BuildProfile { id: string; job_id: Character['job_id']; primary_stats: PrimaryStats; skill_levels: Record<string, number>; active_slots: readonly (string | null)[] }
export interface TeamMember { character_id: string; root: Root; position: AccountState['team'][number]['position']; build: BuildProfile }
export interface ReferenceTeam { id: string; members: readonly TeamMember[] }
const SLOTS = ['weapon', 'head', 'armor', 'garment', 'shoes', 'accessory'] as const;

/** Spend `points` toward the profile's Lv.70 shape: always raise the stat furthest behind its share. */
export function allocateTowards(profile: PrimaryStats, points: number, content: ValidatedContent): { stats: PrimaryStats; spent: number } {
  const data = progressionData(content), base = data.status_allocation.base, stats = { ...base }, keys = Object.keys(base) as (keyof PrimaryStats)[];
  const weight = Object.fromEntries(keys.map(k => [k, Math.max(0, profile[k] - base[k])])) as Record<keyof PrimaryStats, number>;
  const cost = (next: number) => data.status_allocation.cost_by_new_value.find(row => row.new_value === next)?.point_cost ?? Infinity;
  let left = points;
  for (;;) {
    const open = keys.filter(k => weight[k] > 0 && stats[k] < data.status_allocation.manual_value_max && cost(stats[k] + 1) <= left);
    if (!open.length) break;
    const pick = open.reduce((a, b) => ((stats[a] - base[a]) / weight[a] <= (stats[b] - base[b]) / weight[b] ? a : b));
    left -= cost(stats[pick] + 1); stats[pick]++;
  }
  return { stats, spent: points - left };
}
function gearFor(job: Character['job_id'], level: number, content: ValidatedContent) {
  const equipment = content.documents['equipment.json']! as unknown as { definitions: { id: string; slot: string; weapon_type?: string | null; tier_level: number; required_level: number }[]; weapon_compatibility: Record<string, string> };
  const tier = Math.max(...equipment.definitions.filter(d => d.required_level <= level).map(d => d.tier_level));
  return SLOTS.map(slot => equipment.definitions.find(d => d.slot === slot && d.tier_level === tier && (slot !== 'weapon' || d.weapon_type === equipment.weapon_compatibility[job]))!);
}
export const referenceRefine = (level: number) => (level < 20 ? 0 : level < 40 ? 3 : 5);

/** The stages-spec reference account for one team at one level (validated by the caller with the server rules). */
export function referenceAccount(team: ReferenceTeam, level: number, content: ValidatedContent): AccountState {
  const main = team.members.find(m => m.character_id === 'main')!;
  const state = initializeAccount(content, { root_job_id: main.root, gender: 'female' }, '2026-10-20T00:00:00.000Z', '2026-10-20', 1);
  const data = progressionData(content), gates = data.progression.breakthrough_gates.filter(g => g.at_level < level), total = data.progression.level_rows.find(r => r.level === level)!.total_status_points;
  const zero = Object.fromEntries(Object.keys(state.wallet).map(k => [k, 0])) as AccountState['wallet'];
  state.team = team.members.map(m => ({ character_id: m.character_id, position: m.position })) as AccountState['team'];
  for (const member of team.members) {
    const actor = state.roster.find(a => a.character_id === member.character_id)!, job = level >= data.promotion.class2_min_level ? member.build.job_id : member.root;
    if (job === 'bard') actor.gender = 'male'; if (job === 'dancer') actor.gender = 'female';
    const { stats, spent } = allocateTowards(member.build.primary_stats, total, content);
    Object.assign(actor, { job_id: job, level, completed_gate_ids: gates.map(g => g.at_level), local_cap: gates.at(-1)?.unlocks_local_cap ?? data.progression.base_local_cap, primary_stats: stats, unspent_status_points: total - spent });
    if (spent) state.paid_ledger.push({ entry_id: `status_ref_${actor.character_id}`, character_id: actor.character_id, feature_id: 'status', skill_id: null, quantity: spent, cost_version: 'reference', cost_versions: ['reference'], paid_resources: zero, refund_state: 'active', refund_command_id: null } as AccountState['paid_ledger'][number]);
    const levels: Record<string, number> = {};
    for (const [id, wanted] of Object.entries({ ...actor.skill_levels, ...member.build.skill_levels })) {
      const definition = content.skills[id] as unknown as { class_id: string; unlock_level: number; max_level: number } | undefined;
      if (!definition || (definition.class_id !== actor.root_job_id && definition.class_id !== job) || definition.unlock_level > level) continue;
      levels[id] = Math.max(1, Math.min(wanted, characterSkillCap(actor, definition as never)));
    }
    actor.skill_levels = levels;
    const active = (id: string | null): id is string => !!id && !!levels[id] && (content.skills[id] as unknown as { kind: string }).kind === 'active';
    const slots = member.build.active_slots.filter(active);
    for (const id of Object.keys(member.build.skill_levels).concat(Object.keys(levels))) if (slots.length < 4 && active(id) && !slots.includes(id)) slots.push(id);
    actor.active_slots = [slots[0] ?? null, slots[1] ?? null, slots[2] ?? null, slots[3] ?? null];
    for (const [index, definition] of gearFor(job, level, content).entries()) {
      const slot = SLOTS[index]!, id = `ref_${actor.character_id}_${slot}`;
      state.inventory.push({ instance_id: id, definition_id: definition.id, kind: 'equipment', rarity_id: 'common', locked: false, training: false, options: [] });
      actor.equipment[slot] = id; actor.slot_progress[slot].refine = referenceRefine(level);
    }
  }
  return state;
}
/** pressure = party HP+shield damage received / party max HP (how much healing/mitigation the boss demands). */
export interface FightSample { seed: number; kind: 'victory' | 'defeat' | 'time_limit' | 'retreated' | 'diagnostic' | 'none'; end_ms: number; survivors: number; boss_hp_ratio: number; pressure: number; deaths: number }
/** One real Story battle (boss-only encounter, 90 s, shared mode policy) for an account. */
export function storyFight(state: AccountState, stageId: string, seed: number, content: ValidatedContent): { sample: FightSample; final: BattleState } {
  const stage = storyStages(content).find(s => s.id === stageId); if (!stage) throw new Error(`UNKNOWN_STAGE:${stageId}`);
  const compiled = Object.fromEntries(state.team.map(p => [p.character_id, compileCharacterSkills(state.roster.find(a => a.character_id === p.character_id)!, content)]));
  const hashes = Object.fromEntries(state.roster.map(a => [a.character_id, `ref_${a.character_id}`]));
  const input = storyInput(stage, storyBoss(stage), storyParty(state, content, compiled, hashes), content), created = createBattle(input, content, seed);
  if (!created.ok) throw new Error(`BATTLE_BUILD_FAILED:${stageId}:${JSON.stringify(created.errors).slice(0, 200)}`);
  const run = advanceUntil(created.value, stage.time_limit_ms, content, modePolicy(created.value.mode, content));
  if (!run.ok) throw new Error(`BATTLE_RUN_FAILED:${stageId}`);
  const final = run.value.state, boss = final.actors.filter(a => a.team === 'enemy' && a.counts_for_terminal);
  const ratio = boss.reduce((n, a) => n + Math.max(0, a.hp), 0) / Math.max(1, boss.reduce((n, a) => n + a.stats.max_hp, 0));
  const party = final.actors.filter(a => a.team === 'player' && a.kind === 'party'), received = party.reduce((n, a) => n + (final.metrics.actors[a.actor_id]?.damage_received ?? 0) + (final.metrics.actors[a.actor_id]?.shield_damage_received ?? 0), 0);
  return { sample: { seed, kind: final.terminal_result?.kind ?? 'none', end_ms: final.game_time_ms, survivors: party.filter(a => a.hp > 0).length, boss_hp_ratio: ratio, pressure: received / Math.max(1, party.reduce((n, a) => n + a.stats.max_hp, 0)), deaths: party.filter(a => a.hp <= 0).length }, final };
}

/** D-067: active skills that can stop an interruptible cast (interrupt effect, or stun/freeze/silence) with their best chance. */
export function interruptSkills(content: ValidatedContent): Map<string, number> {
  const cancelling = new Set(['stun', 'freeze', 'silence']), out = new Map<string, number>();
  const walk = (value: unknown, id: string) => {
    if (Array.isArray(value)) { for (const item of value) walk(item, id); return; }
    if (!value || typeof value !== 'object') return;
    const effect = value as { type?: string; status_id?: string; chance?: number };
    if (effect.type === 'interrupt' || (effect.type === 'apply_status' && cancelling.has(effect.status_id ?? ''))) out.set(id, Math.max(out.get(id) ?? 0, typeof effect.chance === 'number' ? effect.chance : 1));
    for (const child of Object.values(value)) if (child && typeof child === 'object') walk(child, id);
  };
  for (const [id, skill] of Object.entries(content.skills)) if ((skill as unknown as { kind: string; class_id: string }).kind === 'active' && (skill as unknown as { class_id: string }).class_id !== 'enemy') walk((skill as unknown as { effects: unknown }).effects, id);
  return out;
}
/** Loadout-only variants of a saved team for a heavy-cast stage: bring interrupts to up to `members` people, or none at all. */
export function arrangeInterrupts(state: AccountState, members: number, content: ValidatedContent): AccountState {
  const options = interruptSkills(content), next = structuredClone(state);
  const candidates = next.team.map(p => next.roster.find(a => a.character_id === p.character_id)!).map(actor => {
    const owned = [...options.entries()].filter(([id]) => (actor.skill_levels[id] ?? 0) > 0).sort((a, b) => b[1] - a[1])[0];
    return { actor, skill: owned?.[0] ?? null, chance: owned?.[1] ?? 0, already: actor.active_slots.some(id => id !== null && options.has(id)) };
  }).sort((a, b) => Number(b.already) - Number(a.already) || b.chance - a.chance);
  let placed = candidates.filter(c => c.already).length;
  for (const c of candidates) {
    if (placed >= members || c.already || !c.skill) continue;
    const slots = c.actor.active_slots.filter(id => id !== c.skill), kept = slots.filter((id): id is string => id !== null).slice(0, 3);
    c.actor.active_slots = [c.skill, kept[0] ?? null, kept[1] ?? null, kept[2] ?? null]; placed++;
  }
  return next;
}
export function withoutInterrupts(state: AccountState, content: ValidatedContent): AccountState {
  const options = interruptSkills(content), next = structuredClone(state);
  for (const p of next.team) {
    const actor = next.roster.find(a => a.character_id === p.character_id)!, active = (id: string) => (actor.skill_levels[id] ?? 0) > 0 && (content.skills[id] as unknown as { kind: string }).kind === 'active' && !options.has(id);
    const kept = actor.active_slots.filter((id): id is string => id !== null && active(id));
    for (const id of Object.keys(actor.skill_levels)) if (kept.length < 4 && active(id) && !kept.includes(id)) kept.push(id);
    actor.active_slots = [kept[0] ?? null, kept[1] ?? null, kept[2] ?? null, kept[3] ?? null];
  }
  return next;
}

/**
 * What a player does with the Timeline before a heavy-cast boss (D-067): try each owned interrupt skill of each member in
 * every queue position, keep the best, then try adding a second interrupter. Ranked by wins, then boss casts cancelled, then time.
 */
export function bestInterruptLoadout(state: AccountState, stageId: string, content: ValidatedContent, seeds = 10): AccountState {
  const options = interruptSkills(content);
  const score = (candidate: AccountState) => { let wins = 0, cut = 0, time = 0; for (let s = 1; s <= seeds; s++) { const { sample, final } = storyFight(candidate, stageId, 5000 + s, content); const boss = final.metrics.actors['enemy_front']; if (sample.kind === 'victory') { wins++; time += sample.end_ms; } cut += boss?.casts_interrupted ?? 0; } return { wins, cut, time: wins ? time / wins : Infinity }; };
  const better = (a: ReturnType<typeof score>, b: ReturnType<typeof score>) => a.wins > b.wins || (a.wins === b.wins && (a.cut > b.cut || (a.cut === b.cut && a.time < b.time)));
  const place = (base: AccountState, characterId: string, skill: string, position: number) => {
    const next = structuredClone(base), actor = next.roster.find(a => a.character_id === characterId)!, others = actor.active_slots.filter((id): id is string => id !== null && id !== skill).slice(0, 3);
    others.splice(Math.min(position, others.length), 0, skill); actor.active_slots = [others[0] ?? null, others[1] ?? null, others[2] ?? null, others[3] ?? null]; return next;
  };
  const owned = (s: AccountState) => s.team.flatMap(p => { const actor = s.roster.find(a => a.character_id === p.character_id)!; return [...options.keys()].filter(id => (actor.skill_levels[id] ?? 0) > 0).map(skill => ({ characterId: actor.character_id, skill })); });
  let best = withoutInterrupts(state, content), bestScore = score(best);
  const plain = score(state); if (better(plain, bestScore)) { best = state; bestScore = plain; }
  for (let round = 0; round < 2; round++) {
    const base = best; let improved = false;
    for (const { characterId, skill } of owned(base)) {
      if (base.roster.find(a => a.character_id === characterId)!.active_slots.some(id => id !== null && options.has(id))) continue;
      for (let position = 0; position < 4; position++) { const candidate = place(base, characterId, skill, position), result = score(candidate); if (better(result, bestScore)) { best = candidate; bestScore = result; improved = true; } }
    }
    if (!improved) break;
  }
  return best;
}
