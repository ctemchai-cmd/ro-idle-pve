import { loadValidatedContent } from './content.ts';
import type { AccountState, BattleActor, CombatStats } from '../contracts/index.ts';
import type { ActorInput } from '../contracts/battle-input.ts';
import type { BattleRenderView, BattleScene } from '../contracts/presentation.ts';
import { storyStages, storyStage, storyBoss, type StoryStage } from '../domain/modes/story.ts';
import { createBattle, advanceUntil, type BattleState } from '../domain/combat/index.ts';
import { compileCharacterSkills } from '../domain/progression/skills.ts';
import { storyParty, storyInput, fixedEnemyBlueprint } from '../domain/build/story.ts';
import { resolveSkill } from '../domain/build/resolve-skill.ts';
import { battleRenderView, partyAppearances, partyNames, sceneLabels } from './story.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;

export interface FarmSkinInput {label:string;meta_path:string}
export interface FarmTuning {mobs_per_wave:readonly [number,number];wave_time_limit_ms:number;derived_from_boss_when_no_adds:Readonly<Record<'max_hp'|'physical_attack'|'magical_attack',number>>}
type EncounterRow=StoryStage['encounter'][number];
const spawn=[{x:640,y:410},{x:680,y:540},{x:650,y:660}] as const,slots=['front_1','front_2','back_1'] as const;
/** Farm stage shown behind the main screen: the selected farm stage, else the furthest cleared, else 1-1. */
export function farmSceneStage(state:AccountState):StoryStage{
 const stages=storyStages(content),cleared=stages.filter(s=>state.story.cleared_stage_ids.includes(s.id));
 return storyStage(state.story.selected_farm_stage??'',content)??cleared.at(-1)??stages[0]!;
}
/** Weak wave rows: authored stage adds when present, otherwise the stage boss row scaled by presentation tuning. */
export function farmWaveRows(stage:StoryStage,wave:number,tuning:FarmTuning):EncounterRow[]{
 const adds=stage.encounter.filter(row=>row.actor_id!=='enemy_front'),boss=storyBoss(stage),[min,max]=tuning.mobs_per_wave,count=min+wave%(max-min+1);
 const ratio=tuning.derived_from_boss_when_no_adds,derived:EncounterRow={...boss,resolved_base:{...boss.resolved_base,max_hp:Math.max(1,Math.round(boss.resolved_base.max_hp*ratio.max_hp)),physical_attack:Math.round(boss.resolved_base.physical_attack*ratio.physical_attack),magical_attack:Math.round(boss.resolved_base.magical_attack*ratio.magical_attack)}as CombatStats};
 return Array.from({length:count},(_,i)=>adds.length?adds[(i+wave)%adds.length]!:derived);
}
/**
 * Disposable ambient wave for the main screen. It reuses the shared engine and
 * the saved team build for display only; farm rewards remain server accrual.
 */
export class FarmWaveSession {
 readonly scene:BattleScene;state:BattleState;readonly stage:StoryStage;private readonly names:Record<string,string>;
 constructor(account:AccountState,stage:StoryStage,readonly wave:number,skins:readonly FarmSkinInput[],tuning:FarmTuning){
  this.stage=stage;
  const skills=Object.fromEntries(account.team.map(p=>[p.character_id,compileCharacterSkills(account.roster.find(a=>a.character_id===p.character_id)!,content)])),hashes=Object.fromEntries(account.team.map(p=>[p.character_id,'farm_presentation']));
  const party=storyParty(account,content,skills,hashes),boss=storyBoss(stage),base=storyInput({id:stage.id,time_limit_ms:tuning.wave_time_limit_ms},boss,party,content);
  const definitions=content.documents['enemies.json']!.actors as unknown as {id:string;normal_attack:boolean}[];
  const rows=farmWaveRows(stage,wave,tuning),chosen=rows.map((_,i)=>skins.length?skins[(wave*2+i*3)%skins.length]!:null);
  const mobs:ActorInput[]=rows.map((row,i)=>{const ids=[...row.active_slots.filter((id):id is string=>id!==null),...row.passives];return{actor_id:`farm_mob_${i}`,kind:'enemy',team:'enemy',position:slots[i]!,stat_blueprint:fixedEnemyBlueprint(row.level,row.resolved_base,row.element,content),active_slots:structuredClone(row.active_slots),resolved_skills:Object.fromEntries(ids.map(id=>[id,structuredClone(resolveSkill(id,1,content))]))as BattleActor['resolved_skills'],normal_attack_enabled:definitions.find(d=>d.id===row.definition_id)?.normal_attack??true,tags:[`element:${row.element}`],spatial:{...spawn[i]!,move_speed:85,radius:26,normal_range:80},build_hash:`farm_${stage.id}_${wave}`};});
  const result=createBattle({...base,actors:[...party,...mobs]},content,wave+1);if(!result.ok)throw new Error('FARM_WAVE_UNAVAILABLE');this.state=result.value;
  this.names={...partyNames(account),...Object.fromEntries(mobs.map((m,i)=>[m.actor_id,chosen[i]?.label??rows[i]!.definition_id]))};
  const enemy=definitions as unknown as {id:string;presentation:{meta_path:string}}[];
  this.scene={title:`ฟาร์ม ${stage.id}`,subtitle:'ฟาร์มอัตโนมัติ',background_meta:stage.background.meta,music_meta:stage.music.meta,...sceneLabels(),actors:[...partyAppearances(account,1.62),...mobs.map((m,i)=>({actor_id:m.actor_id,body_meta:chosen[i]?.meta_path??enemy.find(d=>d.id===rows[i]!.definition_id)!.presentation.meta_path,facing:'left' as const,scale:1.62}))]};
 }
 advanceTo(ms:number){if(ms<=this.state.game_time_ms)return[];const result=advanceUntil(this.state,ms,content);if(!result.ok)throw new Error('FARM_WAVE_FAILED');this.state=result.value.state;return result.value.events;}
 view():BattleRenderView{return battleRenderView(this.state,this.names);}
 skillIds(){return this.view().actors.flatMap(a=>a.slots.filter((id):id is string=>id!==null));}
}
