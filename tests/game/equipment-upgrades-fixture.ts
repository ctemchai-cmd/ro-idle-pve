import type { AccountState } from '../../src/contracts/index.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { content } from './combat-fixtures.ts';
import { equipStarterSet } from './gear-fixtures.ts';
export type Gear = Extract<AccountState['inventory'][number], { kind: 'equipment' }>;
export const equipmentUpgradeGear = (id: string, definition: string, rarity: Gear['rarity_id'] = 'epic'): Gear => ({ instance_id: id, definition_id: definition, kind: 'equipment', rarity_id: rarity, locked: false, training: false, options: [] });
/** Disposable synthetic inventory, not earned loot or an owner save. */
export function equipmentUpgradesFixture(): AccountState {
  const state = equipStarterSet(initializeAccount(content, { root_job_id: 'swordsman', gender: 'male' }, '2026-10-23T00:00:00.000Z', '2026-10-23', 17));
  const actor = state.roster[0]!, npc = state.roster.find(a => a.character_id === 'npc_swordsman')!;
  for (const who of [actor, npc]) { who.level = 20; who.unspent_status_points = 91; }
  for (const slot of ['weapon', 'head', 'armor', 'garment', 'shoes', 'accessory'] as const) {
    const kind = slot === 'weapon' ? 'sword' : slot;
    state.inventory.push(equipmentUpgradeGear(`upgrade_${slot}`, `equipment_${kind}_20`));
    actor.slot_progress[slot].refine = 5; actor.slot_progress[slot].enchant = { line_id: 'offense', level: 2 };
  }
  state.inventory.find(i => i.instance_id === 'upgrade_head')!.locked = true;
  state.inventory.push(equipmentUpgradeGear('wrong_job', 'equipment_bow_20', 'supreme'), equipmentUpgradeGear('future_level', 'equipment_sword_40', 'supreme'), equipmentUpgradeGear('npc_owned', 'equipment_sword_20', 'supreme'));
  npc.equipment.weapon = 'npc_owned';
  state.inventory.push({ instance_id: 'equipped_card', definition_id: 'card_weapon_1', kind: 'card', rarity_id: 'common', level: 1, locked: false });
  actor.slot_progress.weapon.cards[0] = 'equipped_card';
  return state;
}
