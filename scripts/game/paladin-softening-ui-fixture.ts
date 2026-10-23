// Fresh local Auth stack fixture; actual shared progression commands, never owner data.
import type {AccountState} from '../../src/contracts/index.ts';
import {applySandboxRoster} from '../../src/client/roster.ts';
import {loadValidatedContent} from '../../src/content/index.ts';
import {AccountCommandRules} from '../../src/domain/account/commands.ts';
import {storyStages} from '../../src/domain/modes/story.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw Error('ISOLATED_STACK_REQUIRED');
let state=JSON.parse(await new Promise<string>(r=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>r(s));}))as AccountState;
const loaded=loadValidatedContent();if(!loaded.ok)throw Error('CONTENT');const content=loaded.value;
for(const m of state.team.filter(m=>m.character_id!=='main'))for(const[type,p]of[
 ['character.level_up',{character_id:m.character_id,target_level:20}],['character.breakthrough',{character_id:m.character_id,gate_level:20}],['character.level_up',{character_id:m.character_id,target_level:40}],['character.breakthrough',{character_id:m.character_id,gate_level:40}],['character.level_up',{character_id:m.character_id,target_level:50}],
]as const)state=applySandboxRoster(state,type,p);
const id='npc_swordsman';state=applySandboxRoster(state,'character.change_job',{character_id:id,job_id:'crusader'});
for(const skill of Object.values(content.skills).filter(s=>s.class_id==='crusader'))state=applySandboxRoster(state,'skill.upgrade',{character_id:id,skill_id:skill.id,target_level:10});
state=applySandboxRoster(state,'skill.set_loadout',{character_id:id,skill_ids:['crusader_holy_cross','crusader_auto_guard','crusader_grand_cross','crusader_defender']});
const stages=storyStages(content);state.story.cleared_stage_ids=stages.slice(0,stages.findIndex(s=>s.id==='6-5')).map(s=>s.id);state.tower.highest_cleared_floor=20;
new AccountCommandRules().validateAccount(state);process.stdout.write(JSON.stringify({state}));
