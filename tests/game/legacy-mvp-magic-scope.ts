import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {withoutD183Document} from './legacy-card-balance-scope.ts';
export const mvpMagicIds=['card_fallen_bishop','card_time_holder'];
export const beforeD180=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-156/before.json.gz')).toString());
/** Restore only the two separately verified D180 additions for older oracles. */
export function withoutD180Document<T>(key:string,value:T):T{
 const c=withoutD183Document(key,value) as any,old=beforeD180[key];
 if(key==='cards.json'){
  c.definitions=c.definitions.filter((r:any)=>!mvpMagicIds.includes(r.id));c.presentations=c.presentations.filter((r:any)=>!mvpMagicIds.some(id=>r.id===`visual_${id}`));
  for(const id of mvpMagicIds){delete c.origins[id];delete c.monster_traits[id.slice(5)];}c.content_version=old.content_version;c.catalog_basis=old.catalog_basis;
 }
 if(key==='gacha.json'){c.definitions=c.definitions.filter((id:string)=>!mvpMagicIds.includes(id));for(const id of mvpMagicIds)delete c.definition_weights[id];c.definition_choice=old.definition_choice;}
 if(key==='strings.th.json')for(const id of mvpMagicIds)delete c.strings[id];return c;
}
