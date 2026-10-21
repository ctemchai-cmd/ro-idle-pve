import test from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSaveStore } from '../../src/server/persistence/supabase.ts';
import { captureTiming, timed } from '../../src/server/persistence/timing.ts';

const identity = { account_id: '11111111-1111-4111-8111-111111111111', email: null };
test('an uninstalled optional RPC falls back and is not probed again on each button press', async () => {
  let calls = 0;
  const client = { rpc: async (name: string) => { calls++; return { data: null, error: { code: 'PGRST202', message: `Could not find public.${name} in the schema cache` } }; } } as unknown as SupabaseClient;
  const store = createSaveStore(client, 'test', 'local');
  assert.equal(await store.loadCommandContext(identity, 'request'), undefined);
  assert.equal(await store.loadCommandContext(identity, 'request'), undefined);
  assert.equal(calls, 1);
});
test('a database outage does not silently fall back into a second write', async () => {
  let calls = 0;
  const client = { rpc: async () => { calls++; return { data: null, error: { code: 'PGRST000', message: 'Database unavailable' } }; } } as unknown as SupabaseClient;
  const store = createSaveStore(client, 'test', 'local');
  await assert.rejects(store.loadCommandContext(identity, 'request'), /SAVE_CONTEXT_UNAVAILABLE/);
  assert.equal(calls, 1);
});
test('timings for overlapping requests remain separate', async () => {
  const results = await Promise.all([
    captureTiming(async () => timed('db_read', async () => { await new Promise(resolve => setTimeout(resolve, 15)); return 1; })),
    captureTiming(async () => timed('db_commit', async () => 2)),
  ]);
  assert.equal(results[0]!.value, 1); assert.equal(results[1]!.value, 2);
  assert.match(results[0]!.header, /^db_read;dur=[\d.]+;desc="1 calls"$/);
  assert.match(results[1]!.header, /^db_commit;dur=[\d.]+;desc="1 calls"$/);
});
