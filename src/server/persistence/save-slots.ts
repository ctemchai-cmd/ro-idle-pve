import { createHash } from 'node:crypto';
import type { AuthenticatedIdentity } from '../../contracts/auth.ts';
/** Save identity is distinct from the Auth user. Slot1 keeps the legacy ID/signatures. */
export interface SaveIdentity extends AuthenticatedIdentity { owner_id: string; save_slot: number }
export const SAVE_SLOT_LIMIT = 10;
export function parseSaveSlot(header: string | null): number {
  if (header === null) return 1;
  if (!/^(?:[1-9]|10)$/.test(header)) throw new Error('INVALID_SAVE_SLOT');
  return Number(header);
}
export function saveSlotId(owner: string, slot: number): string {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(owner) || !Number.isInteger(slot) || slot < 1 || slot > SAVE_SLOT_LIMIT) throw new Error('INVALID_SAVE_SLOT');
  if (slot === 1) return owner.toLowerCase();
  // Identifier derivation only, never an authentication/signature mechanism. SQL uses the same namespace.
  const h = createHash('md5').update(`ro-idle:save-slot:v1:${owner.toLowerCase()}:${slot}`).digest('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
export function scopeSave(identity: AuthenticatedIdentity, slot: number): SaveIdentity {
  return { ...identity, owner_id: identity.account_id, save_slot: slot, account_id: saveSlotId(identity.account_id, slot) };
}
