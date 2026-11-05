import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='plan/evidence/task-196/';
const before=JSON.parse(gunzipSync(readFileSync(base+'before.json.gz')).toString()) as Record<string,string>;
const after=JSON.parse(readFileSync(base+'source-after.json','utf8')) as Record<string,string>;
export function batchUpgradeSourceBytes(file:string){const bytes=readFileSync(file);if(after[file]){assert.equal(createHash('sha256').update(bytes).digest('hex'),after[file],file+' reviewed batch/UI scope');if(file==='runtime/ro/manifest.json')return gunzipSync(readFileSync(base+'before-pack.json.gz'));if(before[file]!==undefined)return Buffer.from(before[file]);}return bytes;}
export function withoutBatchUpgradeFile<T>(file:string,value:T):T{
 const copy=structuredClone(value) as any;
 if(file==='plan/data/schemas/command.json')copy.oneOf=copy.oneOf.filter((r:any)=>r.properties.type.const!=='slot.refine_target');
 if(file==='plan/data/schemas/receipt.json')delete copy.properties.result.properties.refine_batch;
 if(file==='plan/data/module-contracts.json')copy.mutation_command_ids=copy.mutation_command_ids.filter((id:string)=>id!=='slot.refine_target');
 if(file==='plan/data/ui-flows.json')copy.actions=copy.actions.filter((r:any)=>r.id!=='slot.refine_target');
 if(file==='plan/data/acceptance-cases.json')copy.cases=copy.cases.filter((r:any)=>r.task_id!=='TASK-196');
 return copy;
}
