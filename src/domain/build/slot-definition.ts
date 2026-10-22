import type { Modifier } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import type { EquipmentSlot } from './equipment-definition.ts';

export interface EnchantLine { label: string; modifiers: Modifier[] }
export interface SlotModifiers {
  refine: { per_step_modifiers: Record<EquipmentSlot, Modifier[]> };
  enchant: { slot_lines: Record<EquipmentSlot, Record<string, EnchantLine>> };
}
export const slotModifiers = (content: ValidatedContent) => content.documents['slot-progress.json'] as unknown as SlotModifiers;
export const enchantLinesFor = (slot: EquipmentSlot, content: ValidatedContent) => slotModifiers(content).enchant.slot_lines[slot];
