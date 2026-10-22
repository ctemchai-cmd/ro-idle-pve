import { enchantLinesFor, slotModifiers } from '../domain/build/slot-definition.ts';
import type { AccountState, Effect } from '../contracts/index.ts';
import { loadValidatedContent } from '../content/index.ts';
import { applySlotCommand, slotData, cardData, cardCapacity, upgradeQuote, enchantRefund, cardSalvageQuote, refineChance, type SlotCommand } from '../domain/progression/slots.ts';
import { assignedOwner, itemDefinition, type EquipmentSlot, type InventoryItem } from '../domain/progression/equipment.ts';
import { resolvedCardModifiers, resolvedCardTriggers } from '../domain/build/equipment.ts';
import { cardOrigins } from '../content/card-catalog.ts';
import { effectDescriptions } from './skills.ts';
import { equipmentStats } from './equipment.ts';
import { elementNames as elements } from './elements.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
const labels=content.documents['strings.th.json']!.strings as unknown as Record<string,string>;
export const statHigherIsBetter=(id:string)=>(content.documents['stat-definitions.json']!.stats as unknown as {id:string;higher_is_better?:boolean}[]).find(s=>s.id===id)?.higher_is_better!==false;
export const cardStatUnits=Object.fromEntries((content.documents['stat-definitions.json']!.stats as unknown as{id:string;unit:string}[]).map(s=>[s.id,s.unit]));
export const slotsData=slotData(content),cardsData=cardData(content);
export const slotEnchantLines=(slot:EquipmentSlot)=>enchantLinesFor(slot,content);
export const refineModifiers=(slot:EquipmentSlot)=>slotModifiers(content).refine.per_step_modifiers[slot];
export const socketCapacity=(refine:number)=>cardCapacity(refine,content);
/** Cards belong to a character's equipment slot, never to the item being previewed. */
export function equippedCardSlots(state:AccountState,characterId:string,slot:EquipmentSlot){
 const actor=state.roster.find(a=>a.character_id===characterId);
 if(!actor?.equipment[slot])return [];
 return actor.slot_progress[slot].cards.slice(0,socketCapacity(actor.slot_progress[slot].refine)).map((id,index)=>{
  const card=id?state.inventory.find(item=>item.instance_id===id&&item.kind==='card'):null;
  return{index,quality:card?.rarity_id??null,name:card?labels[itemDefinition(card,content).name_key]??card.definition_id:null};
 });
}
export function slotUpgradeQuote(current:number,target:number,kind:'refine'|'enchant'){return upgradeQuote(current,target,slotsData[kind].max,slotsData[kind].upgrade_rows);}
export const refundEnchant=(state:AccountState,id:string,slot:EquipmentSlot)=>enchantRefund(state,id,slot);
export function slotChangePreview(state:AccountState,id:string,type:SlotCommand['type'],params:unknown){const next=structuredClone(state),intent={type,params,request_id:'preview'}as SlotCommand;
 const actor=next.roster.find(a=>a.character_id===id)!;
 const quote=intent.type==='slot.refine'?slotUpgradeQuote(actor.slot_progress[intent.params.slot].refine,intent.params.target_level,'refine'):intent.type==='slot.enchant'?slotUpgradeQuote(actor.slot_progress[intent.params.slot].enchant.level,intent.params.target_level,'enchant'):{};
 for(const[k,n]of Object.entries(quote))next.wallet[k as keyof AccountState['wallet']]=Math.max(next.wallet[k as keyof AccountState['wallet']],n!);
 applySlotCommand(next,intent,content,0);return{before:equipmentStats(state,id),after:equipmentStats(next,id)};}
/** Success chance (with pity) of the next Refine step for display. */
export const nextRefineChance=(progress:{refine:number;refine_failures:number})=>refineChance(progress,content);
type CardItem = Extract<InventoryItem,{kind:'card'}>;
export const cardOrigin = (id:string) => cardOrigins(content)[id] ?? null;
function cardEffects(item:CardItem):string[]{
 const definition=itemDefinition(item,content),result=definition.defense_element?[`เปลี่ยนธาตุเกราะเป็น${elements[definition.defense_element]??definition.defense_element}`]:[];
 for(const trigger of resolvedCardTriggers(item,content)){
  const event=trigger.event==='normal_attack_hit'?'โจมตีปกติโดน':trigger.event==='damage_received'?'รับดาเมจ':trigger.event==='damage_dealt'?'ทำดาเมจ':'เข้าเงื่อนไข';
  const kind=trigger.accepted_damage_types?.map(t=>t==='physical'?'กายภาพ':t==='magical'?'เวท':'จริง').join('/');
  const tag=trigger.when?.type==='has_tag'?trigger.when.tag:null,condition=tag?({race_demihuman:'กึ่งมนุษย์',race_undead:'อันเดด',size_large:'ขนาดใหญ่',size_medium:'ขนาดกลาง',size_small:'ขนาดเล็ก',boss:'บอส',element_water:'ธาตุน้ำ',element_earth:'ธาตุดิน'}as Record<string,string>)[tag]??tag:null;
  const chance=typeof trigger.chance==='number'?`${(Math.min(1,trigger.chance)*100).toLocaleString('th-TH',{maximumFractionDigits:2})}%`:'';
  result.push(`เมื่อ${event}${kind?' '+kind:''}${condition?' · เป้า'+condition:''} · โอกาส ${chance}: ${effectDescriptions(structuredClone(trigger.effects)as Effect[]).join(' / ')}`);
 }
 return result;
}
export function cardView(item:CardItem,state:AccountState){
 const presentations=content.documents['cards.json']!.presentations as unknown as{id:string;symbol_asset_id:string}[];
 const definition=itemDefinition(item,content);return{item,definition,name:labels[definition.name_key]??definition.id,owner:assignedOwner(state,item.instance_id),iconId:presentations.find(p=>p.id===definition.presentation_id)?.symbol_asset_id??null,origin:cardOrigin(item.definition_id),effects:cardEffects(item),nextEffects:item.level<5?cardEffects({...item,level:item.level+1}):null,modifiers:resolvedCardModifiers(item,content),nextModifiers:item.level<5?resolvedCardModifiers({...item,level:item.level+1},content):null,price:item.level<5?upgradeQuote(item.level,item.level+1,5,cardsData.level_cost_rows):null};
}
export function cardInventory(state:AccountState,slot:EquipmentSlot){return state.inventory.filter((i):i is CardItem=>i.kind==='card').filter(i=>itemDefinition(i,content).slot===slot).map(item=>cardView(item,state)).sort((a,b)=>Number(!!a.owner)-Number(!!b.owner)||rarityOrder(b.item.rarity_id)-rarityOrder(a.item.rarity_id)||b.item.level-a.item.level||a.name.localeCompare(b.name,'th'));}
const rarityOrder=(id:string)=>['common','uncommon','rare','epic','legendary','immortal','supreme'].indexOf(id);
export function farmCardRarityOdds(profile:NonNullable<NonNullable<AccountState['farm']['rate_snapshot']>['card_drops']>){
 const weights:Record<string,number>={};for(const id of profile.definition_pool){const rarity=profile.definition_rarities?.[id]??cardOrigins(content)[id]?.rarity_id;if(rarity)weights[rarity]=(weights[rarity]??0)+(profile.definition_weights[id]??0);}
 const total=Object.values(weights).reduce((a,b)=>a+b,0);return Object.entries(weights).sort(([a],[b])=>rarityOrder(a)-rarityOrder(b)).map(([rarity,weight])=>({rarity,percent:weight/total*100}));
}
export const salvageCardsQuote=(items:readonly InventoryItem[])=>cardSalvageQuote(items,content);
