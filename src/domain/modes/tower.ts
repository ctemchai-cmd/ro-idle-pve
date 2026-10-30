import type { AccountState, CombatStats } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import type { StoryStage } from './story.ts';
import { scheduledTowerRewards, type TowerRewardSchedule } from '../../content/tower-rewards.ts';

type Boss = StoryStage['encounter'][number];
export interface TowerRow { floor: number; hp: number; attack: number; defense: number; definition_id: string; gold: number; crystal: number; bronze_card_count: number; reward_resources?: Partial<AccountState['wallet']> }
interface Polynomial { base: number; linear: number; quadratic?: number; cubic?: number; divisor?: number }
interface TowerData {
  unlocks_after: string; authored_initial_rows: number; time_limit_ms: number; resets: boolean; first_clear_only: boolean; element: string; position: string;
  common_base: Pick<CombatStats, 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk' | 'attack_speed' | 'cast_speed' | 'max_sp'>;
  generator: { hp: Polynomial; attack: Polynomial; defense: Polynomial; template_cycle: string[]; skill_cycle: string[][]; adaptive_cc_every: number; reward_gold: Polynomial; crystal_every: number; crystal_amount: number; bronze_card_every: number };
  floor_rows: TowerRow[];
  late_difficulty?:{start_floor:number;full_floor:number;attack_bonus:number;hp_bonus:number};
  reward_schedule?: TowerRewardSchedule;
}
export const towerData = (content: ValidatedContent) => content.documents['tower.json'] as unknown as TowerData;
const safe = (value: number) => { if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('TOWER_FLOOR_OVERFLOW'); return value; };

/** Authored rows 1-100 and later floors share the same polynomial; no gameplay cap at 100. */
export function towerRow(floor: number, content: ValidatedContent): TowerRow {
  if (!Number.isSafeInteger(floor) || floor < 1) throw new RangeError('INVALID_TOWER_FLOOR');
  const g = towerData(content).generator, curve = (row: Polynomial) => {
    const divisor = row.divisor ?? 1;
    if (!Number.isSafeInteger(divisor) || divisor < 1) throw new RangeError('INVALID_TOWER_CURVE');
    const numerator = safe(row.base + row.linear * floor + (row.quadratic ?? 0) * floor * floor + (row.cubic ?? 0) * floor * floor * floor);
    return safe(Math.ceil(numerator / divisor));
  };
  const row = { floor, hp: curve(g.hp), attack: curve(g.attack), defense: curve(g.defense), definition_id: g.template_cycle[(floor - 1) % g.template_cycle.length]!,
    gold: curve(g.reward_gold), crystal: floor % g.crystal_every === 0 ? g.crystal_amount : 0, bronze_card_count: floor % g.bronze_card_every === 0 ? 1 : 0 };
  const late=towerData(content).late_difficulty;if(late){const t=Math.max(0,Math.min(1,(floor-late.start_floor)/(late.full_floor-late.start_floor)));row.hp=Math.ceil(row.hp*(1+late.hp_bonus*t));row.attack=Math.ceil(row.attack*(1+late.attack_bonus*t));}
  const schedule = towerData(content).reward_schedule;
  if (!schedule) return row; // Frozen legacy content/receipts retain the original schedule.
  const reward = scheduledTowerRewards(floor, schedule);
  return { ...row, gold: reward.resources.gold ?? 0, crystal: reward.resources.crystal ?? 0, bronze_card_count: reward.card_count, reward_resources: reward.resources };
}
export function towerUnlocked(state: AccountState, content: ValidatedContent) { return state.story.cleared_stage_ids.includes(towerData(content).unlocks_after); }
/** A floor can be fought once its predecessor is cleared; cleared floors may be replayed without rewards. */
export function towerCanChallenge(floor: number, state: AccountState, content: ValidatedContent) { return towerUnlocked(state, content) && Number.isSafeInteger(floor) && floor >= 1 && floor <= state.tower.highest_cleared_floor + 1; }
export function towerBoss(floor: number, content: ValidatedContent): Boss {
  const data = towerData(content), row = towerRow(floor, content), skills = data.generator.skill_cycle[(floor - 1) % data.generator.skill_cycle.length]!;
  const resolved_base = { ...data.common_base, physical_attack: row.attack, magical_attack: row.attack, max_hp: row.hp, physical_defense: row.defense, magical_defense: row.defense } as Boss['resolved_base'];
  return { actor_id: 'enemy_front', definition_id: row.definition_id, level: Math.min(70, floor) /* checkpoint level cap; stats come from the generator */, position: data.position, element: data.element, resolved_base,
    active_slots: [skills[0] ?? null, skills[1] ?? null, skills[2] ?? null, skills[3] ?? null], passives: floor % data.generator.adaptive_cc_every === 0 ? ['enemy_adaptive_cc'] : [] } as Boss;
}
export function towerStageRef(floor: number, content: ValidatedContent) { return { id: String(floor), time_limit_ms: towerData(content).time_limit_ms }; }
