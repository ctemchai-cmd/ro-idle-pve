/** Display speed only; terminal server replay and historical tickets retain their protocol. */
export type BattleSpeed = 1 | 2 | 3;
export const BATTLE_SPEEDS = [1, 2, 3] as const;
const KEY = 'ro.battleSpeed', listeners = new Set<() => void>();
/** Preserve the old preference at the closest available speed. */
export function normalizeBattleSpeed(value: number): BattleSpeed { return value === 2 ? 2 : value === 3 || value === 4 ? 3 : 1; }
export function nextBattleSpeed(value: BattleSpeed): BattleSpeed { return value === 1 ? 2 : value === 2 ? 3 : 1; }
function stored(): BattleSpeed {
  try {
    const value = Number(localStorage.getItem(KEY)), speed = normalizeBattleSpeed(value);
    if (value === 4) try { localStorage.setItem(KEY, '3'); } catch { /* Keep 3× for this tab if storage is read-only. */ }
    return speed;
  } catch { return 1; }
}
let current: BattleSpeed = stored();
export function battleSpeed(): BattleSpeed { return current; }
export function cycleBattleSpeed(): BattleSpeed {
  current = nextBattleSpeed(current);
  try { localStorage.setItem(KEY, String(current)); } catch { /* private mode: keep it for this tab only */ }
  for (const listener of listeners) listener();
  return current;
}
export function subscribeBattleSpeed(listener: () => void): () => void { listeners.add(listener); return () => { listeners.delete(listener); }; }
