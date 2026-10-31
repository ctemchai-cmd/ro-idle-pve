import{modernUiSourceBytes,withoutModernUiPack}from'./legacy-modern-ui-scope.ts';
import{readFileSync}from'node:fs';import{gunzipSync}from'node:zlib';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const packBefore=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-187/before-pack.json.gz')).toString()),packAfter=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-187/after-pack.json.gz')).toString());
const before=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-183/before.json.gz')).toString())as Record<string,string>,after=JSON.parse(readFileSync('plan/evidence/task-183/source-after.json','utf8'))as Record<string,string>,data=JSON.parse(readFileSync('plan/evidence/task-183/data-after.json','utf8'))as Record<string,unknown>;
/** Earlier release scopes stay frozen. New Event/Story/economy/icon behavior has independent tests. */
export function eventsSourceBytes(file:string){const bytes=modernUiSourceBytes(file);if(after[file]&&before[file]){assert.equal(createHash('sha256').update(bytes).digest('hex'),after[file],file+' exact reviewed D206–209 source');return Buffer.from(before[file]!);}return bytes;}
function reverse(b:any,a:any,v:any,path:string):any{
 if(JSON.stringify(b)===JSON.stringify(a)||JSON.stringify(v)===JSON.stringify(b))return v;
 if(Array.isArray(b)&&Array.isArray(a)&&Array.isArray(v)&&a.length>b.length&&JSON.stringify(a.slice(0,b.length))===JSON.stringify(b)){const added=a.slice(b.length);return v.filter(x=>!added.some(n=>JSON.stringify(n)===JSON.stringify(x)));}
 if(Array.isArray(b)&&Array.isArray(a)&&Array.isArray(v)&&b.length&&a.length&&b.every(x=>x&&typeof x==='object')&&a.every(x=>x&&typeof x==='object')){const key=['id','chapter'].find(k=>b.every(x=>k in x)&&a.every(x=>k in x));if(key)return v.filter(x=>b.some(n=>n[key]===x[key])||!a.some(n=>n[key]===x[key])).map(x=>{const old=b.find(n=>n[key]===x[key]),next=a.find(n=>n[key]===x[key]);return old&&next?reverse(old,next,x,path+'/'+x[key]):x;});}
 if(Array.isArray(b)&&Array.isArray(a)&&Array.isArray(v)&&a.length===b.length)return v.map((x,i)=>reverse(b[i],a[i],x,path+'/'+i));
 if(b&&a&&typeof b==='object'&&typeof a==='object'&&!Array.isArray(b)&&!Array.isArray(a)){
  const out=structuredClone(v);for(const k of new Set([...Object.keys(b),...Object.keys(a)])){if(JSON.stringify(b[k])===JSON.stringify(a[k])||(!(k in out)&&k in b&&k in a))continue;if(!(k in b)){if(k in out){assert.deepEqual(out[k],a[k],path+'/'+k);delete out[k];}}else if(!(k in a))out[k]=structuredClone(b[k]);else out[k]=reverse(b[k],a[k],out[k],path+'/'+k);}return out;
 }
 assert.deepEqual(v,a,path+' exact reviewed D206–209 data');return structuredClone(b);
}
export function withoutEventsFile<T>(file:string,v:T):T{if(!(file in data))return structuredClone(v);return reverse(JSON.parse(before[file]!),data[file],v,file);}

export function withoutEventsPack<T>(v:T):T{assert.deepEqual(withoutModernUiPack(v),packAfter,'exact reviewed modern-icon/runtime projection pack');return structuredClone(packBefore);}
