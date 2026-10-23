import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createApi} from '../../api/index.ts';
import {parseSaveSlot,saveSlotId} from '../../src/server/persistence/save-slots.ts';
import {readSaveSlots,validateSaveSlots} from '../../src/client/save-slots.ts';
import {SaveController} from '../../src/client/save-controller.ts';
import {AccountCommandRules} from '../../src/domain/account/commands.ts';
import {reserveFarm} from '../../src/domain/rewards/farm.ts';
import {storyFarmSnapshot,storyStage} from '../../src/domain/modes/story.ts';
import {createBrowserSavePorts} from '../../src/client/save-browser.ts';
import type {AuthController} from '../../src/client/auth-controller.ts';
import {initializeAccount} from '../../src/domain/progression/initialize.ts';
import {canonical} from '../../src/content/value.ts';
import type {Command} from '../../src/contracts/index.ts';
import {content} from './combat-fixtures.ts';
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const auth={snapshot:{user:{id:owner}},getAccessToken:async()=> 'fixture.jwt.token',markUnauthorized:()=>{}}as unknown as AuthController;
const id=saveSlotId(owner,2),versions=content.manifest;
const intent={type:'account.create',params:{root_job_id:'mage',gender:'female'},request_id:'33333333-3333-4333-8333-333333333333',expected_revision:0,schema_version:1,content_version:versions.content_version,content_hash:versions.content_hash,rules_version:versions.rules_version}as Command;
function storage(){const map=new Map<string,string>();return{map,value:{getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>map.set(k,v),removeItem:(k:string)=>map.delete(k)}as unknown as Storage};}
function checkpoint(accountId:string){const state=initializeAccount(content,{root_job_id:'mage',gender:'female'},'2026-10-23T00:00:00Z','2026-10-23',1),hash=createHash('sha256').update(canonical(state)).digest('hex');return{save:{account_id:accountId,state,revision:1,schema_version:1,content_version:versions.content_version,rules_version:versions.rules_version,content_hash:versions.content_hash,state_hash:hash,updated_at:'2026-10-23T00:00:00Z'},history:{account_id:accountId,state,state_hash:hash,revision:1,signature:'fixture',key_version:1,created_at:'2026-10-23T00:00:00Z'},battle:null,server_at:'2026-10-23T00:00:00Z'};}
test('D143 slot1 preserves legacyID and all10owner-bound IDs are stable/unique; invalidslot rejected',()=>{
 assert.equal(saveSlotId(owner,1),owner);assert.equal(parseSaveSlot(null),1);
 const ids=Array.from({length:10},(_,i)=>saveSlotId(owner,i+1));assert.equal(new Set(ids).size,10);assert.equal(ids[1],saveSlotId(owner,2));assert.notEqual(ids[1],saveSlotId(other,2));
 for(const v of ['0','11','-1','2x','1.5',' 2',''])assert.throws(()=>parseSaveSlot(v));for(const n of [0,11,1.5,NaN])assert.throws(()=>saveSlotId(owner,n));
});
test('D143 API derives selected identity fromJWT+slot only on every save route; chooser keepsAuthowner andcachevaries',async()=>{
 const seen:string[]=[],api=createApi({}, {authenticate:async()=>({ok:true,value:{account_id:owner,email:null}}),readAccount:async i=>{seen.push(i.account_id);return null;},lookupReceipt:async i=>{seen.push(i.account_id);return null;},checkpoint:async i=>{seen.push(i.account_id);return{status:200,body:{ok:true}}},command:async i=>{seen.push(i.account_id);return{status:200,body:{}}},backups:async i=>{seen.push(i.account_id);return{status:200,body:{backups:[]}}},listSaveSlots:async i=>{seen.push(i.account_id);return{};}});
 for(const path of ['/api/account','/api/checkpoint','/api/backups','/api/receipts/33333333-3333-4333-8333-333333333333','/api/commands']){const r=await api.fetch(new Request('http://local'+path+'?account_id='+other,{method:path==='/api/commands'?'POST':'GET',headers:{'x-ro-save-slot':'2'},...(path==='/api/commands'?{body:'{}'}:{})}));assert.ok(r.headers.get('vary')?.includes('X-RO-Save-Slot'));}assert.deepEqual(seen,Array(5).fill(id));
 await api.fetch(new Request('http://local/api/save-slots',{headers:{'x-ro-save-slot':'2'}}));assert.equal(seen.at(-1),owner);
 assert.equal((await api.fetch(new Request('http://local/api/checkpoint',{headers:{'x-ro-save-slot':'11'}}))).status,400);assert.equal(seen.length,6);
});
test('D143 browser binds each request, pendingbackup andwriterlease toitsselectedsave; slot1keyunchanged',async()=>{
 const s=storage(),headers:string[]=[],ports1=createBrowserSavePorts(auth,'test:local',s.value,undefined,(async()=>Response.json({}))as typeof fetch),ports2=createBrowserSavePorts(auth,'test:local',s.value,undefined,(async(_url,init)=>{headers.push(new Headers(init?.headers).get('x-ro-save-slot')!);return Response.json({checkpoint:checkpoint(id)});})as typeof fetch,{slot:2,save_id:id});
 ports1.store(owner,{checkpoint:null,pending:intent});ports2.store(id,{checkpoint:checkpoint(id),pending:null});assert.ok(s.map.has('ro-idle:save:v1:test:local:'+owner));assert.equal(ports1.load(owner)!.pending!.request_id,intent.request_id);assert.equal(ports2.load(id)!.pending,null);
 assert.equal((await ports2.checkpoint()).save.account_id,id);assert.deepEqual(headers,['2']);const a=await ports1.lock(owner),b=await ports2.lock(id);assert.ok(a&&b);a();b();
 const wrong=createBrowserSavePorts(auth,'test:local',s.value,undefined,(async()=>Response.json({checkpoint:checkpoint(owner)}))as typeof fetch,{slot:2,save_id:id});await assert.rejects(wrong.checkpoint(),/INVALID_CHECKPOINT/);assert.equal(ports1.load(owner)!.pending!.request_id,intent.request_id);
});
test('D143 chooser rejects anotherowner/duplicates/missing slots and permits legacyfallback onlyslot1',()=>{
 const data={enabled:true,owner_id:owner,slots:Array.from({length:10},(_,i)=>({slot:i+1,save_id:saveSlotId(owner,i+1),initialized:false,job_id:null,level:null,revision:null,updated_at:null,cleared_stages:0}))};assert.equal(validateSaveSlots(data,owner).slots.length,10);assert.throws(()=>validateSaveSlots(data,other));const bad=structuredClone(data);bad.slots[1]!.save_id=owner;assert.throws(()=>validateSaveSlots(bad,owner));assert.throws(()=>validateSaveSlots({...data,slots:data.slots.slice(0,9)},owner));assert.equal(validateSaveSlots({...data,enabled:false,slots:[{...data.slots[0]!,initialized:null}]},owner).enabled,false);
});

test('D143 captured selection cannot change during token wait; an old owner cannot send or sign out the new owner',async()=>{
 const s=storage(),user={id:owner};let release!:(token:string)=>void,calls=0,expired=0;
 const session={snapshot:{user},getAccessToken:()=>new Promise<string>(r=>{release=r;}),markUnauthorized:()=>{expired++;}}as unknown as AuthController;
 const selected={slot:2,save_id:id},ports=createBrowserSavePorts(session,'immutable',s.value,undefined,(async(_url,init)=>{calls++;assert.equal(new Headers(init?.headers).get('x-ro-save-slot'),'2');return Response.json({checkpoint:checkpoint(id)});})as typeof fetch,selected);
 const loading=ports.checkpoint();selected.slot=3;selected.save_id=saveSlotId(owner,3);release('fixture');assert.equal((await loading).save.account_id,id);
 const sending=ports.send(intent);user.id=other;release('new-owner-token');await assert.rejects(sending,/SIGN_IN_REQUIRED/);assert.equal(calls,1);
 user.id=owner;const listing=readSaveSlots(session,undefined,(async()=>{calls++;throw Error('MUST_NOT_SEND');})as typeof fetch);user.id=other;release('new-owner-token');await assert.rejects(listing,/SIGN_IN_REQUIRED/);assert.equal(calls,1);
 user.id=owner;session.getAccessToken=async()=> 'fixture';let reply!:(r:Response)=>void;
 const late=createBrowserSavePorts(session,'late-owner',s.value,undefined,(()=>new Promise<Response>(r=>{reply=r;}))as typeof fetch,{slot:2,save_id:id});
 const request=late.checkpoint();await new Promise(r=>setImmediate(r));user.id=other;reply(Response.json({code:'SIGN_IN_REQUIRED'},{status:401}));await assert.rejects(request,/SIGN_IN_REQUIRED/);assert.equal(expired,0);
});

test('D143 switching away from an uncertain create preserves its exact UUID and rejects late HTTP; reopening reconciles only that slot',async()=>{
 const s=storage(),third=saveSlotId(owner,3),iso='2026-10-23T00:00:00Z';let committed=false,posts=0,release!:()=>void,entered!:()=>void;
 const started=new Promise<void>(r=>{entered=r;}),receipt=new AccountCommandRules().prepare(intent as Extract<Command,{type:'account.create'}>,'b'.repeat(64),iso,'2026-10-23',1).receipt;
 const request=(async(url,init)=>{const slot=new Headers(init?.headers).get('x-ro-save-slot');
  if(String(url)==='/api/commands'){assert.equal(slot,'2');posts++;committed=true;entered();await new Promise<void>(r=>{release=r;});return Response.json({receipt,checkpoint:checkpoint(id)});}
  if(String(url).startsWith('/api/receipts/')){assert.equal(slot,'2');return Response.json({receipt});}
  if(slot==='3')return Response.json({checkpoint:checkpoint(third)});
  return committed?Response.json({checkpoint:checkpoint(id)}):Response.json({code:'ACCOUNT_NOT_INITIALIZED'},{status:404});
 })as typeof fetch;
 const ports2=()=>createBrowserSavePorts(auth,'switch-test',s.value,undefined,request,{slot:2,save_id:id}),ports3=createBrowserSavePorts(auth,'switch-test',s.value,undefined,request,{slot:3,save_id:third});
 const a=new SaveController(ports2()),b=new SaveController(ports3);let c:SaveController|undefined;
 try{
  await a.start(id);assert.equal(a.snapshot.reason,'ACCOUNT_NOT_INITIALIZED');const pending=a.submit(intent);await started;
  assert.equal(ports2().load(id)!.pending!.request_id,intent.request_id);a.dispose();await pending;await b.start(third);const saved3=s.value.getItem('ro-idle:save:v1:switch-test:'+third);
  release();await new Promise(r=>setImmediate(r));assert.equal(s.value.getItem('ro-idle:save:v1:switch-test:'+third),saved3);assert.equal(ports2().load(id)!.pending!.request_id,intent.request_id);assert.equal(b.snapshot.checkpoint!.save.account_id,third);
  c=new SaveController(ports2());await c.start(id);assert.equal(c.snapshot.status,'ready');assert.equal(c.snapshot.pending,null);assert.equal(posts,1);assert.equal(c.snapshot.lastReceipt!.request_id,intent.request_id);assert.equal(b.snapshot.checkpoint!.save.account_id,third);
 }finally{release?.();a.dispose();b.dispose();c?.dispose();}
});

test('D143 each save reserves its own capped12h AFK interval without changing another save cursor, RNG or pending rewards',()=>{
 const base=Date.parse('2026-10-23T00:00:00Z'),hour=3600000;
 const make=()=>{const state=checkpoint(id).save.state;state.farm.rate_snapshot=storyFarmSnapshot(storyStage('1-1',content)!,state,content);return state;};
 const first=make(),second=make(),before=structuredClone(second),now=new Date(base+24*hour).toISOString();
 const a=reserveFarm(first,base,base+24*hour,now,'slot1-afk',content);assert.deepEqual(second,before);
 const b=reserveFarm(second,base,base+24*hour,now,'slot2-afk',content);assert.deepEqual(a.pending_rewards[0]!.resource_vector,b.pending_rewards[0]!.resource_vector);assert.equal(a.pending_rewards[0]!.resource_vector.gold,first.farm.rate_snapshot!.per_hour.gold*12);
 assert.equal(first.farm.reserved_through,'2026-10-23T00:00:00Z');assert.equal(second.farm.reserved_through,first.farm.reserved_through);assert.notEqual(a.pending_rewards[0]!.claim_id,b.pending_rewards[0]!.claim_id);assert.equal(a.farm.reserved_through,now);assert.equal(b.farm.reserved_through,now);
});
