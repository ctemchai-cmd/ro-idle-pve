import type { BattleActor } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { bindStatusParams, resolvedNumber } from './program.ts';
import { statusDefinition } from './status.ts';
import { compareId } from './scheduler.ts';
import { checked, clampProbability } from '../math/index.ts';

export function allowsMagicalCritical(actor:BattleActor,content:ValidatedContent,now:number):boolean{
 return actor.statuses.some(s=>s.expires_at>now&&statusDefinition(content,s.status_id).allows_magical_crit===true);
}
/** Independent applications add extra repeats; one tier wins within each application. */
export function echoMultiplier(actor:BattleActor,skill:string,content:ValidatedContent,now:number,draw:()=>number):number{
 let repeats=1;
 for(const instance of actor.statuses.slice().sort((a,b)=>compareId(a.instance_id,b.instance_id))){
  const raw=statusDefinition(content,instance.status_id).skill_echo;if(!raw||instance.expires_at<=now||!raw.skill_ids.includes(skill))continue;
  const profile=bindStatusParams(raw,instance.params);
  for(const tier of profile.tiers){if(resolvedNumber(tier.chance)>0&&draw()<clampProbability(resolvedNumber(tier.chance))){repeats=checked(repeats+tier.multiplier-1);break;}}
 }
 return repeats;
}
/** Return one consumable application, without changing other independent charges. */
export function nextDamageCharge(actor:BattleActor,content:ValidatedContent,now:number){
 const instance=actor.statuses.filter(s=>s.expires_at>now&&statusDefinition(content,s.status_id).damage_charge).sort((a,b)=>a.applied_at-b.applied_at||compareId(a.instance_id,b.instance_id))[0];
 if(!instance)return null;
 return{instance,profile:bindStatusParams(statusDefinition(content,instance.status_id).damage_charge!,instance.params)};
}
