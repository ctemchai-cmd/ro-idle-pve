import type { AccountState, SkillDefinition } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { characterSkillCap, skillIsAwakened } from './skills.ts';
import prices from './legacy-skill-prices.ts';

type Wallet=AccountState['wallet'];
/** Legacy ledgers compacted ranks into one actual-paid vector. Reconstruct only a
 * frozen known schedule whose complete vector matches; never guess or reprice.
 * Changes run on migrateAccountState's clone, before its signed atomic commit.
 */
export function migrateSkillCaps(state:AccountState,content:ValidatedContent,changes:string[]):void{
 const keys=Object.keys(state.wallet)as(keyof Wallet)[];
 const vector=(partial:Partial<Wallet>):Wallet=>Object.fromEntries(keys.map(k=>[k,partial[k]??0]))as Wallet;
 for(const actor of state.roster)for(const [id,level]of Object.entries(actor.skill_levels)){
  const definition=content.skills[id]as unknown as SkillDefinition|undefined;
  if(!definition)continue;
  const cap=characterSkillCap(actor,definition);if(level<=cap)continue;
  // This migration owns the newly scaled Class2 skills, not arbitrary corruption.
  const legacy=prices.roots[actor.root_job_id];
  const awakened=skillIsAwakened(actor,id),feature=awakened?'skill_awaken':'skill';
  if((!awakened&&!legacy.skill_ids.includes(id))||cap<1)throw Error('SKILL_CAP_MIGRATION_UNSUPPORTED');
  const rows=state.paid_ledger.filter(r=>r.character_id===actor.character_id&&r.feature_id===feature&&r.skill_id===id&&r.refund_state==='active');
  const paid=vector({}),refund=vector({}),expected=vector(awakened?prices.awaken_unlock:{});
  const table=awakened?prices.awakened:prices.base,version=awakened?prices.awakened.cost_version:legacy.cost_version;
  for(const row of rows){
   if(row.cost_version!==version||row.cost_versions.some(v=>v!==version))throw Error('SKILL_PRICE_HISTORY_UNAVAILABLE');
   for(const key of keys){paid[key]+=row.paid_resources[key];if(!Number.isSafeInteger(paid[key]))throw Error('LEDGER_OVERFLOW');}
  }
  for(const row of table.upgrade_cost_rows)if(row.to_level<=level)for(const key of keys){
   const amount=(row as Partial<Wallet>)[key]??0;expected[key]+=amount;if(row.to_level>cap)refund[key]+=amount;
  }
  // Unfunded fixture/free ranks can be trimmed, but cannot mint a refund.
  if(!rows.length)for(const key of keys)refund[key]=0;
  else {
   if(keys.some(k=>paid[k]!==expected[k]))throw Error('SKILL_PAID_HISTORY_MISMATCH');
   const quantity=rows.reduce((n,r)=>n+r.quantity,0),removed=level-cap;
   if(!Number.isSafeInteger(quantity)||quantity<level-1||quantity>level||quantity<removed)throw Error('SKILL_PAID_HISTORY_MISMATCH');
   const retained={...rows[0]!,quantity:quantity-removed,paid_resources:vector({})};
   for(const key of keys)retained.paid_resources[key]=paid[key]-refund[key];
   const ids=new Set(rows.map(r=>r.entry_id));
   state.paid_ledger=state.paid_ledger.flatMap(r=>!ids.has(r.entry_id)?[r]:r.entry_id===rows[0]!.entry_id&&retained.quantity?[retained]:[]);
  }
  for(const key of keys){const total=state.wallet[key]+refund[key];if(!Number.isSafeInteger(total))throw Error('RESOURCE_OVERFLOW');state.wallet[key]=total;}
  actor.skill_levels[id]=cap;
  changes.push(`${actor.character_id}: ${id} Lv.${level} -> ${cap}; refund ${Object.entries(refund).filter(([,n])=>n).map(([k,n])=>`${k} +${n}`).join(', ')||'0 (no recorded payment)'}`);
 }
}
