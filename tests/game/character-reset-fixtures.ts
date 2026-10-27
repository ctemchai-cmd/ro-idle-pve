import{dailyData,dailyRecord,dailyPhaseStats}from'../../src/domain/modes/daily.ts';
import{storyStages,storyFarmSnapshot,storyStage}from'../../src/domain/modes/story.ts';
import type{AccountState,Command}from'../../src/contracts/index.ts';
import{content}from'./combat-fixtures.ts';
import{initializeAccount}from'../../src/domain/progression/initialize.ts';
import{applyRosterCommand,type RosterCommand}from'../../src/domain/progression/characters.ts';
import{applySkillCommand,type SkillCommand}from'../../src/domain/progression/skills.ts';
import{applySlotCommand,type SlotCommand}from'../../src/domain/progression/slots.ts';
import{compactPaidLedger}from'../../src/domain/progression/ledger.ts';
import{AccountCommandRules}from'../../src/domain/account/commands.ts';
import{cardRarity}from'../../src/domain/build/card-rarity.ts';
const rules=new AccountCommandRules(content);
/** Actual pure purchase reducers, never a free level/rank mutation. Browser-safe fixture. */
export function characterResetFixture(job='lord_knight',npc=false){
 const j=content.jobs.byId[job]!,state=initializeAccount(content,{root_job_id:j.root as AccountState['roster'][number]['root_job_id'],gender:j.ancestors.includes('dancer')?'female':'male'},'2026-10-27T00:00:00Z','2026-10-27',171);
 for(const key of Object.keys(state.wallet)as(keyof typeof state.wallet)[])state.wallet[key]=1000000000;
 state.story.cleared_stage_ids=storyStages(content).slice(0,10).map(s=>s.id);state.story.selected_farm_stage='1-10';state.farm.rate_snapshot=storyFarmSnapshot(storyStage('1-10',content)!,state,content);
 const boss=dailyData(content).bosses[0]!,daily=dailyRecord(state,boss.id,'2026-10-27',content);daily.attempts_used=1;daily.phase=2;daily.current_hp=Math.floor(dailyPhaseStats(boss,2,daily.chapter_snapshot).hp/2);daily.rewarded_phases=[1];state.daily_records=[daily];state.daily_objectives.farm_claimed=true;state.shop.purchases.essence_pack=3;state.tower.highest_cleared_floor=21;
 const startingWallet={...state.wallet},actor=state.roster.find(a=>a.character_id===(npc?'npc_'+j.root:'main'))!;let serial=0;
 const command=(type:Command['type'],params:unknown)=>({type,params,request_id:`17100000-0000-4000-8000-${String(++serial).padStart(12,'0')}`,expected_revision:1,schema_version:1,...rules.versions})as Command;
 function perform(type:Command['type'],params:unknown){const c=command(type,params);rules.parse(c);if(type.startsWith('character.'))applyRosterCommand(state,c as RosterCommand,content);else if(type.startsWith('skill.'))applySkillCommand(state,c as SkillCommand,content);else applySlotCommand(state,c as SlotCommand,content,0);state.paid_ledger=compactPaidLedger(state.paid_ledger);}
 const id=actor.character_id,level=(n:number)=>perform('character.level_up',{character_id:id,target_level:n}),gate=(n:number)=>perform('character.breakthrough',{character_id:id,gate_level:n});
 level(20);const parent=j.ancestors.find(p=>content.jobs.byId[p]!.stage===2)!;perform('character.change_job',{character_id:id,job_id:parent});gate(20);level(40);gate(40);level(60);gate(60);level(70);perform('character.change_job',{character_id:id,job_id:job});level(80);gate(80);level(100);
 const first=Object.values(content.skills).find(s=>s.class_id===j.root&&s.kind==='active'&&Number(s.unlock_level)<=1)!;
 perform('skill.upgrade',{character_id:id,skill_id:first.id,target_level:10});perform('skill.awaken',{character_id:id,skill_id:first.id});perform('skill.upgrade',{character_id:id,skill_id:first.id,target_level:3});
 perform('character.allocate_status',{character_id:id,allocation:{...actor.primary_stats,str:10,vit:12,int:10,dex:10}});
 const compatibility=content.documents['equipment.json']!.weapon_compatibility as Record<string,string>,shoe=Object.values(content.items).find(i=>i.kind==='equipment'&&i.slot==='shoes'&&i.tier_level===1)!;
 state.inventory.push({instance_id:'reset_high',definition_id:`equipment_${compatibility[job]}_100`,kind:'equipment',rarity_id:'common',locked:true,training:false,options:[]},{instance_id:'reset_shoes',definition_id:String(shoe.id),kind:'equipment',rarity_id:'common',locked:false,training:false,options:[]},{instance_id:'reset_card',definition_id:'card_andre',kind:'card',rarity_id:cardRarity('card_andre',content),level:1,locked:false});
 actor.equipment.weapon='reset_high';actor.equipment.shoes='reset_shoes';actor.slot_progress.weapon.refine=5;actor.slot_progress.weapon.cards[0]='reset_card';
 const lines=content.documents['slot-progress.json']!.enchant as unknown as{slot_lines:Record<string,Record<string,unknown>>},line=Object.keys(lines.slot_lines.weapon!)[0]!;perform('slot.enchant',{character_id:id,slot:'weapon',line_id:line,target_level:3});
 rules.validateAccount(state);return{state,actor,startingWallet,command,perform};
}
