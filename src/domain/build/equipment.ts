import type { AccountState, Modifier, StatBlueprint, Trigger } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { equipmentFit, equipmentRules, equipmentSlots, itemDefinition, type EquipmentSlot } from './equipment-definition.ts';
import { optionModifiers } from './item-options.ts';
type Source=StatBlueprint['permanent_sources'][number];
interface SlotRules {refine:{per_step_modifiers:Record<EquipmentSlot,Modifier[]>};enchant:{lines:Record<string,Modifier[]>}}
export function resolvedEquipmentModifiers(item:Extract<AccountState['inventory'][number],{kind:'equipment'}>,content:ValidatedContent):Modifier[]{
 const multiplier=equipmentRules(content).rarities.find(r=>r.id===item.rarity_id)?.power_multiplier;if(multiplier===undefined)throw new Error('INVALID_ITEM_RARITY');
 const definition=itemDefinition(item,content);
 return [...structuredClone(definition.modifiers).map(m=>{if(typeof m.value!=='number')throw new Error('UNRESOLVED_ITEM_MODIFIER');return{...m,value:m.op==='add_flat'?Math.floor(m.value*multiplier):m.value};}),...optionModifiers(item,definition.tier_level,content)]; // D-062 option lines follow the base stats
}
export function resolvedCardModifiers(card:Extract<AccountState['inventory'][number],{kind:'card'}>,content:ValidatedContent):Modifier[]{
 const rules=content.documents['cards.json'] as unknown as{level_multipliers:number[];rarities:{id:string;multiplier:number}[]};
 const quality=rules.rarities.find(r=>r.id===card.rarity_id)?.multiplier,level=rules.level_multipliers[card.level-1];
 if(quality===undefined||level===undefined)throw new Error('INVALID_CARD_PROGRESSION');
 return structuredClone(itemDefinition(card,content).modifiers).map(m=>{if(typeof m.value!=='number')throw new Error('UNRESOLVED_ITEM_MODIFIER');return{...m,value:m.value*quality*level};});
}
/** One compiler for battle and previews. Item rarity never multiplies slot/card sources. */
export function equippedSources(actor:AccountState['roster'][number],state:AccountState,content:ValidatedContent):Source[]{
 const slots=content.documents['slot-progress.json'] as unknown as SlotRules;
 const source=(id:string,definition:string,modifiers:readonly Modifier[],triggers:readonly Trigger[]=[],scale=1):Source=>({
  source:{instance_id:id,owner_actor_id:actor.character_id,definition_id:definition,origin_actor_id:actor.character_id,origin_life_epoch:0},
  modifiers:structuredClone(modifiers).map(m=>{if(typeof m.value!=='number')throw new Error('UNRESOLVED_ITEM_MODIFIER');return{...m,value:m.value*scale};}),triggers:structuredClone(triggers)as Trigger[]
 });
 return equipmentSlots.flatMap(slot=>{
  const id=actor.equipment[slot];if(!id)return[]; // Investments remain dormant in an empty slot.
  const item=state.inventory.find(i=>i.instance_id===id);if(!item||equipmentFit(actor,slot,item,content))throw new Error('INVALID_EQUIPPED_ITEM');
  if(item.kind!=='equipment')throw new Error('INVALID_EQUIPPED_ITEM');
  const definition=itemDefinition(item,content);
  const result=[source(id,item.definition_id,resolvedEquipmentModifiers(item,content),definition.triggers)],progress=actor.slot_progress[slot];
  if(progress.refine)result.push(source(`slot_${actor.character_id}_${slot}_refine`,`refine_${slot}`,slots.refine.per_step_modifiers[slot],[],progress.refine));
  if(progress.enchant.line_id&&progress.enchant.level)result.push(source(`slot_${actor.character_id}_${slot}_enchant`,`enchant_${progress.enchant.line_id}`,slots.enchant.lines[progress.enchant.line_id]!,[],progress.enchant.level));
  for(const cardId of progress.cards){if(!cardId)continue;const card=state.inventory.find(i=>i.instance_id===cardId);if(!card||card.kind!=='card')throw new Error('INVALID_CARD_ASSIGNMENT');const def=itemDefinition(card,content);result.push(source(cardId,card.definition_id,resolvedCardModifiers(card,content),def.triggers));}
  return result;
 });
}
