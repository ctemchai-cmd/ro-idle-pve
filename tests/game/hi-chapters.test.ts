import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import baseline from './fixtures/hi-chapters-baseline.json';
import { canonical } from '../../src/content/value.ts';
import { storyStages,storyStage,storyReleaseLock,storyBoss,canChallenge,storyFarmSnapshot } from '../../src/domain/modes/story.ts';
import { storyInput } from '../../src/domain/build/story.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { createBattle,restoreBattle,serializeBattle } from '../../src/domain/combat/index.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { dailyRecord } from '../../src/domain/modes/daily.ts';
import { content,actor,unwrap,step,type Active } from './combat-fixtures.ts';
const sha=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const initial=()=>initializeAccount(content,{root_job_id:'mage',gender:'female'},'2026-10-23T00:00:00Z','2026-10-23',17);
test('D151330 stages keep all180 released rows and old programs/actors/rates/power data byte-identical',()=>{
 const stages=storyStages(content);assert.equal(stages.length,330);
 assert.equal(sha(canonical(stages.slice(0,180))),baseline.stages_180_sha256);
 const enemies=content.documents['enemies.json']!;
 assert.deepEqual((enemies.actors as unknown as object[]).slice(0,25),baseline.old_actors);assert.deepEqual((enemies.skills as unknown as object[]).slice(0,17),baseline.old_enemy_skills);
 assert.deepEqual((content.documents['economy.json']!.rates as unknown as object[]).slice(0,9),baseline.old_rates);
 for(const [file,expected]of Object.entries(baseline.unchanged_file_sha256))assert.equal(sha(readFileSync(new URL('../../plan/data/'+file+'.json',import.meta.url))),expected,file);
 for(let i=180;i<330;i++){assert.equal(stages[i]!.unlock_after,stages[i-1]!.id);assert.ok(stages[i]!.release_gate);assert.ok(storyBoss(stages[i]!).level>=71&&storyBoss(stages[i]!).level<=90);}
 for(const chapter of[10,11,12]){const rows=stages.filter(s=>s.chapter===chapter);assert.equal(rows.length,50);assert.equal(new Set(rows.filter(s=>s.index%10===0).map(s=>storyBoss(s).definition_id)).size,5);}
});
test('D151 future chapter gates share admission and require Hi-class, correct cap, plus Awaken for12',()=>{
 const state=initial();state.story.cleared_stage_ids=storyStages(content).map(s=>s.id);
 for(const id of['10-1','11-1','12-1'])assert.equal(canChallenge(storyStage(id,content)!,state,content),false,id);
 assert.equal(canChallenge(storyStage('9-50',content)!,state,content),true);
 const future=structuredClone(content),p=future.documents['progression.json'] as unknown as {release:{level_cap:number;excluded_features:string[]};promotion:{hi_class_enabled:boolean}};
 p.promotion.hi_class_enabled=true;p.release.level_cap=79;
 assert.equal(storyReleaseLock(storyStage('10-1',future)!,future),null);assert.equal(storyReleaseLock(storyStage('11-1',future)!,future),'hi_class');
 p.release.level_cap=90;assert.equal(storyReleaseLock(storyStage('11-1',future)!,future),null);assert.equal(storyReleaseLock(storyStage('12-1',future)!,future),'awakening');
 p.release.excluded_features=p.release.excluded_features.filter(f=>f!=='awakening');assert.equal(storyReleaseLock(storyStage('12-1',future)!,future),null);
 assert.equal(dailyRecord(state,'essence','2026-10-23',content).chapter_snapshot,9);
 assert.equal((content.documents['progression.json']!.release as {level_cap:number}).level_cap,70);
 assert.doesNotThrow(()=>new AccountCommandRules().validateAccount(state));
});
test('D151 enemy90 checkpoint and native profiles are valid, party71 rejected independently of enemy cap',()=>{
 for(const id of['10-10','10-20','10-30','10-40','10-50','11-10','11-20','11-30','11-40','11-50','12-10','12-20','12-30','12-40','12-50']){
  const stage=storyStage(id,content)!,input=storyInput(stage,storyBoss(stage),[{...actor('p','player'),spatial:{x:220,y:400,move_speed:120,radius:18,normal_range:80}}],content),state=unwrap(createBattle(input,content,17));
  assert.equal(state.actors.filter(a=>a.team==='enemy').length,1);assert.ok(restoreBattle(serializeBattle(state),content).ok,id);
  const bad=serializeBattle(state);bad.actors.find(a=>a.kind==='party')!.stat_blueprint.level=71;assert.equal(restoreBattle(bad,content).ok,false);
 }
 const enemies=content.documents['enemies.json']!.actors as unknown as {id:string;active_slots:(string|null)[];presentation:{meta_path:string}}[];
 assert.equal(enemies.length,61);
 for(const enemy of enemies.slice(25)){
  assert.ok(enemy.active_slots.filter(Boolean).length>=3);
  const meta=JSON.parse(readFileSync(enemy.presentation.meta_path,'utf8'));assert.equal(meta.status,'exported');assert.deepEqual(meta.missing_dependencies??[],[]);
 }
});
test('D151 new borrowed StormGust/HolyCross run shared effects identically at1x2x4 and preserve legacy farm economics',()=>{
 for(const id of['enemy_storm_gust','enemy_holy_cross']){
  const definition=resolveSkill(id,1,content).definition;
  assert.equal(definition.kind,'active');assert.ok(definition.tags.includes('borrowed_program'));
  const run=(speed:number)=>{let state=unwrap(createBattle({actors:[actor('p','player'),actor('e','enemy',[definition as never])],mode:{kind:'story',ref:'118',time_limit_ms:15000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,17));const events=[];for(let t=50*speed;t<=10000;t+=50*speed){const r=step(state,t);events.push(...r.events);state=r.state;}return{events,state:serializeBattle(state)};};
  const a=run(1);assert.deepEqual(a,run(2));assert.deepEqual(a,run(4));assert.ok(a.events.some(e=>e.type==='damage'&&e.skill_id===id));
  const snare=structuredClone(resolveSkill('hunter_ankle_snare',10,content).definition) as unknown as Active;
  snare.cost.sp=0;snare.timing.cast_ms=500;(snare.effects[0] as {chance:number}).chance=1;
  const duel=unwrap(createBattle({actors:[actor('p','player',[snare]),actor('e','enemy',[definition as never])],mode:{kind:'story',ref:'118-interrupt',time_limit_ms:15000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,17));
  const interrupted=step(duel,4000);assert.ok(interrupted.events.some(e=>e.type==='cast_interrupt'&&e.actor_id==='e'),id+' interrupt');
  assert.ok(!interrupted.events.some(e=>e.type==='damage'&&e.skill_id===id),id+' interrupted cast has no effect');
 }
 const state=initial(),a=storyFarmSnapshot(storyStage('9-50',content)!,state,content);
 for(const id of['10-1','11-1','12-1']){const b=storyFarmSnapshot(storyStage(id,content)!,state,content);assert.deepEqual(b.per_hour,a.per_hour);assert.equal(b.gear_tier,60);assert.equal(b.card_drops!.chance_per_million,20000);}
});
