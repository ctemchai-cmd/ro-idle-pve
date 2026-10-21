import { loadValidatedContent } from '../content/index.ts';
import { initializeAccount } from '../domain/progression/initialize.ts';
import { applyGearUpgrade, type GearUpgradeCommand } from '../domain/progression/gear-upgrades.ts';
import { compactPaidLedger } from '../domain/progression/ledger.ts';
import { applySlotCommand, type SlotCommand } from '../domain/progression/slots.ts';
import { applyEquipmentCommand, type EquipmentCommand } from '../domain/progression/equipment.ts';
import { applySkillCommand, type SkillCommand } from '../domain/progression/skills.ts';
import { applyRosterCommand, progressionData } from '../domain/progression/characters.ts';
import type { RosterCommand } from '../domain/progression/characters.ts';
import type { AccountState } from '../contracts/index.ts';
import { jobBonus } from '../domain/build/character.ts';
import { randomId } from './secure-context.ts';
export { allocationQuote, effectiveLevelCap, levelQuote } from '../domain/progression/characters.ts';
export type BuildCommand = RosterCommand | SkillCommand | EquipmentCommand | SlotCommand | GearUpgradeCommand;
export type { Character, RootJob, RosterCommand } from '../domain/progression/characters.ts';
const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT_UNAVAILABLE');
const content = loaded.value;
/** D-061 fixed job bonus shown as RO-style "+N" next to allocated primaries. */
export const characterJobBonus = (actor: Pick<AccountState['roster'][number], 'root_job_id'>) => jobBonus(actor, content);
export const rosterData = progressionData(content);
export const rosterVersions = { content_version: content.manifest.content_version, content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version };
export const rosterPackHash = content.manifest.runtime_asset_pack_hash;
/** Explicit unconfigured demo; never writes account/cloud progression. */
export function initialRosterSandbox(): AccountState {
  const at = new Date().toISOString();
  return initializeAccount(content, { root_job_id: 'swordsman', gender: 'male' }, at, at.slice(0,10), 1);
}
export function applySandboxRoster(state: AccountState, type: BuildCommand['type'], params: unknown): AccountState {
  const next = structuredClone(state);
  const command = { type, params, request_id: randomId(), expected_revision: 0, schema_version: 1, ...rosterVersions } as BuildCommand;
  if(command.type==='skill.upgrade'||command.type==='skill.set_loadout')applySkillCommand(next,command,content);
  else if(command.type.startsWith('slot.')||command.type.startsWith('card.'))applySlotCommand(next,command as SlotCommand,content,Math.random());
  else if(command.type==='equipment.fuse'||command.type==='equipment.tier_up')applyGearUpgrade(next,command as GearUpgradeCommand,content);
  else if(command.type.startsWith('equipment.'))applyEquipmentCommand(next,command as EquipmentCommand,content);
  else applyRosterCommand(next,command as RosterCommand,content);
  next.paid_ledger=compactPaidLedger(next.paid_ledger);
  return next;
}
