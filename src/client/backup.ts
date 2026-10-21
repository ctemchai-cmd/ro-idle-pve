import { loadValidatedContent } from '../content/index.ts';
import { canonical } from '../content/value.ts';
import type { AccountState } from '../contracts/index.ts';
import type { SaveCheckpoint } from '../contracts/save.ts';
import { backupCompat, backupFile, backupRelation, parseBackupFile, saveSummary, type BackupCompat, type BackupFile, type BackupRelation, type SaveSummary } from '../domain/build/save-summary.ts';
import { sha256Hex } from './secure-context.ts';

const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT_UNAVAILABLE');
const manifest = loaded.value.manifest;
export type { BackupFile, SaveSummary };
export const clientContentHash = manifest.content_hash;

/** TASK-040 export: the signed cloud tip only (no battle, no credentials, no local edits). */
export function exportBackup(checkpoint: SaveCheckpoint, exportedAt: string): { file: BackupFile; name: string; text: string } {
  const file = backupFile(checkpoint.save, { signature: checkpoint.history.signature, key_version: checkpoint.history.key_version }, exportedAt);
  return { file, name: `ro-idle-backup-r${checkpoint.save.revision}-${exportedAt.slice(0, 10)}.json`, text: JSON.stringify(file, null, 1) };
}
export interface BackupInspection {
  ok: boolean; code: string | null; file: BackupFile | null; relation: BackupRelation | null; compat: BackupCompat | null;
  hash_ok: boolean; summary: SaveSummary | null; cloud: SaveSummary | null;
}
const digest = async (value: unknown) => sha256Hex(canonical(value as never));
/** Import preview: read and compare only. It never becomes a command payload. */
export async function inspectBackup(text: string, cloud: SaveCheckpoint | null): Promise<BackupInspection> {
  const empty: BackupInspection = { ok: false, code: null, file: null, relation: null, compat: null, hash_ok: false, summary: null, cloud: cloud ? safeSummary(cloud.save.state) : null };
  if (text.length > 4_000_000) return { ...empty, code: 'BACKUP_TOO_LARGE' };
  let raw: unknown; try { raw = JSON.parse(text); } catch { return { ...empty, code: 'NOT_JSON' }; }
  const parsed = parseBackupFile(raw); if (!parsed.ok) return { ...empty, code: parsed.code };
  const file = parsed.value, hashOk = await digest(file.save.state) === file.save.state_hash;
  return { ok: hashOk, code: hashOk ? null : 'BACKUP_HASH_MISMATCH', file, relation: cloud ? backupRelation(file, { account_id: cloud.save.account_id, revision: cloud.save.revision, state_hash: cloud.save.state_hash }) : null,
    compat: backupCompat(file, manifest), hash_ok: hashOk, summary: safeSummary(file.save.state), cloud: empty.cloud };
}
export function safeSummary(state: unknown): SaveSummary | null { try { return saveSummary(state as AccountState); } catch { return null; } }
