// Disposable isolated browser fixture; never reads a personal/cloud save.
import type { AccountState } from '../../src/contracts/index.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1') throw new Error('ISOLATED_STACK_REQUIRED');
let state = JSON.parse(await new Promise<string>(resolve => { let s = ''; process.stdin.on('data', c => s += c); process.stdin.on('end', () => resolve(s)); })) as AccountState;
for (const key of Object.keys(state.wallet) as (keyof AccountState['wallet'])[]) state.wallet[key] = 100000000;
const jobs: Record<string, string> = { main: 'bard', npc_archer: 'dancer', npc_acolyte: 'priest', npc_swordsman: 'knight', npc_mage: 'wizard', npc_thief: 'rogue', npc_merchant: 'blacksmith' };
const slots: Record<string, string[]> = {
  main: ['bard_healing_song', 'bard_battle_song', 'bard_dissonance', 'bard_performance_strike'],
  npc_archer: ['dancer_healing_song', 'dancer_battle_song', 'dancer_dissonance', 'dancer_performance_strike'],
  npc_acolyte: ['priest_sanctuary', 'acolyte_heal', 'acolyte_blessing', 'acolyte_holy_light'],
  npc_swordsman: ['swordsman_provoke'],
};
for (const actor of [...state.roster]) {
  const character_id = actor.character_id;
  for (const [type, params] of [
    ['character.level_up', { character_id, target_level: 20 }], ['character.change_job', { character_id, job_id: jobs[character_id] }],
    ['character.breakthrough', { character_id, gate_level: 20 }], ['character.level_up', { character_id, target_level: 40 }],
    ['character.allocate_status', { character_id, allocation: { ...actor.primary_stats, vit: 40, ...(character_id === 'npc_acolyte' ? { int: 30 } : { str: 30 }) } }],
  ] as const) state = applySandboxRoster(state, type, params);
  const learned = slots[character_id] ?? [];
  for (const skill_id of learned) if (!state.roster.find(a => a.character_id === character_id)!.skill_levels[skill_id]) state = applySandboxRoster(state, 'skill.upgrade', { character_id, skill_id, target_level: 1 });
  state = applySandboxRoster(state, 'skill.set_loadout', { character_id, skill_ids: [...learned, ...Array(4 - learned.length).fill(null)] });
}
state.team = ['main', 'npc_swordsman', 'npc_acolyte', 'npc_archer'].map((character_id, i) => ({ character_id, position: ['front_1', 'front_2', 'back_1', 'back_2'][i]! })) as AccountState['team'];
state.story.cleared_stage_ids = Array.from({ length: 10 }, (_, i) => `1-${i + 1}`);
process.stdout.write(JSON.stringify(state));
