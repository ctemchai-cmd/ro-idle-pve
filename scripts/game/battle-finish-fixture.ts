// Test-only: a durable, low-damage team for verifying terminal-only settlement in one real fight.
import type { AccountState } from '../../src/contracts/index.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { storyStage, storyFarmSnapshot } from '../../src/domain/modes/story.ts';
import { content } from '../../tests/game/combat-fixtures.ts';
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1') throw new Error('ISOLATED_LOOPBACK_REQUIRED');
let state = JSON.parse(await new Promise<string>(resolve => { let input = ''; process.stdin.on('data', chunk => input += chunk); process.stdin.on('end', () => resolve(input)); })) as AccountState;
for (const key of Object.keys(state.wallet) as (keyof AccountState['wallet'])[]) state.wallet[key] = 10_000_000;
for (const actor of [...state.roster]) state = applySandboxRoster(state, 'character.level_up', { character_id: actor.character_id, target_level: 20 });
for (const actor of [...state.roster]) state = applySandboxRoster(state, 'character.allocate_status', { character_id: actor.character_id, allocation: { ...actor.primary_stats, vit: 20 } });
state.story.cleared_stage_ids = Array.from({ length: 9 }, (_, i) => `1-${i + 1}`);
state.story.selected_farm_stage = '1-1';
state.farm.rate_snapshot = storyFarmSnapshot(storyStage('1-1', content)!, state, content);
process.stdout.write(JSON.stringify(state));
