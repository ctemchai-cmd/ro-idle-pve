import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../../api/index.ts';
import { createMemoryRepository } from '../../src/server/persistence/memory.ts';
test('same Fetch entry serves local health; unfinished cloud routes return503', async () => {
  const api = createApi({});
  const health = await api.fetch(new Request('http://localhost/api/health'));
  assert.equal(health.status, 200); assert.equal((await health.json()).persistence, 'not_configured');
  assert.equal((await api.fetch(new Request('http://localhost/api/account'))).status, 503);
  assert.equal((await api.fetch(new Request('http://localhost/api/commands', { method: 'POST' }))).status, 503);
});
test('local repository exercises original receipt replay before revision and detects races', () => {
  const repository = createMemoryRepository({ value: 100 });
  const first = repository.commit('id1', 'hash1', 1, { value: 90 }); assert.ok(first.ok);
  const next = repository.commit('id2', 'hash2', 2, { value: 80 }); assert.ok(next.ok);
  const replay = repository.commit('id1', 'hash1', 1, { value: -999 }); assert.ok(replay.ok);
  assert.ok(replay.replayed); assert.equal(replay.receipt.revision, 2); assert.equal(replay.receipt.state.value, 90);
  assert.deepEqual(repository.read(), { revision: 3, state: { value: 80 } });
  assert.deepEqual(repository.commit('id1', 'changed', 3, { value: 0 }), { ok: false, code: 'IDEMPOTENCY_KEY_REUSE' });
  assert.deepEqual(repository.commit('id3', 'hash3', 2, { value: 0 }), { ok: false, code: 'REVISION_CONFLICT' });
});
