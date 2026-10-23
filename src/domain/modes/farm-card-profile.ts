import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { cardOrigins, type CardOrigin } from '../../content/card-catalog.ts';
type Snapshot = NonNullable<AccountState['farm']['rate_snapshot']>;
export type CardDropProfile = NonNullable<Snapshot['card_drops']>;
interface Rules {
  version: string; chance_start: number; chance_end: number; weight_total: number;
  grade_unlock_chapter: Record<CardOrigin['grade'], number>; grade_weights: Record<CardOrigin['grade'], number>; tier_weights: Record<string, Record<string, number>>;
  variant_unlock_chapter?: Record<string, number>; variant_weights?: Record<string, number>;
}
export function farmCardProfile(chapter: number, cardTier: number, ordinal: number, stageCount: number, content: ValidatedContent): CardDropProfile {
  const rules = content.documents['loot.json']!.cards as unknown as Rules, origins = cardOrigins(content);
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= stageCount) throw new Error('INVALID_CARD_FARM_STAGE');
  const unlock = (origin: CardOrigin) => (origin.variant ? rules.variant_unlock_chapter?.[origin.variant] : undefined) ?? rules.grade_unlock_chapter[origin.grade];
  const weight = (origin: CardOrigin) => (origin.variant ? rules.variant_weights?.[origin.variant] : undefined) ?? rules.grade_weights[origin.grade];
  const progress = ordinal / Math.max(1, stageCount - 1), pool = Object.values(content.items).filter(item => item.kind === 'card' && origins[String(item.id)] && Number(item.tier_level) <= cardTier && unlock(origins[String(item.id)]!) <= chapter).map(item => String(item.id)).sort();
  const weights = Object.fromEntries(pool.map(id => [id, weight(origins[id]!) * (rules.tier_weights[String(cardTier)]![String(content.items[id]!.tier_level)] ?? 0)]));
  if (!pool.length || Object.values(weights).some(n => n < 1)) throw new Error('INVALID_CARD_FARM_POOL');
  return { version: rules.version, chance_per_million: Math.round(rules.chance_start + (rules.chance_end - rules.chance_start) * progress), definition_pool: pool as CardDropProfile['definition_pool'], definition_weights: weights, definition_rarities: Object.fromEntries(pool.map(id=>[id,origins[id]!.rarity_id])) };
}
