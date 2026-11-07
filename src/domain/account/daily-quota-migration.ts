import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { bangkokDay, dailyRecord } from '../modes/daily.ts';

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

/** User-authorized one-time reset. No inventory/rewards/phase changes or other save slots. */
export function resetRequestedCreatorQuota(state:AccountState,changes:string[],content:ValidatedContent,context?:DailyQuotaMigrationContext){
  const day='2026-11-07',marker='creator_slot6_20261107' as const;
  if(context?.account_id!=='ac4dc393-b624-abaf-1362-056b8e1ce3d0'||bangkokDay(context.now_ms)!==day||state.roster.find(a=>a.kind==='main')?.job_id!=='creator')return;
  for(const id of ['treasury','forge','essence']as const){
    let row=state.daily_records.find(r=>r.boss_id===id&&r.ticket_day===day);
    if(row?.quota_reset_id===marker)continue;
    if(!row){row=dailyRecord(state,id,day,content);state.daily_records=[...state.daily_records.filter(r=>r.boss_id!==id),row] as AccountState['daily_records'];}
    changes.push(`daily ${id}: authorized slot6 Creator quota returned (${row.attempts_used})`);
    row.attempts_used=0;row.quota_reset_id=marker;
  }
}
