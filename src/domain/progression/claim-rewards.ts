import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { ProgressionRejection } from './rejection.ts';
import { grantCraftingMaterials, type CraftingMaterial } from './equipment-crafting.ts';
import { dailyAttemptKey, dailyQuotaClaimPlan } from './daily-quota.ts';

/** Validate the whole selection before applying a single, fixed reward batch. */
export function claimRewards(state: AccountState, ids: readonly string[], content: ValidatedContent): void {
  const reject = (code: string): never => { throw new ProgressionRejection(code); };
  if (!ids.length || ids.length > 32 || new Set(ids).size !== ids.length) reject('INVALID_CLAIM_SELECTION');
  const selected = ids.map(id => state.pending_rewards.find(c => c.claim_id === id) ?? reject('CLAIM_NOT_FOUND'));
  const quota = dailyQuotaClaimPlan(state, selected, content);
  const items = selected.flatMap(c => c.items), known = new Set(state.inventory.map(i => i.instance_id));
  if (state.inventory.length + items.length > Number(content.documents['equipment.json']!.inventory_capacity)) reject('INVENTORY_FULL');
  for (const item of items) { if (known.has(item.instance_id)) reject('DUPLICATE_REWARD_INSTANCE'); known.add(item.instance_id); }
  const wallet = { ...state.wallet };
  for (const claim of selected) for (const key of Object.keys(wallet) as (keyof typeof wallet)[]) {
    const total = wallet[key] + claim.resource_vector[key];
    if (!Number.isSafeInteger(total)) reject('RESOURCE_OVERFLOW');
    wallet[key] = total;
  }
  const stones:Partial<Record<CraftingMaterial,number>>={};
  for(const claim of selected)for(const[key,value]of Object.entries(claim.crafting_materials??{})as[CraftingMaterial,number][]){const total=(stones[key]??0)+value;if(!Number.isSafeInteger(total))reject('RESOURCE_OVERFLOW');if(total>0)stones[key]=total;}
  if(Object.keys(stones).length)grantCraftingMaterials(state,stones,1);
  state.wallet = wallet; state.inventory.push(...items);
  state.daily_records = quota.records;
  const taken = new Set(ids); state.pending_rewards = state.pending_rewards.filter(c => !taken.has(c.claim_id)).map(c => c.daily_attempt && quota.charged.has(dailyAttemptKey(c.daily_attempt)) ? { ...c, daily_attempt: { ...c.daily_attempt, charged: true } } : c);
  if (selected.some(c => c.kind === 'farm')) state.daily_objectives.farm_claimed = true;
}
