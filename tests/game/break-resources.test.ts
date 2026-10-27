import test from'node:test';import assert from'node:assert/strict';
import{content}from'./combat-fixtures.ts';import{initializeAccount}from'../../src/domain/progression/initialize.ts';
import{applyShopPurchase,shopMaxQuantity}from'../../src/domain/progression/shop.ts';
import{storyFarmSnapshot,storyStage}from'../../src/domain/modes/story.ts';import{AccountCommandRules}from'../../src/domain/account/commands.ts';
const at='2026-10-27T00:00:00Z',day='2026-10-27';
function state(){const s=initializeAccount(content,{root_job_id:'swordsman',gender:'male'},at,day,170);s.wallet.gold=200000;s.wallet.crystal=1000;s.wallet.breakthrough_essence=0;return s;}
test('D194 gold shop buys400Break/day in one max batch, preserves Crystal and existing purchase counters',()=>{
 const s=state();assert.equal(shopMaxQuantity(s,'essence_pack',day,content),20);applyShopPurchase(s,'essence_pack',20,day,content);assert.equal(s.wallet.gold,100000);assert.equal(s.wallet.breakthrough_essence,400);assert.equal(s.wallet.crystal,1000);assert.equal(shopMaxQuantity(s,'essence_pack',day,content),0);assert.equal(shopMaxQuantity(s,'essence_pack','2026-10-28',content),20);
 const old=state();old.shop={day,purchases:{essence_pack:10}};old.wallet.breakthrough_essence=50;assert.equal(shopMaxQuantity(old,'essence_pack',day,content),10);applyShopPurchase(old,'essence_pack',10,day,content);assert.equal(old.wallet.breakthrough_essence,250);assert.equal(old.wallet.gold,150000);assert.equal(old.wallet.crystal,1000);
});
test('D194 insufficient gold, quota and overflow cannot debit any partial purchase',()=>{
 const poor=state();poor.wallet.gold=12000;assert.equal(shopMaxQuantity(poor,'essence_pack',day,content),2);const before=structuredClone(poor);assert.throws(()=>applyShopPurchase(poor,'essence_pack',3,day,content),/INSUFFICIENT_RESOURCES/);assert.deepEqual(poor,before);
 const full=state();full.wallet.breakthrough_essence=Number.MAX_SAFE_INTEGER-10;const old=structuredClone(full);assert.throws(()=>applyShopPurchase(full,'essence_pack',1,day,content),/RESOURCE_OVERFLOW/);assert.deepEqual(full,old);
});
test('D194 AFK essence rises2/12/22 per hour after1-5; old unpaid9/h window pays once before switching to12/h',()=>{
 const s=state();s.story.cleared_stage_ids=['1-1','1-2','1-3','1-4','1-5','6-1'];s.story.selected_farm_stage='6-1';s.farm.rate_snapshot=storyFarmSnapshot(storyStage('6-1',content)!,s,content);assert.equal(s.farm.rate_snapshot.per_hour.breakthrough_essence,12);s.farm.rate_snapshot.per_hour.breakthrough_essence=9;
 const rules=new AccountCommandRules(content),end=Date.parse(at)+3600000,c={type:'farm.claim',params:{collect_rewards:true},request_id:'17000000-0000-4000-8000-000000000001',expected_revision:1,schema_version:1,...rules.versions}as const,r=rules.decide(c,s,null,{server_at:new Date(end).toISOString(),now_ms:end,farm_from_ms:Date.parse(at)}as never,'a'.repeat(64));assert.equal(r.receipt.outcome,'committed');assert.equal(r.state.wallet.breakthrough_essence,9);assert.equal(r.state.farm.rate_snapshot!.per_hour.breakthrough_essence,12);
 const rates=content.documents['economy.json']!.rates as unknown as{chapter:number;per_hour:{breakthrough_essence:number}}[];assert.deepEqual(rates.map(r=>r.per_hour.breakthrough_essence),[2,12,12,12,12,12,22,22,22,22,22,22]);
});
