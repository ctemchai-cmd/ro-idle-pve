import type { AccountState } from '../../contracts/index.ts';
import { weightedChoice } from './weighted.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { cardRarity, type CardItem } from '../build/card-rarity.ts';
type Snapshot = NonNullable<AccountState['farm']['rate_snapshot']>;
export type CardDropProfile = NonNullable<Snapshot['card_drops']>;
/** Reads only the frozen profile. A missed roll consumes one draw, a hit consumes three. */
export function farmCardDrop(profile: CardDropProfile, draw: () => number, content: ValidatedContent): Pick<CardItem,'definition_id'|'rarity_id'|'legacy_quality'> | null {
  if (draw() * 1000000 >= profile.chance_per_million) return null;
  const definition_id=weightedChoice(profile.definition_pool, profile.definition_weights, draw()),qualityDraw=draw(); // Keep the existing three-draw hit budget and shared gear RNG sequence.
  if(profile.definition_rarities){const rarity_id=profile.definition_rarities[definition_id];if(!rarity_id||rarity_id!==cardRarity(definition_id,content))throw new Error('INVALID_CARD_FARM_RARITY');return{definition_id,rarity_id};}
  if(!profile.quality_weights)throw new Error('INVALID_LEGACY_CARD_PROFILE');
  return { definition_id, rarity_id:cardRarity(definition_id,content),legacy_quality:weightedChoice(['bronze', 'silver', 'gold'] as const, profile.quality_weights,qualityDraw) };
}
