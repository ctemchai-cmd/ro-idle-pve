import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { equipmentFit, equipmentRules, itemDefinition, type EquipmentSlot } from './equipment-definition.ts';

/** The same recommendation drives the red slot indicator and atomic equip-all command. */
export function equipmentUpgrades(state: AccountState, characterId: string, content: ValidatedContent): Partial<Record<EquipmentSlot, string>> {
  const result: Partial<Record<EquipmentSlot, string>> = {};
  const actor = state.roster.find(a => a.character_id === characterId);
  if (!actor || state.active_battle) return result;
  const items = new Map(state.inventory.map(item => [item.instance_id, item]));
  const assigned = new Set(state.roster.flatMap(owner => Object.values(owner.equipment)).filter(Boolean));
  const ranks = new Map(equipmentRules(content).rarities.map(row => [row.id, row.rank]));
  const higher = (a: AccountState['inventory'][number], b: AccountState['inventory'][number]) => {
    const left = itemDefinition(a, content), right = itemDefinition(b, content);
    return left.tier_level > right.tier_level || (left.tier_level === right.tier_level && ranks.get(a.rarity_id)! > ranks.get(b.rarity_id)!);
  };
  for (const item of state.inventory) {
    if (item.kind !== 'equipment' || assigned.has(item.instance_id)) continue;
    const slot = itemDefinition(item, content).slot as EquipmentSlot;
    if (equipmentFit(actor, slot, item, content)) continue;
    const current = items.get(actor.equipment[slot] ?? '');
    if (current && !higher(item, current)) continue;
    const suggested = items.get(result[slot] ?? '');
    if (!suggested || higher(item, suggested)) result[slot] = item.instance_id;
  }
  return result;
}
