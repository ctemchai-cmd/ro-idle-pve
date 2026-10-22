import type { AccountState, Command, Receipt } from '../contracts/index.ts';
import type { SaveCheckpoint } from '../contracts/save.ts';

export class SaveProtocolError extends Error { constructor(readonly code: string, readonly status = 503, readonly detail: unknown = null) { super(code); } }
export interface SaveBackup { checkpoint: SaveCheckpoint | null; pending: Command | null; /** Exact intent refused by the server's version gate; retained locally, never replayed on new rules. */ rejectedForUpdate?: Command }
export interface SaveCommandReply { receipt: Receipt; checkpoint?: SaveCheckpoint }
export interface SavePorts {
  preview?(state: AccountState, command: Command): AccountState | null;
  checkpoint(signal?: AbortSignal): Promise<SaveCheckpoint>;
  receipt(id: string, signal?: AbortSignal): Promise<Receipt | null>;
  send(command: Command, signal?: AbortSignal): Promise<Receipt>;
  /** New servers can return the verified cloud checkpoint with the command receipt. */
  sendWithCheckpoint?(command: Command, signal?: AbortSignal): Promise<SaveCommandReply>;
  load(accountId: string): SaveBackup | null;
  store(accountId: string, value: SaveBackup): void;
  lock(accountId: string): Promise<(() => void) | null>;
  requestId(): string;
  /** TASK-040 read-only backup listing/download (optional for protocol test doubles). */
  backups?(signal?: AbortSignal): Promise<BackupListing[]>;
  backupFile?(id: string, signal?: AbortSignal): Promise<unknown>;
}
export interface BackupListing { backup_id: string; reason: 'migration' | 'reset' | 'restore' | 'quarantine'; revision: number; created_at: string; content_hash: string; signed: boolean; restorable: boolean; signature: string | null; summary: unknown }
export type SaveStatus = 'idle' | 'loading' | 'ready' | 'saving' | 'offline' | 'read_only' | 'signed_out' | 'incompatible' | 'error';
export interface SaveSnapshot extends SaveBackup { status: SaveStatus; reason: string | null; lastReceipt: Receipt | null; detail?: unknown; preview?: AccountState | null }
/** Display previews are transient; only confirmed checkpoints are persisted. Never uploads cached snapshots. */
export class SaveController {
  snapshot: SaveSnapshot = { status: 'idle', reason: null, checkpoint: null, pending: null, lastReceipt: null };
  private listeners = new Set<(state: SaveSnapshot) => void>();
  private release: (() => void) | null = null;
  private accountId: string | null = null;
  private epoch = 0;
  private online = true;
  private disposed = false;
  private rejectedForUpdate: Command | undefined;
  private readonly requests = new Set<AbortController>();
  private readonly requestTimeoutMs: number;
  constructor(private readonly ports: SavePorts, options: { requestTimeoutMs?: number } = {}) {
    this.requestTimeoutMs = options.requestTimeoutMs ?? 15000;
    if (!Number.isFinite(this.requestTimeoutMs) || this.requestTimeoutMs <= 0) throw new Error('INVALID_SAVE_DEADLINE');
  }
  /** Includes token, headers and body. Late completion cannot settle this operation twice. */
  private async io<T>(work: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController(); this.requests.add(controller);
    const aborted = new Promise<never>((_, reject) => controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true }));
    const timer = setTimeout(() => controller.abort(new SaveProtocolError('SAVE_REQUEST_TIMEOUT')), this.requestTimeoutMs);
    try { return await Promise.race([work(controller.signal), aborted]); }
    finally { clearTimeout(timer); this.requests.delete(controller); }
  }
  subscribe(listener: (state: SaveSnapshot) => void) { this.listeners.add(listener); listener(this.snapshot); return () => { this.listeners.delete(listener); }; }
  private publish(change: Partial<SaveSnapshot>) { this.snapshot = Object.freeze({ ...this.snapshot, ...change }); for (const fn of this.listeners) fn(this.snapshot); }
  private persist() { if (this.accountId) this.ports.store(this.accountId, { checkpoint: this.snapshot.checkpoint, pending: this.snapshot.pending, ...(this.rejectedForUpdate ? { rejectedForUpdate: this.rejectedForUpdate } : {}) }); }
  /** A definite version refusal is not an uncertain network outcome. Archive before releasing the gate. */
  private versionRejected(command: Command) {
    const archived = structuredClone(command);
    if (this.accountId) this.ports.store(this.accountId, { checkpoint: this.snapshot.checkpoint, pending: null, rejectedForUpdate: archived });
    this.rejectedForUpdate = archived; this.publish({ pending: null });
  }
  get hasWriter() { return !!this.release && this.online && !this.disposed; }
  private failed(error: unknown) {
    const e = error instanceof SaveProtocolError ? error : new SaveProtocolError('NETWORK_UNAVAILABLE');
    const incompatible = ['CONTENT_VERSION_MISMATCH', 'SAVE_MIGRATION_REQUIRED', 'UPDATE_REQUIRED', 'MIGRATION_UNSUPPORTED'].includes(e.code);
    this.publish({ preview: null, status: e.status === 401 ? 'signed_out' : incompatible ? 'incompatible' : e.code === 'SAVE_INTEGRITY_FAILED' ? 'error' : e.status >= 500 ? 'offline' : 'error', reason: e.code, detail: e.detail });
  }
  async start(accountId: string): Promise<void> {
    const epoch = ++this.epoch; this.release?.(); this.release = null; this.accountId = accountId;
    let backup: SaveBackup | null = null; try { backup = this.ports.load(accountId); } catch { /* Cloud is still authoritative. */ }
    if (backup?.checkpoint && backup.checkpoint.save.account_id !== accountId) backup = null;
    this.rejectedForUpdate = backup?.rejectedForUpdate;
    this.publish({ preview: null, status: this.online ? 'loading' : 'offline', reason: null, checkpoint: backup?.checkpoint ?? null, pending: backup?.pending ?? null, lastReceipt: null });
    const release = await this.ports.lock(accountId);
    if (this.disposed || epoch !== this.epoch) { release?.(); return; } this.release = release;
    await this.reconnect();
  }
  setOnline(online: boolean) { this.online = online; if (!online) { this.epoch++; for (const request of this.requests) request.abort(new SaveProtocolError('NETWORK_UNAVAILABLE')); this.publish({ preview: null, status: 'offline', reason: 'NETWORK_UNAVAILABLE' }); } }
  private retreatCommand(): Command | null {
    const save = this.snapshot.checkpoint?.save, battle = (save?.state as AccountState | undefined)?.active_battle;
    return save && battle ? { type: 'battle.retreat', params: { battle_id: battle.battle_id }, request_id: this.ports.requestId(), expected_revision: save.revision, schema_version: 1, content_version: save.content_version, content_hash: save.content_hash, rules_version: save.rules_version } : null;
  }
  async suspend(): Promise<void> { const command = this.retreatCommand(); if (command && this.snapshot.status === 'ready') await this.submit(command); }
  async reconnect(recover = true): Promise<void> {
    if (!this.accountId || this.disposed || !this.online) return;
    // Visibility/online notifications must not invalidate a command still awaiting its own reply.
    if (this.snapshot.status === 'saving') return;
    const epoch = ++this.epoch; this.publish({ preview: null, status: 'loading', reason: null });
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
        const receipt = known?.request_id === pending.request_id ? known : await this.io(signal => this.ports.receipt(pending.request_id, signal));
        if (!receipt) {
          try { const sent = await this.io(signal => this.ports.send(pending, signal)); if (sent.request_id !== pending.request_id) throw new SaveProtocolError('INVALID_RECEIPT'); minimumRevision = Math.max(minimumRevision, sent.committed_revision); this.publish({ lastReceipt: sent }); }
          catch (error) {
            if (isVersionRefusal(error)) this.versionRejected(pending);
            else if (error instanceof SaveProtocolError && ['REVISION_CONFLICT', 'IDEMPOTENCY_KEY_REUSE'].includes(error.code)) reason = error.code;
            else throw error;
          }
        } else if (receipt.request_id !== pending.request_id) throw new SaveProtocolError('INVALID_RECEIPT');
        else { minimumRevision = Math.max(minimumRevision, receipt.committed_revision); this.publish({ lastReceipt: receipt }); }
      }
      const checkpoint = await this.io(signal => this.ports.checkpoint(signal));
      if (this.disposed || epoch !== this.epoch) return;
      if (checkpoint.save.account_id !== this.accountId) throw new SaveProtocolError('CHECKPOINT_OWNER_MISMATCH');
      if (checkpoint.save.revision < minimumRevision) throw new SaveProtocolError('STALE_CHECKPOINT');
      this.publish({ checkpoint, pending: this.release ? null : pending, reason, detail: null }); this.persist();
      this.publish({ status: this.release ? 'ready' : 'read_only' });
      if (recover && this.release) { const command = this.retreatCommand(); if (command) await this.submit(command); }
    } catch (error) {
      if (this.disposed || epoch !== this.epoch) return;
      // The original receipt is already definitive. A newer signed-save migration preview
      // replaces the normal checkpoint here; do not keep a completed intent blocking migration.
      const pending = this.snapshot.pending, receipt = this.snapshot.lastReceipt;
      const revision = error instanceof SaveProtocolError && error.code === 'SAVE_MIGRATION_REQUIRED'
        ? (error.detail as { migration?: { from_revision?: number } } | null)?.migration?.from_revision : undefined;
      if (pending && receipt?.request_id === pending.request_id && Number.isSafeInteger(revision) && revision! >= minimumRevisionForReceipt(receipt, this.snapshot.checkpoint)) {
        try {
          if (this.accountId) this.ports.store(this.accountId, { checkpoint: this.snapshot.checkpoint, pending: null, ...(this.rejectedForUpdate ? { rejectedForUpdate: this.rejectedForUpdate } : {}) });
          this.publish({ pending: null });
        } catch { this.failed(new SaveProtocolError('BACKUP_UNAVAILABLE')); return; }
      }
      this.failed(error);
    }
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
  async listBackups() { if (!this.ports.backups) throw new SaveProtocolError('BACKUPS_NOT_IMPLEMENTED', 501); return this.io(signal => this.ports.backups!(signal)); }
  async downloadBackup(id: string) { if (!this.ports.backupFile) throw new SaveProtocolError('BACKUPS_NOT_IMPLEMENTED', 501); return this.io(signal => this.ports.backupFile!(id, signal)); }
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
      const state = this.snapshot.checkpoint?.save.state as AccountState | undefined;
      if (state && this.ports.preview) {
        try { this.publish({ preview: this.ports.preview(state, command) }); } catch { /* Display must not prevent saving. */ }
      }
      const reply = await this.io<SaveCommandReply>(signal => this.ports.sendWithCheckpoint ? this.ports.sendWithCheckpoint(command, signal) : this.ports.send(command, signal).then(receipt => ({ receipt })));
      const receipt = reply.receipt;
      if (this.disposed || epoch !== this.epoch) return;
      if (receipt.request_id !== command.request_id) throw new SaveProtocolError('INVALID_RECEIPT');
      this.publish({ lastReceipt: receipt });
      if (reply.checkpoint) {
        const checkpoint = reply.checkpoint;
        if (checkpoint.save.account_id !== this.accountId) throw new SaveProtocolError('CHECKPOINT_OWNER_MISMATCH');
        if (checkpoint.save.revision < Math.max(receipt.committed_revision, this.snapshot.checkpoint?.save.revision ?? 0)) throw new SaveProtocolError('STALE_CHECKPOINT');
        this.publish({ preview: null, checkpoint, pending: null, reason: null, detail: null }); this.persist();
        this.publish({ status: this.release ? 'ready' : 'read_only' });
        return;
      }
      this.publish({ status: 'loading' }); await this.reconnect(false);
    } catch (error) {
      if (this.disposed || epoch !== this.epoch) return;
      if (isVersionRefusal(error)) {
        try { this.versionRejected(command); } catch { this.failed(new SaveProtocolError('BACKUP_UNAVAILABLE')); return; }
        this.failed(error); await this.reconnect(false); return;
      }
      this.failed(error);
      if (error instanceof SaveProtocolError && (error.code === 'SAVE_REQUEST_TIMEOUT' || ['REVISION_CONFLICT', 'IDEMPOTENCY_KEY_REUSE'].includes(error.code))) await this.reconnect(error.code !== 'SAVE_REQUEST_TIMEOUT');
    }
  }
  dispose() { this.disposed = true; this.epoch++; for (const request of this.requests) request.abort(new SaveProtocolError('SAVE_DISPOSED')); this.release?.(); this.release = null; this.listeners.clear(); }
}

function minimumRevisionForReceipt(receipt: Receipt, checkpoint: SaveCheckpoint | null) {
  return Math.max(receipt.committed_revision, checkpoint?.save.revision ?? 0);
}
/** Only an HTTP error body from the API is a refusal; checkpoint validation can report the same code after a commit. */
function isVersionRefusal(error: unknown): error is SaveProtocolError {
  return error instanceof SaveProtocolError && error.status === 409 && error.code === 'CONTENT_VERSION_MISMATCH'
    && (error.detail as { code?: string } | null)?.code === 'CONTENT_VERSION_MISMATCH';
}
