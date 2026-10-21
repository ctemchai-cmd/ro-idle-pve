import type { AccountState, BattleCheckpoint, CombatStats } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
export interface StoryStage {
 id:string;chapter:number;index:number;unlock_after:string|null;time_limit_ms:number;
 encounter:{actor_id:string;definition_id:string;level:number;position:string;element:string;resolved_base:CombatStats;active_slots:BattleCheckpoint['actors'][number]['active_slots'];passives:string[]}[];
 background:{meta:string};music:{meta:string};first_clear_reward:Partial<AccountState['wallet']>;farm_rate_chapter:number;
}
export function storyStages(content:ValidatedContent):readonly StoryStage[]{return content.documents['stages.json']!.stages as unknown as StoryStage[];}
export function storyStage(id:string,content:ValidatedContent):StoryStage|undefined{return storyStages(content).find(stage=>stage.id===id);}
export function canChallenge(stage:StoryStage,state:AccountState){return stage.unlock_after===null||state.story.cleared_stage_ids.includes(stage.unlock_after);}
/** A boss challenge has one enemy, per the user's revised gameplay baseline. */
export function storyBoss(stage:StoryStage){const boss=stage.encounter.find(a=>a.actor_id==='enemy_front');if(!boss)throw new Error('STORY_BOSS_MISSING');return boss;}
export function storyFarmSnapshot(stage:StoryStage,state:AccountState,content:ValidatedContent):NonNullable<AccountState['farm']['rate_snapshot']>{
 const rates=content.documents['economy.json']!.rates as unknown as {chapter:number;per_hour:Partial<AccountState['wallet']>}[];
 const rate=rates.find(r=>r.chapter===stage.farm_rate_chapter);if(!rate)throw new Error('FARM_RATE_MISSING');
 const gear=content.documents['loot.json']!.gear as unknown as {tier_by_chapter:Record<string,1|20|40|60>;rarity_weights:NonNullable<AccountState['farm']['rate_snapshot']>['rarity_weights']};
 const tier=gear.tier_by_chapter[String(stage.farm_rate_chapter)]!;
 const perHour={...Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])),...rate.per_hour}as AccountState['wallet'];
 const restrictions=(content.documents['economy.json']!.farm as unknown as {rate_restrictions:Record<string,string>}).rate_restrictions;
 for(const[resource,rule]of Object.entries(restrictions)){const prerequisite=rule.replace(/^clear /,'');if(!state.story.cleared_stage_ids.includes(prerequisite))perHour[resource as keyof AccountState['wallet']]=0;}
 const pool=Object.values(content.items).filter(i=>i.kind==='equipment'&&i.tier_level===tier).map(i=>String(i.id)).sort();if(pool.length!==36)throw new Error('INVALID_FARM_POOL'); // D-068 tier catalogue
 return{chapter:stage.farm_rate_chapter,stage_id:stage.id,content_version:content.manifest.content_version,rules_version:content.manifest.rules_version,per_hour:perHour,gear_tier:tier,rarity_weights:structuredClone(gear.rarity_weights),definition_pool:pool as NonNullable<AccountState['farm']['rate_snapshot']>['definition_pool']};
}
