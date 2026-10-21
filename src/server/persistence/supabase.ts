import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthenticatedIdentity } from '../../contracts/auth.ts';
import type { Receipt } from '../../contracts/index.ts';
import type { CommandCommit, InitialSaveCommit, MaintenanceCommit, ReceiptRecord, SaveContext, StoredBackup, StoredSave } from '../../contracts/save.ts';
import { timed } from './timing.ts';
export type { StoredSave } from '../../contracts/save.ts';
export interface CommandContext { context: SaveContext; previous: ReceiptRecord | null }

/** Owner-scoped reads and atomic command transactions; no game calculations here. */
export function createSaveStore(client: SupabaseClient, environment: string, projectRef: string) {
  let missingReadUntil = 0, missingCommitUntil = 0;
  const missingRpc = (error: { code?: string; message?: string } | null, name: string) => error?.code === 'PGRST202' && !!error.message?.includes(name);
  function checkedContext(value: unknown, identity: AuthenticatedIdentity): SaveContext {
    const data = value as SaveContext;
    if (!data || !Number.isFinite(Date.parse(data.server_at))) throw new Error('SAVE_CONTEXT_UNAVAILABLE');
    for (const row of [data.save, data.history, data.battle]) if (row && row.account_id !== identity.account_id) throw new Error('SAVE_CONTEXT_OWNER_MISMATCH');
    if (data.save && (!Number.isSafeInteger(data.save.revision) || data.save.revision < 1 || data.history?.revision !== data.save.revision)) throw new Error('SAVE_CONTEXT_REVISION_MISMATCH');
    return data;
  }
  const commandArgs = (input: CommandCommit) => ({ p_account_id: input.account_id, p_request_id: input.request_id, p_request_hash: input.request_hash, p_expected_revision: input.expected_revision, p_state: input.state, p_state_hash: input.state_hash, p_receipt: input.receipt, p_signature: input.signature, p_key_version: input.key_version, p_schema_version: input.schema_version, p_content_version: input.content_version, p_rules_version: input.rules_version, p_content_hash: input.content_hash, p_battle_write: input.battle_write, p_environment: environment, p_project_ref: projectRef });
  async function assertEnvironment() {
    const { data, error } = await timed('db_environment', () => client.rpc('game_assert_environment', { expected_environment: environment, expected_project_ref: projectRef }));
    if (error || data !== true) throw new Error('DATABASE_ENVIRONMENT_MISMATCH');
  }
  return {
    /** Read-only incident evidence; used only when the owner explicitly requests the21Oct daily-clock refund. */
    async dailyClockReceipts(identity: AuthenticatedIdentity): Promise<Receipt[]> {
      await assertEnvironment();
      const { data, error } = await client.from('game_command_receipts').select('account_id,receipt').eq('account_id', identity.account_id).in('command_type', ['battle.start_daily', 'battle.retreat', 'backup.restore_request']).gte('created_at', '2026-10-20T17:00:00.000Z').order('created_at', { ascending: false }).limit(200);
      if (error) throw new Error('RECEIPT_READ_FAILED');
      for (const row of data ?? []) if (row.account_id !== identity.account_id) throw new Error('SAVE_CONTEXT_OWNER_MISMATCH');
      return (data ?? []).map(row => row.receipt as Receipt);
    },
    async loadContext(identity: AuthenticatedIdentity): Promise<SaveContext> {
      const { data, error } = await timed('db_context', () => client.rpc('game_load_context', { p_account_id: identity.account_id, p_environment: environment, p_project_ref: projectRef }));
      if (error) throw new Error('SAVE_CONTEXT_UNAVAILABLE');
      return checkedContext(data, identity);
    },
    async loadCommandContext(identity: AuthenticatedIdentity, requestId: string): Promise<CommandContext | undefined> {
      if (Date.now() < missingReadUntil) return undefined;
      const { data, error } = await timed('db_read', () => client.rpc('game_load_command_context', { p_account_id: identity.account_id, p_request_id: requestId, p_environment: environment, p_project_ref: projectRef }));
      if (missingRpc(error, 'game_load_command_context')) { missingReadUntil = Date.now() + 10000; return undefined; }
      if (error) throw new Error('SAVE_CONTEXT_UNAVAILABLE');
      return { context: checkedContext(data?.context, identity), previous: data.previous as ReceiptRecord | null };
    },
    async readCreationReceipt(identity: AuthenticatedIdentity, requestId: string): Promise<ReceiptRecord | null> {
      await assertEnvironment();
      const { data, error } = await timed('db_receipt', () => client.from('game_command_receipts').select('request_hash,receipt').eq('account_id', identity.account_id).eq('request_id', requestId).maybeSingle());
      if (error) throw new Error('RECEIPT_READ_FAILED'); return data as ReceiptRecord | null;
    },
    async commitInitial(input: InitialSaveCommit) {
      return client.rpc('game_create_account', { p_account_id: input.account_id, p_request_id: input.request_id, p_request_hash: input.request_hash, p_state: input.state, p_state_hash: input.state_hash, p_receipt: input.receipt, p_signature: input.signature, p_key_version: input.key_version, p_schema_version: input.schema_version, p_content_version: input.content_version, p_rules_version: input.rules_version, p_content_hash: input.content_hash, p_environment: environment, p_project_ref: projectRef });
    },
    async commitCommand(input: CommandCommit) {
      return timed('db_commit', () => client.rpc('game_commit_command', commandArgs(input)));
    },
    async commitCommandContext(input: CommandCommit) {
      if (Date.now() < missingCommitUntil) return undefined;
      const reply = await timed('db_commit', () => client.rpc('game_commit_command_context', commandArgs(input)));
      if (missingRpc(reply.error, 'game_commit_command_context')) { missingCommitUntil = Date.now() + 10000; return undefined; }
      if (reply.error) return { data: null, error: reply.error };
      return { data: { receipt: reply.data.receipt, context: checkedContext(reply.data.context, { account_id: input.account_id, email: null }) }, error: null };
    },
    async commitMaintenance(input: MaintenanceCommit) {
      return client.rpc('game_commit_maintenance', { p_account_id: input.account_id, p_request_id: input.request_id, p_request_hash: input.request_hash, p_expected_revision: input.expected_revision, p_reason: input.reason, p_backup_id: input.backup_id, p_state: input.state, p_state_hash: input.state_hash, p_receipt: input.receipt, p_signature: input.signature, p_key_version: input.key_version, p_schema_version: input.schema_version, p_content_version: input.content_version, p_rules_version: input.rules_version, p_content_hash: input.content_hash, p_environment: environment, p_project_ref: projectRef });
    },
    async listBackups(identity: AuthenticatedIdentity): Promise<StoredBackup[]> {
      await assertEnvironment();
      const { data, error } = await client.from('game_save_backups').select('*').eq('account_id', identity.account_id).order('created_at', { ascending: false }).limit(10);
      if (error) throw new Error('BACKUP_READ_FAILED');
      for (const row of data ?? []) if (row.account_id !== identity.account_id) throw new Error('BACKUP_OWNER_MISMATCH');
      return (data ?? []) as StoredBackup[];
    },
    async readAccount(identity: AuthenticatedIdentity): Promise<StoredSave | null> {
      await assertEnvironment();
      const { data, error } = await client.from('game_saves').select('account_id,revision,schema_version,content_version,rules_version,content_hash,state_hash,state,updated_at').eq('account_id', identity.account_id).maybeSingle();
      if (error) throw new Error('SAVE_READ_FAILED');
      if (data && (data.account_id !== identity.account_id || !Number.isSafeInteger(data.revision) || data.revision < 1)) throw new Error('INVALID_SAVE_ENVELOPE');
      return data as StoredSave | null;
    },
    async lookupReceipt(identity: AuthenticatedIdentity, requestId: string): Promise<unknown | null> {
      await assertEnvironment();
      const { data, error } = await client.from('game_command_receipts').select('receipt').eq('account_id', identity.account_id).eq('request_id', requestId).maybeSingle();
      if (error) throw new Error('RECEIPT_READ_FAILED'); return data?.receipt ?? null;
    },
  };
}
