import type { AccountState } from '../../contracts/index.ts';
type Entry=AccountState['paid_ledger'][number];
/** Keep only active refundable scopes. Historical refunds belong to immutable receipts. */
export function compactPaidLedger(rows:readonly Entry[]):Entry[]{
 const active:Entry[]=[],nonrefundable=new Set(['character_level','breakthrough','refine','card_upgrade']);
 for(const row of rows){
  if(row.refund_state!=='active'||nonrefundable.has(row.feature_id))continue;
  const previous=active.find(e=>e.character_id===row.character_id&&e.feature_id===row.feature_id&&e.skill_id===row.skill_id);
  if(!previous){active.push(structuredClone(row));continue;}
  previous.quantity+=row.quantity;if(!Number.isSafeInteger(previous.quantity))throw new Error('LEDGER_OVERFLOW');
  for(const key of Object.keys(previous.paid_resources)as(keyof AccountState['wallet'])[]){previous.paid_resources[key]+=row.paid_resources[key];if(!Number.isSafeInteger(previous.paid_resources[key]))throw new Error('LEDGER_OVERFLOW');}
  previous.cost_version=row.cost_version;for(const version of row.cost_versions)if(!previous.cost_versions.includes(version))previous.cost_versions.push(version);
 }
 return active;
}
