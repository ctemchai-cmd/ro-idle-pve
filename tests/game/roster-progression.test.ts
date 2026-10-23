import test from 'node:test';
import assert from 'node:assert/strict';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/account/initialize.ts';
import { allocationQuote, assertParty, progressionData, type RosterCommand } from '../../src/domain/progression/characters.ts';
import type { AccountState, Command } from '../../src/contracts/index.ts';
import { content } from './combat-fixtures.ts';
import { equipStarterSet } from './gear-fixtures.ts';
const at = '2026-10-20T00:00:00.000Z', time: CommandTime = { server_at: at, now_ms: 0, new_lease_at: at, last_ack_ms: 0, lease_expires_ms: 0, started_ms: 0, farm_from_ms: 0, stored_last_ack_ms: 0, stored_lease_ms: 0 };
function fixture() {
 const rules = new AccountCommandRules(); let state = equipStarterSet(initializeAccount(content, { root_job_id: 'swordsman', gender: 'male' }, at, '2026-10-20', 1)), revision = 1;
 const run = (type: RosterCommand['type'], params: unknown) => {
  const command = { type, params, request_id: `11111111-1111-4111-8111-${String(revision++).padStart(12,'0')}`, expected_revision: revision, schema_version: 1, ...rules.versions } as Command;
  rules.parse(command); const result = rules.decide(command, state, null, time, 'a'.repeat(64)); state = result.state; return result.receipt;
 };
 return { run, get state(){return state;}, actor(id='main'){return state.roster.find(a=>a.character_id===id)!;}, fund(){state.wallet.gold=10_000_000;state.wallet.hero_exp=10_000_000;state.wallet.breakthrough_essence=10_000;}, to20(id='main'){this.fund();assert.equal(run('character.level_up',{character_id:id,target_level:20}).outcome,'committed');} };
}
test('party identity follows NPC Class1 origin; main may duplicate; changing position never copies progression',()=>{
 const f=fixture();f.to20();f.to20('npc_swordsman');f.run('character.change_job',{character_id:'main',job_id:'knight'});f.run('character.change_job',{character_id:'npc_swordsman',job_id:'knight'});
 assert.equal(f.run('party.set',{placements:f.state.team}).outcome,'committed');
 const hacked=structuredClone(f.state);hacked.roster[4]={...hacked.roster[4],root_job_id:'swordsman',job_id:'crusader'};const placements=structuredClone(hacked.team);placements[3]!.character_id=hacked.roster[4].character_id;assert.throws(()=>assertParty(hacked,placements),/INVALID_TEAM/);
 const before=structuredClone(f.actor('npc_swordsman'));const team=structuredClone(f.state.team);team.find(p=>p.character_id==='npc_swordsman')!.character_id='npc_mage';f.run('party.set',{placements:team});assert.deepEqual(f.actor('npc_swordsman'),before);assert.equal(f.actor('npc_mage').level,1);
 f.run('character.level_up',{character_id:'npc_swordsman',target_level:20});assert.deepEqual(f.actor('npc_swordsman'),before);
 assert.equal(f.run('party.set',{placements:[team[0],team[0],team[2],team[3]]}).result.code,'INVALID_TEAM');
});
test('manual resource leveling supports off-team actors, exact costs, caps20/40/60/70 and no automatic primary growth',()=>{
 const f=fixture(),primary=structuredClone(f.actor('npc_mage').primary_stats);assert.ok(!f.state.team.some(p=>p.character_id==='npc_mage'));
 f.fund();const initial=structuredClone(f.state.wallet);assert.equal(f.run('character.level_up',{character_id:'npc_mage',target_level:20}).outcome,'committed');assert.equal(f.state.wallet.gold,initial.gold-8740);assert.equal(f.state.wallet.hero_exp,initial.hero_exp-21850);assert.equal(f.actor('npc_mage').unspent_status_points,91);assert.deepEqual(f.actor('npc_mage').primary_stats,primary);assert.equal(f.actor().level,1);
 const old=structuredClone(f.state);assert.equal(f.run('character.level_up',{character_id:'npc_mage',target_level:21}).result.code,'LEVEL_CAP_REACHED');assert.deepEqual(f.state,old);
 // Job20 is independent from breakthrough20.
 assert.equal(f.run('character.change_job',{character_id:'npc_mage',job_id:'wizard'}).outcome,'committed');assert.equal(f.actor('npc_mage').local_cap,20);
 for(const [gate,target] of [[20,40],[40,60],[60,70]] as const){assert.equal(f.run('character.breakthrough',{character_id:'npc_mage',gate_level:gate}).outcome,'committed');assert.equal(f.run('character.level_up',{character_id:'npc_mage',target_level:target}).outcome,'committed');}
 assert.equal(f.actor('npc_mage').level,70);assert.equal(f.actor('npc_mage').local_cap,80);assert.deepEqual(f.actor('npc_mage').completed_gate_ids,[20,40,60]);assert.deepEqual(f.actor('npc_mage').primary_stats,primary);assert.equal(f.actor('npc_mage').unspent_status_points,676);
 assert.equal(f.state.wallet.gold,initial.gold-402090);assert.equal(f.state.wallet.hero_exp,initial.hero_exp-680225);assert.equal(f.state.wallet.breakthrough_essence,initial.breakthrough_essence-520);
 assert.equal(f.run('character.breakthrough',{character_id:'npc_mage',gate_level:60}).result.code,'BREAKTHROUGH_UNAVAILABLE');
 // Schema prepares Hi90, while released Class2 admission still stops at70.
 const capped=structuredClone(f.state);assert.equal(f.run('character.level_up',{character_id:'npc_mage',target_level:71}).result.code,'LEVEL_CAP_REACHED');assert.deepEqual(f.state,capped);
 assert.throws(()=>new AccountCommandRules().parse({type:'character.level_up',params:{character_id:'npc_mage',target_level:91},request_id:'11111111-1111-4111-8111-111111111111',expected_revision:1,schema_version:1,...new AccountCommandRules().versions}));
});
test('status cost uses reviewed table, no implicit spending, and reset refunds actual point investments once',()=>{
 const f=fixture();f.to20();const base=structuredClone(f.actor().primary_stats),allocation={...base,str:12};assert.equal(allocationQuote(base,allocation,progressionData(content)),12);
 const wallet=structuredClone(f.state.wallet),receipt=f.run('character.allocate_status',{character_id:'main',allocation});assert.equal(receipt.outcome,'committed');assert.equal(f.actor().unspent_status_points,79);assert.equal(receipt.result.ledger_entry_ids.length,1);assert.deepEqual(f.state.wallet,wallet);
 const old=structuredClone(f.state);assert.equal(f.run('character.allocate_status',{character_id:'main',allocation:{...allocation,str:11}}).result.code,'INVALID_STATUS_ALLOCATION');assert.deepEqual(f.state,old);
 assert.equal(f.run('character.allocate_status',{character_id:'main',allocation:{...allocation,agi:99}}).result.code,'INSUFFICIENT_STATUS_POINTS');assert.deepEqual(f.state,old);
 const reset=f.run('character.reset_build',{character_id:'main',features:['stats']});assert.equal(reset.result.refunded_ledger_entries.length,1);assert.equal(f.actor().unspent_status_points,91);assert.deepEqual(f.actor().primary_stats,base);assert.deepEqual(f.state.wallet,wallet);
 assert.equal(f.run('character.reset_build',{character_id:'main',features:['stats']}).result.refunded_ledger_entries.length,0);assert.equal(f.actor().unspent_status_points,91);
});
test('class switch preserves identity/level/gates/slot progress, returns exact weapon instance, resets actual-paid skills and changes Bard/Dancer gender',()=>{
 const f=fixture();f.to20();const actor=f.actor(),weapon=actor.equipment.weapon!,slot=actor.slot_progress.weapon;slot.refine=4;slot.enchant={line_id:'offense',level:2};
 const wallet=structuredClone(f.state.wallet);f.state.wallet.gold-=100;f.state.wallet.skill_manual-=20;
 const skillId=Object.keys(actor.skill_levels)[0]!;actor.skill_levels[skillId]=2;
 f.state.paid_ledger.push({entry_id:'old_price_investment',character_id:'main',feature_id:'skill',skill_id:skillId,quantity:1,cost_version:'old-cheaper-v0',cost_versions:['old-cheaper-v0'],paid_resources:{...Object.fromEntries(Object.keys(wallet).map(k=>[k,0])),gold:100,skill_manual:20} as AccountState['wallet'],refund_state:'active',refund_command_id:null});
 const result=f.run('character.change_job',{character_id:'main',job_id:'dancer'});assert.equal(result.outcome,'committed');assert.equal(result.result.refunded_ledger_entries[0]!.paid_resources.gold,100);assert.deepEqual(f.state.wallet,wallet);assert.equal(f.actor().root_job_id,'archer');assert.equal(f.actor().gender,'female');assert.equal(f.actor().equipment.weapon,null);assert.deepEqual(f.actor().slot_progress.weapon,slot);assert.equal(f.state.inventory.filter(i=>i.instance_id===weapon).length,1);assert.equal(f.actor().level,20);assert.equal(f.actor().local_cap,20);
 assert.ok(Object.keys(f.actor().skill_levels).every(id=>content.skills[id]!.class_id==='archer'));assert.equal(f.run('character.change_job',{character_id:'main',job_id:'bard'}).outcome,'committed');assert.equal(f.actor().gender,'male');assert.deepEqual(f.state.wallet,wallet);
 assert.equal(f.run('character.change_job',{character_id:'npc_swordsman',job_id:'mage'}).result.code,'NPC_ROOT_IMMUTABLE');assert.equal(f.run('character.change_job',{character_id:'npc_archer',job_id:'hunter'}).result.code,'CLASS_LEVEL_REQUIRED');
});
test('resource shortage, full inventory and active-battle restrictions reject the whole command without partial refunds or stat mutations',()=>{
 const f=fixture();f.state.wallet.gold=0;let before=structuredClone(f.state);assert.equal(f.run('character.level_up',{character_id:'main',target_level:2}).result.code,'INSUFFICIENT_RESOURCES');assert.deepEqual(f.state,before);
 f.to20();while(f.state.inventory.length<500)f.state.inventory.push({...f.state.inventory[0]!,instance_id:'bag_'+f.state.inventory.length});before=structuredClone(f.state);assert.equal(f.run('character.change_job',{character_id:'main',job_id:'wizard'}).result.code,'INVENTORY_FULL');assert.deepEqual(f.state,before);
 f.state.active_battle={battle_id:'11111111-1111-4111-8111-111111111111',mode:'story',mode_ref:'1-1',ticket_day:null,started_at:at,last_ack_at:at,lease_expires_at:at,...new AccountCommandRules().versions};before=structuredClone(f.state);assert.equal(f.run('character.reset_build',{character_id:'main',features:['stats','skills']}).result.code,'BUILD_LOCKED_DURING_BATTLE');assert.deepEqual(f.state,before);
});
