import type { BattlePresentationEvent } from '../../contracts/presentation.ts';
import type { BattleCheckpoint, CombatStats, MetricRow, PrimaryStats } from '../../contracts/index.ts';
import type { DeepReadonly } from '../../content/value.ts';
export type BattleState = DeepReadonly<BattleCheckpoint>;
export type { ActorInput, BattleInput } from '../../contracts/battle-input.ts';
export type BattleEvent = BattlePresentationEvent;

export interface BattleStep { state: BattleState; events: BattleEvent[] }
export interface RunLimits { max_events: number }
/** A mode's continuation: bring a defeated enemy back with new resolved stats and patch the mode fields (e.g. the next daily phase). */
export interface ModeRespawn { actor_id: string; level: number; resolved_base: CombatStats; element: string; mode: Partial<Pick<BattleCheckpoint['mode'], 'daily_phase' | 'daily_current_hp' | 'reserved_phase_keys'>> }
export interface PureModePolicy {
  /** Mode continuation is injected; core never imports a mode controller. */
  onEnemyWipe?(state: BattleCheckpoint): 'continue' | 'victory' | ModeRespawn;
}
export const PRIMARY_KEYS: (keyof PrimaryStats)[] = ['str', 'agi', 'vit', 'int', 'dex', 'luk'];
export const METRIC_KEYS: (keyof MetricRow)[] = ['raw_damage', 'hp_damage', 'absorbed', 'overkill', 'effective_heal', 'overheal', 'shield_created', 'shield_absorbed', 'sp_spent', 'sp_skips', 'sphere_skips', 'casts_started', 'casts_resolved', 'casts_interrupted', 'normal_attacks', 'cc_applied', 'cc_resisted', 'alive_time_ms', 'sp_restored', 'sp_wasted', 'sphere_gained', 'sphere_wasted', 'cc_blocked_actor_ms', 'cc_instance_ms', 'skill_interval_ms', 'cast_time_ms', 'after_cast_time_ms', 'control_wait_ms', 'damage_received', 'shield_damage_received'];
export function emptyMetrics(): MetricRow { return Object.fromEntries(METRIC_KEYS.map(key => [key, 0])) as unknown as MetricRow; }
