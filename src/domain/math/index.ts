import type { CombatStats, PrimaryStats, StatBlueprint, Modifier, Effect } from '../../contracts/index.ts';
import type { DeepReadonly, ObjectValue } from '../../content/value.ts';
import type { ValidatedContent } from '../../content/model.ts';

export const clampProbability = (value: number) => Math.min(1, Math.max(0, value));
export function checked(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) throw new RangeError('UNSAFE_COMBAT_NUMBER');
  return value;
}
export function skillIntervalMs(speed: number, baseMs = 1500): number {
  if (!Number.isSafeInteger(baseMs) || baseMs < 1 || baseMs > 60000) throw new RangeError('INVALID_INTERVAL_BASE');
  return Math.max(1, Math.ceil(checked(baseMs * 100) / Math.max(1, checked(speed))));
}
export function castDurationMs(baseMs: number, speed: number): number {
  if (!Number.isSafeInteger(baseMs) || baseMs < 0) throw new RangeError('INVALID_DURATION');
  return baseMs === 0 ? 0 : Math.max(1, Math.ceil(checked(baseMs * 100) / Math.max(1, checked(speed))));
}

export function resolveStats(blueprint: DeepReadonly<StatBlueprint>, content: ValidatedContent, extraModifiers: readonly DeepReadonly<Modifier>[] = []): CombatStats {
  const definitions = content.documents['stat-definitions.json']!.stats as unknown as readonly { id: keyof CombatStats; group: string; minimum: number | null; rounding: string }[];
  const modifiers = [...blueprint.permanent_sources.flatMap(source => source.modifiers), ...extraModifiers];
  const values: Partial<CombatStats> = {};
  const apply = (id: keyof CombatStats, base: number) => {
    let flat = 0, percent = 0;
    for (const modifier of modifiers) if (modifier.stat === id) {
      if (modifier.when) throw new Error('CONDITIONAL_MODIFIER_REQUIRES_BUILD_CONTEXT');
      if (typeof modifier.value !== 'number') throw new Error('UNRESOLVED_MODIFIER');
      if (modifier.op === 'add_flat') flat = checked(flat + modifier.value);
      else percent = checked(percent + modifier.value);
    }
    const definition = definitions.find(row => row.id === id)!;
    let result = checked(checked(base + flat) * checked(1 + percent));
    if (definition.minimum !== null) result = Math.max(definition.minimum, result);
    if (definition.rounding === 'floor_after_modifiers') result = Math.floor(result);
    return result;
  };
  for (const key of Object.keys(blueprint.allocated_primary) as (keyof PrimaryStats)[]) values[key] = apply(key, blueprint.allocated_primary[key]);
  // D-057: every full 10 of a final primary adds a timing-neutral bonus (never ASPD/cast speed).
  const milestone = content.documents['combat-rules.json']!.primary_milestone_bonus as unknown as { every: number; per_step: Partial<Record<keyof PrimaryStats, Partial<Record<keyof CombatStats, number>>>> } | undefined, bonus: Partial<Record<keyof CombatStats, number>> = {};
  if (milestone) for (const [key, gains] of Object.entries(milestone.per_step) as [keyof PrimaryStats, Partial<Record<keyof CombatStats, number>>][]) {
    const steps = Math.floor(values[key]! / milestone.every);
    for (const [stat, amount] of Object.entries(gains) as [keyof CombatStats, number][]) bonus[stat] = checked((bonus[stat] ?? 0) + steps * amount);
  }
  const formulas = content.documents['combat-rules.json']!.derived_stats as unknown as Record<string, { base: number; per_level_after_one: number; primary?: Record<keyof PrimaryStats, number>; primary_above_one?: Record<keyof PrimaryStats, number> }>;
  for (const [id, formula] of Object.entries(formulas)) {
    let base = formula.base + formula.per_level_after_one * (blueprint.level - 1) + (blueprint.derived_offsets[id as keyof typeof blueprint.derived_offsets] ?? 0) + (bonus[id as keyof CombatStats] ?? 0);
    for (const [key, coefficient] of Object.entries(formula.primary ?? {})) base = checked(base + values[key as keyof PrimaryStats]! * coefficient);
    for (const [key, coefficient] of Object.entries(formula.primary_above_one ?? {})) base = checked(base + (values[key as keyof PrimaryStats]! - 1) * coefficient);
    values[id as keyof CombatStats] = apply(id as keyof CombatStats, base);
  }
  for (const definition of definitions) if (!(definition.id in values)) values[definition.id] = apply(definition.id, bonus[definition.id] ?? 0);
  return values as CombatStats;
}

export function rawPower(formula: { id: string; params: ObjectValue }, offense: DeepReadonly<CombatStats>, preSpendSp: number, eventDamage = 0): number {
  const p = formula.params;
  for (const value of Object.values(p)) if (typeof value !== 'number') throw new Error('UNRESOLVED_FORMULA');
  const power = formula.id === 'physical_power' ? offense.physical_attack * Number(p.attack_ratio) + Number(p.flat_power)
    : ['magical_power', 'healing_power'].includes(formula.id) ? offense.magical_attack * Number(p.attack_ratio) + Number(p.flat_power)
    : formula.id === 'flat_power' ? Number(p.amount)
    : formula.id === 'sp_burst_power' ? offense.physical_attack * Number(p.attack_ratio) + preSpendSp * Number(p.sp_ratio) + Number(p.flat_power)
    : formula.id === 'event_damage_power' ? eventDamage * Number(p.ratio) : NaN;
  return Math.max(0, checked(power));
}
export function hitChance(caster: DeepReadonly<CombatStats>, target: DeepReadonly<CombatStats>) { return clampProbability(.95 + .002 * (caster.dex - target.agi) + .001 * (caster.luk - 1) + caster.hit_bonus - target.evasion_bonus); }
export function critChance(caster: DeepReadonly<CombatStats>, target: DeepReadonly<CombatStats>) { return clampProbability(.05 + .008 * (caster.luk - 1) + caster.crit_chance_bonus - .003 * (target.luk - 1) - target.crit_resistance); }
export function critMultiplier(caster: DeepReadonly<CombatStats>) { return Math.max(1, 1.5 + .005 * (caster.luk - 1) + caster.crit_damage_bonus); }

export interface MitigationInput {
  raw: number; defense?: number; armor_break?: number; penetration?: number; flat_penetration?: number;
  outgoing?: number; element?: number; crit?: number; flat_reduction?: number; guard?: number; vulnerability?: number; ignore_armor?: boolean;
}
export function calculateDamage(input: MitigationInput): number {
  const defense = Math.max(0, Math.max(0, (input.defense ?? 0) * (1 - (input.armor_break ?? 0))) * (1 - (input.penetration ?? 0)) - (input.flat_penetration ?? 0));
  const armor = input.ignore_armor ? 1 : 1 - .9 * defense / (defense + 400);
  const power = checked(input.raw * Math.max(0, 1 + (input.outgoing ?? 0)) * (input.element ?? 1) * (input.crit ?? 1) * armor);
  return Math.floor(checked(Math.max(0, power - (input.flat_reduction ?? 0)) * Math.max(0, 1 - (input.guard ?? 0)) * Math.max(0, 1 + (input.vulnerability ?? 0))) + 1e-9);
}
export function damageForHit(effect: Extract<Effect, { type: 'damage' }>, raw: number, caster: DeepReadonly<CombatStats>, target: DeepReadonly<CombatStats>, element: number, critical: boolean) {
  return calculateDamage({ raw, defense: effect.damage_type === 'magical' ? target.magical_defense : target.physical_defense,
    armor_break: target.armor_break_percent, penetration: caster.penetration_percent, flat_penetration: caster.flat_penetration,
    outgoing: effect.damage_type === 'magical' ? caster.outgoing_magical_bonus : effect.damage_type === 'true' ? caster.outgoing_true_bonus : caster.outgoing_physical_bonus,
    element, crit: critical ? critMultiplier(caster) : 1, flat_reduction: target.flat_damage_reduction, guard: target.guard_percent, vulnerability: target.damage_taken_bonus, ignore_armor: effect.armor_rule === 'ignore' });
}
export function spRegen(stats: DeepReadonly<CombatStats>) { return Math.floor(checked(Math.max(0, 2 + .02 * stats.max_sp + .02 * (stats.int - 1) + stats.flat_sp_regen) * Math.max(0, 1 + stats.sp_regen_percent))); }
export function hpRegen(stats: DeepReadonly<CombatStats>) { return Math.floor(Math.max(0, checked(stats.flat_hp_regen + stats.max_hp * stats.hp_regen_percent))); }
