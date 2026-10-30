import {artifactSourceBytes} from './legacy-artifacts-scope.ts';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const scopes = [177,178].map(task => ({
 before:JSON.parse(gunzipSync(readFileSync(`plan/evidence/task-${task}/before.json.gz`)).toString()) as Record<string,string>,
 after:JSON.parse(readFileSync(`plan/evidence/task-${task}/source-after.json`,'utf8')) as Record<string,string>,
}));
export function deviceSaveSourceBytes(file:string):Buffer {
 const bytes=artifactSourceBytes(file);
 for(const scope of scopes)if(scope.after[file]){
  assert.equal(createHash('sha256').update(bytes).digest('hex'),scope.after[file],file+' exact D201/D202 presentation source');
  return Buffer.from(scope.before[file]!);
 }
 return bytes;
}
