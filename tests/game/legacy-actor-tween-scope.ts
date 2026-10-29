import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { allActorTweenSourceBytes } from './legacy-all-actor-tween-scope.ts';
const before=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-174/before.json.gz')).toString()) as Record<string,string>;
const after=JSON.parse(readFileSync('plan/evidence/task-174/source-after.json','utf8')) as Record<string,string>;
/** Remove only the exact reviewed renderer/route prototype from old source oracles. */
export function actorTweenSourceBytes(file:string):Buffer {
 const bytes=allActorTweenSourceBytes(file);
 if(after[file]){assert.equal(createHash('sha256').update(bytes).digest('hex'),after[file],file+' exact D198 source');return Buffer.from(before[file]!);}
 return bytes;
}
