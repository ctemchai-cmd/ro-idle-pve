// Disposable local test account only. Synthetic equipment/cards; never an owner save.
import type { AccountState } from '../../src/contracts/index.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { storyFarmSnapshot, storyStage, storyStages } from '../../src/domain/modes/story.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw new Error('ISOLATED_STACK_REQUIRED');
const state=JSON.parse(await new Promise<string>(resolve=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>resolve(s));}))as AccountState;
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT');const content=loaded.value;
for(const slot of ['weapon','head','armor','garment','shoes','accessory']as const){const id='qa_main_'+slot;state.inventory.push({instance_id:id,kind:'equipment',definition_id:'equipment_'+(slot==='weapon'?'sword':slot)+'_1',rarity_id:'common',locked:false,training:false,options:[]});state.roster[0]!.equipment[slot]=id;}
for(const[id,definition_id,rarity_id]of [['qa_bronze','card_weapon_1','bronze'],['qa_silver','card_hydra','silver'],['qa_gold','card_baphomet','gold'],['qa_npc_gold','card_weapon_1','gold'],['qa_mini','card_angeling','gold']]as const)state.inventory.push({instance_id:id,definition_id,rarity_id,kind:'card',level:1,locked:id==='qa_mini'});
state.roster[0]!.slot_progress.weapon.refine=10;state.roster[0]!.slot_progress.weapon.cards=['qa_bronze','qa_silver','qa_gold'];state.roster[0]!.slot_progress.head.refine=5;
state.inventory.push({instance_id:'qa_npc_weapon',kind:'equipment',definition_id:'equipment_sword_1',rarity_id:'common',locked:false,training:false,options:[]},{instance_id:'qa_free_weapon',kind:'equipment',definition_id:'equipment_sword_1_b',rarity_id:'common',locked:false,training:false,options:[]});
const npc=state.roster.find(a=>a.character_id==='npc_swordsman')!;npc.equipment.weapon='qa_npc_weapon';npc.slot_progress.weapon.cards[0]='qa_npc_gold';
state.story.cleared_stage_ids=storyStages(content).map(s=>s.id);state.story.selected_farm_stage='1-1';state.farm.rate_snapshot=storyFarmSnapshot(storyStage('1-1',content)!,state,content);state.farm.rate_snapshot.card_drops!.version='card_farm_v1';state.farm.rate_snapshot.card_drops!.chance_per_million=200000;state.farm.reserved_through=new Date(Date.now()-12*3600000).toISOString();
new AccountCommandRules().validateAccount(state);
process.stdout.write(JSON.stringify({state,card_count:5}));
