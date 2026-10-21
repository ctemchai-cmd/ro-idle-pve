import { loadValidatedContent } from '../content/index.ts';
import type { AccountState, CombatStats } from '../contracts/index.ts';
import { applyEquipmentCommand, assignedOwner, equipmentFit, equipmentRules, equipmentSlots, itemDefinition, salvageQuote, type EquipmentCommand, type EquipmentSlot, type InventoryItem } from '../domain/progression/equipment.ts';
import { equippedSources, resolvedEquipmentModifiers } from '../domain/build/equipment.ts';
import { optionModifiers } from '../domain/build/item-options.ts';
import { previewCharacterStats } from '../domain/build/character.ts';
import { compileCharacterSkills } from '../domain/progression/skills.ts';
import { castDurationMs, skillIntervalMs } from '../domain/math/index.ts';
export { equipmentSlots, assignedOwner, salvageQuote };
export type { EquipmentSlot, InventoryItem };
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
export const equipmentData=equipmentRules(content);
const labels=content.documents['strings.th.json']!.strings as unknown as Record<string,string>;
export const slotLabels:Record<EquipmentSlot,string>={weapon:'อาวุธ',head:'ศีรษะ',armor:'ชุดเกราะ',garment:'ผ้าคลุม',shoes:'รองเท้า',accessory:'เครื่องประดับ'};
export const weaponLabels:Record<string,string>={sword:'ดาบ',bow:'ธนู',staff:'คทา',book:'สมุด',knuckle:'หมัด',axe:'ขวาน',mace:'กระบอง',dagger:'มีด',whip:'แส้',instrument:'กีตาร์'};
export const rarityLabels:Record<string,string>={common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic',legendary:'Legendary',immortal:'Immortal',supreme:'Supreme',bronze:'Bronze',silver:'Silver',gold:'Gold'};
export function inventoryView(state:AccountState,characterId:string){
 const actor=state.roster.find(a=>a.character_id===characterId)!;
 const presentations=content.documents['equipment.json']!.presentations as unknown as{id:string;icon_asset_id:string}[];
 return state.inventory.filter((item):item is Extract<InventoryItem,{kind:'equipment'}>=>item.kind==='equipment').map(item=>{
  const definition=itemDefinition(item,content),slot=definition.slot as EquipmentSlot;
  return{item,definition,slot,name:labels[definition.name_key]??`${definition.weapon_type?weaponLabels[definition.weapon_type]:slotLabels[slot]} Lv.${definition.tier_level}`,owner:assignedOwner(state,item.instance_id),reason:equipmentFit(actor,slot,item,content),iconId:presentations.find(p=>p.id===definition.presentation_id)?.icon_asset_id??null};
 });
}
export function equipmentStats(state:AccountState,characterId:string):{stats:CombatStats;intervalMs:number;casts:{id:string;ct:number;acd:number}[]}{
 const actor=state.roster.find(a=>a.character_id===characterId)!;
 const skills=compileCharacterSkills(actor,content),stats=previewCharacterStats(actor,skills.resolved_skills,content,equippedSources(actor,state,content));
 return{stats,intervalMs:skillIntervalMs(stats.attack_speed,3000),casts:actor.active_slots.filter((id):id is string=>!!id).map(id=>{const skill=skills.resolved_skills[id]!.definition;if(skill.kind!=='active')throw new Error('ACTIVE_SKILL_REQUIRED');return{id,ct:castDurationMs(Number(skill.timing.cast_ms),stats.cast_speed),acd:castDurationMs(Number(skill.timing.after_cast_ms),stats.cast_speed)};})};
}
export function equipmentPreview(state:AccountState,characterId:string,slot:EquipmentSlot,id:string|null){
 const next=structuredClone(state);
 const command={type:id?'equipment.equip':'equipment.unequip',params:{character_id:characterId,slot,...(id?{item_instance_id:id}:{})}}as EquipmentCommand;
 applyEquipmentCommand(next,command,content);
 return{before:equipmentStats(state,characterId),after:equipmentStats(next,characterId)};
}
/** Equipped head/garment tiers for presentation (visible headgear/garment); stats never read this. */
export function wardrobeTiers(state:AccountState,characterId:string):{head_tier:number|null;garment_tier:number|null}{
 const actor=state.roster.find(a=>a.character_id===characterId),tier=(id:string|null)=>{const item=id?state.inventory.find(i=>i.instance_id===id):undefined;return item?itemDefinition(item,content).tier_level:null;};
 return{head_tier:tier(actor?.equipment.head??null),garment_tier:tier(actor?.equipment.garment??null)};
}
export function itemSalvageQuote(items:readonly InventoryItem[]){return salvageQuote(items,content);}
/** Resolved base modifiers of one gear instance (tier+rarity), without slot investment. */
/** Base stats of an item (rarity-scaled definition); random option lines are listed separately by itemOptions. */
export function itemModifiers(item:Extract<InventoryItem,{kind:'equipment'}>){return resolvedEquipmentModifiers(item,content).filter(m=>!m.id.startsWith('option_'));}
/** D-062 random option lines at the item's current tier. */
export function itemOptions(item:Extract<InventoryItem,{kind:'equipment'}>){return optionModifiers(item,itemDefinition(item,content).tier_level,content);}
export const rarityRank:Record<string,number>=Object.fromEntries(equipmentData.rarities.map(r=>[r.id,r.rank]));
