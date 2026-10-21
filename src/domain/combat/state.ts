import type { BattleActor, BattleCheckpoint } from '../../contracts/index.ts';
import type { BattleState } from './model.ts';
import type { DeepReadonly } from '../../content/value.ts';

function configuration<T>(value: DeepReadonly<T>): T {
  return (Object.isFrozen(value) ? value : structuredClone(value)) as T;
}
/** Copy mutable combat fields; do not repeatedly copy every skill/trait program. */
export function cloneWorkingState(input: BattleState): BattleCheckpoint {
  const state = structuredClone({ ...input, actors: [] }) as unknown as BattleCheckpoint;
  state.actors = input.actors.map(previous => {
    const actor = structuredClone({ ...previous, resolved_skills: {}, stat_blueprint: null,
      cast: previous.cast ? { ...previous.cast, resolved_skill: null } : null }) as unknown as BattleActor;
    actor.resolved_skills = configuration<BattleActor['resolved_skills']>(previous.resolved_skills);
    actor.stat_blueprint = configuration<BattleActor['stat_blueprint']>(previous.stat_blueprint);
    if (actor.cast && previous.cast) actor.cast.resolved_skill = configuration<typeof actor.cast.resolved_skill>(previous.cast.resolved_skill);
    return actor;
  }) as BattleCheckpoint['actors'];
  return state;
}
