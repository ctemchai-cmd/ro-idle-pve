import { loadValidatedContent } from '../content/index.ts';
import type { AccountState, SkillDefinition } from '../contracts/index.ts';
import { effectiveLevelCap, levelQuote, progressionData } from '../domain/progression/characters.ts';
import { allowedSkill, characterSkillCap } from '../domain/progression/skills.ts';
import { storyStages, canChallenge } from '../domain/modes/story.ts';
import { towerUnlocked } from '../domain/modes/tower.ts';
import { dailyUnlocked } from '../domain/modes/daily.ts';
const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT_UNAVAILABLE');
const content = loaded.value, data = progressionData(content);
type View = 'home' | 'buddy' | 'stats' | 'skills' | 'tower' | 'daily' | 'store' | 'backpack';
export interface Guide { id: string; text: string; view: View | 'stage' | 'farm'; character?: string }
const canPay = (wallet: AccountState['wallet'], cost: Partial<AccountState['wallet']>) => Object.entries(cost).every(([k, n]) => wallet[k as keyof AccountState['wallet']] >= (n ?? 0));

/** TASK-039 first-play guide: the single most useful next step derived from the real save (no scripted state). */
export function nextGuide(state: AccountState, seen: ReadonlySet<string> = new Set()): Guide | null {
  const team = state.team.map(p => state.roster.find(a => a.character_id === p.character_id)!), stages = storyStages(content);
  const firstOpen = stages.find(s => canChallenge(s, state) && !state.story.cleared_stage_ids.includes(s.id));
  const steps: Guide[] = [];
  if (!state.story.cleared_stage_ids.length && firstOpen) steps.push({ id: 'first_boss', text: `แตะ "ท้าบอส" เพื่อสู้บอสด่าน ${firstOpen.id}`, view: 'stage' });
  if (state.pending_rewards.length) steps.push({ id: 'claim', text: `มีรางวัลรอรับ ${state.pending_rewards.length} รายการ · แตะหีบ AFK`, view: 'farm' });
  const points = team.find(a => a.unspent_status_points >= 5);
  if (points) steps.push({ id: `status_${points.character_id}`, text: 'มีแต้ม Status ว่าง · ไปหน้า Stats เพื่อลงแต้ม', view: 'stats', character: points.character_id });
  const levelable = team.find(a => a.level < effectiveLevelCap(a, data) && canPay(state.wallet, levelQuote(a, a.level + 1, data)));
  if (levelable) steps.push({ id: `level_${levelable.character_id}`, text: 'ทองพอสำหรับอัปเลเวล · ตัวละคร › Upgrade', view: 'buddy', character: levelable.character_id });
  const unarmed = team.find(a => !a.equipment.weapon);
  if (unarmed && state.wallet.gold >= 125) steps.push({ id: `weapon_${unarmed.character_id}`, text: 'ยังไม่มีอาวุธ · แตะช่องอาวุธเพื่อซื้ออาวุธฝึกหัด', view: 'buddy', character: unarmed.character_id });
  const learner = team.find(a => Object.values(content.skills).some(row => { const s = row as unknown as SkillDefinition; return allowedSkill(a, s) && a.level >= s.unlock_level && !a.skill_levels[s.id] && characterSkillCap(a, s) >= 1; }));
  if (learner) steps.push({ id: `skill_${learner.character_id}`, text: 'มีสกิลใหม่ให้เรียนฟรี · ไปหน้า Skill', view: 'skills', character: learner.character_id });
  if (dailyUnlocked(state, content) && !state.daily_records.length) steps.push({ id: 'daily_open', text: 'ดันเจี้ยนรายวันเปิดแล้ว · ท้าบอสรับกล่องรางวัล', view: 'daily' });
  if (towerUnlocked(state, content) && state.tower.highest_cleared_floor === 0) steps.push({ id: 'tower_open', text: 'หอคอยเปิดแล้ว · ไต่ชั้นรับ Crystal', view: 'tower' });
  if (state.wallet.crystal >= 100 && state.story.cleared_stage_ids.length >= 5) steps.push({ id: 'store_crystal', text: 'Crystal พอสุ่มการ์ดแล้ว · ไปที่ร้านค้า', view: 'store' });
  return steps.find(step => !seen.has(step.id)) ?? null;
}
