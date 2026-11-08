import type { AccountState } from '../contracts/index.ts';
import { loadValidatedContent } from './content.ts';
import { craftingRules, craftingStock, optionStoneQuote, optionStoneOutcomes, rarityStoneQuote } from '../domain/progression/equipment-crafting.ts';
import { availableItemOptions, optionRules, optionValue, type ItemOption } from '../domain/build/item-options.ts';
import { itemDefinition } from '../domain/build/equipment-definition.ts';
export { optionTargetAttemptLimit } from '../domain/progression/option-target.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw Error('CONTENT_UNAVAILABLE');const content=loaded.value;
export type CraftingMaterial='option_stone'|'rarity_stone';
export function craftingMaterialName(key:CraftingMaterial){return craftingRules(content).materials[key].name;}
export function craftingInventory(state:AccountState){return{option_stone:craftingStock(state,'option_stone'),rarity_stone:craftingStock(state,'rarity_stone')};}
export function craftingOption(option:ItemOption,tier:number){const {row,value}=optionValue(option,tier,content);return{stat:row.stat,value,percent:row.op==='add_percent'};}
export function craftingView(state:AccountState,id:string,index:number,target?:Extract<AccountState['inventory'][number],{kind:'equipment'}>['rarity_id']){
 const item=state.inventory.find(i=>i.instance_id===id);if(!item||item.kind!=='equipment')throw Error('ITEM_NOT_FOUND');
 const definition=itemDefinition(item,content),rules=craftingRules(content),pending=state.equipment_crafting?.pending_roll;
 let rarity:ReturnType<typeof rarityStoneQuote>|null=null,rarityReason='',roll:ReturnType<typeof optionStoneQuote>|null=null,rollReason='';
 const targets=rules.rarity_steps.slice(rules.rarity_steps.findIndex(r=>r.from===item.rarity_id)).map(r=>r.to).filter(r=>r!==item.rarity_id);
 if(item.rarity_id==='supreme')targets.length=0;
 const destination=target&&targets.includes(target)?target:targets[0];
 try{rarity=rarityStoneQuote(state,id,content,destination);}catch(e){rarityReason=(e as Error).message;}
 try{roll=optionStoneQuote(state,id,index,content);}catch(e){rollReason=(e as Error).message;}
 const options=optionRules(content),outcomes=optionStoneOutcomes(item,index,definition.tier_level!,content);
 // Slot-specific targets; duplicates remain selectable under the current catalog policy.
 const optionTargets=availableItemOptions(content,[],item.definition_id).map(row=>{
  const outcome=outcomes.find(o=>o.id===row.id),occupiedRows=item.options.flatMap((o,i)=>options.pool.find(r=>r.id===o.id)?.stat===row.stat?[i+1]:[]);
  return{id:row.id,stat:row.stat,percent:row.op==='add_percent',probability:outcome?.probability??0,
   min:optionValue({id:row.id,roll:0},definition.tier_level!,content).value,max:optionValue({id:row.id,roll:options.roll_scale},definition.tier_level!,content).value,
   occupiedRows,selectable:!!outcome&&outcome.probability>0&&(!options.unique_stat_per_item||row.id!==item.options[index]?.id)};
 });
 const strings=content.documents['strings.th.json']!.strings as unknown as Record<string,string>;
 return{name:strings[definition.name_key]??definition.id,item,definition,rules,targets,destination,outcomes,optionTargets,stock:craftingInventory(state),pending:pending?.item_instance_id===id?pending:null,otherPending:pending&&pending.item_instance_id!==id?pending:null,rarity,rarityReason,roll,rollReason};
}
