import {loadValidatedContent} from './content.ts';
import type {AccountState} from '../contracts/index.ts';
import {eventRules,eventPeriod,eventPeriodById,eventBoss,eventUnlocked,parseEventRef} from '../domain/modes/events.ts';
import {eventRecord,eventTokens} from '../domain/progression/events.ts';
import {bangkokDay} from '../domain/modes/daily.ts';
import {gachaGearTier} from '../domain/rewards/gacha.ts';
import {definitionSize} from './monster-size.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
export {parseEventRef};
export function eventPlace(ref:string){const{period,tier}=parseEventRef(ref,content);return{period,tier,boss:eventBoss(period,tier,content)};}
export function eventsView(s:AccountState,now:number){const rules=eventRules(content),period=eventPeriod(now,content),record=eventRecord(s,period.period_id),previous=s.events?.periods.map(p=>eventPeriodById(p.id,now,content)).find((p)=>p!==null&&p.period_id!==period.period_id)??null;
 return{period,record,unlocked:eventUnlocked(s,content),unlock_after:rules.unlock_after,tokens:eventTokens(record,rules),day:bangkokDay(now),tier:gachaGearTier(s,content),checkin_tokens:rules.checkin_tokens,previous:previous?{period:previous,tokens:eventTokens(eventRecord(s,previous.period_id),rules)}:null,
 missions:rules.missions.map(m=>({...m,current:record.counters[m.metric],claimed:record.claimed.includes(m.id)})),
 offers:(id=period.period_id)=>{const p=eventRecord(s,id);return rules.shop.map(o=>({...o,left:o.limit-(p.purchases[o.id]??0),affordable:eventTokens(p,rules)>=o.price}));},
 bosses:period.kind==='boss'?rules.boss_anchors.map((anchor,n)=>{const tier=n+1,boss=eventBoss(period,tier,content);return{tier,anchor,boss,size:definitionSize(boss.definition_id),unlocked:s.story.cleared_stage_ids.includes(anchor)&&tier<=record.boss_best+1,reward:rules.boss_tokens[n]!-(record.boss_best?rules.boss_tokens[record.boss_best-1]!:0),cleared:tier<=record.boss_best};}):[]};}

export function eventChallengePlace(id:string,tier:number){const p=eventPeriodById(id,eventRules(content).anchor_ms+Number(id.slice(1))*eventRules(content).period_ms,content);if(!p)throw new Error('EVENT_UNKNOWN');return{period:p,tier,boss:eventBoss(p,tier,content)};}
