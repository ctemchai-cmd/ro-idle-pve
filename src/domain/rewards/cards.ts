import type { ValidatedContent } from '../../content/model.ts';
import { weightedChoice } from './weighted.ts';
import { cardRarity } from '../build/card-rarity.ts';
import type { CardRarity } from '../../content/card-catalog.ts';

interface CardPool { definitions: string[]; definition_weights: Record<string, number> }
/**
 * Weighted card definition from the card gacha pool for a uniform roll in [0,1). Shared by gacha and fixed card rewards.
 * D-068: only cards of the player's gear tier (1/20/40/60) are in the pool, so card finds keep pace with the chapter.
 */
export function gachaCardDefinition(roll: number, content: ValidatedContent, tier = 1, rarity?: CardRarity): string {
  if (!(roll >= 0 && roll < 1)) throw new RangeError('INVALID_ROLL');
  const pool = content.documents['gacha.json'] as unknown as CardPool, tierOf = (id: string) => Number((content.items[id] as unknown as { tier_level?: number } | undefined)?.tier_level ?? 1);
  if(rarity)return weightedChoice(pool.definitions.filter(id=>cardRarity(id,content)===rarity),pool.definition_weights,roll);
  const eligible = pool.definitions.filter(id => tierOf(id) === tier), ids = eligible.length ? eligible : pool.definitions.filter(id => tierOf(id) <= tier);
  return weightedChoice(ids, pool.definition_weights, roll);
}
