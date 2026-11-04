import type { CombatVisuals } from '../contracts/assets.ts';

/** Renderer-only extension; this does not change saved combat contracts. */
export interface SummonVisual { meta: string; skill_ids: readonly string[]; scale: number }
export function summonVisuals(visuals: CombatVisuals): Readonly<Record<string, SummonVisual>> {
  return (visuals as CombatVisuals & { summons?: Readonly<Record<string, SummonVisual>> }).summons ?? {};
}
export function validateSummonVisuals(visuals: CombatVisuals, skillIds: readonly string[]) {
  for (const row of Object.values(summonVisuals(visuals))) {
    if (!row.meta?.endsWith('.meta.json') || !Number.isFinite(row.scale) || row.scale <= 0 || row.scale > 4 || !row.skill_ids?.length || row.skill_ids.some(id => !skillIds.includes(id))) throw new Error('INVALID_SUMMON_VISUAL');
  }
}
