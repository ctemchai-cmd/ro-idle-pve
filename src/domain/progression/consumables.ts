import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { scrollDefinition, supplyStock } from '../build/consumables.ts';
import { ProgressionRejection } from './rejection.ts';

const reject = (code: string): never => { throw new ProgressionRejection(code); };
export function grantConsumables(state: AccountState, grants: Readonly<Record<string, number>>, quantity: number, content: ValidatedContent): void {
  for (const [id, amount] of Object.entries(grants)) {
    const total = supplyStock(state, id) + amount * quantity;
    if (!scrollDefinition(id, content) || !Number.isSafeInteger(amount) || amount < 1) reject('INVALID_CONSUMABLE');
    if (!Number.isSafeInteger(total)) reject('RESOURCE_OVERFLOW');
    (state.battle_supplies ??= { stock: {}, queued: {} }).stock[id] = total;
  }
}
/** Reserve one item per character; replacing/cancelling returns the prior reservation. */
export function prepareConsumable(state: AccountState, characterId: string, id: string | null, content: ValidatedContent): void {
  if (state.active_battle) reject('BUILD_LOCKED_DURING_BATTLE');
  if (!state.roster.some(actor => actor.character_id === characterId)) reject('CHARACTER_NOT_FOUND');
  if (id !== null && !scrollDefinition(id, content)) reject('INVALID_CONSUMABLE');
  const old = state.battle_supplies?.queued[characterId];
  if (old === id || (!old && id === null)) reject('CONSUMABLE_ALREADY_PREPARED');
  if (id && supplyStock(state, id) < 1) reject('CONSUMABLE_EMPTY');
  if (old && !Number.isSafeInteger(supplyStock(state, old) + 1)) reject('RESOURCE_OVERFLOW');
  const supplies = state.battle_supplies ??= { stock: {}, queued: {} };
  if (old) supplies.stock[old] = supplyStock(state, old) + 1;
  if (id) { supplies.stock[id] = supplyStock(state, id) - 1; supplies.queued[characterId] = id; }
  else delete supplies.queued[characterId];
}
/** Called only after creating a valid battle input, inside the same atomic start receipt. */
export function consumePreparedForTeam(state: AccountState): void {
  if (state.battle_supplies) for (const member of state.team) delete state.battle_supplies.queued[member.character_id];
}
