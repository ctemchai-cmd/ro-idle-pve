import type { AccountState } from '../../src/contracts/index.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { content } from '../../tests/game/combat-fixtures.ts';
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1') throw new Error('ISOLATED_STACK_REQUIRED');
const input = JSON.parse(await new Promise<string>(resolve => { let s = ''; process.stdin.on('data', c => s += c); process.stdin.on('end', () => resolve(s)); })) as { state: AccountState; weak?: boolean };
let state = input.weak ? initializeAccount(content, { root_job_id: 'mage', gender: 'female' }, '2026-10-21T00:00:00.000Z', '2026-10-21', 1) : input.state;
if (!input.weak) {
  for (const key of Object.keys(state.wallet) as (keyof AccountState['wallet'])[]) state.wallet[key] = 100000000;
  for (const actor of [...state.roster]) {
    for (const level of [20, 40, 60, 70]) {
      state = applySandboxRoster(state, 'character.level_up', { character_id: actor.character_id, target_level: level });
      if (level < 70) state = applySandboxRoster(state, 'character.breakthrough', { character_id: actor.character_id, gate_level: level });
    }
    state = applySandboxRoster(state, 'character.allocate_status', { character_id: actor.character_id, allocation: { ...actor.primary_stats, vit: 50 } });
  }
}
state.story.cleared_stage_ids = Array.from({ length: input.weak ? 9 : 20 }, (_, i) => `${1 + Math.floor(i / 10)}-${1 + i % 10}`);
process.stdout.write(JSON.stringify(state));
