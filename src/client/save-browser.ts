import type { SaveSelection } from './save-slots.ts';
import type { Command, Receipt } from '../contracts/index.ts';
import type { SaveCheckpoint } from '../contracts/save.ts';
import type { AuthController } from './auth-controller.ts';
import { SaveProtocolError, type BackupListing, type SavePorts, type SaveBackup } from './save-controller.ts';
import { loadValidatedContent } from '../content/index.ts';
import { ContentValidator } from '../content/validation.ts';
import type { Json, ObjectValue } from '../content/value.ts';
import { canonical } from '../content/value.ts';
import { randomId, sha256Hex } from './secure-context.ts';
import { previewSave } from './save-preview.ts';

/**
 * Single-writer fallback when Web Locks is missing (plain-http LAN pages are not secure contexts, D-075): a localStorage
 * lease renewed every 2 s. A tab that finds a live lease of another tab stays read-only, exactly like a refused Web Lock;
 * a crashed tab's lease expires after 6 s. The server's revision CAS still guards the save itself.
 */
export function storageWriterLock(storage: Storage, scope: string, now: () => number = Date.now, every: (fn: () => void, ms: number) => unknown = setInterval, stop: (handle: unknown) => void = handle => clearInterval(handle as number)) {
  const me = randomId(), ttl = 6000;
  return (accountId: string): Promise<(() => void) | null> => {
    const key = `${scope}:${accountId}`, read = () => { try { return JSON.parse(storage.getItem(key) ?? 'null') as { owner: string; until: number } | null; } catch { return null; } };
    const held = read(); if (held && held.owner !== me && held.until > now()) return Promise.resolve(null);
    try { storage.setItem(key, JSON.stringify({ owner: me, until: now() + ttl })); } catch { return Promise.resolve(null); }
    if (read()?.owner !== me) return Promise.resolve(null);
    const timer = every(() => { if (read()?.owner === me) try { storage.setItem(key, JSON.stringify({ owner: me, until: now() + ttl })); } catch { /* keep the old lease until it expires */ } }, 2000);
    return Promise.resolve(() => { stop(timer); if (read()?.owner === me) storage.removeItem(key); });
  };
}
export function browserWriterLock(manager: LockManager | undefined, scope: string) {
  return (accountId: string): Promise<(() => void) | null> => {
    if (!manager) return Promise.resolve(null);
    return new Promise(resolve => {
      void manager.request(`${scope}:${accountId}`, { ifAvailable: true }, async lock => {
        if (!lock) { resolve(null); return; }
        await new Promise<void>(release => resolve(release));
      }).catch(() => resolve(null));
    });
  };
}
export function createBrowserSavePorts(auth: AuthController, scope: string, storage: Storage, locks: LockManager | undefined, request: typeof fetch = fetch, selection?: SaveSelection): SavePorts {
  const selected = selection ? Object.freeze({ ...selection }) : undefined;
  const ownerId = auth.snapshot?.user?.id;
  const assertOwner = () => { if (ownerId && auth.snapshot.user?.id !== ownerId) throw new SaveProtocolError('SIGN_IN_REQUIRED', 401); };
  const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT_UNAVAILABLE');
  const content = loaded.value, validator = new ContentValidator(structuredClone(content.schemas) as unknown as Record<string, ObjectValue>);
  const digest = async (value: unknown) => sha256Hex(canonical(value));
  const key = (accountId: string) => `ro-idle:save:v1:${scope}:${accountId}`;
  async function call(url: string, command?: Command, includeCheckpoint = false, signal?: AbortSignal) {
    assertOwner();
    const token = await auth.getAccessToken(); if (!token) throw new SaveProtocolError('SIGN_IN_REQUIRED', 401);
    assertOwner();
    signal?.throwIfAborted();
    let response: Response; try { response = await request(url, { method: command ? 'POST' : 'GET', headers: { authorization: `Bearer ${token}`, ...(selected?{'x-ro-save-slot':String(selected.slot)}:{}), ...(command ? { 'content-type': 'application/json' } : {}), ...(includeCheckpoint ? { 'x-ro-checkpoint': 'include' } : {}) }, body: command ? JSON.stringify(command) : undefined, cache: 'no-store', signal }); }
    catch { if(signal?.aborted)throw signal.reason; throw new SaveProtocolError('NETWORK_UNAVAILABLE'); }
    const body = await response.json() as Record<string, unknown>;
    signal?.throwIfAborted();
    assertOwner();
    if (!response.ok) { if (response.status === 401) auth.markUnauthorized(); throw new SaveProtocolError(typeof body.code === 'string' ? body.code : 'SAVE_UNAVAILABLE', response.status, body); }
    return body;
  }
  function validateReceipt(value: unknown): Receipt { validator.shape('receipt', value as Json, { source: 'save receipt', path: '' }); return value as Receipt; }
  async function validateCheckpoint(value: unknown): Promise<SaveCheckpoint> {
      const c = value as SaveCheckpoint;
      if (!c?.save || !c.history || c.save.account_id !== (selected?.save_id??ownerId) || c.history.account_id !== c.save.account_id || !Number.isSafeInteger(c.save.revision) || c.save.revision < 1 || c.save.revision !== c.history.revision || !c.history.signature || c.history.key_version !== 1) throw new SaveProtocolError('INVALID_CHECKPOINT');
      if (c.save.content_hash !== content.manifest.content_hash || c.save.content_version !== content.manifest.content_version || c.save.rules_version !== content.manifest.rules_version || c.save.schema_version !== 1) throw new SaveProtocolError('CONTENT_VERSION_MISMATCH', 409);
      validator.shape('account-state', c.save.state as Json, { source: 'save checkpoint', path: '' });
      if (await digest(c.save.state) !== c.save.state_hash || c.history.state_hash !== c.save.state_hash || await digest(c.history.state) !== c.save.state_hash) throw new SaveProtocolError('INVALID_CHECKPOINT');
      return c;
  }
  return {
    preview: (state, command) => previewSave(state, command, content),
    async checkpoint(signal) {
      return validateCheckpoint((await call('/api/checkpoint', undefined, false, signal)).checkpoint);
    },
    async receipt(id, signal) { try { return validateReceipt((await call('/api/receipts/' + encodeURIComponent(id), undefined, false, signal)).receipt); } catch (error) { if (error instanceof SaveProtocolError && error.status === 404) return null; throw error; } },
    async send(command, signal) { return validateReceipt((await call('/api/commands', command, false, signal)).receipt); },
    async sendWithCheckpoint(command, signal) {
      const body = await call('/api/commands', command, true, signal), receipt = validateReceipt(body.receipt);
      return { receipt, ...(body.checkpoint ? { checkpoint: await validateCheckpoint(body.checkpoint) } : {}) };
    },
    load(accountId) {
      const text = storage.getItem(key(accountId)); if (!text) return null;
      try {
        const value = JSON.parse(text) as SaveBackup;
        if (!value || typeof value !== 'object' || !('pending' in value) || !('checkpoint' in value)) return null;
        if (value.pending) validator.shape('command', value.pending as unknown as Json, { source: 'pending command backup', path: '' });
        if (value.rejectedForUpdate) validator.shape('command', value.rejectedForUpdate as unknown as Json, { source: 'version-refused command backup', path: '' });
        if (value.checkpoint) {
          if (value.checkpoint.save?.account_id !== accountId || value.checkpoint.history?.account_id !== accountId) return null;
          validator.shape('account-state', value.checkpoint.save.state as Json, { source: 'local backup', path: '' });
        }
        return value;
      } catch { return null; }
    },
    store(accountId, value) { storage.setItem(key(accountId), JSON.stringify(value)); },
    async backups(signal) { const body = await call('/api/backups', undefined, false, signal); if (!Array.isArray(body.backups)) throw new SaveProtocolError('INVALID_BACKUP_LIST'); return body.backups as BackupListing[]; },
    async backupFile(id, signal) { const body = await call('/api/backups/' + encodeURIComponent(id), undefined, false, signal); if (!body.file) throw new SaveProtocolError('BACKUP_NOT_FOUND', 404); return body.file; },
    lock: locks ? browserWriterLock(locks, `ro-idle:writer:${scope}`) : storageWriterLock(storage, `ro-idle:writer:${scope}`),
    requestId: () => randomId(),
  };
}
