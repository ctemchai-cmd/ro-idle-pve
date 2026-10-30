import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../../api/index.ts';
import { COMMAND_BODY_LIMIT_BYTES } from '../../src/server/persistence/command-body.ts';
import { SaveController } from '../../src/client/save-controller.ts';
import { createBrowserSavePorts } from '../../src/client/save-browser.ts';
import { salvageQuote } from '../../src/domain/progression/equipment.ts';
import type { AuthController } from '../../src/client/auth-controller.ts';
import type { SaveBackup } from '../../src/client/save-controller.ts';
import { bulkCommandFixture } from './bulk-command-fixtures.ts';
import { content } from './combat-fixtures.ts';

test('500 max-length equipment IDs pass the actual HTTP boundary and salvage atomically once', async()=>{
 const f=bulkCommandFixture(),before=structuredClone(f.state.wallet),quote=salvageQuote(f.state.inventory,content);
 assert(JSON.stringify(f.command).length>16384,'reproduces former COMMAND_TOO_LARGE boundary');
 const response=await f.send();assert.equal(response.status,200);const result=await response.json();
 assert.equal(result.receipt.result.code,'EQUIPMENT_SALVAGED');assert.equal(result.receipt.result.removed_instance_ids.length,500);assert.equal(f.state.inventory.length,0);assert.equal(f.context.save!.revision,2);assert.equal(f.writes,1);
 assert.equal(f.state.wallet.gold-before.gold,quote.gold);assert.equal(f.state.wallet.refine_ore-before.refine_ore,quote.refine_ore);
 assert.deepEqual(await(await f.send()).json(),result);assert.equal(f.writes,1);assert.equal(f.context.save!.revision,2);
});
test('the same body budget supports500 card IDs and120-character UTF-8 equipment IDs',async()=>{
 for(const [kind,unicode] of [['card',false],['equipment',true]] as const){
  const f=bulkCommandFixture(kind,unicode),bytes=Buffer.byteLength(JSON.stringify(f.command),'utf8');assert(bytes<=COMMAND_BODY_LIMIT_BYTES);assert(bytes>16384);
  assert.equal(Array.from(f.command.params.instance_ids[0]!).length,120);
  const response=await f.send();assert.equal(response.status,200);const value=await response.json();assert.equal(value.receipt.outcome,'committed');assert.equal(value.receipt.result.removed_instance_ids.length,500);assert.equal(f.state.inventory.length,0);assert.equal(f.writes,1);
 }
});
test('HTTP cap is finite, byte-based and enforced before the command handler',async()=>{
 let calls=0;const api=createApi({}, {authenticate:async()=>({ok:true,value:{account_id:'11111111-1111-4111-8111-111111111111',email:null}}),readAccount:async()=>null,lookupReceipt:async()=>null,command:async()=>{calls++;return{status:200,body:{ok:true}};}});
 const post=(body:string)=>api.fetch(new Request('http://isolated/api/commands',{method:'POST',body}));
 const exact='{}'.padEnd(COMMAND_BODY_LIMIT_BYTES,' ');assert.equal((await post(exact)).status,200);assert.equal(calls,1);
 for(const body of [exact+' ',JSON.stringify({text:'é'.repeat(COMMAND_BODY_LIMIT_BYTES/2)})]){
  const r=await post(body);assert.equal(r.status,413);assert.deepEqual(await r.json(),{code:'COMMAND_TOO_LARGE'});assert.equal(calls,1);
 }
 assert.equal((await(await api.fetch(new Request('http://isolated/api/health'))).json()).command_body_limit_bytes,COMMAND_BODY_LIMIT_BYTES);
});

function phone(f:ReturnType<typeof bulkCommandFixture>,cached:SaveBackup,options:{oldLimit?:boolean;loseReply?:boolean}={}){
 const map=new Map<string,string>(),key=`ro-idle:save:v1:bulk-phone:${f.id}`,other='ro-idle:save:v1:bulk-phone:another-slot';map.set(key,JSON.stringify(cached));map.set(other,'untouched-other-save');
 const storage={getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>{map.set(key,value);},removeItem:(key:string)=>{map.delete(key);}} as Storage;
 const auth={snapshot:{user:{id:f.owner}},getAccessToken:async()=>'isolated.fixture.token',markUnauthorized:()=>{}}as unknown as AuthController;
 const sent:string[]=[];let old=!!options.oldLimit,lose=!!options.loseReply;
 const request=(async(url,init)=>{
  if(init?.method==='POST'){
   const body=String(init.body);sent.push(JSON.parse(body).request_id);
   if(old&&body.length>16384)return Response.json({code:'COMMAND_TOO_LARGE'},{status:413});
   const response=await f.api.fetch(new Request('http://isolated'+url,init));if(lose){lose=false;throw new TypeError('isolated response loss');}return response;
  }
  return f.api.fetch(new Request('http://isolated'+url,init));
 })as typeof fetch;
 const ports=()=>({...createBrowserSavePorts(auth,'bulk-phone',storage,undefined,request,{slot:f.slot,save_id:f.id}),lock:async()=>()=>{}});
 return{ports,sent,map,key,other,upgrade(){old=false;}};
}
test('a PWA frozen in413 reloads its original500-item pending UUID, recovers the cloud and never repeats payment',async()=>{
 const f=bulkCommandFixture(),original={checkpoint:f.checkpoint(),pending:f.command},p=phone(f,original,{oldLimit:true});
 let a=new SaveController(p.ports());await a.start(f.id);assert.equal(a.snapshot.status,'error');assert.equal(a.snapshot.reason,'COMMAND_TOO_LARGE');assert.equal(a.snapshot.pending!.request_id,f.command.request_id);assert.equal(f.writes,0);a.dispose();
 p.upgrade();a=new SaveController(p.ports());await a.start(f.id);assert.equal(a.snapshot.status,'ready');assert.equal(a.snapshot.pending,null);assert.equal(f.writes,1);assert.equal(f.state.inventory.length,0);assert.equal(a.snapshot.checkpoint!.save.revision,2);a.dispose();
 // Reopen an older local pending backup after the cloud has already committed it.
 p.map.set(p.key,JSON.stringify(original));a=new SaveController(p.ports());await a.start(f.id);assert.equal(a.snapshot.status,'ready');assert.equal(f.writes,1);assert.deepEqual(p.sent,[f.command.request_id,f.command.request_id]);assert.equal(p.map.get(p.other),'untouched-other-save');a.dispose();
});
test('a lost large-sale reply reconciles its original receipt after reload without another POST',async()=>{
 const f=bulkCommandFixture(),p=phone(f,{checkpoint:f.checkpoint(),pending:f.command},{loseReply:true});let a=new SaveController(p.ports());await a.start(f.id);assert.equal(a.snapshot.status,'offline');assert.equal(f.writes,1);assert.ok(a.snapshot.pending);a.dispose();
 a=new SaveController(p.ports());await a.start(f.id);assert.equal(a.snapshot.status,'ready');assert.equal(a.snapshot.pending,null);assert.equal(f.writes,1);assert.equal(p.sent.length,1);a.dispose();
});
test('stale pending sales reload the current cloud without selling, and locked/equipped selections stay atomic',async()=>{
 const stale=bulkCommandFixture(),p=phone(stale,{checkpoint:stale.checkpoint(),pending:{...stale.command,expected_revision:0}}),a=new SaveController(p.ports());await a.start(stale.id);assert.equal(a.snapshot.status,'ready');assert.equal(a.snapshot.pending,null);assert.equal(stale.writes,0);assert.equal(stale.state.inventory.length,500);a.dispose();
 for(const kind of ['locked','equipped']as const){
  const f=bulkCommandFixture(),item=f.state.inventory.at(-1)!;if(kind==='locked')item.locked=true;else f.state.roster[0]!.equipment.armor=item.instance_id;f.reseal();const wallet=structuredClone(f.state.wallet);
  const result=await(await f.send()).json();assert.equal(result.receipt.outcome,'rejected');assert.equal(result.receipt.result.code,kind==='locked'?'ITEM_LOCKED':'ITEM_EQUIPPED');assert.equal(f.state.inventory.length,500);assert.deepEqual(f.state.wallet,wallet);assert.equal(f.writes,0);
 }
});
