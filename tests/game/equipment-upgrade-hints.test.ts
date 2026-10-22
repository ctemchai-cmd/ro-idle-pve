import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState } from '../../src/contracts/index.ts';
import { equipmentUpgradeHints } from '../../src/client/equipment.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { content } from './combat-fixtures.ts';
import { equipStarterSet } from './gear-fixtures.ts';

type Gear=Extract<AccountState['inventory'][number],{kind:'equipment'}>;
const gear=(id:string,definition_id='equipment_sword_1',rarity_id:Gear['rarity_id']='rare',options:Gear['options']=[]):Gear=>({instance_id:id,definition_id,kind:'equipment',rarity_id,locked:false,training:false,options});
function fixture(){return equipStarterSet(initializeAccount(content,{root_job_id:'swordsman',gender:'male'},'2026-10-22T00:00:00Z','2026-10-22',1));}

test('a usable improvement marks its slot and stops marking it after equipping; empty slots can be filled',()=>{
 const state=fixture(),main=state.roster[0]!;state.inventory.push(gear('better'),gear('head','equipment_head_1'));
 assert.equal(equipmentUpgradeHints(state,'main').weapon,'better');
 main.equipment.weapon='better';assert.equal(equipmentUpgradeHints(state,'main').weapon,undefined);
 main.equipment.head=null;assert.equal(equipmentUpgradeHints(state,'main').head,'head');
});
test('wrong job, required level, equal gear and items equipped by another character never create hints',()=>{
 const state=fixture();state.inventory.push(gear('bow','equipment_bow_1','supreme'),gear('later','equipment_sword_20'),gear('equal','equipment_sword_1','common'),gear('friend'));
 state.roster.find(a=>a.character_id==='npc_swordsman')!.equipment.weapon='friend';
 assert.deepEqual(equipmentUpgradeHints(state,'main'),{});
});
test('a lower item level never triggers a hint even at Supreme rarity',()=>{
 const state=fixture(),main=state.roster[0]!;main.level=20;state.inventory.push(gear('current','equipment_sword_20','common'),gear('shiny','equipment_sword_1','supreme'));main.equipment.weapon='current';
 assert.equal(equipmentUpgradeHints(state,'main').weapon,undefined);
});
test('same level compares rarity only, regardless of options or slot investment, without changing the save',()=>{
 const state=fixture(),main=state.roster[0]!;
 const current=state.inventory.find(i=>i.instance_id===main.equipment.weapon)! as Gear;current.options=[{id:'opt_hp',roll:10000}];
 main.slot_progress.weapon.refine=5;main.slot_progress.weapon.enchant={line_id:'offense',level:2};
 state.inventory.push(gear('options_only','equipment_sword_1','common',[{id:'opt_atk',roll:10000}]));
 assert.equal(equipmentUpgradeHints(state,'main').weapon,undefined);
 state.inventory.push(gear('rarity_upgrade','equipment_sword_1','rare'));
 const before=structuredClone(state);assert.equal(equipmentUpgradeHints(state,'main').weapon,'rarity_upgrade');assert.deepEqual(state,before);
});
test('a higher item level outranks rarity and is suggested before lower-level items',()=>{
 const state=fixture(),main=state.roster[0]!;main.level=20;
 state.inventory.find(i=>i.instance_id===main.equipment.weapon)!.rarity_id='supreme';
 state.inventory.push(gear('tier_upgrade','equipment_sword_20','common'),gear('rarer_tier','equipment_sword_20','rare'));
 assert.equal(equipmentUpgradeHints(state,'main').weapon,'rarer_tier');
 main.equipment.weapon='rarer_tier';assert.equal(equipmentUpgradeHints(state,'main').weapon,undefined);
});
test('a full 500-item bag with duplicates stays deterministic and a locked bag item remains wearable',()=>{
 const state=fixture();while(state.inventory.length<499)state.inventory.push(gear('copy_'+state.inventory.length,'equipment_sword_1','common'));
 state.inventory.push({...gear('locked_upgrade'),locked:true});assert.equal(state.inventory.length,500);
 assert.equal(equipmentUpgradeHints(state,'main').weapon,'locked_upgrade');
});
