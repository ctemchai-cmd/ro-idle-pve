import type { Command } from '../../contracts/index.ts';
import { canonical } from '../../content/value.ts';

/** Request UUID is the receipt lookup key; the payload hash binds its intent. */
export function canonicalCommand(command: Command): string {
  return canonical({ type: command.type, params: command.params, expected_revision: command.expected_revision, schema_version: command.schema_version, content_version: command.content_version, rules_version: command.rules_version, content_hash: command.content_hash });
}

export interface BattleClockInput {
  last_ack_ms: number; lease_expires_ms: number; database_now_ms: number;
  game_time_ms: number; requested_game_ms: number; max_wall_gap_ms: number;
  /** Player-chosen fast-forward (1/2/4): each wall millisecond credits this many game milliseconds. */
  speed?: number;
}
export type BattleClockResult = { ok: true; game_time_ms: number; credited_ms: number; ack_at_ms: number } | { ok: false; code: 'INVALID_CLOCK_INPUT' | 'CLOCK_REGRESSION' | 'BATTLE_LEASE_EXPIRED' | 'BATTLE_TIME_REGRESSION' };
export const BATTLE_SPEEDS: readonly number[] = [1, 2, 4];
/** Pure authorization of elapsed battle time; the wall clock stays outside. Speed only scales the credited wall gap. */
export function calculateBattleCredit(input: BattleClockInput): BattleClockResult {
  const speed = input.speed ?? 1;
  if (Object.values(input).some(value => !Number.isSafeInteger(value) || value < 0) || input.lease_expires_ms <= input.last_ack_ms || input.max_wall_gap_ms < 1 || !BATTLE_SPEEDS.includes(speed)) return { ok: false, code: 'INVALID_CLOCK_INPUT' };
  if (input.database_now_ms < input.last_ack_ms) return { ok: false, code: 'CLOCK_REGRESSION' };
  if (input.database_now_ms >= input.lease_expires_ms) return { ok: false, code: 'BATTLE_LEASE_EXPIRED' };
  if (input.requested_game_ms < input.game_time_ms) return { ok: false, code: 'BATTLE_TIME_REGRESSION' };
  const credited = Math.min(input.requested_game_ms - input.game_time_ms, (input.database_now_ms - input.last_ack_ms) * speed, input.max_wall_gap_ms * speed);
  return { ok: true, game_time_ms: input.game_time_ms + credited, credited_ms: credited, ack_at_ms: input.database_now_ms };
}
