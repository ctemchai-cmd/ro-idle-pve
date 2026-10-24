/** Disposable test account only; never reads a player save. */
import { readFileSync } from 'node:fs';
import { buildAccount, treeData } from '../../tests/game/class-skills.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { content } from '../../tests/game/combat-fixtures.ts';
const input = JSON.parse(readFileSync(0, 'utf8') || '{}') as { mode?: 'story' | 'tower' | 'loss' | 'fullbag' | 'live_stop' };
const tree = treeData('swordsman'), state = buildAccount('swordsman', [tree.builds.find(b => b.id === 'knight_striker')!]);
const fresh = initializeAccount(content, { root_job_id: 'swordsman', gender: 'male' }, '2026-10-24T00:00:00Z', '2026-10-24', 1);
state.story = fresh.story; state.farm = fresh.farm; state.pending_rewards = [];
for (const key of Object.keys(state.wallet) as (keyof typeof state.wallet)[]) state.wallet[key] = 1000000;
if (input.mode && input.mode !== 'story') { state.story.cleared_stage_ids = storyStages(content).slice(0, 20).map(s => s.id); state.tower.highest_cleared_floor = input.mode === 'loss' ? 199 : input.mode === 'fullbag' ? 9 : input.mode === 'live_stop' ? 20 : 0; }
if (input.mode === 'fullbag') for (let n = state.inventory.length; n < 500; n++) state.inventory.push({ instance_id: 'fill_' + n, definition_id: 'equipment_sword_1', kind: 'equipment', rarity_id: 'common', locked: false, training: false, options: [] });
new AccountCommandRules().validateAccount(state);
process.stdout.write(JSON.stringify(state));
