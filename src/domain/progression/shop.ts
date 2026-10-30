import {grantArtifactRewards} from './artifacts.ts';
import {shopChapter} from '../build/shop-progression.ts';
import {grantCraftingMaterials,craftingStock,type CraftingMaterial} from './equipment-crafting.ts';
import type { AccountState } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { scrollDefinition, supplyStock } from '../build/consumables.ts';
import { grantConsumables } from './consumables.ts';
import { ProgressionRejection } from './rejection.ts';
type Wallet=AccountState['wallet'];
export interface ShopOffer {id:string;price:Partial<Wallet>;grant:Partial<Wallet>;consumable_grant?:Readonly<Record<string,number>>;crafting_grant?:Partial<Record<CraftingMaterial,number>>;daily_limit:number;farm_hours?:number;minimum_job_stage?:number;artifact_grant?:{essence:number;tickets:number}}
export interface ShopCatalog {max_quantity_per_command:number;offers:readonly ShopOffer[]}
export const shopCatalog=(content:ValidatedContent)=>content.documents['economy.json']!.shop as unknown as ShopCatalog;
const reject=(code:string):never=>{throw new ProgressionRejection(code);};
export function shopOffer(id:string,content:ValidatedContent):ShopOffer {return shopCatalog(content).offers.find(row=>row.id===id)??reject('SHOP_OFFER_UNKNOWN');}
export function shopRemaining(state:AccountState,offer:ShopOffer,day:string):number{return Math.max(0,offer.daily_limit-(state.shop.day===day?state.shop.purchases[offer.id]??0:0));}
export function resolvedShopOffer(state:AccountState,id:string,content:ValidatedContent):ShopOffer{
 const offer=shopOffer(id,content);if(!offer.farm_hours)return offer;
 const chapter=shopChapter(state,content),rates=content.documents['economy.json']!.rates as unknown as {chapter:number;per_hour:Partial<Wallet>}[],rate=rates.find(r=>r.chapter===chapter);if(!rate)throw new Error('SHOP_FARM_RATE_MISSING');
 return{...offer,grant:Object.fromEntries(Object.entries(offer.grant).map(([key,n])=>[key,Math.max(n!,Math.floor((rate.per_hour[key as keyof Wallet]??0)*offer.farm_hours!))]))};
}
export function shopOfferUnlocked(state:AccountState,offer:ShopOffer,content:ValidatedContent){return!offer.minimum_job_stage||state.roster.some(a=>(content.jobs.byId[a.job_id]?.stage??0)>=offer.minimum_job_stage!);}
/** One pure quote for UI, reducer and tests. Validate the entire purchase before spending. */
export function shopQuote(state:AccountState,id:string,quantity:number,day:string,content:ValidatedContent){
 const offer=resolvedShopOffer(state,id,content),limit=shopCatalog(content).max_quantity_per_command;
 if(!shopOfferUnlocked(state,offer,content))reject('SHOP_FEATURE_LOCKED');
 if(!Number.isSafeInteger(quantity)||quantity<1||quantity>limit)reject('INVALID_SHOP_QUANTITY');
 if(quantity>shopRemaining(state,offer,day))reject('SHOP_LIMIT_REACHED');
 const cost:Partial<Wallet>={},gain:Partial<Wallet>={};
 for(const[key,amount]of Object.entries(offer.price)as[keyof Wallet,number][]){const total=amount*quantity;if(!Number.isSafeInteger(total))reject('RESOURCE_OVERFLOW');cost[key]=total;if(state.wallet[key]<total)reject('INSUFFICIENT_RESOURCES');}
 for(const[key,amount]of Object.entries(offer.grant)as[keyof Wallet,number][]){const total=amount*quantity;if(!Number.isSafeInteger(total)||!Number.isSafeInteger(state.wallet[key]-(cost[key]??0)+total))reject('RESOURCE_OVERFLOW');gain[key]=total;}
 for(const[id,amount]of Object.entries(offer.consumable_grant??{}))if(!scrollDefinition(id,content)||!Number.isSafeInteger(amount)||amount<1||!Number.isSafeInteger(supplyStock(state,id)+amount*quantity))reject('RESOURCE_OVERFLOW');
 for(const[key,n]of Object.entries(offer.crafting_grant??{}))if(!Number.isSafeInteger(n)||n!<1||!Number.isSafeInteger(craftingStock(state,key as CraftingMaterial)+n!*quantity))reject('RESOURCE_OVERFLOW');
 if(offer.artifact_grant){const a=offer.artifact_grant;for(const key of ['essence','tickets']as const)if(!Number.isSafeInteger(a[key])||a[key]<0||!Number.isSafeInteger((state.artifacts?.[key]??0)+a[key]*quantity))reject('RESOURCE_OVERFLOW');}
 return{offer,quantity,cost,gain};
}
/** Maximum of this offer that fits funds, today's rights, stock capacity and one command. */
export function shopMaxQuantity(state:AccountState,id:string,day:string,content:ValidatedContent):number{
 const offer=resolvedShopOffer(state,id,content);if(!shopOfferUnlocked(state,offer,content))return 0;let max=Math.min(shopRemaining(state,offer,day),shopCatalog(content).max_quantity_per_command);
 for(const[key,price]of Object.entries(offer.price)as[keyof Wallet,number][])if(price>0)max=Math.min(max,Math.floor(state.wallet[key]/price));
 for(const key of Object.keys(state.wallet)as(keyof Wallet)[]){const net=(offer.grant[key]??0)-(offer.price[key]??0);if(net>0)max=Math.min(max,Math.floor((Number.MAX_SAFE_INTEGER-state.wallet[key])/net));}
 for(const[id,amount]of Object.entries(offer.consumable_grant??{}))max=Math.min(max,Math.floor((Number.MAX_SAFE_INTEGER-supplyStock(state,id))/amount));
 for(const[key,n]of Object.entries(offer.crafting_grant??{}))max=Math.min(max,Math.floor((Number.MAX_SAFE_INTEGER-craftingStock(state,key as CraftingMaterial))/n!));
 if(offer.artifact_grant)for(const key of ['essence','tickets']as const){const amount=offer.artifact_grant[key];if(amount>0)max=Math.min(max,Math.floor((Number.MAX_SAFE_INTEGER-(state.artifacts?.[key]??0))/amount));}
 return Math.max(0,max);
}
export function applyShopPurchase(state:AccountState,id:string,quantity:number,day:string,content:ValidatedContent):void{
 const{offer,cost,gain}=shopQuote(state,id,quantity,day,content);
 const staged={...state,battle_supplies:structuredClone(state.battle_supplies),...(state.equipment_crafting?{equipment_crafting:structuredClone(state.equipment_crafting)}:{}),...(state.artifacts?{artifacts:{...state.artifacts}}:{})};
 grantConsumables(staged,offer.consumable_grant??{},quantity,content);
 if(offer.crafting_grant)grantCraftingMaterials(staged,offer.crafting_grant,quantity);
 if(offer.artifact_grant)grantArtifactRewards(staged,{essence:offer.artifact_grant.essence*quantity,tickets:offer.artifact_grant.tickets*quantity});
 for(const[key,amount]of Object.entries(cost)as[keyof Wallet,number][])state.wallet[key]-=amount;
 for(const[key,amount]of Object.entries(gain)as[keyof Wallet,number][])state.wallet[key]+=amount;
 state.battle_supplies=staged.battle_supplies;if(offer.crafting_grant)state.equipment_crafting=staged.equipment_crafting;if(offer.artifact_grant)state.artifacts=staged.artifacts;
 const bought=state.shop.day===day?state.shop.purchases[id]??0:0;
 if(state.shop.day!==day)state.shop={day,purchases:{}};
 state.shop.purchases[id]=bought+quantity;
}
