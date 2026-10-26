import type { AccountState, Command } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { optionRules, rollItemOptions, type ItemOption, type ItemOptions } from '../build/item-options.ts';
import { equipmentRules } from '../build/equipment-definition.ts';
import { ProgressionRejection } from './rejection.ts';

export type CraftingMaterial = 'option_stone' | 'rarity_stone';
export type CraftingState = NonNullable<AccountState['equipment_crafting']>;
export type CraftingCommand = Extract<Command,{type:'equipment.option_roll'|'equipment.option_decide'|'equipment.rarity_up'}>;
type Gear = Extract<AccountState['inventory'][number],{kind:'equipment'}>;
export interface CraftingRules { materials:Record<CraftingMaterial,{name:string;icon:string}>; option_roll_cost:{option_stone:number}; rarity_steps:{from:Gear['rarity_id'];to:Gear['rarity_id'];stones:number;gold:number}[] }
export const craftingRules = (content:ValidatedContent) => content.documents['equipment.json']!.crafting as unknown as CraftingRules;
export const emptyCrafting = ():CraftingState => ({stock:{option_stone:0,rarity_stone:0},pending_roll:null});
export const craftingStock = (state:AccountState,key:CraftingMaterial) => state.equipment_crafting?.stock[key]??0;
const reject=(code:string):never=>{throw new ProgressionRejection(code);};
function gear(state:AccountState,id:string):Gear {
  const item=state.inventory.find(i=>i.instance_id===id);
  if(!item)reject('ITEM_NOT_FOUND');if(item!.kind!=='equipment')reject('EQUIPMENT_REQUIRED');
  const result=item as Gear;if(result.training)reject('TRAINING_WEAPON_RESTRICTED');return result;
}
function writable(state:AccountState,item:Gear){if(state.active_battle)reject('BUILD_LOCKED_DURING_BATTLE');if(item.locked)reject('ITEM_LOCKED');}
export function rarityStoneQuote(state:AccountState,id:string,content:ValidatedContent){
  const item=gear(state,id);writable(state,item);
  if(state.equipment_crafting?.pending_roll)reject('OPTION_ROLL_PENDING');
  const step=craftingRules(content).rarity_steps.find(row=>row.from===item.rarity_id);if(!step)reject('RARITY_MAX_REACHED');
  return{item,step:step!,stone_cost:step!.stones,gold_cost:step!.gold};
}
export function optionStoneQuote(state:AccountState,id:string,index:number,content:ValidatedContent){
  const item=gear(state,id);writable(state,item);
  if(state.equipment_crafting?.pending_roll)reject('OPTION_ROLL_PENDING');
  if(!Number.isSafeInteger(index)||index<0||!item.options[index])reject('OPTION_LINE_MISSING');
  return{item,index,stone_cost:craftingRules(content).option_roll_cost.option_stone};
}
export function grantCraftingMaterials(state:AccountState,grants:Partial<Record<CraftingMaterial,number>>,quantity:number){
  for(const[key,n]of Object.entries(grants)){
    if(!['option_stone','rarity_stone'].includes(key)||!Number.isSafeInteger(n)||n!<1||!Number.isSafeInteger(quantity)||quantity<1)reject('INVALID_CRAFTING_GRANT');
    const total=craftingStock(state,key as CraftingMaterial)+n!*quantity;if(!Number.isSafeInteger(total))reject('RESOURCE_OVERFLOW');
  }
  const crafting=state.equipment_crafting??=emptyCrafting();
  for(const[key,n]of Object.entries(grants))crafting.stock[key as CraftingMaterial]+=n!*quantity;
}
/** Same instance and slot investments survive crafting. RNG is supplied only by the account transaction. */
export function applyCraftingCommand(state:AccountState,command:CraftingCommand,content:ValidatedContent,draw:(()=>number)|null):string{
  if(state.active_battle)reject('BUILD_LOCKED_DURING_BATTLE');
  const crafting=state.equipment_crafting??=emptyCrafting(),id=command.params.item_instance_id;
  if(command.type==='equipment.option_decide'){
    const pending=crafting.pending_roll;if(!pending||(pending.item_instance_id!==id||pending.roll_id!==command.params.roll_id))reject('OPTION_ROLL_NOT_FOUND');
    const item=gear(state,id),current=item.options[pending!.option_index];
    if(!current||current.id!==pending!.original.id||current.roll!==pending!.original.roll)reject('OPTION_ROLL_STALE');
    if(command.params.accept){if(item.locked)reject('ITEM_LOCKED');item.options[pending!.option_index]={...pending!.replacement};}
    crafting.pending_roll=null;return command.params.accept?'OPTION_REPLACED':'OPTION_RETAINED';
  }
  if(!draw)reject('SERVER_RNG_REQUIRED');
  const rules=optionRules(content),stats=(options:readonly ItemOption[])=>options.map(o=>rules.pool.find(r=>r.id===o.id)!.stat);
  if(command.type==='equipment.option_roll'){
    const q=optionStoneQuote(state,id,command.params.option_index,content);
    if(q.item.options[q.index]!.id!==command.params.expected_option.id||q.item.options[q.index]!.roll!==command.params.expected_option.roll)reject('OPTION_ROLL_STALE');
    if(crafting.stock.option_stone<q.stone_cost)reject('INSUFFICIENT_CRAFTING_STONES');
    const replacement=rollItemOptions(q.item.rarity_id,draw!,content,{count:1,excluded_stats:stats(q.item.options.filter((_,i)=>i!==q.index))})[0];
    if(!replacement)reject('OPTION_POOL_EMPTY');
    crafting.stock.option_stone-=q.stone_cost;
    crafting.pending_roll={roll_id:command.request_id,item_instance_id:id,option_index:q.index,original:{...q.item.options[q.index]!},replacement:{...replacement!}};
    return'OPTION_ROLLED';
  }
  const q=rarityStoneQuote(state,id,content);
  if(q.item.rarity_id!==command.params.expected_rarity)reject('RARITY_CHANGED');
  if(crafting.stock.rarity_stone<q.stone_cost)reject('INSUFFICIENT_CRAFTING_STONES');
  if(state.wallet.gold<q.gold_cost)reject('INSUFFICIENT_RESOURCES');
  const count=Math.max(0,rules.lines_by_rarity[q.step.to]-q.item.options.length),additional=rollItemOptions(q.step.to,draw!,content,{count,excluded_stats:stats(q.item.options)});
  if(additional.length!==count)reject('OPTION_POOL_EMPTY');
  crafting.stock.rarity_stone-=q.stone_cost;state.wallet.gold-=q.gold_cost;q.item.rarity_id=q.step.to;q.item.options=[...q.item.options,...additional] as ItemOptions;
  return'EQUIPMENT_RARITY_UPGRADED';
}
/** A paid pending result cannot be destroyed or altered by another equipment command. */
export function protectPendingOption(state:AccountState,command:Command){
  const pending=state.equipment_crafting?.pending_roll;if(!pending||command.type==='equipment.option_decide')return;
  const params=command.params as Record<string,unknown>;
  if(['equipment.fuse','equipment.salvage','equipment.rarity_up','equipment.option_roll'].includes(command.type)&&
    (params.item_instance_id===pending.item_instance_id||(Array.isArray(params.instance_ids)&&params.instance_ids.includes(pending.item_instance_id))))reject('OPTION_ROLL_PENDING');
}
export function validateCrafting(state:AccountState,content:ValidatedContent){
  const crafting=state.equipment_crafting;if(!crafting)return;
  for(const n of Object.values(crafting.stock))if(!Number.isSafeInteger(n)||n<0)throw new Error('INVALID_CRAFTING_STOCK');
  const p=crafting.pending_roll;if(!p)return;
  const item=state.inventory.find(i=>i.instance_id===p.item_instance_id);
  if(!item||item.kind!=='equipment'||!Number.isSafeInteger(p.option_index)||p.option_index<0)throw new Error('INVALID_PENDING_OPTION');
  const current=item.options[p.option_index];if(!current||current.id!==p.original.id||current.roll!==p.original.roll)throw new Error('INVALID_PENDING_OPTION');
  const rules=optionRules(content),replacement=rules.pool.find(r=>r.id===p.replacement.id);
  if(!replacement||!Number.isSafeInteger(p.replacement.roll)||p.replacement.roll<0||p.replacement.roll>rules.roll_scale||item.options.some((o,i)=>i!==p.option_index&&rules.pool.find(r=>r.id===o.id)?.stat===replacement.stat))throw new Error('INVALID_PENDING_OPTION');
  if(!equipmentRules(content).rarities.some(r=>r.id===item.rarity_id))throw new Error('INVALID_ITEM_RARITY');
}
