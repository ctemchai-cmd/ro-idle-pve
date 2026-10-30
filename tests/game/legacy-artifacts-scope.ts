import{readFileSync}from'node:fs';import{gunzipSync}from'node:zlib';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const before=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-179/scope-before.json.gz')).toString())as Record<string,string>,after=JSON.parse(readFileSync('plan/evidence/task-179/scope-after.json','utf8'))as Record<string,string>,data=JSON.parse(readFileSync('plan/evidence/task-179/scope-after-data.json','utf8'))as Record<string,unknown>;
export function artifactSourceBytes(file:string){const bytes=readFileSync(file);if(after[file]){assert.equal(createHash('sha256').update(bytes).digest('hex'),after[file],file+' reviewed Artifact/MVP/roster extension');return Buffer.from(before[file]!);}return bytes;}
/** Reverse only reviewed changes for earlier release oracles; unrelated live fields remain asserted by those oracles. */
function reverse(b:any,a:any,value:any,path:string):any{
 if(JSON.stringify(b)===JSON.stringify(a)||JSON.stringify(value)===JSON.stringify(b))return value;
 if(Array.isArray(b)&&Array.isArray(a)&&Array.isArray(value)&&a.length>b.length&&JSON.stringify(a.slice(0,b.length))===JSON.stringify(b)){const added=a.slice(b.length);return value.filter(v=>!added.some(x=>JSON.stringify(x)===JSON.stringify(v)));}
 if(Array.isArray(b)&&Array.isArray(a)&&Array.isArray(value)&&b.length===a.length)return value.map((v,i)=>reverse(b[i],a[i],v,path+'/'+i));
 if(b&&a&&typeof b==='object'&&typeof a==='object'&&!Array.isArray(b)&&!Array.isArray(a)){
  const result=structuredClone(value);for(const key of new Set([...Object.keys(b),...Object.keys(a)])){
   if(JSON.stringify(b[key])===JSON.stringify(a[key]))continue;
   if(!(key in b)){if(key in result){assert.deepEqual(result[key],a[key],path+'/'+key);delete result[key];}}
   else if(!(key in a)){result[key]=structuredClone(b[key]);}
   else result[key]=reverse(b[key],a[key],result[key],path+'/'+key);
  }return result;
 }
 assert.deepEqual(value,a,path+' exact reviewed new value');return structuredClone(b);
}
export function withoutArtifactsDocument<T>(key:string,value:T):T{const file='plan/data/'+key;if(!before[file])return structuredClone(value);return reverse(JSON.parse(before[file]!),data[file],value,file);}
export function withoutArtifactsSchema<T>(key:string,value:T):T{const file='plan/data/schemas/'+key+'.json';if(!before[file])return structuredClone(value);return reverse(JSON.parse(before[file]!),data[file],value,file);}
