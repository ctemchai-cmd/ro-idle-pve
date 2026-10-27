import type { AccountState } from '../contracts/index.ts';

/** Old single-box claims and new whole-run batches share their immutable phase keys. */
export function dailyRewardCount(claims: readonly AccountState['pending_rewards'][number][]): number {
  const phases=new Set<string>();let unkeyed=0;
  for(const claim of claims){if(claim.kind!=='daily')continue;const keys=claim.source_keys.filter(k=>k.startsWith('daily:'));if(keys.length)for(const key of keys)phases.add(key);else unkeyed++;}
  return phases.size+unkeyed;
}

export function finishFailureMessage(code: string|null): string {
  if(code==='PENDING_REWARDS_FULL')return 'รางวัลที่รอรับเต็ม รับรางวัลเดิมแล้วลองยืนยันผลอีกครั้ง';
  if(code==='RESOURCE_OVERFLOW')return 'ทรัพยากรเต็ม ยังไม่ได้หักสิทธิ์ กรุณาตรวจเซฟก่อนรับรางวัล';
  if(code==='BATTLE_TICKET_EXPIRED')return 'ไฟต์นี้ค้างนานเกินไป กรุณาเชื่อมต่อเซฟเพื่อตรวจผล';
  if(code==='BATTLE_FINISH_TOO_EARLY')return 'ยังไม่ถึงเวลายืนยันผลไฟต์ กรุณาลองอีกครั้ง';
  return 'ยังยืนยันผลไฟต์ไม่ได้ กรุณาเชื่อมต่อเซฟเพื่อตรวจรายการเดิม';
}
