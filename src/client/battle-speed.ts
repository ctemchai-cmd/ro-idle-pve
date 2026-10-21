/** Player battle fast-forward (D-071): 1×/2×/4×, remembered per browser. The server credits wall time × speed. */
export type BattleSpeed = 1 | 2 | 4;
const KEY = 'ro.battleSpeed', listeners = new Set<() => void>();
function stored(): BattleSpeed { try { const value = Number(localStorage.getItem(KEY)); return value === 2 || value === 4 ? value : 1; } catch { return 1; } }
let current: BattleSpeed = stored();
export function battleSpeed(): BattleSpeed { return current; }
export function cycleBattleSpeed(): BattleSpeed {
  current = current === 1 ? 2 : current === 2 ? 4 : 1;
  try { localStorage.setItem(KEY, String(current)); } catch { /* private mode: keep it for this tab only */ }
  for (const listener of listeners) listener();
  return current;
}
export function subscribeBattleSpeed(listener: () => void): () => void { listeners.add(listener); return () => { listeners.delete(listener); }; }
