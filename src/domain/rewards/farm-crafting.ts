import type { AccountState } from '../../contracts/index.ts';
import { nextRandom } from '../../content/random.ts';

type Profile = NonNullable<NonNullable<AccountState['farm']['rate_snapshot']>['crafting_drops']>;
type CraftingMaterial=keyof Profile['chance_per_million'];
/** Separate serializable stream: adding stones never advances equipment/card loot_rng. */
export function rollFarmCrafting(farm:AccountState['farm'],profile:Profile,drops:number) {
  const result={option_stone:0,rarity_stone:0};
  const rng=farm.crafting_rng??={state:(farm.loot_rng.state^0x43524146)>>>0,draw_count:0};
  for(let i=0;i<drops;i++)for(const key of Object.keys(result)as CraftingMaterial[])if(nextRandom(rng)*1000000<profile.chance_per_million[key])result[key]++;
  return result;
}
