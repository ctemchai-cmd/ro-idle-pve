// Operator-only SQL preparation. Never imported by the browser or a public API.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import type { Receipt } from '../../src/contracts/index.ts';
import type { SaveContext } from '../../src/contracts/save.ts';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function cloudProjectRef(url: string): string {
  let value: URL; try { value = new URL(url); } catch { throw new Error('INVALID_TARGET_PROJECT_URL'); }
  const match = /^([a-z0-9]{12,40})\.supabase\.co$/.exec(value.hostname);
  if (value.protocol !== 'https:' || value.username || value.password || value.port || value.search || value.hash || value.pathname !== '/' || !match) throw new Error('INVALID_TARGET_PROJECT_URL');
  return match[1]!;
}

export function prepareCloudTransfer(context: SaveContext, signingKey: string, target: { project_url: string; account_id: string; request_id: string }) {
  if (signingKey.length < 32 || /[\r\n]/.test(signingKey)) throw new Error('SIGNING_KEY_NOT_CONFIGURED');
  const project = cloudProjectRef(target.project_url);
  if (!uuid.test(target.account_id) || !uuid.test(target.request_id)) throw new Error('INVALID_TARGET_ID');
  target = { ...target, account_id: target.account_id.toLowerCase(), request_id: target.request_id.toLowerCase() };
  const { save, history } = context;
  if (!save || !history || !uuid.test(save.account_id) || history.account_id !== save.account_id || history.revision !== save.revision || !Number.isSafeInteger(save.revision) || save.revision < 1 || save.schema_version !== 1 || history.key_version !== 1 || typeof history.signature !== 'string') throw new Error('SOURCE_TIP_INVALID');
  if (!Number.isFinite(Date.parse(context.server_at))) throw new Error('SOURCE_CLOCK_INVALID');
  const rules = new AccountCommandRules();
  const sha = (value: unknown) => createHash('sha256').update(rules.canonical(value)).digest('hex');
  if (sha(save.state) !== save.state_hash || sha(history.state) !== save.state_hash || history.state_hash !== save.state_hash) throw new Error('SOURCE_HASH_INVALID');
  const sign = (account: string) => createHmac('sha256', signingKey).update(rules.canonical({ account_id: account, revision: save.revision, state_hash: save.state_hash, content_hash: save.content_hash, schema_version: 1, key_version: 1 })).digest('base64url');
  const actual = Buffer.from(history.signature), expected = Buffer.from(sign(save.account_id));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('SOURCE_SIGNATURE_INVALID');
  if (Object.entries(rules.versions).some(([key, value]) => save[key as keyof typeof rules.versions] !== value)) throw new Error('SOURCE_CONTENT_MISMATCH');
  let state; try { state = rules.validateAccount(save.state); } catch { throw new Error('SOURCE_STATE_INVALID'); }
  if (state.active_battle || context.battle) throw new Error('FINISH_OR_RETREAT_BATTLE_BEFORE_TRANSFER');
  const signature = sign(target.account_id);
  const requestHash = sha({ operation: 'operator.cloud_transfer', source_account: save.account_id, source_revision: save.revision, state_hash: save.state_hash, target_account: target.account_id, target_project: project });
  const outerTag = `$operator_${requestHash.slice(0, 24)}$`;
  const receipt: Receipt = { request_id: target.request_id, request_hash: requestHash, outcome: 'committed', committed_revision: save.revision, server_at: context.server_at, ...rules.versions, schema_version: 1, command_type: 'save.migrate', result: { code: 'LOCAL_SAVE_IMPORTED', resource_delta: Object.fromEntries(Object.keys(state.wallet).map(k => [k, 0])) as typeof state.wallet, created_instance_ids: [], removed_instance_ids: [], pending_claim_ids: state.pending_rewards.map(r => r.claim_id), battle_id: null, reason_key: 'operator_cloud_transfer', ledger_entry_ids: [], refunded_ledger_entries: [] } };
  const dollar = (value: unknown) => {
    const text = JSON.stringify(value), tag = `$cloud_${sha(value).slice(0, 24)}$`;
    if (text.includes(tag) || text.includes(outerTag)) throw new Error('UNSAFE_SQL_PAYLOAD');
    return `${tag}${text}${tag}::jsonb`;
  };
  // One transaction and the same owner lock as account.create. Exact receipt replay is a no-op,
  // including after the imported account has progressed. A different save is never overwritten.
  const sql = `-- PRIVATE operator import: current save only; never commit or expose this file.\nBEGIN;\nSET LOCAL lock_timeout = '5s';\nDO ${outerTag}\nDECLARE prior_hash text; applied_at timestamptz := clock_timestamp();\nBEGIN\n  PERFORM public.game_assert_environment('production', '${project}');\n  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('${target.account_id}', 0));\n  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '${target.account_id}') THEN RAISE EXCEPTION 'TARGET_AUTH_USER_MISSING'; END IF;\n  SELECT request_hash INTO prior_hash FROM public.game_command_receipts WHERE account_id = '${target.account_id}' AND request_id = '${target.request_id}';\n  IF FOUND THEN\n    IF prior_hash <> '${requestHash}' THEN RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSE'; END IF;\n    RETURN;\n  END IF;\n  IF EXISTS (SELECT 1 FROM public.game_saves WHERE account_id = '${target.account_id}') THEN RAISE EXCEPTION 'TARGET_ALREADY_HAS_SAVE'; END IF;\n  IF (${dollar(state)} #>> '{farm,reserved_through}')::timestamptz > applied_at THEN RAISE EXCEPTION 'TARGET_CLOCK_BEHIND_FARM_CURSOR'; END IF;\n  INSERT INTO public.game_saves(account_id,revision,schema_version,content_version,rules_version,content_hash,state,state_hash,updated_at)\n    VALUES ('${target.account_id}',${save.revision},1,'${save.content_version}','${save.rules_version}','${save.content_hash}',${dollar(state)},'${save.state_hash}',applied_at);\n  INSERT INTO public.game_save_history(account_id,revision,state,state_hash,signature,key_version,created_at)\n    VALUES ('${target.account_id}',${save.revision},${dollar(state)},'${save.state_hash}','${signature}',1,applied_at);\n  INSERT INTO public.game_command_receipts(account_id,request_id,request_hash,receipt,command_type,created_at)\n    VALUES ('${target.account_id}','${target.request_id}','${requestHash}',jsonb_set(${dollar(receipt)},'{server_at}',to_jsonb(to_char(applied_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))),'save.migrate',applied_at);\nEND;\n${outerTag};\nCOMMIT;\n`;
  return { sql, signature, receipt, report: { source_revision: save.revision, target_project_ref: project, target_account_id: target.account_id, transfer_id: target.request_id, state_hash: save.state_hash, content_hash: save.content_hash, state_preserved_exactly: true, history_scope: 'current signed tip; older receipts/history remain in local backup', signing_key_must_match_vercel: true } };
}

if (process.argv[1]?.endsWith('prepare-cloud-transfer.ts')) {
  try {
    const [input, output, projectUrl, account, requestId] = process.argv.slice(2);
    if (!input || !output || !projectUrl || !account || !requestId) throw new Error('USAGE: prepare-cloud-transfer.ts <context.json> <private.sql> <project-url> <target-user-id> <request-id>');
    for (const path of [input, output]) if (!resolve(path).startsWith(resolve('.local') + sep)) throw new Error('TRANSFER_FILES_MUST_STAY_IN_LOCAL');
    const result = prepareCloudTransfer(JSON.parse(readFileSync(input, 'utf8')) as SaveContext, process.env.SAVE_SIGNING_KEY ?? '', { project_url: projectUrl, account_id: account, request_id: requestId });
    writeFileSync(output, result.sql, { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify(result.report));
  } catch (error) {
    const code = error instanceof Error && /^[A-Z_ :<>.-]+$/.test(error.message) ? error.message : 'TRANSFER_PREPARATION_FAILED';
    console.error(code); process.exitCode = 1;
  }
}
