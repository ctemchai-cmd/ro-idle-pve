import{slotOptionSourceBytes,withoutSlotOptions}from'./legacy-slot-options-scope.ts';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='plan/evidence/task-199/',before=JSON.parse(gunzipSync(readFileSync(base+'before.json.gz')).toString()) as Record<string,string>,after=JSON.parse(readFileSync(base+'source-after.json','utf8')) as Record<string,string>;
const fix='plan/evidence/option-target-list-20261108/',fixBefore=JSON.parse(gunzipSync(readFileSync(fix+'before.json.gz')).toString()) as Record<string,string>,fixAfter=JSON.parse(readFileSync(fix+'source-after.json','utf8')) as Record<string,string>;
export function enchantOptionSourceBytes(file:string){let b=slotOptionSourceBytes(file);if(fixAfter[file]){assert.equal(createHash('sha256').update(b).digest('hex'),fixAfter[file],file+' reviewed target-list visibility');b=Buffer.from(fixBefore[file]!);}if(after[file]){assert.equal(createHash('sha256').update(b).digest('hex'),after[file],file+' reviewed enchant/option targets');return Buffer.from(before[file]!);}return b;}
export function withoutEnchantOptionTargets<T>(file:string,value:T):T{const d=withoutSlotOptions(file,value) as any;
 if(file==='plan/data/schemas/command.json'){d.oneOf=d.oneOf.filter((r:any)=>r.properties.type.const!=='equipment.option_target');d.oneOf.find((r:any)=>r.properties.type.const==='slot.enchant').properties.params.properties.target_level.maximum=10;}
 if(file==='plan/data/schemas/receipt.json')delete d.properties.result.properties.option_batch;
 if(file==='plan/data/module-contracts.json')d.mutation_command_ids=d.mutation_command_ids.filter((id:string)=>id!=='equipment.option_target');
 if(file==='plan/data/ui-flows.json')d.actions=d.actions.filter((r:any)=>r.id!=='equipment.option_target');
 if(file==='plan/data/acceptance-cases.json')d.cases=d.cases.filter((r:any)=>r.task_id!=='TASK-199');return d;
}
