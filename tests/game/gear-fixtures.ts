import type { AccountState } from '../../src/contracts/index.ts';
import { content } from './combat-fixtures.ts';

/**
 * Test-only: equips the former TASK-009 starter set (Common Tier 1, job-compatible weapon, ids
 * `starter_<character>_<slot>`). D-059 removed starter gear from real accounts; equipment mechanics
 * tests keep their fixtures through this helper instead of the account factory.
 */
export function equipStarterSet<T extends AccountState>(state: T): T {
  const compatibility = content.documents['equipment.json']!.weapon_compatibility as Readonly<Record<string, string>>;
  for (const actor of state.roster) for (const slot of ['weapon', 'head', 'armor', 'garment', 'shoes', 'accessory'] as const) {
    const definition = Object.values(content.items).find(item => item.kind === 'equipment' && item.slot === slot && item.tier_level === 1 && (slot !== 'weapon' || item.weapon_type === compatibility[actor.job_id]));
    if (!definition) throw new Error(`NO_TIER1_${slot}`);
    const id = `starter_${actor.character_id}_${slot}`;
    state.inventory.push({ instance_id: id, definition_id: String(definition.id), kind: 'equipment', rarity_id: 'common', locked: false, training: false, options: [] });
    actor.equipment[slot] = id;
  }
  return state;
}
