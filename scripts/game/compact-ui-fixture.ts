// Test-only: an isolated account with affordable upgrades, all seven Class 2 characters and worn gear.
import type { AccountState } from '../../src/contracts/index.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { characterSkillOptions } from '../../src/client/skills.ts';
import { content } from '../../tests/game/combat-fixtures.ts';
import { equipStarterSet } from '../../tests/game/gear-fixtures.ts';

if (process.env.RO_SUPABASE_LOCAL_STACK !== '1') throw new Error('ISOLATED_LOOPBACK_REQUIRED');
let state = JSON.parse(await new Promise<string>(resolve => { let input = ''; process.stdin.on('data', chunk => input += chunk); process.stdin.on('end', () => resolve(input)); })) as AccountState;
for (const key of Object.keys(state.wallet) as (keyof AccountState['wallet'])[]) state.wallet[key] = 10_000_000;
const jobs: Record<string, string> = { main: 'wizard', npc_swordsman: 'crusader', npc_acolyte: 'priest', npc_archer: 'hunter', npc_mage: 'sage', npc_thief: 'assassin', npc_merchant: 'blacksmith' };
for (const actor of [...state.roster]) {
  const id = actor.character_id;
  state = applySandboxRoster(state, 'character.level_up', { character_id: id, target_level: 20 });
  state = applySandboxRoster(state, 'character.change_job', { character_id: id, job_id: jobs[id] });
  for (const skill of characterSkillOptions(state.roster.find(a => a.character_id === id)!, state).skills) {
    if (!skill.locked && skill.level === 0) state = applySandboxRoster(state, 'skill.upgrade', { character_id: id, skill_id: skill.id, target_level: 1 });
  }
}
state = equipStarterSet(state);
const stages = content.documents['stages.json'] as unknown as { stages: { id: string }[] };
state.story.cleared_stage_ids = stages.stages.slice(0, 24).map(stage => stage.id);
process.stdout.write(JSON.stringify(state));
