import {mergeEventRights} from '../progression/events.ts';
import type { AccountState } from '../../contracts/index.ts';

/**
 * TASK-040 server-side guards for maintenance writes (D-064). Restoring or resetting
 * never moves real-time cursors backwards: the AFK cursor and per-day counters
 * (daily attempts/chests, shop limits, daily objectives) keep the furthest value,
 * so nothing can be earned twice by rewinding a save. Wallet/inventory are never
 * merged: the chosen state wins as a whole.
 */
type Daily = AccountState['daily_records'][number];
function mergeDaily(a: Daily, b: Daily): Daily {
  const phases = [...new Set([...a.rewarded_phases, ...b.rewarded_phases])].sort((x, y) => x - y);
  const lead = a.phase !== b.phase ? (a.phase > b.phase ? a : b) : a.current_hp <= b.current_hp ? a : b;
  return { ...lead, attempts_used: Math.max(a.attempts_used, b.attempts_used), rewarded_phases: phases };
}
/** Per-day records of `kept` plus anything `other` already spent the same day; rows older than yesterday are dropped. */
function mergeDayCounters(kept: AccountState, other: AccountState, today: string, yesterday: string): void {
  mergeEventRights(kept,other);
  if(other.mvp_hunt){if(!kept.mvp_hunt||kept.mvp_hunt.week<other.mvp_hunt.week)kept.mvp_hunt=structuredClone(other.mvp_hunt);else if(kept.mvp_hunt.week===other.mvp_hunt.week)for(const[id,tier]of Object.entries(other.mvp_hunt.best))kept.mvp_hunt.best[id]=Math.max(kept.mvp_hunt.best[id]??0,tier);}
  const key = (row: Daily) => `${row.boss_id}@${row.ticket_day}`, rows = new Map<string, Daily>();
  for (const row of [...kept.daily_records, ...other.daily_records]) { if (row.ticket_day < yesterday) continue; const prior = rows.get(key(row)); rows.set(key(row), prior ? mergeDaily(prior, row) : structuredClone(row)); }
  kept.daily_records = [...rows.values()].sort((x, y) => (x.ticket_day + x.boss_id < y.ticket_day + y.boss_id ? -1 : 1)) as AccountState['daily_records'];
  if (other.shop.day === today) {
    if (kept.shop.day !== today) kept.shop = { day: today, purchases: {} };
    for (const [offer, count] of Object.entries(other.shop.purchases)) kept.shop.purchases[offer] = Math.max(kept.shop.purchases[offer] ?? 0, count);
  }
  if (other.daily_objectives.day === today) {
    if (kept.daily_objectives.day !== today) kept.daily_objectives = { day: today, farm_claimed: false, battle_finished: false, claimed: false };
    for (const flag of ['farm_claimed', 'battle_finished', 'claimed'] as const) kept.daily_objectives[flag] ||= other.daily_objectives[flag];
  }
}
/** Undo-reset / quarantine restore: the restored state wins, but cursors only move forward. */
export function guardRestore(restored: AccountState, current: AccountState | null, today: string, yesterday: string): AccountState {
  const next = structuredClone(restored); next.active_battle = null;
  if (!current) return next;
  // Both cursors are server-written ISO-8601 UTC strings (toISOString), so text order is time order.
  if (current.farm.reserved_through > next.farm.reserved_through) next.farm.reserved_through = current.farm.reserved_through;
  mergeDayCounters(next, current, today, yesterday);
  return next;
}
/** New game resets daily dungeons too (D-085); shop/objective limits still survive. Restore remains guarded separately. */
export function resetAccount(current: AccountState, fresh: AccountState, today: string, yesterday: string): AccountState {
  const next = structuredClone(fresh);
  mergeDayCounters(next, current, today, yesterday);
  next.daily_records = [];
  return next;
}
/** Backup file/summary helpers are shared with the client through the build module; the API reaches them here. */
export { backupFile, saveSummary } from '../build/save-summary.ts';
