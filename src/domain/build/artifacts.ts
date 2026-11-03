import type { AccountState, BattleActor, SkillDefinition, Modifier, StatBlueprint } from '../../contracts/index.ts';
import type {DeepReadonly} from '../../content/value.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { jobAllowsSkill } from '../../content/jobs.ts';
export type ArtifactState=NonNullable<AccountState['artifacts']>;
export type ArtifactItem=ArtifactState['items'][number];
export interface ArtifactDefinition {id:string;skill_id:string;class_id:string;rarity_id:string}
export interface ArtifactProfile {name:string;modifiers:{stat:Modifier['stat'];op:Modifier['op'];bucket:Modifier['bucket'];weight:number}[]}
export interface ArtifactRules {version?:number;capacity:number;draw_crystal:number;legendary_pity:number;star_copies:number[];level_costs:{to:number;gold:number;essence:number}[];rarities:Record<string,{weight:number;start:number;max:number;salvage:number;stat_start?:number;stat_max?:number}>;definitions:ArtifactDefinition[];profiles?:Record<string,ArtifactProfile>;reroll?:{cost:number;salvage:Record<string,number>;story_min_chapter:number;story_every:number;story_counts:{from_chapter:number;count:number}[]}}
export const artifactRules=(content:ValidatedContent)=>content.documents['equipment.json']!.artifacts as unknown as ArtifactRules;
export const emptyArtifacts=():ArtifactState=>({items:[],slots:{},essence:0,tickets:0,pulls:0,legendary_misses:0});
const definitionCache=new WeakMap<ValidatedContent,Map<string,ArtifactDefinition>>();
export const artifactDefinition=(id:string,content:ValidatedContent)=>{let index=definitionCache.get(content);if(!index){index=new Map(artifactRules(content).definitions.map(d=>[d.id,d]));definitionCache.set(content,index);}const d=index.get(id);if(!d)throw new Error('ARTIFACT_DEFINITION_MISSING');return d;};
export function artifactFits(actor:AccountState['roster'][number],definition:ArtifactDefinition,content:ValidatedContent){return(content.jobs.byId[actor.job_id]?.stage??0)>=3&&jobAllowsSkill(content.jobs,actor,definition.class_id);}
/** Old instances keep their original skill/quality; new rolls store those values independently. */
export function artifactItemDefinition(item:ArtifactItem,content:ValidatedContent):ArtifactDefinition{const d=artifactDefinition(item.definition_id,content);return{...d,skill_id:item.skill_id??d.skill_id,class_id:item.class_id??d.class_id,rarity_id:item.rarity_id??d.rarity_id};}
export function artifactBonus(item:ArtifactItem,content:ValidatedContent){const d=artifactItemDefinition(item,content),r=artifactRules(content).rarities[d.rarity_id]!;return(r.start+(r.max-r.start)*(item.level-1)/9)*(1+item.stars*.1);}
export function artifactPool(classId:string,content:ValidatedContent){const job=content.jobs.byId[classId];return job?artifactRules(content).definitions.filter(d=>job.ancestors.includes(d.class_id)):[];}
export function artifactProfile(classId:string,content:ValidatedContent){const profiles=artifactRules(content).profiles??{};const id=profiles[classId]?classId:Object.keys(profiles).find(id=>content.jobs.byId[id]?.ancestors.includes(classId));return id?{id,...profiles[id]!}:null;}
export function artifactStatModifiers(item:ArtifactItem,jobId:string,content:ValidatedContent):Modifier[]{
 const profile=artifactProfile(jobId,content),r=artifactRules(content).rarities[artifactItemDefinition(item,content).rarity_id]!;
 const strength=((r.stat_start??0)+((r.stat_max??0)-(r.stat_start??0))*(item.level-1)/9)*(1+item.stars*.1);
 return profile?.modifiers.map(m=>({id:`artifact_${m.stat}`,stat:m.stat,op:m.op,bucket:m.bucket,value:strength*m.weight}))??[];
}
export function artifactSources(actor:AccountState['roster'][number],state:AccountState,content:ValidatedContent):StatBlueprint['permanent_sources']{return boundArtifacts(actor.character_id,state).map(item=>({source:{instance_id:item.instance_id,definition_id:item.definition_id,owner_actor_id:actor.character_id,origin_actor_id:actor.character_id,origin_life_epoch:0},modifiers:artifactStatModifiers(item,actor.job_id,content),triggers:[]}));}
export function artifactDonorMatches(target:ArtifactItem,donor:ArtifactItem,content:ValidatedContent){const a=artifactItemDefinition(target,content),b=artifactItemDefinition(donor,content);return a.rarity_id===b.rarity_id&&(a.class_id===b.class_id||!!content.jobs.byId[a.class_id]?.ancestors.includes(b.class_id)||!!content.jobs.byId[b.class_id]?.ancestors.includes(a.class_id));}
export function boundArtifacts(actorId:string,state:AccountState){return(state.artifacts?.slots[actorId]??[]).flatMap(id=>state.artifacts?.items.find(i=>i.instance_id===id)??[]);}
export const ARTIFACT_UTILITY_DURATION_SCALE=.25;
/** Patch only the selected, already-resolved program. Checkpoints carry the exact same result into replay. */
export function enhanceArtifactSkill(definition:DeepReadonly<SkillDefinition>,bonus:number):SkillDefinition{
 const result=structuredClone(definition) as SkillDefinition,factor=1+bonus;
 if(result.kind==='passive'){
  for(const modifier of result.modifiers)if(typeof modifier.value==='number')modifier.value*=factor;
  for(const trigger of result.triggers){let power=false;for(const effect of trigger.effects)if('formula'in effect){for(const key of ['attack_ratio','flat_power','sp_ratio','amount','ratio']){const p=effect.formula.params as Record<string,unknown>;if(typeof p[key]==='number'){p[key]=(p[key]as number)*factor;power=true;}}}if(!power&&typeof trigger.chance==='number')trigger.chance=Math.min(1,trigger.chance*factor);}
  return result;
 }
 if(result.id==='monk_call_spirits'){
  result.level_parameters.attack_per_sphere=result.level_parameters.attack_per_sphere!.map(x=>x*factor) as [number,...number[]];
  return result;
 }
 let changed=false;
 for(const effect of result.effects){
  if(['damage','heal','shield','sacrifice_damage'].includes(effect.type)&&'formula'in effect){
   for(const key of ['attack_ratio','flat_power','sp_ratio','amount','ratio']){const p=effect.formula.params as Record<string,unknown>;if(typeof p[key]==='number'){p[key]=(p[key] as number)*factor;changed=true;}}
  }else if(effect.type==='summon'){if(typeof effect.power_scale==='number'){effect.power_scale*=factor;changed=true;}}
  else if(effect.type==='apply_status'){
   const p=effect.params as Record<string,unknown>;
   if(typeof p.power_ratio==='number'){p.power_ratio*=factor;changed=true;}
   else if(effect.parameter_formulas?.power_ratio){for(const key of ['attack_ratio','flat_power','ratio']){const f=effect.parameter_formulas.power_ratio.params as Record<string,unknown>;if(typeof f[key]==='number'){f[key]=(f[key]as number)*factor;changed=true;}}}
   else if(typeof effect.duration_ms==='number'&&effect.duration_ms>0){effect.duration_ms=Math.round(effect.duration_ms*(1+bonus*ARTIFACT_UTILITY_DURATION_SCALE));changed=true;}
  }else if(effect.type==='remove_status'&&typeof effect.max_instances==='number'){effect.max_instances=Math.ceil(effect.max_instances*factor);changed=true;}
 }
 if(!changed)throw new Error(`ARTIFACT_PROGRAM_UNSUPPORTED:${result.id}`);
 return result;
}
export function artifactSkills(actorId:string,state:AccountState,skills:BattleActor['resolved_skills'],content:ValidatedContent):BattleActor['resolved_skills']{
 const result={...skills};for(const item of boundArtifacts(actorId,state)){const d=artifactItemDefinition(item,content),skill=result[d.skill_id];if(skill)result[d.skill_id]={...skill,definition:enhanceArtifactSkill(skill.definition,artifactBonus(item,content))};}return result;
}
export function reconcileArtifactSlots(state:AccountState,content:ValidatedContent){if(!state.artifacts)return;for(const[id,slots]of Object.entries(state.artifacts.slots)){const actor=state.roster.find(a=>a.character_id===id);state.artifacts.slots[id]=slots.map(instance=>{const item=state.artifacts!.items.find(i=>i.instance_id===instance);return actor&&item&&artifactFits(actor,artifactItemDefinition(item,content),content)?instance:null;})as[string|null,string|null];}}
