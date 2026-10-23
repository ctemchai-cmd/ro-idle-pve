import type { AccountState, Command } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { assignedOwner, equipmentRules, itemDefinition, type InventoryItem } from './equipment.ts';
import { ProgressionRejection } from './rejection.ts';
import { rollItemOptions } from '../build/item-options.ts';
export type GearUpgradeCommand=Extract<Command,{type:'equipment.fuse'|'equipment.tier_up'}>;
type Gear=Extract<InventoryItem,{kind:'equipment'}>;
function reject(code:string):never{throw new ProgressionRejection(code);}
function gear(state:AccountState,id:string):Gear{const item=state.inventory.find(i=>i.instance_id===id);if(!item)reject('ITEM_NOT_FOUND');if(item.kind!=='equipment')reject('EQUIPMENT_REQUIRED');return item;}
export function fusionQuote(state:AccountState,ids:readonly string[],content:ValidatedContent){
 const rules=equipmentRules(content);if(ids.length!==rules.fusion.input_count||new Set(ids).size!==ids.length)reject('INVALID_FUSION_SELECTION');
 const items=ids.map(id=>gear(state,id));for(const item of items){if(item.locked)reject('ITEM_LOCKED');if(assignedOwner(state,item.instance_id))reject('ITEM_EQUIPPED');if(item.training)reject('TRAINING_WEAPON_RESTRICTED');}
 const first=items[0]!,definition=itemDefinition(first,content);
 for(const item of items){const def=itemDefinition(item,content);if(item.rarity_id!==first.rarity_id||def.tier_level!==definition.tier_level||def.slot!==definition.slot||def.weapon_type!==definition.weapon_type)reject('FUSION_MISMATCH');}
 const rank=rules.rarities.find(r=>r.id===first.rarity_id)?.rank;if(rank===undefined)throw new Error('INVALID_ITEM_RARITY');const next=rules.rarities.find(r=>r.rank===rank+1);if(!next)reject('RARITY_MAX_REACHED');
 return{items,next_rarity:next.id as Gear['rarity_id'],definition,cost:structuredClone(rules.fusion.fee)};
}
export function tierQuote(state:AccountState,id:string,target:number,content:ValidatedContent){
 if(!equipmentRules(content).tier_upgrade.enabled)reject('TIER_UPGRADE_DISABLED');
 const item=gear(state,id);if(item.training)reject('TRAINING_WEAPON_RESTRICTED');const definition=itemDefinition(item,content),row=equipmentRules(content).tier_upgrade.rows.find(r=>r.from===definition.tier_level&&r.to===target);if(!row)reject('INVALID_TIER_STEP');
 const next=Object.values(content.items).find(d=>d.kind==='equipment'&&d.tier_level===target&&d.slot===definition.slot&&d.weapon_type===definition.weapon_type);if(!next)throw new Error('MISSING_TIER_DEFINITION');
 const owner=assignedOwner(state,id);if(owner&&state.roster.find(a=>a.character_id===owner.character_id)!.level<Number(next.required_level))reject('ITEM_LEVEL_REQUIRED');
 return{item,next_definition_id:String(next.id),cost:{gold:row.gold,refine_ore:row.refine_ore}};
}
export function fusionCandidates(state:AccountState,id:string,content:ValidatedContent):string[]{
 const source=state.inventory.find(i=>i.instance_id===id);if(!source||source.kind!=='equipment'||source.locked||source.training||assignedOwner(state,id))return[];
 const base=itemDefinition(source,content);
 const matches=state.inventory.filter((i):i is Gear=>i.kind==='equipment'&&!i.locked&&!i.training&&!assignedOwner(state,i.instance_id)&&i.rarity_id===source.rarity_id&&itemDefinition(i,content).tier_level===base.tier_level&&itemDefinition(i,content).slot===base.slot&&itemDefinition(i,content).weapon_type===base.weapon_type).map(i=>i.instance_id).filter(other=>other!==id).sort((a,b)=>a<b?-1:a>b?1:0);
 const count=equipmentRules(content).fusion.input_count;return matches.length>=count-1?[id,...matches.slice(0,count-1)]:[];
}
/** `draw` is the server command RNG; previews pass null and see the fused item without its (not yet rolled) option lines. */
export function applyGearUpgrade(state:AccountState,command:GearUpgradeCommand,content:ValidatedContent,draw:(()=>number)|null=null):string{
 if(state.active_battle)reject('BUILD_LOCKED_DURING_BATTLE');
 const pay=(cost:Partial<AccountState['wallet']>)=>{for(const key of Object.keys(cost)as(keyof AccountState['wallet'])[])if(state.wallet[key]<cost[key]!)reject('INSUFFICIENT_RESOURCES');for(const key of Object.keys(cost)as(keyof AccountState['wallet'])[])state.wallet[key]-=cost[key]!;};
 if(command.type==='equipment.fuse'){
  const quote=fusionQuote(state,command.params.instance_ids,content),id=`fusion_${command.request_id}`;if(state.inventory.some(i=>i.instance_id===id))reject('DUPLICATE_ITEM_INSTANCE');
  pay(quote.cost);state.inventory=state.inventory.filter(i=>!command.params.instance_ids.includes(i.instance_id));state.inventory.push({...quote.items[0]!,instance_id:id,rarity_id:quote.next_rarity,locked:false,training:false,options:draw?rollItemOptions(quote.next_rarity,draw,content):[]});return'EQUIPMENT_FUSED'; // D-062: fusion rolls fresh lines
 }
 const quote=tierQuote(state,command.params.item_instance_id,command.params.target_tier,content);pay(quote.cost);quote.item.definition_id=quote.next_definition_id;return'EQUIPMENT_TIER_UPGRADED';
}
