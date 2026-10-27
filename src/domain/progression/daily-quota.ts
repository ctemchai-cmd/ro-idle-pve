import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { ProgressionRejection } from './rejection.ts';

type Claim = AccountState['pending_rewards'][number];
export const dailyAttemptKey = (attempt: NonNullable<Claim['daily_attempt']>) => `${attempt.boss_id}:${attempt.ticket_day}:${attempt.battle_id}`;

export function validateDailyQuota(state: AccountState): void {
  const seen = new Map<string, boolean>();
  for (const claim of state.pending_rewards) {
    const a = claim.daily_attempt; if (!a) continue;
    const key = dailyAttemptKey(a);
    if (claim.kind !== 'daily' || !claim.source_keys.includes(`battle:${a.battle_id}`) || !claim.source_keys.some(s => s.startsWith(`daily:${a.boss_id}:${a.ticket_day}:`)) || seen.has(key) && seen.get(key) !== a.charged) throw new Error('INVALID_DAILY_QUOTA_REFERENCE');
    seen.set(key, a.charged);
  }
}

/** Pending rewards survive reload; do not start another unpaid run of this boss/day. */
export function unpaidDailyClaims(state: AccountState, boss: string, day: string): Claim[] {
  return state.pending_rewards.filter(c => c.kind === 'daily' && c.daily_attempt?.boss_id === boss && c.daily_attempt.ticket_day === day && !c.daily_attempt.charged);
}

/** A plan only: apply counters after the entire reward batch passes preflight. */
export function dailyQuotaClaimPlan(state: AccountState, selected: readonly Claim[], content: ValidatedContent) {
  const records = structuredClone(state.daily_records), charged = new Set<string>();
  const bosses = (content.documents['daily-bosses.json'] as unknown as { bosses: { id: string; attempts_per_day: number }[] }).bosses;
  for (const claim of selected) {
    const a = claim.daily_attempt;
    if (!a || a.charged || charged.has(dailyAttemptKey(a))) continue;
    if (claim.kind !== 'daily') throw new ProgressionRejection('DAILY_CLAIM_INVALID');
    const record = records.find(r => r.boss_id === a.boss_id && r.ticket_day === a.ticket_day), boss = bosses.find(b => b.id === a.boss_id);
    if (!boss || !record && a.ticket_day >= state.daily_objectives.day) throw new ProgressionRejection('DAILY_RECORD_MISSING');
    if (record) {
      if (record.attempts_used >= boss!.attempts_per_day) throw new ProgressionRejection('DAILY_NO_ATTEMPTS');
      record.attempts_used++;
    }
    charged.add(dailyAttemptKey(a));
  }
  return { records, charged };
}
