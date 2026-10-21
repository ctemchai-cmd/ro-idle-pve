import type { BattleCheckpoint } from '../../contracts/index.ts';
import type { Result, ValidatedContent } from '../../content/model.ts';
import type { ObjectValue } from '../../content/value.ts';
import { freeze } from '../../content/value.ts';
import { ContentValidator, InvalidContent } from '../../content/validation.ts';
import type { BattleState } from './model.ts';
import { validateSpatialInput } from './spatial.ts';
// Immutable content owns the schema identity. Reuse compiled validators on API ticks.
const validators = new WeakMap<ValidatedContent, ContentValidator>();

export function serializeBattle(state: BattleState): BattleCheckpoint {
  if (!state.checkpoint_barrier || state.phase !== 7) throw new TypeError('CHECKPOINT_REQUIRES_TIMESTAMP_BARRIER');
  return structuredClone(state) as BattleCheckpoint;
}
export function restoreBattle(raw: unknown, content: ValidatedContent): Result<BattleState> {
  try {
    let validator = validators.get(content);
    if (!validator) {
      validator = new ContentValidator(structuredClone(content.schemas) as Record<string, ObjectValue>);
      validators.set(content, validator);
    }
    validator.shape('battle-checkpoint', raw as ObjectValue, { source: 'battle checkpoint', path: '' });
    const state = structuredClone(raw) as BattleCheckpoint;
    validateSpatialInput(state);
    if (state.content_hash !== content.manifest.content_hash || state.rules_version !== content.manifest.rules_version || state.rng_version !== 'lcg32-v1') throw new Error('INCOMPATIBLE_CHECKPOINT');
    if (state.phase !== 7 || !state.checkpoint_barrier) throw new Error('CHECKPOINT_REQUIRES_TIMESTAMP_BARRIER');
    const actorIds = new Set(state.actors.map(actor => actor.actor_id));
    if (actorIds.size !== state.actors.length) throw new Error('DUPLICATE_ACTOR_ID');
    const eventIds = new Set(state.pending_events.map(event => event.event_id));
    if (eventIds.size !== state.pending_events.length) throw new Error('DUPLICATE_EVENT_ID');
    for (const actor of state.actors) {
      if (actor.spatial) {
        const s = actor.spatial;
        if (s.updated_at > state.game_time_ms || s.target_id !== null && !actorIds.has(s.target_id) || s.previous_x < s.radius || s.previous_x > state.arena!.width - s.radius || s.previous_y < s.radius || s.previous_y > state.arena!.height - s.radius) throw new Error('INVALID_SPATIAL_CHECKPOINT');
        const ticks = state.pending_events.filter(event => event.kind === 'motion_tick' && event.actor_id === actor.actor_id);
        if (actor.kind === 'summon' ? ticks.length !== 0 || s.move_speed !== 0 : !state.terminal_result && actor.hp > 0 ? ticks.length !== 1 || ticks[0]!.life_epoch !== actor.life_epoch || ticks[0]!.due_ms > state.game_time_ms + 50 : ticks.length !== 0) throw new Error('INVALID_MOTION_TIMER');
      }
      if (actor.kind === 'summon') {
        // A live summon is owner-bound with a periodic action and exactly one pending expiry.
        const expiries = state.pending_events.filter(event => event.kind === 'summon_expiry' && event.actor_id === actor.actor_id);
        if (!actor.owner_actor_id || !actorIds.has(actor.owner_actor_id) || actor.action_policy.kind !== 'periodic' || actor.summon_expires_at === null || actor.summon_expires_at <= state.game_time_ms || expiries.length !== 1 || expiries[0]!.due_ms !== actor.summon_expires_at || actor.counts_for_terminal) throw new Error('INVALID_SUMMON_CHECKPOINT');
      }
      if (actor.hp > actor.stats.max_hp || actor.sp > actor.stats.max_sp) throw new Error('RESOURCE_EXCEEDS_MAXIMUM');
      const assigned = actor.active_slots.filter(Boolean);
      if (new Set(assigned).size !== assigned.length) throw new Error('DUPLICATE_SKILL_SLOT');
      for (const id of assigned) if (actor.resolved_skills[id!]?.definition.kind !== 'active') throw new Error('UNUSABLE_SKILL_REFERENCE');
      if (actor.cast && actor.cast.resolved_skill.id !== actor.cast.skill_id) throw new Error('INVALID_CAST_SNAPSHOT');
    }
    for (const event of state.pending_events) if (!actorIds.has(event.actor_id) || event.due_ms < state.game_time_ms || event.kind === 'motion_tick' && (!state.arena || !state.actors.find(actor => actor.actor_id === event.actor_id)?.spatial)) throw new Error('INVALID_PENDING_EVENT');
    return { ok: true, value: freeze(state) };
  } catch (error) {
    return { ok: false, errors: [error instanceof InvalidContent ? error.issue : { code: 'checkpoint', source: 'battle checkpoint', path: '', message: String(error) }] };
  }
}
