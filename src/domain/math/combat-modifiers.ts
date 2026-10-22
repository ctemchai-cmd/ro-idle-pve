import type { CombatStats } from '../../contracts/index.ts';

/** Reusable card/equipment/status stats. No item IDs, wall clock or random globals. */
export function fixedSpCost(base: number, stats: Pick<CombatStats, 'sp_cost_percent'>): number {
  return Math.max(0, Math.ceil(base * Math.max(0, 1 + stats.sp_cost_percent) - 1e-9));
}
export function statusResistance(id: string, stats: CombatStats): number {
  return id === 'freeze' ? stats.freeze_resistance : id === 'silence' ? stats.silence_resistance : id === 'accuracy_down' ? stats.blind_resistance : 0;
}
export function elementalResistance(element: string, stats: CombatStats): number {
  const keys: Record<string, keyof CombatStats> = { neutral: 'neutral_resistance', water: 'water_resistance', earth: 'earth_resistance', fire: 'fire_resistance', wind: 'wind_resistance', poison: 'poison_resistance', holy: 'holy_resistance', dark: 'dark_resistance', ghost: 'ghost_resistance', undead: 'undead_resistance' };
  const key = keys[element]; return key ? stats[key] ?? 0 : 0;
}
