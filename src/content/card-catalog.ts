import type { ValidatedContent } from './model.ts';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'immortal' | 'supreme';
export type CardOrigin = { ro_item_id: number; monster_id: number; monster_name: string; grade: 'normal' | 'mini' | 'mvp'; source_slot: string; rarity_id: CardRarity; source_level: number; strength_class: 'weak' | 'strong' | 'elite' | 'mini' | 'mvp' };
export const cardOrigins = (content: ValidatedContent) => content.documents['cards.json']!.origins as unknown as Readonly<Record<string, CardOrigin>>;
