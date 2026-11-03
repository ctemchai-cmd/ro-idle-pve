import {readFileSync} from 'node:fs';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const before=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-193/before.json.gz')).toString())as Record<string,string>;
const after=JSON.parse(readFileSync('plan/evidence/task-193/source-after.json','utf8'))as Record<string,string>,data=JSON.parse(readFileSync('plan/evidence/task-193/data-after.json','utf8'))as Record<string,unknown>;
for(const file of Object.keys(data))assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),after[file],file+' exact reviewed queue/Artifact clarity source');
export function queueClaritySourceBytes(file:string){const bytes=readFileSync(file);if(after[file]&&before[file]){assert.equal(createHash('sha256').update(bytes).digest('hex'),after[file],file+' exact reviewed queue/Artifact clarity');return Buffer.from(before[file]!);}return bytes;}
function reverse(b:any,a:any,v:any,path:string):any{
 if(JSON.stringify(b)===JSON.stringify(a)||JSON.stringify(v)===JSON.stringify(b))return structuredClone(v);
 if(Array.isArray(b)&&Array.isArray(a)&&Array.isArray(v)){
  const key=['id','chapter'].find(k=>b.length&&a.length&&b.every(x=>x&&typeof x==='object'&&k in x)&&a.every(x=>x&&typeof x==='object'&&k in x));
  if(key){const result=v.filter(x=>b.some(n=>n[key]===x[key])||!a.some(n=>n[key]===x[key])).map(x=>{const old=b.find(n=>n[key]===x[key]),next=a.find(n=>n[key]===x[key]);return old&&next?reverse(old,next,x,path+'/'+x[key]):x;});for(const old of b)if(!a.some(n=>n[key]===old[key]))result.splice(b.indexOf(old),0,structuredClone(old));return result;}
  if(a.length>b.length&&JSON.stringify(a.slice(0,b.length))===JSON.stringify(b))return v.filter(x=>!a.slice(b.length).some(n=>JSON.stringify(n)===JSON.stringify(x)));
  if(a.length===b.length)return v.map((x,i)=>reverse(b[i],a[i],x,path+'/'+i));
 }
 if(b&&a&&typeof b==='object'&&typeof a==='object'&&!Array.isArray(b)&&!Array.isArray(a)){
  const out=structuredClone(v);for(const k of new Set([...Object.keys(b),...Object.keys(a)])){if(JSON.stringify(b[k])===JSON.stringify(a[k])||(!(k in out)&&k in b&&k in a))continue;if(!(k in b)){if(k in out){assert.deepEqual(out[k],a[k],path+'/'+k);delete out[k];}}else if(!(k in a))out[k]=structuredClone(b[k]);else out[k]=reverse(b[k],a[k],out[k],path+'/'+k);}return out;
 }
 if(JSON.stringify(v)!==JSON.stringify(a))return structuredClone(v);return structuredClone(b);
}
export function withoutQueueClarityFile<T>(file:string,value:T):T{return file in data?reverse(JSON.parse(before[file]!),data[file],value,file):structuredClone(value);}
