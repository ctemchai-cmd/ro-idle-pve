import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const directory='plan/evidence/task-195/';
const before=JSON.parse(gunzipSync(readFileSync(directory+'before.json.gz')).toString()) as Record<string,string>;
const after=JSON.parse(readFileSync(directory+'source-after.json','utf8')) as Record<string,string>;
const spec=JSON.parse(readFileSync('plan/generators/boss-identities.json','utf8'));
export function bossIdentitySourceBytes(file:string){
 const bytes=readFileSync(file);
 if(after[file]){
  assert.equal(createHash('sha256').update(bytes).digest('hex'),after[file],file+' reviewed boss identity/icon scope');
  if(file==='runtime/ro/manifest.json')return gunzipSync(readFileSync(directory+'before-pack.json.gz'));
  if(before[file]!==undefined)return Buffer.from(before[file]);
 }
 return bytes;
}
/** Only new identities/traits are projected out; existing balance/skills are still checked. */
export function withoutBossIdentityFile<T>(file:string,value:T):T{
 const copy=structuredClone(value) as any;
 const added=spec.additional_actors.map((a:any)=>a.id);
 if(file==='plan/data/enemies.json'){
  const current=JSON.parse(readFileSync(file,'utf8'));
  for(const id of added){const row=copy.actors.find((a:any)=>a.id===id);if(row)assert.deepEqual(row,current.actors.find((a:any)=>a.id===id));}
  copy.actors=copy.actors.filter((a:any)=>!added.includes(a.id));
  if(copy.boss_combat){
   if(copy.boss_combat.story_identities){assert.deepEqual(copy.boss_combat.story_identities,spec.story_identities);delete copy.boss_combat.story_identities;}
   for(const id of added)delete copy.boss_combat.defense_elements[id];
  }
 }
 if(file==='plan/data/cards.json')for(const row of spec.additional_actors){if(copy.monster_traits[row.id]){assert.deepEqual(copy.monster_traits[row.id],row.trait);delete copy.monster_traits[row.id];}}
 if(file==='plan/data/acceptance-cases.json')copy.cases=copy.cases.filter((r:any)=>r.task_id!=='TASK-195');
 return copy;
}
