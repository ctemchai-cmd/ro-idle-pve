import type { BattleCheckpoint, Scenario, SkillDefinition } from '../contracts/index.ts';
import type { ValidatedContent } from '../content/model.ts';
import type { ActorInput } from '../domain/combat/index.ts';
import { createBattle, serializeBattle } from '../domain/combat/index.ts';
import { resolveSkill } from '../domain/build/resolve-skill.ts';
import type { ReplayInput } from './index.ts';

export const FIXTURES = ['single_target', 'area', 'healer', 'guard', 'sp_starved', 'cc_resistance'] as const;
export type FixtureId = typeof FIXTURES[number];
type Active = Extract<SkillDefinition, { kind: 'active' }>;
function probe(id: string, castMs = 1000, area = false): Active {
  return { id, name_key: id, kind: 'active', class_id: 'enemy', max_level: 1, unlock_level: 1, tags: ['simulation_probe'], level_parameters: {}, cost: { sp: 0, spirit_spheres: 0 }, timing: { cast_ms: castMs, after_cast_ms: 500, interruptible: true },
    selectors: { foe: { team: 'enemies', life: 'living', select: area ? 'all' : 'front_first', count: null, phase: 'cast_resolve', missing: 'skip' } }, start_effects: [], effects: [{ id: 'hit', type: 'damage', target: 'foe', formula: { id: 'flat_power', params: { amount: 100 } }, damage_type: 'physical', element: 'neutral', hit_rule: 'physical_roll', can_crit: true, hits: 1, armor_rule: 'normal' }] };
}
function makeActor(id: string, team: 'player' | 'enemy', position: string, job: string | null, skill: SkillDefinition, normal = true): ActorInput {
  return { actor_id: id, team, kind: team === 'player' ? 'party' : 'enemy', position, build_hash: `fixture_${id}_${skill.id}`, tags: ['simulation_probe'], normal_attack_enabled: normal,
    stat_blueprint: { kind: 'fixed', level: 1, job_id: job, allocated_primary: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 }, derived_offsets: { max_hp: 1000000, max_sp: 1000, physical_attack: 0, magical_attack: 0, physical_defense: 0, magical_defense: 0, attack_speed: 0, cast_speed: 0 }, permanent_sources: [], weapon_element: 'neutral' },
    active_slots: [skill.id, null, null, null], resolved_skills: { [skill.id]: { level: 1, definition: skill } } };
}
/** Controlled engine probes, not spend-verified player builds or balance verdicts. */
export function createFixture(id: FixtureId, seed: number, content: ValidatedContent, variant = 'baseline', trace = false): ReplayInput {
  if (!FIXTURES.includes(id)) throw new Error('UNKNOWN_SCENARIO_FIXTURE');
  if (!['baseline', 'power_plus10pct'].includes(variant)) throw new Error('UNKNOWN_VARIANT');
  const resolved = (skill: string) => structuredClone(resolveSkill(skill, 1, content).definition) as SkillDefinition;
  const main = makeActor('main', 'player', 'front_1', 'swordsman', resolved('swordsman_bash'));
  const support = makeActor('npc_acolyte', 'player', 'back_1', 'acolyte', resolved(id === 'healer' ? 'acolyte_heal' : 'acolyte_holy_light'));
  const archer = makeActor('npc_archer', 'player', 'front_2', 'archer', resolved(id === 'area' ? 'archer_arrow_shower' : 'archer_double_strafe'));
  const mage = makeActor('npc_mage', 'player', 'back_2', 'mage', resolved('mage_fire_bolt'));
  if (variant === 'power_plus10pct') {
    const definition = main.resolved_skills.swordsman_bash!.definition;
    if (definition.kind !== 'active') throw new Error('FIXTURE_SKILL_KIND');
    for (const effect of definition.effects) if (effect.type === 'damage' && 'attack_ratio' in effect.formula.params) effect.formula.params.attack_ratio = Number(effect.formula.params.attack_ratio) * 1.1;
  }
  if (id === 'guard') {
    const guard = probe('probe_guard', 0); guard.effects = [{ id: 'guard', type: 'apply_status', target: 'self', status_id: 'guard_up', duration_ms: 3000, chance: 1, params: { ratio: .3 } }, { id: 'shield', type: 'shield', target: 'self', duration_ms: 5000, dispelable: true, formula: { id: 'flat_power', params: { amount: 100 } } }];
    main.active_slots = [guard.id, 'swordsman_bash', null, null]; main.resolved_skills[guard.id] = { level: 1, definition: guard };
  }
  if (id === 'sp_starved') for (const actor of [main, mage, support, archer]) actor.stat_blueprint.derived_offsets.max_sp = -50;
  const boss = makeActor('enemy_boss', 'enemy', 'front_1', null, probe('probe_boss', 1200, id === 'area' || id === 'healer'));
  if (id === 'cc_resistance') boss.stat_blueprint.permanent_sources.push({ source: { instance_id: 'boss_adapt', definition_id: 'boss_adapt', owner_actor_id: boss.actor_id, origin_actor_id: boss.actor_id, origin_life_epoch: 0 }, modifiers: [], triggers: [{ id: 'adapt', event: 'control_applied', chance: 1, accepted_origins: ['skill', 'proc', 'periodic'], limit_scope: 'none', limit_count: 1, reentry: 'deny_same_source_trigger_in_ancestry', selectors: {}, effects: [{ id: 'resist', type: 'apply_status', target: 'self', status_id: 'cc_resistance_up', duration_ms: 6000, chance: 1, params: { ratio: .1 } }] }] });
  const party = [main, archer, support, mage]; const actors = [...party, boss];
  if (id === 'area') actors.push(makeActor('enemy_left', 'enemy', 'front_2', null, probe('probe_left', 1000)), makeActor('enemy_back', 'enemy', 'back_1', null, probe('probe_back', 500)));
  const mode: BattleCheckpoint['mode'] = { kind: 'story', ref: `fixture:${id}`, time_limit_ms: 90000, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] };
  const initial = createBattle({ actors, mode }, content, seed); if (!initial.ok) throw new Error(JSON.stringify(initial.errors));
  const checkpoint = serializeBattle(initial.value);
  if (id === 'healer') for (const actor of checkpoint.actors.filter(actor => actor.team === 'player')) actor.hp -= actor.actor_id === 'main' ? 10000 : 5000;
  const scenario: Scenario = { id, schema_version: 1, content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version, seed, mode: { kind: 'story', ref: mode.ref }, budget_policy: 'equal_spent_for_AB', log_level: trace ? 'trace' : 'summary', team: party.map(actor => ({ actor_id: actor.actor_id, build_id: actor.build_hash, position: actor.position as Scenario['team'][number]['position'], equipment_profile: 'controlled_engine_probe_no_gear' })) as Scenario['team'] };
  return { schema_version: 1, scenario, variant_id: variant, initial_checkpoint: checkpoint, spent_budget: { gold: 0, hero_exp: 0, skill_materials: 0, allocated_extra_primary_points: 0 } };
}
