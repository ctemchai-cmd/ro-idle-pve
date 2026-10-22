import type { BattleActor, Modifier } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import type { CombatResourceDefinition } from '../../contracts/combat-resources.ts';
import type { DeepReadonly } from '../../content/value.ts';

type ResourceActor = DeepReadonly<Pick<BattleActor, 'sp' | 'spirit_spheres'> & Partial<Pick<BattleActor, 'resolved_skills'>>>;

/** Held resources contribute to the existing stat buckets; spent resources contribute nothing. */
export function heldResourceModifiers(actor: ResourceActor, content: ValidatedContent): Modifier[] {
  const rows = content.documents['stat-definitions.json']!.combat_resources as unknown as CombatResourceDefinition[];
  return rows.flatMap(row => (row.per_unit_modifiers ?? []).map(({ value_from_skill, ...modifier }) => {
    const learned = value_from_skill && actor.resolved_skills?.[value_from_skill.skill_id];
    const value = learned
      ? learned.definition.level_parameters[value_from_skill!.level_parameter]?.[learned.level - 1]
      : modifier.value;
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('UNRESOLVED_RESOURCE_MODIFIER');
    return { ...modifier, id: `${row.id}_${modifier.id}`, value: value * actor[row.id] };
  }));
}
