import type { ValidatedContent } from './model.ts';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'immortal' | 'supreme';
export type CardOrigin = { ro_item_id: number; monster_id: number; monster_name: string; grade: 'normal' | 'mini' | 'mvp'; source_slot: string; rarity_id: CardRarity; source_level: number; strength_class: 'weak' | 'strong' | 'elite' | 'mini' | 'mvp'; variant?: 'puppet'; parent_card_id?: string };
export const cardOrigins = (content: ValidatedContent) => content.documents['cards.json']!.origins as unknown as Readonly<Record<string, CardOrigin>>;
/** Card eligibility is independent of the wearable equipment drop table. */
export function cardTierForChapter(chapter: number, content: ValidatedContent): number {
  const tier = (content.documents['loot.json']!.cards as unknown as {tier_by_chapter:Record<string,number>}).tier_by_chapter[String(chapter)];
  if (tier === undefined) throw new Error('CARD_TIER_MISSING');
  return tier;
}
