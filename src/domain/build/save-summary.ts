import type { AccountState } from '../../contracts/index.ts';

/**
 * TASK-040 backup file format and the read-only save summary shown before any
 * overwrite. Pure and shared by client (export/preview) and server (backup list).
 * A file is only ever evidence: hashes/signatures are verified by the caller and
 * the server never writes a state uploaded from a file.
 */
export const BACKUP_FORMAT = 'ro-idle-classic-backup';
export type BackupReason = 'migration' | 'reset' | 'restore' | 'quarantine';
export interface SaveSummary {
  main_job: string; main_level: number; levels: { character_id: string; job_id: string; level: number }[];
  gold: number; crystal: number; hero_exp: number; items: number; cards: number;
  cleared_stages: number; last_stage: string | null; tower_floor: number;
}
export interface BackupEnvelope {
  account_id: string; revision: number; schema_version: number; content_version: string; rules_version: string;
  content_hash: string; state_hash: string; state: unknown; signature: string; key_version: number;
}
export interface BackupFile { format: typeof BACKUP_FORMAT; format_version: 1; exported_at: string; source: 'cloud_tip' | 'server_backup'; reason: BackupReason | null; save: BackupEnvelope }
export type BackupRelation = 'other_account' | 'same' | 'older' | 'newer_than_cloud' | 'diverged';
export type BackupCompat = 'current' | 'migratable' | 'unsupported';

export function saveSummary(state: AccountState): SaveSummary {
  const main = state.roster.find(actor => actor.character_id === 'main') ?? state.roster[0]!;
  return {
    main_job: main.job_id, main_level: main.level, levels: state.roster.map(actor => ({ character_id: actor.character_id, job_id: actor.job_id, level: actor.level })),
    gold: state.wallet.gold, crystal: state.wallet.crystal, hero_exp: state.wallet.hero_exp,
    items: state.inventory.filter(item => item.kind === 'equipment').length, cards: state.inventory.filter(item => item.kind === 'card').length,
    cleared_stages: state.story.cleared_stage_ids.length, last_stage: state.story.cleared_stage_ids.at(-1) ?? null, tower_floor: state.tower.highest_cleared_floor,
  };
}
export function backupFile(save: Omit<BackupEnvelope, 'signature' | 'key_version'>, signed: { signature: string; key_version: number }, exportedAt: string, source: BackupFile['source'] = 'cloud_tip', reason: BackupReason | null = null): BackupFile {
  return { format: BACKUP_FORMAT, format_version: 1, exported_at: exportedAt, source, reason, save: { account_id: save.account_id, revision: save.revision, schema_version: save.schema_version, content_version: save.content_version, rules_version: save.rules_version, content_hash: save.content_hash, state_hash: save.state_hash, state: save.state, signature: signed.signature, key_version: signed.key_version } };
}
const text = (value: unknown, max = 120) => typeof value === 'string' && value.length >= 1 && value.length <= max;
const hex64 = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
/** Shape-only check of an untrusted file; never trusts its numbers for anything but display and lookup. */
export function parseBackupFile(raw: unknown): { ok: true; value: BackupFile } | { ok: false; code: 'NOT_A_BACKUP' | 'UNSUPPORTED_BACKUP_FORMAT' | 'BACKUP_SHAPE_INVALID' } {
  if (!raw || typeof raw !== 'object' || (raw as { format?: unknown }).format !== BACKUP_FORMAT) return { ok: false, code: 'NOT_A_BACKUP' };
  const file = raw as Partial<BackupFile>;
  if (file.format_version !== 1) return { ok: false, code: 'UNSUPPORTED_BACKUP_FORMAT' };
  const save = file.save as Partial<BackupEnvelope> | undefined;
  const valid = !!save && typeof save === 'object' && text(save.account_id) && Number.isSafeInteger(save.revision) && save.revision! >= 1
    && Number.isSafeInteger(save.schema_version) && save.schema_version! >= 1 && text(save.content_version) && text(save.rules_version)
    && hex64(save.content_hash) && hex64(save.state_hash) && text(save.signature, 500) && Number.isSafeInteger(save.key_version)
    && !!save.state && typeof save.state === 'object' && !Array.isArray(save.state) && text(file.exported_at, 40) && (file.source === 'cloud_tip' || file.source === 'server_backup');
  return valid ? { ok: true, value: file as BackupFile } : { ok: false, code: 'BACKUP_SHAPE_INVALID' };
}
export function backupRelation(file: BackupFile, cloud: { account_id: string; revision: number; state_hash: string }): BackupRelation {
  if (file.save.account_id !== cloud.account_id) return 'other_account';
  if (file.save.revision === cloud.revision) return file.save.state_hash === cloud.state_hash ? 'same' : 'diverged';
  return file.save.revision < cloud.revision ? 'older' : 'newer_than_cloud';
}
export function backupCompat(file: BackupFile, versions: { content_hash: string; content_version: string; rules_version: string }): BackupCompat {
  if (file.save.schema_version !== 1) return 'unsupported';
  return file.save.content_hash === versions.content_hash && file.save.content_version === versions.content_version && file.save.rules_version === versions.rules_version ? 'current' : 'migratable';
}
