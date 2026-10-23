import type { AccountState, ItemDefinition } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
export type InventoryItem = AccountState['inventory'][number];
export type EquipmentSlot = keyof AccountState['roster'][number]['equipment'];
export const equipmentSlots = ['weapon','head','armor','garment','shoes','accessory'] as const;
export interface EquipmentRules {
 inventory_capacity:number; weapon_compatibility:Record<string,string>;
 rarities:{id:string;power_multiplier:number;rank:number}[];
 salvage:{gold_per_tier_unit:number;refine_ore_by_rarity:number[]};
 targeted_weapon_purchase:{cost_rows:{tier_level:number;gold:number}[]};
 fusion:{input_count:number;fee:Partial<AccountState['wallet']>};
 tier_upgrade:{enabled:boolean;rows:{from:number;to:number;gold:number;refine_ore:number}[]};
}
export const equipmentRules=(content:ValidatedContent)=>content.documents['equipment.json'] as unknown as EquipmentRules;
export function boundItemInstances(actor:AccountState['roster'][number],state:AccountState):AccountState['inventory'] {
 const ids=new Set([...Object.values(actor.equipment),...Object.values(actor.slot_progress).flatMap(slot=>slot.cards)].filter((id):id is string=>id!==null));
 return state.inventory.filter(item=>ids.has(item.instance_id));
}
export function itemDefinition(item:InventoryItem,content:ValidatedContent):ItemDefinition {
 const definition=content.items[item.definition_id];
 if(!definition||definition.kind!==item.kind)throw new Error('INVALID_ITEM_DEFINITION');
 return definition as unknown as ItemDefinition;
}
export function equipmentFit(actor:AccountState['roster'][number],slot:EquipmentSlot,item:InventoryItem,content:ValidatedContent):string|null {
 const definition=itemDefinition(item,content);
 if(item.kind!=='equipment'||definition.slot!==slot)return'ITEM_SLOT_MISMATCH';
 if(definition.required_level>actor.level)return'ITEM_LEVEL_REQUIRED';
 if(slot==='weapon'&&definition.weapon_type!==equipmentRules(content).weapon_compatibility[actor.job_id])return'WEAPON_INCOMPATIBLE';
 return null;
}
