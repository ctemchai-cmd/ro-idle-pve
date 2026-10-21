import type { BattleActor, Modifier } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';

/** Held resources contribute to the existing stat buckets; spent resources contribute nothing. */
export function heldResourceModifiers(actor: Pick<BattleActor, 'sp' | 'spirit_spheres'>, content: ValidatedContent): Modifier[] {
  const rows = content.documents['stat-definitions.json']!.combat_resources as unknown as { id: 'sp' | 'spirit_spheres'; per_unit_modifiers?: Modifier[] }[];
  return rows.flatMap(row => (row.per_unit_modifiers ?? []).map(modifier => {
    if (typeof modifier.value !== 'number') throw new Error('UNRESOLVED_RESOURCE_MODIFIER');
    return { ...modifier, id: `${row.id}_${modifier.id}`, value: modifier.value * actor[row.id] };
  }));
}
