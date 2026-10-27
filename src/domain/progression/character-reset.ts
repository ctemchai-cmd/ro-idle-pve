import type{AccountState}from'../../contracts/index.ts';
import legacy from'./legacy-character-prices.ts';
import{ProgressionRejection}from'./rejection.ts';
type Wallet=AccountState['wallet'];
export const CHARACTER_RESET_FEATURES:readonly string[]=Object.freeze(['character_level','breakthrough','status','skill','skill_awaken']);
/** Old compaction discarded level/Break payments. Only that oldest missing prefix uses
 * immutable historical prices; every payment retained since then refunds its actual vector. */
export function characterResetQuote(state:AccountState,characterId:string){
 const actor=state.roster.find(a=>a.character_id===characterId);if(!actor)throw new ProgressionRejection('CHARACTER_NOT_FOUND');
 const rows=state.paid_ledger.filter(e=>e.character_id===characterId&&e.refund_state==='active'&&CHARACTER_RESET_FEATURES.includes(e.feature_id));
 const zero=()=>Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0]))as Wallet,refund=zero(),legacyRefund=zero(),legacyLevels=zero(),legacyGates=zero();
 const add=(to:Wallet,paid:Partial<Wallet>)=>{for(const key of Object.keys(to)as(keyof Wallet)[]){const amount=paid[key]??0,total=to[key]+amount;if(!Number.isSafeInteger(amount)||amount<0||!Number.isSafeInteger(total))throw new ProgressionRejection('RESOURCE_OVERFLOW');to[key]=total;}};
 const quantity=(feature:string)=>{const value=rows.filter(e=>e.feature_id===feature).reduce((n,e)=>n+e.quantity,0);if(!Number.isSafeInteger(value)||value<0)throw new ProgressionRejection('LEVEL_REFUND_HISTORY_MISMATCH');return value;};
 const oldLevels=actor.level-1-quantity('character_level'),oldGates=actor.completed_gate_ids.length-quantity('breakthrough');
 if(oldLevels<0||oldGates<0)throw new ProgressionRejection('LEVEL_REFUND_HISTORY_MISMATCH');
 for(let level=1;level<=oldLevels;level++){const row=legacy.level_rows.find(r=>r.level===level);if(!row?.next_level_cost)throw new ProgressionRejection('LEVEL_REFUND_HISTORY_UNKNOWN');add(legacyLevels,row.next_level_cost);}
 for(const level of actor.completed_gate_ids.slice(0,oldGates)){const gate=legacy.breakthrough_gates.find(g=>g.at_level===level);if(!gate)throw new ProgressionRejection('LEVEL_REFUND_HISTORY_UNKNOWN');add(legacyGates,gate.cost);}
 add(legacyRefund,legacyLevels);add(legacyRefund,legacyGates);
 add(refund,legacyRefund);for(const row of rows)add(refund,row.paid_resources);
 return{refund,legacyRefund,legacyLevels,legacyGates,legacyCostVersion:legacy.cost_version,oldLevels,oldGates,canReset:actor.level>1||actor.job_id!==actor.root_job_id||actor.awakened_skills.length>0||rows.length>0};
}
