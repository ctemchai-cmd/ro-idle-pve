import {withoutD187Document} from './legacy-tower-rewards-scope.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
export const beforeD183=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-159/before.json.gz')).toString());
/** Earlier release oracles retain their original card programs. Restore only
 * D183's declared power fields; identities, order, art, costs and loot stay live. */
export function withoutD183Document<T>(key:string,value:T):T {
 const c=withoutD187Document(key,value) as any;
 if(key==='cards.json'){
  const old=beforeD183['plan/data/cards.json'];assert.deepEqual(c.definitions.map((d:any)=>d.id),old.definitions.map((d:any)=>d.id));
  c.definitions=c.definitions.map((d:any,i:number)=>{const r={...d};for(const k of['modifiers','triggers','combat_bonuses'])if(k in old.definitions[i])r[k]=structuredClone(old.definitions[i][k]);else delete r[k];return r;});
  c.content_version=old.content_version;c.catalog_basis=old.catalog_basis;
 }return c;
}
