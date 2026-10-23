// Disposable loopback integration data; never reads an owner's save.
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { storyFarmSnapshot, storyStages } from '../../src/domain/modes/story.ts';
import { equipStarterSet } from '../../tests/game/gear-fixtures.ts';
import { cardRarity } from '../../src/domain/build/card-rarity.ts';
import type { AccountState } from '../../src/contracts/index.ts';
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1') throw new Error('ISOLATED_STACK_REQUIRED');
const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT_REQUIRED');
const content = loaded.value, at = new Date().toISOString();
let state = initializeAccount(content, { root_job_id: 'acolyte', gender: 'male' }, at, new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date()), 17);
Object.assign(state.wallet, { gold: 100000000, hero_exp: 100000000, skill_manual: 1000000, breakthrough_essence: 100000 });
const jobs = { main: 'monk', npc_swordsman: 'knight', npc_acolyte: 'priest', npc_archer: 'hunter' };
const skills: Record<string, string[]> = {
  main: ['monk_call_spirits', 'monk_finger_offensive', 'acolyte_heal', 'monk_asura'],
  npc_swordsman: ['swordsman_provoke', 'swordsman_bash', 'knight_brandish', 'knight_battle_cry'],
  npc_acolyte: ['priest_sanctuary', 'acolyte_heal', 'acolyte_blessing', 'priest_resurrection'],
  npc_archer: ['hunter_blitz_beat', 'hunter_rapid_fire', 'hunter_claymore', 'archer_double_strafe'],
};
for (const [character_id, job_id] of Object.entries(jobs)) {
  for (const [type, params] of [
    ['character.level_up', { character_id, target_level: 20 }], ['character.change_job', { character_id, job_id }],
    ['character.breakthrough', { character_id, gate_level: 20 }], ['character.level_up', { character_id, target_level: 40 }],
    ['character.breakthrough', { character_id, gate_level: 40 }], ['character.level_up', { character_id, target_level: 60 }],
    ['character.breakthrough', { character_id, gate_level: 60 }], ['character.level_up', { character_id, target_level: 70 }],
  ] as const) state = applySandboxRoster(state, type, params);
  const actor = state.roster.find(a => a.character_id === character_id)!;
  state = applySandboxRoster(state, 'character.allocate_status', { character_id, allocation: { ...actor.primary_stats, str: 45, vit: 40, int: 25, dex: 20 } });
  for (const skill_id of skills[character_id]!) state = applySandboxRoster(state, 'skill.upgrade', { character_id, skill_id, target_level: 10 });
  state = applySandboxRoster(state, 'skill.set_loadout', { character_id, skill_ids: skills[character_id] });
}
state = equipStarterSet(state);
for (const actor of state.roster.filter(a => a.level === 70)) for (const id of Object.values(actor.equipment)) {
  const item = state.inventory.find(i => i.instance_id === id)!;
  item.definition_id = item.definition_id.replace(/_1$/, '_60');
}
state.roster[0]!.slot_progress.weapon.refine = 5;
state.roster[0]!.slot_progress.weapon.enchant = { line_id: 'offense', level: 2 };
state.inventory.push({ instance_id: 'old_card', definition_id: 'card_weapon_1', kind: 'card', rarity_id: cardRarity('card_weapon_1', content), level: 1, locked: false });
state.roster[0]!.slot_progress.weapon.cards[0] = 'old_card';
state.team = Object.keys(jobs).map((character_id, n) => ({ character_id, position: ['front_1', 'front_2', 'back_1', 'back_2'][n]! })) as AccountState['team'];
state.story.cleared_stage_ids = storyStages(content).filter(s => s.chapter <= 9).map(s => s.id);
state.story.selected_farm_stage = '9-1';
state.farm.rate_snapshot = storyFarmSnapshot(storyStages(content).find(s => s.id === '9-1')!, state, content);
state.farm.remainders.gold = 137;
const zero = Object.fromEntries(Object.keys(state.wallet).map(k => [k, 0])) as AccountState['wallet'];
state.pending_rewards.push({ claim_id: 'legacy_unpaid_farm', kind: 'farm', resource_vector: { ...zero, gold: 1234, skill_manual: 17 }, items: [], content_version: 'class2-v1.0.0', reserved_at: at, source_keys: ['farm:legacy:0:1000'], status: 'pending' });
new AccountCommandRules().validateAccount(state);
// Sign the old eight-resource payload to exercise the real backup/migration path.
const old = JSON.parse(JSON.stringify(state));
delete old.wallet.awakening_shard; delete old.farm.remainders.awakening_shard; delete old.farm.rate_snapshot.per_hour.awakening_shard;
for (const row of old.pending_rewards) delete row.resource_vector.awakening_shard;
for (const row of old.paid_ledger) delete row.paid_resources.awakening_shard;
for (const actor of old.roster) delete actor.awakened_skills;
process.stdout.write(JSON.stringify({ state, legacy: old }));
