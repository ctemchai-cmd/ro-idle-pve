import type { AccountState, Receipt } from './index.ts';
export interface InitialSaveCommit {
  account_id: string; request_id: string; request_hash: string;
  state: AccountState; state_hash: string; receipt: Receipt;
  signature: string; key_version: number; schema_version: number;
  content_version: string; rules_version: string; content_hash: string;
}
export interface ReceiptRecord { request_hash: string; receipt: Receipt }
export interface StoredSave {
  account_id: string; revision: number; schema_version: number;
  content_version: string; rules_version: string; content_hash: string;
  state_hash: string; state: unknown; updated_at: string;
}
export interface StoredHistory {
  account_id: string; revision: number; state: unknown; state_hash: string;
  signature: string; key_version: number; created_at: string;
}
export interface StoredBattle {
  account_id: string; battle_id: string; payload: unknown; content_hash: string;
  last_ack_at: string; lease_expires_at: string;
}
export interface SaveContext {
  server_at: string; save: StoredSave | null;
  history: StoredHistory | null; battle: StoredBattle | null;
}
export type BattleWrite = { kind: 'keep' } | { kind: 'delete'; battle_id: string } | { kind: 'upsert'; battle: StoredBattle };
export interface CommandCommit extends InitialSaveCommit {
  expected_revision: number;
  battle_write: BattleWrite;
}
export interface SaveCheckpoint {
  save: StoredSave;
  history: StoredHistory;
  battle: StoredBattle | null;
  server_at: string;
}
/** TASK-040: server-retained backup row (written only inside game_commit_maintenance). */
export type BackupReason = 'migration' | 'reset' | 'restore' | 'quarantine';
export interface StoredBackup {
  account_id: string; backup_id: string; reason: BackupReason; revision: number;
  schema_version: number; content_version: string; rules_version: string; content_hash: string;
  state: unknown; state_hash: string; signature: string | null; key_version: number | null; created_at: string;
}
export interface MaintenanceCommit extends InitialSaveCommit {
  expected_revision: number; reason: BackupReason; backup_id: string;
}
