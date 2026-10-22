import type { Modifier } from './index.ts';

/** A learned skill can replace a resource's default per-unit value, not multiply it. */
export interface ResourceStatModifier extends Modifier {
  value_from_skill?: { skill_id: string; level_parameter: string };
}
export interface CombatResourceDefinition {
  id: 'sp' | 'spirit_spheres';
  per_unit_modifiers?: ResourceStatModifier[];
}
