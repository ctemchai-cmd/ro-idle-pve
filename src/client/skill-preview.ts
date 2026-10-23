import { loadValidatedContent } from './content.ts';
import type { ValidatedContent } from '../content/model.ts';
import type { BattleActor, SkillDefinition, StatBlueprint } from '../contracts/index.ts';
import type { BattleScene } from '../contracts/presentation.ts';
import { createBattle, advanceUntil, restoreBattle, serializeBattle } from '../domain/combat/index.ts';
import type { ActorInput, BattleState, BattleEvent } from '../domain/combat/index.ts';
import { resolveSkill } from '../domain/build/resolve-skill.ts';
import { resolveStats } from '../domain/math/index.ts';
import { battleRenderView, sceneLabels } from './story.ts';

const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT_UNAVAILABLE');
const content = loaded.value;
const tree = content.documents['progression.json']!.class_tree as unknown as Record<string, string[]>;
const strings = content.documents['strings.th.json']!.strings as unknown as Record<string, string>;
const presentations = content.documents['actor-presentations.json']!.jobs as unknown as { job_id: string; presets: { gender: string }[] }[];
export const previewJobs = Object.entries(tree).flatMap(([root, children]) => [root, ...children].map(id => ({ id, root, genders: presentations.find(j => j.job_id === id)!.presets.map(p => p.gender) })));
export const previewPackHash = content.manifest.runtime_asset_pack_hash;
export const previewSkillCount = Object.values(content.skills).filter(s => s.class_id !== 'enemy').length;
export interface PreviewSelection { job: string; skill: string; rank: number; gender: string }
export function previewSkills(job: string): SkillDefinition[] {
  const entry = previewJobs.find(j => j.id === job);
  return entry ? Object.values(content.skills).filter(s => s.class_id === entry.root || s.class_id === entry.id) as unknown as SkillDefinition[] : [];
}
export function previewSkillName(id: string) { return strings[String(content.skills[id]?.name_key)] ?? id; }
/** Invalid/deep-linked selections fall back to real catalog entries, never arbitrary programs. */
export function previewSelection(input: Partial<PreviewSelection>): PreviewSelection {
  const job = previewJobs.find(j => j.id === input.job) ?? previewJobs[0]!;
  const skill = previewSkills(job.id).find(s => s.id === input.skill) ?? previewSkills(job.id)[0]!;
  return { job: job.id, skill: skill.id, rank: Math.min(skill.max_level, Math.max(1, Number.isFinite(input.rank) ? Math.floor(input.rank!) : 1)), gender: job.genders.includes(input.gender ?? '') ? input.gender! : job.genders[0]! };
}
function blueprint(job: string | null, enemy = false): StatBlueprint {
  const bp: StatBlueprint = { kind: 'fixed', level: 70, job_id: job, allocated_primary: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 }, derived_offsets: { physical_attack: 0, magical_attack: 0, max_hp: 0, max_sp: 0, physical_defense: 0, magical_defense: 0, attack_speed: 0, cast_speed: 0 }, permanent_sources: [], weapon_element: 'neutral' };
  const base = resolveStats(bp, content);
  const target = { physical_attack: enemy ? 60 : 300, magical_attack: enemy ? 60 : 300, max_hp: enemy ? 1000000 : 10000, max_sp: 1000, physical_defense: 30, magical_defense: 30, attack_speed: 100, cast_speed: 100 };
  for (const key of Object.keys(target) as (keyof typeof target)[]) bp.derived_offsets[key] = target[key] - base[key];
  return bp;
}
/** Disposable engine session. It has no account, wallet, persistence port, or wall clock. */
export class SkillPreviewSession {
  readonly selection: PreviewSelection;
  readonly definition: SkillDefinition;
  readonly scene: BattleScene;
  readonly initial: BattleState;
  readonly preparedSkills: string[];
  readonly names: Record<string, string> = {};
  readonly history: BattleEvent[] = [];
  state: BattleState;
  constructor(selection: Partial<PreviewSelection>, readonly rules: ValidatedContent = content) {
    this.selection = previewSelection(selection);
    const selected = resolveSkill(this.selection.skill, this.selection.rank, rules);
    this.definition = selected.definition as SkillDefinition;
    const active = this.definition.kind === 'active', interrupt = active && this.definition.effects.some(e => e.type === 'interrupt');
    const actors: ActorInput[] = [], looks: BattleScene['actors'][number][] = [];
    const learned = { [this.definition.id]: structuredClone(selected) } as BattleActor['resolved_skills'];
    // Heal passives can demonstrate their actual modifier through a real inherited Heal.
    const healing = !active && this.definition.modifiers.some(m => m.stat === 'outgoing_healing_bonus');
    if (healing) learned.acolyte_heal = structuredClone(resolveSkill('acolyte_heal', 1, rules)) as BattleActor['resolved_skills'][string];
    const supportJobs = [this.selection.job, 'swordsman', 'archer', 'acolyte'];
    for (let i = 0; i < 4; i++) {
      const id = i ? `ally_${i}` : 'caster', job = supportJobs[i]!;
      const skills = i ? {} : learned, skillId = i ? null : active ? this.definition.id : healing ? 'acolyte_heal' : null;
      actors.push({ actor_id: id, team: 'player', kind: 'party', position: ['front_1', 'front_2', 'back_1', 'back_2'][i]!, stat_blueprint: blueprint(job), active_slots: [skillId, null, null, null], resolved_skills: skills, normal_attack_enabled: i === 0 && !active, build_hash: 'readonly_skill_preview', tags: [], spatial: { x: [250, 140, 220, 115][i]!, y: [420, 530, 650, 735][i]!, move_speed: 120, radius: 18, normal_range: 280 } });
      looks.push({ actor_id: id, job_id: job, gender: i ? 'male' : this.selection.gender, facing: 'right', scale: i ? 1.05 : 1.5 });
      this.names[id] = i ? `เพื่อน ${i}` : this.selection.job;
    }
    const poring = (rules.documents['enemies.json']!.actors as unknown as { id: string; presentation: { meta_path: string } }[]).find(e => e.id === 'poring')!;
    for (let i = 0; i < 3; i++) {
      const id = `target_${i}`, enemySkill = i === 0 && interrupt ? 'enemy_cataclysm' : null;
      const bp = blueprint(null, true);
      // The Spell Breaker target starts its real4s cast first, so the interruption can be seen.
      if (enemySkill) bp.derived_offsets.attack_speed += 100;
      actors.push({ actor_id: id, team: 'enemy', kind: 'enemy', position: ['front_1', 'back_1', 'back_2'][i]!, stat_blueprint: bp, active_slots: [enemySkill, null, null, null], resolved_skills: enemySkill ? { [enemySkill]: structuredClone(resolveSkill(enemySkill, 1, rules)) as BattleActor['resolved_skills'][string] } : {}, normal_attack_enabled: !active && i === 0, build_hash: 'readonly_preview_target', tags: ['race_plant', 'size_medium', 'element_neutral'], spatial: { x: [475, 570, 545][i]!, y: [430, 590, 715][i]!, move_speed: 0, radius: 18, normal_range: 700 } });
      looks.push({ actor_id: id, body_meta: poring.presentation.meta_path, facing: 'left', scale: 1.2 }); this.names[id] = 'Poring';
    }
    const result = createBattle({ actors, arena: { width: 720, height: 820, step_ms: 50 }, timing: { skill_interval_base_ms: 3000, normal_attack_base_ms: 1500 }, mode: { kind: 'story', ref: 'readonly:skill-preview', time_limit_ms: 20000, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] } }, rules, 17);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    const prepared = serializeBattle(result.value);
    for (const actor of prepared.actors) if (actor.team === 'player') actor.hp = Math.floor(actor.stats.max_hp * .35);
    // Setup belongs only to this disposable scene. Real cost/spending still runs in the engine.
    if (active && Number(this.definition.cost.spirit_spheres) > 0) prepared.actors.find(a => a.actor_id === 'caster')!.spirit_spheres = 5;
    const restored = restoreBattle(prepared, rules); if (!restored.ok) throw new Error(JSON.stringify(restored.errors));
    this.initial = restored.value; this.state = this.initial;
    const stage = (rules.documents['stages.json']!.stages as unknown as { background: { meta: string }; music: { meta: string } }[])[0]!;
    this.scene = { title: previewSkillName(this.definition.id), subtitle: 'Skill Preview', background_meta: stage.background.meta, music_meta: stage.music.meta, actors: looks, ...sceneLabels() };
    this.preparedSkills = [...new Set(actors.flatMap(a => Object.keys(a.resolved_skills)))];
  }
  advanceTo(gameMs: number): BattleEvent[] {
    const result = advanceUntil(this.state, Math.min(this.state.mode.time_limit_ms, Math.max(this.state.game_time_ms, Math.floor(gameMs))), this.rules);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    this.state = result.value.state; this.history.push(...result.value.events); return result.value.events;
  }
  view() { return battleRenderView(this.state, this.names); }
}
