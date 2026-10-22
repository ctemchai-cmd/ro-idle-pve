import type { AccountState, StatBlueprint } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';

export interface ElementScroll { id: string; name: string; element: StatBlueprint['weapon_element']; duration: 'next_battle'; description: string }
export const elementScrolls = (content: ValidatedContent) => content.documents['economy.json']!.element_scrolls as unknown as readonly ElementScroll[];
export const scrollDefinition = (id: string, content: ValidatedContent) => elementScrolls(content).find(row => row.id === id);
export const supplyStock = (state: AccountState, id: string) => state.battle_supplies?.stock[id] ?? 0;
export function preparedScroll(state: AccountState, characterId: string, content: ValidatedContent) {
  const id = state.battle_supplies?.queued[characterId];
  return id ? scrollDefinition(id, content) ?? null : null;
}
export function validateSupplies(state: AccountState, content: ValidatedContent): void {
  for (const id of Object.keys(state.battle_supplies?.stock ?? {})) if (!scrollDefinition(id, content)) throw new Error('INVALID_CONSUMABLE');
  for (const [characterId, id] of Object.entries(state.battle_supplies?.queued ?? {})) {
    if (!state.roster.some(actor => actor.character_id === characterId) || !scrollDefinition(id, content)) throw new Error('INVALID_PREPARED_CONSUMABLE');
  }
}
