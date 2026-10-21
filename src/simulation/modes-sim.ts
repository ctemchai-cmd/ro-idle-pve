import type { AccountState } from '../contracts/index.ts';
import type { ValidatedContent } from '../content/model.ts';
import { compileCharacterSkills } from '../domain/progression/skills.ts';
import { storyParty, storyInput } from '../domain/build/story.ts';
import { towerBoss, towerStageRef } from '../domain/modes/tower.ts';
import { modePolicy } from '../domain/modes/daily.ts';
import { advanceUntil, createBattle } from '../domain/combat/index.ts';

/** TASK-041 journey helper: a pure Tower floor fight on the saved team (same factory as battle.start_tower). */
export function towerFight(state: AccountState, floor: number, seed: number, content: ValidatedContent): { win: boolean; end_ms: number } {
  const compiled = Object.fromEntries(state.team.map(p => [p.character_id, compileCharacterSkills(state.roster.find(a => a.character_id === p.character_id)!, content)]));
  const hashes = Object.fromEntries(state.roster.map(a => [a.character_id, `ref_${a.character_id}`]));
  const input = storyInput(towerStageRef(floor, content), towerBoss(floor, content), storyParty(state, content, compiled, hashes), content, { kind: 'tower' });
  const created = createBattle(input, content, seed); if (!created.ok) throw new Error(`TOWER_BUILD_FAILED:${floor}`);
  const run = advanceUntil(created.value, input.mode.time_limit_ms, content, modePolicy(created.value.mode, content)); if (!run.ok) throw new Error(`TOWER_RUN_FAILED:${floor}`);
  return { win: run.value.state.terminal_result?.kind === 'victory', end_ms: run.value.state.game_time_ms };
}
