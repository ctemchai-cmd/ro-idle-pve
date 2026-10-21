import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState } from '../../src/contracts/index.ts';
import { reserveFarm } from '../../src/domain/rewards/farm.ts';
import { initializeAccount } from '../../src/domain/account/initialize.ts';
import { content } from './combat-fixtures.ts';
const time='2026-10-20T00:00:00.000Z',base=Date.parse(time);
function initial(){
 const s=initializeAccount(content,{root_job_id:'mage',gender:'male'},time,'2026-10-20',1),zero=Object.fromEntries(Object.keys(s.wallet).map(k=>[k,0])) as AccountState['wallet'];
 s.farm.rate_snapshot={chapter:1,stage_id:'1-1',content_version:content.manifest.content_version,rules_version:content.manifest.rules_version,per_hour:{...zero,gold:3600,hero_exp:9000},gear_tier:1,rarity_weights:{common:660000,uncommon:250000,rare:70000,epic:15000,legendary:4000,immortal:900,supreme:100},definition_pool:Object.values(content.items).filter(i=>i.kind==='equipment'&&i.tier_level===1).map(i=>String(i.id)) as NonNullable<AccountState['farm']['rate_snapshot']>['definition_pool']};assert.equal(s.farm.rate_snapshot.definition_pool.length,36);return s;
}
test('subsecond farm reservations preserve integer carry and pay no wallet before reward claim',()=>{
 const s=initial(),a=reserveFarm(s,base,base+333,new Date(base+333).toISOString(),'first',content),b=reserveFarm(a,base+333,base+1000,new Date(base+1000).toISOString(),'second',content),whole=reserveFarm(s,base,base+1000,new Date(base+1000).toISOString(),'whole',content);
 const total=(x:AccountState,k:keyof AccountState['wallet'])=>x.pending_rewards.reduce((n,p)=>n+p.resource_vector[k],0);
 assert.equal(total(b,'gold'),1);assert.equal(total(b,'hero_exp'),2);assert.deepEqual(b.farm.remainders,whole.farm.remainders);assert.deepEqual(b.wallet,s.wallet);assert.deepEqual(s,initial());
});
test('latest12h cap, frozen rate/definition snapshot and rarity-before-definition RNG are replayable',()=>{
 const s=initial(),a=reserveFarm(s,base,base+20*3600000,new Date(base+20*3600000).toISOString(),'long',content),p=a.pending_rewards[0]!;
 assert.equal(p.resource_vector.gold,43200);assert.equal(p.items.length,144);const lines=p.items.reduce((n,i)=>n+(i.kind==='equipment'?i.options.length:0),0),perRarity=(content.documents['equipment.json']!.random_options as unknown as {lines_by_rarity:Record<string,number>}).lines_by_rarity;assert.ok(p.items.every(i=>i.kind!=='equipment'||i.options.length===perRarity[i.rarity_id]),'D-062 lines per rarity');assert.equal(a.farm.loot_rng.draw_count,288+2*lines);assert.equal(p.items[0]!.rarity_id,'common');assert.equal(p.items[0]!.definition_id,s.farm.rate_snapshot!.definition_pool[13]);/* same draw as before D-068 (index 5 of 15), now index 13 of 36 */assert.deepEqual(a,reserveFarm(s,base,base+20*3600000,new Date(base+20*3600000).toISOString(),'long',content));assert.equal(a.farm.reserved_through,new Date(base+20*3600000).toISOString());
 assert.throws(()=>reserveFarm(a,base+20*3600000,base+20*3600000,a.farm.reserved_through,'again',content),/NO_FARM_ELAPSED/);
});
test('full pending queue/clock regression rejects before any cursor, RNG or reward mutation',()=>{
 const s=initial(),copy=structuredClone(s);assert.throws(()=>reserveFarm(s,base,base-1,time,'back',content),/CLOCK_REGRESSION/);assert.deepEqual(s,copy);
 const pending=reserveFarm(s,base,base+1000,new Date(base+1000).toISOString(),'one',content).pending_rewards[0]!;s.pending_rewards=Array.from({length:32},(_,i)=>({...pending,claim_id:'claim_'+i}));const full=structuredClone(s);assert.throws(()=>reserveFarm(s,base,base+5000,new Date(base+5000).toISOString(),'full',content),/PENDING_REWARDS_FULL/);assert.deepEqual(s,full);
});
test('rate switch keeps the old reserved bundle fixed and continues from only the unpaid interval',()=>{
 const s=initial(),a=reserveFarm(s,base,base+1000,new Date(base+1000).toISOString(),'old',content),old=structuredClone(a.pending_rewards[0]);a.farm.rate_snapshot!.per_hour.gold=7200;
 const b=reserveFarm(a,base+1000,base+2000,new Date(base+2000).toISOString(),'new',content);assert.deepEqual(b.pending_rewards[0],old);assert.equal(b.pending_rewards[1]!.resource_vector.gold,2);assert.equal(b.pending_rewards.length,2);assert.equal(b.farm.reserved_through,new Date(base+2000).toISOString());
});
