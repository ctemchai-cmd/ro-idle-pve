import type { AccountState } from '../contracts/index.ts';
import { loadValidatedContent } from '../content/index.ts';
import { applySlotCommand, slotData, cardData, cardCapacity, upgradeQuote, enchantRefund, cardSalvageQuote, refineChance, type SlotCommand } from '../domain/progression/slots.ts';
import { assignedOwner, itemDefinition, type EquipmentSlot, type InventoryItem } from '../domain/progression/equipment.ts';
import { resolvedCardModifiers } from '../domain/build/equipment.ts';
import { equipmentStats } from './equipment.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
const labels=content.documents['strings.th.json']!.strings as unknown as Record<string,string>;
export const cardStatUnits=Object.fromEntries((content.documents['stat-definitions.json']!.stats as unknown as{id:string;unit:string}[]).map(s=>[s.id,s.unit]));
export const slotsData=slotData(content),cardsData=cardData(content);
export const socketCapacity=(refine:number)=>cardCapacity(refine,content);
export function slotUpgradeQuote(current:number,target:number,kind:'refine'|'enchant'){return upgradeQuote(current,target,slotsData[kind].max,slotsData[kind].upgrade_rows);}
export const refundEnchant=(state:AccountState,id:string,slot:EquipmentSlot)=>enchantRefund(state,id,slot);
export function slotChangePreview(state:AccountState,id:string,type:SlotCommand['type'],params:unknown){const next=structuredClone(state),intent={type,params,request_id:'preview'}as SlotCommand;
 const actor=next.roster.find(a=>a.character_id===id)!;
 const quote=intent.type==='slot.refine'?slotUpgradeQuote(actor.slot_progress[intent.params.slot].refine,intent.params.target_level,'refine'):intent.type==='slot.enchant'?slotUpgradeQuote(actor.slot_progress[intent.params.slot].enchant.level,intent.params.target_level,'enchant'):{};
 for(const[k,n]of Object.entries(quote))next.wallet[k as keyof AccountState['wallet']]=Math.max(next.wallet[k as keyof AccountState['wallet']],n!);
 applySlotCommand(next,intent,content,0);return{before:equipmentStats(state,id),after:equipmentStats(next,id)};}
/** Success chance (with pity) of the next Refine step for display. */
export const nextRefineChance=(progress:{refine:number;refine_failures:number})=>refineChance(progress,content);
export function cardInventory(state:AccountState,slot:EquipmentSlot){
 const presentations=content.documents['cards.json']!.presentations as unknown as{id:string;symbol_asset_id:string}[];
 return state.inventory.filter((i):i is Extract<InventoryItem,{kind:'card'}>=>i.kind==='card').filter(i=>itemDefinition(i,content).slot===slot).map(item=>{const definition=itemDefinition(item,content);return{item,definition,name:labels[definition.name_key]??definition.id,owner:assignedOwner(state,item.instance_id),iconId:presentations.find(p=>p.id===definition.presentation_id)?.symbol_asset_id??null,modifiers:resolvedCardModifiers(item,content),nextModifiers:item.level<5?resolvedCardModifiers({...item,level:item.level+1},content):null,price:item.level<5?upgradeQuote(item.level,item.level+1,5,cardsData.level_cost_rows):null};});
}
export const salvageCardsQuote=(items:readonly InventoryItem[])=>cardSalvageQuote(items,content);
