import { createHash, createHmac } from 'node:crypto';
import { createApi, createRecurringHandlers } from '../../api/index.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { canonical } from '../../src/content/value.ts';
import { saveSlotId } from '../../src/server/persistence/save-slots.ts';
import { cardRarity } from '../../src/domain/build/card-rarity.ts';
import type { Command, Receipt } from '../../src/contracts/index.ts';
import type { SaveContext, SaveCheckpoint, CommandCommit, ReceiptRecord } from '../../src/contracts/save.ts';
import { content } from './combat-fixtures.ts';

export function bulkCommandFixture(kind:'equipment'|'card'='equipment', unicode=false) {
  const owner='11111111-1111-4111-8111-111111111111',slot=3,id=saveSlotId(owner,slot),rules=new AccountCommandRules();
  const at='2026-10-30T00:00:00.000Z',key='isolated-bulk-command-test-key-'.repeat(3),state=initializeAccount(content,{root_job_id:'archer',gender:'male'},at,'2026-10-30',177);
  for(const actor of state.roster)for(const slot of Object.keys(actor.equipment))actor.equipment[slot as keyof typeof actor.equipment]=null;
  const definition=Object.values(content.items).find(i=>i.kind===kind&&(kind==='card'||i.slot==='armor'&&i.tier_level===1))!;
  state.inventory=Array.from({length:500},(_,i)=>{
    const prefix='farm_bulk_'+String(i).padStart(3,'0')+'_',instance_id=prefix+(unicode?'🐦':'x').repeat(120-prefix.length);
    return kind==='equipment'?{instance_id,definition_id:String(definition.id),kind,rarity_id:'common',locked:false,training:false,options:[]}:{instance_id,definition_id:String(definition.id),kind,rarity_id:cardRarity(String(definition.id),content),locked:false,level:1};
  });rules.validateAccount(state);
  const sha=(v:unknown)=>createHash('sha256').update(canonical(v)).digest('hex');
  const signature=(revision:number,stateHash:string)=>createHmac('sha256',key).update(canonical({account_id:id,revision,state_hash:stateHash,content_hash:rules.versions.content_hash,schema_version:1,key_version:1})).digest('base64url');
  const context:SaveContext={server_at:at,save:{account_id:id,revision:1,schema_version:1,...rules.versions,state,state_hash:sha(state),updated_at:at},history:{account_id:id,revision:1,state:structuredClone(state),state_hash:sha(state),signature:signature(1,sha(state)),key_version:1,created_at:at},battle:null};
  const receipts=new Map<string,ReceiptRecord>();let writes=0;
  const store={async loadContext(){return structuredClone(context);},async readCreationReceipt(_identity:unknown,requestId:string){return structuredClone(receipts.get(requestId)??null);},async commitCommand(input:CommandCommit){
    const old=receipts.get(input.request_id);if(old)return{data:old.receipt,error:old.request_hash===input.request_hash?null:{message:'IDEMPOTENCY_KEY_REUSE'}};
    if(input.account_id!==id||input.expected_revision!==context.save!.revision)return{data:null,error:{message:'REVISION_CONFLICT'}};
    if(input.receipt.outcome==='committed'){
      writes++;context.save={...context.save!,revision:input.receipt.committed_revision,state:structuredClone(input.state),state_hash:input.state_hash,updated_at:input.receipt.server_at};
      context.history={account_id:id,revision:input.receipt.committed_revision,state:structuredClone(input.state),state_hash:input.state_hash,signature:input.signature,key_version:1,created_at:input.receipt.server_at};
    }
    receipts.set(input.request_id,{request_hash:input.request_hash,receipt:structuredClone(input.receipt)});return{data:structuredClone(input.receipt),error:null};
  }};
  const handlers=createRecurringHandlers(store as never,key,rules);
  const command={request_id:'33333333-3333-4333-8333-333333333333',type:kind==='equipment'?'equipment.salvage':'card.salvage',params:{instance_ids:state.inventory.map(i=>i.instance_id)},expected_revision:1,schema_version:1,...rules.versions} as Extract<Command,{type:'equipment.salvage'|'card.salvage'}>;
  let handlerCalls=0;
  const api=createApi({}, {authenticate:async()=>({ok:true,value:{account_id:owner,email:null}}),readAccount:async identity=>identity.account_id===id?structuredClone(context.save):null,lookupReceipt:async(identity,requestId)=>identity.account_id===id?structuredClone(receipts.get(requestId)?.receipt??null):null,
    checkpoint:identity=>handlers.checkpoint(identity),command:async(identity,input)=>{handlerCalls++;return handlers.command(identity,input);}});
  async function send(input:unknown=command){return api.fetch(new Request('http://isolated/api/commands',{method:'POST',headers:{'x-ro-save-slot':String(slot),'content-type':'application/json','x-ro-checkpoint':'include'},body:JSON.stringify(input)}));}
  const reseal=()=>{const row=context.save!;row.state_hash=sha(row.state);context.history={account_id:id,revision:row.revision,state:structuredClone(row.state),state_hash:row.state_hash,signature:signature(row.revision,row.state_hash),key_version:1,created_at:at};};
  return {api,send,command,owner,slot,id,context,rules,receipts,reseal,get writes(){return writes;},get handlerCalls(){return handlerCalls;},checkpoint:():SaveCheckpoint=>structuredClone({...context,save:context.save!,history:context.history!}),get state(){return context.save!.state as typeof state;},receipt:(requestId:string):Receipt|null=>structuredClone(receipts.get(requestId)?.receipt??null)};
}
