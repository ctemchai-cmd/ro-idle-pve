import test from 'node:test';
import assert from 'node:assert/strict';
import { equippedCardSlots } from '../../src/client/slots.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { applyEquipmentCommand } from '../../src/domain/progression/equipment.ts';
import { content } from './combat-fixtures.ts';
import { equipStarterSet } from './gear-fixtures.ts';

const fixture=()=>equipStarterSet(initializeAccount(content,{root_job_id:'swordsman',gender:'male'},'2026-10-22T00:00:00Z','2026-10-22',1));
test('gear card frames use only unlocked sockets, show empty slots and preserve state',()=>{
 const state=fixture(),main=state.roster[0]!;
 for(const [refine,count] of [[0,1],[4,1],[5,2],[9,2],[10,3]]){main.slot_progress.weapon.refine=refine!;const before=JSON.stringify(state),sockets=equippedCardSlots(state,'main','weapon');assert.equal(sockets.length,count);assert.ok(sockets.every(s=>s.quality===null));assert.equal(JSON.stringify(state),before);}
 assert.deepEqual(equippedCardSlots(state,'missing','weapon'),[]);main.equipment.weapon=null;assert.deepEqual(equippedCardSlots(state,'main','weapon'),[]);
});
test('frames disclose Bronze/Silver/Gold from actual card instances, separately from monster grade',()=>{
 const state=fixture(),main=state.roster[0]!;
 for(const [i,quality] of ['bronze','silver','gold'].entries())state.inventory.push({instance_id:'card_'+i,kind:'card',definition_id:'card_weapon_1',level:1,rarity_id:quality as 'bronze'|'silver'|'gold',locked:false});
 main.slot_progress.weapon.refine=10;main.slot_progress.weapon.cards=['card_0','card_1','card_2'];
 const sockets=equippedCardSlots(state,'main','weapon');assert.deepEqual(sockets.map(s=>s.quality),['bronze','silver','gold']);assert.ok(sockets.every(s=>s.name==='การ์ดวูล์ฟ'));assert.deepEqual(equippedCardSlots(state,'npc_swordsman','weapon').map(s=>s.quality),[null]);
});
test('moving equipment leaves cards with each character slot; unowned gear has no attached cards',()=>{
 const state=fixture(),main=state.roster[0]!,npc=state.roster.find(a=>a.character_id==='npc_swordsman')!;
 state.inventory.push({instance_id:'bronze',kind:'card',definition_id:'card_weapon_1',level:1,rarity_id:'bronze',locked:false},{instance_id:'gold',kind:'card',definition_id:'card_weapon_1',level:1,rarity_id:'gold',locked:false});
 main.slot_progress.weapon.cards[0]='bronze';npc.slot_progress.weapon.cards[0]='gold';
 const item=main.equipment.weapon!;applyEquipmentCommand(state,{type:'equipment.equip',params:{character_id:npc.character_id,slot:'weapon',item_instance_id:item}} as never,content);
 assert.deepEqual(equippedCardSlots(state,'main','weapon'),[]);assert.equal(equippedCardSlots(state,npc.character_id,'weapon')[0]!.quality,'gold');assert.equal(main.slot_progress.weapon.cards[0],'bronze');
 applyEquipmentCommand(state,{type:'equipment.equip',params:{character_id:main.character_id,slot:'weapon',item_instance_id:item}} as never,content);assert.equal(equippedCardSlots(state,'main','weapon')[0]!.quality,'bronze');assert.deepEqual(equippedCardSlots(state,npc.character_id,'weapon'),[]);
});
