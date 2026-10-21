/** Serializable shared RNG for combat, loot and headless scenarios. */
export interface RngState { state: number; draw_count: number }
export function nextRandom(rng: RngState): number {
  rng.state = (Math.imul(1664525, rng.state) + 1013904223) >>> 0;
  rng.draw_count++;
  if (!Number.isSafeInteger(rng.draw_count)) throw new RangeError('RNG_DRAW_COUNT_OVERFLOW');
  return rng.state / 4294967296;
}
