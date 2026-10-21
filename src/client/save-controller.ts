import type { AccountState, Command, Receipt } from '../contracts/index.ts';
import type { SaveCheckpoint } from '../contracts/save.ts';

export class SaveProtocolError extends Error { constructor(readonly code: string, readonly status = 503, readonly detail: unknown = null) { super(code); } }
export interface SaveBackup { checkpoint: SaveCheckpoint | null; pending: Command | null }
export interface SaveCommandReply { receipt: Receipt; checkpoint?: SaveCheckpoint }
export interface SavePorts {
  checkpoint(): Promise<SaveCheckpoint>;
  receipt(id: string): Promise<Receipt | null>;
  send(command: Command): Promise<Receipt>;
  /** New servers can return the verified cloud checkpoint with the command receipt. */
  sendWithCheckpoint?(command: Command): Promise<SaveCommandReply>;
  load(accountId: string): SaveBackup | null;
  store(accountId: string, value: SaveBackup): void;
  lock(accountId: string): Promise<(() => void) | null>;
  requestId(): string;
  /** TASK-040 read-only backup listing/download (optional for protocol test doubles). */
  backups?(): Promise<BackupListing[]>;
  backupFile?(id: string): Promise<unknown>;
}
export interface BackupListing { backup_id: string; reason: 'migration' | 'reset' | 'restore' | 'quarantine'; revision: number; created_at: string; content_hash: string; signed: boolean; restorable: boolean; signature: string | null; summary: unknown }
export type SaveStatus = 'idle' | 'loading' | 'ready' | 'saving' | 'offline' | 'read_only' | 'signed_out' | 'incompatible' | 'error';
export interface SaveSnapshot extends SaveBackup { status: SaveStatus; reason: string | null; lastReceipt: Receipt | null; detail?: unknown }
/** Never applies receipt deltas locally or uploads cached snapshots. */
export class SaveController {
  snapshot: SaveSnapshot = { status: 'idle', reason: null, checkpoint: null, pending: null, lastReceipt: null };
  private listeners = new Set<(state: SaveSnapshot) => void>();
  private release: (() => void) | null = null;
  private accountId: string | null = null;
  private epoch = 0;
  private online = true;
  private disposed = false;
  constructor(private readonly ports: SavePorts) {}
  subscribe(listener: (state: SaveSnapshot) => void) { this.listeners.add(listener); listener(this.snapshot); return () => { this.listeners.delete(listener); }; }
  private publish(change: Partial<SaveSnapshot>) { this.snapshot = Object.freeze({ ...this.snapshot, ...change }); for (const fn of this.listeners) fn(this.snapshot); }
  private persist() { if (this.accountId) this.ports.store(this.accountId, { checkpoint: this.snapshot.checkpoint, pending: this.snapshot.pending }); }
  private failed(error: unknown) {
    const e = error instanceof SaveProtocolError ? error : new SaveProtocolError('NETWORK_UNAVAILABLE');
    const incompatible = ['CONTENT_VERSION_MISMATCH', 'SAVE_MIGRATION_REQUIRED', 'UPDATE_REQUIRED', 'MIGRATION_UNSUPPORTED'].includes(e.code);
    this.publish({ status: e.status === 401 ? 'signed_out' : incompatible ? 'incompatible' : e.code === 'SAVE_INTEGRITY_FAILED' ? 'error' : e.status >= 500 ? 'offline' : 'error', reason: e.code, detail: e.detail });
  }
  async start(accountId: string): Promise<void> {
    const epoch = ++this.epoch; this.release?.(); this.release = null; this.accountId = accountId;
    let backup: SaveBackup | null = null; try { backup = this.ports.load(accountId); } catch { /* Cloud is still authoritative. */ }
    if (backup?.checkpoint && backup.checkpoint.save.account_id !== accountId) backup = null;
    this.publish({ status: this.online ? 'loading' : 'offline', reason: null, checkpoint: backup?.checkpoint ?? null, pending: backup?.pending ?? null, lastReceipt: null });
    const release = await this.ports.lock(accountId);
    if (this.disposed || epoch !== this.epoch) { release?.(); return; } this.release = release;
    await this.reconnect();
  }
  setOnline(online: boolean) { this.online = online; if (!online) { this.epoch++; this.publish({ status: 'offline', reason: 'NETWORK_UNAVAILABLE' }); } }
  private retreatCommand(): Command | null {
    const save = this.snapshot.checkpoint?.save, battle = (save?.state as AccountState | undefined)?.active_battle;
    return save && battle ? { type: 'battle.retreat', params: { battle_id: battle.battle_id }, request_id: this.ports.requestId(), expected_revision: save.revision, schema_version: 1, content_version: save.content_version, content_hash: save.content_hash, rules_version: save.rules_version } : null;
  }
  async suspend(): Promise<void> { const command = this.retreatCommand(); if (command && this.snapshot.status === 'ready') await this.submit(command); }
  async reconnect(recover = true): Promise<void> {
    if (!this.accountId || this.disposed || !this.online) return;
    const epoch = ++this.epoch; this.publish({ status: 'loading', reason: null });
    try {
      if (!this.release) {
        const release = await this.ports.lock(this.accountId);
        if (this.disposed || epoch !== this.epoch) { release?.(); return; } this.release = release;
      }
      const pending = this.snapshot.pending; let reason: string | null = null, minimumRevision = this.snapshot.checkpoint?.save.revision ?? 0;
      if (pending && this.release) {
        this.persist();
        // A reply already received in this tab is authoritative; only uncertain outcomes need a lookup.
        const known = this.snapshot.lastReceipt;
        const receipt = known?.request_id === pending.request_id ? known : await this.ports.receipt(pending.request_id);
        if (!receipt) {
          try { const sent = await this.ports.send(pending); if (sent.request_id !== pending.request_id) throw new SaveProtocolError('INVALID_RECEIPT'); minimumRevision = Math.max(minimumRevision, sent.committed_revision); this.publish({ lastReceipt: sent }); }
          catch (error) { if (error instanceof SaveProtocolError && ['REVISION_CONFLICT', 'IDEMPOTENCY_KEY_REUSE'].includes(error.code)) reason = error.code; else throw error; }
        } else if (receipt.request_id !== pending.request_id) throw new SaveProtocolError('INVALID_RECEIPT');
        else { minimumRevision = Math.max(minimumRevision, receipt.committed_revision); this.publish({ lastReceipt: receipt }); }
      }
      const checkpoint = await this.ports.checkpoint();
      if (this.disposed || epoch !== this.epoch) return;
      if (checkpoint.save.account_id !== this.accountId) throw new SaveProtocolError('CHECKPOINT_OWNER_MISMATCH');
      if (checkpoint.save.revision < minimumRevision) throw new SaveProtocolError('STALE_CHECKPOINT');
      this.publish({ checkpoint, pending: this.release ? null : pending, reason, detail: null }); this.persist();
      this.publish({ status: this.release ? 'ready' : 'read_only' });
      if (recover && this.release) { const command = this.retreatCommand(); if (command) await this.submit(command); }
    } catch (error) { if (!this.disposed && epoch === this.epoch) this.failed(error); }
  }
  /**
   * TASK-040: the two writes allowed while the cloud save cannot be played — a previewed
   * migration of an older signed save, and recovery of a quarantined save from its signed tip.
   * The revision comes from the server's own failure detail, never from a local file.
   */
  async maintain(command: Command): Promise<void> {
    const detail = this.snapshot.detail as { migration?: { from_revision: number }; recovery?: { revision: number } | null } | null | undefined;
    const migrate = command.type === 'save.migrate' && this.snapshot.reason === 'SAVE_MIGRATION_REQUIRED' && command.expected_revision === detail?.migration?.from_revision;
    const recover = command.type === 'backup.restore_request' && command.params.checkpoint_id.startsWith('history:') && this.snapshot.reason === 'SAVE_INTEGRITY_FAILED' && command.expected_revision === detail?.recovery?.revision;
    if (!(migrate || recover) || !this.release || !this.online || this.snapshot.pending) throw new SaveProtocolError('WRITER_NOT_READY', 409);
    return this.write(command);
  }
  async listBackups() { if (!this.ports.backups) throw new SaveProtocolError('BACKUPS_NOT_IMPLEMENTED', 501); return this.ports.backups(); }
  async downloadBackup(id: string) { if (!this.ports.backupFile) throw new SaveProtocolError('BACKUPS_NOT_IMPLEMENTED', 501); return this.ports.backupFile(id); }
  async submit(command: Command): Promise<void> {
    const creating = command.type === 'account.create' && this.snapshot.status === 'error' && this.snapshot.reason === 'ACCOUNT_NOT_INITIALIZED' && !this.snapshot.checkpoint;
    if ((!creating && this.snapshot.status !== 'ready') || !this.release || !this.online || this.snapshot.pending) throw new SaveProtocolError('WRITER_NOT_READY', 409);
    if (command.expected_revision !== (creating ? 0 : this.snapshot.checkpoint?.save.revision)) throw new SaveProtocolError('REVISION_CONFLICT', 409);
    return this.write(command);
  }
  private async write(command: Command): Promise<void> {
    const epoch = ++this.epoch; this.publish({ status: 'saving', pending: structuredClone(command), reason: null, lastReceipt: null });
    try {
      this.persist(); // Persist the exact request ID BEFORE network I/O.
      const reply = this.ports.sendWithCheckpoint ? await this.ports.sendWithCheckpoint(command) : { receipt: await this.ports.send(command) };
      const receipt = reply.receipt;
      if (this.disposed || epoch !== this.epoch) return;
      if (receipt.request_id !== command.request_id) throw new SaveProtocolError('INVALID_RECEIPT');
      this.publish({ lastReceipt: receipt });
      if (reply.checkpoint) {
        const checkpoint = reply.checkpoint;
        if (checkpoint.save.account_id !== this.accountId) throw new SaveProtocolError('CHECKPOINT_OWNER_MISMATCH');
        if (checkpoint.save.revision < Math.max(receipt.committed_revision, this.snapshot.checkpoint?.save.revision ?? 0)) throw new SaveProtocolError('STALE_CHECKPOINT');
        this.publish({ checkpoint, pending: null, reason: null, detail: null }); this.persist();
        this.publish({ status: this.release ? 'ready' : 'read_only' });
        return;
      }
      await this.reconnect(false);
    } catch (error) {
      if (this.disposed || epoch !== this.epoch) return;
      if (error instanceof SaveProtocolError && ['REVISION_CONFLICT', 'IDEMPOTENCY_KEY_REUSE'].includes(error.code)) await this.reconnect();
      else this.failed(error);
    }
  }
  dispose() { this.disposed = true; this.epoch++; this.release?.(); this.release = null; this.listeners.clear(); }
}
