import { dailyBatchSourceBytes } from './legacy-daily-batch-scope.ts';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const before=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-172/before.json.gz')).toString()) as Record<string,string>;
const after=JSON.parse(readFileSync('plan/evidence/task-172/source-after.json','utf8')) as Record<string,string>;
export function withoutDailyQuotaDocument<T>(key:string,value:T):T {
 const c=structuredClone(value) as any;
 if(key==='daily-bosses.json')c.attempt_reservation=JSON.parse(before['plan/data/daily-bosses.json']!).attempt_reservation;
 if(key==='save-contracts.json') {
  const old=JSON.parse(before['plan/data/save-contracts.json']!);c.battle_protocol.daily_abort=old.battle_protocol.daily_abort;
  function visit(a:any,b:any){if(!a||typeof a!=='object')return;if(a.durable==='last committed phase/HP/chests in ticket day; received rewards and quota charged atomically'){a.durable=b.durable;a.attempt_refund=b.attempt_refund;}for(const k of Object.keys(a))if(b?.[k])visit(a[k],b[k]);}visit(c,old);
 }
 return c;
}
export function withoutDailyQuotaSchema<T>(key:string,value:T):T {
 const c=structuredClone(value) as any;if(key==='account-state'){delete c.properties.daily_records.items.properties.quota_policy;delete c.properties.pending_rewards.items.properties.daily_attempt;}return c;
}
export function dailyQuotaSourceBytes(file:string):Buffer {
 if(file.startsWith('plan/data/')&&before[file]){
  const actual=JSON.parse(readFileSync(file,'utf8')),prior=JSON.parse(before[file]!);
  const restored=file.includes('/schemas/')?withoutDailyQuotaSchema('account-state',actual):withoutDailyQuotaDocument(file.split('/').at(-1)!,actual);
  assert.deepEqual(restored,prior,file+' only D196 declared fields');return Buffer.from(before[file]!);
 }
 const bytes=dailyBatchSourceBytes(file);if(after[file]){assert.equal(createHash('sha256').update(bytes).digest('hex'),after[file],file+' exact D196 source');return Buffer.from(before[file]!);}return bytes;
}
