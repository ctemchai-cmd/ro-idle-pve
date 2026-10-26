import type { AccountState, Modifier } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';

type EquipmentItem = Extract<AccountState['inventory'][number], { kind: 'equipment' }>;
export type ItemOptions = EquipmentItem['options'];
export type ItemOption = ItemOptions[number];
interface OptionRow { id: string; stat: Modifier['stat']; op: Modifier['op']; bucket: Modifier['bucket']; min: number; max: number; weight: number }
interface OptionRules { lines_by_rarity: Record<EquipmentItem['rarity_id'], number>; roll_scale: number; unique_stat_per_item: boolean; tier_scale: Record<string, number>; pool: OptionRow[] }
export const optionRules = (content: ValidatedContent) => content.documents['equipment.json']!.random_options as unknown as OptionRules;

/**
 * D-062 random option lines rolled when an item is created (drop, fusion, gacha). `draw` must be a
 * server-owned deterministic RNG; each line costs two draws (pool pick, value roll). Stats never repeat on one item.
 */
export function rollItemOptions(rarity: EquipmentItem['rarity_id'], draw: () => number, content: ValidatedContent, selection?: { count: number; excluded_stats: readonly string[] }): ItemOptions {
  const rules = optionRules(content), lines = selection?.count ?? rules.lines_by_rarity[rarity] ?? 0, picked: ItemOption[] = [], used = new Set<string>(selection?.excluded_stats);
  for (let line = 0; line < lines; line++) {
    const pool = rules.pool.filter(row => !rules.unique_stat_per_item || !used.has(row.stat)), total = pool.reduce((sum, row) => sum + row.weight, 0);
    if (!pool.length || total <= 0) break;
    let target = draw() * total, row = pool[pool.length - 1]!;
    for (const candidate of pool) { target -= candidate.weight; if (target < 0) { row = candidate; break; } }
    used.add(row.stat); picked.push({ id: row.id, roll: Math.min(rules.roll_scale, Math.floor(draw() * (rules.roll_scale + 1))) });
  }
  return picked as ItemOptions;
}
/** Resolved value of one line at an item tier: the roll interpolates the pool range, the tier scales it (tier-up keeps the roll). */
export function optionValue(option: ItemOption, tierLevel: number, content: ValidatedContent): { row: OptionRow; value: number } {
  const rules = optionRules(content), row = rules.pool.find(candidate => candidate.id === option.id);
  if (!row) throw new Error(`UNKNOWN_ITEM_OPTION:${option.id}`);
  const scale = rules.tier_scale[String(tierLevel)] ?? 1, value = Math.round((row.min + (row.max - row.min) * option.roll / rules.roll_scale) * scale * 10000) / 10000;
  return { row, value };
}
export function optionModifiers(item: Pick<EquipmentItem, 'options'>, tierLevel: number, content: ValidatedContent): Modifier[] {
  return (item.options ?? []).map((option, index) => { const { row, value } = optionValue(option, tierLevel, content); return { id: `option_${index}_${row.id}`, stat: row.stat, op: row.op, bucket: row.bucket, value }; });
}
/** Stable deterministic seed for items that predate D-062 (save migration): FNV-1a of the instance id. */
export function legacyOptionSeed(instanceId: string): number { let hash = 2166136261; for (let i = 0; i < instanceId.length; i++) { hash ^= instanceId.charCodeAt(i); hash = Math.imul(hash, 16777619) >>> 0; } return hash; }
