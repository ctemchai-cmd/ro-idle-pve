import type {AccountState} from '../../contracts/index.ts';
import type {ValidatedContent} from '../../content/model.ts';
import {storyStage,storyBoss} from './story.ts';
export type EventMetric='farm_seconds'|'battles'|'upgrades'|'daily_chests';
export interface EventMission {id:string;name:string;metric:EventMetric;target:number;tokens:number}
export interface EventOffer {id:string;name:string;price:number;limit:number;kind:'mvp_card'|'weapon'|'artifact'|'rarity_stone'|'option_stone'|'hero_exp'|'gold';quantity:number}
export interface EventTemplate {id:string;name:string;kind:'mission'|'boss';boss:string}
export interface EventRules {anchor_ms:number;period_ms:number;grace_ms:number;unlock_after:string;participation_tokens:number;checkin_tokens:number;rotation:EventTemplate[];missions:EventMission[];boss_anchors:string[];boss_tokens:number[];shop:EventOffer[]}
export interface EventPeriod extends EventTemplate {period_id:string;start_ms:number;end_ms:number}
export const eventRules=(c:ValidatedContent)=>c.documents['economy.json']!.events as unknown as EventRules;
/** Calendar only: all durable operations inject server time. A page opening creates no state. */
export function eventPeriod(ms:number,c:ValidatedContent):EventPeriod{
 const r=eventRules(c),week=Math.max(0,Math.floor((ms-r.anchor_ms)/r.period_ms)),start=r.anchor_ms+week*r.period_ms;
 return{...r.rotation[week%r.rotation.length]!,period_id:`e${week}`,start_ms:start,end_ms:start+r.period_ms};
}
export function eventPeriodById(id:string,now:number,c:ValidatedContent):EventPeriod|null{
 if(!/^e[0-9]{1,8}$/.test(id))return null;const r=eventRules(c),week=Number(id.slice(1)),p=eventPeriod(r.anchor_ms+week*r.period_ms,c);
 return p.period_id===id&&now>=p.start_ms&&now<p.end_ms+r.period_ms?p:null;
}
export const eventUnlocked=(s:AccountState,c:ValidatedContent)=>s.story.cleared_stage_ids.includes(eventRules(c).unlock_after);
export const eventBattleRef=(p:EventPeriod,tier:number)=>`${p.period_id}:${p.id}:${tier}`;
export function parseEventRef(ref:string,c:ValidatedContent){const[id,template,n]=ref.split(':'),tier=Number(n),period=id&&/^e[0-9]{1,8}$/.test(id)?eventPeriod(eventRules(c).anchor_ms+Number(id.slice(1))*eventRules(c).period_ms,c):null;if(!period||period.id!==template||!Number.isInteger(tier)||tier<1||tier>5)throw new Error('INVALID_EVENT_REF');return{period,tier};}
export function eventBoss(p:EventPeriod,tier:number,c:ValidatedContent){
 const r=eventRules(c),anchor=storyStage(r.boss_anchors[tier-1]??'',c);if(!anchor||p.kind!=='boss')throw new Error('EVENT_BOSS_INVALID');
 const template=(c.documents['enemies.json']!.actors as unknown as {id:string;active_slots:string[]}[]).find(a=>a.id===p.boss);
 // Native identity and its authored rotation; no player-stat scaling or speed changes.
 const source=(c.documents['stages.json']!.stages as unknown as {encounter:{definition_id:string;active_slots:(string|null)[];element:string}[]}[]).flatMap(s=>s.encounter).find(a=>a.definition_id===p.boss);
 if(!template||!source)throw new Error('EVENT_BOSS_TEMPLATE_MISSING');
 const actor=structuredClone(storyBoss(anchor));actor.definition_id=p.boss;actor.element=source.element;actor.active_slots=structuredClone(source.active_slots) as typeof actor.active_slots;actor.passives=['enemy_adaptive_cc'];actor.resolved_base.max_hp=Math.round(actor.resolved_base.max_hp*1.15);actor.resolved_base.physical_attack=Math.round(actor.resolved_base.physical_attack*1.05);actor.resolved_base.magical_attack=Math.round(actor.resolved_base.magical_attack*1.05);return actor;
}
