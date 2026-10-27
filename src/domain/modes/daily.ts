import type { AccountState, BattleCheckpoint, CombatStats } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import type { ModeRespawn, PureModePolicy } from '../combat/index.ts';
import { storyStages, storyReleaseLock, type StoryStage } from './story.ts';

type Boss = StoryStage['encounter'][number];
type Wallet = AccountState['wallet'];
export type DailyBossId = AccountState['daily_records'][number]['boss_id'];
export type DailyRecord = AccountState['daily_records'][number];
interface Growth { base: number; per_phase_after_first: number; per_unlocked_chapter_after_two_multiplier?: number }
export interface DailyBoss { id: DailyBossId; enemy_definition_id: string; attempts_per_day: number; time_limit_ms: number; phase_hp: Growth; phase_attack: Growth; phase_defense: Growth; active_slots: Boss['active_slots']; reward_per_chest_base: Partial<Wallet>; awakening_reward?:{minimum_chapter:number;amount:number} }
interface DailyData { unlocks_after: string; bosses: DailyBoss[]; common_base: Pick<CombatStats, 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk' | 'attack_speed' | 'cast_speed' | 'max_sp'>; element: string; position: string }
export const dailyData = (content: ValidatedContent) => content.documents['daily-bosses.json'] as unknown as DailyData;
export function dailyBoss(id: string, content: ValidatedContent): DailyBoss { const boss = dailyData(content).bosses.find(row => row.id === id); if (!boss) throw new Error('DAILY_BOSS_UNKNOWN'); return boss; }

/** Ticket day is the server's Asia/Bangkok calendar date (UTC+7, no DST); the client clock never decides it. */
export function bangkokDay(ms: number): string {
  // Pure civil-from-days (Hinnant) so rules never touch the Date global.
  const days = Math.floor((ms + 7 * 3600 * 1000) / 86400000), z = days + 719468, era = Math.floor(z / 146097), doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365), doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100)), mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1, month = mp < 10 ? mp + 3 : mp - 9, year = yoe + era * 400 + (month <= 2 ? 1 : 0);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
export function dailyUnlocked(state: AccountState, content: ValidatedContent) { return state.story.cleared_stage_ids.includes(dailyData(content).unlocks_after); }
/** Highest chapter whose final stage is cleared, at least 2 (design 19). */
export function highestClearedChapter(state: AccountState, content: ValidatedContent) {
  const stages = storyStages(content).filter(stage=>!storyReleaseLock(stage,content)); let best = 2;
  for (const chapter of new Set(stages.map(stage => stage.chapter))) { const last = stages.filter(stage => stage.chapter === chapter).at(-1)!; if (state.story.cleared_stage_ids.includes(last.id)) best = Math.max(best, chapter); }
  return best;
}
export function dailyPhaseStats(boss: DailyBoss, phase: number, chapter: number) {
  const step = phase - 1, hp = Math.floor((boss.phase_hp.base + boss.phase_hp.per_phase_after_first * step) * (1 + (boss.phase_hp.per_unlocked_chapter_after_two_multiplier ?? 0) * (chapter - 2)));
  const values = { hp, attack: boss.phase_attack.base + boss.phase_attack.per_phase_after_first * step, defense: boss.phase_defense.base + boss.phase_defense.per_phase_after_first * step, level: Math.min(70, 10 + 8 * chapter) };
  if (!Object.values(values).every(value => Number.isSafeInteger(value) && value >= 1)) throw new RangeError('DAILY_PHASE_OVERFLOW');
  return values;
}
export function dailyBossActor(id: DailyBossId, phase: number, chapter: number, content: ValidatedContent): Boss {
  const data = dailyData(content), boss = dailyBoss(id, content), stats = dailyPhaseStats(boss, phase, chapter);
  const resolved_base = { ...data.common_base, physical_attack: stats.attack, magical_attack: stats.attack, max_hp: stats.hp, physical_defense: stats.defense, magical_defense: stats.defense } as CombatStats;
  return { actor_id: 'enemy_front', definition_id: boss.enemy_definition_id, level: stats.level, position: data.position, element: data.element, resolved_base, active_slots: structuredClone(boss.active_slots), passives: [] };
}
/** One chest per (boss, ticket day, phase): base × (1 + 0.2 (phase − 1)), floored per currency. */
export function dailyChest(boss: DailyBoss, phase: number, chapter = 0): Partial<Wallet> {
  const base={...boss.reward_per_chest_base};
  if(boss.awakening_reward&&chapter>=boss.awakening_reward.minimum_chapter)base.awakening_shard=boss.awakening_reward.amount;
  return Object.fromEntries(Object.entries(base).map(([key, amount]) => [key, Math.floor(Number(amount) * (1 + .2 * (phase - 1)))]));
}
/** The day's record for a boss; a fresh day starts at phase 1, zero attempts and a chapter snapshot taken now. */
export function dailyRecord(state: AccountState, id: DailyBossId, day: string, content: ValidatedContent): DailyRecord {
  const found = state.daily_records.find(row => row.boss_id === id && row.ticket_day === day);
  if (found) return found;
  const chapter = highestClearedChapter(state, content);
  return { boss_id: id, ticket_day: day, attempts_used: 0, quota_policy: 'reward_claim_v1', phase: 1, current_hp: dailyPhaseStats(dailyBoss(id, content), 1, chapter).hp, rewarded_phases: [], chapter_snapshot: chapter };
}
export const dailyRef = (id: DailyBossId, chapter: number) => `${id}@${chapter}`;
export function parseDailyRef(ref: string) { const [id, chapter] = ref.split('@'); return { id: id as DailyBossId, chapter: Number(chapter) }; }

/** Phase continuation: when a phase's HP bar empties the same boss returns with the next phase's full HP; the cleared phase is reserved for a chest. */
export function dailyPolicy(content: ValidatedContent): PureModePolicy {
  return { onEnemyWipe(state: BattleCheckpoint): ModeRespawn | 'victory' {
    if (state.mode.kind !== 'daily' || state.mode.daily_phase === null) return 'victory';
    const { id, chapter } = parseDailyRef(state.mode.ref), cleared = state.mode.daily_phase, next = cleared + 1, actor = dailyBossActor(id, next, chapter, content);
    return { actor_id: actor.actor_id, level: actor.level, resolved_base: actor.resolved_base, element: actor.element, mode: { daily_phase: next, daily_current_hp: actor.resolved_base.max_hp, reserved_phase_keys: [...state.mode.reserved_phase_keys, String(cleared)] } };
  } };
}
/** Every advance of a checkpoint (server, client prediction, runner, timeline) uses the policy of its mode. */
export function modePolicy(mode: Pick<BattleCheckpoint['mode'], 'kind'>, content: ValidatedContent): PureModePolicy { return mode.kind === 'daily' ? dailyPolicy(content) : {}; }
