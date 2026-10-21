import type { CombatStatistics } from '../../contracts/combat-statistics.ts';
import type { BattleState } from './model.ts';
import type { MetricRow } from '../../contracts/index.ts';

export function metricRates(metrics: Pick<MetricRow, 'hp_damage' | 'effective_heal'>, durationMs: number) {
  const seconds = durationMs / 1000;
  return { dps: seconds > 0 ? metrics.hp_damage / seconds : 0, effective_hps: seconds > 0 ? metrics.effective_heal / seconds : 0 };
}

/** Read-only shared report. Rates use credited battle time, never wall time or draw frequency. */
export function combatStatistics(state: BattleState): CombatStatistics {
  return { elapsed_ms: state.game_time_ms, actors: state.actors.filter(actor => actor.kind !== 'summon').map(actor => {
    const metrics = state.metrics.actors[actor.actor_id]!;
    const rates = metricRates(metrics, state.game_time_ms);
    const hp = metrics.damage_received ?? 0, shield = metrics.shield_damage_received ?? 0;
    const prefix = `${actor.actor_id}:`, skills = Object.keys(state.metrics.skills).filter(key => key.startsWith(prefix)).sort().map(key => {
      const row = state.metrics.skills[key]!, skill_id = key.slice(prefix.length);
      return { skill_id, damage: row.hp_damage, healing: row.effective_heal, uses: skill_id === 'normal_attack' ? row.normal_attacks : row.casts_resolved };
    }).filter(row => row.damage > 0 || row.healing > 0 || row.uses > 0);
    return { actor_id: actor.actor_id, team: actor.team, damage: metrics.hp_damage, dps: rates.dps, healing: metrics.effective_heal, hps: rates.effective_hps, hp_received: hp, shield_received: shield, tank: hp + shield, skills };
  }) };
}
