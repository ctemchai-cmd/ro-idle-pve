import {emptyCrafting} from './equipment-crafting.ts';
import type { AccountState, Command } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
export type CreateAccountCommand = Extract<Command, { type: 'account.create' }>;
type RootJob = CreateAccountCommand['params']['root_job_id'];
type Character = AccountState['roster'][number];
type EquipmentSlot = keyof Character['slot_progress'];
type EquipmentItem = Extract<AccountState['inventory'][number], { kind: 'equipment' }>;
interface InitialRules {
  wallet: Partial<AccountState['wallet']>; grant_id: string; main_id: string;
  main_root_choice: RootJob[]; initial_level: number; initial_local_cap: Character['local_cap'];
  initial_primary_stats: AccountState['roster'][number]['primary_stats'];
  initial_unspent_status_points: number;
  npc_roster: { character_id: string; root_job_id: RootJob; initial_job_id: RootJob; initial_level: number }[];
  initial_active_skill_grants: { count_per_class1: number; skill_level: number };
  starter_gear: { mode: 'none' } | { mode?: 'set'; rarity_id: EquipmentItem['rarity_id']; tier: number };
}
/** Pure server-owned initial state; time/day/seed enter as values, never globals. */
export function initializeAccount(content: ValidatedContent, choice: CreateAccountCommand['params'], serverAt: string, localDay: string, seed: number): AccountState {
  const rules = content.documents['progression.json']!.initial_state as unknown as InitialRules;
  if (!rules.main_root_choice.includes(choice.root_job_id)) throw new Error('INVALID_ROOT_JOB');
  const compatibility = content.documents['equipment.json']!.weapon_compatibility as Readonly<Record<string, string>>;
  const inventory: AccountState['inventory'] = [], roster: Character[] = [];
  if (rules.npc_roster.length !== 6) throw new Error('STARTER_ROSTER_CATALOG_MISMATCH');
  const slots = ['weapon', 'head', 'armor', 'garment', 'shoes', 'accessory'] as const;
  const actors = [{ character_id: rules.main_id, root_job_id: choice.root_job_id, initial_job_id: choice.root_job_id, initial_level: rules.initial_level }, ...rules.npc_roster];
  for (const actor of actors) {
    const main = actor.character_id === rules.main_id;
    const skillDocument = content.documents[`skills/${actor.root_job_id}.json`]!;
    const skillIds = (skillDocument.skills as readonly { id: string; kind: string; class_id: string; unlock_level: number }[]).filter(skill => skill.kind === 'active' && skill.class_id === actor.initial_job_id && skill.unlock_level <= actor.initial_level).map(skill => skill.id);
    if (skillIds.length !== rules.initial_active_skill_grants.count_per_class1) throw new Error('STARTER_SKILL_CATALOG_MISMATCH');
    const equipment = {} as AccountState['roster'][number]['equipment'];
    const slotProgress = {} as Record<EquipmentSlot, Character['slot_progress']['weapon']>;
    for (const slot of slots) {
      slotProgress[slot] = { refine: 0, refine_failures: 0, enchant: { line_id: null, level: 0 }, cards: [null, null, null] };
      // D-059: accounts start with empty equipment slots; slot progress still exists per slot.
      const gear = rules.starter_gear;
      if (gear.mode === 'none') { equipment[slot] = null; continue; }
      const definitions = Object.values(content.items).filter(item => item.kind === 'equipment' && item.slot === slot && item.tier_level === gear.tier && (slot !== 'weapon' || item.weapon_type === compatibility[actor.initial_job_id]));
      if (definitions.length !== 1) throw new Error('STARTER_EQUIPMENT_CATALOG_MISMATCH');
      const instanceId = `starter_${actor.character_id}_${slot}`;
      inventory.push({ instance_id: instanceId, definition_id: String(definitions[0]!.id), kind: 'equipment', rarity_id: gear.rarity_id, locked: false, training: false, options: [] });
      equipment[slot] = instanceId;
    }
    roster.push({ character_id: actor.character_id, kind: main ? 'main' : 'npc', root_job_id: actor.root_job_id, job_id: actor.initial_job_id, gender: main ? choice.gender : 'male', level: actor.initial_level, local_cap: rules.initial_local_cap, completed_gate_ids: [], primary_stats: { ...rules.initial_primary_stats }, unspent_status_points: rules.initial_unspent_status_points, awakened_skills: [], skill_levels: Object.fromEntries(skillIds.map(id => [id, rules.initial_active_skill_grants.skill_level])), active_slots: [skillIds[0]!, skillIds[1]!, null, null], equipment, slot_progress: slotProgress });
  }
  const wallet: AccountState['wallet'] = { gold: 0, hero_exp: 0, skill_manual: 0, refine_ore: 0, breakthrough_essence: 0, enchant_dust: 0, card_dust: 0, crystal: 0, awakening_shard: 0, ...rules.wallet };
  return { ...(content.documents['equipment.json']!.crafting?{equipment_crafting:emptyCrafting()}:{}), battle_supplies: { stock: {}, queued: {} }, wallet, roster: [roster[0]!, roster[1]!, roster[2]!, roster[3]!, roster[4]!, roster[5]!, roster[6]!], inventory, team: [{ character_id: rules.main_id, position: 'back_1' }, { character_id: 'npc_swordsman', position: 'front_1' }, { character_id: 'npc_acolyte', position: 'back_2' }, { character_id: 'npc_archer', position: 'front_2' }], story: { cleared_stage_ids: [], selected_farm_stage: null }, tower: { highest_cleared_floor: 0 }, daily_records: [], gacha: { card_v1: { gold_misses: 0, bronze_streak: 0 }, equipment_v1: { legendary_misses: 0, rare_streak: 0 } }, shop: { day: null, purchases: {} }, farm: { reserved_through: serverAt, rate_snapshot: null, remainders: Object.fromEntries(Object.keys(wallet).map(id => [id, 0])) as AccountState['wallet'], loot_rng: { state: seed, draw_count: 0 }, drop_carry_ms: 0 }, pending_rewards: [], paid_ledger: [], active_battle: null, daily_objectives: { day: localDay, farm_claimed: false, battle_finished: false, claimed: false }, starter_grant_id: rules.grant_id };
}
