import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { cardOrigins, type CardRarity } from '../../content/card-catalog.ts';
export type CardItem = Extract<AccountState['inventory'][number], { kind: 'card' }>;
export const CARD_RARITIES: readonly CardRarity[] = ['common','uncommon','rare','epic','legendary','immortal','supreme'];
type LegacyQuality = 'bronze' | 'silver' | 'gold';
interface RarityRules { rarities: { id: string; multiplier: number; salvage_card_dust: number; enabled: boolean }[]; legacy_qualities: Record<LegacyQuality,{multiplier:number;salvage_card_dust:number}> }
const rules = (content: ValidatedContent) => content.documents['cards.json'] as unknown as RarityRules;
export const legacyCardQuality = (id: string): id is LegacyQuality => ['bronze','silver','gold'].includes(id);
export function cardRarity(id: string, content: ValidatedContent): CardRarity {
  const rarity=cardOrigins(content)[id]?.rarity_id;
  if(!rarity || !rules(content).rarities.some(r=>r.id===rarity&&r.enabled))throw new Error('INVALID_CARD_RARITY');
  return rarity;
}
/** Preserve prior investment once; fresh cards have no legacy quality. */
export function migrateCardRarity(item: CardItem, content: ValidatedContent): CardItem {
  return { ...item, rarity_id: cardRarity(item.definition_id,content), ...(legacyCardQuality(item.rarity_id)?{legacy_quality:item.rarity_id}:{}) };
}
export function cardRarityPower(card: CardItem, content: ValidatedContent): number {
  const data=rules(content),old=legacyCardQuality(card.rarity_id)?card.rarity_id:card.legacy_quality;
  // Direct legacy values remain readable for historical backups/fixtures. Migrated cards use the new rarity plus a floor.
  if(legacyCardQuality(card.rarity_id))return data.legacy_qualities[card.rarity_id].multiplier;
  const value=data.rarities.find(r=>r.id===card.rarity_id)?.multiplier;if(value===undefined)throw new Error('INVALID_CARD_RARITY');
  return Math.max(value,old?data.legacy_qualities[old].multiplier:0);
}
export function cardRarityDust(card: CardItem, content: ValidatedContent): number {
  const data=rules(content),old=legacyCardQuality(card.rarity_id)?card.rarity_id:card.legacy_quality;
  const value=legacyCardQuality(card.rarity_id)?0:data.rarities.find(r=>r.id===card.rarity_id)?.salvage_card_dust;
  if(value===undefined)throw new Error('INVALID_CARD_RARITY');
  return Math.max(value,old?data.legacy_qualities[old].salvage_card_dust:0);
}
