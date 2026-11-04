import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const directory='plan/evidence/task-194/';
const before=JSON.parse(gunzipSync(readFileSync(directory+'before.json.gz')).toString()) as Record<string,string>;
const after=JSON.parse(readFileSync(directory+'source-after.json','utf8')) as Record<string,string>;
export function bossProfileSourceBytes(file:string){
 const bytes=readFileSync(file);if(before[file]&&after[file]){assert.equal(createHash('sha256').update(bytes).digest('hex'),after[file],file+' reviewed boss armor/attack scope');return Buffer.from(before[file]);}return bytes;
}
/** Only the explicitly reviewed root profile is removed for old data oracles. */
export function withoutBossProfileFile<T>(file:string,value:T):T{
 const copy=structuredClone(value);if(file==='plan/data/enemies.json'&&copy&&typeof copy==='object'&&'boss_combat' in copy){
  assert.deepEqual(copy.boss_combat,JSON.parse(readFileSync(file,'utf8')).boss_combat);delete copy.boss_combat;
 }
 if(file==='plan/data/acceptance-cases.json'){
  const document=copy as {cases:{task_id:string}[]};document.cases=document.cases.filter(row=>row.task_id!=='TASK-194');
 }
 return copy;
}
