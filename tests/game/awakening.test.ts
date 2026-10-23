import test from 'node:test';
import { class2Content } from './class2-content-fixture.ts';
import assert from 'node:assert/strict';
import { hiContent } from './hi-content-fixtures.ts';
import { actor,unwrap,type Active } from './combat-fixtures.ts';
import {createBattle,advanceUntil} from '../../src/domain/combat/index.ts';
import type {BattleCheckpoint} from '../../src/contracts/index.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { applySkillCommand,skillAwakenQuote,skillQuote,compileCharacterSkills,shardConversionQuote } from '../../src/domain/progression/skills.ts';
import {applyRosterCommand} from '../../src/domain/progression/characters.ts';
import {resolveSkill} from '../../src/domain/build/resolve-skill.ts';
import {AccountCommandRules} from '../../src/domain/account/commands.ts';
import {migrateAccountState} from '../../src/domain/account/migrate.ts';
import {storyFarmSnapshot,storyStage} from '../../src/domain/modes/story.ts';
import {dailyBoss,dailyChest} from '../../src/domain/modes/daily.ts';
import {ContentValidator} from '../../src/content/validation.ts';
import type {ObjectValue,Json} from '../../src/content/value.ts';
import type {AccountState,Command,SkillDefinition} from '../../src/contracts/index.ts';
const future=hiContent(true),at='2026-10-23T00:00:00.000Z';
function fixture(job:AccountState['roster'][number]['job_id']='champion'){
 const row=future.jobs.byId[job]!,gender=row.ancestors.includes('dancer')?'female':'male';
 const state=initializeAccount(future,{root_job_id:row.root as AccountState['roster'][number]['root_job_id'],gender},at,'2026-10-23',17),actor=state.roster[0]!;
 Object.assign(actor,{job_id:job,level:90,local_cap:100,completed_gate_ids:[20,40,60,80],unspent_status_points:1050});
 for(const key of Object.keys(state.wallet)as(keyof AccountState['wallet'])[])state.wallet[key]=1000000000;
 let serial=0;const command=(type:Command['type'],params:unknown)=>({type,params,request_id:`11111111-1111-4111-8111-${String(++serial).padStart(12,'0')}`,expected_revision:serial,content_hash:future.manifest.content_hash,content_version:future.manifest.content_version,rules_version:future.manifest.rules_version,schema_version:1})as Command;
 return{state,actor,command};
}
test('every152 Awaken variants keeps its ID/native icon, adds a functional effect, and starts at or beyond base-max effect strength',()=>{
 const players=Object.values(future.skills).filter(s=>s.class_id!=='enemy');assert.equal(players.length,152);
 for(const row of players){
  const id=String(row.id),base=resolveSkill(id,10,future).definition as SkillDefinition,first=resolveSkill(id,1,future,true).definition as SkillDefinition;
  assert.equal(first.id,base.id);assert.equal(first.presentation_id,base.presentation_id);assert.ok(first.tags.includes('awakened'));
  if(first.kind==='active'&&base.kind==='active'){assert.ok(first.effects.length>base.effects.length);assert.deepEqual(first.timing,base.timing);}
  else if(first.kind==='passive'&&base.kind==='passive')assert.ok(first.modifiers.length>base.modifiers.length);
  for(const[key,curve]of Object.entries(base.level_parameters)){
   const original=curve.at(-1)!,awakened=first.level_parameters[key]![0]!;
   assert.ok(key==='sp_cost'?awakened<=original:Math.abs(awakened)>=Math.abs(original)-.000001,`${id}:${key}`);
  }
 }
});
test('Awaken requires High+individual max and resets only rank to1 while keeping four-slot order, paid base costs and actual compiled variant',()=>{
 const f=fixture(),id='monk_finger_offensive';
 assert.throws(()=>skillAwakenQuote(f.actor,id,future),/SKILL_NOT_MAXED/);
 applySkillCommand(f.state,f.command('skill.upgrade',{character_id:'main',skill_id:id,target_level:10})as never,future);
 f.actor.active_slots=[id,'acolyte_heal',null,null];const slots=structuredClone(f.actor.active_slots),before=structuredClone(f.state.paid_ledger),wallet=structuredClone(f.state.wallet);
 assert.deepEqual(skillAwakenQuote(f.actor,id,future),{gold:25000,awakening_shard:20});
 applySkillCommand(f.state,f.command('skill.awaken',{character_id:'main',skill_id:id})as never,future);
 assert.equal(f.actor.skill_levels[id],1);assert.deepEqual(f.actor.awakened_skills,[id]);assert.deepEqual(f.actor.active_slots,slots);
 assert.deepEqual(f.state.paid_ledger.slice(0,before.length),before);assert.equal(f.state.wallet.awakening_shard,wallet.awakening_shard-20);
 const compiled=compileCharacterSkills(f.actor,future);assert.ok(compiled.resolved_skills[id]!.definition.tags.includes('awakened'));assert.equal(compiled.resolved_skills[id]!.level,1);
 const saved=structuredClone(f.state);assert.throws(()=>applySkillCommand(f.state,f.command('skill.awaken',{character_id:'main',skill_id:id})as never,future),/SKILL_ALREADY_AWAKENED/);assert.deepEqual(f.state,saved);
 new AccountCommandRules(future).validateAccount(f.state);
});
test('no globalLv90 gate: original max skill Awaken atHigh70; newer skills must finish their70..88/80..89 rank schedule',()=>{
 const f=fixture();f.actor.level=70;f.actor.local_cap=80;f.actor.completed_gate_ids=[20,40,60];f.actor.unspent_status_points=676;
 applySkillCommand(f.state,f.command('skill.upgrade',{character_id:'main',skill_id:'acolyte_heal',target_level:10})as never,future);
 assert.ok(skillAwakenQuote(f.actor,'acolyte_heal',future));
 f.actor.job_id='monk';assert.throws(()=>skillAwakenQuote(f.actor,'acolyte_heal',future),/HI_CLASS_REQUIRED/);f.actor.job_id='champion';
 assert.throws(()=>skillAwakenQuote(f.actor,'acolyte_heal',class2Content()),/AWAKEN_UNAVAILABLE/);
 for(const [id,level]of[['champion_palm_strike',88],['champion_chain_crush_combo',89]]as const){
  f.actor.level=level-1;assert.throws(()=>applySkillCommand(f.state,f.command('skill.upgrade',{character_id:'main',skill_id:id,target_level:10})as never,future),/SKILL_CAP_REACHED/);
  f.actor.level=level;applySkillCommand(f.state,f.command('skill.upgrade',{character_id:'main',skill_id:id,target_level:10})as never,future);assert.ok(skillAwakenQuote(f.actor,id,future));
 }
});
test('Awaken upgrades charge new shards and record distinct actual-paid scope/version; reset refunds both scopes exactly once',()=>{
 const f=fixture(),id='acolyte_heal',start=structuredClone(f.state.wallet);
 applySkillCommand(f.state,f.command('skill.upgrade',{character_id:'main',skill_id:id,target_level:10})as never,future);
 const oldPrice=f.state.paid_ledger.find(e=>e.skill_id===id)!;
 oldPrice.paid_resources.gold-=1234;f.state.wallet.gold+=1234;oldPrice.cost_version='old-skill-price';oldPrice.cost_versions=['old-skill-price'];
 applySkillCommand(f.state,f.command('skill.awaken',{character_id:'main',skill_id:id})as never,future);
 assert.deepEqual(skillQuote(f.actor,id,3,future),{gold:10000,awakening_shard:25});
 applySkillCommand(f.state,f.command('skill.upgrade',{character_id:'main',skill_id:id,target_level:3})as never,future);
 const investments=f.state.paid_ledger.filter(e=>e.skill_id===id);assert.ok(investments.some(e=>e.feature_id==='skill'));assert.ok(investments.some(e=>e.feature_id==='skill_awaken'&&e.cost_version==='awakening-costs-v1'));
 applyRosterCommand(f.state,f.command('character.reset_build',{character_id:'main',features:['skills']})as never,future);
 assert.deepEqual(f.state.wallet,start);assert.deepEqual(f.actor.awakened_skills,[]);const once=structuredClone(f.state.wallet);
 applyRosterCommand(f.state,f.command('character.reset_build',{character_id:'main',features:['skills']})as never,future);assert.deepEqual(f.state.wallet,once);
});
test('10 old→1new→5old conversion is atomic, batchable, nonrefundable and cannot create materials by cycling',()=>{
 const f=fixture();f.state.wallet.skill_manual=100;f.state.wallet.awakening_shard=0;const ledger=structuredClone(f.state.paid_ledger);
 assert.deepEqual(shardConversionQuote('base_to_awakened',10,future),{cost:{skill_manual:100},gain:{awakening_shard:10}});
 applySkillCommand(f.state,f.command('skill.convert_shards',{direction:'base_to_awakened',quantity:10})as never,future);assert.equal(f.state.wallet.skill_manual,0);assert.equal(f.state.wallet.awakening_shard,10);
 applySkillCommand(f.state,f.command('skill.convert_shards',{direction:'awakened_to_base',quantity:10})as never,future);assert.equal(f.state.wallet.skill_manual,50);assert.equal(f.state.wallet.awakening_shard,0);assert.deepEqual(f.state.paid_ledger,ledger);
 const before=structuredClone(f.state);assert.throws(()=>applySkillCommand(f.state,f.command('skill.convert_shards',{direction:'base_to_awakened',quantity:6})as never,future),/INSUFFICIENT_RESOURCES/);assert.deepEqual(f.state,before);
 assert.throws(()=>shardConversionQuote('base_to_awakened',0,future),/INVALID_CONVERSION_QUANTITY/);
 f.state.wallet.awakening_shard=Number.MAX_SAFE_INTEGER;assert.throws(()=>applySkillCommand(f.state,f.command('skill.convert_shards',{direction:'base_to_awakened',quantity:1})as never,future),/RESOURCE_OVERFLOW/);
});
test('late essence dungeon chests award new shards only from chapter9 snapshot, scaling with phase; old chests and early dungeons stay fixed',()=>{
 const boss=dailyBoss('essence',future);
 assert.equal(dailyChest(boss,1,8).awakening_shard,undefined);assert.equal(dailyChest(boss,1,9).awakening_shard,2);assert.equal(dailyChest(boss,6,9).awakening_shard,4);
 assert.equal(dailyChest(dailyBoss('essence',class2Content()),6,9).awakening_shard,undefined);
 assert.equal(dailyChest(dailyBoss('forge',future),6,12).awakening_shard,undefined);
});
test('legacy state migration fills currency0 in wallet/carry/frozen snapshot/claims/paid ledger, preserves costs and never auto-Awakens',()=>{
 const state=initializeAccount(future,{root_job_id:'acolyte',gender:'female'},at,'2026-10-23',17);
 state.story.selected_farm_stage='1-1';state.story.cleared_stage_ids=['1-1'];state.farm.rate_snapshot=storyFarmSnapshot(storyStage('1-1',future)!,state,future);
 state.farm.remainders.gold=137;
 const zero=Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0]))as AccountState['wallet'];
 state.pending_rewards.push({claim_id:'old_unpaid_farm',kind:'farm',resource_vector:{...zero,gold:1234},items:[],content_version:'class2-v1.0.0',reserved_at:at,source_keys:['farm:0:1000'],status:'pending'});
 state.paid_ledger.push({entry_id:'old_skill_price',character_id:'main',feature_id:'skill',skill_id:'acolyte_heal',quantity:1,cost_version:'old-price',cost_versions:['old-price'],paid_resources:{...zero,gold:111,skill_manual:7},refund_state:'active',refund_command_id:null});
 const raw=JSON.parse(JSON.stringify(state));delete raw.wallet.awakening_shard;delete raw.farm.remainders.awakening_shard;delete raw.farm.rate_snapshot.per_hour.awakening_shard;delete raw.pending_rewards[0].resource_vector.awakening_shard;delete raw.paid_ledger[0].paid_resources.awakening_shard;for(const a of raw.roster)delete a.awakened_skills;
 const before=JSON.stringify(raw.wallet),migrated=migrateAccountState(raw,future);assert.equal(migrated.state.wallet.awakening_shard,0);assert.equal(migrated.state.farm.rate_snapshot!.per_hour.awakening_shard,0);assert.ok(migrated.state.roster.every(a=>a.awakened_skills.length===0));
 const wallet=JSON.parse(JSON.stringify(migrated.state.wallet));delete wallet.awakening_shard;assert.equal(JSON.stringify(wallet),before);
 assert.equal(migrated.state.farm.remainders.gold,137);assert.equal(migrated.state.pending_rewards[0]!.resource_vector.gold,1234);assert.equal(migrated.state.pending_rewards[0]!.resource_vector.awakening_shard,0);assert.equal(migrated.state.paid_ledger[0]!.paid_resources.gold,111);assert.equal(migrated.state.paid_ledger[0]!.paid_resources.awakening_shard,0);new AccountCommandRules(future).validateAccount(migrated.state);
});
test('new receipt schema accepts unchanged historical8-resource receipts while new creation emits9 resources',()=>{
 const rules=new AccountCommandRules(future),f=fixture(),cmd=f.command('account.create',{root_job_id:'acolyte',gender:'male'})as Extract<Command,{type:'account.create'}>;
 const fresh=rules.prepare(cmd,'a'.repeat(64),at,'2026-10-23',17);assert.equal(fresh.receipt.result.resource_delta.awakening_shard,0);
 const old=JSON.parse(JSON.stringify(fresh.receipt));delete old.result.resource_delta.awakening_shard;
 const validator=new ContentValidator(structuredClone(future.schemas)as unknown as Record<string,ObjectValue>);validator.shape('receipt',old as Json,{source:'historical receipt',path:''});
});
test('Professor Double Casting follows skill hits at most once per root cast; follow-up damage never recurses',()=>{
 const buff=structuredClone(resolveSkill('professor_double_casting',10,future).definition)as Active;
 const bolt=structuredClone(resolveSkill('mage_fire_bolt',10,future).definition)as Active;
 const damage=bolt.effects.find(e=>e.type==='damage')!;if(damage.type!=='damage')throw Error('DAMAGE_REQUIRED');damage.hits=5;damage.target='foes';
 const caster=actor('caster','player',[buff,bolt]);caster.stat_blueprint.derived_offsets.max_sp=2000;
 const initial=unwrap(createBattle({actors:[caster,...['boss','add1','add2'].map(id=>actor(id,'enemy'))],mode:{kind:'story',ref:'echo-rule',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},future,17));
 const applied=structuredClone(unwrap(advanceUntil(initial,2500,future)).state)as BattleCheckpoint;
 const status=applied.actors.find(a=>a.actor_id==='caster')!.statuses.find(s=>s.status_id==='double_casting')!;assert.ok(status);status.params.chance=1; // Isolate trigger policy from its separately checked authored RNG probability.
 const result=unwrap(advanceUntil(applied,12000,future)),hits=result.events.filter(e=>e.type==='damage'&&e.skill_id==='mage_fire_bolt');
 assert.equal(hits.length,15);const echo=result.events.filter(e=>e.type==='damage'&&e.effect_id==='echo');assert.equal(echo.length,1);assert.equal(echo[0]!.origin,'proc');assert.equal(echo[0]!.action_id,hits[0]!.action_id);
});
