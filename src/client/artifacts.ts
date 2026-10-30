import{definitionSize}from'./monster-size.ts';
import {loadValidatedContent} from './content.ts';
import type {AccountState} from '../contracts/index.ts';
import {artifactRules,artifactDefinition,artifactBonus,artifactFits,enhanceArtifactSkill,type ArtifactItem} from '../domain/build/artifacts.ts';
import {artifactOwner,artifactUpgradeQuote} from '../domain/progression/artifacts.ts';
import {mvpRules,mvpBosses,mvpBoss,mvpWeek,mvpReward,mvpUnlocked,parseMvpRef} from '../domain/modes/mvp.ts';
import {compileCharacterSkills} from '../domain/progression/skills.ts';
import {resolveSkill} from '../domain/build/resolve-skill.ts';
import {describeResolvedSkill} from './skills.ts';
export type {ArtifactItem};
export {parseMvpRef};
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
export function artifactView(item:ArtifactItem,state:AccountState){const d=artifactDefinition(item.definition_id,content),bonus=artifactBonus(item,content),owner=artifactOwner(state,item.instance_id);return{item,definition:d,name:String((content.documents['strings.th.json']!.strings as Record<string,string>)[d.skill_id]??d.skill_id),bonus,owner,fits:(id:string)=>{const a=state.roster.find(a=>a.character_id===id);return!!a&&artifactFits(a,d,content);},next:item.level<10?artifactUpgradeQuote(item,item.level+1,content):null,copies:artifactRules(content).star_copies[item.stars]??0};}
export const artifactCatalog=()=>artifactRules(content);
export function artifactDetails(item:ArtifactItem,state:AccountState){const d=artifactDefinition(item.definition_id,content),actor=state.roster.find(a=>artifactFits(a,d,content)),level=actor?.skill_levels[d.skill_id]??1,awakened=actor?.awakened_skills.includes(d.skill_id)??false,base=resolveSkill(d.skill_id,level,content,awakened);return describeResolvedSkill(enhanceArtifactSkill(base.definition,artifactBonus(item,content)),level,actor?{...compileCharacterSkills(actor,content).resolved_skills,[d.skill_id]:{level,definition:enhanceArtifactSkill(base.definition,artifactBonus(item,content))}}:undefined);}
export function mvpView(state:AccountState,now:number){const week=mvpWeek(now);return{week,unlocked:mvpUnlocked(state,content),unlock_after:mvpRules(content).unlock_after,bosses:mvpBosses(now,content).map(b=>{const best=state.mvp_hunt?.week===week?(state.mvp_hunt.best[b.id]??0):0,tier=Math.min(10,best+1);return{...b,size:definitionSize(b.id),best,tier,stats:mvpBoss(b.id,tier,content).resolved_base,reward:mvpReward(tier),previous:mvpReward(best)};})};}
