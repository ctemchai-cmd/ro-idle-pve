import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { framePerformanceSourceBytes } from './legacy-frame-performance-scope.ts';
const before=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-175/before.json.gz')).toString()) as Record<string,string>;
const after=JSON.parse(readFileSync('plan/evidence/task-175/source-after.json','utf8')) as Record<string,string>;
export function allActorTweenSourceBytes(file:string):Buffer {
 const bytes=framePerformanceSourceBytes(file);
 if(after[file]){assert.equal(createHash('sha256').update(bytes).digest('hex'),after[file],file+' exact D199 source');return Buffer.from(before[file]!);}
 return bytes;
}
