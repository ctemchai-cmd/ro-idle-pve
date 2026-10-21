import type { AccountState, Command } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { ProgressionRejection } from './rejection.ts';

export { equipmentSlots, equipmentRules, itemDefinition, equipmentFit } from '../build/equipment-definition.ts';
export type { InventoryItem, EquipmentSlot, EquipmentRules } from '../build/equipment-definition.ts';
import { equipmentSlots, equipmentRules, itemDefinition, equipmentFit, type InventoryItem, type EquipmentSlot } from '../build/equipment-definition.ts';
export type EquipmentCommand = Extract<Command, {type:'equipment.equip'|'equipment.unequip'|'equipment.lock'|'equipment.salvage'|'equipment.purchase_weapon'}>;
function reject(code:string):never{throw new ProgressionRejection(code);}
/** Ownership is an assignment; the one canonical instance always stays in inventory. */
export function assignedOwner(state:AccountState,id:string):{character_id:string;slot:EquipmentSlot;kind:InventoryItem['kind']}|null {
 for(const actor of state.roster)for(const slot of equipmentSlots){
  if(actor.equipment[slot]===id)return{character_id:actor.character_id,slot,kind:'equipment'};
  if(actor.slot_progress[slot].cards.includes(id))return{character_id:actor.character_id,slot,kind:'card'};
 }
 return null;
}
export function salvageQuote(items:readonly InventoryItem[],content:ValidatedContent):Partial<AccountState['wallet']> {
 const rules=equipmentRules(content),result={gold:0,refine_ore:0};
 for(const item of items){
  if(item.kind!=='equipment')reject('EQUIPMENT_REQUIRED');
  const definition=itemDefinition(item,content);if(item.training)continue;
  const rank=rules.rarities.find(r=>r.id===item.rarity_id)?.rank;if(rank===undefined)throw new Error('INVALID_ITEM_RARITY');
  const factor=1+Math.floor(definition.tier_level/20);
  result.gold+=rules.salvage.gold_per_tier_unit*factor;result.refine_ore+=rules.salvage.refine_ore_by_rarity[rank]!*factor;
 }
 return result;
}
/** Enclosing account transaction owns the clone, receipt and CAS. No IO/clock/RNG. */
export function applyEquipmentCommand(state:AccountState,command:EquipmentCommand,content:ValidatedContent):string {
 if(state.active_battle)reject('BUILD_LOCKED_DURING_BATTLE');
 const rules=equipmentRules(content);
 if(command.type==='equipment.salvage'){
  const ids=command.params.instance_ids;
  if(!ids.length||new Set(ids).size!==ids.length)reject('INVALID_ITEM_SELECTION');
  const items=ids.map(id=>state.inventory.find(i=>i.instance_id===id)??reject('ITEM_NOT_FOUND'));
  for(const item of items){if(item.kind!=='equipment')reject('EQUIPMENT_REQUIRED');if(item.locked)reject('ITEM_LOCKED');if(assignedOwner(state,item.instance_id))reject('ITEM_EQUIPPED');}
  const quote=salvageQuote(items,content);
  for(const[key,value]of Object.entries(quote)){const total=state.wallet[key as keyof typeof state.wallet]+value!;if(!Number.isSafeInteger(total))reject('RESOURCE_OVERFLOW');}
  for(const[key,value]of Object.entries(quote))state.wallet[key as keyof typeof state.wallet]+=value!;
  state.inventory=state.inventory.filter(i=>!ids.includes(i.instance_id));return'EQUIPMENT_SALVAGED';
 }
 if(command.type==='equipment.lock'){
  const item=state.inventory.find(i=>i.instance_id===command.params.item_instance_id);if(!item)reject('ITEM_NOT_FOUND');item!.locked=command.params.locked;return'ITEM_LOCK_UPDATED';
 }
 const actor=state.roster.find(a=>a.character_id===command.params.character_id);if(!actor)reject('CHARACTER_NOT_FOUND');
 if(command.type==='equipment.purchase_weapon'){
  if(state.inventory.length>=rules.inventory_capacity)reject('INVENTORY_FULL');
  if(command.params.weapon_type!==rules.weapon_compatibility[actor!.job_id])reject('WEAPON_INCOMPATIBLE');
  const price=rules.targeted_weapon_purchase.cost_rows.find(r=>r.tier_level===command.params.tier_level);
  const definition=Object.values(content.items).find(d=>d.kind==='equipment'&&d.weapon_type===command.params.weapon_type&&d.tier_level===command.params.tier_level);
  if(!price||!definition)reject('TRAINING_WEAPON_UNAVAILABLE');if(state.wallet.gold<price!.gold)reject('INSUFFICIENT_RESOURCES');
  const id=`purchase_${command.request_id}`;if(state.inventory.some(i=>i.instance_id===id))reject('DUPLICATE_ITEM_INSTANCE');
  state.wallet.gold-=price!.gold;state.inventory.push({kind:'equipment',instance_id:id,definition_id:String(definition!.id),rarity_id:'common',locked:false,training:true,options:[]});return'TRAINING_WEAPON_PURCHASED';
 }
 const slot=command.params.slot;
 if(command.type==='equipment.unequip'){if(!actor!.equipment[slot])reject('SLOT_ALREADY_EMPTY');actor!.equipment[slot]=null;return'EQUIPMENT_REMOVED';}
 const item=state.inventory.find(i=>i.instance_id===command.params.item_instance_id);if(!item)reject('ITEM_NOT_FOUND');
 const reason=equipmentFit(actor!,slot,item!,content);if(reason)reject(reason);
 if(actor!.equipment[slot]===item!.instance_id)reject('ITEM_ALREADY_EQUIPPED');
 // Moving never duplicates a payload or transfers the original owner's slot progress.
 for(const owner of state.roster)for(const key of equipmentSlots)if(owner.equipment[key]===item!.instance_id)owner.equipment[key]=null;
 actor!.equipment[slot]=item!.instance_id;return'EQUIPMENT_ASSIGNED';
}

export function validateInventory(state:AccountState,content:ValidatedContent):void {
 const ids=new Set<string>(),assigned=new Set<string>();
 if(state.inventory.length>equipmentRules(content).inventory_capacity)throw new Error('INVENTORY_CAPACITY_EXCEEDED');
 for(const item of state.inventory){if(ids.has(item.instance_id))throw new Error('DUPLICATE_ITEM_INSTANCE');ids.add(item.instance_id);itemDefinition(item,content);if(item.kind==='equipment'&&item.training&&(item.rarity_id!=='common'||content.items[item.definition_id]!.tier_level!==1||content.items[item.definition_id]!.slot!=='weapon'))throw new Error('INVALID_TRAINING_WEAPON');}
 const capacities=(content.documents['slot-progress.json']!.cards as unknown as{capacity_by_refine:{minimum_refine:number;slots:number}[]}).capacity_by_refine;
 for(const actor of state.roster)for(const slot of equipmentSlots){
  const id=actor.equipment[slot];
  if(id){const item=state.inventory.find(i=>i.instance_id===id);if(!item||equipmentFit(actor,slot,item,content))throw new Error('INVALID_EQUIPPED_ITEM');if(assigned.has(id))throw new Error('DUPLICATE_ITEM_ASSIGNMENT');assigned.add(id);}
  const progress=actor.slot_progress[slot],capacity=capacities.filter(row=>row.minimum_refine<=progress.refine).at(-1)!.slots;
  if(progress.enchant.level>0&&!progress.enchant.line_id)throw new Error('INVALID_ENCHANT_LINE');
  progress.cards.forEach((cardId,index)=>{if(!cardId)return;const card=state.inventory.find(i=>i.instance_id===cardId);if(index>=capacity||!card||card.kind!=='card'||itemDefinition(card,content).slot!==slot)throw new Error('INVALID_CARD_ASSIGNMENT');if(assigned.has(cardId))throw new Error('DUPLICATE_ITEM_ASSIGNMENT');assigned.add(cardId);});
 }
}
