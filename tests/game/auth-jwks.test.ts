import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { authenticateRequest } from '../../src/server/auth/index.ts';

const uid = '11111111-1111-4111-8111-111111111111';
function fixture() {
  const url = `https://${randomUUID()}.supabase.co`, kid = randomUUID();
  const keys = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicJwk = { ...keys.publicKey.export({ format: 'jwk' }), kid, alg: 'ES256', use: 'sig' };
  const calls: string[] = [];
  const client = createClient(url, 'public-fixture-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async input => {
      calls.push(String(input));
      assert.equal(String(input), url + '/auth/v1/.well-known/jwks.json');
      return Response.json({ keys: [publicJwk] });
    } },
  });
  function jwt(overrides: Record<string, unknown> = {}, otherKey = false) {
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'JWT', kid })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: uid, aud: 'authenticated', role: 'authenticated', iss: url + '/auth/v1', exp: Math.floor(Date.now() / 1000) + 600, email: 'owner@example.invalid', ...overrides })).toString('base64url');
    const key = otherKey ? generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey : keys.privateKey;
    const signature = sign('sha256', Buffer.from(header + '.' + payload), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
    return header + '.' + payload + '.' + signature;
  }
  const verify = (value: string) => authenticateRequest(new Request('https://game.invalid/api/commands', { headers: { authorization: 'Bearer ' + value } }), client, url + '/auth/v1');
  return { calls, jwt, verify };
}

test('actual SDK ES256 verification fetches JWKS once; repeated authenticated writes need zero Auth HTTP', async () => {
  const f = fixture(), token = f.jwt();
  const cold = await f.verify(token);
  assert.deepEqual(cold, { ok: true, value: { account_id: uid, email: 'owner@example.invalid' } });
  assert.equal(f.calls.length, 1);
  for (let n = 0; n < 8; n++) assert.equal((await f.verify(token)).ok, true);
  assert.equal(f.calls.length, 1, 'warm JWT verification must not call the Auth server');
});

test('actual SDK and API still reject expired/wrong-signature/foreign-project/wrong-role JWTs', async () => {
  const f = fixture();
  for (const token of ['invalid.fixture.jwt', f.jwt({ exp: 1 }), f.jwt({}, true), f.jwt({ iss: 'https://other.invalid/auth/v1' }), f.jwt({ aud: 'other' }), f.jwt({ role: 'service_role' }), f.jwt({ sub: 'not-an-account' })]) {
    const result = await f.verify(token);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 401);
  }
  assert.equal((await f.verify(f.jwt())).ok, true);
});
