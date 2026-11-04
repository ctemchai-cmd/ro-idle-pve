import type { CombatStats } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';

interface BossProfile { attack_multiplier: number; defense_elements: Record<string, string>; story_identities?: Record<string, string> }
export const bossProfile = (content: ValidatedContent) => content.documents['enemies.json']!.boss_combat as unknown as BossProfile | undefined;
/** Gameplay identity, never a cosmetic replacement of an unrelated encounter. */
export const storyBossIdentity = (stageId: string, content: ValidatedContent) => bossProfile(content)?.story_identities?.[stageId];
export function bossArmorElement(id: string, fallback: string, content: ValidatedContent): string {
  return bossProfile(content)?.defense_elements[id] ?? fallback;
}
type Encounter = { definition_id: string; element: string; attack_element?: string; resolved_base: CombatStats };
/** Apply once, after the mode's own difficulty curve. Armor never changes authored attack elements. */
export function applyBossProfile<T extends Encounter>(boss: T, content: ValidatedContent): T {
  const profile = bossProfile(content);
  if (!profile) return boss; // Frozen content retains its original values and replay behavior.
  const scale = (n: number) => {
    const result = Math.round(n * profile.attack_multiplier);
    if (!Number.isSafeInteger(result) || result < 0) throw new RangeError('BOSS_ATTACK_OVERFLOW');
    return result;
  };
  return { ...boss, element: bossArmorElement(boss.definition_id, boss.element, content),
    attack_element: boss.attack_element ?? boss.element,
    resolved_base: { ...boss.resolved_base, physical_attack: scale(boss.resolved_base.physical_attack), magical_attack: scale(boss.resolved_base.magical_attack) } };
}
