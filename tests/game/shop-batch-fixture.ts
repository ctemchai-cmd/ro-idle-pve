// Test-only signed in-memory persistence. No Supabase/owner data; same real API handlers.
import{createHash,createHmac,randomBytes}from'node:crypto';
import{createApi,createRecurringHandlers}from'../../api/index.ts';
import{AccountCommandRules}from'../../src/domain/account/commands.ts';
import{initializeAccount}from'../../src/domain/progression/initialize.ts';
import{canonical}from'../../src/content/value.ts';
import type{AccountState}from'../../src/contracts/index.ts';
import type{CommandCommit,ReceiptRecord,SaveContext}from'../../src/contracts/save.ts';
import{content}from'./combat-fixtures.ts';
export const SHOP_TEST_OWNER='11111111-0139-4139-8139-111111111111';
export function shopBatchFixture(mode='funded',now=new Date().toISOString()){
 const rules=new AccountCommandRules(content),day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok'}).format(new Date(now)),state=initializeAccount(content,{root_job_id:'swordsman',gender:'male'},now,day,139),key=randomBytes(48).toString('base64url');
 Object.assign(state.wallet,{gold:mode==='poor'?52000:2000000,skill_manual:1000,awakening_shard:30,crystal:100});
 state.shop={day,purchases:mode==='partial'?{crystal_exchange:1}:mode==='soldout'?{crystal_exchange:20}:{}};
 if(mode==='overflow'){state.battle_supplies!.stock.fire_scroll=Number.MAX_SAFE_INTEGER-2;state.wallet.crystal=Number.MAX_SAFE_INTEGER-5;}
 const hash=(v:unknown)=>createHash('sha256').update(canonical(v)).digest('hex'),signature=(revision:number,stateHash:string)=>createHmac('sha256',key).update(canonical({account_id:SHOP_TEST_OWNER,revision,state_hash:stateHash,content_hash:rules.versions.content_hash,schema_version:1,key_version:1})).digest('base64url');
 let context:SaveContext={server_at:now,save:{account_id:SHOP_TEST_OWNER,revision:1,schema_version:1,...rules.versions,state_hash:hash(state),state,updated_at:now},history:{account_id:SHOP_TEST_OWNER,revision:1,state:structuredClone(state),state_hash:hash(state),signature:signature(1,hash(state)),key_version:1,created_at:now},battle:null};
 const receipts=new Map<string,ReceiptRecord>();let writes=0;
 const store={async loadContext(){return structuredClone(context);},async readCreationReceipt(_owner:unknown,id:string){return structuredClone(receipts.get(id)??null);},async commitCommand(input:CommandCommit){
  const existing=receipts.get(input.request_id);if(existing)return{data:existing.receipt,error:existing.request_hash===input.request_hash?null:{message:'IDEMPOTENCY_KEY_REUSE'}};
  if(input.expected_revision!==context.save!.revision)return{data:null,error:{message:'REVISION_CONFLICT'}};
  if(input.receipt.outcome==='committed'){writes++;context={...context,save:{...context.save!,revision:input.receipt.committed_revision,state:structuredClone(input.state),state_hash:input.state_hash,updated_at:input.receipt.server_at},history:{account_id:SHOP_TEST_OWNER,revision:input.receipt.committed_revision,state:structuredClone(input.state),state_hash:input.state_hash,signature:input.signature,key_version:1,created_at:input.receipt.server_at}};}
  receipts.set(input.request_id,{request_hash:input.request_hash,receipt:input.receipt});return{data:structuredClone(input.receipt),error:null};
 }};
 const recurring=createRecurringHandlers(store as never,key,rules),api=createApi({}, {authenticate:async()=>({ok:true,value:{account_id:SHOP_TEST_OWNER,email:null}}),readAccount:async()=>context.save,lookupReceipt:async(_owner,id)=>receipts.get(id)?.receipt??null,...recurring});
 return{api,rules,recurring,day,get state(){return structuredClone(context.save!.state)as AccountState;},get revision(){return context.save!.revision;},get writes(){return writes;}};
}
