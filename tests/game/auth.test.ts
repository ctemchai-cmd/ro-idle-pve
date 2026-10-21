import test from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthProvider, ProviderEvent, ProviderSession } from '../../src/contracts/auth.ts';
import { AuthController } from '../../src/client/auth-controller.ts';
import { readPublicAuthConfig } from '../../src/client/auth-config.ts';
import { readServerAuthConfig } from '../../src/server/auth/config.ts';
import { authenticateRequest } from '../../src/server/auth/index.ts';
import { createApi } from '../../api/index.ts';
import { createAccountReader } from '../../src/client/account.ts';
import { containsPrivilegedValue, privilegedPublicNames } from '../../scripts/game/secret-guard.ts';
import { validateBuildEnvironment } from '../../scripts/game/validate-env.ts';
const uid = '11111111-1111-4111-8111-111111111111';
test('modern Supabase secret environment works and legacy local configuration remains compatible', () => {
  const secret = 'sb_secret_' + 'fixture_only_for_modern_configuration';
  const base = { APP_ENV: 'production', SUPABASE_URL: 'https://exampleprojectrefhere.supabase.co', SUPABASE_PRODUCTION_PROJECT_REF: 'exampleprojectrefhere' };
  const modern = readServerAuthConfig({ ...base, SUPABASE_SECRET_KEY: secret });
  assert.equal(modern.kind, 'configured');
  if (modern.kind === 'configured') assert.equal(modern.config.service_key, secret);
  assert.deepEqual(readServerAuthConfig({ ...base, SUPABASE_SERVICE_ROLE_KEY: secret }), modern);
  assert.deepEqual(readServerAuthConfig({ ...base, SUPABASE_SECRET_KEY: secret, SUPABASE_SERVICE_ROLE_KEY: secret + '_different' }), { kind: 'invalid', code: 'SERVER_AUTH_KEY_CONFLICT' });
  assert.equal(validateBuildEnvironment({ ...base, SUPABASE_SECRET_KEY: secret, VITE_SUPABASE_SECRET_KEY: secret }), 'PRIVILEGED_BROWSER_ENV_FORBIDDEN');
  assert.ok(containsPrivilegedValue(secret, { SUPABASE_SECRET_KEY: secret }));
});
const session = (): ProviderSession => ({ user: { id: uid, email: 'owner@example.invalid' }, access_token: 'private-user-token-fixture', expires_at: 200 });
function fixture() {
  let active: ProviderSession | null = null, listener: ((event: ProviderEvent, session: ProviderSession | null) => void) | null = null;
  const calls: unknown[] = [];
  const provider: AuthProvider = {
    async getSession() { return active; }, subscribe(value) { listener = value; return () => { listener = null; }; },
    async signIn(email, password) { calls.push([email, password]); active = session(); listener?.('SESSION', active); return active; },
    async signOut() { active = null; listener?.('SIGNED_OUT', null); },
    async resetPassword(email, url) { calls.push(['reset', email, url]); }, async updatePassword(password) { calls.push(['password', password]); },
  };
  const auth = new AuthController(provider, () => 100);
  return { auth, provider, calls, emit(event: ProviderEvent, value: ProviderSession | null) { active = value; listener?.(event, value); } };
}
test('password signin preserves password bytes, trims email, and never exposes token in UI snapshot', async () => {
  const f = fixture(); try { await f.auth.start(); assert.equal(f.auth.snapshot.status, 'signed_out'); assert.equal((await f.auth.signIn(' owner@example.invalid ', ' a secret ')).ok, true); assert.deepEqual(f.calls[0], ['owner@example.invalid', ' a secret ']); assert.equal(f.auth.snapshot.status, 'signed_in'); assert.ok(!JSON.stringify(f.auth.snapshot).includes('private-user-token')); assert.equal(await f.auth.getAccessToken(), 'private-user-token-fixture'); } finally { f.auth.dispose(); }
});
test('expired/unauthorized sessions return signin without authorizing another request', async () => {
  const f = fixture(); try { await f.auth.start(); await f.auth.signIn('owner@example.invalid', 'password'); f.emit('SESSION', { ...session(), expires_at: 99 }); assert.equal(f.auth.snapshot.reason, 'expired'); assert.equal(await f.auth.getAccessToken(), null); f.emit('SESSION', session()); f.auth.markUnauthorized(); assert.equal(await f.auth.getAccessToken(), null); } finally { f.auth.dispose(); }
});
test('password recovery persists across refresh and requires its own authenticated recovery session', async () => {
  const f = fixture(); try { await f.auth.start(); assert.equal((await f.auth.updatePassword('new-password')).ok, false); await f.auth.resetPassword(' owner@example.invalid ', 'http://localhost:5173/auth?mode=recovery'); f.emit('PASSWORD_RECOVERY', session()); f.emit('SESSION', { ...session(), expires_at: 300 }); assert.equal(f.auth.snapshot.status, 'recovery'); assert.equal((await f.auth.updatePassword('new-password')).ok, true); assert.equal(f.auth.snapshot.status, 'signed_in'); assert.equal((await f.auth.updatePassword('not-recovery')).ok, false); } finally { f.auth.dispose(); }
});
test('logout clears local identity and disposes listeners', async () => {
  const f = fixture(); await f.auth.start(); await f.auth.signIn('owner@example.invalid', 'password'); await f.auth.signOut(); assert.equal(f.auth.snapshot.status, 'signed_out'); assert.equal(f.auth.snapshot.reason, null); assert.equal(await f.auth.getAccessToken(), null); f.auth.dispose(); f.emit('SESSION', session()); assert.equal(f.auth.snapshot.status, 'signed_out');
});
test('stale initial getSession cannot overwrite a newer successful signin', async () => {
  const f = fixture(); let release!: (value: null) => void; f.provider.getSession = () => new Promise(resolve => { release = resolve; });
  try { const starting = f.auth.start(); await f.auth.signIn('owner@example.invalid', 'password'); release(null); await starting; assert.equal(f.auth.snapshot.status, 'signed_in'); } finally { f.auth.dispose(); }
});
test('initial session read cannot overwrite a newer provider event', async () => {
  const f = fixture(); let release!: (value: null) => void; f.provider.getSession = () => new Promise(resolve => { release = resolve; });
  try { const starting = f.auth.start(); f.emit('SESSION', session()); release(null); await starting; assert.equal(f.auth.snapshot.status, 'signed_in'); } finally { f.auth.dispose(); }
});
test('pending token read cannot authorize after logout or a newer session event', async () => {
  const f = fixture(); await f.auth.start(); await f.auth.signIn('owner@example.invalid', 'password');
  let release!: (value: ProviderSession) => void; f.provider.getSession = () => new Promise(resolve => { release = resolve; });
  try { const token = f.auth.getAccessToken(); await f.auth.signOut(); release(session()); assert.equal(await token, null); assert.equal(f.auth.snapshot.status, 'signed_out'); } finally { f.auth.dispose(); }
});
test('public config rejects private keys and incomplete/remote HTTP configuration without logging values', () => {
  assert.equal(readPublicAuthConfig({}).kind, 'unconfigured');
  const base = { VITE_SUPABASE_URL: 'https://test-project.supabase.co', VITE_APP_ENV: 'test', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture_only_123456' };
  assert.equal(readPublicAuthConfig(base).kind, 'configured');
  for (const values of [{ ...base, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_fixture_only_never_real' }, { ...base, VITE_SUPABASE_PUBLISHABLE_KEY: 'eyJ.' + btoa(JSON.stringify({ role: 'service_role' })) + '.fixture' }, { ...base, VITE_SUPABASE_URL: 'http://remote.invalid' }, { ...base, VITE_SUPABASE_URL: 'https://test-project.supabase.co/?token=private' }]) {
    const result = readPublicAuthConfig(values); assert.equal(result.kind, 'invalid'); assert.ok(!JSON.stringify(result).includes(values.VITE_SUPABASE_PUBLISHABLE_KEY));
  }
  assert.equal(readPublicAuthConfig({ ...base, VITE_SUPABASE_PUBLISHABLE_KEY: 'eyJ.' + btoa(JSON.stringify({ role: 'anon' })) + '.fixture' }).kind, 'configured');
});
test('server config pins non-production project reference and rejects production target or public key', () => {
  const base = { APP_ENV: 'test', SUPABASE_URL: 'https://test-project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_fixture_only_never_real', SUPABASE_TEST_PROJECT_REF: 'test-project', SUPABASE_PRODUCTION_PROJECT_REF: 'production-project' };
  assert.equal(readServerAuthConfig(base).kind, 'configured');
  assert.equal(readServerAuthConfig({ ...base, SUPABASE_URL: 'https://production-project.supabase.co' }).kind, 'invalid');
  assert.equal(readServerAuthConfig({ ...base, SUPABASE_SERVICE_ROLE_KEY: 'sb_publishable_fixture_only_123456' }).kind, 'invalid');
  assert.equal(readServerAuthConfig({ ...base, SUPABASE_TEST_PROJECT_REF: '' }).kind, 'invalid');
});
test('server verifies bearer with getUser and derives identity from provider, not request claims', async () => {
  const tokens: string[] = [];
  const client = { auth: { async getUser(token: string) { tokens.push(token); return { data: { user: { id: uid, email: 'owner@example.invalid' } }, error: null }; } } } as unknown as Pick<SupabaseClient, 'auth'>;
  assert.equal((await authenticateRequest(new Request('http://localhost'), client)).ok, false);
  const request = new Request('http://localhost?account_id=other', { headers: { authorization: 'Bearer fixture.jwt.token' } }); const result = await authenticateRequest(request, client); assert.ok(result.ok); if (result.ok) assert.equal(result.value.account_id, uid); assert.deepEqual(tokens, ['fixture.jwt.token']);
});
test('API scopes save lookup to verified identity and never manufactures a wallet on404', async () => {
  const seen: string[] = [];
  const api = createApi({}, { async authenticate() { return { ok: true, value: { account_id: uid, email: null } }; }, async readAccount(identity) { seen.push(identity.account_id); return null; }, async lookupReceipt() { return null; } });
  const result = await api.fetch(new Request('http://localhost/api/account?account_id=other')); assert.equal(result.status, 404); assert.deepEqual(await result.json(), { code: 'ACCOUNT_NOT_INITIALIZED' }); assert.deepEqual(seen, [uid]); assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal((await api.fetch(new Request('http://localhost/api/commands', { method: 'POST', body: '{"wallet":{"gold":99999}}' }))).status, 501);
});
test('account reader does not merge snapshots, does not send owner IDs, and expires only on401', async () => {
  const f = fixture(); await f.auth.start(); await f.auth.signIn('owner@example.invalid', 'password');
  let status = 503;
  const request = (async (url, init) => { assert.equal(url, '/api/account'); assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer private-user-token-fixture'); return Response.json({ code: 'fixture' }, { status }); }) as typeof fetch;
  try {
    const reader = createAccountReader(f.auth, request);
    assert.equal((await reader()).ok, false); assert.equal(f.auth.snapshot.status, 'signed_in');
    status = 404; assert.deepEqual(await reader(), { ok: false, code: 'ACCOUNT_NOT_INITIALIZED', status: 404 });
    status = 401; await reader(); assert.equal(f.auth.snapshot.reason, 'expired');
  } finally { f.auth.dispose(); }
});
test('account reader rejects another owner, broken envelopes and returns summary only', async () => {
  const f = fixture(); await f.auth.start(); await f.auth.signIn('owner@example.invalid', 'password');
  let accountId = '22222222-2222-4222-8222-222222222222';
  try {
    const reader = createAccountReader(f.auth, (async () => Response.json({ save: { account_id: accountId, revision: 1, updated_at: '2026-10-19T00:00:00Z', state: { wallet: 'never merged' } } })) as typeof fetch);
    assert.equal((await reader()).ok, false); accountId = uid;
    assert.deepEqual(await reader(), { ok: true, value: { revision: 1, updated_at: '2026-10-19T00:00:00Z' } });
  } finally { f.auth.dispose(); }
});
test('secret guard catches actual private env values, disguised public env names, and privileged JWTs', () => {
  const privateValue = 'synthetic-private-sentinel-123456789';
  assert.equal(containsPrivilegedValue('bundle=' + privateValue, { SAVE_SIGNING_KEY: privateValue }), true);
  assert.equal(containsPrivilegedValue('sb_secret_' + 'x'.repeat(30), {}), true);
  assert.equal(containsPrivilegedValue('eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url') + '.fixture', {}), true);
  assert.equal(containsPrivilegedValue('sb_publishable_public_fixture_only', {}), false);
  assert.deepEqual(privilegedPublicNames({ VITE_SAVE_SIGNING_KEY: privateValue }), ['VITE_SAVE_SIGNING_KEY']);
});
test('build rejects mismatched browser/server projects and production target in test', () => {
  const env = { APP_ENV: 'test', SUPABASE_URL: 'https://test-project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_fixture_only_never_real', SUPABASE_TEST_PROJECT_REF: 'test-project', VITE_APP_ENV: 'test', VITE_SUPABASE_URL: 'https://test-project.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture_only_123456' };
  assert.equal(validateBuildEnvironment(env), null);
  assert.equal(validateBuildEnvironment({ ...env, VITE_APP_ENV: 'production' }), 'BROWSER_SERVER_AUTH_ENVIRONMENT_MISMATCH');
  assert.equal(validateBuildEnvironment({ ...env, VITE_SUPABASE_URL: 'https://other-project.supabase.co' }), 'BROWSER_SERVER_AUTH_ENVIRONMENT_MISMATCH');
  assert.equal(validateBuildEnvironment({ VITE_APP_ENV: 'test', VITE_SUPABASE_URL: 'https://production-project.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_PRODUCTION_PROJECT_REF: 'production-project' }), 'PRODUCTION_PROJECT_FORBIDDEN');
});
