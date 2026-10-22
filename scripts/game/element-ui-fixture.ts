// Disposable local test account only; no owner data or balance run.
import type { AccountState } from '../../src/contracts/index.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1') throw new Error('ISOLATED_STACK_REQUIRED');
let state = JSON.parse(await new Promise<string>(resolve => { let s = ''; process.stdin.on('data', c => s += c); process.stdin.on('end', () => resolve(s)); })) as AccountState;
const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT');
for (const key of Object.keys(state.wallet) as (keyof AccountState['wallet'])[]) state.wallet[key] = 100000000;
const jobs: Record<string, string> = { main: 'sage', npc_mage: 'wizard', npc_swordsman: 'knight', npc_acolyte: 'priest', npc_archer: 'hunter', npc_thief: 'assassin', npc_merchant: 'alchemist' };
const slots: Record<string, string[]> = { main: ['sage_fire_endow', 'mage_cold_bolt'], npc_swordsman: ['swordsman_provoke'], npc_acolyte: ['acolyte_heal', 'priest_sanctuary'] };
for (const actor of [...state.roster]) {
  const character_id = actor.character_id;
  for (const [type, params] of [
    ['character.level_up', { character_id, target_level: 20 }], ['character.change_job', { character_id, job_id: jobs[character_id] }],
    ['character.breakthrough', { character_id, gate_level: 20 }], ['character.level_up', { character_id, target_level: 40 }],
    ['character.allocate_status', { character_id, allocation: { ...actor.primary_stats, vit: 60, int: 30 } }],
  ] as const) state = applySandboxRoster(state, type, params);
  const learned = slots[character_id] ?? [];
  for (const skill_id of learned) if (!state.roster.find(a => a.character_id === character_id)!.skill_levels[skill_id]) state = applySandboxRoster(state, 'skill.upgrade', { character_id, skill_id, target_level: 1 });
  state = applySandboxRoster(state, 'skill.set_loadout', { character_id, skill_ids: [...learned, ...Array(4 - learned.length).fill(null)] });
}
state.inventory.push({ instance_id: 'qa_body_armor', definition_id: 'equipment_armor_20', kind: 'equipment', rarity_id: 'common', training: false, locked: false, options: [] });
state.roster.find(a => a.character_id === 'main')!.equipment.armor = 'qa_body_armor';
state.inventory.push({ instance_id: 'qa_armor_angeling', definition_id: 'card_angeling', kind: 'card', rarity_id: 'bronze', level: 1, locked: false });
state.roster.find(a => a.character_id === 'main')!.slot_progress.armor.cards[0] = 'qa_armor_angeling';
state.team = ['main', 'npc_swordsman', 'npc_acolyte', 'npc_archer'].map((character_id, i) => ({ character_id, position: ['front_1', 'front_2', 'back_1', 'back_2'][i]! })) as AccountState['team'];
state.story.cleared_stage_ids = storyStages(loaded.value).filter(s => s.chapter <= 3).map(s => s.id);
state.tower.highest_cleared_floor = 30;
process.stdout.write(JSON.stringify(state));
