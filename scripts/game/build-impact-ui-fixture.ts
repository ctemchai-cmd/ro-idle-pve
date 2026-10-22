// Disposable local test account only; no owner data or balance run.
import type { AccountState } from '../../src/contracts/index.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { equipmentStats, equipmentPreview } from '../../src/client/equipment.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1') throw new Error('ISOLATED_STACK_REQUIRED');
let state = JSON.parse(await new Promise<string>(resolve => { let s = ''; process.stdin.on('data', c => s += c); process.stdin.on('end', () => resolve(s)); })) as AccountState;
const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT');
for (const key of Object.keys(state.wallet) as (keyof AccountState['wallet'])[]) state.wallet[key] = 100000000;
const jobs: Record<string, string> = { main: 'knight', npc_mage: 'wizard', npc_swordsman: 'knight', npc_acolyte: 'priest', npc_archer: 'hunter', npc_thief: 'assassin', npc_merchant: 'alchemist' };
if (process.env.RO_EVIDENCE_PREFIX === 'task-078') { jobs.npc_archer = 'bard'; state.roster.find(a => a.character_id === 'npc_archer')!.gender = 'male'; }
const slots: Record<string, string[]> = { main: ['swordsman_bash', 'swordsman_magnum_break'], npc_swordsman: ['swordsman_provoke'], npc_acolyte: ['acolyte_heal', 'priest_sanctuary'] };
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
state.inventory.push(
  { instance_id: 'qa_skill_weapon', definition_id: 'equipment_sword_40', kind: 'equipment', rarity_id: 'rare', training: false, locked: false, options: [{ id: 'opt_skill_damage', roll: 1000 }, { id: 'opt_atk', roll: 500 }] },
  { instance_id: 'qa_normal_weapon', definition_id: 'equipment_sword_40_b', kind: 'equipment', rarity_id: 'rare', training: false, locked: false, options: [{ id: 'opt_normal_damage', roll: 1000 }, { id: 'opt_atk', roll: 500 }] },
  { instance_id: 'qa_wolf', definition_id: 'card_weapon_1', kind: 'card', rarity_id: 'gold', level: 5, locked: false },
);
const main = state.roster.find(a => a.character_id === 'main')!;
main.equipment.weapon = 'qa_skill_weapon'; main.slot_progress.weapon.cards[0] = 'qa_wolf';
if (process.env.RO_EVIDENCE_PREFIX === 'task-078') {
  state.inventory.push({ instance_id: 'qa_head', definition_id: 'equipment_head_20', kind: 'equipment', rarity_id: 'common', training: false, locked: false, options: [] }, { instance_id: 'qa_elder', definition_id: 'card_head_2', kind: 'card', rarity_id: 'bronze', level: 1, locked: false });
  main.equipment.head = 'qa_head'; main.slot_progress.head.cards[0] = 'qa_elder';
}
state.team = ['main', 'npc_swordsman', 'npc_acolyte', 'npc_archer'].map((character_id, i) => ({ character_id, position: ['front_1', 'front_2', 'back_1', 'back_2'][i]! })) as AccountState['team'];
state.story.cleared_stage_ids = storyStages(loaded.value).filter(s => s.chapter <= 3).map(s => s.id);
state.tower.highest_cleared_floor = 30;
new AccountCommandRules().validateAccount(state);
process.stdout.write(JSON.stringify({ state, skill: equipmentStats(state, 'main'), normal: equipmentPreview(state, 'main', 'weapon', 'qa_normal_weapon').after }));
