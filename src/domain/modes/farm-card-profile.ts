import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { cardOrigins, type CardOrigin } from '../../content/card-catalog.ts';
type Snapshot = NonNullable<AccountState['farm']['rate_snapshot']>;
export type CardDropProfile = NonNullable<Snapshot['card_drops']>;
interface Rules {
  version: string; chance_start: number; chance_end: number; weight_total: number;
  quality_start: Record<'bronze' | 'silver' | 'gold', number>; quality_end: Record<'bronze' | 'silver' | 'gold', number>;
  grade_unlock_chapter: Record<CardOrigin['grade'], number>; grade_weights: Record<CardOrigin['grade'], number>; tier_weights: Record<string, Record<string, number>>;
}
export function farmCardProfile(chapter: number, gearTier: number, ordinal: number, stageCount: number, content: ValidatedContent): CardDropProfile {
  const rules = content.documents['loot.json']!.cards as unknown as Rules, origins = cardOrigins(content);
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= stageCount) throw new Error('INVALID_CARD_FARM_STAGE');
  const progress = ordinal / Math.max(1, stageCount - 1), pool = Object.values(content.items).filter(item => item.kind === 'card' && origins[String(item.id)] && Number(item.tier_level) <= gearTier && rules.grade_unlock_chapter[origins[String(item.id)]!.grade] <= chapter).map(item => String(item.id)).sort();
  const weights = Object.fromEntries(pool.map(id => [id, rules.grade_weights[origins[id]!.grade] * (rules.tier_weights[String(gearTier)]![String(content.items[id]!.tier_level)] ?? 0)]));
  if (!pool.length || Object.values(weights).some(n => n < 1)) throw new Error('INVALID_CARD_FARM_POOL');
  const bronze = Math.round(rules.quality_start.bronze + (rules.quality_end.bronze - rules.quality_start.bronze) * progress), gold = Math.round(rules.quality_start.gold + (rules.quality_end.gold - rules.quality_start.gold) * progress);
  return { version: rules.version, chance_per_million: Math.round(rules.chance_start + (rules.chance_end - rules.chance_start) * progress), definition_pool: pool as CardDropProfile['definition_pool'], definition_weights: weights, quality_weights: { bronze, silver: rules.weight_total - bronze - gold, gold } };
}
