import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { withoutD168Roles } from './legacy-distinctness-scope.ts';
const before=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-137/authored-before.json.gz',import.meta.url))).toString())as Record<string,string>;
const old=JSON.parse(before['plan/data/skills/thief.json']!);
/** Only D166's three declared power curves are restored for historical scope guards.
 * grimtooth.test.ts independently compares every other field to this frozen source.
 */
export function withoutD166Curves<T>(value:T):T{
 const copy=withoutD168Roles(value);
 function visit(node:unknown):void{
  if(!node||typeof node!=='object')return;
  if(Array.isArray(node)){node.forEach(visit);return;}
  const row=node as Record<string,any>,awake=Array.isArray(row.tags)&&row.tags.includes('awakened');
  if(row.level_parameters&&(row.id==='assassin_grimtooth'||awake&&row.id==='assassin_sonic_blow')){
   const original=awake?old.awakened_variants[row.id]:old.skills.find((s:{id:string})=>s.id===row.id);
   row.level_parameters.power=structuredClone(original.level_parameters.power);
  }
  Object.values(row).forEach(visit);
 }
 visit(copy);return copy;
}
