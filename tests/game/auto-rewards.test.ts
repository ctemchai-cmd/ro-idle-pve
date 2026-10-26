import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, BattleCheckpoint, Command } from '../../src/contracts/index.ts';
import type { StoredBattle } from '../../src/contracts/save.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { buildAccount, treeData } from './class-skills.ts';
import { towerRow } from '../../src/domain/modes/tower.ts';
import { collectProgressRewards } from '../../src/domain/progression/auto-rewards.ts';
import { pendingProgressCollection } from '../../src/client/auto-battle.ts';
import { content, actor, unwrap } from './combat-fixtures.ts';
import { createBattle, serializeBattle } from '../../src/domain/combat/index.ts';
const owner='11111111-1111-4111-8111-111111111111';
function fixture(){
 const rules=new AccountCommandRules(),tree=treeData('swordsman');let state=buildAccount('swordsman',[tree.builds.find(b=>b.id==='knight_striker')!,tree.builds.find(b=>b.id==='crusader_guardian')!]),battle:StoredBattle|null=null,now=Date.parse('2026-10-24T00:00:00Z'),serial=0,revision=1;
 // No preselected farm/frontier; only this disposable fixture's commands can create rewards.
 const fresh=initializeAccount(content,{root_job_id:'swordsman',gender:'male'},new Date(now).toISOString(),'2026-10-24',1);state.story=fresh.story;state.farm=fresh.farm;state.pending_rewards=[];
 function run(type:Command['type'],params:unknown,ms=1000){now+=ms;const pointer=state.active_battle,command={type,params,request_id:`22222222-2222-4222-8222-${String(++serial).padStart(12,'0')}`,expected_revision:revision,schema_version:1,...rules.versions} as Command;rules.parse(command);
  const time:CommandTime={account_id:owner,battle_id:`33333333-3333-4333-8333-${String(serial).padStart(12,'0')}`,battle_seed:7,build_hashes:Object.fromEntries(state.roster.map(a=>[a.character_id,'a'.repeat(64)])),server_at:new Date(now).toISOString(),now_ms:now,new_lease_at:new Date(now+15000).toISOString(),last_ack_ms:pointer?Date.parse(pointer.last_ack_at):0,lease_expires_ms:pointer?Date.parse(pointer.lease_expires_at):0,started_ms:pointer?Date.parse(pointer.started_at):0,farm_from_ms:Date.parse(state.farm.reserved_through),stored_last_ack_ms:battle?Date.parse(battle.last_ack_at):0,stored_lease_ms:battle?Date.parse(battle.lease_expires_at):0};
  const proposal=rules.decide(command,state,battle,time,'b'.repeat(64));if(proposal.receipt.outcome==='committed'){state=proposal.state;revision++;if(proposal.battle_write.kind==='upsert')battle=proposal.battle_write.battle;if(proposal.battle_write.kind==='delete')battle=null;}return proposal;
 }
 const finish=()=>run('battle.finish',{battle_id:state.active_battle!.battle_id,collect_rewards:true},30000);
 return{run,finish,get state(){return state;},get revision(){return revision;},replaceBattle(payload:BattleCheckpoint){battle!.payload=payload;}};
}
function fullBag(state:AccountState){const item:AccountState['inventory'][number]={instance_id:'template',definition_id:'equipment_sword_1',kind:'equipment',rarity_id:'common',locked:false,training:false,options:[]};for(let n=state.inventory.length;n<500;n++)state.inventory.push({...structuredClone(item),instance_id:'fill_'+n});}

test('D164 Story win credits first clear and closed AFK in one finish/revision, advances frontier farm and replays never pay twice',()=>{
 const f=fixture(),gold=f.state.wallet.gold;assert.equal(f.run('battle.start_story',{stage_id:'1-1'}).receipt.result.code,'STORY_STARTED');let revision=f.revision;
 const won=f.finish();assert.equal(won.receipt.result.code,'STORY_WON');assert.equal(f.revision,revision+1);assert.equal(f.state.wallet.gold,gold+250);assert.equal(won.receipt.result.resource_delta.gold,250);assert.equal(f.state.pending_rewards.length,0);assert.equal(f.state.story.selected_farm_stage,'1-1');assert.equal(f.state.active_battle,null);
 f.run('battle.start_story',{stage_id:'1-2'},10000);revision=f.revision;const before=f.state.wallet.gold,result=f.finish();assert.equal(result.receipt.result.code,'STORY_WON');assert.equal(f.revision,revision+1);assert.ok(result.receipt.result.resource_delta.gold>0);assert.equal(f.state.wallet.gold,before+result.receipt.result.resource_delta.gold);assert.equal(f.state.pending_rewards.length,0);assert.equal(f.state.story.selected_farm_stage,'1-2');
 const wallet=structuredClone(f.state.wallet);f.run('battle.start_story',{stage_id:'1-2'});assert.equal(f.finish().receipt.result.code,'STORY_WON');assert.deepEqual(f.state.wallet,wallet);
 f.run('farm.set_stage',{stage_id:'1-1'});f.run('battle.start_story',{stage_id:'1-3'});assert.equal(f.finish().receipt.result.code,'STORY_WON');assert.equal(f.state.story.selected_farm_stage,'1-1','respect a deliberately older farm');assert.equal(f.state.pending_rewards.length,0);
});
test('D164 losses/timeout grant nothing and legacy absent collect flag preserves historical pending-claim behavior',()=>{
 for(const timeout of [false,true]){
  const f=fixture();f.run('battle.start_story',{stage_id:'1-1'});const mode={kind:'story' as const,ref:'1-1',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]};
  const player=actor('main','player'),boss=actor('enemy_front','enemy');player.normal_attack_enabled=false;player.stat_blueprint.derived_offsets.max_hp=100;boss.normal_attack_enabled=!timeout;boss.stat_blueprint.derived_offsets.physical_attack=1000000;
  f.replaceBattle(serializeBattle(unwrap(createBattle({actors:[player,boss],mode},content,1))));const wallet=structuredClone(f.state.wallet);const result=f.finish();assert.equal(result.receipt.result.code,timeout?'STORY_TIME_LIMIT':'STORY_DEFEATED');assert.deepEqual(f.state.wallet,wallet);assert.equal(f.state.pending_rewards.length,0);assert.deepEqual(f.state.story.cleared_stage_ids,[]);assert.equal(f.state.active_battle,null);
 }
 const legacy=fixture();legacy.run('battle.start_story',{stage_id:'1-1'});const result=legacy.run('battle.finish',{battle_id:legacy.state.active_battle!.battle_id},30000);assert.equal(result.receipt.result.code,'STORY_WON');assert.equal(legacy.state.pending_rewards.filter(c=>c.kind==='story').length,1);assert.equal(result.receipt.result.resource_delta.gold,0);
});
test('D164/D187 Tower immediate reward includes every resource and seeded cards, one revision, replay/duplicate finish never pays twice',()=>{
 for(const floor of [10,20]){
  const f=fixture();f.state.story.cleared_stage_ids=storyStages(content).slice(0,20).map(s=>s.id);f.state.tower.highest_cleared_floor=floor-1;
  const row=towerRow(floor,content),before=f.state.inventory.length,wallet=structuredClone(f.state.wallet),pity=structuredClone(f.state.gacha);
  f.run('battle.start_tower',{floor});const battle_id=f.state.active_battle!.battle_id,revision=f.revision,result=f.finish();
  assert.equal(result.receipt.result.code,'TOWER_WON');assert.equal(f.revision,revision+1);assert.equal(f.state.tower.highest_cleared_floor,floor);
  for(const key of Object.keys(wallet) as (keyof typeof wallet)[]){const amount=row.reward_resources![key]??0;assert.equal(result.receipt.result.resource_delta[key],amount,key);assert.equal(f.state.wallet[key],wallet[key]+amount,key);}
  assert.equal(f.state.inventory.length,before+row.bronze_card_count);assert.equal(result.receipt.result.created_instance_ids.length,row.bronze_card_count);assert.equal(f.state.pending_rewards.length,0);assert.deepEqual(f.state.gacha,pity);
  const saved=structuredClone(f.state.wallet);assert.equal(f.run('battle.finish',{battle_id,collect_rewards:true}).receipt.outcome,'rejected');assert.deepEqual(f.state.wallet,saved);
  f.run('battle.start_tower',{floor});assert.equal(f.finish().receipt.result.code,'TOWER_WON');assert.deepEqual(f.state.wallet,saved);assert.equal(f.state.inventory.length,before+row.bronze_card_count);
 }
});
test('D164 full inventory never rolls back victory: fixed Tower card stays pending and auto-collects exactly once after room is freed',()=>{
 const f=fixture();f.state.story.cleared_stage_ids=storyStages(content).slice(0,20).map(s=>s.id);f.state.tower.highest_cleared_floor=9;fullBag(f.state);
 f.run('battle.start_tower',{floor:10});const revision=f.revision,result=f.finish();assert.equal(result.receipt.result.code,'TOWER_WON');assert.equal(f.revision,revision+1);assert.equal(f.state.active_battle,null);assert.equal(f.state.tower.highest_cleared_floor,10);assert.equal(f.state.pending_rewards.length,1);
 const reward=structuredClone(f.state.pending_rewards[0]!);assert.equal(reward.items.length,1);for(const[k,n]of Object.entries(towerRow(10,content).reward_resources!))assert.equal(reward.resource_vector[k as keyof typeof reward.resource_vector],n);assert.deepEqual(pendingProgressCollection(f.state),[]);
 f.state.inventory.pop();assert.deepEqual(pendingProgressCollection(f.state),[reward.claim_id]);const paid=f.run('reward.claim',{claim_ids:[reward.claim_id]});assert.equal(paid.receipt.result.code,'REWARD_CLAIMED');assert.equal(f.state.pending_rewards.length,0);assert.deepEqual(f.state.inventory.at(-1),reward.items[0]);assert.equal(paid.receipt.result.resource_delta.gold,12000);
 assert.equal(f.run('reward.claim',{claim_ids:[reward.claim_id]}).receipt.outcome,'rejected');
});
test('D164 gold-only Story reward can be collected with a full bag; daily chests are never silently consumed',()=>{
 const f=fixture();fullBag(f.state);f.run('battle.start_story',{stage_id:'1-1'});const gold=f.state.wallet.gold;assert.equal(f.finish().receipt.result.code,'STORY_WON');assert.equal(f.state.wallet.gold,gold+250);
 const zero=Object.fromEntries(Object.keys(f.state.wallet).map(k=>[k,0])) as typeof f.state.wallet;f.state.pending_rewards.push({claim_id:'daily_fixed',kind:'daily',resource_vector:{...zero,gold:55},items:[],content_version:'v1',reserved_at:'2026-10-24T00:00:00Z',source_keys:['daily:treasury'],status:'pending'});
 const before=structuredClone(f.state);collectProgressRewards(f.state,content);assert.deepEqual(f.state,before);
});
