import test from 'node:test';
import assert from 'node:assert/strict';
import type { Effect } from '../../src/contracts/index.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { elementScrolls, preparedScroll } from '../../src/domain/build/consumables.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { weaponElement } from '../../src/domain/combat/status.ts';
import { actor, battle, checkpoint, content, skill, step } from './combat-fixtures.ts';
const at='2026-10-22T00:00:00.000Z',now=Date.parse(at);
function fixture(){
 const rules=new AccountCommandRules();let state=initializeAccount(content,{root_job_id:'swordsman',gender:'male'},at,'2026-10-22',7),seq=0;state.wallet.gold=100000;
 return{get state(){return state;},rules,run(type:string,params:unknown){seq++;const command=rules.parse({type,params,request_id:`11111111-1111-4111-8111-${String(seq).padStart(12,'0')}`,expected_revision:seq,schema_version:1,...rules.versions});
  const time:CommandTime={account_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',battle_id:`22222222-2222-4222-8222-${String(seq).padStart(12,'0')}`,battle_seed:7,build_hashes:Object.fromEntries(state.roster.map(a=>[a.character_id,'b'.repeat(64)])),server_at:at,now_ms:now,new_lease_at:new Date(now+15000).toISOString(),last_ack_ms:0,lease_expires_ms:0,started_ms:now,farm_from_ms:now,stored_last_ack_ms:0,stored_lease_ms:0};
  const result=rules.decide(command,state,null,time,'c'.repeat(64));state=result.state;return result;
 }};
}
test('D123 four scrolls buy at6000gold each (D167); prepare/replace/cancel preserves the reserved item and daily reset does not clear stock',()=>{
 const f=fixture();assert.deepEqual(elementScrolls(content).map(r=>r.element),['fire','water','earth','wind']);
 assert.equal(f.run('shop.buy',{offer_id:'fire_scroll',quantity:3}).receipt.result.code,'SHOP_PURCHASED');assert.equal(f.state.wallet.gold,82000);assert.equal(f.state.battle_supplies!.stock.fire_scroll,3);
 f.run('shop.buy',{offer_id:'water_scroll',quantity:1});assert.equal(f.run('consumable.prepare',{character_id:'main',definition_id:'fire_scroll'}).receipt.outcome,'committed');assert.equal(f.state.battle_supplies!.stock.fire_scroll,2);
 assert.equal(f.run('consumable.prepare',{character_id:'main',definition_id:'water_scroll'}).receipt.outcome,'committed');assert.equal(f.state.battle_supplies!.stock.fire_scroll,3);assert.equal(f.state.battle_supplies!.stock.water_scroll,0);assert.equal(preparedScroll(f.state,'main',content)!.element,'water');
 f.run('consumable.prepare',{character_id:'main',definition_id:null});assert.equal(f.state.battle_supplies!.stock.water_scroll,1);assert.equal(preparedScroll(f.state,'main',content),null);
 f.state.shop.day='2026-10-21';f.run('shop.buy',{offer_id:'fire_scroll',quantity:1});assert.equal(f.state.battle_supplies!.stock.fire_scroll,4);assert.equal(f.state.shop.purchases.fire_scroll,1);
});
test('D123 empty/unknown/same/overflow requests reject atomically and do not lose a previously reserved scroll',()=>{
 const f=fixture();f.run('shop.buy',{offer_id:'fire_scroll',quantity:1});f.run('consumable.prepare',{character_id:'main',definition_id:'fire_scroll'});
 for(const[id,code]of [['water_scroll','CONSUMABLE_EMPTY'],['fake_scroll','INVALID_CONSUMABLE'],['fire_scroll','CONSUMABLE_ALREADY_PREPARED']]as const){const before=structuredClone(f.state);assert.equal(f.run('consumable.prepare',{character_id:'main',definition_id:id}).receipt.result.code,code);assert.deepEqual(f.state,before);}
 f.state.battle_supplies!.stock.water_scroll=Number.MAX_SAFE_INTEGER;const before=structuredClone(f.state);assert.equal(f.run('shop.buy',{offer_id:'water_scroll',quantity:1}).receipt.result.code,'RESOURCE_OVERFLOW');assert.deepEqual(f.state,before);
 const invalid=structuredClone(f.state);invalid.battle_supplies!.queued.missing_actor='fire_scroll';assert.throws(()=>f.rules.validateAccount(invalid),/INVALID_PREPARED_CONSUMABLE/);
});
test('D123 each successful Story/Tower/Daily start consumes only the participating reservation, and failed starts preserve all scrolls',()=>{
 for(const[type,params]of [['battle.start_story',{stage_id:'1-1'}],['battle.start_tower',{floor:1}],['battle.start_daily',{boss_id:'essence'}]]as const){
  const f=fixture();f.run('shop.buy',{offer_id:'fire_scroll',quantity:2});f.run('consumable.prepare',{character_id:'main',definition_id:'fire_scroll'});f.run('consumable.prepare',{character_id:'npc_mage',definition_id:'fire_scroll'});
  const before=structuredClone(f.state);assert.equal(f.run('battle.start_story',{stage_id:'8-20'}).receipt.result.code,'STAGE_LOCKED');assert.deepEqual(f.state,before);
  f.state.story.cleared_stage_ids=storyStages(content).map(s=>s.id);
  const started=f.run(type,params);assert.equal(started.receipt.outcome,'committed',JSON.stringify(started.receipt.result));assert.equal(f.state.battle_supplies!.queued.main,undefined);assert.equal(f.state.battle_supplies!.queued.npc_mage,'fire_scroll');assert.equal(f.state.battle_supplies!.stock.fire_scroll,0);
  assert.equal(started.battle_write.kind,'upsert');if(started.battle_write.kind!=='upsert')throw Error('NO_BATTLE');const payload=started.battle_write.battle.payload as unknown as {actors:{actor_id:string;stat_blueprint:{weapon_element:string}}[]};assert.equal(payload.actors.find(a=>a.actor_id==='main')!.stat_blueprint.weapon_element,'fire');
  const inBattle=structuredClone(f.state);assert.equal(f.run('consumable.prepare',{character_id:'npc_mage',definition_id:null}).receipt.result.code,'BUILD_LOCKED_DURING_BATTLE');assert.deepEqual(f.state,inBattle);
 }
});
test('D123 weapon normal/skill hits inherit the element, fixed skills do not; endow statuses still override and1×/2×/4× keep identical events/RNG',()=>{
 function input(element:'neutral'|'fire') {const a=actor('hero','player',[],true);a.stat_blueprint.weapon_element=element;const weapon=skill('weapon_hit',0,100,0,1000),fixed=skill('fixed_fire',0,100,0,1000);(weapon.effects[0] as Extract<Effect,{type:'damage'}>).element='weapon';(fixed.effects[0] as Extract<Effect,{type:'damage'}>).element='fire';a.active_slots=['weapon_hit','fixed_fire',null,null];a.resolved_skills={weapon_hit:{level:1,definition:weapon},fixed_fire:{level:1,definition:fixed}};const b=actor('boss','enemy');b.tags=['element:earth'];return checkpoint(battle([a,b],21));}
 const fire=input('fire'),neutral=input('neutral'),a=step(fire,6000),b=step(neutral,6000);const hits=(s:typeof a,id:string)=>s.events.filter(e=>e.type==='damage'&&e.skill_id===id).map(e=>e.amount);
 assert.ok(hits(a,'weapon_hit')[0]!>hits(b,'weapon_hit')[0]!);assert.deepEqual(hits(a,'fixed_fire'),hits(b,'fixed_fire'));assert.ok(a.events.filter(e=>e.type==='damage'&&e.origin==='normal')[0]!.amount!>b.events.filter(e=>e.type==='damage'&&e.origin==='normal')[0]!.amount!);
 const traces=[];for(const speed of [1,2,4]){let state:Parameters<typeof step>[0]=structuredClone(fire),events:typeof a.events=[];for(let t=50*speed;t<=6000;t+=50*speed){const next=step(state,t);state=next.state;events.push(...next.events);}traces.push({state,events});}assert.deepEqual(traces[1],traces[0]);assert.deepEqual(traces[2],traces[0]);
 const actorState=structuredClone(fire.actors[0]!);actorState.stat_blueprint.weapon_element='water';actorState.statuses.push({instance_id:'endow',status_id:'fire_endow',source:{instance_id:'sage',owner_actor_id:'hero',origin_actor_id:'hero',origin_life_epoch:0,definition_id:'sage_flame'},applied_at:0,expires_at:10000,params:{},carrier_actor_id:'hero',offense_snapshot:structuredClone(actorState.stats),next_tick_at:null,weapon_element_snapshot:'water'});assert.equal(weaponElement(actorState,content),'fire');
});
test('D123 old saves gain an empty supply pouch once; queued/stock/paid resources persist and migration is idempotent',()=>{
 const f=fixture(),old=structuredClone(f.state);delete old.battle_supplies;const first=migrateAccountState(old,content).state;assert.deepEqual(first.battle_supplies,{stock:{},queued:{}});assert.deepEqual(first.inventory,old.inventory);assert.deepEqual(first.wallet,old.wallet);assert.deepEqual(first.paid_ledger,old.paid_ledger);
 f.run('shop.buy',{offer_id:'wind_scroll',quantity:2});f.run('consumable.prepare',{character_id:'npc_mage',definition_id:'wind_scroll'});const next=migrateAccountState(f.state,content).state;assert.deepEqual(next.battle_supplies,f.state.battle_supplies);assert.deepEqual(migrateAccountState(next,content).state,next);assert.doesNotThrow(()=>f.rules.validateAccount(next));
});
