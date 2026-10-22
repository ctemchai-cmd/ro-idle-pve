// Disposable synthetic account only; use real shared progression rules.
import type { AccountState } from '../../src/contracts/index.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { cardOrigins } from '../../src/content/card-catalog.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw Error('ISOLATED_STACK_REQUIRED');
let state=JSON.parse(await new Promise<string>(r=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>r(s));}))as AccountState;
const loaded=loadValidatedContent();if(!loaded.ok)throw Error('CONTENT');const content=loaded.value;
for(const key of Object.keys(state.wallet)as(keyof AccountState['wallet'])[])state.wallet[key]=10000000;
for(const[type,params]of [
 ['character.level_up',{character_id:'main',target_level:20}],['character.change_job',{character_id:'main',job_id:'monk'}],
 ['character.breakthrough',{character_id:'main',gate_level:20}],['character.level_up',{character_id:'main',target_level:40}],
 ['character.breakthrough',{character_id:'main',gate_level:40}],['character.level_up',{character_id:'main',target_level:50}],
 ['skill.upgrade',{character_id:'main',skill_id:'monk_asura',target_level:10}],['skill.upgrade',{character_id:'main',skill_id:'acolyte_blessing',target_level:10}],
]as const)state=applySandboxRoster(state,type,params);
for(const slot of ['weapon','head','armor','garment','shoes','accessory']as const){const id='qa_main_'+slot;state.inventory.push({instance_id:id,kind:'equipment',definition_id:'equipment_'+(slot==='weapon'?'knuckle':slot)+'_1',rarity_id:'common',locked:false,training:false,options:[]});state.roster[0]!.equipment[slot]=id;}
const origins=cardOrigins(content);for(const id of['card_weapon_1','card_angeling','card_baphomet'])state.inventory.push({instance_id:'qa_'+id,kind:'card',definition_id:id,rarity_id:origins[id]!.rarity_id,level:1,locked:false});
state.battle_supplies={stock:{fire_scroll:1,water_scroll:1,earth_scroll:1,wind_scroll:1},queued:{}};
new AccountCommandRules().validateAccount(state);process.stdout.write(JSON.stringify({state}));
