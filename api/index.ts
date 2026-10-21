import { getRuntimeStatus } from '../src/domain/account/index.ts';
import { authenticateRequest, createServerSupabase } from '../src/server/auth/index.ts';
import { readServerAuthConfig } from '../src/server/auth/config.ts';
import { createSaveStore } from '../src/server/persistence/supabase.ts';
import type { AuthenticatedIdentity, AuthResult } from '../src/contracts/auth.ts';
import type { StoredSave } from '../src/server/persistence/supabase.ts';
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { AccountCreationRules } from '../src/domain/account/creation.ts';
import { AccountCommandRules } from '../src/domain/account/commands.ts';
import type { SaveContext } from '../src/contracts/save.ts';
import type { Command } from '../src/contracts/index.ts';
import { canonicalCommand } from '../src/domain/account/protocol.ts';
import type { AccountState } from '../src/contracts/index.ts';
import type { BackupReason, StoredBackup } from '../src/contracts/save.ts';
import { backupFile, saveSummary } from '../src/domain/account/maintenance.ts';
import { captureTiming, timedSync } from '../src/server/persistence/timing.ts';

interface CreationReply { body: unknown; status: number }

export interface ApiServices {
  authenticate(request: Request): Promise<AuthResult<AuthenticatedIdentity>>;
  readAccount(identity: AuthenticatedIdentity): Promise<StoredSave | null>;
  lookupReceipt(identity: AuthenticatedIdentity, requestId: string): Promise<unknown | null>;
  createAccount?(identity: AuthenticatedIdentity, input: unknown): Promise<CreationReply>;
  command?(identity: AuthenticatedIdentity, input: unknown): Promise<CreationReply>;
  checkpoint?(identity: AuthenticatedIdentity): Promise<CreationReply>;
  backups?(identity: AuthenticatedIdentity, backupId: string | null): Promise<CreationReply>;
}
function response(body: unknown, status = 200): Response { return Response.json(body, { status, headers: { 'cache-control': 'no-store', vary: 'Authorization' } }); }
export function createApi(env: Record<string, string | undefined>, injected?: ApiServices) {
  const configuration = readServerAuthConfig(env), status = getRuntimeStatus();
  let services = injected;
  function configuredServices(): ApiServices | null {
    if (services) return services;
    if (configuration.kind !== 'configured') return null;
    const client = createServerSupabase(configuration.config), reader = createSaveStore(client, configuration.config.environment, configuration.config.project_ref);
    // Rule facades only contain immutable content/schema validators. Share one per API instance,
    // and do not validate the whole game twice (or at all for an unauthenticated request).
    let handlers: { initial: ReturnType<typeof createAccountHandler>; recurring: ReturnType<typeof createRecurringHandlers> } | undefined;
    function rulesHandlers() {
      if (!handlers) { const rules = timedSync('rules_init', () => new AccountCommandRules()); handlers = { initial: createAccountHandler(reader, env.SAVE_SIGNING_KEY, rules), recurring: createRecurringHandlers(reader, env.SAVE_SIGNING_KEY, rules) }; }
      return handlers;
    }
    services = { authenticate: request => authenticateRequest(request, client, configuration.config.url + '/auth/v1'), ...reader, createAccount: (identity, input) => rulesHandlers().initial(identity, input), command: (identity, input) => (input as { type?: unknown })?.type === 'account.create' ? rulesHandlers().initial(identity, input) : rulesHandlers().recurring.command(identity, input), checkpoint: identity => rulesHandlers().recurring.checkpoint(identity), backups: (identity, id) => rulesHandlers().recurring.backups(identity, id) }; return services;
  }
  return { async fetch(request: Request): Promise<Response> {
    const started = performance.now(), timings: string[] = [];
    async function measure<T>(name: string, run: () => Promise<T>): Promise<T> {
      const at = performance.now(); try { return await run(); } finally { timings.push(`${name};dur=${(performance.now() - at).toFixed(1)}`); }
    }
    async function handle(): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === '/api/health' && request.method === 'GET') return response({ ...status, persistence: configuration.kind === 'configured' || injected ? 'configured' : 'not_configured' }, status.ok ? 200 : 503);
    if (!['/api/account', '/api/commands', '/api/checkpoint', '/api/backups'].includes(path) && !path.startsWith('/api/receipts/') && !path.startsWith('/api/backups/')) return response({ code: 'NOT_FOUND' }, 404);
    try {
      const active = configuredServices();
      if (!active) return response({ code: configuration.kind === 'invalid' ? configuration.code : 'AUTH_NOT_CONFIGURED' }, 503);
      const identity = await measure('auth', () => active.authenticate(request)); if (!identity.ok) return response({ code: identity.code }, identity.status);
      if (path === '/api/checkpoint' && request.method === 'GET') {
        if (!active.checkpoint) return response({ code: 'CHECKPOINT_NOT_IMPLEMENTED' }, 501);
        const reply = await measure('checkpoint', () => active.checkpoint!(identity.value)); return response(reply.body, reply.status);
      }
      if ((path === '/api/backups' || path.startsWith('/api/backups/')) && request.method === 'GET') {
        if (!active.backups) return response({ code: 'BACKUPS_NOT_IMPLEMENTED' }, 501);
        const id = path === '/api/backups' ? null : path.slice('/api/backups/'.length);
        if (id !== null && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) return response({ code: 'INVALID_BACKUP_ID' }, 400);
        const reply = await active.backups(identity.value, id); return response(reply.body, reply.status);
      }
      if (path === '/api/account' && request.method === 'GET') {
        const save = await active.readAccount(identity.value);
        if (save && save.account_id !== identity.value.account_id) return response({ code: 'SAVE_OWNER_MISMATCH' }, 503);
        // Absence does not manufacture a new account or starter wallet.
        return save ? response({ save }) : response({ code: 'ACCOUNT_NOT_INITIALIZED' }, 404);
      }
      if (path.startsWith('/api/receipts/') && request.method === 'GET') {
        const id = path.slice('/api/receipts/'.length);
        if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) return response({ code: 'INVALID_REQUEST_ID' }, 400);
        const receipt = await active.lookupReceipt(identity.value, id); return receipt ? response({ receipt }) : response({ code: 'RECEIPT_NOT_FOUND' }, 404);
      }
      if (path === '/api/commands' && request.method === 'POST') {
        const handle = active.command ?? active.createAccount;
        if (!handle) return response({ code: 'COMMANDS_NOT_IMPLEMENTED' }, 501);
        const text = await request.text(); if (text.length > 16384) return response({ code: 'COMMAND_TOO_LARGE' }, 413);
        let input: unknown; try { input = JSON.parse(text); } catch { return response({ code: 'INVALID_JSON' }, 400); }
        const reply = await measure('command', () => handle(identity.value, input));
        if (reply.status === 200 && request.headers.get('x-ro-checkpoint') === 'include' && active.checkpoint && !(reply.body as { checkpoint?: unknown })?.checkpoint) {
          // A write may already be committed. Checkpoint failure must not turn it into an uncertain/retried write.
          try {
            const loaded = await measure('checkpoint', () => active.checkpoint!(identity.value));
            if (loaded.status === 200) return response({ ...reply.body as Record<string, unknown>, ...loaded.body as Record<string, unknown> }, reply.status);
          } catch { /* Receipt-only fallback: the client reconciles without resubmitting a confirmed command. */ }
        }
        return response(reply.body, reply.status);
      }
      return response({ code: 'METHOD_NOT_ALLOWED' }, 405);
    } catch { return response({ code: 'SAVE_OR_ENVIRONMENT_UNAVAILABLE' }, 503); }
    }
    const captured = await captureTiming(handle), reply = captured.value;
    if (captured.header) timings.push(captured.header);
    timings.push(`total;dur=${(performance.now() - started).toFixed(1)}`);
    reply.headers.set('server-timing', timings.join(', '));
    reply.headers.set('x-ro-api-region', /^[a-z0-9]+$/.test(env.VERCEL_REGION ?? '') ? env.VERCEL_REGION! : 'local');
    return reply;
  } };
}

/** Shared server command path; injectable store permits fault/race tests. */
export function createRecurringHandlers(store: Pick<ReturnType<typeof createSaveStore>, 'loadContext' | 'readCreationReceipt' | 'commitCommand'> & Partial<Pick<ReturnType<typeof createSaveStore>, 'commitMaintenance' | 'listBackups' | 'loadCommandContext' | 'commitCommandContext' | 'dailyClockReceipts'>>, signingKey: string | undefined, rules = new AccountCommandRules()) {
  const sha = (value: unknown) => createHash('sha256').update(rules.canonical(value)).digest('hex');
  const fail = (code: string, status: number): CreationReply => ({ body: { code }, status });
  function signature(accountId: string, revision: number, stateHash: string, contentHash: string, schemaVersion: number) {
    if (!signingKey || signingKey.length < 32) throw new Error('SIGNING_KEY_NOT_CONFIGURED');
    return createHmac('sha256', signingKey).update(rules.canonical({ account_id: accountId, revision, state_hash: stateHash, content_hash: contentHash, schema_version: schemaVersion, key_version: 1 })).digest('base64url');
  }
  function signed(value: string, accountId: string, revision: number, stateHash: string, contentHash: string, schemaVersion: number) {
    const expected = Buffer.from(signature(accountId, revision, stateHash, contentHash, schemaVersion)), actual = Buffer.from(value);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
  /** Signed history tip and save row agree (independent of which content version signed them). */
  function intact(context: SaveContext, accountId: string) {
    const { save, history } = context;
    if (!save || !history) throw new Error('ACCOUNT_NOT_INITIALIZED');
    return save.account_id === accountId && history.account_id === accountId && save.revision === history.revision && history.key_version === 1 && save.state_hash === sha(save.state) && history.state_hash === save.state_hash && sha(history.state) === save.state_hash
      && signed(history.signature, accountId, save.revision, save.state_hash, save.content_hash, save.schema_version);
  }
  const current = (save: NonNullable<SaveContext['save']>) => save.schema_version === 1 && save.content_hash === rules.versions.content_hash && save.content_version === rules.versions.content_version && save.rules_version === rules.versions.rules_version;
  function verified(context: SaveContext, accountId: string) {
    if (!intact(context, accountId)) throw new Error('SAVE_INTEGRITY_FAILED');
    const save = context.save!;
    if (!current(save)) throw new Error('CONTENT_VERSION_MISMATCH');
    return { save, state: rules.validateAccount(save.state) };
  }
  /** Quarantined save: the signed history tip at the same revision, if it still verifies on its own. */
  function recoverySource(context: SaveContext, accountId: string) {
    const { save, history } = context;
    if (!save || !history || history.account_id !== accountId || history.revision !== save.revision || history.key_version !== 1 || sha(history.state) !== history.state_hash) return null;
    const contentHash = [save.content_hash, rules.versions.content_hash].find(hash => signed(history.signature, accountId, history.revision, history.state_hash, hash, 1));
    return contentHash ? { checkpoint_id: `history:${history.revision}`, signature: history.signature, revision: history.revision, content_hash: contentHash, state: history.state } : null;
  }
  const summary = (state: unknown) => { try { return saveSummary(state as AccountState); } catch { return null; } };
  /** Undo-reset only: the newest 'reset' backup that no later restore has consumed (no gacha/spend reroll). */
  const restorable = (rows: StoredBackup[]) => {
    const ordered = [...rows].sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : b.revision - a.revision));
    const lastReset = ordered.find(row => row.reason === 'reset'), lastRestore = ordered.find(row => row.reason === 'restore');
    return lastReset && (!lastRestore || lastRestore.created_at < lastReset.created_at) && lastReset.signature ? lastReset.backup_id : null;
  };
  const contextFailure = (error: unknown) => {
    const code = error instanceof Error ? error.message : '';
    return fail(['ACCOUNT_NOT_INITIALIZED','CONTENT_VERSION_MISMATCH','SAVE_INTEGRITY_FAILED','SIGNING_KEY_NOT_CONFIGURED'].includes(code) ? code : 'SAVE_CONTEXT_UNAVAILABLE', code === 'ACCOUNT_NOT_INITIALIZED' ? 404 : code === 'CONTENT_VERSION_MISMATCH' ? 409 : 503);
  };
  /** TASK-040 (D-064): backup-before-write maintenance. Never accepts a state from the client. */
  async function maintenance(identity: AuthenticatedIdentity, command: Command, requestHash: string): Promise<CreationReply> {
    if (!store.commitMaintenance || !store.listBackups) return fail('COMMANDS_NOT_IMPLEMENTED', 501);
    const context = await store.loadContext(identity), save = context.save, accountId = identity.account_id;
    if (!save || !context.history) return fail('ACCOUNT_NOT_INITIALIZED', 404);
    if (command.expected_revision !== save.revision) return fail('REVISION_CONFLICT', 409);
    const nowMs = Date.parse(context.server_at); if (!Number.isSafeInteger(nowMs)) return fail('INVALID_DATABASE_TIME', 503);
    const whole = intact(context, accountId), live = whole && current(save) ? rules.validateAccount(save.state) : null;
    let next: AccountState, previous: AccountState | null = live, reason: BackupReason, code: string;
    try {
      if (command.type === 'save.migrate') {
        if (!whole) return fail('SAVE_INTEGRITY_FAILED', 503);
        if (save.schema_version !== 1) return fail('UPDATE_REQUIRED', 409);
        if (current(save)) return fail('SAVE_ALREADY_CURRENT', 409);
        if (command.params.from_revision !== save.revision || command.params.from_content_hash !== save.content_hash) return fail('MIGRATION_SOURCE_MISMATCH', 409);
        try { next = rules.migrateSave(save.state).state; } catch { return fail('MIGRATION_UNSUPPORTED', 409); }
        previous = save.state as AccountState; reason = 'migration'; code = 'SAVE_MIGRATED';
      } else if (command.type === 'account.reset') {
        if (!live) return whole ? fail('CONTENT_VERSION_MISMATCH', 409) : fail('SAVE_INTEGRITY_FAILED', 503);
        next = rules.resetSave(live, command.params, context.server_at, nowMs, randomBytes(4).readUInt32BE()); reason = 'reset'; code = 'ACCOUNT_RESET';
      } else if (command.type === 'backup.restore_request') {
        const [kind, ref] = command.params.checkpoint_id.split(':');
        if (kind === 'history') {
          if (whole) return fail('RECOVERY_NOT_NEEDED', 409);
          const source = recoverySource(context, accountId);
          if (!source || source.checkpoint_id !== command.params.checkpoint_id || source.signature !== command.params.signature) return fail('RECOVERY_SOURCE_INVALID', 409);
          let state: unknown = source.state; if (source.content_hash !== rules.versions.content_hash) { try { state = rules.migrateSave(state).state; } catch { return fail('MIGRATION_UNSUPPORTED', 409); } }
          next = rules.restoreSave(state, null, nowMs); previous = null; reason = 'quarantine'; code = 'SAVE_RECOVERED';
        } else if (kind === 'backup') {
          if (!live) return whole ? fail('CONTENT_VERSION_MISMATCH', 409) : fail('SAVE_INTEGRITY_FAILED', 503);
          const rows = await store.listBackups(identity), row = rows.find(candidate => candidate.backup_id === ref);
          if (!row || row.backup_id !== restorable(rows)) return fail('BACKUP_NOT_RESTORABLE', 409);
          if (!row.signature || row.signature !== command.params.signature || row.account_id !== accountId || sha(row.state) !== row.state_hash || !signed(row.signature, accountId, row.revision, row.state_hash, row.content_hash, row.schema_version)) return fail('BACKUP_SIGNATURE_INVALID', 409);
          let state: unknown = row.state; if (row.content_hash !== rules.versions.content_hash) { try { state = rules.migrateSave(state).state; } catch { return fail('MIGRATION_UNSUPPORTED', 409); } }
          next = rules.restoreSave(state, live, nowMs); reason = 'restore'; code = 'BACKUP_RESTORED';
        } else if (kind === 'daily-clock' && command.params.checkpoint_id === 'daily-clock:essence:2026-10-21' && command.params.signature === 'daily-clock-incident-2026-10-21') {
          // One explicitly requested incident correction, through the existing signed backup-before-write restore transaction.
          if (!live || !store.dailyClockReceipts) return fail('DAILY_CLOCK_REPAIR_UNAVAILABLE', 409);
          const rows = await store.dailyClockReceipts(identity), cutoff = Date.parse('2026-10-21T14:07:06.000Z');
          const restored = rows.some(r => r.result.code === 'DAILY_CLOCK_ESSENCE_REFUNDED');
          const affected = rows.find(r => r.result.code === 'DAILY_RETREATED' && Date.parse(r.server_at) <= cutoff && rows.some(start => start.command_type === 'battle.start_daily' && start.result.battle_id === r.result.battle_id && Date.parse(r.server_at) - Date.parse(start.server_at) >= 15000));
          const record = live.daily_records.find(r => r.boss_id === 'essence' && r.ticket_day === '2026-10-21');
          const today = new Date(nowMs + 7 * 3600000).toISOString().slice(0, 10);
          if (restored || !affected || !record?.attempts_used || live.active_battle || today !== '2026-10-21') {
            const receipt = rules.maintenanceReceipt(command, requestHash, live, live, context.server_at, restored ? 'DAILY_CLOCK_ALREADY_REFUNDED' : 'DAILY_CLOCK_NOT_AFFECTED');
            receipt.outcome = 'rejected'; receipt.committed_revision = save.revision;
            const committed = await store.commitCommand({ account_id: accountId, request_id: command.request_id, request_hash: requestHash, expected_revision: save.revision, state: live, state_hash: save.state_hash, receipt, signature: context.history.signature, key_version: 1, schema_version: 1, ...rules.versions, battle_write: { kind: 'keep' } });
            if (committed.error) return fail(committed.error.message, committed.error.message === 'REVISION_CONFLICT' ? 409 : 503);
            return { status: 200, body: { receipt: committed.data } };
          }
          next = structuredClone(live); next.daily_records.find(r => r.boss_id === 'essence' && r.ticket_day === '2026-10-21')!.attempts_used--;
          reason = 'restore'; code = 'DAILY_CLOCK_ESSENCE_REFUNDED';
        } else return fail('INVALID_CHECKPOINT_ID', 400);
      } else return fail('COMMANDS_NOT_IMPLEMENTED', 501);
    } catch { return fail('MAINTENANCE_STATE_INVALID', 409); }
    const receipt = rules.maintenanceReceipt(command, requestHash, previous, next, context.server_at, code), stateHash = sha(next);
    const committed = await store.commitMaintenance({ account_id: accountId, request_id: command.request_id, request_hash: requestHash, expected_revision: command.expected_revision, reason, backup_id: randomUUID(), state: next, state_hash: stateHash, receipt, signature: signature(accountId, receipt.committed_revision, stateHash, rules.versions.content_hash, 1), key_version: 1, schema_version: 1, ...rules.versions });
    if (committed.error) { const failure = committed.error.message; return fail(['REVISION_CONFLICT', 'IDEMPOTENCY_KEY_REUSE'].includes(failure) ? failure : 'COMMAND_COMMIT_FAILED', ['REVISION_CONFLICT', 'IDEMPOTENCY_KEY_REUSE'].includes(failure) ? 409 : 503); }
    return { body: { receipt: committed.data }, status: 200 };
  }
  return {
    async checkpoint(identity: AuthenticatedIdentity): Promise<CreationReply> {
      let context: SaveContext | null = null;
      try { context = await store.loadContext(identity); verified(context, identity.account_id); return { body: { checkpoint: context }, status: 200 }; }
      catch (error) {
        const code = error instanceof Error ? error.message : '', save = context?.save;
        // TASK-040: an older signed save is offered a previewed, backed-up migration; a newer schema is never touched.
        if (code === 'CONTENT_VERSION_MISMATCH' && save) {
          if (save.schema_version !== 1) return fail('UPDATE_REQUIRED', 409);
          try { const migrated = rules.migrateSave(save.state); return { status: 409, body: { code: 'SAVE_MIGRATION_REQUIRED', migration: { from_revision: save.revision, from_content_hash: save.content_hash, server_content_hash: rules.versions.content_hash, changes: migrated.changes.slice(0, 40), before: summary(save.state), after: saveSummary(migrated.state) } } }; }
          catch { return fail('MIGRATION_UNSUPPORTED', 409); }
        }
        if (code === 'SAVE_INTEGRITY_FAILED' && context) { const source = recoverySource(context, identity.account_id); return { status: 503, body: { code, recovery: source ? { checkpoint_id: source.checkpoint_id, signature: source.signature, revision: source.revision, summary: summary(source.state) } : null } }; }
        return contextFailure(error);
      }
    },
    async backups(identity: AuthenticatedIdentity, backupId: string | null): Promise<CreationReply> {
      if (!store.listBackups) return fail('BACKUPS_NOT_IMPLEMENTED', 501);
      try {
        const rows = await store.listBackups(identity), allowed = restorable(rows);
        if (backupId === null) return { status: 200, body: { backups: rows.map(row => ({ backup_id: row.backup_id, reason: row.reason, revision: row.revision, created_at: row.created_at, content_hash: row.content_hash, signed: !!row.signature, restorable: row.backup_id === allowed, signature: row.backup_id === allowed ? row.signature : null, summary: summary(row.state) })) } };
        const row = rows.find(candidate => candidate.backup_id === backupId);
        if (!row || !row.signature || row.key_version === null) return fail('BACKUP_NOT_FOUND', 404);
        return { status: 200, body: { file: backupFile(row, { signature: row.signature, key_version: row.key_version }, row.created_at, 'server_backup', row.reason) } };
      } catch { return fail('SAVE_CONTEXT_UNAVAILABLE', 503); }
    },
    async command(identity: AuthenticatedIdentity, input: unknown): Promise<CreationReply> {
      let command: Command; try { command = rules.parse(input); } catch { return fail('INVALID_COMMAND', 400); }
      const requestHash = createHash('sha256').update(canonicalCommand(command)).digest('hex');
      let combined: Awaited<ReturnType<NonNullable<typeof store.loadCommandContext>>>;
      try { combined = await store.loadCommandContext?.(identity, command.request_id); } catch (error) { return contextFailure(error); }
      const old = combined ? combined.previous : await store.readCreationReceipt(identity, command.request_id);
      if (old) {
        if (old.request_hash !== requestHash) return fail('IDEMPOTENCY_KEY_REUSE', 409);
        if (combined) { try { verified(combined.context, identity.account_id); if (combined.context.save!.revision >= old.receipt.committed_revision) return { body: { receipt: old.receipt, checkpoint: combined.context }, status: 200 }; } catch { /* Replay still precedes current-version admission; the normal checkpoint path reports incompatibility. */ } }
        return { body: { receipt: old.receipt }, status: 200 };
      }
      if (command.content_hash !== rules.versions.content_hash || command.content_version !== rules.versions.content_version || command.rules_version !== rules.versions.rules_version) return fail('CONTENT_VERSION_MISMATCH', 409);
      if (command.type === 'save.migrate' || command.type === 'account.reset' || command.type === 'backup.restore_request') { try { return await maintenance(identity, command, requestHash); } catch (error) { return contextFailure(error); } }
      if (!rules.supports(command.type)) return fail('COMMANDS_NOT_IMPLEMENTED', 501);
      try {
        const context = combined?.context ?? await store.loadContext(identity), { save, state } = timedSync('verify_state', () => verified(context, identity.account_id));
        if (command.expected_revision !== save.revision) return fail('REVISION_CONFLICT', 409);
        const now = Date.parse(context.server_at), pointer = state.active_battle;
        if (!Number.isSafeInteger(now)) return fail('INVALID_DATABASE_TIME', 503);
        const time = { account_id: identity.account_id, battle_id: randomUUID(), battle_seed: randomBytes(4).readUInt32LE(), build_hashes: Object.fromEntries(Object.entries(rules.buildInputs(state)).map(([id,build])=>[id,sha({content_hash:rules.versions.content_hash,...build})])), server_at: context.server_at, now_ms: now, new_lease_at: new Date(now + rules.leaseMs).toISOString(), last_ack_ms: pointer ? Date.parse(pointer.last_ack_at) : 0, lease_expires_ms: pointer ? Date.parse(pointer.lease_expires_at) : 0, started_ms: pointer ? Date.parse(pointer.started_at) : 0, farm_from_ms: Date.parse(state.farm.reserved_through), stored_last_ack_ms: context.battle ? Date.parse(context.battle.last_ack_at) : 0, stored_lease_ms: context.battle ? Date.parse(context.battle.lease_expires_at) : 0 };
        const proposal = timedSync('calculate', () => rules.decide(command, state, context.battle, time, requestHash)), stateHash = sha(proposal.state);
        const commit = { account_id: identity.account_id, expected_revision: command.expected_revision, request_id: command.request_id, request_hash: requestHash, state: proposal.state, state_hash: stateHash, receipt: proposal.receipt, signature: signature(identity.account_id, proposal.receipt.committed_revision, stateHash, rules.versions.content_hash, 1), key_version: 1, schema_version: 1, ...rules.versions, battle_write: proposal.battle_write };
        const fast = combined ? await store.commitCommandContext?.(commit) : undefined;
        if (fast && !fast.error && fast.data) {
          timedSync('verify_reply', () => verified(fast.data.context, identity.account_id));
          if (fast.data.context.save!.revision < fast.data.receipt.committed_revision) throw new Error('SAVE_CONTEXT_REVISION_MISMATCH');
          return { body: { receipt: fast.data.receipt, checkpoint: fast.data.context }, status: 200 };
        }
        const committed = fast ?? await store.commitCommand(commit);
        if (committed.error) { const code = committed.error.message; return fail(['REVISION_CONFLICT','IDEMPOTENCY_KEY_REUSE','CONTENT_VERSION_MISMATCH','BATTLE_LEASE_EXPIRED'].includes(code) ? code : 'COMMAND_COMMIT_FAILED', ['REVISION_CONFLICT','IDEMPOTENCY_KEY_REUSE','CONTENT_VERSION_MISMATCH','BATTLE_LEASE_EXPIRED'].includes(code) ? 409 : 503); }
        return { body: { receipt: committed.data }, status: 200 };
      } catch (error) { return contextFailure(error); }
    },
  };
}
function createAccountHandler(store: ReturnType<typeof createSaveStore>, signingKey: string | undefined, rules: AccountCreationRules = new AccountCreationRules()) {
  const sha = (value: unknown) => createHash('sha256').update(rules.canonical(value)).digest('hex');
  const fail = (code: string, status: number): CreationReply => ({ body: { code }, status });
  return async (identity: AuthenticatedIdentity, input: unknown): Promise<CreationReply> => {
    let command: Command; try { command = rules.parse(input); } catch { return fail('INVALID_COMMAND', 400); }
    if (command.type !== 'account.create') return fail('COMMANDS_NOT_IMPLEMENTED', 501);
    const requestHash = createHash('sha256').update(canonicalCommand(command)).digest('hex');
    // Identity is verified outside the payload. Return old receipts before current
    // content/revision admission, including after a response loss or patch.
    const previous = await store.readCreationReceipt(identity, command.request_id);
    if (previous) return previous.request_hash === requestHash ? { body: { receipt: previous.receipt }, status: 200 } : fail('IDEMPOTENCY_KEY_REUSE', 409);
    if (command.content_hash !== rules.versions.content_hash || command.content_version !== rules.versions.content_version || command.rules_version !== rules.versions.rules_version) return fail('CONTENT_VERSION_MISMATCH', 409);
    if (command.expected_revision !== 0) return fail('REVISION_CONFLICT', 409);
    if (!signingKey || signingKey.length < 32) return fail('SIGNING_KEY_NOT_CONFIGURED', 503);
    const context = await store.loadContext(identity);
    const serverAt = context.server_at, localDay = new Date(Date.parse(serverAt) + 7 * 3600000).toISOString().slice(0, 10);
    const { state, receipt } = rules.prepare(command, requestHash, serverAt, localDay, randomBytes(4).readUInt32BE());
    const stateHash = sha(state);
    const signature = createHmac('sha256', signingKey).update(rules.canonical({ account_id: identity.account_id, revision: 1, state_hash: stateHash, content_hash: rules.versions.content_hash, schema_version: 1, key_version: 1 })).digest('base64url');
    const committed = await store.commitInitial({ account_id: identity.account_id, request_id: command.request_id, request_hash: requestHash, state, state_hash: stateHash, receipt, signature, key_version: 1, schema_version: 1, ...rules.versions });
    if (committed.error) return fail(['IDEMPOTENCY_KEY_REUSE', 'REVISION_CONFLICT'].includes(committed.error.message) ? committed.error.message : 'ACCOUNT_CREATION_FAILED', ['IDEMPOTENCY_KEY_REUSE', 'REVISION_CONFLICT'].includes(committed.error.message) ? 409 : 503);
    return { body: { receipt: committed.data }, status: 200 };
  };
}

export default createApi(process.env);
