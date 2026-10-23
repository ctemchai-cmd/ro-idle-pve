import type { AccountState, Command } from '../contracts/index.ts';
import type { ValidatedContent } from '../content/model.ts';
import { applyRosterCommand, type RosterCommand } from '../domain/progression/characters.ts';
import { applySkillCommand } from '../domain/progression/skills.ts';
import { applyEquipmentCommand, type EquipmentCommand } from '../domain/progression/equipment.ts';
import { applySlotCommand, type SlotCommand } from '../domain/progression/slots.ts';
import { applyGearUpgrade } from '../domain/progression/gear-upgrades.ts';
import { compactPaidLedger } from '../domain/progression/ledger.ts';

/** Display only: reuse the game's reducers without changing the confirmed checkpoint or guessing random results. */
export function previewSave(state: AccountState, command: Command, content: ValidatedContent): AccountState | null {
  if (state.active_battle) return null;
  const next = structuredClone(state);
  try {
    if (command.type === 'party.set' || command.type.startsWith('character.')) applyRosterCommand(next, command as RosterCommand, content);
    else if (command.type === 'skill.upgrade' || command.type === 'skill.set_loadout' || command.type === 'skill.awaken' || command.type === 'skill.convert_shards') applySkillCommand(next, command, content);
    else if (command.type === 'equipment.tier_up') applyGearUpgrade(next, command, content);
    else if (['equipment.equip', 'equipment.equip_upgrades', 'equipment.unequip', 'equipment.lock', 'equipment.salvage', 'equipment.purchase_weapon'].includes(command.type)) applyEquipmentCommand(next, command as EquipmentCommand, content);
    else if (['slot.enchant', 'slot.change_enchant', 'card.assign', 'card.unassign', 'card.upgrade', 'card.salvage'].includes(command.type)) applySlotCommand(next, command as SlotCommand, content);
    else return null;
    next.paid_ledger = compactPaidLedger(next.paid_ledger);
    return next;
  } catch { return null; } // An unavailable upgrade stays unchanged until the normal command result explains it.
}
