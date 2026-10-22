import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { progressionData } from '../progression/characters.ts';
import { storyStage, storyFarmSnapshot } from '../modes/story.ts';
import { legacyOptionSeed, rollItemOptions } from '../build/item-options.ts';
import { nextRandom } from '../../content/random.ts';
import { dailyUnlocked } from '../modes/daily.ts';
import { cardRarity, migrateCardRarity } from '../build/card-rarity.ts';

export interface SaveMigration { state: AccountState; changes: string[] }
const canonicalPool = (pool: readonly string[]) => [...pool].sort().join(',');
/**
 * Carries a saved account across a content/rules change (TASK-040 slice, D-058).
 * It never invents progress: it fills new defaults, refunds what no longer fits the
 * current rules, drops dangling references and ends any battle. The caller must still
 * pass the result through AccountCommandRules.validateAccount before committing it.
 */
export function migrateAccountState(input: unknown, content: ValidatedContent): SaveMigration {
  const state = structuredClone(input) as AccountState, changes: string[] = [], data = progressionData(content);
  if (!state.battle_supplies) { state.battle_supplies = { stock: {}, queued: {} }; changes.push('battle_supplies initialized'); }
  for(const items of [state.inventory,...state.pending_rewards.map(claim=>claim.items)])for(let index=0;index<items.length;index++){
    const item=items[index]!;if(item.kind!=='card')continue;
    const normalized=migrateCardRarity(item,content);if(normalized.rarity_id!==item.rarity_id){items[index]=normalized;changes.push(`${item.instance_id}: fixed monster rarity ${item.rarity_id} -> ${normalized.rarity_id} (prior power retained)`);}
  }
  for (const actor of state.roster) for (const [slot, progress] of Object.entries(actor.slot_progress) as [string, { refine_failures?: number }][]) {
    if (progress.refine_failures === undefined) { progress.refine_failures = 0; changes.push(`${actor.character_id}.${slot}.refine_failures=0`); }
  }
  // Fixed-rarity snapshots keep their earned pool/chance/RNG, while corrected monster
  // classifications must match the new catalog before the first unpaid AFK claim.
  const frozenCards = state.farm.rate_snapshot?.card_drops;
  if (frozenCards?.definition_rarities) for (const id of frozenCards.definition_pool) {
    if (content.items[id]?.kind !== 'card') continue;
    const rarity = cardRarity(id, content);
    if (frozenCards.definition_rarities[id] !== rarity) {
      frozenCards.definition_rarities[id] = rarity;
      changes.push(`${id}: frozen card rarity updated to ${rarity}, pool/chance unchanged`);
    }
  }
  // D-062: equipment created before random options gets its lines now, from a stable per-instance seed (never re-rolled later).
  for (const item of state.inventory) if (item.kind === 'equipment' && (item as { options?: unknown }).options === undefined) {
    const rng = { state: legacyOptionSeed(item.instance_id), draw_count: 0 };
    item.options = item.training ? [] : rollItemOptions(item.rarity_id, () => nextRandom(rng), content);
    if (item.options.length) changes.push(`${item.instance_id}: ${item.options.length} option line(s)`);
  }
  for (const claim of state.pending_rewards) for (const item of claim.items) if (item.kind === 'equipment' && (item as { options?: unknown }).options === undefined) { const rng = { state: legacyOptionSeed(item.instance_id), draw_count: 0 }; item.options = rollItemOptions(item.rarity_id, () => nextRandom(rng), content); }
  const gacha = state.gacha as Partial<AccountState['gacha']>; if (!gacha.equipment_v1) { gacha.equipment_v1 = { legendary_misses: 0, rare_streak: 0 }; changes.push('equipment gacha counters added'); }
  if (!(state as Partial<AccountState>).shop) { state.shop = { day: null, purchases: {} }; changes.push('shop purchase record added'); }
  if (state.active_battle) { state.active_battle = null; changes.push('active battle ended (battles never cross content versions)'); }
  const known = (id: string) => !!storyStage(id, content), cleared = state.story.cleared_stage_ids.filter(known);
  if (cleared.length !== state.story.cleared_stage_ids.length) { changes.push(`dropped unknown cleared stages: ${state.story.cleared_stage_ids.filter(id => !known(id)).join(',')}`); state.story.cleared_stage_ids = cleared; }
  // Earlier new-game resets kept dungeon counters. A game that has not unlocked daily
  // cannot have earned these records: clear only this carry-over, never an unlocked game's progress.
  if (!dailyUnlocked(state, content) && state.daily_records.length) {
    state.daily_records = [];
    state.pending_rewards = state.pending_rewards.filter(claim => claim.kind !== 'daily');
    changes.push('daily dungeons reset: removed progress carried over before their unlock');
  }
  if (state.story.selected_farm_stage && !known(state.story.selected_farm_stage)) { changes.push(`farm stage ${state.story.selected_farm_stage} no longer exists`); state.story.selected_farm_stage = null; }
  if (state.farm.rate_snapshot) {
    const stage = state.story.selected_farm_stage ? storyStage(state.story.selected_farm_stage, content) : undefined;
    // Accrual already reserved stays paid; future accrual uses the current rate table.
    if (!stage) { state.farm.rate_snapshot = null; changes.push('farm rate cleared until a stage is selected'); }
    else if (state.farm.rate_snapshot.content_version !== content.manifest.content_version || state.farm.rate_snapshot.rules_version !== content.manifest.rules_version || canonicalPool(state.farm.rate_snapshot.definition_pool) !== canonicalPool(storyFarmSnapshot(stage, state, content).definition_pool)) { const hadCards = !!state.farm.rate_snapshot.card_drops; state.farm.rate_snapshot = storyFarmSnapshot(stage, state, content); if (!hadCards) delete state.farm.rate_snapshot.card_drops; changes.push(`farm rate refreshed for ${stage.id}`); } // D-068: a new drop catalogue refreshes the pool
  }
  for (const actor of state.roster) {
    // D-099 corrects RO card slots. Cards already live in inventory: release only the incompatible assignment.
    for (const [slot, progress] of Object.entries(actor.slot_progress)) for (let index = 0; index < progress.cards.length; index++) {
      const id = progress.cards[index], item = id ? state.inventory.find(row => row.instance_id === id) : null;
      if (item?.kind === 'card' && content.items[item.definition_id]?.slot !== slot) {
        progress.cards[index] = null; changes.push(`${actor.character_id}.${slot}: card ${item.definition_id} returned to inventory (RO slot corrected)`);
      }
    }
    const investments = state.paid_ledger.filter(e => e.character_id === actor.character_id && e.feature_id === 'status' && e.refund_state === 'active');
    const invested = investments.reduce((n, e) => n + e.quantity, 0), total = data.progression.level_rows.find(r => r.level === actor.level)!.total_status_points;
    if (invested > total) {
      for (const row of investments) { row.refund_state = 'refunded'; row.refund_command_id = null; }
      actor.primary_stats = { ...data.status_allocation.base }; actor.unspent_status_points = total;
      changes.push(`${actor.character_id}: status reset, ${invested} invested exceeds new budget ${total}`);
    } else if (actor.unspent_status_points + invested !== total) {
      changes.push(`${actor.character_id}: unspent status ${actor.unspent_status_points} -> ${total - invested}`); actor.unspent_status_points = total - invested;
    }
  }
  return { state, changes };
}
