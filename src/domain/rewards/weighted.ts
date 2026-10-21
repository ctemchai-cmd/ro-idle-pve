/** Pure weighted choice with an injected uniform roll. Array order is explicit and stable across JSONB. */
export function weightedChoice<T extends string>(ids: readonly T[], weights: Readonly<Record<string, number>>, roll: number): T {
  if (!(roll >= 0 && roll < 1) || !ids.length) throw new RangeError('INVALID_WEIGHTED_ROLL');
  const total = ids.reduce((sum, id) => sum + (weights[id] ?? 0), 0);
  if (!(total > 0) || !Number.isSafeInteger(total)) throw new RangeError('INVALID_WEIGHT_TOTAL');
  let target = roll * total;
  for (const id of ids) { target -= weights[id] ?? 0; if (target < 0) return id; }
  return ids[ids.length - 1]!;
}
