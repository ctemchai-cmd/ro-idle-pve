import type { ValidatedContent } from './model.ts';
export type CardOrigin = { ro_item_id: number; monster_id: number; monster_name: string; grade: 'normal' | 'mini' | 'mvp'; source_slot: string };
export const cardOrigins = (content: ValidatedContent) => content.documents['cards.json']!.origins as unknown as Readonly<Record<string, CardOrigin>>;
