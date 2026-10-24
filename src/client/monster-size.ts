import type { ValidatedContent } from '../content/model.ts';
import { loadValidatedContent } from './content.ts';
export type MonsterSize='small'|'medium'|'large';
const sizes:readonly string[]=['small','medium','large'];
const loaded=loadValidatedContent();if(!loaded.ok)throw Error('CONTENT_UNAVAILABLE');const content=loaded.value;
/** Read only the same identity table that storyInput uses to create size_* tags. */
export function definitionSize(id:string,catalog:ValidatedContent=content):MonsterSize|null{
 const value=(catalog.documents['cards.json']!.monster_traits as unknown as Record<string,{size?:string}>)[id]?.size;
 return value&&sizes.includes(value)?value as MonsterSize:null;
}
/** Live/checkpoint tags are authoritative, even if artwork uses a different skin. */
export function actorSize(actor:{readonly tags:readonly string[]}):MonsterSize|null{
 const found=[...new Set(actor.tags.filter(t=>t.startsWith('size_')).map(t=>t.slice(5)))];
 return found.length===1&&sizes.includes(found[0]!)?found[0]as MonsterSize:null;
}
export const sizeName=(size:MonsterSize|null)=>size?({small:'เล็ก',medium:'กลาง',large:'ใหญ่'}as const)[size]:'ไม่ระบุ';
