import { sizeName,type MonsterSize } from '../client/monster-size.ts';
export function MonsterSizeBadge({size}:{size:MonsterSize|null}){
 return <span className="monster-size" data-size={size??'unknown'} aria-label={`ขนาด${sizeName(size)}`} title="ขนาดที่ใช้คำนวณผลการ์ด">ขนาด · {sizeName(size)}</span>;
}
