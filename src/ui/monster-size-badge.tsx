import { sizeName,type MonsterSize } from '../client/monster-size.ts';
export function MonsterSizeBadge({size,compact=false}:{size:MonsterSize|null;compact?:boolean}){
 return <span className={`monster-size${compact?' compact':''}`} data-size={size??'unknown'} aria-label={`ขนาด${sizeName(size)}`} title="ขนาดที่ใช้คำนวณผลการ์ด">{compact?'':'ขนาด · '}{sizeName(size)}</span>;
}
