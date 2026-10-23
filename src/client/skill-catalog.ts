import { loadValidatedContent } from './content.ts';
import { describeResolvedSkill } from './skills.ts';
import { resolveSkill } from '../domain/build/resolve-skill.ts';
import type { BattleActor, SkillDefinition } from '../contracts/index.ts';
import type { TimelineSession } from './story.ts';

const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
const labels=content.documents['strings.th.json']!.strings as unknown as Record<string,string>;
const presentations=content.documents['actor-presentations.json']!.jobs as unknown as {job_id:string;presets:{gender:string}[]}[];
export const skillCatalogJobs=content.jobs.order.map(id=>({id,root:content.jobs.byId[id]!.root,genders:presentations.find(j=>j.job_id===id)!.presets.map(p=>p.gender)}));
export const skillCatalogCount=Object.values(content.skills).filter(s=>s.class_id!=='enemy').length;
export const skillCatalogName=(id:string)=>labels[String(content.skills[id]?.name_key)]??id;
export function skillDefinitionsForJob(job:string):SkillDefinition[]{
 const row=content.jobs.byId[job];
 return row?Object.values(content.skills).filter(s=>row.ancestors.includes(String(s.class_id))) as unknown as SkillDefinition[]:[];
}
export type SkillInformation=ReturnType<typeof describeResolvedSkill>&{name:string;level:number};
export function catalogSkillInformation(id:string,level:number,awakened=false):SkillInformation|null{
 const source=content.skills[id];if(!source||source.class_id==='enemy')return null;
 const rank=Math.min(Number(source.max_level),Math.max(1,Number.isFinite(level)?Math.floor(level):1));
 const definition=resolveSkill(id,rank,content,awakened).definition as SkillDefinition;
 return {...describeResolvedSkill(definition,rank),name:skillCatalogName(id),level:rank};
}
/** Never resolve at a guessed level: the battle snapshot owns rank, copied programs and source bonuses. */
export function timelineSkillInformation(session:Pick<TimelineSession,'initial'|'scene'>,actorId:string,skillId:string):SkillInformation|null{
 const actor=session.initial.actors.find(a=>a.actor_id===actorId),resolved=actor?.resolved_skills[skillId];
 if(!resolved)return null;
 return {...describeResolvedSkill(resolved.definition as unknown as SkillDefinition,resolved.level,actor!.resolved_skills as unknown as BattleActor['resolved_skills']),name:session.scene.skill_labels[skillId]??skillCatalogName(skillId),level:resolved.level};
}
