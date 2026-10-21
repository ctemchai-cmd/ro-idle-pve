import type { AccountState, BattleActor, CombatStats, StatBlueprint } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { castDurationMs, skillIntervalMs } from '../math/index.ts';
import { previewCharacterStats } from './character.ts';
type Character = AccountState['roster'][number];

export interface CatalogQueueStart { skill_id: string; start_ms: number; resolve_ms: number; acd_end_ms: number }
export interface CatalogQueueTrace { stats: CombatStats; si_ms: number; cycle_ms: number; starts: CatalogQueueStart[]; fixed_sp_per_cycle: number }
/**
 * Dry ("catalog") timing of one rotation for a compiled build: permanent stats and learned Passives only.
 * Temporary buffs, SP shortfalls, CC and procs are deliberately absent; actual fights always use the engine.
 */
export function catalogQueueTrace(actor: Character, skills: Pick<BattleActor, 'active_slots' | 'resolved_skills'>, content: ValidatedContent, permanent: StatBlueprint['permanent_sources'] = [], skillIntervalBaseMs = 1500): CatalogQueueTrace {
  const stats = previewCharacterStats(actor, skills.resolved_skills, content, permanent), si = skillIntervalMs(stats.attack_speed, skillIntervalBaseMs);
  const starts: CatalogQueueStart[] = []; let at = 0, sp = 0;
  for (const id of skills.active_slots) {
    if (!id) continue;
    const skill = skills.resolved_skills[id]?.definition;
    if (skill?.kind !== 'active') throw new TypeError('UNUSABLE_SKILL_REFERENCE');
    const ct = castDurationMs(Number(skill.timing.cast_ms), stats.cast_speed), acd = castDurationMs(Number(skill.timing.after_cast_ms), stats.cast_speed);
    at += si; starts.push({ skill_id: id, start_ms: at, resolve_ms: at + ct, acd_end_ms: at + ct + acd }); at += ct + acd;
    if (typeof skill.cost.sp === 'number') sp += skill.cost.sp;
  }
  return { stats, si_ms: si, cycle_ms: at, starts, fixed_sp_per_cycle: sp };
}
