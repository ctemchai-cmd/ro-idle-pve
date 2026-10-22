// Isolated local test user only. No owner save or gameplay rule changes.
import type { AccountState } from '../../src/contracts/index.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw new Error('ISOLATED_STACK_REQUIRED');
let state=JSON.parse(await new Promise<string>(resolve=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>resolve(s));}))as AccountState;
for(const key of Object.keys(state.wallet)as(keyof AccountState['wallet'])[])state.wallet[key]=100000000;
for(const[character_id,job_id]of [['main','monk'],['npc_swordsman','knight'],['npc_mage','sage'],['npc_thief','assassin']]){
 for(const[type,params]of [
  ['character.level_up',{character_id,target_level:20}],['character.change_job',{character_id,job_id}],['character.breakthrough',{character_id,gate_level:20}],['character.level_up',{character_id,target_level:40}],
 ]as const)state=applySandboxRoster(state,type,params);
}
for(const[character_id,skill_id]of [['main','monk_call_spirits'],['main','monk_asura'],['npc_mage','sage_fire_endow'],['npc_thief','assassin_enchant_poison']])state=applySandboxRoster(state,'skill.upgrade',{character_id,skill_id,target_level:1});
for(const id of ['card_weapon_1','card_angeling','card_baphomet'])state.inventory.push({instance_id:'qa_'+id,definition_id:id,kind:'card',rarity_id:'gold',level:5,locked:id==='card_angeling'});
state.inventory.push({instance_id:'qa_knuckle',definition_id:'equipment_knuckle_40',kind:'equipment',rarity_id:'rare',locked:false,training:false,options:[]});
state.roster.find(a=>a.character_id==='main')!.equipment.weapon='qa_knuckle';
state.roster.find(a=>a.character_id==='main')!.slot_progress.weapon.cards[0]='qa_card_weapon_1';
process.stdout.write(JSON.stringify(state));
