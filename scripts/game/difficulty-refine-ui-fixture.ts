// Disposable test stack only. A funded+14/200miss fixture guarantees one real
// +15 command; low-base chances are separately inspected on read-only clones.
import type { AccountState } from '../../src/contracts/index.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw Error('ISOLATED_STACK_REQUIRED');
const input=await new Promise<string>(r=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>r(s));});let state=JSON.parse(input)as AccountState;
const loaded=loadValidatedContent();if(!loaded.ok)throw Error('CONTENT');const content=loaded.value,main=state.roster[0]!;
main.slot_progress.weapon.refine=14;main.slot_progress.weapon.refine_failures=200;
for(let index=0;index<3;index++){const id='refine_card_'+index;state.inventory.push({instance_id:id,kind:'card',definition_id:'card_weapon_1',rarity_id:'common',level:1,locked:false});main.slot_progress.weapon.cards[index]=index<2?id:null;}
for(const member of state.team.filter(m=>m.character_id!=='main'))for(const[type,params]of[
 ['character.level_up',{character_id:member.character_id,target_level:20}],['character.breakthrough',{character_id:member.character_id,gate_level:20}],['character.level_up',{character_id:member.character_id,target_level:40}],['character.breakthrough',{character_id:member.character_id,gate_level:40}],['character.level_up',{character_id:member.character_id,target_level:50}],
]as const)state=applySandboxRoster(state,type,params);
const stages=storyStages(content),frontier=stages.findIndex(s=>s.id==='6-5');state.story.cleared_stage_ids=stages.slice(0,frontier).map(s=>s.id);state.tower.highest_cleared_floor=20;
new AccountCommandRules().validateAccount(state);process.stdout.write(JSON.stringify({state}));
