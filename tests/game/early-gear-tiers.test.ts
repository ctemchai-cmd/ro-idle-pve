import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState } from '../../src/contracts/index.ts';
import { storyFarmSnapshot, storyStage, storyStages } from '../../src/domain/modes/story.ts';
import { farmCardProfile } from '../../src/domain/modes/farm-card-profile.ts';
import { gachaGearTier, gachaCardTier, pullGear, pullCards } from '../../src/domain/rewards/gacha.ts';
import { reserveFarm } from '../../src/domain/rewards/farm.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { nextRandom } from '../../src/content/random.ts';
import { content } from './combat-fixtures.ts';

const at='2026-10-23T00:00:00.000Z',base=Date.parse(at);
const initial=()=>initializeAccount(content,{root_job_id:'mage',gender:'female'},at,'2026-10-23',17);
const tiers=[1,1,20,40,40,60,60,60],oldTiers=[1,20,20,40,40,60,60,60];
test('D148 every stage uses chapter1–2 gearLv1, chapter3Lv20 and unchanged later tiers independently of character level',()=>{
 const state=initial(),stages=storyStages(content);
 for(const stage of stages){
  const snapshot=storyFarmSnapshot(stage,state,content);
  assert.equal(snapshot.gear_tier,tiers[stage.chapter-1],stage.id);
  assert.equal(snapshot.definition_pool.length,36);
  assert.ok(snapshot.definition_pool.every(id=>content.items[id]!.tier_level===tiers[stage.chapter-1]));
  assert.deepEqual(snapshot.card_drops,farmCardProfile(stage.chapter,oldTiers[stage.chapter-1]!,stages.indexOf(stage),stages.length,content),'card pool/chance retained '+stage.id);
 }
 for(const chapter of [1,2,3]){
  state.farm.rate_snapshot=storyFarmSnapshot(storyStage(chapter+'-1',content)!,state,content);
  const reserved=reserveFarm(state,base,base+43200000,new Date(base+43200000).toISOString(),'claim'+chapter,content);
  const gear=reserved.pending_rewards.flatMap(p=>p.items).filter(i=>i.kind==='equipment');
  assert.ok(gear.length>0);assert.ok(gear.every(i=>content.items[i.definition_id]!.tier_level===tiers[chapter-1]));
 }
});
test('D148 equipment gacha follows the corrected gear table while cards keep their original tiers and seeded drops',()=>{
 for(let chapter=1;chapter<=8;chapter++){
  const state=initial();state.story.cleared_stage_ids=storyStages(content).filter(s=>s.chapter<=chapter).map(s=>s.id);
  assert.equal(gachaGearTier(state,content),tiers[chapter-1]);assert.equal(gachaCardTier(state,content),oldTiers[chapter-1]);
  const rng={state:17,draw_count:0},items=pullGear(state,10,()=>nextRandom(rng),'gear',content);
  assert.ok(items.every(item=>content.items[item.definition_id]!.tier_level===tiers[chapter-1]));
  // Counterfactual old gear table isolates the only balance data being changed.
  const oldContent=structuredClone(content);Object.assign(oldContent.documents['loot.json']!.gear!,{tier_by_chapter:Object.fromEntries(oldTiers.map((tier,i)=>[String(i+1),tier]))});
  const a=structuredClone(state),b=structuredClone(state),r1={state:37,draw_count:0},r2={state:37,draw_count:0};
  assert.deepEqual(pullCards(a,10,()=>nextRandom(r1),'card',content),pullCards(b,10,()=>nextRandom(r2),'card',oldContent));assert.deepEqual(a.gacha,b.gacha);assert.deepEqual(r1,r2);
 }
});
test('D148 migration refreshes chapter2 future equipment pool without changing earned Lv20 items, pending claims, cards or farm cursor/RNG',()=>{
 const state=initial(),stage=storyStage('2-1',content)!;
 state.story.cleared_stage_ids=storyStages(content).slice(0,11).map(s=>s.id);state.story.selected_farm_stage=stage.id;
 state.farm.rate_snapshot={...storyFarmSnapshot(stage,state,content),gear_tier:20,definition_pool:Object.values(content.items).filter(i=>i.kind==='equipment'&&i.tier_level===20).map(i=>String(i.id)) as NonNullable<typeof state.farm.rate_snapshot>['definition_pool']};
 const item:Extract<AccountState['inventory'][number],{kind:'equipment'}>={kind:'equipment',instance_id:'old20',definition_id:'equipment_staff_20',rarity_id:'epic',locked:true,training:false,options:[]};
 state.inventory.push(item);state.pending_rewards.push({claim_id:'old_claim',kind:'farm',resource_vector:Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])) as typeof state.wallet,items:[{...item,instance_id:'pending20'}],content_version:content.manifest.content_version,reserved_at:at,source_keys:['old'],status:'pending'});
 state.farm.drop_carry_ms=12345;state.farm.loot_rng={state:42,draw_count:17};const before=structuredClone(state),migrated=migrateAccountState(state,content).state;
 assert.equal(migrated.farm.rate_snapshot!.gear_tier,1);assert.deepEqual(migrated.inventory,before.inventory);assert.deepEqual(migrated.pending_rewards,before.pending_rewards);assert.deepEqual(migrated.wallet,before.wallet);assert.deepEqual(migrated.roster,before.roster);
 assert.deepEqual(migrated.farm.rate_snapshot!.card_drops,before.farm.rate_snapshot!.card_drops);
 for(const field of ['reserved_through','drop_carry_ms','loot_rng','remainders'] as const)assert.deepEqual(migrated.farm[field],before.farm[field]);
 assert.deepEqual(migrateAccountState(migrated,content).state,migrated);assert.deepEqual(state,before);
});
