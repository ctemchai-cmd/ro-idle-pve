import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { rollItemOptions } from '../build/item-options.ts';
import { gachaCardDefinition } from './cards.ts';
import { CARD_RARITIES } from '../build/card-rarity.ts';
import type { CardRarity } from '../../content/card-catalog.ts';

type Item = AccountState['inventory'][number];
type Wallet = AccountState['wallet'];
type GearRarity = Extract<Item, { kind: 'equipment' }>['rarity_id'];
interface CardPool { cost_per_pull: Partial<Wallet>; multi_pull_count: number; multi_pull_cost: Partial<Wallet>; quality_weights: Record<CardRarity, number>; pity: { gold_after_misses: number; silver_or_better_after_bronzes: number } }
interface GearPool { cost_per_pull: Partial<Wallet>; multi_pull_count: number; multi_pull_cost: Partial<Wallet>; rarity_weights: Partial<Record<GearRarity, number>>; pity: { legendary_or_better_after_misses: number; epic_or_better_after_rares: number } }
export type PoolId = 'card_v1' | 'equipment_v1';
const cardPool = (content: ValidatedContent) => content.documents['gacha.json'] as unknown as CardPool;
const gearPool = (content: ValidatedContent) => (content.documents['gacha.json'] as unknown as { equipment_pool: GearPool }).equipment_pool;

export function pullCost(pool: PoolId, count: 1 | 10, content: ValidatedContent): Partial<Wallet> {
  const data = pool === 'card_v1' ? cardPool(content) : gearPool(content);
  return count === data.multi_pull_count ? { ...data.multi_pull_cost } : { ...data.cost_per_pull };
}
/** Weighted pick over the listed keys for a roll in [0,1). */
function weighted<K extends string>(roll: number, weights: Partial<Record<K, number>>, keys: readonly K[]): K {
  const total = keys.reduce((sum, key) => sum + (weights[key] ?? 0), 0); let target = roll * total;
  for (const key of keys) { target -= weights[key] ?? 0; if (target < 0) return key; }
  return keys[keys.length - 1]!;
}
/** D-109: fixed-monster rarity; existing counter names preserve Legendary/Rare+ pity progress. */
export function pullCards(state: AccountState, count: 1 | 10, draw: () => number, idPrefix: string, content: ValidatedContent): Item[] {
  const pool = cardPool(content), counters = state.gacha.card_v1, items: Item[] = [], tier = gachaGearTier(state, content);
  for (let n = 0; n < count; n++) {
    const roll = draw();
    const enabled=CARD_RARITIES.filter(r=>pool.quality_weights[r]>0),keys=counters.gold_misses>=pool.pity.gold_after_misses?enabled.filter(r=>CARD_RARITIES.indexOf(r)>=4):counters.bronze_streak>=pool.pity.silver_or_better_after_bronzes?enabled.filter(r=>CARD_RARITIES.indexOf(r)>=2):enabled;
    const quality=weighted(roll,pool.quality_weights,keys);
    if (CARD_RARITIES.indexOf(quality)>=4) { counters.gold_misses = 0; counters.bronze_streak = 0; }
    else if (CARD_RARITIES.indexOf(quality)>=2) { counters.gold_misses++; counters.bronze_streak = 0; }
    else { counters.gold_misses++; counters.bronze_streak++; }
    items.push({ instance_id: `${idPrefix}_${n}`, definition_id: gachaCardDefinition(draw(), content, tier,quality), kind: 'card', rarity_id: quality, locked: false, level: 1 });
  }
  return items;
}
/** Highest Story chapter whose final stage is cleared (≥ 1) decides the equipment tier of gacha gear (loot tier_by_chapter). */
export function gachaGearTier(state: AccountState, content: ValidatedContent): number {
  const stages = content.documents['stages.json']!.stages as unknown as { id: string; chapter: number }[], tiers = (content.documents['loot.json']!.gear as unknown as { tier_by_chapter: Record<string, number> }).tier_by_chapter;
  let chapter = 1; for (const c of new Set(stages.map(stage => stage.chapter))) { const last = stages.filter(stage => stage.chapter === c).at(-1)!; if (state.story.cleared_stage_ids.includes(last.id)) chapter = Math.max(chapter, c); }
  return tiers[String(chapter)] ?? 1;
}
const GEAR: readonly GearRarity[] = ['rare', 'epic', 'legendary', 'immortal'];
/** Equipment gacha (TASK-051, D-063): rarity with legendary/epic pity, a uniform definition of the player's tier, then D-062 options. */
export function pullGear(state: AccountState, count: 1 | 10, draw: () => number, idPrefix: string, content: ValidatedContent): Item[] {
  const pool = gearPool(content), counters = state.gacha.equipment_v1, tier = gachaGearTier(state, content), items: Item[] = [];
  const definitions = Object.values(content.items).filter(item => item.kind === 'equipment' && item.tier_level === tier).map(item => String(item.id)).sort();
  if (!definitions.length) throw new Error('GACHA_TIER_EMPTY');
  for (let n = 0; n < count; n++) {
    const roll = draw(), keys = counters.legendary_misses >= pool.pity.legendary_or_better_after_misses ? GEAR.slice(2) : counters.rare_streak >= pool.pity.epic_or_better_after_rares ? GEAR.slice(1) : GEAR;
    const rarity = weighted(roll, pool.rarity_weights, keys);
    if (rarity === 'legendary' || rarity === 'immortal') { counters.legendary_misses = 0; counters.rare_streak = 0; }
    else if (rarity === 'epic') { counters.legendary_misses++; counters.rare_streak = 0; }
    else { counters.legendary_misses++; counters.rare_streak++; }
    const definition = definitions[Math.min(definitions.length - 1, Math.floor(draw() * definitions.length))]!;
    items.push({ instance_id: `${idPrefix}_${n}`, definition_id: definition, kind: 'equipment', rarity_id: rarity, locked: false, training: false, options: rollItemOptions(rarity, draw, content) });
  }
  return items;
}
