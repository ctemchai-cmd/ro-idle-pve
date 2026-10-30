import type { AccountState } from '../contracts/index.ts';
import { storyOptions, towerView } from './story.ts';
import { progressRewards } from '../domain/progression/auto-rewards.ts';
import { loadValidatedContent } from './content.ts';

export type ChallengeTarget = { kind: 'story'; id: string } | { kind: 'tower'; floor: number } | { kind: 'daily'; boss: string } | {kind:'mvp';boss:string;tier:number};
export type AutoMode = 'story' | 'tower';
export interface AutoRun { mode: AutoMode; failures: number; lastBattleId: string | null }
export const AUTO_LOSS_LIMIT = 3;
export const newAutoRun = (mode: AutoMode): AutoRun => ({ mode, failures: 0, lastBattleId: null });
/** Pure receipt transition. Render frames, battle speed and duplicate receipts cannot alter the retry budget. */
export function continueAuto(run: AutoRun, outcome: { id: string; kind: string; code: string; stage: string }, next: ChallengeTarget | null): { run: AutoRun | null; target: ChallengeTarget | null; reason?: 'loss_limit' | 'complete' | 'mode_changed' } {
  if (run.lastBattleId === outcome.id) return { run, target: null };
  if (outcome.kind !== run.mode) return { run: null, target: null, reason: 'mode_changed' };
  const updated = { ...run, lastBattleId: outcome.id };
  if (outcome.code === `${run.mode.toUpperCase()}_WON`) return next ? { run: { ...updated, failures: 0 }, target: next } : { run: null, target: null, reason: 'complete' };
  if (![`${run.mode.toUpperCase()}_DEFEATED`, `${run.mode.toUpperCase()}_TIME_LIMIT`].includes(outcome.code)) return { run: null, target: null, reason: 'mode_changed' };
  updated.failures++;
  if (updated.failures >= AUTO_LOSS_LIMIT) return { run: null, target: null, reason: 'loss_limit' };
  return { run: updated, target: run.mode === 'tower' ? { kind: 'tower', floor: Number(outcome.stage) } : { kind: 'story', id: outcome.stage } };
}
export function nextAutoTarget(state: AccountState, mode: AutoMode): ChallengeTarget | null {
  if (mode === 'tower') { const view = towerView(state, state.tower.highest_cleared_floor + 1, 1); return view.unlocked ? { kind: 'tower', floor: state.tower.highest_cleared_floor + 1 } : null; }
  const next = storyOptions(state).find(s => s.available && !s.cleared); return next ? { kind: 'story', id: next.id } : null;
}
const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT_UNAVAILABLE');
const capacity = Number(loaded.value.documents['equipment.json']!.inventory_capacity);
/** Already-fixed rewards only. No farm time reservation or random rolls from the UI. */
export function pendingProgressCollection(state: AccountState) {
  let room = capacity - state.inventory.length; const wallet = { ...state.wallet };
  return progressRewards(state).filter(c => {
    if (c.items.length > room || !Object.entries(c.resource_vector).every(([key, value]) => Number.isSafeInteger(wallet[key as keyof typeof wallet] + value))) return false;
    room -= c.items.length; for (const key of Object.keys(wallet) as (keyof typeof wallet)[]) wallet[key] += c.resource_vector[key]; return true;
  }).map(c => c.claim_id);
}
export const hasPendingProgressRewards = (state: AccountState) => progressRewards(state).length > 0;
