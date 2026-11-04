import {summonPresentation} from './summons.ts';
import type {DeepReadonly} from '../content/value.ts';
import{definitionSize}from'./monster-size.ts';
import {loadValidatedContent} from './content.ts';
import type {AccountState,SkillDefinition,StatusDefinition} from '../contracts/index.ts';
import {ARTIFACT_UTILITY_DURATION_SCALE,artifactRules,artifactItemDefinition,artifactProfile,artifactStatModifiers,artifactDonorMatches,artifactBonus,artifactFits,enhanceArtifactSkill,type ArtifactItem} from '../domain/build/artifacts.ts';
import {artifactOwner,artifactUpgradeQuote,artifactSalvageQuote} from '../domain/progression/artifacts.ts';
import {mvpRules,mvpBosses,mvpBoss,mvpWeek,mvpReward,mvpUnlocked,parseMvpRef} from '../domain/modes/mvp.ts';
import {compileCharacterSkills} from '../domain/progression/skills.ts';
import {resolveSkill} from '../domain/build/resolve-skill.ts';
import {describeResolvedSkill} from './skills.ts';
import {jobAllowsSkill} from '../content/jobs.ts';
export type {ArtifactItem};
export {parseMvpRef};
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
export function artifactView(item:ArtifactItem,state:AccountState){
 const d=artifactItemDefinition(item,content),bonus=artifactBonus(item,content),owner=artifactOwner(state,item.instance_id),profile=artifactProfile(d.class_id,content),actor=owner?state.roster.find(a=>a.character_id===owner):state.roster.find(a=>artifactFits(a,d,content));
 const statJob=actor?.job_id??profile?.id??d.class_id;
 return{item,definition:d,name:profile?.name??'Artifact',skillName:artifactSkillName(d.skill_id),kind:String(content.skills[d.skill_id]?.kind),profile:artifactProfile(statJob,content),stats:artifactStatModifiers(item,statJob,content),bonus,enhancementLabel:artifactEnhancementLabel(resolveSkill(d.skill_id,actor?.skill_levels[d.skill_id]??1,content,actor?.awakened_skills.includes(d.skill_id)??false).definition,bonus),owner,skillLevel:actor?.skill_levels[d.skill_id]??0,pending:state.artifacts?.pending_skill_roll?.instance_id===item.instance_id,salvage:artifactSalvageQuote([item],content),donor:(other:ArtifactItem)=>artifactDonorMatches(item,other,content),fits:(id:string)=>{const a=state.roster.find(a=>a.character_id===id);return!!a&&artifactFits(a,d,content);},next:item.level<10?artifactUpgradeQuote(item,item.level+1,content):null,copies:artifactRules(content).star_copies[item.stars]??0};
}
export const artifactSkillName=(id:string)=>String((content.documents['strings.th.json']!.strings as Record<string,string>)[id]??id);
export const artifactJobProfile=(job:string)=>artifactProfile(job,content);
export const artifactSalvage=(items:readonly ArtifactItem[])=>artifactSalvageQuote(items,content);
export const artifactCatalog=()=>artifactRules(content);
/** Read the same class membership, stock and costs as the shared draw reducer. */
export function artifactDrawOptions(state:AccountState,selectedJob:string){
 const rules=artifactRules(content),jobs=[...new Set(state.roster.filter(a=>(content.jobs.byId[a.job_id]?.stage??0)>=3).map(a=>a.job_id))];
 const job=jobs.find(id=>id===selectedJob)??jobs[0]??'',actor=state.roster.find(a=>a.job_id===job);
 const pool=actor?rules.definitions.filter(d=>jobAllowsSkill(content.jobs,actor,d.class_id)):[];
 const weight=Object.values(rules.rarities).reduce((n,r)=>n+r.weight,0);
 return{job,jobs,pool:pool.map(d=>({...d,name:artifactSkillName(d.skill_id),kind:String(content.skills[d.skill_id]?.kind)})),odds:Object.entries(rules.rarities).map(([id,r])=>({id,percent:Math.round(r.weight/weight*1000)/10})),pity:Math.max(1,rules.legendary_pity-(state.artifacts?.legendary_misses??0)),quote:(n:1|10)=>{const tickets=Math.min(n,state.artifacts?.tickets??0),crystal=(n-tickets)*rules.draw_crystal;return{tickets,crystal,allowed:!!job&&(state.artifacts?.items.length??0)+n<=rules.capacity&&state.wallet.crystal>=crystal};}};
}
export function artifactDetails(item:ArtifactItem,state:AccountState){const d=artifactItemDefinition(item,content),actor=state.roster.find(a=>a.character_id===artifactOwner(state,item.instance_id))??state.roster.find(a=>artifactFits(a,d,content)),level=actor?.skill_levels[d.skill_id]??1,awakened=actor?.awakened_skills.includes(d.skill_id)??false,base=resolveSkill(d.skill_id,level,content,awakened);return describeResolvedSkill(enhanceArtifactSkill(base.definition,artifactBonus(item,content)),level,actor?{...compileCharacterSkills(actor,content).resolved_skills,[d.skill_id]:{level,definition:enhanceArtifactSkill(base.definition,artifactBonus(item,content))}}:undefined);}
export function mvpView(state:AccountState,now:number){const week=mvpWeek(now);return{week,unlocked:mvpUnlocked(state,content),unlock_after:mvpRules(content).unlock_after,bosses:mvpBosses(now,content).map(b=>{const best=state.mvp_hunt?.week===week?(state.mvp_hunt.best[b.id]??0):0,tier=Math.min(10,best+1);return{...b,element:mvpBoss(b.id,tier,content).element,size:definitionSize(b.id),best,tier,stats:mvpBoss(b.id,tier,content).resolved_base,reward:mvpReward(tier),previous:mvpReward(best)};})};}

/** Describe exactly which coefficients the shared Artifact compiler enhances. */
function artifactEnhancementLabel(s:DeepReadonly<SkillDefinition>,bonus:number){
 const pct=(v:number)=>(v*100).toLocaleString('th-TH',{maximumFractionDigits:2})+'%',labels=new Set<string>();
 if(s.kind==='passive')return 'ค่าสถานะ/เอฟเฟกต์ Passive +'+pct(bonus);
 if(s.id==='monk_call_spirits')return 'โบนัส P.ATK ต่อลูก +'+pct(bonus);
 for(const e of s.effects){
  if(e.type==='damage'||e.type==='sacrifice_damage')labels.add('ดาเมจสกิล +'+pct(bonus));
  else if(e.type==='heal')labels.add('ฮีล +'+pct(bonus));
  else if(e.type==='shield')labels.add('โล่ดูดซับ +'+pct(bonus));
  else if(e.type==='summon'){
   const summon=summonPresentation(e,content);
   if(summon?.effects.some(effect=>effect.type==='damage'))labels.add('ดาเมจผู้ช่วย +'+pct(bonus));
   if(summon?.effects.some(effect=>effect.type==='heal'))labels.add('ฮีลผู้ช่วย +'+pct(bonus));
  }
  else if(e.type==='apply_status'){
   if('power_ratio'in e.params||e.parameter_formulas?.power_ratio){
    const status=content.statuses[e.status_id] as unknown as StatusDefinition,types=status?.periodic?.effects.map(effect=>effect.type)??[];
    labels.add((types.includes('heal')?'ฮีลต่อเนื่อง':types.includes('damage')?'ดาเมจต่อเนื่อง':'ค่าเสริมบัฟ')+' +'+pct(bonus));
   }else if(typeof e.duration_ms==='number'&&e.duration_ms>0)labels.add('ระยะเวลา +'+pct(bonus*ARTIFACT_UTILITY_DURATION_SCALE));
  }else if(e.type==='remove_status'&&typeof e.max_instances==='number')labels.add(`ล้างสถานะ ${e.max_instances} → ${Math.ceil(e.max_instances*(1+bonus))} ชั้น`);
 }
 return [...labels].join(' · ');
}
