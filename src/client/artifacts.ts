import{definitionSize}from'./monster-size.ts';
import {loadValidatedContent} from './content.ts';
import type {AccountState} from '../contracts/index.ts';
import {artifactRules,artifactDefinition,artifactBonus,artifactFits,enhanceArtifactSkill,type ArtifactItem} from '../domain/build/artifacts.ts';
import {artifactOwner,artifactUpgradeQuote} from '../domain/progression/artifacts.ts';
import {mvpRules,mvpBosses,mvpBoss,mvpWeek,mvpReward,mvpUnlocked,parseMvpRef} from '../domain/modes/mvp.ts';
import {compileCharacterSkills} from '../domain/progression/skills.ts';
import {resolveSkill} from '../domain/build/resolve-skill.ts';
import {describeResolvedSkill} from './skills.ts';
import {jobAllowsSkill} from '../content/jobs.ts';
export type {ArtifactItem};
export {parseMvpRef};
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
export function artifactView(item:ArtifactItem,state:AccountState){const d=artifactDefinition(item.definition_id,content),bonus=artifactBonus(item,content),owner=artifactOwner(state,item.instance_id);return{item,definition:d,name:String((content.documents['strings.th.json']!.strings as Record<string,string>)[d.skill_id]??d.skill_id),bonus,owner,fits:(id:string)=>{const a=state.roster.find(a=>a.character_id===id);return!!a&&artifactFits(a,d,content);},next:item.level<10?artifactUpgradeQuote(item,item.level+1,content):null,copies:artifactRules(content).star_copies[item.stars]??0};}
export const artifactCatalog=()=>artifactRules(content);
/** Read the same class membership, stock and costs as the shared draw reducer. */
export function artifactDrawOptions(state:AccountState,selectedJob:string){
 const rules=artifactRules(content),jobs=[...new Set(state.roster.filter(a=>(content.jobs.byId[a.job_id]?.stage??0)>=3).map(a=>a.job_id))];
 const job=jobs.find(id=>id===selectedJob)??jobs[0]??'',actor=state.roster.find(a=>a.job_id===job);
 const pool=actor?rules.definitions.filter(d=>jobAllowsSkill(content.jobs,actor,d.class_id)):[];
 const weight=Object.values(rules.rarities).reduce((n,r)=>n+r.weight,0);
 return{job,jobs,pool:pool.map(d=>({...d,name:String((content.documents['strings.th.json']!.strings as Record<string,string>)[d.skill_id]??d.skill_id)})),odds:Object.entries(rules.rarities).map(([id,r])=>({id,percent:Math.round(r.weight/weight*1000)/10})),pity:Math.max(1,rules.legendary_pity-(state.artifacts?.legendary_misses??0)),quote:(n:1|10)=>{const tickets=Math.min(n,state.artifacts?.tickets??0),crystal=(n-tickets)*rules.draw_crystal;return{tickets,crystal,allowed:!!job&&(state.artifacts?.items.length??0)+n<=rules.capacity&&state.wallet.crystal>=crystal};}};
}
export function artifactDetails(item:ArtifactItem,state:AccountState){const d=artifactDefinition(item.definition_id,content),actor=state.roster.find(a=>artifactFits(a,d,content)),level=actor?.skill_levels[d.skill_id]??1,awakened=actor?.awakened_skills.includes(d.skill_id)??false,base=resolveSkill(d.skill_id,level,content,awakened);return describeResolvedSkill(enhanceArtifactSkill(base.definition,artifactBonus(item,content)),level,actor?{...compileCharacterSkills(actor,content).resolved_skills,[d.skill_id]:{level,definition:enhanceArtifactSkill(base.definition,artifactBonus(item,content))}}:undefined);}
export function mvpView(state:AccountState,now:number){const week=mvpWeek(now);return{week,unlocked:mvpUnlocked(state,content),unlock_after:mvpRules(content).unlock_after,bosses:mvpBosses(now,content).map(b=>{const best=state.mvp_hunt?.week===week?(state.mvp_hunt.best[b.id]??0):0,tier=Math.min(10,best+1);return{...b,size:definitionSize(b.id),best,tier,stats:mvpBoss(b.id,tier,content).resolved_base,reward:mvpReward(tier),previous:mvpReward(best)};})};}
