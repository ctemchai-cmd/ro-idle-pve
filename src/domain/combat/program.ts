import type { BattleActor, CombatStats, Effect, GamePredicate, Selector } from '../../contracts/index.ts';
import { compareId } from './scheduler.ts';

export interface HitOutcome { effect_id: string; target_id: string; hit_index: number; landed: boolean }
export interface PredicateContext {
  self: BattleActor; target?: BattleActor; event_source?: BattleActor; event_target?: BattleActor;
  outcomes: readonly HitOutcome[];
}
export function evaluatePredicate(predicate: GamePredicate, context: PredicateContext): boolean {
  switch (predicate.type) {
    case 'all': return predicate.conditions.every(value => evaluatePredicate(value, context));
    case 'any': return predicate.conditions.some(value => evaluatePredicate(value, context));
    case 'not': return !evaluatePredicate(predicate.condition, context);
    case 'hit_landed': return context.outcomes.some(value => value.effect_id === predicate.effect_id && value.target_id === context.target?.actor_id && (predicate.hit_index === 'any' || predicate.hit_index === value.hit_index) && value.landed);
    case 'has_status': return context[predicate.actor]?.statuses.some(value => value.status_id === predicate.status_id) ?? false;
    case 'has_tag': return context[predicate.actor]?.tags.includes(predicate.tag) ?? false;
    case 'hp_below': { const actor = context[predicate.actor]; return !!actor && actor.hp / actor.stats.max_hp < predicate.ratio; }
    case 'resource_at_least': { const actor = context[predicate.actor]; return !!actor && actor[predicate.resource] >= resolvedNumber(predicate.amount); }
  }
}
export function resolvedNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) throw new TypeError('UNRESOLVED_OR_UNSAFE_NUMBER');
  return value;
}
/** Bind numeric status parameters, without accepting expressions or property paths. */
export function bindStatusParams<T>(value: T, params: Readonly<Record<string, number>>): T {
  if (Array.isArray(value)) return value.map(item => bindStatusParams(item, params)) as T;
  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    if (Object.hasOwn(object, 'status_param')) {
      if (Object.keys(object).length !== 1 || typeof object.status_param !== 'string' || !Object.hasOwn(params, object.status_param)) throw new TypeError('UNBOUND_STATUS_PARAMETER');
      return resolvedNumber(params[object.status_param]) as T;
    }
    return Object.fromEntries(Object.entries(object).map(([key, item]) => [key, bindStatusParams(item, params)])) as T;
  }
  return value;
}
export function selectTargets(self: BattleActor, selector: Selector, actors: readonly BattleActor[], draw: () => number, binding?: readonly string[]): BattleActor[] {
  let eligible = actors.filter(actor => actor.targetable && (selector.team === 'allies' ? actor.team === self.team : actor.team !== self.team) && (selector.life === 'living' ? actor.hp > 0 : actor.hp <= 0)).sort((a, b) => compareId(a.actor_id, b.actor_id));
  if (binding !== undefined) {
    const retained = eligible.filter(actor => binding.includes(actor.actor_id));
    if (retained.length || selector.missing === 'skip') return retained;
  }
  if (selector.select === 'front_first') eligible.sort((a, b) => Number(a.position.startsWith('back')) - Number(b.position.startsWith('back')) || compareId(a.actor_id, b.actor_id));
  if (selector.select === 'nearest') {
    const distance = (actor: BattleActor) => self.spatial && actor.spatial ? Math.hypot(actor.spatial.x - self.spatial.x, actor.spatial.y - self.spatial.y) : 0;
    eligible.sort((a, b) => distance(a) - distance(b) || compareId(a.actor_id, b.actor_id));
  }
  if (selector.select === 'lowest_hp_percent') eligible.sort((a, b) => a.hp / a.stats.max_hp - b.hp / b.stats.max_hp || compareId(a.actor_id, b.actor_id));
  if (selector.team === 'enemies' && selector.life === 'living' && ['front_first', 'lowest_hp_percent', 'nearest'].includes(selector.select)) {
    const taunts = self.statuses.filter(status => status.status_id === 'provoke').sort((a, b) => b.applied_at - a.applied_at || compareId(b.instance_id, a.instance_id));
    for (const taunt of taunts) {
      const source = eligible.find(actor => actor.actor_id === taunt.source.origin_actor_id && actor.life_epoch === taunt.source.origin_life_epoch);
      if (source) return [source];
    }
  }
  if (selector.select === 'random_n') {
    const chosen: BattleActor[] = [];
    for (let index = 0; index < Number(selector.count) && eligible.length; index++) chosen.push(eligible.splice(Math.floor(draw() * eligible.length), 1)[0]!);
    return chosen.sort((a, b) => compareId(a.actor_id, b.actor_id));
  }
  return selector.select === 'all' ? eligible : eligible.slice(0, 1);
}
export interface ProgramContext {
  self: BattleActor; source: BattleActor['statuses'][number]['source'];
  offense: CombatStats; weapon_element: BattleActor['stat_blueprint']['weapon_element']; pre_cost_sp: number;
  skill_id: string; action_id: string; origin: 'skill' | 'normal' | 'periodic' | 'proc' | 'reflect' | 'system' | 'transfer';
  ancestry: readonly string[]; event_source?: BattleActor; event_target?: BattleActor; event_damage?: number;
  damage_type?: 'physical' | 'magical' | 'true';
  selected: Record<string, BattleActor[]>; outcomes: HitOutcome[];
}
export type DamageEffect = Extract<Effect, { type: 'damage' }>;
