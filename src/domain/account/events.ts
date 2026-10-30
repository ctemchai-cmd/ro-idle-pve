import type {AccountState,Command} from '../../contracts/index.ts';
import type {ValidatedContent} from '../../content/model.ts';
import {eventRules,eventPeriod,eventPeriodById,eventUnlocked,parseEventRef} from '../modes/events.ts';
import {eventRecord,writableEvent,checkinEvent,claimEventMission,eventPurchaseQuote,markEventPurchase} from '../progression/events.ts';
import {bangkokDay} from '../modes/daily.ts';
import {ProgressionRejection} from '../progression/rejection.ts';
import {grantCraftingMaterials} from '../progression/equipment-crafting.ts';
import {grantArtifactRewards} from '../progression/artifacts.ts';
import {equipmentRules} from '../build/equipment-definition.ts';
import {shopChapter} from '../build/shop-progression.ts';
import {rollItemOptions} from '../build/item-options.ts';
import {cardOrigins} from '../../content/card-catalog.ts';
import {gachaGearTier} from '../rewards/gacha.ts';
const reject=(s:string):never=>{throw new ProgressionRejection(s);};
export type EventCommand=Extract<Command,{type:'event.checkin'|'event.claim'|'event.redeem'}>;
export function applyEventCommand(s:AccountState,cmd:EventCommand,now:number,c:ValidatedContent,draw:()=>number){
 const r=eventRules(c),p=eventPeriodById(cmd.params.period_id,now,c);if(!p)reject('EVENT_EXPIRED');if(!eventUnlocked(s,c))reject('EVENT_LOCKED');
 if(cmd.type!=='event.redeem'&&now>=p!.end_ms)reject('EVENT_ENDED');
 if(cmd.type==='event.checkin'){checkinEvent(s,p!.period_id,bangkokDay(now));return'EVENT_CHECKED_IN';}
 if(cmd.type==='event.claim'){claimEventMission(s,p!.period_id,cmd.params.mission_id,r);return'EVENT_MISSION_CLAIMED';}
 eventPurchaseQuote(s,p!.period_id,cmd.params.offer_id,r);const offer=r.shop.find(o=>o.id===cmd.params.offer_id)!;
 const staged=structuredClone(s),id=`event_${cmd.request_id}`;
 if(offer.kind==='weapon'||offer.kind==='mvp_card'){
  if(s.inventory.length>=equipmentRules(c).inventory_capacity)reject('INVENTORY_FULL');
  if(offer.kind==='mvp_card'){
   const pool=Object.entries(cardOrigins(c)).filter(([,o])=>o.grade==='mvp'&&o.variant!=='puppet'&&o.rarity_id==='legendary').map(([id])=>id).sort();if(!pool.length)throw new Error('EVENT_CARD_POOL_EMPTY');
   staged.inventory.push({instance_id:id,definition_id:pool[Math.min(pool.length-1,Math.floor(draw()*pool.length))]!,kind:'card',rarity_id:'legendary',locked:false,level:1});
  }else{
   const actor=s.roster.find(a=>a.character_id===cmd.params.character_id);if(!actor)reject('CHARACTER_NOT_FOUND');
   const type=equipmentRules(c).weapon_compatibility[actor!.job_id],tier=gachaGearTier(s,c),pool=Object.values(c.items).filter(i=>i.kind==='equipment'&&i.slot==='weapon'&&i.weapon_type===type&&i.tier_level===tier).map(i=>String(i.id)).sort();if(!pool.length)throw new Error('EVENT_WEAPON_POOL_EMPTY');
   staged.inventory.push({instance_id:id,definition_id:pool[Math.min(pool.length-1,Math.floor(draw()*pool.length))]!,kind:'equipment',rarity_id:'legendary',locked:false,training:false,options:rollItemOptions('legendary',draw,c)});
  }
 }else if(offer.kind==='artifact')grantArtifactRewards(staged,{essence:0,tickets:offer.quantity});
 else if(offer.kind==='option_stone'||offer.kind==='rarity_stone')grantCraftingMaterials(staged,{[offer.kind]:offer.quantity},1);
 else{
  const chapter=shopChapter(s,c),rate=(c.documents['economy.json']!.rates as unknown as {chapter:number;per_hour:Partial<AccountState['wallet']>}[]).find(row=>row.chapter===chapter)!;
  const n=staged.wallet[offer.kind]+Math.floor((rate.per_hour[offer.kind]??0)*offer.quantity);if(!Number.isSafeInteger(n))reject('RESOURCE_OVERFLOW');staged.wallet[offer.kind]=n;
 }
 markEventPurchase(staged,p!.period_id,offer.id,r);Object.assign(s,staged);return'EVENT_REDEEMED';
}
export function settleEventBoss(s:AccountState,ref:string,started:number,now:number,c:ValidatedContent){
 const{period:p,tier}=parseEventRef(ref,c);if(p.kind!=='boss'||started<p.start_ms||started>=p.end_ms||now>=p.end_ms+eventRules(c).grace_ms)return;
 const row=writableEvent(s,p.period_id);row.joined=true;row.boss_best=Math.max(row.boss_best,tier);
}
/** Only committed/collected work, never entry, preview, retreat or receipt replay. */
export function trackEventProgress(before:AccountState,after:AccountState,cmd:Command,code:string,now:number,c:ValidatedContent,collected:AccountState['pending_rewards']=[]){
 if(!c.documents['economy.json']!.events||!eventUnlocked(after,c))return;
 const p=eventPeriod(now,c),delta={farm_seconds:0,battles:0,upgrades:0,daily_chests:0};
 if((cmd.type==='battle.finish'||cmd.type==='battle.advance')&&before.active_battle&&!after.active_battle&&!code.endsWith('RETREATED'))delta.battles=1;
 if(['CHARACTER_LEVELLED','BREAKTHROUGH_COMPLETED','SKILL_LEARNED','SKILL_UPGRADED','SKILL_AWAKENED','SLOT_REFINED','SLOT_ENCHANTED','CARD_UPGRADED','ARTIFACT_UPGRADED','ARTIFACT_STARRED','EQUIPMENT_RARITY_UPGRADED'].includes(code))delta.upgrades=1;
 const removed=before.pending_rewards.filter(q=>!after.pending_rewards.some(n=>n.claim_id===q.claim_id)),keys=new Set<string>();
 for(const claim of [...removed,...collected])for(const key of claim.source_keys){if(keys.has(key))continue;keys.add(key);if(claim.kind==='farm'&&key.startsWith('farm:')){const[,a,b]=key.split(':'),start=Number(a),end=Number(b);if(Number.isSafeInteger(start)&&Number.isSafeInteger(end))delta.farm_seconds+=Math.max(0,Math.floor((Math.min(now,end,p.end_ms)-p.start_ms)/1000)-Math.floor((Math.max(start,p.start_ms)-p.start_ms)/1000));}if(claim.kind==='daily'&&key.startsWith('daily:')&&(key.split(':')[2]??'')>=bangkokDay(p.start_ms))delta.daily_chests++;}
 if(!Object.values(delta).some(n=>n>0))return;
 const row=writableEvent(after,p.period_id);row.joined=true;for(const key of Object.keys(delta)as(keyof typeof delta)[]){const max=key==='farm_seconds'?604800:key==='daily_chests'?10000:1000;row.counters[key]=Math.min(max,eventRecord(after,p.period_id).counters[key]+delta[key]);}
}
