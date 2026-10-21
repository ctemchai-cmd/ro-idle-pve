// Disposable browser fixture; never reads or replaces a personal/cloud save.
import type { AccountState } from '../../src/contracts/index.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { content } from '../../tests/game/combat-fixtures.ts';
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1') throw new Error('ISOLATED_STACK_REQUIRED');
let state = JSON.parse(await new Promise<string>(resolve => { let s = ''; process.stdin.on('data', c => s += c); process.stdin.on('end', () => resolve(s)); })) as AccountState;
for (const k of Object.keys(state.wallet) as (keyof AccountState['wallet'])[]) state.wallet[k] = 100000000;
const jobs: Record<string, string> = { main: 'monk', npc_acolyte: 'priest', npc_swordsman: 'crusader', npc_mage: 'wizard', npc_archer: 'hunter', npc_thief: 'rogue', npc_merchant: 'blacksmith' };
const slots: Record<string, string[]> = { main: ['monk_call_spirits', 'monk_steel_body', 'monk_finger_offensive', 'acolyte_blessing'], npc_acolyte: ['acolyte_blessing', 'priest_kyrie'], npc_swordsman: ['swordsman_provoke'], npc_mage: ['mage_cold_bolt'] };
for (const actor of [...state.roster]) {
  const character_id = actor.character_id;
  for (const [type, params] of [
    ['character.level_up', { character_id, target_level: 20 }], ['character.change_job', { character_id, job_id: jobs[character_id] }],
    ['character.breakthrough', { character_id, gate_level: 20 }], ['character.level_up', { character_id, target_level: 40 }],
    ['character.allocate_status', { character_id, allocation: { ...actor.primary_stats, vit: 40, int: 30 } }],
  ] as const) state = applySandboxRoster(state, type, params);
  const learned = slots[character_id] ?? [];
  for (const skill_id of learned) if (!state.roster.find(a => a.character_id === character_id)!.skill_levels[skill_id]) state = applySandboxRoster(state, 'skill.upgrade', { character_id, skill_id, target_level: 1 });
  state = applySandboxRoster(state, 'skill.set_loadout', { character_id, skill_ids: [...learned, ...Array(4 - learned.length).fill(null)] });
}
state.team = ['main', 'npc_swordsman', 'npc_acolyte', 'npc_mage'].map((character_id, i) => ({ character_id, position: ['front_1', 'front_2', 'back_1', 'back_2'][i]! })) as AccountState['team'];
state.story.cleared_stage_ids = (content.documents['stages.json']!.stages as unknown as { id: string }[]).slice(0, 30).map(s => s.id);
process.stdout.write(JSON.stringify(state));
