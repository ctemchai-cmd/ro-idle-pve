/** Opt-in integration against an explicitly marked isolated test project.
 * Creates only run-owned throwaway identities/rows; removes them in finally.
 * Does not apply migrations, send email, initialize game wallets or touch prod.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { createHash, createHmac } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { readServerAuthConfig } from '../../src/server/auth/config.ts';
import { createApi } from '../../api/index.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { canonical } from '../../src/content/value.ts';
import type { CreateAccountCommand } from '../../src/domain/account/initialize.ts';
import { DemoSession } from '../../src/client/demo.ts';

const env = process.env, config = readServerAuthConfig(env);
const evidencePrefix = env.RO_EVIDENCE_PREFIX ?? 'task-021';
if (!/^task-[0-9]{3}$/.test(evidencePrefix)) throw new Error('INVALID_EVIDENCE_PREFIX');
const local = env.RO_SUPABASE_LOCAL_STACK === '1' && config.kind === 'configured' && new URL(config.config.url).hostname === '127.0.0.1';
if (env.RO_RUN_SUPABASE_INTEGRATION !== '1' || env.APP_ENV !== 'test' || config.kind !== 'configured' || config.config.environment !== 'test' || config.config.project_ref === 'local' && !local || !env.VITE_SUPABASE_PUBLISHABLE_KEY || !local && env.SUPABASE_TEST_PROJECT_REF === env.SUPABASE_PRODUCTION_PROJECT_REF) throw new Error('ISOLATED_TEST_PROJECT_OPT_IN_REQUIRED');
const settings = config.config;
const admin = createClient(settings.url, settings.service_key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: marker, error: markerError } = await admin.rpc('game_assert_environment', { expected_environment: 'test', expected_project_ref: settings.project_ref });
if (markerError || marker !== true) throw new Error('TEST_DATABASE_MARKER_REQUIRED');

const checks: string[] = [], users: { id: string; email: string; password: string }[] = [], runId = randomUUID();
const sources = ['scripts/game/test-supabase.ts', 'supabase/migrations/202610190001_game_storage.sql', 'supabase/migrations/202610190002_account_creation.sql', 'supabase/migrations/202610190003_save_context.sql', 'supabase/migrations/202610200004_command_commits.sql', 'src/domain/account/commands.ts', 'src/domain/account/creation.ts', 'src/domain/account/initialize.ts', 'src/server/persistence/supabase.ts', 'src/server/auth/index.ts', 'api/index.ts'];
const hashes: Record<string, string> = {};
for (const path of sources) hashes[path] = createHash('sha256').update(await readFile(path)).digest('hex');
function expect(ok: unknown, code: string): asserts ok { if (!ok) throw new Error(code); }
function publicClient() { return createClient(settings.url, env.VITE_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }); }
const clients = [publicClient(), publicClient()];
let failure: string | null = null;
let failure_details: { status: number; code: string | null } | null = null;
const cleanupErrors: string[] = [];
try {
  for (let i = 0; i < 2; i++) {
    const email = `ro-idle-${runId}-${i}@example.invalid`, password = randomBytes(32).toString('base64url');
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { ro_idle_test_run: runId } });
    expect(!error && data.user, 'TEST_USER_CREATION_FAILED'); users.push({ id: data.user.id, email, password });
    const login = await clients[i]!.auth.signInWithPassword({ email, password }); expect(!login.error && login.data.user?.id === data.user.id, 'PASSWORD_SIGNIN_FAILED');
  }
  checks.push('Two throwaway identities sign in with email/password against real Auth');
  const api = createApi(env);
  const before = await clients[0]!.auth.getSession();
  const token = before.data.session?.access_token; expect(token, 'NO_ACCESS_TOKEN');
  const absent = await api.fetch(new Request('http://localhost/api/account', { headers: { authorization: `Bearer ${token}` } }));
  if (absent.status !== 404) { const body = await absent.json() as { code?: unknown }; failure_details = { status: absent.status, code: typeof body.code === 'string' && /^[A-Z_]+$/.test(body.code) ? body.code : null }; }
  expect(absent.status === 404, 'UNINITIALIZED_ACCOUNT_MUST_NOT_CREATE_WALLET');
  const content = loadValidatedContent(); expect(content.ok, 'CONTENT_INVALID');
  const creationRequestId = randomUUID();
  for (const [index, user] of users.entries()) {
    const userToken = (await clients[index]!.auth.getSession()).data.session?.access_token; expect(userToken, 'USER_TOKEN_MISSING');
    const command: CreateAccountCommand = { type: 'account.create', params: { root_job_id: index === 0 ? 'mage' : 'swordsman', gender: 'female' }, request_id: creationRequestId, expected_revision: 0, schema_version: 1, content_hash: content.value.manifest.content_hash, content_version: content.value.manifest.content_version, rules_version: content.value.manifest.rules_version };
    const send = (body: unknown) => {
      const request = new Request((local ? settings.url : 'http://localhost') + '/api/commands?account_id=' + users[1 - index]!.id, { method: 'POST', headers: { authorization: `Bearer ${userToken}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
      return local ? fetch(request) : api.fetch(request);
    };
    const forged = await send({ ...command, account_id: users[1 - index]!.id, wallet: { gold: 999999 } }); expect(forged.status === 400, 'FORGED_CREATION_ACCEPTED');
    const replies = await Promise.all([send(command), send(command)]); expect(replies.every(reply => reply.status === 200), 'ACCOUNT_CREATE_API_FAILED');
    const receipts = await Promise.all(replies.map(reply => reply.json())); expect(canonical(receipts[0]) === canonical(receipts[1]), 'CONCURRENT_CREATION_NOT_IDEMPOTENT');
    expect((await send(command)).status === 200, 'CREATION_REPLAY_FAILED');
    expect((await send({ ...command, params: { ...command.params, gender: 'male' } })).status === 409, 'CHANGED_REQUEST_PAYLOAD_ACCEPTED');
    expect((await send({ ...command, request_id: randomUUID() })).status === 409, 'STARTER_GRANT_REPEATED');
    const saved = await admin.from('game_saves').select('*').eq('account_id', user.id).single();
    expect(!saved.error && saved.data.revision === 1 && saved.data.state.wallet.gold === 1000 && saved.data.state.roster.length === 7 && saved.data.state.inventory.length === 0 && saved.data.state.roster.every((actor: { equipment: Record<string, string | null> }) => Object.values(actor.equipment).every(id => id === null)) && !('account_id' in saved.data.state), 'CANONICAL_INITIAL_STATE_INVALID');
    const stateHash = createHash('sha256').update(canonical(saved.data.state)).digest('hex'); expect(stateHash === saved.data.state_hash, 'STATE_HASH_INVALID');
    const history = await admin.from('game_save_history').select('*').eq('account_id', user.id).single(); expect(!history.error, 'CREATION_HISTORY_MISSING');
    const context = await admin.rpc('game_load_context', { p_account_id: user.id, p_environment: 'test', p_project_ref: settings.project_ref });
    expect(!context.error && Number.isFinite(Date.parse(context.data.server_at)) && context.data.save.account_id === user.id && context.data.save.revision === context.data.history.revision, 'DATABASE_CONTEXT_INVALID');
    const privateContext = await clients[index]!.rpc('game_load_context', { p_account_id: user.id, p_environment: 'test', p_project_ref: settings.project_ref }); expect(privateContext.error, 'CLIENT_CONTEXT_RPC_ACCEPTED');
    const signature = createHmac('sha256', env.SAVE_SIGNING_KEY!).update(canonical({ account_id: user.id, revision: 1, state_hash: stateHash, content_hash: content.value.manifest.content_hash, schema_version: 1, key_version: 1 })).digest('base64url'); expect(signature === history.data.signature, 'HISTORY_SIGNATURE_INVALID');
    const checkpoint = await admin.from('game_battle_checkpoints').insert({ account_id: user.id, battle_id: randomUUID(), payload: {}, content_hash: content.value.manifest.content_hash, last_ack_at: new Date().toISOString(), lease_expires_at: new Date(Date.now() + 15000).toISOString() }); expect(!checkpoint.error, 'CHECKPOINT_STORAGE_FIXTURE_FAILED');
    const denied = await clients[index]!.rpc('game_create_account', { p_account_id: user.id, p_request_id: command.request_id, p_request_hash: 'a'.repeat(64), p_state: {}, p_state_hash: 'a'.repeat(64), p_receipt: {}, p_signature: 'forged', p_key_version: 1, p_schema_version: 1, p_content_version: 'forged', p_rules_version: 'forged', p_content_hash: 'a'.repeat(64), p_environment: 'test', p_project_ref: settings.project_ref }); expect(denied.error, 'CLIENT_PRIVILEGED_CREATION_RPC_ACCEPTED');
  }
  checks.push('Verified-UID account.create writes canonical seven-character state with no starter equipment (D-059), signed history and receipt atomically; concurrent/repeated requests grant once; forged owner/wallet and raw privileged RPC rejected');
  for (const [index, client] of clients.entries()) {
    for (const table of ['game_saves', 'game_command_receipts', 'game_save_history', 'game_battle_checkpoints']) {
      const own = await client.from(table).select('account_id'); expect(!own.error && own.data.length === 1 && own.data[0]?.account_id === users[index]!.id, 'OWNER_TABLE_READ_FAILED');
      const other = await client.from(table).select('account_id').eq('account_id', users[1 - index]!.id); expect(!other.error && other.data.length === 0, 'OTHER_OWNER_VISIBLE');
    }
    const rpc = await client.rpc('game_read_own_save'); expect(!rpc.error && rpc.data.length === 1 && rpc.data[0]?.account_id === users[index]!.id, 'RPC_OWNER_READ_FAILED');
    const direct = await client.from('game_saves').update({ revision: 99 }).eq('account_id', users[index]!.id); expect(direct.error, 'RAW_CLIENT_WRITE_ACCEPTED');
    const privileged = await client.rpc('game_assert_environment', { expected_environment: 'test', expected_project_ref: settings.project_ref }); expect(privileged.error, 'PRIVILEGED_RPC_ACCESSIBLE');
  }
  checks.push('Actual JWT/PostgREST RLS: both owners read own four tables/RPC; other owners hidden; direct raw writes and privileged RPC denied');
  const anon = publicClient();
  for (const table of ['game_saves', 'game_command_receipts', 'game_save_history', 'game_battle_checkpoints', 'game_deployment']) expect((await anon.from(table).select('*')).error, 'ANONYMOUS_TABLE_ACCESSIBLE');
  expect((await anon.rpc('game_read_own_save')).error, 'ANONYMOUS_RPC_ACCESSIBLE');
  expect((await api.fetch(new Request('http://localhost/api/account'))).status === 401, 'ANONYMOUS_API_AUTHORIZED');
  expect((await api.fetch(new Request('http://localhost/api/commands', { method: 'POST', body: '{}' }))).status === 401, 'ANONYMOUS_API_WRITE_AUTHORIZED');
  expect((await api.fetch(new Request('http://localhost/api/account', { headers: { authorization: 'Bearer invalid.fixture.jwt' } }))).status === 401, 'INVALID_BEARER_AUTHORIZED');
  const owned = await api.fetch(new Request(`http://localhost/api/account?account_id=${users[1]!.id}`, { headers: { authorization: `Bearer ${token}` } }));
  expect(owned.status === 200 && (await owned.json()).save.account_id === users[0]!.id, 'VERIFIED_IDENTITY_NOT_SCOPED');
  checks.push('Anonymous/invalid JWT API denied; caller-supplied account ID cannot redirect own save read');
  if (['task-022', 'task-023', 'task-024', 'task-025'].includes(evidencePrefix)) {
    const send = (body: unknown) => {
      const request = new Request((local ? settings.url : 'http://localhost') + '/api/commands', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
      return local ? fetch(request) : api.fetch(request);
    };
    const getCheckpoint = () => {
      const request = new Request((local ? settings.url : 'http://localhost') + '/api/checkpoint', { headers: { authorization: `Bearer ${token}` } });
      return local ? fetch(request) : api.fetch(request);
    };
    const initialCheckpoint = await getCheckpoint(); expect(initialCheckpoint.status === 200, 'SIGNED_CHECKPOINT_FAILED');
    const initialBody = await initialCheckpoint.json(); expect(initialBody.checkpoint.save.revision === 1 && initialBody.checkpoint.save.state.roster.length === 7 && initialBody.checkpoint.history.signature, 'SIGNED_CHECKPOINT_INCOMPLETE');
    // Run-owned server fixture only: emulate a fixed reward already reserved by
    // a mode reducer. No raw state upload is available to the player API.
    const fixture = structuredClone(initialBody.checkpoint.save.state);
    const resourceVector = Object.fromEntries(Object.keys(fixture.wallet).map(k => [k, k === 'gold' ? 100 : 0]));
    fixture.pending_rewards.push({ claim_id: 'fixed_protocol_claim', kind: 'farm', resource_vector: resourceVector, items: [], content_version: content.value.manifest.content_version, reserved_at: new Date().toISOString(), source_keys: ['fixture:reserved_interval_0_1000'], status: 'pending' });
    const fixtureHash = createHash('sha256').update(canonical(fixture)).digest('hex');
    const fixtureSignature = createHmac('sha256', env.SAVE_SIGNING_KEY!).update(canonical({ account_id: users[0]!.id, revision: 1, state_hash: fixtureHash, content_hash: content.value.manifest.content_hash, schema_version: 1, key_version: 1 })).digest('base64url');
    expect(!(await admin.from('game_saves').update({ state: fixture, state_hash: fixtureHash }).eq('account_id', users[0]!.id)).error, 'FIXTURE_SAVE_FAILED');
    expect(!(await admin.from('game_save_history').update({ state: fixture, state_hash: fixtureHash, signature: fixtureSignature }).eq('account_id', users[0]!.id).eq('revision', 1)).error, 'FIXTURE_HISTORY_FAILED');
    const intent = { type: 'reward.claim', params: { claim_id: 'fixed_protocol_claim' }, request_id: randomUUID(), expected_revision: 1, schema_version: 1, content_hash: content.value.manifest.content_hash, content_version: content.value.manifest.content_version, rules_version: content.value.manifest.rules_version };
    const competing = { ...intent, request_id: randomUUID() };
    const race = await Promise.all([send(intent), send(competing)]); expect(race.filter(r => r.status === 200).length === 1 && race.filter(r => r.status === 409).length === 1, 'RECURRING_CAS_RACE_FAILED');
    const winner = race[0]!.status === 200 ? intent : competing;
    const original = await (race[0]!.status === 200 ? race[0]! : race[1]!).json();
    expect(canonical(await (await send(winner)).json()) === canonical(original), 'RECURRING_RECEIPT_REPLAY_FAILED');
    expect((await send({ ...winner, params: { claim_id: 'changed' } })).status === 409, 'RECURRING_HASH_REUSE_ACCEPTED');
    const latest = await (await getCheckpoint()).json();
    expect(latest.checkpoint.save.revision === 2 && latest.checkpoint.save.state.wallet.gold === 1100 && latest.checkpoint.save.state.pending_rewards.length === 0, 'FIXED_REWARD_PAID_TWICE');
    expect(latest.checkpoint.history.revision === 2 && canonical(latest.checkpoint.save.state.roster) === canonical(fixture.roster) && canonical(latest.checkpoint.save.state.inventory) === canonical(fixture.inventory), 'CHECKPOINT_LOST_ACCOUNT_FIELDS');
    const rejectedIntent = { ...winner, request_id: randomUUID(), expected_revision: 2 };
    const rejection = await (await send(rejectedIntent)).json(); expect(rejection.receipt.outcome === 'rejected' && rejection.receipt.committed_revision === 2, 'BUSINESS_REJECTION_MUTATED_REVISION');
    expect(canonical(await (await send(rejectedIntent)).json()) === canonical(rejection), 'REJECTED_RECEIPT_NOT_IMMUTABLE');
    const badState = structuredClone(latest.checkpoint.save.state); badState.wallet.gold += 99;
    const faultId = randomUUID(), faultReceipt = { ...original.receipt, request_id: faultId, request_hash: 'd'.repeat(64), committed_revision: 3 };
    const rpcArgs = { p_account_id: users[0]!.id, p_request_id: faultId, p_request_hash: 'd'.repeat(64), p_expected_revision: 2, p_state: badState, p_state_hash: createHash('sha256').update(canonical(badState)).digest('hex'), p_receipt: faultReceipt, p_signature: '', p_key_version: 1, p_schema_version: 1, p_content_version: content.value.manifest.content_version, p_rules_version: content.value.manifest.rules_version, p_content_hash: content.value.manifest.content_hash, p_battle_write: { kind: 'keep' }, p_environment: 'test', p_project_ref: settings.project_ref };
    expect((await admin.rpc('game_commit_command', rpcArgs)).error, 'SQL_FAULT_NOT_REJECTED');
    expect((await clients[0]!.rpc('game_commit_command', rpcArgs)).error, 'PLAYER_RECURRING_RPC_ACCEPTED');
    const afterFault = await (await getCheckpoint()).json(); expect(afterFault.checkpoint.save.revision === 2 && afterFault.checkpoint.save.state.wallet.gold === 1100, 'SQL_FAULT_PARTIAL_COMMIT');
    expect((await admin.from('game_command_receipts').select('*').eq('account_id', users[0]!.id).eq('request_id', faultId)).data?.length === 0, 'SQL_FAULT_LEFT_RECEIPT');
    checks.push('Recurring verified-UID HTTP commands: fixed reward paid once; two-request revision CAS; replay after lost response; changed payload rejected; immutable rejected receipt; complete signed checkpoint; invalid-history fault rolls back save and receipt; player RPC denied');
    const reservedFixture = structuredClone(afterFault.checkpoint.save.state), reserveAt = Date.parse(afterFault.checkpoint.server_at);
    reservedFixture.farm.reserved_through = new Date(reserveAt - 20 * 3600000).toISOString();
    reservedFixture.farm.rate_snapshot = { chapter: 1, stage_id: '1-1', content_version: content.value.manifest.content_version, rules_version: content.value.manifest.rules_version, per_hour: { ...Object.fromEntries(Object.keys(resourceVector).map(k => [k, 0])), gold: 3600 }, gear_tier: 1, rarity_weights: (content.value.documents['loot.json']!.gear as any).rarity_weights, definition_pool: Object.values(content.value.items).filter(i => i.kind === 'equipment' && i.tier_level === 1).map(i => String(i.id)) };
    const fixtureContentHash = content.value.manifest.content_hash;
    async function fixtureState(accountId: string, revision: number, state: unknown) {
      const h = createHash('sha256').update(canonical(state)).digest('hex'), signature = createHmac('sha256', env.SAVE_SIGNING_KEY!).update(canonical({ account_id: accountId, revision, state_hash: h, content_hash: fixtureContentHash, schema_version: 1, key_version: 1 })).digest('base64url');
      expect(!(await admin.from('game_saves').update({ state, state_hash: h }).eq('account_id', accountId)).error, 'FIXTURE_SAVE_FAILED');
      expect(!(await admin.from('game_save_history').update({ state, state_hash: h, signature }).eq('account_id', accountId).eq('revision', revision)).error, 'FIXTURE_HISTORY_FAILED');
    }
    await fixtureState(users[0]!.id, 2, reservedFixture);
    const farmIntent = { ...intent, type: 'farm.claim', params: {}, request_id: randomUUID(), expected_revision: 2 };
    const farmResponse = await send(farmIntent); expect(farmResponse.status === 200, 'FARM_RESERVE_HTTP_FAILED'); const farmReceipt = await farmResponse.json(); expect(farmReceipt.receipt.outcome === 'committed', 'FARM_RESERVE_REJECTED');
    const reserved = await (await getCheckpoint()).json(), farmClaim = reserved.checkpoint.save.state.pending_rewards[0];
    expect(reserved.checkpoint.save.revision === 3 && farmClaim.resource_vector.gold === 43200 && farmClaim.items.length === 144 && reserved.checkpoint.save.state.farm.loot_rng.draw_count === 288 && reserved.checkpoint.save.state.wallet.gold === 1100, 'AFK_CAP_OR_RESERVATION_FAILED');
    expect(canonical(await (await send(farmIntent)).json()) === canonical(farmReceipt), 'FARM_RESERVATION_REPLAY_FAILED');
    const payout = { ...intent, type: 'reward.claim', params: { claim_id: farmClaim.claim_id }, request_id: randomUUID(), expected_revision: 3 }; const payoutResponse = await send(payout); expect(payoutResponse.status === 200 && (await payoutResponse.json()).receipt.outcome === 'committed', 'AFK_PAYOUT_FAILED');
    const paidFarm = await (await getCheckpoint()).json(); expect(paidFarm.checkpoint.save.revision === 4 && paidFarm.checkpoint.save.state.wallet.gold === 44300 && paidFarm.checkpoint.save.state.inventory.length === 186 && paidFarm.checkpoint.save.state.pending_rewards.length === 0, 'AFK_PAYOUT_DUPLICATED');
    const nextFarm = await send({ ...farmIntent, request_id: randomUUID(), expected_revision: 4 }); expect(nextFarm.status === 200, 'NEXT_FARM_INTERVAL_FAILED');
    const unpaid = await (await getCheckpoint()).json(); expect(unpaid.checkpoint.save.state.farm.loot_rng.draw_count === 288 && unpaid.checkpoint.save.state.pending_rewards.reduce((n: number, c: any) => n + c.resource_vector.gold, 0) < 60, 'AFK_CURSOR_OVERLAP');
    checks.push('Actual farm reservation atomically persists12h capped frozen rewards+144gear/288RNG draws and cursor; lost response replay never rerolls; payout applies once; next online reservation includes only unpaid time');
    const otherToken = (await clients[1]!.auth.getSession()).data.session!.access_token, owner = users[1]!.id;
    const secondContext = await admin.rpc('game_load_context', { p_account_id: owner, p_environment: 'test', p_project_ref: settings.project_ref }); expect(!secondContext.error, 'BATTLE_CONTEXT_FIXTURE_FAILED');
    const nowMs = Date.parse(secondContext.data.server_at), battleId = randomUUID(), lastAck = new Date(nowMs - 2000).toISOString(), lease = new Date(nowMs + 13000).toISOString(), battleState = new DemoSession('boss', 2).initial;
    const ownerState = secondContext.data.save.state;
    ownerState.active_battle = { battle_id: battleId, mode: 'story', mode_ref: 'protocol-fixture', ticket_day: null, started_at: lastAck, last_ack_at: lastAck, lease_expires_at: lease, content_hash: content.value.manifest.content_hash, content_version: content.value.manifest.content_version, rules_version: content.value.manifest.rules_version };
    await fixtureState(owner, 1, ownerState);
    expect(!(await admin.from('game_battle_checkpoints').insert({ account_id: owner, battle_id: battleId, payload: battleState, content_hash: content.value.manifest.content_hash, last_ack_at: lastAck, lease_expires_at: lease })).error, 'BATTLE_CHECKPOINT_FIXTURE_FAILED');
    const secondSend = (body: unknown) => { const r = new Request((local ? settings.url : 'http://localhost') + '/api/commands', { method: 'POST', headers: { authorization: `Bearer ${otherToken}`, 'content-type': 'application/json' }, body: JSON.stringify(body) }); return local ? fetch(r) : api.fetch(r); };
    const advance = { ...intent, type: 'battle.advance', params: { battle_id: battleId, requested_game_ms: 90000 }, request_id: randomUUID(), expected_revision: 1 };
    const advanceResponse = await secondSend(advance); expect(advanceResponse.status === 200, 'BATTLE_ADVANCE_HTTP_FAILED'); const advanceReceipt = await advanceResponse.json(); expect(advanceReceipt.receipt.outcome === 'committed', 'BATTLE_ADVANCE_REJECTED');
    const checkpointRow = await admin.from('game_battle_checkpoints').select('*').eq('account_id', owner).eq('battle_id', battleId).single();
    expect(!checkpointRow.error && checkpointRow.data.payload.game_time_ms >= 2000 && checkpointRow.data.payload.game_time_ms <= 5000 && checkpointRow.data.payload.checkpoint_barrier, 'BATTLE_REAL_TIME_CREDIT_FAILED');
    expect(canonical(await (await secondSend(advance)).json()) === canonical(advanceReceipt), 'BATTLE_REPLAY_FAILED');
    const retreat = await secondSend({ ...advance, type: 'battle.retreat', params: { battle_id: battleId }, request_id: randomUUID(), expected_revision: 2 }); expect(retreat.status === 200 && (await retreat.json()).receipt.outcome === 'committed', 'BATTLE_RETREAT_FAILED');
    expect((await admin.from('game_battle_checkpoints').select('*').eq('account_id', owner).eq('battle_id', battleId)).data?.length === 0, 'BATTLE_CHECKPOINT_NOT_REMOVED');
    const retreated = await admin.from('game_saves').select('state,revision').eq('account_id', owner).single(); expect(retreated.data?.revision === 3 && retreated.data?.state.active_battle === null && retreated.data?.state.wallet.gold === 1000, 'BATTLE_RETREAT_PARTIAL_COMMIT');
    checks.push('Actual server battle.advance restores canonical checkpoint, grants only DB elapsed time rather than requested90000, atomically saves lease/checkpoint/history and replay; retreat atomically clears pointer/checkpoint without kill-based income');
  }
  const refreshed = await clients[0]!.auth.refreshSession(); expect(!refreshed.error && refreshed.data.user?.id === users[0]!.id, 'SESSION_REFRESH_FAILED');
  const link = await admin.auth.admin.generateLink({ type: 'recovery', email: users[0]!.email });
  expect(!link.error && link.data.properties?.hashed_token, 'RECOVERY_LINK_GENERATION_FAILED');
  const recovered = await clients[0]!.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'recovery' }); expect(!recovered.error && recovered.data.user?.id === users[0]!.id, 'RECOVERY_TOKEN_FAILED');
  const newPassword = randomBytes(32).toString('base64url'); expect(!(await clients[0]!.auth.updateUser({ password: newPassword })).error, 'RECOVERY_PASSWORD_UPDATE_FAILED');
  expect(!(await clients[0]!.auth.signOut({ scope: 'local' })).error && !(await clients[0]!.auth.getSession()).data.session, 'SIGNOUT_FAILED');
  expect((await clients[0]!.auth.signInWithPassword({ email: users[0]!.email, password: users[0]!.password })).error, 'OLD_PASSWORD_ACCEPTED');
  expect(!(await clients[0]!.auth.signInWithPassword({ email: users[0]!.email, password: newPassword })).error, 'NEW_PASSWORD_REJECTED');
  checks.push('Real session refresh/logout and one-use provider recovery token changes password; old password fails, new password signs in');
} catch (error) { failure = error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : 'SUPABASE_TEST_FAILED_REDACTED'; }
finally {
  for (const client of clients) { try { await client.auth.signOut({ scope: 'local' }); } catch { /* Deleting run-owned users below revokes their refresh sessions. */ } }
  for (const user of users) { try { if ((await admin.auth.admin.deleteUser(user.id)).error) cleanupErrors.push('RUN_OWNED_USER_DELETE_FAILED'); } catch { cleanupErrors.push('RUN_OWNED_USER_DELETE_FAILED'); } }
  const report = { task_id: evidencePrefix.toUpperCase(), passed: !failure && !cleanupErrors.length, actual_supabase_auth: true, self_hosted_local: local, checks, failure, failure_details, cleanup_errors: cleanupErrors, source_sha256: hashes, limitations: ['No SMTP/browser redirect delivery test in this script; recovery uses admin-generated token, never sends email.', 'Recurring command/farm/battle protocol uses server-owned fixtures in TASK-022/023 runs; completed mode factories/settlement remain TASK-025/035/036.', 'Browser session-expiry behavior has separate UI tests.'], credentials_logged: false };
  await writeFile(`plan/evidence/${evidencePrefix}-supabase${local ? '-local' : ''}.json`, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report));
  if (!report.passed) process.exitCode = 1;
}
