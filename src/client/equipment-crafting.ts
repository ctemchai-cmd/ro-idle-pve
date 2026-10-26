import type { AccountState } from '../contracts/index.ts';
import { loadValidatedContent } from './content.ts';
import { craftingRules, craftingStock, optionStoneQuote, rarityStoneQuote } from '../domain/progression/equipment-crafting.ts';
import { optionValue, type ItemOption } from '../domain/build/item-options.ts';
import { itemDefinition } from '../domain/build/equipment-definition.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw Error('CONTENT_UNAVAILABLE');const content=loaded.value;
export type CraftingMaterial='option_stone'|'rarity_stone';
export function craftingMaterialName(key:CraftingMaterial){return craftingRules(content).materials[key].name;}
export function craftingInventory(state:AccountState){return{option_stone:craftingStock(state,'option_stone'),rarity_stone:craftingStock(state,'rarity_stone')};}
export function craftingOption(option:ItemOption,tier:number){const {row,value}=optionValue(option,tier,content);return{stat:row.stat,value,percent:row.op==='add_percent'};}
export function craftingView(state:AccountState,id:string,index:number){
 const item=state.inventory.find(i=>i.instance_id===id);if(!item||item.kind!=='equipment')throw Error('ITEM_NOT_FOUND');
 const definition=itemDefinition(item,content),rules=craftingRules(content),pending=state.equipment_crafting?.pending_roll;
 let rarity:ReturnType<typeof rarityStoneQuote>|null=null,rarityReason='',roll:ReturnType<typeof optionStoneQuote>|null=null,rollReason='';
 try{rarity=rarityStoneQuote(state,id,content);}catch(e){rarityReason=(e as Error).message;}
 try{roll=optionStoneQuote(state,id,index,content);}catch(e){rollReason=(e as Error).message;}
 const strings=content.documents['strings.th.json']!.strings as unknown as Record<string,string>;
 return{name:strings[definition.name_key]??definition.id,item,definition,rules,stock:craftingInventory(state),pending:pending?.item_instance_id===id?pending:null,otherPending:pending&&pending.item_instance_id!==id?pending:null,rarity,rarityReason,roll,rollReason};
}
