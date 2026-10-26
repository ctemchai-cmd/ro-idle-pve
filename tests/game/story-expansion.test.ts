import test from 'node:test';
import {withoutD179FarmCards} from './legacy-magic-card-scope.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import baseline from './fixtures/story-expansion-baseline.json';
import { canonical } from '../../src/content/value.ts';
import { storyStages, storyStage, storyBoss, storyFarmSnapshot, canChallenge } from '../../src/domain/modes/story.ts';
import { storyInput } from '../../src/domain/build/story.ts';
import { createBattle, serializeBattle } from '../../src/domain/combat/index.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { dailyRecord } from '../../src/domain/modes/daily.ts';
import { FarmWaveSession, type FarmTuning } from '../../src/client/farm-scene.ts';
import { content, actor, step, checkpoint, unwrap, type Active } from './combat-fixtures.ts';
import raw from '../../src/generated/content.json';
import { validateContent } from '../../src/content/loader.ts';
import type { RawContent } from '../../src/content/model.ts';
import { legacyClass2Source } from './legacy-class2-source.ts';

const at='2026-10-23T00:00:00Z',initial=()=>initializeAccount(content,{root_job_id:'mage',gender:'female'},at,'2026-10-23',17);
const sha=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const expansion=()=>storyStages(content).filter(s=>s.chapter===9);

test('D150 appends50 connected stages with five distinct named bosses, preserves130 entire rows and all prior combat/progression data',()=>{
 const source=JSON.parse(readFileSync(new URL('../../plan/data/stages.json',import.meta.url),'utf8'));
 assert.equal(source.stages.filter((s:{chapter:number})=>s.chapter<=9).length,180);
 assert.equal(sha(canonical(source.stages.slice(0,130))),baseline.stages_sha256);
 for(const [file,expected]of Object.entries(baseline.unchanged_data))assert.equal(sha(legacyClass2Source(file)),expected,file);
 const rows=expansion();assert.equal(rows.length,50);assert.equal(rows[0]!.unlock_after,'8-20');
 const state=initial();assert.equal(canChallenge(rows[0]!,state,content),false);state.story.cleared_stage_ids.push('8-20');assert.equal(canChallenge(rows[0]!,state,content),true);
 for(let i=0;i<rows.length;i++){const s=rows[i]!;assert.equal(s.id,'9-'+(i+1));assert.equal(s.unlock_after,i?rows[i-1]!.id:'8-20');assert.equal(s.enemy_identity,'definition');assert.ok(storyBoss(s).level>=67&&storyBoss(s).level<=70);}
 assert.deepEqual([10,20,30,40,50].map(i=>storyBoss(storyStage('9-'+i,content)!).definition_id),['orc_lord','dracula','osiris','doppelganger','dark_lord']);
 assert.ok(new Set(rows.map(s=>storyBoss(s).definition_id)).size>=14);
});

test('D150 expansion keeps old actual card profiles, gear/currency rates, migration state and dailychapter9 serializable',()=>{
 const state=initial(),stages=storyStages(content);
 assert.equal(sha(canonical(stages.slice(0,130).map(s=>withoutD179FarmCards(storyFarmSnapshot(s,state,content).card_drops)))),baseline.card_profiles_sha256);
 const economy=content.documents['economy.json']!.rates as unknown as {chapter:number;per_hour:object}[];
 assert.deepEqual(economy.slice(0,8),baseline.rates);assert.deepEqual(economy[8]!.per_hour,economy[7]!.per_hour);
 for(const s of expansion()){const f=storyFarmSnapshot(s,state,content);assert.equal(f.gear_tier,60);assert.equal(f.card_drops!.chance_per_million,20000);assert.equal(f.definition_pool.length,36);}
 const sums=expansion().reduce((sum,s)=>{for(const [k,n]of Object.entries(s.first_clear_reward))sum[k]=(sum[k]??0)+n;return sum;},{}as Record<string,number>);
 assert.deepEqual(sums,{gold:202500,hero_exp:324000,skill_manual:900,crystal:200});
 state.story.cleared_stage_ids=stages.slice(0,131).map(s=>s.id);state.story.selected_farm_stage='9-1';state.farm.rate_snapshot=storyFarmSnapshot(storyStage('9-1',content)!,state,content);
 const before=structuredClone(state);assert.deepEqual(migrateAccountState(state,content).state,before);
 assert.doesNotThrow(()=>new AccountCommandRules().validateAccount(state));
 const legacy=initial();legacy.story.cleared_stage_ids=stages.slice(0,130).map(s=>s.id);legacy.story.selected_farm_stage='8-20';legacy.farm.rate_snapshot=storyFarmSnapshot(storyStage('8-20',content)!,legacy,content);
 legacy.farm.loot_rng={state:3817,draw_count:23};legacy.farm.remainders.gold=517;legacy.farm.drop_carry_ms=12345;
 legacy.inventory.push({kind:'equipment',instance_id:'earned_old',definition_id:'equipment_staff_20',rarity_id:'rare',locked:true,training:false,options:[]});
 legacy.pending_rewards.push({claim_id:'old_farm',kind:'farm',items:[{...legacy.inventory[0]!,instance_id:'pending_old'}],resource_vector:{...legacy.wallet,gold:111},content_version:content.manifest.content_version,reserved_at:at,source_keys:['farm:old'],status:'pending'});
 assert.deepEqual(migrateAccountState(legacy,content).state,legacy,'old earned/pending items, frozen farm/card profile, progress, cursor/carry and RNG remain exact');
 state.story.cleared_stage_ids=stages.filter(s=>s.chapter<=9).map(s=>s.id);state.daily_records=[dailyRecord(state,'essence','2026-10-23',content)];assert.equal(state.daily_records[0]!.chapter_snapshot,9);assert.doesNotThrow(()=>new AccountCommandRules().validateAccount(state));
});

test('D150 missing chapter income or loot routes fail content loading before a player can start',()=>{
 for(const [target,code]of [['rate','missing_farm_rate'],['gear','missing_loot_tier'],['cards','missing_card_tier']]as const){
  const broken=structuredClone(raw)as unknown as RawContent;
  if(target==='rate')broken.documents['economy.json']!.rates=(broken.documents['economy.json']!.rates as {chapter:number}[]).filter(r=>r.chapter!==9);
  else delete (broken.documents['loot.json']![target]as {tier_by_chapter:Record<string,number>}).tier_by_chapter['9'];
  const loaded=validateContent(broken);assert.equal(loaded.ok,false);if(!loaded.ok)assert.ok(loaded.errors.some(e=>e.code===code),JSON.stringify(loaded.errors));
 }
});

test('D150 farm species use their own skills, element/race/size and native art, never the passed legacy skins or mutate durable state',()=>{
 const state=initial(),before=structuredClone(state),shell=JSON.parse(readFileSync(new URL('../../src/renderer/shell-visuals.json',import.meta.url),'utf8'));
 const tuning=shell.farm as FarmTuning,definitions=content.documents['enemies.json']!.actors as unknown as {id:string;presentation:{meta_path:string}}[];
 const traits=content.documents['cards.json']!.monster_traits as unknown as Record<string,{race:string;size:string}>;
 for(const id of ['9-1','9-11','9-21','9-31','9-41'])for(const wave of [0,1,2]){
  const stage=storyStage(id,content)!,session=new FarmWaveSession(state,stage,wave,[{label:'WRONG_SKIN',meta_path:'WRONG.meta.json'}],tuning);
  for(const mob of session.view().actors.filter(a=>a.team==='enemy')){
   const row=stage.encounter.find(r=>r.definition_id===mob.name)!;assert.ok(row);
   assert.deepEqual(mob.slots,row.active_slots);assert.equal(session.scene.actors.find(a=>a.actor_id===mob.actor_id)!.body_meta,definitions.find(d=>d.id===row.definition_id)!.presentation.meta_path);
   const engine=session.state.actors.find(a=>a.actor_id===mob.actor_id)!;assert.ok(engine.tags.includes('race_'+traits[row.definition_id]!.race));assert.ok(engine.tags.includes('size_'+traits[row.definition_id]!.size));assert.ok(engine.tags.includes('element_'+row.element));
  }
  session.advanceTo(5000);
 }
 assert.deepEqual(state,before);
});

test('D150 actual expanded boss is a single enemy, all ten heavy casts stay interruptible and1x2x4 have identical events/checkpoints',()=>{
 for(const stage of expansion())if(stage.index%5===0){
  const s=resolveSkill(storyBoss(stage).active_slots[0]!,1,content).definition as Active;
  assert.ok(s.tags.includes('heavy_cast'));assert.equal(s.timing.cast_ms,4000);assert.equal(s.timing.interruptible,true);
 }
 const spatialParty=(skills:Active[]=[])=>({...actor('p','player',skills),spatial:{x:220,y:400,move_speed:120,radius:18,normal_range:80}});
 const stage=storyStage('9-50',content)!,party=spatialParty(),input=storyInput(stage,storyBoss(stage),[party],content),original=unwrap(createBattle(input,content,17));
 assert.equal(original.actors.filter(a=>a.team==='enemy').length,1);
 const runs=[1,2,4].map(speed=>{let state=checkpoint(original);const events=[];while(state.game_time_ms<40000&&!state.terminal_result){const next=step(state,Math.min(40000,state.game_time_ms+50*speed));events.push(...next.events);state=checkpoint(next.state);}return{events,state:serializeBattle(state as never)};});
 assert.deepEqual(runs[1],runs[0]);assert.deepEqual(runs[2],runs[0]);assert.ok(runs[0]!.events.some(e=>e.skill_id==='enemy_lightning_bolt'&&e.type==='damage'));
 const snare=structuredClone(resolveSkill('hunter_ankle_snare',10,content).definition)as Active;snare.cost.sp=0;snare.timing.cast_ms=500;(snare.effects[0]as{chance:number}).chance=1;
 const interrupted=step(unwrap(createBattle(storyInput(stage,storyBoss(stage),[spatialParty([snare])],content),content,17)),8000);
 assert.ok(interrupted.events.some(e=>e.type==='cast_interrupt'&&e.actor_id==='enemy_front'));
 assert.ok(!interrupted.events.some(e=>e.type==='damage'&&e.skill_id===storyBoss(stage).active_slots[0]));
});
