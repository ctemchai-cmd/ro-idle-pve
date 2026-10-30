import {mvpBoss,parseMvpRef} from '../domain/modes/mvp.ts';
import { dailyRewardCount } from './daily-rewards.ts';
import { definitionSize } from './monster-size.ts';
import { battleStatusViews } from './combat-status.ts';
import { loadValidatedContent } from './content.ts';
import { canonical } from '../content/value.ts';
import type { AccountState, BattleCheckpoint } from '../contracts/index.ts';
import type { BattleScene, BattleRenderView, ActorRenderView, BattleTimeline } from '../contracts/presentation.ts';
import { storyStages, storyStage, storyBoss, canChallenge, storyReleaseLock } from '../domain/modes/story.ts';
import { towerBoss, towerCanChallenge, towerData, towerRow, towerUnlocked } from '../domain/modes/tower.ts';
import { bangkokDay, dailyBoss, dailyBossActor, dailyChest, dailyData, dailyPhaseStats, dailyRecord, dailyUnlocked, modePolicy, parseDailyRef } from '../domain/modes/daily.ts';
import { createBattle, advanceUntil, restoreBattle, serializeBattle, type BattleState } from '../domain/combat/index.ts';
import { compileCharacterSkills } from '../domain/progression/skills.ts';
import { boundItemInstances } from '../domain/build/equipment-definition.ts';
import { storyParty, storyInput } from '../domain/build/story.ts';
import { combatStatistics } from '../domain/combat/statistics.ts';
import { projectBattleTimeline } from './battle-timeline.ts';
import { recordedBattleTimeline, skillHistoryEvents, type SkillHistoryEvent } from './battle-history.ts';
import { wardrobeTiers } from './equipment.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
export const STORY_PACK_HASH=content.manifest.runtime_asset_pack_hash;
export const storyVersions={schema_version:1 as const,content_hash:content.manifest.content_hash,content_version:content.manifest.content_version,rules_version:content.manifest.rules_version};
export function storyPresentationKey(state:AccountState){return canonical({team:state.team,builds:state.roster.map(actor=>({actor,items:boundItemInstances(actor,state)}))});}
/** Chapter position of a stage; the chapter-final stage keeps its authored boss look. */
/** D-067/D-074 heavy casts are any enemy skill tagged `heavy_cast` (Cataclysm, Doom, Twin Hex). */
export function isHeavyCast(skillId:string){return !!(content.skills[skillId] as unknown as {tags?:string[]}|undefined)?.tags?.includes('heavy_cast');}
export function storyStageInfo(id:string){const stage=storyStage(id,content);if(!stage)return null;const last=Math.max(...storyStages(content).filter(s=>s.chapter===stage.chapter).map(s=>s.index));return{chapter:stage.chapter,index:stage.index,last:stage.index===last,...(stage.enemy_identity?{enemy_identity:stage.enemy_identity}:{}),heavy_cast:storyBoss(stage).active_slots.some(id=>!!id&&isHeavyCast(id)),heavy_skill:storyBoss(stage).active_slots.find((id):id is string=>!!id&&isHeavyCast(id))??null};}
/** Presentation label of a stage boss for intros; definition IDs stay the gameplay reference. */
export function storyBossLabel(id:string){const stage=storyStage(id,content);if(!stage)return null;const boss=storyBoss(stage);return{size:definitionSize(boss.definition_id),name:boss.definition_id.split('_').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '),level:boss.level};}
export function storyOptions(state:AccountState){return storyStages(content).map(stage=>({id:stage.id,chapter:stage.chapter,cleared:state.story.cleared_stage_ids.includes(stage.id),available:canChallenge(stage,state,content),release_locked:storyReleaseLock(stage,content)}));}
/** Equipment follows the stage's farm-rate table; card tiers and boss levels are separate. */
export function storyGearLevel(stageId:string):number|null{
 const stage=storyStage(stageId,content);
 const gear=content.documents['loot.json']!.gear as unknown as {tier_by_chapter:Record<string,number>};
 return stage?gear.tier_by_chapter[String(stage.farm_rate_chapter)]??null:null;
}
export function storyGearRanges(){
 const ranges:{chapter:number;first:string;last:string;level:number|null}[]=[];
 for(const stage of storyStages(content)){
  const level=storyGearLevel(stage.id),previous=ranges.at(-1);
  if(previous&&previous.chapter===stage.chapter&&previous.level===level)previous.last=stage.id;
  else ranges.push({chapter:stage.chapter,first:stage.id,last:stage.id,level});
 }
 return ranges;
}
const friends:Record<string,string>={main:'คุณ',npc_swordsman:'ไคล์',npc_acolyte:'ลูเมน',npc_archer:'อารี',npc_mage:'เรน',npc_thief:'นิกซ์',npc_merchant:'มิโล'};
function title(job:string){return job.charAt(0).toUpperCase()+job.slice(1);}
/** Shared scene labels for every presentation session built from this content. */
export function sceneLabels(){const strings=content.documents['strings.th.json']!.strings as unknown as Record<string,string>,recipes=content.documents['enemies.json']!.presentations as unknown as {skill_id:string;visual:{recipe_skill_id:number}}[];return{skill_labels:Object.fromEntries(Object.values(content.skills).map(s=>[String(s.id),strings[String(s.name_key)]??String(s.id)])),enemy_recipes:Object.fromEntries(recipes.filter(r=>!(content.skills[r.skill_id]?.tags as readonly string[]|undefined)?.includes('borrowed_program')).map(r=>[r.skill_id,r.visual.recipe_skill_id]))};}
/** D-067 boss cast readout: Thai telegraph text and whether the cast is a heavy, must-interrupt one. */
export function bossCastInfo(skillId:string){const presentations=content.documents['enemies.json']!.presentations as unknown as {skill_id:string;telegraph_text?:string}[],skill=content.skills[skillId] as unknown as {tags?:string[]}|undefined;return{telegraph:presentations.find(p=>p.skill_id===skillId)?.telegraph_text??null,heavy:!!skill?.tags?.includes('heavy_cast'),name:sceneLabels().skill_labels[skillId]??skillId};}
export function partyNames(state:AccountState){return Object.fromEntries(state.roster.map(a=>[a.character_id,`${friends[a.character_id]??a.character_id} · ${title(a.job_id)}`]));}
export function partyAppearances(state:AccountState,scale=1.5){return state.team.map(p=>{const a=state.roster.find(a=>a.character_id===p.character_id)!;return{actor_id:a.character_id,job_id:a.job_id,gender:a.gender,show_weapon:!!a.equipment.weapon,facing:'right' as const,scale,...wardrobeTiers(state,a.character_id)};});}
/** Read-only projection used by every renderer session. */
export function battleRenderView(state:BattleState,names:Record<string,string>):BattleRenderView{const statuses=battleStatusViews(state);const actors:ActorRenderView[]=state.actors.map(a=>({...statuses[a.actor_id],actor_id:a.actor_id,name:names[a.actor_id]??a.actor_id,team:a.team,position:a.position,hp:a.hp,max_hp:a.stats.max_hp,sp:a.sp,max_sp:a.stats.max_sp,level:a.stat_blueprint.level,...(a.spatial?{spatial:a.spatial}:{}),phase:a.action_phase,phase_started_at:a.phase_started_at,phase_ready_at:a.phase_ready_at,phase_duration_ms:a.phase_duration_ms,cast:a.cast?{skill_id:a.cast.skill_id,interruptible:a.cast.interruptible}:null,next_slot:a.cast?.used_slot_index??a.rotation_cursor,slots:a.active_slots,status_ids:a.statuses.map(s=>s.status_id),...(a.kind==='summon'&&a.owner_actor_id?{summon_of:a.owner_actor_id,summon_kind:a.tags.find(t=>t.startsWith('summon:'))?.slice(7)??'summon'}:{})}));return{...(state.arena?{arena:state.arena}:{}),game_time_ms:state.game_time_ms,time_limit_ms:state.mode.time_limit_ms,actors,terminal:state.terminal_result?{kind:state.terminal_result.kind,at_ms:state.terminal_result.at_game_ms}:null};}
const dailyChapter:Record<string,number>={treasury:3,forge:4,essence:7};
export const dailyNames:Record<string,string>={treasury:'คลังสมบัติ',forge:'โรงหลอม',essence:'แก่นพลัง'};
/** Daily dungeon cards: today's record per boss (server Bangkok day), attempts left, current phase HP and chest preview. */
export function dailyView(state:AccountState,nowMs:number){const day=bangkokDay(nowMs);return{day,unlocked:dailyUnlocked(state,content),unlock_after:dailyData(content).unlocks_after,bosses:dailyData(content).bosses.map(boss=>{const record=dailyRecord(state,boss.id,day,content),max=dailyPhaseStats(boss,record.phase,record.chapter_snapshot).hp;return{id:boss.id,name:dailyNames[boss.id]??boss.id,enemy:boss.enemy_definition_id,size:definitionSize(boss.enemy_definition_id),attempts_left:boss.attempts_per_day-record.attempts_used,attempts:boss.attempts_per_day,pending_claim_ids:state.pending_rewards.filter(c=>c.kind==='daily'&&c.source_keys.some(k=>k.startsWith(`daily:${boss.id}:${day}:`))).map(c=>c.claim_id),pending_chests:dailyRewardCount(state.pending_rewards.filter(c=>c.kind==='daily'&&c.source_keys.some(k=>k.startsWith(`daily:${boss.id}:${day}:`)))),phase:record.phase,hp:record.current_hp,max_hp:max,chapter:record.chapter_snapshot,chest:dailyChest(dailyBoss(boss.id,content),record.phase,record.chapter_snapshot),chests_today:record.rewarded_phases.length,time_limit_ms:boss.time_limit_ms};})};}
// Tower floors borrow the scenery of the Story chapter whose boss template they reuse.
const towerChapter:Record<string,number>={poring:1,wolf:2,golem:4,drake:6,baphomet:8};
/** Scene source for any boss mode: the Story stage itself, or a Story scene chosen for a Tower floor. */
export function battlePlace(mode:Pick<BattleCheckpoint['mode'],'kind'|'ref'>){
 if(mode.kind==='mvp'){const{id,tier}=parseMvpRef(mode.ref),boss=mvpBoss(id,tier,content),stage=storyStages(content).filter(s=>s.chapter===12).at(-1)!;return{kind:'mvp' as const,stage,boss,title:`MVP Hunt · ระดับ ${tier}`,subtitle:id};}
 if(mode.kind==='daily'){const{id,chapter}=parseDailyRef(mode.ref),boss=dailyBossActor(id,1,chapter,content),stage=storyStages(content).filter(s=>s.chapter===dailyChapter[id]).at(-1)!;return{kind:'daily' as const,stage,boss,title:'ดันเจี้ยนรายวัน',subtitle:dailyNames[id]??id};}
 if(mode.kind==='tower'){const floor=Number(mode.ref),boss=towerBoss(floor,content),chapter=towerChapter[boss.definition_id]??1,stage=storyStages(content).filter(s=>s.chapter===chapter).at(-1)!;return{kind:'tower' as const,stage,boss,title:`หอคอย ชั้น ${floor}`,subtitle:'Infinity Tower'};}
 const stage=storyStage(mode.ref,content);if(!stage)throw new Error('STORY_NOT_FOUND');return{kind:'story' as const,stage,boss:storyBoss(stage),title:`ด่าน ${stage.id}`,subtitle:'Story · ท้าบอส'};
}
/** Tower floor card data for the Dungeon page (rewards/boss/state); numbers come from the shared generator. */
export function towerView(state:AccountState,from:number,count:number){const unlocked=towerUnlocked(state,content),highest=state.tower.highest_cleared_floor,data=towerData(content),periods=data.reward_schedule?.milestones.map(m=>m.every)??[data.generator.crystal_every],milestoneFloor=Math.min(...periods.map(p=>Math.ceil((highest+1)/p)*p));return{unlocked,unlock_after:data.unlocks_after,highest,milestone:Number.isFinite(milestoneFloor)?towerRow(milestoneFloor,content):null,floors:Array.from({length:count},(_,i)=>from+i).filter(f=>f>=1).map(floor=>{const row=towerRow(floor,content),boss=towerBoss(floor,content);return{floor,row,boss:boss.definition_id,size:definitionSize(boss.definition_id),skills:boss.active_slots.filter((id):id is string=>!!id),adaptive:boss.passives.length>0,cleared:floor<=highest,available:towerCanChallenge(floor,state,content)};})};}
/** TASK-039 debrief: why the fight ended and what each member actually did (metrics only, never a power-score verdict). */
export interface Debrief { kind:string; at_ms:number; limit_ms:number; boss_hp_ratio:number; members:{actor_id:string;damage:number;healing:number;overheal:number;fell_at_ms:number|null;interrupted:number;sp_skips:number;cc_ms:number}[]; tips:string[] }
export function battleDebrief(state:BattleState):Debrief{
 const result=state.terminal_result,elapsed=state.game_time_ms,party=state.actors.filter(a=>a.team==='player'&&a.kind==='party'),bosses=state.actors.filter(a=>a.team==='enemy'&&a.counts_for_terminal);
 const members=party.map(a=>{const m=state.metrics.actors[a.actor_id]!;return{actor_id:a.actor_id,damage:m.hp_damage,healing:m.effective_heal,overheal:m.overheal,fell_at_ms:a.hp<=0?m.alive_time_ms:null,interrupted:m.casts_interrupted,sp_skips:m.sp_skips,cc_ms:m.cc_blocked_actor_ms};});
 const bossHp=bosses.reduce((s,a)=>s+Math.max(0,a.hp),0),bossMax=bosses.reduce((s,a)=>s+a.stats.max_hp,0),ratio=bossMax?bossHp/bossMax:0,tips:string[]=[];
 const fallen=members.filter(m=>m.fell_at_ms!==null),skips=members.reduce((s,m)=>s+m.sp_skips,0),cut=members.reduce((s,m)=>s+m.interrupted,0),overheal=members.reduce((s,m)=>s+m.overheal,0),heal=members.reduce((s,m)=>s+m.healing,0);
 if(result?.kind==='defeat'||fallen.length>=2)tips.push('ทีมรับดาเมจหนัก: เพิ่ม VIT/อุปกรณ์ป้องกัน ใส่ฮีลหรือแทงก์ยั่วยุไว้หน้า');
 if(result?.kind==='time_limit'&&ratio>.3)tips.push(`ดาเมจยังไม่พอ (บอสเหลือ ${Math.round(ratio*100)}%): อัปเลเวล/สกิลโจมตี หรือ Refine อาวุธ`);
 if(skips>=3)tips.push('SP ไม่พอบ่อย: เพิ่ม INT/สกิลฟื้น SP หรือสลับสกิลราคาถูกขึ้นก่อน');
 if(cut>=2)tips.push('ถูกขัดร่ายบ่อย: ใช้สกิลร่ายสั้นหรือยั่วยุให้บอสตีตัวถึก');
 if(overheal>0&&overheal>heal*2)tips.push('ฮีลเกินเยอะ: ลดสกิลฮีลลงหนึ่งช่องแล้วใส่สกิลดาเมจแทน');
 // D-067: a heavy cast that went through is the main reason to change the queue, not stats.
 const landed=Object.entries(state.metrics.skills).filter(([key,row])=>isHeavyCast(key.slice(key.indexOf(':')+1))&&row.casts_resolved>0),heavy=landed.reduce((n,[,row])=>n+row.casts_resolved,0);
 const names=[...new Set(landed.map(([key])=>sceneLabels().skill_labels[key.slice(key.indexOf(':')+1)]??key))].join('/');
 if(heavy>0)tips.unshift(`บอสร่าย "${names}" สำเร็จ ${heavy} ครั้ง: ใส่สกิลสตั้น/แช่แข็ง/ใบ้/ขัดร่าย แล้วดู Timeline จัดลำดับให้ตรงจังหวะร่าย`);
 return{kind:result?.kind??'running',at_ms:result?.at_game_ms??elapsed,limit_ms:state.mode.time_limit_ms,boss_hp_ratio:ratio,members,tips};
}
/** Disposable prediction only. Server checkpoint and account receipts remain authoritative. */
export class SavedBattleSession {
 readonly content=content;readonly initial:BattleState;state:BattleState;readonly scene:BattleScene;
 private confirmed:BattleState;private projected?:Promise<BattleTimeline>;private names:Record<string,string>;
 private skillHistory:SkillHistoryEvent[]=[];
 constructor(payload:unknown,state:AccountState,skinFor:(stageId:string)=>{label:string;meta_path:string}|null=()=>null){const result=restoreBattle(payload,content);if(!result.ok)throw new Error('INCOMPATIBLE_CHECKPOINT');this.initial=result.value;this.state=result.value;this.confirmed=result.value;
  const place=battlePlace(result.value.mode),skin=place.kind==='story'?skinFor(place.stage.id):null,enemy=(content.documents['enemies.json']!.actors as unknown as {id:string;presentation:{meta_path:string}}[]).find(a=>a.id===place.boss.definition_id)!;
  this.names=partyNames(state);this.names[place.boss.actor_id]='บอส · '+(skin?.label??place.boss.definition_id.split('_').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '));
  this.scene={title:place.title,subtitle:place.subtitle,background_meta:place.stage.background.meta,music_meta:place.stage.music.meta,...sceneLabels(),actors:[...partyAppearances(state),{actor_id:place.boss.actor_id,body_meta:skin?.meta_path??enemy.presentation.meta_path,facing:'left',scale:2.1}]};
 }
 advanceTo(ms:number){if(ms<=this.state.game_time_ms)return[];const result=advanceUntil(this.state,ms,content,modePolicy(this.state.mode,content));if(!result.ok)throw new Error('BATTLE_PREDICTION_FAILED');this.state=result.value.state;this.skillHistory.push(...skillHistoryEvents(result.value.events,this.state.game_time_ms));return result.value.events;}
 confirm(payload:unknown){const restored=restoreBattle(payload,content);if(!restored.ok)throw new Error('INCOMPATIBLE_CHECKPOINT');const checkpoint=restored.value;if(checkpoint.game_time_ms<this.confirmed.game_time_ms)throw new Error('STALE_BATTLE_CHECKPOINT');
  const replay=advanceUntil(this.confirmed,checkpoint.game_time_ms,content,modePolicy(this.confirmed.mode,content));if(!replay.ok||canonical(serializeBattle(replay.value.state))!==canonical(serializeBattle(checkpoint)))throw new Error('BATTLE_PREDICTION_MISMATCH');this.confirmed=checkpoint;return this.advanceTo(checkpoint.game_time_ms);
 }
 confirmedMs(){return this.confirmed.game_time_ms;}
 checkpoint():BattleCheckpoint{return serializeBattle(this.state);}
 statistics(){return combatStatistics(this.state);}
 timeline(yieldTask:()=>Promise<void>=()=>Promise.resolve()){return this.projected??=projectBattleTimeline(this.initial,content,yieldTask);}
 recordedTimeline(){return recordedBattleTimeline(this.initial,this.skillHistory,this.state.game_time_ms);}
 recordedEvents():readonly SkillHistoryEvent[]{return this.skillHistory.slice();}
 view():BattleRenderView{return battleRenderView(this.state,this.names);}
}
export type TimelineSession=Pick<SavedBattleSession,'scene'|'timeline'|'initial'>;
export function previewStorySession(state:AccountState,id:string){const stage=storyStage(id,content);if(!stage)throw new Error('STORY_NOT_FOUND');const skills=Object.fromEntries(state.team.map(p=>[p.character_id,compileCharacterSkills(state.roster.find(a=>a.character_id===p.character_id)!,content)])),hashes=Object.fromEntries(state.team.map(p=>[p.character_id,'presentation_preview']));const result=createBattle(storyInput(stage,storyBoss(stage),storyParty(state,content,skills,hashes),content),content,0);if(!result.ok)throw new Error('PREVIEW_UNAVAILABLE');return new SavedBattleSession(serializeBattle(result.value),state);}
