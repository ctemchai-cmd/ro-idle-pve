import test from 'node:test';import assert from 'node:assert/strict';
import raw from '../../src/generated/content.json';
import {content}from './combat-fixtures.ts';
import {initializeAccount}from '../../src/domain/progression/initialize.ts';
import {storyFarmSnapshot,storyStage}from '../../src/domain/modes/story.ts';
import {reserveFarm}from '../../src/domain/rewards/farm.ts';
import {claimRewards}from '../../src/domain/progression/claim-rewards.ts';
import {migrateAccountState}from '../../src/domain/account/migrate.ts';
import {AccountCommandRules}from '../../src/domain/account/commands.ts';
import {validateContent}from '../../src/content/loader.ts';
import {shopBatchFixture}from './shop-batch-fixture.ts';
const start=Date.parse('2026-10-27T00:00:00Z'),hour=3600000;
function initial(stage='1-1'){const s=initializeAccount(content,{root_job_id:'mage',gender:'male'},new Date(start).toISOString(),'2026-10-27',17);s.story.cleared_stage_ids=['1-1'];s.story.selected_farm_stage=stage;s.farm.rate_snapshot=storyFarmSnapshot(storyStage(stage,content)!,s,content);return s;}
const sums=(s:ReturnType<typeof initial>)=>s.pending_rewards.reduce((n,c)=>({option_stone:n.option_stone+(c.crafting_materials?.option_stone??0),rarity_stone:n.rarity_stone+(c.crafting_materials?.rarity_stone??0)}),{option_stone:0,rarity_stone:0});
test('D193 twelve chapters give4–8 reroll/1–3 rarity per12h; every gear/card/options result and loot_rng remain identical',()=>{
 for(let c=1;c<=12;c++){const s=initial(c+'-1'),p=s.farm.rate_snapshot!.crafting_drops!;assert.equal(p.version,'crafting_farm_v1');const expected=c<=3?[4,1]:c<=6?[6,2]:c<=9?[7,2.5]:[8,3];assert(Math.abs(p.chance_per_million.option_stone*144/1e6-expected[0]!)<.0001);assert(Math.abs(p.chance_per_million.rarity_stone*144/1e6-expected[1]!)<.0001);
 const old=structuredClone(s);delete old.farm.rate_snapshot!.crafting_drops;const a=reserveFarm(s,start,start+12*hour,new Date(start+12*hour).toISOString(),'same',content),b=reserveFarm(old,start,start+12*hour,new Date(start+12*hour).toISOString(),'same',content);assert.deepEqual(a.pending_rewards.map(c=>c.items),b.pending_rewards.map(c=>c.items));assert.deepEqual(a.farm.loot_rng,b.farm.loot_rng);assert.deepEqual(a.farm.remainders,b.farm.remainders);assert.equal(a.farm.crafting_rng!.draw_count,288);assert(!b.farm.crafting_rng);}
});
test('D193 split/sub5min/reload reservations equal one12h roll, and a24h absence still credits at most12h',()=>{
 const source=initial('6-1'),end=start+12*hour,one=reserveFarm(source,start,end,new Date(end).toISOString(),'one',content);let split=source,from=start;
 for(const offset of[1234,299999,300001,7*hour+123,12*hour]){const t=start+offset;split=reserveFarm(JSON.parse(JSON.stringify(split)),from,t,new Date(t).toISOString(),'part'+offset,content);from=t;}
 assert.deepEqual(sums(split),sums(one));assert.deepEqual(split.farm.crafting_rng,one.farm.crafting_rng);assert.deepEqual(split.farm.loot_rng,one.farm.loot_rng);assert.equal(split.farm.drop_carry_ms,one.farm.drop_carry_ms);
 const capped=reserveFarm(source,start,start+24*hour,new Date(start+24*hour).toISOString(),'cap',content);assert.deepEqual(sums(capped),sums(one));assert.deepEqual(capped.farm.crafting_rng,one.farm.crafting_rng);
});
test('D193 migration preserves old unpaid window/pending stock; first claim settles old then installs new profile without retroactive stones',()=>{
 const s=initial();delete s.farm.rate_snapshot!.crafting_drops;const old=structuredClone(s),m=migrateAccountState(s,content).state;assert.deepEqual(m.farm,old.farm);const rules=new AccountCommandRules(content),r=rules.decide({type:'farm.claim',params:{collect_rewards:true},request_id:'22222222-2222-4222-8222-222222222222',expected_revision:1,schema_version:1,...rules.versions},m,null,{server_at:new Date(start+hour).toISOString(),now_ms:start+hour,farm_from_ms:start}as never,'a'.repeat(64));assert.equal(r.receipt.outcome,'committed');assert(r.state.farm.rate_snapshot!.crafting_drops);assert.deepEqual(r.state.equipment_crafting!.stock,{option_stone:0,rarity_stone:0});assert(!r.state.farm.crafting_rng);assert.deepEqual(s,old);
});
test('D193 fixed stone-only claims pay once without inventory slots; overflow rejects entire batch before spending or removing claims',()=>{
 const s=initial(),claim={claim_id:'stones',kind:'farm' as const,resource_vector:{...s.wallet,gold:1},items:[],crafting_materials:{option_stone:3,rarity_stone:2},content_version:content.manifest.content_version,reserved_at:new Date(start).toISOString(),source_keys:['test']as[string],status:'pending' as const};for(const k of Object.keys(claim.resource_vector)as(keyof typeof s.wallet)[])claim.resource_vector[k]=k==='gold'?1:0;s.pending_rewards=[claim];s.inventory=Array.from({length:500},(_,i)=>({instance_id:'full_'+i,kind:'equipment' as const,definition_id:'equipment_sword_1',rarity_id:'common' as const,locked:false,training:false,options:[]}));const before=s.wallet.gold;claimRewards(s,['stones'],content);assert.equal(s.wallet.gold,before+1);assert.equal(s.inventory.length,500);assert.deepEqual(s.equipment_crafting!.stock,{option_stone:3,rarity_stone:2});assert.throws(()=>claimRewards(s,['stones'],content),/CLAIM_NOT_FOUND/);
 s.pending_rewards=[claim];s.equipment_crafting!.stock.rarity_stone=Number.MAX_SAFE_INTEGER;const old=structuredClone(s);assert.throws(()=>claimRewards(s,['stones'],content),/RESOURCE_OVERFLOW/);assert.deepEqual(s,old);
});
test('D193 malformed chapter chances and optional account fields reject; valid legacy account needs no new fields',()=>{
 for(const mutate of[(r:any)=>{r.documents['loot.json'].crafting.chapter_chances['1'].rarity_stone=-1;},(r:any)=>{delete r.documents['loot.json'].crafting.chapter_chances['6'];},(r:any)=>{r.documents['loot.json'].crafting.chapter_chances['1'].bogus=1;}]){const r=structuredClone(raw);mutate(r);assert(!validateContent(r).ok);}
 const rules=new AccountCommandRules(content),s=initial();delete s.farm.rate_snapshot!.crafting_drops;assert.doesNotThrow(()=>rules.validateAccount(s));s.farm.crafting_rng={state:1,draw_count:-1};assert.throws(()=>rules.validateAccount(s));
});
test('D193 real signed API farm collection and original UUID replay grant fixed stones only once',async()=>{
 const f=shopBatchFixture('funded',new Date(start+12*hour).toISOString(),s=>{s.story.cleared_stage_ids=['1-1'];s.story.selected_farm_stage='1-1';s.farm.rate_snapshot=storyFarmSnapshot(storyStage('1-1',content)!,s,content);s.farm.rate_snapshot.crafting_drops!.chance_per_million={option_stone:1000000,rarity_stone:1000000};s.farm.reserved_through=new Date(start).toISOString();});
 const rules=new AccountCommandRules(content),command={type:'farm.claim',params:{collect_rewards:true},request_id:'44444444-4444-4444-8444-444444444444',expected_revision:f.revision,schema_version:1,...rules.versions},call=()=>f.api.fetch(new Request('http://local/api/commands',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify(command)}));const r=await call();assert.equal(r.status,200);const body=await r.json();assert.equal(body.receipt.outcome,'committed');assert.equal(f.writes,1);assert.deepEqual(f.state.equipment_crafting!.stock,{option_stone:144,rarity_stone:144});const state=structuredClone(f.state),replay=await call();assert.deepEqual((await replay.json()).receipt,body.receipt);assert.equal(f.writes,1);assert.deepEqual(f.state,state);
});
