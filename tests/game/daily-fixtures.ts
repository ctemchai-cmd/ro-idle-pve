import type { AccountState, Command } from '../../src/contracts/index.ts';
import type { StoredBattle } from '../../src/contracts/save.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { content } from './combat-fixtures.ts';
import { buildAccount, treeData } from './class-skills.ts';
const rules = new AccountCommandRules();
export function fixture(state: AccountState, startIso = '2026-10-20T05:00:00.000Z') {
  let save = state, stored: StoredBattle | null = null, revision = 1, serial = 0, now = Date.parse(startIso);
  const hashes = Object.fromEntries(save.roster.map(actor => [actor.character_id, 'a'.repeat(64)]));
  function run(type: Command['type'], params: unknown, advanceMs = 1000, seed = 11) {
    now += advanceMs; const pointer = save.active_battle;
    const input = { type, params, request_id: `22222222-2222-4222-8222-${String(++serial).padStart(12, '0')}`, expected_revision: revision, schema_version: 1, ...rules.versions } as Command; rules.parse(input);
    const time: CommandTime = { account_id: '11111111-1111-4111-8111-111111111111', battle_id: `33333333-3333-4333-8333-${String(serial).padStart(12, '0')}`, battle_seed: seed, build_hashes: hashes, server_at: new Date(now).toISOString(), now_ms: now, new_lease_at: new Date(now + 15000).toISOString(),
      last_ack_ms: pointer ? Date.parse(pointer.last_ack_at) : 0, lease_expires_ms: pointer ? Date.parse(pointer.lease_expires_at) : 0, started_ms: pointer ? Date.parse(pointer.started_at) : 0, farm_from_ms: Date.parse(save.farm.reserved_through),
      stored_last_ack_ms: stored ? Date.parse(stored.last_ack_at) : 0, stored_lease_ms: stored ? Date.parse(stored.lease_expires_at) : 0 };
    const result = rules.decide(input, save, stored, time, 'b'.repeat(64));
    if (result.receipt.outcome === 'committed') { save = result.state; revision++; if (result.battle_write.kind === 'upsert') stored = result.battle_write.battle; if (result.battle_write.kind === 'delete') stored = null; }
    return result.receipt;
  }
  function advance(times = 120) { for (let i = 0; i < times && save.active_battle; i++) { const receipt = run('battle.advance', { battle_id: save.active_battle.battle_id, requested_game_ms: 60000 }); if (receipt.result.code !== 'BATTLE_ADVANCED') return receipt; } return null; }
  return { run, advance, get state() { return save; }, get stored() { return stored; }, get now() { return now; } };
}
export const unlocked = (builds: string[] = ['knight_striker', 'crusader_holy_striker']) => { const tree = treeData('swordsman'); const state = buildAccount('swordsman', builds.map(id => tree.builds.find(b => b.id === id)!)); state.story.cleared_stage_ids = storyStages(content).slice(0, 20).map(s => s.id); return state; };
