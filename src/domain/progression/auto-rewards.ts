import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { claimRewards } from './claim-rewards.ts';
import { ProgressionRejection } from './rejection.ts';

/** Fixed, already reserved progress rewards only; never creates/rolls AFK income. */
export function progressRewards(state: AccountState) {
  return state.pending_rewards.filter(c => c.kind === 'story' || c.kind === 'tower' || c.kind === 'farm');
}
/** Same claim authority/receipt as a manual collection. A full bag must not undo a victory. */
export function collectProgressRewards(state: AccountState, content: ValidatedContent): void {
  for (const claim of progressRewards(state)) {
    try { claimRewards(state, [claim.claim_id], content); }
    catch (error) {
      if (!(error instanceof ProgressionRejection) || !['INVENTORY_FULL', 'RESOURCE_OVERFLOW'].includes(error.message)) throw error;
      // Keep the complete immutable claim/RNG payload for collection after the blocker is removed.
    }
  }
}
