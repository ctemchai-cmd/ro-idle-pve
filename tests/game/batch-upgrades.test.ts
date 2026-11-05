import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import type {AccountState,Command} from '../../src/contracts/index.ts';
import {content} from './combat-fixtures.ts';
import {shopBatchFixture} from './shop-batch-fixture.ts';
import {applyRefineTarget} from '../../src/domain/progression/refine-target.ts';
import {applySlotCommand,cardCapacity} from '../../src/domain/progression/slots.ts';
import {maxSkillUpgrade,skillQuote,characterSkillCap,applySkillCommand} from '../../src/domain/progression/skills.ts';
import {nextRandom} from '../../src/content/random.ts';
const params={character_id:'main',slot:'weapon' as const,target_level:15};
const cmd=(type:Command['type'],params:unknown)=>({type,params,request_id:randomUUID(),expected_revision:1,...content.manifest}) as Command;
function funded(){return shopBatchFixture('funded','2026-11-05T00:00:00Z',s=>{s.wallet.gold=100000000;s.wallet.refine_ore=1000000;}).state;}
test('target refine exactly matches consecutive single attempts including wallet, pity and sockets',()=>{
 for(const seed of [0,1,196,634785765,1568006588]){
  const a=funded(),b=structuredClone(a),rng={state:seed,draw_count:0},other={state:seed,draw_count:0};
  const summary=applyRefineTarget(a,cmd('slot.refine_target',params) as Extract<Command,{type:'slot.refine_target'}>,content,()=>nextRandom(rng));
  let n=0;while(b.roster[0]!.slot_progress.weapon.refine<15){applySlotCommand(b,cmd('slot.refine',{...params,target_level:b.roster[0]!.slot_progress.weapon.refine+1}) as Extract<Command,{type:'slot.refine'}>,content,nextRandom(other));n++;}
  assert.deepEqual(a,b);assert.equal(summary.attempts,n);assert.equal(summary.successes,15);assert.equal(summary.failures,n-15);assert.deepEqual(rng,other);assert.equal(cardCapacity(15,content),3);
 }
});
test('worst rolls still terminate at guaranteed pity, reset failures after success',()=>{
 const s=funded(),r=applyRefineTarget(s,cmd('slot.refine_target',params) as Extract<Command,{type:'slot.refine_target'}>,content,()=>.999999);
 assert.equal(r.to_level,15);assert(r.attempts<1100);assert(r.failures>500);assert.equal(s.roster[0]!.slot_progress.weapon.refine_failures,0);
});
test('partial batch stops before unaffordable attempt; no resources/no target/invalid roll never create free levels',()=>{
 for(const resource of ['gold','refine_ore'] as const){const s=funded();s.wallet[resource]=resource==='gold'?1200:24;const r=applyRefineTarget(s,cmd('slot.refine_target',{...params,target_level:5}) as Extract<Command,{type:'slot.refine_target'}>,content,()=>0);assert.equal(r.to_level,2);assert.equal(r.attempts,2);assert.equal(r.stop_reason,'insufficient_resources');assert.equal(s.wallet[resource],resource==='gold'?200:0);}
 const s=funded();s.wallet.gold=199;const before=structuredClone(s);assert.throws(()=>applyRefineTarget(s,cmd('slot.refine_target',params) as Extract<Command,{type:'slot.refine_target'}>,content,()=>0),/INSUFFICIENT_RESOURCES/);assert.deepEqual(s,before);
 const x=funded();assert.throws(()=>applyRefineTarget(x,cmd('slot.refine_target',params) as Extract<Command,{type:'slot.refine_target'}>,content,()=>NaN),/SERVER_ROLL_REQUIRED/);assert.deepEqual(x,funded());
});
test('real signed API returns aggregate summary in one commit, response-loss same UUID replays exactly',async()=>{
 const f=shopBatchFixture('funded','2026-11-05T00:00:00Z',s=>{s.wallet.refine_ore=100000;s.story.cleared_stage_ids=['1-5'];});
 const command={type:'slot.refine_target',params:{...params,target_level:10},request_id:randomUUID(),expected_revision:1,schema_version:1,...f.rules.versions};
 const call=(body:unknown)=>f.api.fetch(new Request('http://localhost/api/commands',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));
 const response=await call(command),body=await response.json();assert.equal(response.status,200);assert.equal(body.receipt.outcome,'committed');assert.equal(f.writes,1);assert.equal(f.revision,2);const s=f.state,r=body.receipt.result.refine_batch;assert.equal(r.to_level,s.roster[0]!.slot_progress.weapon.refine);assert.equal(r.successes,r.to_level);assert.equal(body.receipt.result.resource_delta.gold,s.wallet.gold-2000000);
 assert.equal(s.events!.periods[0]!.counters.upgrades,r.successes);
 const replay=await call(command);assert.deepEqual((await replay.json()).receipt,body.receipt);assert.equal(f.writes,1);assert.deepEqual(f.state,s);
 const bad=await call({...command,request_id:randomUUID(),expected_revision:2,params:{...params,target_level:16}});assert.equal(bad.status,400);assert.equal(f.writes,1);
});
test('Skill Max quotes exact affordable target and ledger, keeps phase and other skills',()=>{
 const s=funded(),a=s.roster[0]!;a.level=45;const id='swordsman_bash';a.skill_levels[id]=1;
 const all=maxSkillUpgrade(a,id,s.wallet,content)!;assert.equal(all.target,characterSkillCap(a,content.skills[id] as never));
 const cost=skillQuote(a,id,4,content);Object.assign(s.wallet,cost);const q=maxSkillUpgrade(a,id,s.wallet,content)!;assert.equal(q.target,4);assert.deepEqual(q.cost,cost);
 const old=structuredClone(s),before=structuredClone(a.skill_levels);applySkillCommand(s,cmd('skill.upgrade',{character_id:a.character_id,skill_id:id,target_level:q.target}) as Extract<Command,{type:'skill.upgrade'}>,content);
 assert.equal(a.skill_levels[id],4);assert.deepEqual({...a.skill_levels,[id]:before[id]},before);assert.deepEqual(a.awakened_skills,old.roster[0]!.awakened_skills);assert.equal(s.paid_ledger.at(-1)!.quantity,3);
 for(const[k,v]of Object.entries(cost))assert.equal(s.paid_ledger.at(-1)!.paid_resources[k as keyof AccountState['wallet']],v);
 s.wallet.gold=0;assert.equal(maxSkillUpgrade(a,id,s.wallet,content),null);
});
test('Skill Max supports learned/unlearned passive and staggered Awaken ranks, never awakens automatically',()=>{
 const s=funded(),a=s.roster[0]!;a.level=75;a.job_id='lord_knight';a.awakened_skills=['swordsman_bash'];a.skill_levels.swordsman_bash=1;
 const q=maxSkillUpgrade(a,'swordsman_bash',s.wallet,content)!;assert(q.target<10);assert(q.cost.awakening_shard!>0);assert.equal(q.cost.skill_manual??0,0);
 const passive=Object.values(content.skills).find(x=>x.class_id==='swordsman'&&x.kind==='passive')!;assert(maxSkillUpgrade(a,String(passive.id),s.wallet,content));assert.equal(a.skill_levels[passive.id as string],undefined);
 assert.equal(maxSkillUpgrade(a,'mage_fire_bolt',s.wallet,content),null);assert.equal(maxSkillUpgrade(a,'unknown',s.wallet,content),null);
});
test('all 15 wallet/material icons are present and image bytes distinct; original reroll artwork retained',()=>{
 const pack=JSON.parse(readFileSync('runtime/ro/manifest.json','utf8')),ids=Object.values(pack.shell.resource_icons) as {asset_id:string}[];assert.equal(ids.length,15);
 const sha=ids.map(r=>{const asset=pack.assets[r.asset_id];assert(asset);return pack.files.find((f:any)=>f.path===asset.media_path).sha256;});assert.equal(new Set(sha).size,15);
 const a=pack.assets[pack.shell.resource_icons.artifact_reroll.asset_id];assert.equal(pack.files.find((f:any)=>f.path===a.media_path).sha256,createHash('sha256').update(readFileSync('assets/modern/resource/mining/43.webp')).digest('hex'));
});
