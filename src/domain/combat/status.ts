import type { BattleActor, Modifier, StatusDefinition } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { resolveStats } from '../math/index.ts';
import { bindStatusParams, evaluatePredicate } from './program.ts';
import { compareId } from './scheduler.ts';

export type StatusInstance = BattleActor['statuses'][number];
export type SourceRef = StatusInstance['source'];
export function statusDefinition(content: ValidatedContent, id: string): StatusDefinition {
  const definition = Object.hasOwn(content.statuses, id) ? content.statuses[id] : undefined;
  if (!definition) throw new TypeError(`UNKNOWN_STATUS:${id}`);
  return definition as unknown as StatusDefinition;
}
export function statusRestriction(actor: BattleActor, restriction: StatusDefinition['restrictions'][number], content: ValidatedContent, now: number): boolean {
  return actor.statuses.some(instance => instance.expires_at > now && statusDefinition(content, instance.status_id).restrictions.includes(restriction));
}
export function recomputeStats(actor: BattleActor, content: ValidatedContent): void {
  const applicable = (modifier: Modifier) => !modifier.when || evaluatePredicate(modifier.when, { self: actor, outcomes: [] });
  const stripCondition = (modifier: Modifier): Modifier => { const { when: _condition, ...unconditional } = modifier; return unconditional; };
  const blueprint = { ...actor.stat_blueprint, permanent_sources: actor.stat_blueprint.permanent_sources.map(source => ({ ...source, modifiers: source.modifiers.filter(applicable).map(stripCondition) })) };
  const modifiers = actor.statuses.flatMap(instance => bindStatusParams(statusDefinition(content, instance.status_id).modifiers, instance.params)).filter(applicable).map(stripCondition);
  actor.stats = resolveStats(blueprint, content, modifiers);
  actor.hp = Math.min(actor.hp, actor.stats.max_hp); actor.sp = Math.min(actor.sp, actor.stats.max_sp);
}
export function weaponElement(actor: BattleActor, content: ValidatedContent): BattleActor['stat_blueprint']['weapon_element'] {
  const instances = actor.statuses.slice().sort((a, b) => b.applied_at - a.applied_at || compareId(b.instance_id, a.instance_id));
  for (const instance of instances) {
    const element = statusDefinition(content, instance.status_id).weapon_element;
    if (element !== null) return element;
  }
  return actor.stat_blueprint.weapon_element;
}
export function sourceAlive(source: SourceRef, actors: readonly BattleActor[]): boolean {
  return actors.some(actor => actor.actor_id === source.origin_actor_id && actor.life_epoch === source.origin_life_epoch && actor.hp > 0);
}
