import type { AccountState } from '../../contracts/index.ts';
import { bangkokDay } from '../modes/daily.ts';

export interface DailyQuotaMigrationContext { account_id: string; now_ms: number }
/** Optional server-only context narrows the explicitly requested incident refund. */
export function migrateDailyQuota(state: AccountState, changes: string[], context?: DailyQuotaMigrationContext): void {
  const active = state.active_battle;
  const main = state.roster.find(a => a.kind === 'main');
  const incident = context?.account_id === 'c37edad4-ec3c-4541-8cba-194bd21e285c'
    && bangkokDay(context.now_ms) === '2026-10-28' && main?.job_id === 'champion' && main.level === 100;
  for (const row of state.daily_records) {
    if (row.quota_policy === 'reward_claim_v1') continue;
    if (incident && row.ticket_day === '2026-10-28') {
      changes.push(`daily ${row.boss_id}: authorized slot1 Champion100 quota returned (${row.attempts_used})`);
      row.attempts_used = 0;
    } else if (active?.mode === 'daily' && active.mode_ref === row.boss_id && active.ticket_day === row.ticket_day && row.attempts_used > 0) {
      row.attempts_used--;
      changes.push(`daily ${row.boss_id}: unused legacy entry reservation returned`);
    }
    row.quota_policy = 'reward_claim_v1';
  }
}
