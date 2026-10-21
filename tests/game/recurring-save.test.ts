import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { createRecurringHandlers } from '../../api/index.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/account/initialize.ts';
import type { AccountState, Command } from '../../src/contracts/index.ts';
import type { CommandCommit, ReceiptRecord, SaveContext } from '../../src/contracts/save.ts';
import { content, battle, actor, skill } from './combat-fixtures.ts';
import { canonical } from '../../src/content/value.ts';
import { SaveController, SaveProtocolError, type SaveBackup, type SavePorts } from '../../src/client/save-controller.ts';
const id = '11111111-1111-4111-8111-111111111111', identity = { account_id: id, email: null };
const key = 'isolated-unit-signing-key-'.repeat(3), start = '2026-10-20T00:00:00.000Z';
const hash = (v: unknown) => createHash('sha256').update(canonical(v)).digest('hex');
function fixture(active = false) {
 const rules = new AccountCommandRules(), state = initializeAccount(content, { root_job_id: 'mage', gender: 'male' }, start, '2026-10-20', 1);
 state.pending_rewards.push({ claim_id: 'fixed_farm_1', kind: 'farm', resource_vector: { ...Object.fromEntries(Object.keys(state.wallet).map(k => [k, 0])), gold: 100 } as AccountState['wallet'], items: [], content_version: rules.versions.content_version, reserved_at: start, source_keys: ['farm:fixed_0_1000'], status: 'pending' });
 const battleId = '22222222-2222-4222-8222-222222222222';
 if (active) state.active_battle = { battle_id: battleId, mode: 'story', mode_ref: 'fixture', ticket_day: null, started_at: start, last_ack_at: start, lease_expires_at: '2026-10-20T00:00:15.000Z', ...rules.versions };
 let context: SaveContext = { server_at: start, save: { account_id: id, revision: 1, schema_version: 1, ...rules.versions, state_hash: hash(state), state, updated_at: start }, history: null, battle: active ? { account_id: id, battle_id: battleId, content_hash: rules.versions.content_hash, payload: battle([actor('a','player',[skill()]),actor('b','enemy')]), last_ack_at: start, lease_expires_at: '2026-10-20T00:00:15.000Z' } : null };
 const sign = (revision: number, stateHash: string) => createHmac('sha256', key).update(canonical({ account_id: id, revision, state_hash: stateHash, content_hash: rules.versions.content_hash, schema_version: 1, key_version: 1 })).digest('base64url');
 function reseal() { const s = context.save!; s.state_hash = hash(s.state); context.history = { account_id: id, revision: s.revision, state: structuredClone(s.state), state_hash: s.state_hash, signature: sign(s.revision,s.state_hash), key_version: 1, created_at: context.server_at }; } reseal();
 const receipts = new Map<string, ReceiptRecord>(); let writes = 0;
 const store = { async loadContext() { return structuredClone(context); }, async readCreationReceipt(_identity: unknown, requestId: string) { return structuredClone(receipts.get(requestId) ?? null); }, async commitCommand(input: CommandCommit) {
  const old = receipts.get(input.request_id); if(old) return { data: old.receipt, error: old.request_hash===input.request_hash?null:{message:'IDEMPOTENCY_KEY_REUSE'} };
  if(input.expected_revision!==context.save!.revision)return {data:null,error:{message:'REVISION_CONFLICT'}};
  if(input.receipt.outcome==='committed'){writes++;context.save={...context.save!,revision:input.receipt.committed_revision,state:structuredClone(input.state),state_hash:input.state_hash,updated_at:input.receipt.server_at};context.history={account_id:id,revision:input.receipt.committed_revision,state:structuredClone(input.state),state_hash:input.state_hash,signature:input.signature,key_version:1,created_at:input.receipt.server_at};if(input.battle_write.kind==='delete')context.battle=null;if(input.battle_write.kind==='upsert')context.battle=structuredClone(input.battle_write.battle);}
  receipts.set(input.request_id,{request_hash:input.request_hash,receipt:input.receipt});return {data:structuredClone(input.receipt),error:null};
 }};
 const server=createRecurringHandlers(store as never,key);
 const command=(requestId='33333333-3333-4333-8333-333333333333',type:Command['type']='reward.claim',params:unknown={claim_id:'fixed_farm_1'},revision=context.save!.revision)=>({request_id:requestId,type,params,expected_revision:revision,schema_version:1,...rules.versions}) as Command;
 return {server,receipts,command,get context(){return context;},get writes(){return writes;},time(ms:number){context.server_at=new Date(Date.parse(start)+ms).toISOString();},reseal};
}
test('recurring receipt replay precedes revision, fixed claim pays once and rejected receipts stay immutable',async()=>{
 const f=fixture(),c=f.command();const first=await f.server.command(identity,c);assert.equal(first.status,200);assert.equal(f.writes,1);assert.equal((f.context.save!.state as AccountState).wallet.gold,1100);
 assert.deepEqual(await f.server.command(identity,c),first);assert.equal(f.writes,1);
 const reuse=await f.server.command(identity,{...c,params:{claim_id:'different'}});assert.equal(reuse.status,409);
 const missing=f.command('44444444-4444-4444-8444-444444444444');const rejected=await f.server.command(identity,missing);assert.equal((rejected.body as any).receipt.outcome,'rejected');assert.equal(f.context.save!.revision,2);assert.deepEqual(await f.server.command(identity,missing),rejected);assert.equal(f.receipts.size,2);
 assert.equal((await f.server.command(identity,{...c,request_id:'55555555-5555-4555-8555-555555555555'})).status,409);
 const checkpoint=await f.server.checkpoint(identity);assert.equal(checkpoint.status,200);assert.deepEqual((checkpoint.body as any).checkpoint.save.state,f.context.save!.state);
});
test('verified signed state and schema reject changed wallet, foreign history, raw client snapshots and content mismatch',async()=>{
 const f=fixture();assert.equal((await f.server.command(identity,{...f.command(),wallet:{gold:999999}})).status,400);
 (f.context.save!.state as AccountState).wallet.gold++;assert.equal((await f.server.checkpoint(identity)).status,503);
 f.reseal();f.context.history!.account_id='foreign';assert.equal((await f.server.checkpoint(identity)).status,503);
});
test('battle advance credits only DB time, persists checkpoint and replay adds no time; expiry rejects and retreat preserves wallet',async()=>{
 const f=fixture(true);f.time(2000);const c=f.command(undefined,'battle.advance',{battle_id:f.context.battle!.battle_id,requested_game_ms:90000});
 const reply=await f.server.command(identity,c);assert.equal(reply.status,200);assert.equal((f.context.battle!.payload as any).game_time_ms,2000);assert.deepEqual(await f.server.command(identity,c),reply);assert.equal((f.context.battle!.payload as any).game_time_ms,2000);
 f.time(17000);const expired=await f.server.command(identity,f.command('44444444-4444-4444-8444-444444444444','battle.advance',c.params));assert.equal((expired.body as any).receipt.result.code,'BATTLE_LEASE_EXPIRED');assert.equal(f.context.save!.revision,2);
 const wallet=structuredClone((f.context.save!.state as AccountState).wallet);const retreat=await f.server.command(identity,f.command('55555555-5555-4555-8555-555555555555','battle.retreat',{battle_id:f.context.battle!.battle_id}));assert.equal(retreat.status,200);assert.equal(f.context.battle,null);assert.equal((f.context.save!.state as AccountState).active_battle,null);assert.deepEqual((f.context.save!.state as AccountState).wallet,wallet);
});
function client(f:ReturnType<typeof fixture>,options:{loss?:boolean;writer?:boolean}={}){
 let backup:SaveBackup|null=null,sends=0,lost=false;
 const ports:SavePorts={async checkpoint(){const x=await f.server.checkpoint(identity);if(x.status!==200)throw new SaveProtocolError((x.body as any).code,x.status);return (x.body as any).checkpoint;},async receipt(id){return f.receipts.get(id)?.receipt??null;},async send(c){sends++;const x=await f.server.command(identity,c);if(x.status!==200)throw new SaveProtocolError((x.body as any).code,x.status);if(options.loss&&!lost){lost=true;throw new SaveProtocolError('NETWORK_UNAVAILABLE');}return(x.body as any).receipt;},load(){return structuredClone(backup);},store(_id,v){backup=structuredClone(v);},async lock(){return options.writer===false?null:()=>{};},requestId(){return '99999999-9999-4999-8999-999999999999';}};
 return{ports,get sends(){return sends;},get backup(){return backup;}};
}
test('response-loss refresh reconciles the same receipt before cloud load without delta replay or another payment',async()=>{
 const f=fixture(),p=client(f,{loss:true}),a=new SaveController(p.ports);await a.start(id);await a.submit(f.command());assert.equal(a.snapshot.status,'offline');assert.ok(p.backup!.pending);assert.equal(f.writes,1);a.dispose();
 const b=new SaveController(p.ports);await b.start(id);assert.equal(b.snapshot.status,'ready');assert.equal(b.snapshot.pending,null);assert.equal(p.sends,1);assert.equal(f.writes,1);assert.equal((b.snapshot.checkpoint!.save.state as AccountState).wallet.gold,1100);b.dispose();
});
test('offline and second-tab readers cannot submit; writer conflicts reload cloud without repeating an intent',async()=>{
 const f=fixture(),readonly=new SaveController(client(f,{writer:false}).ports);await readonly.start(id);assert.equal(readonly.snapshot.status,'read_only');await assert.rejects(readonly.submit(f.command()),/WRITER_NOT_READY/);readonly.dispose();
 const p=client(f),a=new SaveController(p.ports);await a.start(id);a.setOnline(false);await assert.rejects(a.submit(f.command()),/WRITER_NOT_READY/);assert.equal(p.sends,0);a.setOnline(true);await a.reconnect();
 const stale=f.command();await f.server.command(identity,stale);await a.submit({...stale,request_id:'66666666-6666-4666-8666-666666666666'});assert.equal(a.snapshot.status,'ready');assert.equal(a.snapshot.checkpoint!.save.revision,2);assert.equal(a.snapshot.pending,null);assert.equal(f.writes,1);a.dispose();
});
test('refresh with an active boss reconciles then retreats instead of simulating offline combat',async()=>{
 const f=fixture(true),p=client(f),a=new SaveController(p.ports);f.time(16000);await a.start(id);assert.equal(a.snapshot.status,'ready');assert.equal((a.snapshot.checkpoint!.save.state as AccountState).active_battle,null);assert.equal(f.context.battle,null);assert.equal(p.sends,1);a.dispose();
});
test('an older checkpoint response cannot downgrade a committed receipt or replace the newer wallet backup',async()=>{
 const f=fixture(),p=client(f),old=structuredClone(f.context),normal=p.ports.checkpoint;
 const a=new SaveController(p.ports);await a.start(id);p.ports.checkpoint=async()=>old as never;await a.submit(f.command());assert.equal(a.snapshot.status,'offline');assert.equal(a.snapshot.reason,'STALE_CHECKPOINT');assert.ok(a.snapshot.pending);assert.equal(f.writes,1);p.ports.checkpoint=normal;await a.reconnect();assert.equal(a.snapshot.status,'ready');assert.equal(a.snapshot.checkpoint!.save.revision,2);assert.equal(f.writes,1);a.dispose();
});
test('account creation persists a pending UUID without a checkpoint and refresh recovers its original receipt once',async()=>{
 const f=fixture(),p=client(f);let created=false,sends=0,backup:SaveBackup|null=null;
 const original=p.ports.checkpoint;
 p.ports.checkpoint=async()=>{if(!created)throw new SaveProtocolError('ACCOUNT_NOT_INITIALIZED',404);return original();};
 p.ports.load=()=>structuredClone(backup);p.ports.store=(_id,value)=>{backup=structuredClone(value);};
 const command={...f.command(),type:'account.create',expected_revision:0,params:{root_job_id:'mage',gender:'male'}} as Command;
 const receipt={...new AccountCommandRules().prepare(command as Extract<Command,{type:'account.create'}>,'b'.repeat(64),start,'2026-10-20',1).receipt};
 p.ports.send=async()=>{sends++;created=true;throw new SaveProtocolError('NETWORK_UNAVAILABLE');};p.ports.receipt=async()=>created?receipt:null;
 const a=new SaveController(p.ports);await a.start(id);assert.equal(a.snapshot.reason,'ACCOUNT_NOT_INITIALIZED');await a.submit(command);assert.equal(a.snapshot.status,'offline');assert.equal((backup as SaveBackup|null)?.checkpoint,null);assert.equal((backup as SaveBackup|null)?.pending?.request_id,command.request_id);a.dispose();
 const b=new SaveController(p.ports);await b.start(id);assert.equal(b.snapshot.status,'ready');assert.equal(b.snapshot.pending,null);assert.equal(sends,1);assert.equal(b.snapshot.lastReceipt?.command_type,'account.create');b.dispose();
});

test('confirmed legacy replies skip the redundant receipt GET; a combined verified checkpoint skips both GETs', async () => {
 for (const combined of [false, true]) {
  const f=fixture(),p=client(f);let loads=0,lookups=0;
  const load=p.ports.checkpoint;p.ports.checkpoint=()=>{loads++;return load();};p.ports.receipt=async()=>{lookups++;throw new Error('CONFIRMED_RECEIPT_MUST_NOT_BE_READ_AGAIN');};
  // The checkpoint is the same verified cloud object; the transport unwraps the HTTP body.
  if(combined)p.ports.sendWithCheckpoint=async c=>{const receipt=await p.ports.send(c);const loaded=await f.server.checkpoint(identity);return{receipt,checkpoint:(loaded.body as any).checkpoint};};
  const a=new SaveController(p.ports);await a.start(id);loads=0;await a.submit(f.command());
  assert.equal(a.snapshot.status,'ready');assert.equal(a.snapshot.checkpoint!.save.revision,2);assert.equal(a.snapshot.pending,null);assert.equal(lookups,0);assert.equal(loads,combined?0:1);assert.equal(f.writes,1);a.dispose();
 }
});

test('combined replies reject foreign/stale checkpoints and preserve the committed pending intent for reconciliation', async () => {
 for (const foreign of [false,true]) {
  const f=fixture(),p=client(f),old=structuredClone(f.context);
  p.ports.sendWithCheckpoint=async c=>{const receipt=await p.ports.send(c);const bad=foreign?structuredClone(f.context):old;if(foreign)bad.save!.account_id='foreign';return{receipt,checkpoint:bad as never};};
  const a=new SaveController(p.ports);await a.start(id);await a.submit(f.command());assert.equal(a.snapshot.status,'offline');assert.equal(a.snapshot.reason,foreign?'CHECKPOINT_OWNER_MISMATCH':'STALE_CHECKPOINT');assert.ok(a.snapshot.pending);assert.equal(f.writes,1);
  await a.reconnect();assert.equal(a.snapshot.status,'ready');assert.equal(a.snapshot.checkpoint!.save.revision,2);assert.equal(f.writes,1);a.dispose();
 }
});

test('terminal-only start + finish writes twice; a lost finish response reconciles the original receipt without replaying rewards', async () => {
 const f = fixture(), p = client(f), a = new SaveController(p.ports); await a.start(id);
 await a.submit(f.command('11111111-2222-4333-8444-555555555555', 'battle.start_story', { stage_id: '1-1' }));
 assert.equal(f.writes, 1); const battleId = (f.context.save!.state as AccountState).active_battle!.battle_id;
 f.time(30000); // The old 15s heartbeat lease has expired; the start ticket is still valid.
 const send = p.ports.send; let lost = false;
 p.ports.send = async command => { const result = await send(command); if (command.type === 'battle.finish' && !lost) { lost = true; throw new SaveProtocolError('NETWORK_UNAVAILABLE'); } return result; };
 const finish = f.command('66666666-7777-4888-8999-000000000000', 'battle.finish', { battle_id: battleId });
 await a.submit(finish); assert.equal(a.snapshot.status, 'offline'); assert.equal(a.snapshot.pending!.request_id, finish.request_id);
 assert.equal(f.writes, 2); const after = structuredClone(f.context.save!.state); a.dispose();
 const b = new SaveController(p.ports); await b.start(id);
 assert.equal(b.snapshot.status, 'ready'); assert.equal(b.snapshot.pending, null); assert.equal(f.writes, 2); assert.deepEqual(f.context.save!.state, after);
 assert.deepEqual((await f.server.command(identity, finish)).body, { receipt: f.receipts.get(finish.request_id)!.receipt }); assert.equal(f.writes, 2);
 assert.equal((f.context.save!.state as AccountState).pending_rewards.filter(c => c.kind === 'story').length, 1); b.dispose();
});
