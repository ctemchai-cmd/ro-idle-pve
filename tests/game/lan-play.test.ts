// D-075 (user, 21 Oct 2026): play the personal preview from a phone at http://192.168.x.x:<port>/play without a
// certificate. Plain-http LAN pages lack SubtleCrypto, crypto.randomUUID and Web Locks; the fallbacks must be exact.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256Bytes, sha256Hex, uuidFromBytes, randomId } from '../../src/client/secure-context.ts';
import { storageWriterLock } from '../../src/client/save-browser.ts';
import { isPrivateLanHost, readPublicAuthConfig } from '../../src/client/auth-config.ts';

test('pure SHA-256 equals node/WebCrypto for padding boundaries, unicode and a real canonical save', async () => {
  const inputs = ['', 'abc', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(63), 'a'.repeat(64), 'a'.repeat(119), 'ภาษาไทย ✦ Supreme', JSON.stringify({ wallet: { gold: 12345 }, roster: Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, level: i })) })];
  for (const text of inputs) {
    const expected = createHash('sha256').update(text, 'utf8').digest('hex');
    assert.equal([...sha256Bytes(new TextEncoder().encode(text))].map(n => n.toString(16).padStart(2, '0')).join(''), expected, `len ${text.length}`);
    assert.equal(await sha256Hex(text), expected);
  }
});

test('fallback UUIDs are RFC 4122 v4 and randomId stays unique', () => {
  assert.equal(uuidFromBytes(new Uint8Array(16).fill(0xff)), 'ffffffff-ffff-4fff-bfff-ffffffffffff');
  assert.equal(uuidFromBytes(new Uint8Array(16)), '00000000-0000-4000-8000-000000000000');
  const ids = new Set(Array.from({ length: 200 }, () => randomId()));
  assert.equal(ids.size, 200); for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('storage writer lock: one tab writes, a second tab is read-only until release or a dead tab\'s lease expires', async () => {
  const data = new Map<string, string>(), storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); }, removeItem: (k: string) => { data.delete(k); } } as unknown as Storage;
  let now = 1000; const timers: (() => void)[] = [];
  const make = () => storageWriterLock(storage, 'w', () => now, fn => { timers.push(fn); return timers.length; }, () => {});
  const tabA = make(), tabB = make();
  const releaseA = await tabA('acct'); assert.ok(releaseA, 'first tab writes');
  assert.equal(await tabB('acct'), null, 'second tab is read-only');
  now += 5000; timers.forEach(fn => fn()); assert.equal(await tabB('acct'), null, 'renewed lease still held');
  releaseA!(); assert.ok(await tabB('acct'), 'released lease is taken over');
  const tabC = make(); now += 7000; assert.ok(await tabC('acct'), 'a lease not renewed for 6 s (crashed tab) expires');
});

test('a local build follows a private-LAN page origin; public http and production builds never do', () => {
  const env = { VITE_SUPABASE_URL: 'http://127.0.0.1:6173', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abcdefghijklmnopqrstuvwxyz', VITE_APP_ENV: 'local' };
  const at = (origin: string) => { const u = new URL(origin); return { hostname: u.hostname, origin: u.origin, protocol: u.protocol }; };
  const url = (r: ReturnType<typeof readPublicAuthConfig>) => r.kind === 'configured' ? r.config.url : r.kind;
  assert.equal(url(readPublicAuthConfig(env, at('http://192.168.1.101:6173'))), 'http://192.168.1.101:6173');
  assert.equal(url(readPublicAuthConfig(env, at('http://10.0.0.7:6173'))), 'http://10.0.0.7:6173');
  assert.equal(url(readPublicAuthConfig(env, at('http://127.0.0.1:6173'))), 'http://127.0.0.1:6173');
  assert.equal(url(readPublicAuthConfig(env, at('http://203.0.113.9:6173'))), 'http://127.0.0.1:6173', 'a public address is not followed');
  assert.equal(url(readPublicAuthConfig(env)), 'http://127.0.0.1:6173', 'build-time check has no page');
  assert.equal(url(readPublicAuthConfig({ ...env, VITE_APP_ENV: 'production' }, at('http://192.168.1.101:6173'))), 'invalid', 'production keeps https-only');
  assert.deepEqual(['192.168.1.101', '10.1.2.3', '172.16.0.1', '172.31.255.255', 'mac.local'].map(isPrivateLanHost), [true, true, true, true, true]);
  assert.deepEqual(['172.32.0.1', '8.8.8.8', '127.0.0.1', 'example.com'].map(isPrivateLanHost), [false, false, false, false]);
});
