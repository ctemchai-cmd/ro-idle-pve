// Disposable PostgreSQL fixture driver only. No personal/cloud service credentials.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRecurringHandlers } from '../../api/index.ts';
import type { AccountState, Command } from '../../src/contracts/index.ts';
import type { AuthenticatedIdentity } from '../../src/contracts/auth.ts';
import type { SaveContext } from '../../src/contracts/save.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { prepareCloudTransfer } from './prepare-cloud-transfer.ts';
import { transferContext, transferKey, targetOwner, sourceOwner, transferTarget, transferProject, signTransferContext } from '../../tests/game/cloud-transfer-fixtures.ts';

if (process.env.RO_CLOUD_TRANSFER_TEST !== '1') throw new Error('DISPOSABLE_TRANSFER_TEST_REQUIRED');
const [mode, path, port] = process.argv.slice(2);
if (!path || !resolve(path).startsWith(resolve('.local/xt-'))) throw new Error('DISPOSABLE_TRANSFER_PATH_REQUIRED');
const quote = (value: unknown): string => value === null ? 'null' : typeof value === 'number' ? String(value) : typeof value === 'boolean' ? String(value) : `'${(typeof value === 'string' ? value : JSON.stringify(value)).replaceAll("'", "''")}'`;
if (mode === 'fixtures') {
  const context = transferContext(), data = JSON.stringify(context);
  writeFileSync(`${path}/fixture-context.json`, data, { mode: 0o600 });
  const c = `${quote(context)}::jsonb`;
  const sql = `WITH d AS (SELECT ${c} AS c) INSERT INTO public.game_saves SELECT (c#>>'{save,account_id}')::uuid,(c#>>'{save,revision}')::bigint,1,c#>>'{save,content_version}',c#>>'{save,rules_version}',c#>>'{save,content_hash}',c#>'{save,state}',c#>>'{save,state_hash}',(c#>>'{save,updated_at}')::timestamptz FROM d;\nWITH d AS (SELECT ${c} AS c) INSERT INTO public.game_save_history SELECT (c#>>'{history,account_id}')::uuid,(c#>>'{history,revision}')::bigint,c#>'{history,state}',c#>>'{history,state_hash}',c#>>'{history,signature}',1,(c#>>'{history,created_at}')::timestamptz FROM d;`;
  writeFileSync(`${path}/source.sql`, sql, { mode: 0o600 });
  const future = transferContext(); (future.save!.state as AccountState).farm.reserved_through = '2199-01-01T00:00:00.000Z'; signTransferContext(future);
  writeFileSync(`${path}/future.sql`, prepareCloudTransfer(future, transferKey, transferTarget).sql, { mode: 0o600 });
  console.log(JSON.stringify({ prepared: true, fixture: true, source_owner: sourceOwner, target_owner: targetOwner, project_ref: transferProject }));
} else if (mode === 'api') {
  if (!port || !/^\d+$/.test(port)) throw new Error('DISPOSABLE_PORT_REQUIRED');
  function sql(query: string): unknown {
    let output: string;
    try { output = execFileSync(`${process.env.RO_PG_BIN}/psql`, ['-X', '-qAt', '-h', path!, '-p', port!, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', query], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch { throw new Error('FIXTURE_SQL_FAILED'); }
    return output.trim() ? JSON.parse(output) : null;
  }
  assert.equal(sql(`select to_json(project_ref = '${transferProject}' and environment = 'production') from public.game_deployment`), true);
  const call = (name: string, args: Record<string, unknown>) => {
    assert.ok(['game_load_context', 'game_commit_command'].includes(name));
    assert.ok(Object.keys(args).every(k => /^p_[a-z_]+$/.test(k)));
    return sql(`select public.${name}(${Object.entries(args).map(([key, value]) => `${key} => ${quote(value)}`).join(',')})`);
  };
  const store = {
    async loadContext(identity: AuthenticatedIdentity) { return call('game_load_context', { p_account_id: identity.account_id, p_environment: 'production', p_project_ref: transferProject }) as SaveContext; },
    async readCreationReceipt(identity: AuthenticatedIdentity, requestId: string) { return sql(`select row_to_json(r) from (select request_hash,receipt from public.game_command_receipts where account_id = ${quote(identity.account_id)} and request_id = ${quote(requestId)}) r`) as { request_hash: string; receipt: never } | null; },
    async commitCommand(input: Record<string, unknown>) { return { data: call('game_commit_command', { ...Object.fromEntries(Object.entries(input).map(([key, value]) => [`p_${key}`, value])), p_environment: 'production', p_project_ref: transferProject }), error: null }; },
  };
  const rules = new AccountCommandRules(), api = createRecurringHandlers(store as never, transferKey), identity = { account_id: targetOwner } as AuthenticatedIdentity;
  const checkpoint = await api.checkpoint(identity); assert.equal(checkpoint.status, 200);
  const source = transferContext(), migrated = (checkpoint.body as { checkpoint: SaveContext }).checkpoint;
  assert.deepEqual(migrated.save!.state, source.save!.state);
  assert.equal(migrated.save!.revision, source.save!.revision);
  const state = migrated.save!.state as AccountState;
  const command = { type: 'equipment.lock', params: { item_instance_id: state.inventory[0]!.instance_id, locked: true }, request_id: '44444444-4444-4444-8444-444444444444', expected_revision: migrated.save!.revision, ...rules.versions, schema_version: 1 } as Command;
  const reply = await api.command(identity, command); assert.equal(reply.status, 200); assert.equal((reply.body as { receipt: { outcome: string } }).receipt.outcome, 'committed');
  const next = await store.loadContext(identity), nextState = next.save!.state as AccountState;
  assert.equal(next.save!.revision, migrated.save!.revision + 1); assert.equal(nextState.inventory[0]!.locked, true);
  for (const key of ['wallet', 'farm', 'paid_ledger', 'pending_rewards', 'roster', 'team', 'story', 'daily_records', 'gacha', 'shop'] as const) assert.deepEqual(nextState[key], state[key]);
  assert.equal((await api.checkpoint(identity)).status, 200);
  console.log(JSON.stringify({ passed: true, signed_checkpoint_loaded: true, post_transfer_command_committed: true, progressed_revision: next.save!.revision, preserved_farm_ledger_rewards: true, scope: 'Shared API handler + real PostgreSQL RPCs over an isolated socket adapter; not GoTrue/JWT/PostgREST or hosted Vercel.' }));
} else throw new Error('UNKNOWN_TRANSFER_TEST_MODE');
