import type { AccountState } from '../../contracts/index.ts';
import { weightedChoice } from './weighted.ts';
type Snapshot = NonNullable<AccountState['farm']['rate_snapshot']>;
export type CardDropProfile = NonNullable<Snapshot['card_drops']>;
/** Reads only the frozen profile. A missed roll consumes one draw, a hit consumes three. */
export function farmCardDrop(profile: CardDropProfile, draw: () => number): { definition_id: string; rarity_id: 'bronze' | 'silver' | 'gold' } | null {
  if (draw() * 1000000 >= profile.chance_per_million) return null;
  return { definition_id: weightedChoice(profile.definition_pool, profile.definition_weights, draw()), rarity_id: weightedChoice(['bronze', 'silver', 'gold'], profile.quality_weights, draw()) };
}
