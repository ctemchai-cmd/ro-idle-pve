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

test('combined command reply reads one verified checkpoint after success; failures retain the receipt and legacy callers stay compatible', async () => {
 let commands=0,loads=0;const receipt={request_id:'fixture',committed_revision:2};let checkpointStatus=200,throws=false;
 const api=createApi({VERCEL_REGION:'sin1'},{authenticate:async()=>({ok:true,value:{account_id:'11111111-1111-4111-8111-111111111111',email:null}}),readAccount:async()=>null,lookupReceipt:async()=>null,command:async()=>{commands++;return{status:200,body:{receipt}};},checkpoint:async()=>{loads++;if(throws)throw new Error('DB_UNAVAILABLE');return{status:checkpointStatus,body:{checkpoint:{verified:true}}};}});
 const post=()=>new Request('http://localhost/api/commands',{method:'POST',headers:{'content-type':'application/json','x-ro-checkpoint':'include'},body:'{}'});
 const good=await api.fetch(post());assert.deepEqual(await good.json(),{receipt,checkpoint:{verified:true}});assert.equal(commands,1);assert.equal(loads,1);assert.equal(good.headers.get('x-ro-api-region'),'sin1');assert.match(good.headers.get('server-timing')!,/auth;dur=.*command;dur=.*checkpoint;dur=.*total;dur=/);
 checkpointStatus=503;assert.deepEqual(await(await api.fetch(post())).json(),{receipt});throws=true;assert.deepEqual(await(await api.fetch(post())).json(),{receipt});
 const before=loads;assert.deepEqual(await(await api.fetch(new Request('http://localhost/api/commands',{method:'POST',body:'{}'}))).json(),{receipt});assert.equal(loads,before);assert.equal(commands,4);
});
