import type { AccountState, Command, Receipt } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { availableItemOptions, optionRules, rollItemOptions } from '../build/item-options.ts';
import { craftingStock, optionStoneQuote } from './equipment-crafting.ts';
import { ProgressionRejection } from './rejection.ts';

export const optionTargetAttemptLimit = 10000;
/** Same two RNG draws and cost per attempt as rolling/accepting one line repeatedly. */
export function applyOptionTarget(state:AccountState,command:Extract<Command,{type:'equipment.option_target'}>,content:ValidatedContent,draw:()=>number):NonNullable<Receipt['result']['option_batch']>{
 const {item_instance_id,option_index,expected_option,target_option_id,max_attempts}=command.params;
 const q=optionStoneQuote(state,item_instance_id,option_index,content),original={...q.item.options[q.index]!};
 const reject=(code:string):never=>{throw new ProgressionRejection(code);};
 if(original.id!==expected_option.id||original.roll!==expected_option.roll)reject('OPTION_ROLL_STALE');
 if(!Number.isSafeInteger(max_attempts)||max_attempts<1||max_attempts>optionTargetAttemptLimit)reject('INVALID_OPTION_ATTEMPTS');
 const rules=optionRules(content),excluded=q.item.options.filter((_,i)=>i!==q.index).map(o=>rules.pool.find(r=>r.id===o.id)!.stat);
 if(!availableItemOptions(content,excluded,q.item.definition_id).some(r=>r.id===target_option_id&&r.weight>0))reject('INVALID_OPTION_TARGET');
 if(rules.unique_stat_per_item&&original.id===target_option_id)reject('OPTION_TARGET_ALREADY_PRESENT');
 const stock=craftingStock(state,'option_stone'),affordable=Math.floor(stock/q.stone_cost),limit=Math.min(affordable,max_attempts);
 if(!limit)reject('INSUFFICIENT_CRAFTING_STONES');
 let replacement=original,attempts=0;
 const checkedDraw=()=>{const n=draw();if(!Number.isFinite(n)||n<0||n>=1)throw new Error('SERVER_ROLL_REQUIRED');return n;};
 while(attempts<limit){
  replacement=rollItemOptions(q.item.rarity_id,checkedDraw,content,{count:1,excluded_stats:excluded,definition_id:q.item.definition_id})[0]??reject('OPTION_POOL_EMPTY');
  attempts++;
  if(replacement.id===target_option_id)break;
 }
 const stones_spent=attempts*q.stone_cost;
 // Commit only after the entire batch is valid; no pending old/new choice in target mode.
 state.equipment_crafting!.stock.option_stone-=stones_spent;
 q.item.options[q.index]={...replacement};
 return{item_instance_id,option_index,target_option_id,attempts,stones_spent,original,replacement:{...replacement},stop_reason:replacement.id===target_option_id?'target_reached':attempts>=affordable?'insufficient_stones':'attempt_limit'};
}
