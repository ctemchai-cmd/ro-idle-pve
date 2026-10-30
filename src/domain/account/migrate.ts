import {emptyArtifacts,reconcileArtifactSlots} from '../build/artifacts.ts';
import { recoverCompatibleDaily, type DailyRecoveryContext } from './daily-battle-recovery.ts';
import {emptyCrafting} from '../progression/equipment-crafting.ts';
import { migrateDailyQuota } from './daily-quota-migration.ts';
import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { cardCapacity } from '../progression/slots.ts';
import { progressionData } from '../progression/characters.ts';
import { storyStage, storyFarmSnapshot } from '../modes/story.ts';
import { legacyOptionSeed, rollItemOptions } from '../build/item-options.ts';
import { nextRandom } from '../../content/random.ts';
import { dailyUnlocked } from '../modes/daily.ts';
import { cardRarity, migrateCardRarity } from '../build/card-rarity.ts';
import { migrateSkillCaps } from '../progression/skill-cap-migration.ts';
import { canonical } from '../../content/value.ts';

export interface SaveMigration { state: AccountState; changes: string[] }
const canonicalPool = (pool: readonly string[]) => [...pool].sort().join(',');
type FarmSnapshot=NonNullable<AccountState['farm']['rate_snapshot']>;
/** A catalog extension starts after the already-earned window is settled.
 * Only identical payout rules and intact old definitions/weights qualify. */
function keepFrozenCardCatalog(frozen:FarmSnapshot,current:FarmSnapshot,content:ValidatedContent):boolean{
 const old=frozen.card_drops,next=current.card_drops;if(!old||!next||next.definition_pool.length<=old.definition_pool.length)return false;
 const {content_version:_oldContent,rules_version:_oldRules,card_drops:_oldCards,...oldPayout}=frozen;
 const {content_version:_newContent,rules_version:_newRules,card_drops:_newCards,...newPayout}=current;
 if(canonical(oldPayout)!==canonical(newPayout))return false;
 const {definition_pool:_oldPool,definition_weights:_oldWeights,definition_rarities:_oldRarities,...oldCardRules}=old;
 const {definition_pool:_newPool,definition_weights:_newWeights,definition_rarities:_newRarities,...newCardRules}=next;
 if(canonical(oldCardRules)!==canonical(newCardRules))return false;
 return old.definition_pool.length>0&&old.definition_pool.every(id=>content.items[id]?.kind==='card'&&next.definition_pool.includes(id)&&old.definition_weights[id]===next.definition_weights[id]&&old.definition_rarities?.[id]===next.definition_rarities?.[id]);
}
/**
 * Carries a saved account across a content/rules change (TASK-040 slice, D-058).
 * It never invents progress: it fills new defaults, refunds what no longer fits the
 * current rules, drops dangling references and ends any battle. The caller must still
 * pass the result through AccountCommandRules.validateAccount before committing it.
 */
export function migrateAccountState(input: unknown, content: ValidatedContent, context?: DailyRecoveryContext): SaveMigration {
  const state = structuredClone(input) as AccountState, changes: string[] = [], data = progressionData(content);
  migrateDailyQuota(state, changes, context);
  if(!state.artifacts){state.artifacts=emptyArtifacts();changes.push('Artifact empty collection added');}reconcileArtifactSlots(state,content);
  if(!state.equipment_crafting){state.equipment_crafting=emptyCrafting();changes.push('equipment crafting empty stock added');}
  // The new currency starts at zero everywhere, including frozen unpaid snapshots
  // and actual-paid ledgers. Never price old investments or grant shards retroactively.
  for(const vector of [state.wallet,state.farm.remainders,...state.pending_rewards.map(r=>r.resource_vector),...state.paid_ledger.map(r=>r.paid_resources),...(state.farm.rate_snapshot?[state.farm.rate_snapshot.per_hour]:[])]){
    if(vector.awakening_shard===undefined){vector.awakening_shard=0;changes.push('awakening_shard defaulted to0');}
  }
  for(const actor of state.roster)if(!actor.awakened_skills){actor.awakened_skills=[];changes.push(`${actor.character_id}: no awakened skills in legacy save`);}
  if (!state.battle_supplies) { state.battle_supplies = { stock: {}, queued: {} }; changes.push('battle_supplies initialized'); }
  for(const items of [state.inventory,...state.pending_rewards.map(claim=>claim.items)])for(let index=0;index<items.length;index++){
    const item=items[index]!;if(item.kind!=='card')continue;
    const normalized=migrateCardRarity(item,content);if(normalized.rarity_id!==item.rarity_id){items[index]=normalized;changes.push(`${item.instance_id}: fixed monster rarity ${item.rarity_id} -> ${normalized.rarity_id} (prior power retained)`);}
  }
  for (const actor of state.roster) for (const [slot, progress] of Object.entries(actor.slot_progress)) {
    if (progress.refine_failures === undefined) { progress.refine_failures = 0; changes.push(`${actor.character_id}.${slot}.refine_failures=0`); }
    // D-141: instances already live in inventory; release only newly locked bindings.
    const capacity = cardCapacity(progress.refine, content);
    for (let index = capacity; index < progress.cards.length; index++) if (progress.cards[index]) {
      changes.push(`${actor.character_id}.${slot}: card ${progress.cards[index]} returned to inventory (socket ${index + 1} locked by Refine)`);
      progress.cards[index] = null;
    }
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
    else {
      const frozen = state.farm.rate_snapshot, current = storyFarmSnapshot(stage, state, content);
      // D172: a higher tier starts after the next frozen window is settled by
      // farm.claim/set_stage. Preserve its cursor, draws and old earned gear.
      const keepFrozenUpgrade = frozen.gear_tier < current.gear_tier && frozen.definition_pool.length > 0 && frozen.definition_pool.every(id => content.items[id]?.kind === 'equipment' && content.items[id]!.tier_level === frozen.gear_tier);
      const keepFrozenExp = frozen.per_hour.hero_exp < current.per_hour.hero_exp && Object.entries(frozen.per_hour).every(([key,n])=>key==='hero_exp'||n===current.per_hour[key as keyof typeof current.per_hour]);
      if (!keepFrozenExp && !(frozen.per_hour.crystal*2===current.per_hour.crystal) && !keepFrozenUpgrade && !keepFrozenCardCatalog(frozen,current,content) && (frozen.content_version !== content.manifest.content_version || frozen.rules_version !== content.manifest.rules_version || canonicalPool(frozen.definition_pool) !== canonicalPool(current.definition_pool))) {
        const hadCards = !!frozen.card_drops; state.farm.rate_snapshot = current;
        if (!hadCards) delete state.farm.rate_snapshot.card_drops;
        changes.push(`farm rate refreshed for ${stage.id}`);
      }
    }
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
  migrateSkillCaps(state,content,changes);
  recoverCompatibleDaily(input as AccountState,state,changes,content,context);
  return { state, changes };
}
