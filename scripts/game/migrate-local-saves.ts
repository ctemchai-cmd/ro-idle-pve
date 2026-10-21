// Local save carry-over across a content change (D-058, TASK-040 slice).
// Usage: SAVE_SIGNING_KEY=... node --import tsx scripts/game/migrate-local-saves.ts <saves.json> <out.sql>
// Reads exported game_saves rows, migrates + validates every state with the CURRENT code, and writes one
// transaction that appends a signed history revision and updates each save. Any invalid save aborts the run.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { loadValidatedContent } from '../../src/content/index.ts';

export interface SavedRow { account_id: string; revision: number; content_hash: string; content_version: string; rules_version: string; state: unknown }
export interface MigrationResult { sql: string; report: { account_id: string; from_revision: number; to_revision?: number; skipped?: string; changes?: string[] }[] }

export function migrationSql(rows: readonly SavedRow[], signingKey: string): MigrationResult {
  if (signingKey.length < 32) throw new Error('SIGNING_KEY_NOT_CONFIGURED');
  const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT_UNAVAILABLE');
  const rules = new AccountCommandRules(), versions = rules.versions, sha = (value: unknown) => createHash('sha256').update(rules.canonical(value)).digest('hex');
  for (const text of [versions.content_hash, versions.content_version, versions.rules_version]) if (!/^[A-Za-z0-9._-]+$/.test(text)) throw new Error('UNSAFE_VERSION_TEXT');
  const tag = `save_${randomBytes(8).toString('hex')}`, report: MigrationResult['report'] = [];
  let sql = 'begin;\n';
  for (const row of rows) {
    if (!/^[0-9a-f-]{36}$/.test(row.account_id) || !Number.isSafeInteger(row.revision) || row.revision < 1) throw new Error('INVALID_SAVE_ROW');
    if (row.content_hash === versions.content_hash && row.content_version === versions.content_version && row.rules_version === versions.rules_version) { report.push({ account_id: row.account_id, from_revision: row.revision, skipped: 'already current' }); continue; }
    const { state, changes } = migrateAccountState(row.state, loaded.value);
    rules.validateAccount(state);
    const revision = row.revision + 1, stateHash = sha(state), json = JSON.stringify(state);
    if (json.includes(`$${tag}$`)) throw new Error('UNSAFE_STATE_TEXT');
    const signature = createHmac('sha256', signingKey).update(rules.canonical({ account_id: row.account_id, revision, state_hash: stateHash, content_hash: versions.content_hash, schema_version: 1, key_version: 1 })).digest('base64url');
    sql += `delete from public.game_battle_checkpoints where account_id = '${row.account_id}';\n`;
    sql += `insert into public.game_save_history (account_id, revision, state, state_hash, signature, key_version) values ('${row.account_id}', ${revision}, $${tag}$${json}$${tag}$::jsonb, '${stateHash}', '${signature}', 1);\n`;
    sql += `update public.game_saves set revision = ${revision}, schema_version = 1, content_version = '${versions.content_version}', rules_version = '${versions.rules_version}', content_hash = '${versions.content_hash}', state = $${tag}$${json}$${tag}$::jsonb, state_hash = '${stateHash}', updated_at = clock_timestamp() where account_id = '${row.account_id}' and revision = ${row.revision};\n`;
    sql += `do $check$ begin if (select revision from public.game_saves where account_id = '${row.account_id}') <> ${revision} then raise exception 'SAVE_MIGRATION_RACE'; end if; end $check$;\n`;
    report.push({ account_id: row.account_id, from_revision: row.revision, to_revision: revision, changes });
  }
  return { sql: sql + 'commit;\n', report };
}

if (process.argv[1]?.endsWith('migrate-local-saves.ts')) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('USAGE: migrate-local-saves.ts <saves.json> <out.sql>');
  const result = migrationSql(JSON.parse(readFileSync(input, 'utf8')) as SavedRow[], process.env.SAVE_SIGNING_KEY ?? '');
  writeFileSync(output, result.sql, { mode: 0o600 });
  console.log(JSON.stringify({ migrated: result.report.filter(r => r.to_revision).length, skipped: result.report.filter(r => r.skipped).length, report: result.report.map(r => ({ ...r, account_id: r.account_id.slice(0, 8) })) }));
}
