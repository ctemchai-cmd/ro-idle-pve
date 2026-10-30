import{shopChapter}from'../domain/build/shop-progression.ts';
import {craftingRules,craftingStock,type CraftingMaterial} from '../domain/progression/equipment-crafting.ts';
import { resolvedShopOffer,shopOfferUnlocked,shopCatalog,shopMaxQuantity,shopQuote,shopRemaining } from '../domain/progression/shop.ts';
import { elementScrolls, preparedScroll, supplyStock } from '../domain/build/consumables.ts';
import { loadValidatedContent } from './content.ts';
import type { AccountState } from '../contracts/index.ts';
import { itemDefinition } from '../domain/build/equipment-definition.ts';
import { bangkokDay } from '../domain/modes/daily.ts';
import { gachaGearTier, pullCost } from '../domain/rewards/gacha.ts';
import { cardOrigins } from '../content/card-catalog.ts';
const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT_UNAVAILABLE');
const content = loaded.value;
type Item = AccountState['inventory'][number];
const labels = content.documents['strings.th.json']!.strings as unknown as Record<string, string>;
/** "Rare 1 · Epic 2 · …" from content, so the banner cannot drift from the rolled line counts (D-062/D-068). */
export function optionLineSummary(): string {
  const lines = (content.documents['equipment.json']!.random_options as unknown as { lines_by_rarity: Record<string, number> }).lines_by_rarity;
  const names: Record<string, string> = { rare: 'Rare', epic: 'Epic', legendary: 'Legendary', immortal: 'Immortal', supreme: 'Supreme' };
  return Object.entries(lines).filter(([, count]) => count > 0).map(([rarity, count]) => `${names[rarity] ?? rarity} ${count}`).join(' · ');
}
const offerNames: Record<string, string> = { exp_pack: 'ถุง EXP', manual_pack: 'คู่มือสกิล', ore_pack: 'แร่ Refine', enchant_pack: 'ผง Enchant', card_dust_pack: 'ผงการ์ด', essence_pack: 'Essence เบรก', crystal_exchange: 'แลก Crystal' };

/** Store tab data (D-063): today's remaining limits on the server Bangkok day, gacha prices/rates and pity counters. */
export function storeView(state: AccountState, nowMs: number) {
  const day = bangkokDay(nowMs),shop=shopCatalog(content);
  const gacha = content.documents['gacha.json'] as unknown as { quality_weights: Record<string, number>; weight_total: number; pity: { gold_after_misses: number; silver_or_better_after_bronzes: number }; equipment_pool: { rarity_weights: Record<string, number>; weight_total: number; pity: { legendary_or_better_after_misses: number; epic_or_better_after_rares: number } } };
  const odds = (weights: Record<string, number>, total: number) => Object.entries(weights).filter(([,weight])=>weight>0).map(([id, weight]) => ({ id, percent: Math.round(weight / total * 10000) / 100 }));
  return {
    scrolls: elementScrolls(content).map(row=>({...row, stock:supplyStock(state,row.id)})),
    prepared: Object.fromEntries(state.roster.map(actor=>[actor.character_id,preparedScroll(state,actor.character_id,content)])),
    day,
    offers: shop.offers.map(rawOffer => {const offer=resolvedShopOffer(state,rawOffer.id,content),maxQuantity=shopMaxQuantity(state,offer.id,day,content);return{...offer,chapter:shopChapter(state,content),unlocked:shopOfferUnlocked(state,offer,content),artifact:offer.artifact_grant??null,scroll:elementScrolls(content).find(row=>row.id===offer.id),crafting:Object.entries(offer.crafting_grant??{}).map(([id,n])=>({id:id as CraftingMaterial,name:craftingRules(content).materials[id as CraftingMaterial].name,count:n!,stock:craftingStock(state,id as CraftingMaterial)})),name:craftingRules(content).materials[offer.id as CraftingMaterial]?.name??elementScrolls(content).find(row=>row.id===offer.id)?.name??(offer.id==='artifact_essence'?'Essence Artifact':offerNames[offer.id])??offer.id,left:shopRemaining(state,offer,day),maxQuantity,maxPrice:maxQuantity?shopQuote(state,offer.id,maxQuantity,day,content).cost:null};}),
    cards: { cost1: pullCost('card_v1', 1, content), cost10: pullCost('card_v1', 10, content), odds: odds(gacha.quality_weights, gacha.weight_total), gold_in: gacha.pity.gold_after_misses + 1 - state.gacha.card_v1.gold_misses, silver_in: gacha.pity.silver_or_better_after_bronzes + 1 - state.gacha.card_v1.bronze_streak },
    gear: { cost1: pullCost('equipment_v1', 1, content), cost10: pullCost('equipment_v1', 10, content), odds: odds(gacha.equipment_pool.rarity_weights, gacha.equipment_pool.weight_total), tier: gachaGearTier(state, content),
      legendary_in: gacha.equipment_pool.pity.legendary_or_better_after_misses + 1 - state.gacha.equipment_v1.legendary_misses, epic_in: gacha.equipment_pool.pity.epic_or_better_after_rares + 1 - state.gacha.equipment_v1.rare_streak },
  };
}
/** Revealed gacha results for the receipt's created instance ids (name, icon, rarity, slot). */
export function revealItems(state: AccountState, ids: readonly string[]) {
  const equipment = content.documents['equipment.json']!.presentations as unknown as { id: string; icon_asset_id: string }[], cards = content.documents['cards.json']!.presentations as unknown as { id: string; symbol_asset_id: string }[];
  return ids.map(id => state.inventory.find(item => item.instance_id === id)).filter((item): item is Item => !!item).map(item => {
    const definition = itemDefinition(item, content);
    const iconId = item.kind === 'card' ? cards.find(p => p.id === definition.presentation_id)?.symbol_asset_id ?? null : equipment.find(p => p.id === definition.presentation_id)?.icon_asset_id ?? null;
    return { origin: item.kind==='card'?cardOrigins(content)[item.definition_id]:null, item, name: labels[definition.name_key] ?? definition.id, iconId, slot: definition.slot, lines: item.kind === 'equipment' ? item.options.length : 0 };
  });
}

export const preparedWeaponElement = (state: AccountState, characterId: string) => preparedScroll(state,characterId,content)?.element;
