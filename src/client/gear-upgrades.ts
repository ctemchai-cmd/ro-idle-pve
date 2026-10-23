import type { AccountState } from '../contracts/index.ts';
import { loadValidatedContent } from './content.ts';
import { applyGearUpgrade, fusionCandidates, fusionQuote, type GearUpgradeCommand } from '../domain/progression/gear-upgrades.ts';
import { applyEquipmentCommand, assignedOwner, equipmentFit, itemDefinition } from '../domain/progression/equipment.ts';
import { resolvedEquipmentModifiers } from '../domain/build/equipment.ts';
import { equipmentStats } from './equipment.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
type Gear=Extract<AccountState['inventory'][number],{kind:'equipment'}>;
export function gearGrowthOptions(state:AccountState,characterId:string,id:string){
 const item=state.inventory.find((i):i is Gear=>i.instance_id===id&&i.kind==='equipment');if(!item)throw new Error('ITEM_NOT_FOUND');
 const definition=itemDefinition(item,content),owner=assignedOwner(state,id),ids=fusionCandidates(state,id,content);
 const prepare=(type:GearUpgradeCommand['type'],params:unknown,cost:Partial<AccountState['wallet']>,materialIds:string[])=>{
  const clone=structuredClone(state);for(const[k,n]of Object.entries(cost))clone.wallet[k as keyof AccountState['wallet']]=Math.max(clone.wallet[k as keyof AccountState['wallet']],n!);
  applyGearUpgrade(clone,{type,params,request_id:'preview'}as GearUpgradeCommand,content);
  const output=clone.inventory.find((i):i is Gear=>i.instance_id===(type==='equipment.fuse'?'fusion_preview':id)&&i.kind==='equipment')!;
  const beneficiary=owner?.character_id??characterId,actor=clone.roster.find(a=>a.character_id===beneficiary)!,outputDefinition=itemDefinition(output,content);
  let stats:ReturnType<typeof equipmentStats>|null=null;
  if(!equipmentFit(actor,outputDefinition.slot,output,content)){
   if(actor.equipment[outputDefinition.slot]!==output.instance_id)applyEquipmentCommand(clone,{type:'equipment.equip',params:{character_id:beneficiary,slot:outputDefinition.slot,item_instance_id:output.instance_id},request_id:'preview'}as Parameters<typeof applyEquipmentCommand>[1],content);
   stats=equipmentStats(clone,beneficiary);
  }
  return{params,cost,materialIds,output,definition:outputDefinition,modifiers:resolvedEquipmentModifiers(output,content),beneficiary,before:equipmentStats(state,beneficiary),after:stats};
 };
 let fusion:ReturnType<typeof prepare>|null=null,fusionReason='';
 if(state.active_battle)return{item,definition,base:resolvedEquipmentModifiers(item,content),fusion,fusionReason:'BUILD_LOCKED_DURING_BATTLE'};
 try{if(!ids.length)throw new Error(item.training?'TRAINING_WEAPON_RESTRICTED':item.locked?'ITEM_LOCKED':owner?'ITEM_EQUIPPED':item.rarity_id==='supreme'?'RARITY_MAX_REACHED':'NOT_ENOUGH_MATCHING_EQUIPMENT');const quote=fusionQuote(state,ids,content);fusion=prepare('equipment.fuse',{instance_ids:ids},quote.cost,ids);}catch(error){fusionReason=error instanceof Error?error.message:'FUSION_UNAVAILABLE';}
 return{item,definition,base:resolvedEquipmentModifiers(item,content),fusion,fusionReason};
}
