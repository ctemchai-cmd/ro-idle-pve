import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { ProgressionRejection } from './rejection.ts';

/** Validate the whole selection before applying a single, fixed reward batch. */
export function claimRewards(state: AccountState, ids: readonly string[], content: ValidatedContent): void {
  const reject = (code: string): never => { throw new ProgressionRejection(code); };
  if (!ids.length || ids.length > 32 || new Set(ids).size !== ids.length) reject('INVALID_CLAIM_SELECTION');
  const selected = ids.map(id => state.pending_rewards.find(c => c.claim_id === id) ?? reject('CLAIM_NOT_FOUND'));
  const items = selected.flatMap(c => c.items), known = new Set(state.inventory.map(i => i.instance_id));
  if (state.inventory.length + items.length > Number(content.documents['equipment.json']!.inventory_capacity)) reject('INVENTORY_FULL');
  for (const item of items) { if (known.has(item.instance_id)) reject('DUPLICATE_REWARD_INSTANCE'); known.add(item.instance_id); }
  const wallet = { ...state.wallet };
  for (const claim of selected) for (const key of Object.keys(wallet) as (keyof typeof wallet)[]) {
    const total = wallet[key] + claim.resource_vector[key];
    if (!Number.isSafeInteger(total)) reject('RESOURCE_OVERFLOW');
    wallet[key] = total;
  }
  state.wallet = wallet; state.inventory.push(...items);
  const taken = new Set(ids); state.pending_rewards = state.pending_rewards.filter(c => !taken.has(c.claim_id));
  if (selected.some(c => c.kind === 'farm')) state.daily_objectives.farm_claimed = true;
}
