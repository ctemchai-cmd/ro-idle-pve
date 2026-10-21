/** Batch ordinary animation frames, but always flush the final partial interval at the battle deadline. */
export function shouldAdvanceBattleFrame(currentMs: number, targetMs: number, limitMs: number): boolean {
  return targetMs > currentMs && (targetMs - currentMs >= 50 || targetMs >= limitMs);
}
