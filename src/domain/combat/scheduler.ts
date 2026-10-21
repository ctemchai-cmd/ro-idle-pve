import type { BattleActor, BattleCheckpoint, TimerEvent } from '../../contracts/index.ts';
export function compareId(a: string, b: string) { return a < b ? -1 : a > b ? 1 : 0; }
const priority: Record<TimerEvent['kind'], number> = { battle_start: 1, status_expiry: 0, shield_expiry: 0, summon_expiry: 0, status_tick: 1, summon_tick: 1, resource_regen: 1, cast_complete: 2, motion_tick: 4, phase_ready: 5, normal_attack: 6 };
export function compareTimer(a: TimerEvent, b: TimerEvent) { return a.due_ms - b.due_ms || priority[a.kind] - priority[b.kind] || compareId(a.actor_id, b.actor_id) || a.sequence - b.sequence; }
export function schedule(state: BattleCheckpoint, actor: BattleActor, kind: TimerEvent['kind'], due: number, token: string | null = null, source: string | null = null) {
  if (!Number.isSafeInteger(due) || due < state.game_time_ms) throw new RangeError('INVALID_EVENT_TIME');
  const sequence = state.event_sequence++;
  if (!Number.isSafeInteger(state.event_sequence)) throw new RangeError('EVENT_SEQUENCE_OVERFLOW');
  state.pending_events.push({ event_id: `event_${sequence}`, sequence, due_ms: due, kind, actor_id: actor.actor_id, life_epoch: actor.life_epoch, cast_token: token, source_instance_id: source });
}
