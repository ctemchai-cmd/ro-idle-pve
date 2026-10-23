// Isolated upstream Auth/Postgres test account only; never used by production.
import { readFileSync } from 'node:fs';
import { referenceAccount, type BuildProfile, type ReferenceTeam } from '../../src/simulation/balance.ts';
import { content } from '../../tests/game/combat-fixtures.ts';
import { storyStages, storyStage, storyFarmSnapshot } from '../../src/domain/modes/story.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { cardRarity } from '../../src/domain/build/card-rarity.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw Error('ISOLATED_REQUIRED');
const choices=[['main','mage','wizard_artillery','back_1'],['npc_swordsman','swordsman','crusader_guardian','front_1'],['npc_acolyte','acolyte','priest_healer','back_2'],['npc_archer','archer','hunter_sniper','front_2']]as const;
const team={id:'expansion_browser_fixture',members:choices.map(([character_id,root,id,position])=>({character_id,root,position,build:(JSON.parse(readFileSync('plan/data/skills/'+root+'.json','utf8')).builds as BuildProfile[]).find(b=>b.id===id)!}))} satisfies ReferenceTeam;
const state=referenceAccount(team,70,content);
for(const item of state.inventory)if(item.kind==='equipment')item.rarity_id='supreme';
for(const member of state.team){
 const actor=state.roster.find(a=>a.character_id===member.character_id)!;
 for(const slot of Object.values(actor.slot_progress)){slot.refine=15;slot.enchant={line_id:'offense',level:10};}
 // Explicit fully invested fixture: three distinct legal copies, not one instance
 // referenced three times. The original uncarded fixture timed out at26% boss HP.
 for(let n=0;n<3;n++){
  const instance_id=`fixture_abysmal_${member.character_id}_${n}`;
  state.inventory.push({kind:'card',instance_id,definition_id:'card_abysmal_knight',rarity_id:cardRarity('card_abysmal_knight',content),level:5,locked:false});
  actor.slot_progress.weapon.cards[n]=instance_id;
 }
}
for(const resource of Object.keys(state.wallet)as(keyof typeof state.wallet)[])state.wallet[resource]=10000000;
state.story.cleared_stage_ids=storyStages(content).filter(s=>s.chapter<=9).slice(0,-1).map(s=>s.id);state.story.selected_farm_stage='9-1';
state.farm.rate_snapshot=storyFarmSnapshot(storyStage('9-1',content)!,state,content);state.farm.reserved_through=new Date().toISOString();
new AccountCommandRules().validateAccount(state);process.stdout.write(JSON.stringify(state));
