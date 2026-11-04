import {storyStage,storyBoss} from '../../src/domain/modes/story.ts';
import {compileCharacterSkills} from '../../src/domain/progression/skills.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {actor,content,skill,unwrap} from './combat-fixtures.ts';
import {createBattle,advanceUntil,serializeBattle,restoreBattle,type ActorInput} from '../../src/domain/combat/index.ts';
import {skillIntervalMs,normalAttackIntervalMs} from '../../src/domain/math/index.ts';
import {liveBattleTiming} from '../../src/domain/build/timing.ts';
import {projectBattleTimeline} from '../../src/client/battle-timeline.ts';
import {initializeAccount} from '../../src/domain/progression/initialize.ts';
import {artifactView,artifactDetails,type ArtifactItem} from '../../src/client/artifacts.ts';
import {artifactResourceBalances,artifactResourceNames} from '../../src/client/resource-labels.ts';
import {equipmentStats} from '../../src/client/equipment.ts';
import {storyParty,storyInput} from '../../src/domain/build/story.ts';

const timing=liveBattleTiming(content);
function start(actors:ActorInput[],weight=.25){return unwrap(createBattle({actors,timing:{...timing,skill_interval_bonus_weight:weight},mode:{kind:'story',ref:'queue-haste',time_limit_ms:30000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,193));}
const casts=(events:readonly {type:string;actor_id?:string;at_ms:number}[])=>events.filter(e=>e.type==='cast_start'&&e.actor_id==='a').map(e=>e.at_ms);
test('live queue haste is25% above100, normal attacks and slows retain their original clocks',()=>{
 assert.deepEqual(timing,{skill_interval_base_ms:3000,normal_attack_base_ms:1500,skill_interval_bonus_weight:.25});
 for(const [aspd,queue,normal]of[[50,6000,3000],[100,3000,1500],[125,2824,1200],[200,2400,750],[300,2000,500],[500,1500,300]]){
  assert.equal(skillIntervalMs(aspd!,3000,.25),queue);assert.equal(normalAttackIntervalMs(aspd!,1500),normal);
 }
 assert.equal(skillIntervalMs(200,3000),1500,'explicit legacy profiles remain linear');
 for(const bad of[-.1,1.1,NaN,Infinity])assert.throws(()=>skillIntervalMs(200,3000,bad));
});
test('all four slots still consume SI, normal-only events are exactly unchanged',()=>{
 for(const slot of[0,2]){
  const a=actor('a','player',[skill('hit',0,0,0)],true);a.stat_blueprint.derived_offsets.attack_speed=100;a.active_slots=[null,null,null,null];a.active_slots[slot]='hit';
  const r=unwrap(advanceUntil(start([a,actor('b','enemy')]),29000,content));
  assert.deepEqual(casts(r.events),slot===0?[2400,12000,21600]:[7200,16800,26400]);
  assert(r.events.some(e=>e.type==='normal_attack'&&e.actor_id==='a'&&e.at_ms>2400&&e.at_ms<7200));
 }
 const a=actor('a','player',[],true);a.stat_blueprint.derived_offsets.attack_speed=100;
 assert.deepEqual(unwrap(advanceUntil(start([a,actor('b','enemy')]),10000,content)).events,unwrap(advanceUntil(start([a,actor('b','enemy')],1),10000,content)).events);
});
test('cast and after-cast durations unchanged; new profile survives restore/Timeline/1x2x3x and interruptions',async()=>{
 const cut=skill('cut',0,500,0);cut.effects=[{id:'cut',type:'interrupt',target:'foe'}];
 const a=actor('a','player',[cut],true),b=actor('b','enemy',[skill('long',2500,500,0)],true);b.stat_blueprint.derived_offsets.attack_speed=100;
 const initial=start([a,b]),all=unwrap(advanceUntil(initial,30000,content));assert(all.events.some(e=>e.type==='cast_interrupt'));
 for(const speed of[1,2,3]){let state=initial;const events:typeof all.events=[];while(state.game_time_ms<30000){const next=unwrap(advanceUntil(state,Math.min(30000,state.game_time_ms+500*speed),content));state=next.state;events.push(...next.events);}assert.deepEqual(state,all.state);assert.deepEqual(events,all.events);}
 const middle=unwrap(advanceUntil(initial,5000,content)),restored=unwrap(restoreBattle(serializeBattle(middle.state),content));assert.equal(restored.timing?.skill_interval_bonus_weight,.25);
 assert.deepEqual(unwrap(advanceUntil(restored,30000,content)).state,all.state);
 const timeline=await projectBattleTimeline(initial,content,()=>Promise.resolve());assert.deepEqual(timeline.entries.map(e=>[e.actor_id,e.start_ms]),all.events.filter(e=>e.type==='cast_start').map(e=>[e.actor_id,e.at_ms]));
 const caster=actor('a','player',[skill('hit',1000,500,0)]);caster.stat_blueprint.derived_offsets.attack_speed=100;
 assert.deepEqual(casts(unwrap(advanceUntil(start([caster,actor('b','enemy')]),20000,content)).events),[2400,13500]);
 const invalid=serializeBattle(middle.state);invalid.timing!.skill_interval_bonus_weight=2;assert.equal(restoreBattle(invalid,content).ok,false);
});
function account(){return initializeAccount(content,{root_job_id:'acolyte',gender:'male'},'2026-11-03T00:00:00.000Z','2026-11-03',193);}
test('live encounter builder and UI stats show the same queue and normal timing',()=>{
 const state=account(),view=equipmentStats(state,'main'),stage=storyStage('1-1',content)!,compiled=Object.fromEntries(state.roster.map(a=>[a.character_id,compileCharacterSkills(a,content)])),input=storyInput(stage,storyBoss(stage,content),storyParty(state,content,compiled,Object.fromEntries(state.roster.map(a=>[a.character_id,'queue-test']))),content);
 assert.deepEqual(input.timing,timing);const battle=unwrap(createBattle(input,content,193)),a=battle.actors.find(a=>a.actor_id==='main')!;
 assert.equal(a.phase_duration_ms,view.intervalMs);assert.equal(a.normal_clock.remaining_ms,view.normalIntervalMs);
});
const item=(id:string):ArtifactItem=>({instance_id:'test',definition_id:'artifact_'+id,level:1,stars:0,locked:false,invested_gold:0,invested_essence:0});
test('same Artifact skill improves by rarity, level and stars, with concrete effect labels',()=>{
 const state=account(),a=state.roster[0]!;a.job_id='champion';a.level=100;a.local_cap=100;a.skill_levels.monk_finger_offensive=1;
 const common={...item('monk_finger_offensive'),rarity_id:'common' as const},gold={...common,rarity_id:'legendary' as const},level={...gold,level:10},stars={...level,stars:5};
 const views=[common,gold,level,stars].map(i=>artifactView(i,state));for(let n=1;n<views.length;n++)assert(views[n]!.bonus>views[n-1]!.bonus);
 assert(views.every(v=>v.enhancementLabel.includes('ดาเมจสกิล')));assert.notDeepEqual(artifactDetails(common,state),artifactDetails(gold,state));
 assert.match(artifactView(item('acolyte_heal'),state).enhancementLabel,/ฮีล/);
 assert.match(artifactView(item('priest_sanctuary'),state).enhancementLabel,/ฮีลต่อเนื่อง/);
 assert.match(artifactView(item('monk_call_spirits'),state).enhancementLabel,/โบนัส P.ATK ต่อลูก/);
 assert.match(artifactView(item('acolyte_blessing'),state).enhancementLabel,/ระยะเวลา/);
});
test('Artifact resources read separate stock, including absent legacy fields, with distinct names',()=>{
 const state=account();delete state.artifacts;assert.deepEqual(artifactResourceBalances(state).map(r=>r.amount),[0,0,0]);
 state.artifacts={items:[],slots:{},essence:123,tickets:4,reroll_stones:7,pulls:0,legendary_misses:0};state.wallet.breakthrough_essence=999;
 assert.deepEqual(artifactResourceBalances(state).map(r=>r.amount),[123,4,7]);assert.equal(new Set(Object.values(artifactResourceNames)).size,3);
});

test('an arbitrary frame boundary cannot wake an overdue normal after a later actor breaks Freeze',()=>{
 const freeze=skill('freeze',0,0,0);freeze.effects=[{id:'freeze',type:'apply_status',target:'foe',status_id:'freeze',duration_ms:10000,params:{},chance:1}];
 const z=actor('z','player',[freeze],true),a=actor('a','enemy',[],true);a.stat_blueprint.derived_offsets.attack_speed=100;z.stat_blueprint.derived_offsets.physical_attack=1000;
 const initial=start([a,z]),whole=unwrap(advanceUntil(initial,5000,content)),first=unwrap(advanceUntil(initial,3001,content));
 assert(first.events.some(e=>e.type==='status_applied'&&e.target_id==='a'));assert.equal(first.state.actors.find(a=>a.actor_id==='a')!.statuses.length,0,'later actor normal breaks freeze after the earlier actor already passed its action gate');
 const boundary=unwrap(advanceUntil(first.state,3002,content));assert.deepEqual(boundary.events,[],'render-only boundary emits no new attack');
 const rest=unwrap(advanceUntil(boundary.state,5000,content));assert.deepEqual([...first.events,...boundary.events,...rest.events],whole.events);assert.deepEqual(rest.state,whole.state);
});
