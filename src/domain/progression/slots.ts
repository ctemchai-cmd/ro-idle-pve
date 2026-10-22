import type { AccountState, Command } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { assignedOwner, itemDefinition, type EquipmentSlot, type InventoryItem } from './equipment.ts';
import { ProgressionRejection } from './rejection.ts';
import { cardRarityDust } from '../build/card-rarity.ts';
type Wallet=AccountState['wallet'];
export type SlotCommand=Extract<Command,{type:'slot.refine'|'slot.enchant'|'slot.change_enchant'|'card.assign'|'card.unassign'|'card.upgrade'|'card.salvage'}>;
export interface SlotData {refine:{max:number;success_chance_by_target:Record<string,number>;pity:{bonus_per_failure:number;cap:number};upgrade_rows:{from:number;to:number;gold:number;refine_ore:number}[]};enchant:{max:number;lines:Record<string,unknown>;upgrade_rows:{from:number;to:number;gold:number;enchant_dust:number}[]};cards:{capacity_by_refine:{minimum_refine:number;slots:number}[]}}
interface CardData{level_cost_rows:{from:number;to:number;gold:number;card_dust:number}[];rarities:{id:string;salvage_card_dust:number}[]}
export const slotData=(content:ValidatedContent)=>content.documents['slot-progress.json'] as unknown as SlotData;
export const cardData=(content:ValidatedContent)=>content.documents['cards.json'] as unknown as CardData;
function reject(code:string):never{throw new ProgressionRejection(code);}
/** D-057: chance of the next single Refine step including accumulated pity; never above the pity cap. */
export function refineChance(progress:{refine:number;refine_failures:number},content:ValidatedContent):number{
 const refine=slotData(content).refine,base=refine.success_chance_by_target[String(progress.refine+1)];if(base===undefined)return 0;
 return Math.min(refine.pity.cap,base+refine.pity.bonus_per_failure*progress.refine_failures);
}
export function cardCapacity(refine:number,content:ValidatedContent){return slotData(content).cards.capacity_by_refine.filter(row=>row.minimum_refine<=refine).at(-1)!.slots;}
/** Shared integer-cost accumulator for both command and before-confirm preview. */
export function upgradeQuote(current:number,target:number,maximum:number,rows:readonly {from:number;to:number;gold:number;refine_ore?:number;enchant_dust?:number;card_dust?:number}[]):Partial<Wallet>{
 if(!Number.isInteger(target)||target<=current)reject('UPGRADE_LEVEL_UNCHANGED');if(target>maximum)reject('UPGRADE_CAP_REACHED');
 const cost:Partial<Wallet>={};for(let level=current;level<target;level++){const row=rows.find(r=>r.from===level&&r.to===level+1);if(!row)throw new Error('MISSING_UPGRADE_PRICE');for(const key of ['gold','refine_ore','enchant_dust','card_dust']as const)if(row[key]!==undefined)cost[key]=(cost[key]??0)+row[key]!;}return cost;
}
export function enchantRefund(state:AccountState,id:string,slot:EquipmentSlot):Partial<Wallet>{
 const result:Partial<Wallet>={};for(const row of state.paid_ledger)if(row.character_id===id&&row.feature_id===`enchant_${slot}`&&row.refund_state==='active')for(const key of Object.keys(row.paid_resources)as(keyof Wallet)[])result[key]=(result[key]??0)+row.paid_resources[key];return result;
}
export function cardSalvageQuote(items:readonly InventoryItem[],content:ValidatedContent):Partial<Wallet>{
 let dust=0;for(const item of items){if(item.kind!=='card')reject('CARD_REQUIRED');dust+=cardRarityDust(item,content);}return{card_dust:dust};
}
/** `roll` is a server-injected uniform [0,1) value; previews pass 0 to show the success outcome. */
export function applySlotCommand(state:AccountState,command:SlotCommand,content:ValidatedContent,roll:number|null=null):string{
 if(state.active_battle)reject('BUILD_LOCKED_DURING_BATTLE');
 const slots=slotData(content),cards=cardData(content);
 const pay=(cost:Partial<Wallet>)=>{for(const key of Object.keys(cost)as(keyof Wallet)[])if(state.wallet[key]<cost[key]!)reject('INSUFFICIENT_RESOURCES');for(const key of Object.keys(cost)as(keyof Wallet)[])state.wallet[key]-=cost[key]!;};
 if(command.type==='card.salvage'){
  const ids=command.params.instance_ids;if(!ids.length||new Set(ids).size!==ids.length)reject('INVALID_ITEM_SELECTION');const selected=ids.map(id=>state.inventory.find(i=>i.instance_id===id)??reject('ITEM_NOT_FOUND'));
  for(const item of selected){if(item.kind!=='card')reject('CARD_REQUIRED');if(item.locked)reject('ITEM_LOCKED');if(assignedOwner(state,item.instance_id))reject('ITEM_EQUIPPED');}
  const quote=cardSalvageQuote(selected,content);if(!Number.isSafeInteger(state.wallet.card_dust+quote.card_dust!))reject('RESOURCE_OVERFLOW');state.wallet.card_dust+=quote.card_dust!;state.inventory=state.inventory.filter(i=>!ids.includes(i.instance_id));return'CARDS_SALVAGED';
 }
 if(command.type==='card.upgrade'){
  const card=state.inventory.find(i=>i.instance_id===command.params.card_instance_id);if(!card)reject('ITEM_NOT_FOUND');if(card.kind!=='card')reject('CARD_REQUIRED');
  const cost=upgradeQuote(card.level,command.params.target_level,5,cards.level_cost_rows);pay(cost);card.level=command.params.target_level;return'CARD_UPGRADED';
 }
 const actor=state.roster.find(a=>a.character_id===command.params.character_id);if(!actor)reject('CHARACTER_NOT_FOUND');const slot=command.params.slot,progress=actor.slot_progress[slot];
 if(command.type==='slot.refine'){
  // One step per command so each step rolls its own chance; failure keeps the level and only spends the step cost.
  if(command.params.target_level!==progress.refine+1&&command.params.target_level>progress.refine)reject('REFINE_ONE_STEP');
  const cost=upgradeQuote(progress.refine,command.params.target_level,slots.refine.max,slots.refine.upgrade_rows),chance=refineChance(progress,content);
  if(chance<1&&(roll===null||!(roll>=0&&roll<1)))throw new Error('SERVER_ROLL_REQUIRED');
  pay(cost);
  if(chance<1&&roll!>=chance){progress.refine_failures++;return'REFINE_FAILED';}
  progress.refine=command.params.target_level;progress.refine_failures=0;return'SLOT_REFINED';
 }
 if(command.type==='slot.enchant'){
  if(progress.enchant.line_id&&progress.enchant.line_id!==command.params.line_id)reject('ENCHANT_LINE_CONFLICT');if(!slots.enchant.lines[command.params.line_id])reject('INVALID_ENCHANT_LINE');
  const current=progress.enchant.level,cost=upgradeQuote(current,command.params.target_level,slots.enchant.max,slots.enchant.upgrade_rows);pay(cost);
  const version=content.manifest.content_version;state.paid_ledger.push({entry_id:`investment_${command.request_id}`,character_id:actor.character_id,feature_id:`enchant_${slot}`,skill_id:command.params.line_id,quantity:command.params.target_level-current,cost_version:version,cost_versions:[version],paid_resources:{...Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])),...cost}as Wallet,refund_state:'active',refund_command_id:null});
  progress.enchant={line_id:command.params.line_id,level:command.params.target_level};return'SLOT_ENCHANTED';
 }
 if(command.type==='slot.change_enchant'){
  if(progress.enchant.line_id===command.params.line_id)reject('ENCHANT_LINE_UNCHANGED');if(!slots.enchant.lines[command.params.line_id])reject('INVALID_ENCHANT_LINE');
  const refund=enchantRefund(state,actor.character_id,slot);for(const key of Object.keys(refund)as(keyof Wallet)[])if(!Number.isSafeInteger(state.wallet[key]+refund[key]!))reject('RESOURCE_OVERFLOW');for(const key of Object.keys(refund)as(keyof Wallet)[])state.wallet[key]+=refund[key]!;
  for(const row of state.paid_ledger)if(row.character_id===actor.character_id&&row.feature_id===`enchant_${slot}`&&row.refund_state==='active'){row.refund_state='refunded';row.refund_command_id=command.request_id;}
  progress.enchant={line_id:command.params.line_id,level:0};return'ENCHANT_LINE_CHANGED';
 }
 const index=command.params.card_slot;if(index>=cardCapacity(progress.refine,content))reject('CARD_SLOT_LOCKED');
 if(command.type==='card.unassign'){if(!progress.cards[index])reject('CARD_SLOT_EMPTY');progress.cards[index]=null;return'CARD_UNASSIGNED';}
 const card=state.inventory.find(i=>i.instance_id===command.params.card_instance_id);if(!card)reject('ITEM_NOT_FOUND');if(card.kind!=='card')reject('CARD_REQUIRED');if(itemDefinition(card,content).slot!==slot)reject('CARD_SLOT_MISMATCH');
 if(progress.cards[index]===card.instance_id)reject('CARD_ALREADY_ASSIGNED');
 for(const owner of state.roster)for(const values of Object.values(owner.slot_progress))values.cards=values.cards.map(id=>id===card.instance_id?null:id)as typeof values.cards;
 progress.cards[index]=card.instance_id;return'CARD_ASSIGNED';
}
