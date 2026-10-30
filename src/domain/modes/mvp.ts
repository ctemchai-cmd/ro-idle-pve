import type {AccountState} from '../../contracts/index.ts';
import type {ValidatedContent} from '../../content/model.ts';
import {storyStages,type StoryStage} from './story.ts';
import {bangkokDay} from './daily.ts';
export interface MvpBoss {id:string;element:string;skills:string[]}
export interface MvpRules {unlock_after:string;time_limit_ms:number;tiers:number;hp_base:number;attack_base:number;defense_base:number;hp_growth:number;attack_growth:number;bosses:MvpBoss[]}
export const mvpRules=(c:ValidatedContent)=>c.documents['tower.json']!.mvp_hunt as unknown as MvpRules;
/** Monday 00:00 Bangkok, injected server time. */
export function mvpWeek(ms:number){const day=Math.floor((ms+7*3600000)/86400000),monday=day-((day+3)%7+7)%7;return bangkokDay(monday*86400000-7*3600000);}
export function mvpBosses(ms:number,c:ValidatedContent){const r=mvpRules(c),day=Math.floor((ms+7*3600000)/86400000),rotation=((Math.floor((day+3)/7)%r.bosses.length)+r.bosses.length)%r.bosses.length;return[0,1,2].map(n=>r.bosses[(rotation+n)%r.bosses.length]!);}
export const mvpUnlocked=(s:AccountState,c:ValidatedContent)=>s.story.cleared_stage_ids.includes(mvpRules(c).unlock_after)&&s.roster.some(a=>(c.jobs.byId[a.job_id]?.stage??0)>=3);
export const mvpRef=(week:string,id:string,tier:number)=>`${week}:${id}:${tier}`;
export function parseMvpRef(ref:string){const[week,id,tierText]=ref.split(':'),tier=Number(tierText);if(!week||!id||!Number.isInteger(tier)||tier<1||tier>10)throw new Error('INVALID_MVP_REF');return{week,id,tier};}
export function mvpBoss(id:string,tier:number,c:ValidatedContent):StoryStage['encounter'][number]{
 const r=mvpRules(c),b=r.bosses.find(b=>b.id===id);if(!b||!Number.isInteger(tier)||tier<1||tier>r.tiers)throw new Error('INVALID_MVP_BOSS');
 const template=storyStages(c).flatMap(s=>s.encounter).find(a=>a.definition_id===id);if(!template)throw new Error('MVP_TEMPLATE_MISSING');
 const result=structuredClone(template),scale=tier-1;result.actor_id='enemy_front';result.level=100;result.element=b.element;result.resolved_base={...result.resolved_base,max_hp:Math.round(r.hp_base*r.hp_growth**scale),physical_attack:Math.round(r.attack_base*r.attack_growth**scale),magical_attack:Math.round(r.attack_base*r.attack_growth**scale),physical_defense:r.defense_base+tier*20,magical_defense:r.defense_base+tier*20};result.active_slots=[b.skills[0]!,b.skills[1]!,b.skills[2]!,b.skills[3]!];result.passives=['enemy_adaptive_cc'];return result;
}
export function mvpReward(tier:number){return{crystal:tier*100,essence:tier*20,tickets:(tier>=3?1:0)+(tier>=6?2:0)+(tier>=10?3:0)};}
