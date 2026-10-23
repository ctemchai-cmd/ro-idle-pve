import { battleStatusViews } from './combat-status.ts';
import { loadValidatedContent } from './content.ts';
import type { ValidatedContent } from '../content/model.ts';
import type { CombatStats, StatBlueprint } from '../contracts/index.ts';
import type { ActorRenderView, BattleRenderView, BattleScene, BattleTimeline } from '../contracts/presentation.ts';
import { projectBattleTimeline } from './battle-timeline.ts';
import { createBattle, advanceUntil } from '../domain/combat/index.ts';
import type { ActorInput, BattleState, BattleEvent } from '../domain/combat/index.ts';
import { resolveSkill } from '../domain/build/resolve-skill.ts';
import { resolveStats } from '../domain/math/index.ts';
import { combatStatistics } from '../domain/combat/statistics.ts';

export const DEMO_ENCOUNTERS = [
  { id: 'field', name: 'ทุ่งพรอนเทรา', note: 'ฝึกต่อสู้กับเหล่ามอนสเตอร์', stage: '1-6', level: 10 },
  { id: 'boss', name: 'บอสทุ่งหญ้า', note: 'ลองใช้สตันขัดจังหวะบอส', stage: '1-10', level: 10 },
  { id: 'warded', name: 'บอสเกราะเวท', note: 'ท่าร่ายหลักขัดไม่ได้', stage: '1-10', level: 10 },
  { id: 'storm', name: 'พายุของ Wizard', note: 'ทดลอง Storm Gust และสกิลหมู่', stage: '2-10', level: 20 },
] as const;
export type DemoEncounterId = typeof DEMO_ENCOUNTERS[number]['id'];
type Stage = { id: string; encounter: { actor_id: string; definition_id: string; level: number; position: string; element: string; resolved_base: CombatStats; active_slots: (string | null)[]; passives: string[] }[]; background: { meta: string }; music: { meta: string }; time_limit_ms: number };
const jobs = ['swordsman', 'archer', 'acolyte', 'mage'];
const names: Record<string, string> = { main: 'นักดาบของคุณ', npc_archer: 'อารี · Archer', npc_acolyte: 'ลูเมน · Acolyte', npc_mage: 'เรน · Mage' };
/** Hand-allocated Lv.10 sample builds:45points each, not automatic class growth. */
const demoAllocations: Record<string, StatBlueprint['allocated_primary']> = {
  main: { str: 16, agi: 11, vit: 11, int: 1, dex: 1, luk: 6 },
  npc_archer: { str: 6, agi: 21, vit: 1, int: 1, dex: 11, luk: 1 },
  npc_acolyte: { str: 1, agi: 1, vit: 11, int: 21, dex: 6, luk: 1 },
  npc_mage: { str: 1, agi: 1, vit: 6, int: 11, dex: 21, luk: 1 },
};
let cachedContent: ValidatedContent | undefined;
function getContent(): ValidatedContent { if (cachedContent) return cachedContent; const result = loadValidatedContent(); if (!result.ok) throw new Error(JSON.stringify(result.errors)); cachedContent = result.value; return cachedContent; }
function blueprint(level: number, job: string | null): StatBlueprint {
  return { kind: job ? 'character' : 'fixed', level, job_id: job, allocated_primary: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 }, derived_offsets: { physical_attack: 0, magical_attack: 0, max_hp: 0, max_sp: 0, physical_defense: 0, magical_defense: 0, attack_speed: 0, cast_speed: 0 }, permanent_sources: [], weapon_element: 'neutral' };
}
/** Disposable combat sandbox; account progression/learn costs remain outside this adapter. */
export class DemoSession {
  readonly content = getContent();
  readonly scene: BattleScene;
  readonly initial: BattleState;
  state: BattleState;
  readonly history: BattleEvent[] = [];
  private projectedTimeline?: Promise<BattleTimeline>;
  private readonly actorNames: Record<string, string>;
  constructor(readonly encounter: DemoEncounterId = 'boss', seed = 2, rotations: Record<string, readonly (string | null)[]> = {}) {
    const preset = DEMO_ENCOUNTERS.find(row => row.id === encounter); if (!preset) throw new Error('UNKNOWN_DEMO_ENCOUNTER');
    const stages = this.content.documents['stages.json']!.stages as unknown as Stage[];
    const stage = stages.find(row => row.id === preset.stage)!;
    const enemyDefinitions = this.content.documents['enemies.json']!.actors as unknown as { id: string; presentation: { meta_path: string }; normal_attack: boolean }[];
    const learnedSkill = (id: string): ActorInput['resolved_skills'][string] => structuredClone(resolveSkill(id, 1, this.content)) as ActorInput['resolved_skills'][string];
    const actors: ActorInput[] = [];
    const appearances: BattleScene['actors'][number][] = [];
    this.actorNames = { ...names };
    for (const [index, root] of jobs.entries()) {
      const id = index === 0 ? 'main' : `npc_${root}`, job = encounter === 'storm' && root === 'mage' ? 'wizard' : root;
      const definitions = Object.values(this.content.skills).filter(row => row.class_id === root && Number(row.unlock_level) <= preset.level);
      let activeIds = definitions.filter(row => row.kind === 'active').slice(0, 4).map(row => String(row.id));
      if (job === 'wizard') { activeIds = ['wizard_storm_gust', 'mage_fire_bolt', 'mage_cold_bolt', 'wizard_jupitel']; this.actorNames[id] = 'เรน · Wizard'; }
      const learnedIds = [...activeIds, ...definitions.filter(row => row.kind === 'passive').map(row => String(row.id))];
      const learned = Object.fromEntries(learnedIds.map(skill => [skill, learnedSkill(skill)]));
      const slots = rotations[id] ? [...rotations[id]!] : activeIds;
      if (slots.length !== 4 || slots.some(skill => skill === null || !activeIds.includes(skill)) || new Set(slots).size !== 4) throw new Error('INVALID_DEMO_ROTATION');
      const bp = blueprint(preset.level, job);
      if (preset.level >= 10) bp.allocated_primary = { ...demoAllocations[id]! };
      actors.push({ actor_id: id, kind: 'party', team: 'player', position: ['front_1', 'front_2', 'back_1', 'back_2'][index]!, stat_blueprint: bp, active_slots: slots as ActorInput['active_slots'], resolved_skills: learned, normal_attack_enabled: true, spatial: { x: [220, 105, 200, 100][index]!, y: [340, 490, 580, 680][index]!, move_speed: 120, radius: 18, normal_range: [68, 285, 76, 260][index]! }, tags: [], build_hash: `demo_${job}_${preset.level}_${preset.level >= 10 ? 'manual45' : 'unallocated'}` });
      appearances.push({ actor_id: id, job_id: job, facing: 'right', scale: 1.35 });
    }
    for (const source of stage.encounter.filter(actor => encounter === 'field' || actor.actor_id === 'enemy_front')) {
      const definition = enemyDefinitions.find(row => row.id === source.definition_id)!;
      const bp = blueprint(source.level, null);
      for (const key of Object.keys(bp.allocated_primary) as (keyof StatBlueprint['allocated_primary'])[]) bp.allocated_primary[key] = source.resolved_base[key];
      const baseline = resolveStats(bp, this.content);
      // Encounters own resolved enemy bases; convert once into the shared stat blueprint.
      for (const key of Object.keys(bp.derived_offsets) as (keyof StatBlueprint['derived_offsets'])[]) bp.derived_offsets[key] = source.resolved_base[key] - baseline[key];
      const ids = [...source.active_slots.filter((id): id is string => !!id), ...source.passives];
      const learned = Object.fromEntries(ids.map(id => [id, learnedSkill(id)]));
      if (encounter === 'warded') for (const skill of Object.values(learned)) if (skill.definition.kind === 'active' && skill.definition.tags.includes('heavy_cast')) skill.definition.timing.interruptible = false;
      actors.push({ actor_id: source.actor_id, kind: 'enemy', team: 'enemy', position: source.position, stat_blueprint: bp, active_slots: source.active_slots as ActorInput['active_slots'], resolved_skills: learned, normal_attack_enabled: definition.normal_attack, spatial: { x: source.actor_id === 'enemy_front' ? 520 : 590, y: source.actor_id === 'enemy_front' ? 400 : source.position.endsWith('2') ? 640 : 530, move_speed: 85, radius: encounter === 'field' ? 22 : 30, normal_range: encounter === 'field' ? 65 : 80 }, tags: [`element:${source.element}`], build_hash: `demo_${stage.id}_${source.actor_id}` });
      this.actorNames[source.actor_id] = source.actor_id === 'enemy_front' ? (encounter === 'field' ? source.definition_id : 'บอส · ' + source.definition_id) : source.definition_id;
      appearances.push({ actor_id: source.actor_id, body_meta: definition.presentation.meta_path, facing: 'left', scale: source.actor_id === 'enemy_front' && encounter !== 'field' ? 1.9 : 1.35 });
    }
    const result = createBattle({ actors, arena: { width: 720, height: 820, step_ms: 50 }, timing: { skill_interval_base_ms: 3000, normal_attack_base_ms: 1500 }, mode: { kind: 'story', ref: `demo:${encounter}`, time_limit_ms: stage.time_limit_ms, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] } }, this.content, seed);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    this.initial = result.value; this.state = this.initial;
    const strings = this.content.documents['strings.th.json']!.strings as unknown as Record<string, string>;
    const labels = Object.fromEntries(Object.values(this.content.skills).map(skill => [String(skill.id), strings[String(skill.name_key)] ?? String(skill.id)]));
    const enemyPresentations = this.content.documents['enemies.json']!.presentations as unknown as { skill_id: string; visual: { recipe_skill_id: number } }[];
    this.scene = { title: preset.name, subtitle: preset.note, background_meta: stage.background.meta, music_meta: stage.music.meta, actors: appearances, skill_labels: labels, enemy_recipes: Object.fromEntries(enemyPresentations.map(row => [row.skill_id, row.visual.recipe_skill_id])) };
  }
  advanceTo(gameMs: number): BattleEvent[] {
    const result = advanceUntil(this.state, gameMs, this.content); if (!result.ok) throw new Error(JSON.stringify(result.errors));
    this.state = result.value.state; this.history.push(...result.value.events); return result.value.events;
  }
  timeline(yieldTask: () => Promise<void> = () => Promise.resolve()): Promise<BattleTimeline> {
    return this.projectedTimeline ??= projectBattleTimeline(this.initial, this.content, yieldTask);
  }
  view(): BattleRenderView {
    const statuses = battleStatusViews(this.state);
    const actors: ActorRenderView[] = this.state.actors.map(actor => ({ ...statuses[actor.actor_id], actor_id: actor.actor_id, name: this.actorNames[actor.actor_id] ?? actor.actor_id, team: actor.team, position: actor.position, hp: actor.hp, max_hp: actor.stats.max_hp, sp: actor.sp, max_sp: actor.stats.max_sp, level: actor.stat_blueprint.level,
      ...(actor.spatial ? { spatial: actor.spatial } : {}), phase: actor.action_phase, phase_started_at: actor.phase_started_at, phase_ready_at: actor.phase_ready_at, phase_duration_ms: actor.phase_duration_ms, cast: actor.cast ? { skill_id: actor.cast.skill_id, interruptible: actor.cast.interruptible } : null,
      next_slot: actor.cast?.used_slot_index ?? actor.rotation_cursor, slots: actor.active_slots, status_ids: actor.statuses.map(status => status.status_id) }));
    return { ...(this.state.arena ? { arena: this.state.arena } : {}), game_time_ms: this.state.game_time_ms, time_limit_ms: this.state.mode.time_limit_ms, actors, terminal: this.state.terminal_result ? { kind: this.state.terminal_result.kind, at_ms: this.state.terminal_result.at_game_ms } : null };
  }
  statistics() { return combatStatistics(this.state); }
}
export type { BattleEvent, BattleState };
