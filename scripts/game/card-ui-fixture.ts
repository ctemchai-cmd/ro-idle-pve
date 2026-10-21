// Disposable local test user only. Grant fixtures, not an owner-save migration.
import type { AccountState } from '../../src/contracts/index.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { storyFarmSnapshot, storyStage, storyStages } from '../../src/domain/modes/story.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw new Error('ISOLATED_STACK_REQUIRED');
let state=JSON.parse(await new Promise<string>(resolve=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>resolve(s));}))as AccountState;
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT');const content=loaded.value;
for(const key of Object.keys(state.wallet)as(keyof AccountState['wallet'])[])state.wallet[key]=100000000;
for(const[character_id,job_id]of [['main','knight'],['npc_mage','wizard']])for(const[type,params]of [
 ['character.level_up',{character_id,target_level:20}],['character.change_job',{character_id,job_id}],['character.breakthrough',{character_id,gate_level:20}],['character.level_up',{character_id,target_level:40}],
]as const)state=applySandboxRoster(state,type,params);
for(const[family,tier,rarity]of [['sword',40,'supreme'],['sword',60,'rare'],['staff',40,'rare'],['staff',60,'epic'],['bow',40,'immortal'],['armor',20,'legendary']]as const){const n={rare:1,epic:2,legendary:3,immortal:4,supreme:5}[rarity];state.inventory.push({instance_id:`qa_${family}_${tier}`,definition_id:`equipment_${family}_${tier}`,kind:'equipment',rarity_id:rarity,locked:false,training:false,options:['opt_atk','opt_matk','opt_hp','opt_crit','opt_def'].slice(0,n).map((id,i)=>({id,roll:i*200})) as Extract<AccountState['inventory'][number],{kind:'equipment'}>['options']});}
for(const id of ['card_armor_1','card_angeling','card_baphomet'])state.inventory.push({instance_id:'qa_'+id,definition_id:id,kind:'card',rarity_id:'gold',level:5,locked:false});
state.story.cleared_stage_ids=storyStages(content).map(s=>s.id);state.story.selected_farm_stage='8-20';state.farm.rate_snapshot=storyFarmSnapshot(storyStage('8-20',content)!,state,content);state.farm.reserved_through=new Date(Date.now()-12*3600000).toISOString();
process.stdout.write(JSON.stringify(state));
