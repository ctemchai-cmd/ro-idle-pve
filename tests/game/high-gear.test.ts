import {withoutD187Source} from './legacy-tower-rewards-scope.ts';
import raw from '../../src/generated/content.json';
import{withoutD179Document,withoutD179Schema}from'./legacy-magic-card-scope.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { content, unwrap } from './combat-fixtures.ts';
import { validateContent } from '../../src/content/loader.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { storyStages, storyFarmSnapshot, storyStage } from '../../src/domain/modes/story.ts';
import { reserveFarm } from '../../src/domain/rewards/farm.ts';
import { gachaGearTier, gachaCardTier, pullGear, pullCards } from '../../src/domain/rewards/gacha.ts';
import { nextRandom } from '../../src/content/random.ts';
import { equipmentFit, itemDefinition } from '../../src/domain/build/equipment-definition.ts';
import { optionValue } from '../../src/domain/build/item-options.ts';
import { progressionData, effectiveLevelCap, levelQuote } from '../../src/domain/progression/characters.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { wardrobeRefs } from '../../src/renderer/shell.ts';
import { storyGearLevel, storyGearRanges } from '../../src/client/story.ts';
import { storyInput, storyParty } from '../../src/domain/build/story.ts';
import { compileCharacterSkills } from '../../src/domain/progression/skills.ts';
import { storyBoss } from '../../src/domain/modes/story.ts';
import { createBattle, restoreBattle, serializeBattle } from '../../src/domain/combat/index.ts';
import type { AccountState, Command } from '../../src/contracts/index.ts';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';

const before = unwrap(validateContent(JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-148/before-content.json.gz', import.meta.url))).toString())));
const legacyRaw=structuredClone(raw) as any;legacyRaw.documents=Object.fromEntries(Object.entries(raw.documents).map(([k,v])=>[k,withoutD179Document(k,v)]));legacyRaw.schemas=Object.fromEntries(Object.entries(raw.schemas).map(([k,v])=>[k,withoutD179Schema(k,v)]));legacyRaw.manifest.document_versions['cards.json']=legacyRaw.documents['cards.json'].content_version;
legacyRaw.manifest.document_versions['tower.json']=legacyRaw.documents['tower.json'].content_version;
const legacyMagic=unwrap(validateContent(legacyRaw));
const at='2026-10-25T00:00:00.000Z',data=progressionData(content),rules=new AccountCommandRules(content);
const initial=()=>initializeAccount(content,{root_job_id:'acolyte',gender:'male'},at,'2026-10-25',17);
const time:CommandTime={server_at:at,now_ms:Date.parse(at),new_lease_at:at,last_ack_ms:0,lease_expires_ms:0,started_ms:0,farm_from_ms:0,stored_last_ack_ms:0,stored_lease_ms:0};
const command=(type:Command['type'],params:unknown)=>({type,params,request_id:'14800000-1111-4111-8111-111111111111',expected_revision:1,schema_version:1,...rules.versions}) as Command;
function high(level:number){const state=initial(),actor=state.roster[0]!;Object.assign(actor,{job_id:'champion',level,local_cap:100,completed_gate_ids:[20,40,60,80],unspent_status_points:data.progression.level_rows.find(r=>r.level===level)!.total_status_points});Object.assign(state.wallet,{gold:1e9,hero_exp:1e9});return state;}

test('D172 preserves all144 existing gear, card/skill/enemy/stage/economy programs and adds exactly72 complete higher-level items',()=>{
 assert.equal(Object.values(content.items).filter(i=>i.kind==='equipment').length,216);
 for(const [id,item]of Object.entries(before.items))assert.deepEqual(legacyMagic.items[id],item,id);
 for(const name of Object.keys(before.documents).filter(n=>n.startsWith('skills/')||['cards.json','enemies.json','stages.json','economy.json','gacha.json','slot-progress.json'].includes(n)))assert.deepEqual(withoutD179Document(name,content.documents[name]),before.documents[name],name);
 const equipment=content.documents['equipment.json'] as unknown as {presentations:{id:string;icon_asset_id:string;meta_path:string}[]};
 for(const tier of[1,20,40,60,80,100]){const rows=Object.values(content.items).filter(i=>i.kind==='equipment'&&i.tier_level===tier);assert.equal(rows.length,36);assert.equal(rows.filter(i=>i.slot==='weapon').length,20);assert.equal(new Set(rows.map(i=>i.slot)).size,6);for(const item of rows){assert.equal(item.required_level,tier);assert.ok(equipment.presentations.some(p=>p.id===item.presentation_id));}}
 for(const tier of[80,100]){const item=content.items['equipment_sword_'+tier]!;assert.equal((item.modifiers as {value:number}[])[0]!.value,tier===80?250:310);assert.equal(optionValue({id:'opt_atk',roll:1000},tier,content).value,tier===80?.09:.105);const p=equipment.presentations.find(p=>p.id===item.presentation_id)!,legacy=equipment.presentations.find(p=>p.id==='visual_equipment_sword_60')!;assert.equal(p.icon_asset_id,legacy.icon_asset_id);}
});

test('D172 all330 farm stages, seeded actual drops and gacha use11→80/12→100; cards/rates/RNG are unchanged',()=>{
 const state=initial();for(const stage of storyStages(content)){const current=storyFarmSnapshot(stage,state,content),old=storyFarmSnapshot(storyStage(stage.id,before)!,state,before),tier=stage.chapter===11?80:stage.chapter===12?100:old.gear_tier;assert.equal(current.gear_tier,tier);assert.equal(storyGearLevel(stage.id),tier);assert(current.definition_pool.every(id=>content.items[id]!.tier_level===tier));assert.deepEqual({...current,gear_tier:old.gear_tier,definition_pool:old.definition_pool,card_drops:old.card_drops},old);}
 assert.deepEqual(storyGearRanges().slice(-3).map(r=>r.level),[60,80,100]);
 for(const chapter of[10,11,12]){const stage=storyStage(chapter+'-1',content)!,from=Date.parse(at),tier=chapter===11?80:chapter===12?100:60;state.story.cleared_stage_ids=storyStages(content).filter(s=>s.chapter<=chapter).map(s=>s.id);state.farm.rate_snapshot=storyFarmSnapshot(stage,state,content);const reserved=reserveFarm(state,from,from+43200000,new Date(from+43200000).toISOString(),'high'+chapter,content);const drops=reserved.pending_rewards.flatMap(r=>r.items).filter(i=>i.kind==='equipment');assert(drops.length>0&&drops.every(i=>itemDefinition(i,content).tier_level===tier));assert.equal(gachaGearTier(state,content),tier);assert.equal(gachaCardTier(state,content),gachaCardTier(state,before));const rng={state:17,draw_count:0};assert(pullGear(state,10,()=>nextRandom(rng),'high',content).every(i=>itemDefinition(i,content).tier_level===tier));const a=structuredClone(state),b=structuredClone(state),ra={state:37,draw_count:0},rb={state:37,draw_count:0};assert.deepEqual(pullCards(a,10,()=>nextRandom(ra),'cards',legacyMagic),pullCards(b,10,()=>nextRandom(rb),'cards',before));assert.deepEqual(ra,rb);}
});

test('D172 actual command90→100 charges the exact old formulas, grants manual points only and rejects101/Class2>70',()=>{
 const state=high(90),actor=state.roster[0]!,beforeState=structuredClone(state),quote=levelQuote(actor,100,data),expected={hero_exp:0,gold:0};for(let l=90;l<100;l++){expected.hero_exp+=50*l+5*l*l;expected.gold+=20*l+2*l*l;}assert.deepEqual(quote,expected);
 const cmd=command('character.level_up',{character_id:'main',target_level:100});rules.parse(cmd);rules.validateAccount(state);const result=rules.decide(cmd,state,null,time,'a'.repeat(64));assert.equal(result.receipt.outcome,'committed');const after=result.state.roster[0]!;assert.equal(after.level,100);assert.equal(effectiveLevelCap(after,data),100);assert.equal(after.unspent_status_points,Array.from({length:99},(_,i)=>3+Math.floor((i+2)/5)).reduce((a,b)=>a+b,0));assert.deepEqual(after.primary_stats,actor.primary_stats);assert.equal(result.state.wallet.gold,state.wallet.gold-expected.gold);assert.equal(result.state.wallet.hero_exp,state.wallet.hero_exp-expected.hero_exp);assert.deepEqual(after.completed_gate_ids,[20,40,60,80]);assert.deepEqual(state,beforeState);assert.throws(()=>rules.parse(command('character.level_up',{character_id:'main',target_level:101})));rules.validateAccount(result.state);
 after.job_id='monk';assert.equal(effectiveLevelCap(after,data),70);assert.equal(data.promotion.class3_enabled,false);
});

test('D172 all13 High jobs wear only compatible Lv80/100 equipment at the required level; actual level100 checkpoint restores',()=>{
 const compatibility=content.documents['equipment.json']!.weapon_compatibility as Record<string,string>;
 for(const job of content.jobs.order.filter(j=>content.jobs.byId[j]!.stage===3))for(const tier of[80,100]){const state=high(tier),actor=state.roster[0]!;actor.job_id=job as typeof actor.job_id;actor.root_job_id=content.jobs.byId[job]!.root as typeof actor.root_job_id;actor.gender=content.jobs.byId[job]!.ancestors.includes('dancer')?'female':'male';actor.skill_levels={};actor.active_slots=[null,null,null,null];const gear:Extract<AccountState['inventory'][number],{kind:'equipment'}>={kind:'equipment',instance_id:'high_weapon',definition_id:`equipment_${compatibility[job]}_${tier}`,rarity_id:'epic',locked:false,training:false,options:[{id:'opt_atk',roll:500}]};state.inventory.push(gear);assert.equal(equipmentFit(actor,'weapon',gear,content),null);actor.level=tier-1;assert.equal(equipmentFit(actor,'weapon',gear,content),'ITEM_LEVEL_REQUIRED');actor.level=tier;
  const result=rules.decide(command('equipment.equip',{character_id:'main',slot:'weapon',item_instance_id:gear.instance_id}),state,null,time,'a'.repeat(64));assert.equal(result.receipt.outcome,'committed',job);rules.validateAccount(result.state);
 }
 const state=high(100),stage=storyStage('12-1',content)!,skills=Object.fromEntries(state.team.map(p=>[p.character_id,compileCharacterSkills(state.roster.find(a=>a.character_id===p.character_id)!,content)])),party=storyParty(state,content,skills,Object.fromEntries(state.roster.map(a=>[a.character_id,'high-gear-test'])));const battle=unwrap(createBattle(storyInput(stage,storyBoss(stage),party,content),content,17));assert.equal(battle.actors.find(a=>a.actor_id==='main')!.stat_blueprint.level,100);assert(restoreBattle(serializeBattle(battle),content).ok);const bad=serializeBattle(battle);bad.actors.find(a=>a.actor_id==='main')!.stat_blueprint.level=101;assert(!restoreBattle(bad,content).ok);
});

test('D172 selected runtime reuses genuine same-family icons/wardrobe at80/100 within32MiB and keeps initial download unchanged',()=>{
 const pack=JSON.parse(readFileSync(new URL('../../runtime/ro/manifest.json',import.meta.url),'utf8')) as RuntimeAssetIndex & {sizes:{manifest_bytes:number;media_and_sidecar_bytes:number;pack_budget_bytes:number;initial_profile_raw_bytes:number}};
 assert(pack.sizes.manifest_bytes+pack.sizes.media_and_sidecar_bytes<=pack.sizes.pack_budget_bytes);assert.equal(pack.sizes.pack_budget_bytes,33554432);assert(pack.sizes.initial_profile_raw_bytes<=1621492);
 for(const job of content.jobs.order)for(const gender of['male','female'])for(const tier of[80,100])assert.deepEqual(wardrobeRefs(pack,job,gender,{head_tier:tier,garment_tier:tier}),wardrobeRefs(pack,job,gender,{head_tier:60,garment_tier:60}));
});

test('D172 implementation scope leaves every other combat/math/skill/domain source byte-identical to the frozen prior commit',()=>{
 const baseline=JSON.parse(readFileSync(new URL('../../plan/evidence/task-148/before-sha.json',import.meta.url),'utf8'));
 const allowed=new Set(['src/domain/account/migrate.ts','src/domain/modes/story.ts','src/domain/build/equipment.ts','src/domain/combat/effects.ts','src/content/validation.ts','src/contracts/index.ts']); // D179 tested additive item profiles now extend these two modules.
 for(const [file,expected]of Object.entries(baseline.implementation_sources))if(!allowed.has(file))assert.equal(createHash('sha256').update(withoutD187Source(file)).digest('hex'),expected,file);
});
