import type { BattleActor, Effect, SkillDefinition, StatBlueprint, StatusDefinition } from '../contracts/index.ts';
import type { ValidatedContent } from '../content/model.ts';
import type { DeepReadonly } from '../content/value.ts';
import { loadValidatedContent } from '../content/index.ts';
import { weaponElement } from '../domain/combat/status.ts';

export type Element = StatBlueprint['weapon_element'];
export type DamageElement = Element | 'weapon';
export const elementNames: Readonly<Record<Element, string>> = {
  neutral: 'ไร้ธาตุ', water: 'น้ำ', earth: 'ดิน', fire: 'ไฟ', wind: 'ลม',
  poison: 'พิษ', holy: 'ศักดิ์สิทธิ์', dark: 'ความมืด', ghost: 'วิญญาณ', undead: 'อันเดด',
};
const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT_UNAVAILABLE');
const content = loaded.value;
export const elementName = (element: DamageElement) => element === 'weapon' ? 'ตามธาตุอาวุธ' : elementNames[element];

/** Read-only labels, not a damage calculator. Mirrors the engine's source/card → tag → Neutral priority. */
export function actorElements(actor: DeepReadonly<BattleActor>, catalog: ValidatedContent = content): { armor: Element; weapon: Element } {
  const armor = actor.stat_blueprint.permanent_sources.filter(source => source.defense_element).at(-1)?.defense_element
    ?? actor.tags.find(tag => tag.startsWith('element:'))?.slice(8) ?? 'neutral';
  return { armor: armor as Element, weapon: weaponElement(actor as BattleActor, catalog) };
}

/** Follow authored damage programs, including indirect damage; no skill-name lookup or guessed element. */
export function effectDamageElements(effects: readonly Effect[], catalog: ValidatedContent = content): DamageElement[] {
  const elements = new Set<DamageElement>(), visited = new Set<string>();
  function walk(rows: readonly Effect[]) {
    for (const effect of rows) {
      if (effect.type === 'damage') elements.add(effect.element);
      else if (effect.type === 'handler') elements.add(effect.params.element);
      else if (effect.type === 'apply_status') {
        const key = `status:${effect.status_id}`; if (visited.has(key)) continue; visited.add(key);
        const status = catalog.statuses[effect.status_id] as unknown as StatusDefinition | undefined;
        if (status?.periodic) walk(status.periodic.effects);
        for (const trigger of status?.triggers ?? []) walk(trigger.effects);
      } else if (effect.type === 'summon') {
        const key = `summon:${effect.actor_definition_id}`; if (visited.has(key)) continue; visited.add(key);
        const summon = catalog.actors[effect.actor_definition_id] as unknown as { action?: { effects: Effect[] } } | undefined;
        if (summon?.action) walk(summon.action.effects);
      }
    }
  }
  walk(effects); return [...elements];
}
export function skillDamageElements(definition: SkillDefinition, catalog: ValidatedContent = content): DamageElement[] {
  return effectDamageElements(definition.kind === 'active' ? [...definition.start_effects, ...definition.effects]
    : definition.triggers.flatMap(trigger => trigger.effects), catalog);
}
