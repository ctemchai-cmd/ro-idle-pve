import type { BattleCheckpoint, SkillDefinition } from '../../src/contracts/index.ts';
import type { ActorInput, BattleInput, BattleState, BattleStep } from '../../src/domain/combat/index.ts';
import { createBattle, advanceUntil } from '../../src/domain/combat/index.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import type { Result } from '../../src/content/model.ts';
const loaded = loadValidatedContent();
if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors));
export const content = loaded.value;
export type Active = Extract<SkillDefinition, { kind: 'active' }>;
export function skill(id = 'test_hit', cast = 1000, acd = 500, cost = 12, power = 10): Active {
  return { id, name_key: id, kind: 'active', class_id: 'enemy', max_level: 1, unlock_level: 1, tags: [], level_parameters: {},
    cost: { sp: cost, spirit_spheres: 0 }, timing: { cast_ms: cast, after_cast_ms: acd, interruptible: true },
    selectors: { foe: { team: 'enemies', life: 'living', select: 'front_first', count: null, phase: 'cast_resolve', missing: 'skip' } }, start_effects: [],
    effects: [{ id: 'hit', type: 'damage', target: 'foe', formula: { id: 'flat_power', params: { amount: power } }, damage_type: 'physical', element: 'neutral', hit_rule: 'always', can_crit: false, hits: 1, armor_rule: 'normal' }],
  };
}
export function actor(id: string, team: 'player' | 'enemy', skills: Active[] = [], normal = false): ActorInput {
  return { actor_id: id, team, kind: team === 'player' ? 'party' : 'enemy', position: 'front_1', build_hash: 'unit_test_build', normal_attack_enabled: normal,
    stat_blueprint: { kind: 'fixed', level: 1, job_id: null, allocated_primary: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 },
      derived_offsets: { physical_attack: 0, magical_attack: 0, max_hp: 100000000, max_sp: 0, physical_defense: -12, magical_defense: -12, attack_speed: 0, cast_speed: 0 }, permanent_sources: [], weapon_element: 'neutral' },
    active_slots: [skills[0]?.id ?? null, skills[1]?.id ?? null, skills[2]?.id ?? null, skills[3]?.id ?? null],
    resolved_skills: Object.fromEntries(skills.map(definition => [definition.id, { level: 1, definition }])), tags: [],
  };
}
export function unwrap<T>(result: Result<T>): T { if (!result.ok) throw new Error(JSON.stringify(result.errors)); return result.value; }
export function battle(actors = [actor('a', 'player', [skill()]), actor('b', 'enemy')], seed = 1, limit = 90000): BattleState {
  const mode: BattleInput['mode'] = { kind: 'story', ref: 'unit-test', time_limit_ms: limit, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] };
  return unwrap(createBattle({ actors, mode }, content, seed));
}
export function step(state: BattleState, to: number): BattleStep { return unwrap(advanceUntil(state, to, content)); }
export function checkpoint(state: BattleState): BattleCheckpoint { return structuredClone(state) as BattleCheckpoint; }
