import type { AccountState } from '../contracts/index.ts';

type Wallet = AccountState['wallet'];
export interface RewardCurve { base: number; linear: number; quadratic?: number; cubic?: number; divisor?: number }
type Curves = Partial<Record<keyof Wallet, RewardCurve>>;
export interface TowerRewardSchedule {
  base: Curves;
  rotation: Curves[];
  milestones: { every: number; resources: Curves; card_count: number }[];
}
const resources = ['gold', 'hero_exp', 'skill_manual', 'refine_ore', 'breakthrough_essence', 'enchant_dust', 'card_dust', 'crystal', 'awakening_shard'];
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const invalid = () => { throw new RangeError('INVALID_TOWER_REWARD_SCHEDULE'); };

/** Validate authored configuration once at the content boundary; never accept arbitrary wallet keys. */
export function validateTowerRewardSchedule(value: unknown): asserts value is TowerRewardSchedule {
  const curves = (v: unknown) => {
    if (!record(v)) return invalid();
    for (const [key, p] of Object.entries(v)) {
      if (!resources.includes(key) || !record(p) || !integer(p.base) || !integer(p.linear)) return invalid();
      for (const [k, n] of Object.entries(p)) if (!['base', 'linear', 'quadratic', 'cubic', 'divisor'].includes(k) || !integer(n) || (k === 'divisor' && n === 0)) return invalid();
    }
  };
  if (!record(value) || Object.keys(value).some(k => !['base', 'rotation', 'milestones'].includes(k))) return invalid();
  curves(value.base);
  if (!Array.isArray(value.rotation) || !value.rotation.length || !Array.isArray(value.milestones)) return invalid();
  value.rotation.forEach(curves);
  for (const m of value.milestones) {
    if (!record(m) || Object.keys(m).some(k => !['every', 'resources', 'card_count'].includes(k)) || !integer(m.every) || !m.every || !integer(m.card_count)) return invalid();
    curves(m.resources);
  }
}

const safe = (n: number) => { if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('TOWER_FLOOR_OVERFLOW'); return n; };
/** Add matching milestones, never multiply reward bundles. Identical inputs work in UI, server and headless. */
export function scheduledTowerRewards(floor: number, schedule: TowerRewardSchedule): { resources: Partial<Wallet>; card_count: number } {
  if (!Number.isSafeInteger(floor) || floor < 1) throw new RangeError('INVALID_TOWER_FLOOR');
  const result: Partial<Wallet> = {};
  const add = (curves: Curves) => {
    for (const [key, p] of Object.entries(curves) as [keyof Wallet, RewardCurve][]) {
      const numerator = safe(p.base + p.linear * floor + (p.quadratic ?? 0) * floor ** 2 + (p.cubic ?? 0) * floor ** 3);
      const amount = safe(Math.ceil(numerator / (p.divisor ?? 1)));
      result[key] = safe((result[key] ?? 0) + amount);
    }
  };
  add(schedule.base); add(schedule.rotation[(floor - 1) % schedule.rotation.length]!);
  let cards = 0;
  for (const m of schedule.milestones) if (floor % m.every === 0) { add(m.resources); cards = safe(cards + m.card_count); }
  return { resources: result, card_count: cards };
}
