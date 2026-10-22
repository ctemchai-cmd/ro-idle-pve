// Disposable loopback save only: exercise the real signed migration before viewing the new UI.
import type { AccountState } from '../../src/contracts/index.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { cardOrigins } from '../../src/content/card-catalog.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { storyFarmSnapshot, storyStage, storyStages } from '../../src/domain/modes/story.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw new Error('ISOLATED_STACK_REQUIRED');
const state=JSON.parse(await new Promise<string>(resolve=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>resolve(s));}))as AccountState;
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT');const content=loaded.value,origins=cardOrigins(content);
for(const slot of ['weapon','head','armor','garment','shoes','accessory']as const){const id='qa_main_'+slot;state.inventory.push({instance_id:id,kind:'equipment',definition_id:'equipment_'+(slot==='weapon'?'sword':slot)+'_1',rarity_id:'common',locked:slot==='weapon',training:false,options:[]});state.roster[0]!.equipment[slot]=id;}
let i=0;for(const id of Object.keys(origins))state.inventory.push({instance_id:'qa_'+id,definition_id:id,kind:'card',rarity_id:(['bronze','silver','gold']as const)[i++%3]!,level:1,locked:id==='card_armor_1'});
for(let n=0;n<85;n++)state.inventory.push({instance_id:'qa_free_'+n,definition_id:'card_hydra',kind:'card',rarity_id:'gold',level:1,locked:false});
const main=state.roster[0]!;main.slot_progress.weapon.refine=10;main.slot_progress.weapon.enchant={line_id:'offense',level:7};main.slot_progress.weapon.cards=['qa_card_weapon_1','qa_card_hydra','qa_card_baphomet'];main.slot_progress.head.refine=5;main.slot_progress.head.enchant={line_id:'vitality',level:3};
state.inventory.push({instance_id:'qa_npc_weapon',kind:'equipment',definition_id:'equipment_sword_1',rarity_id:'rare',locked:false,training:false,options:[]},{instance_id:'qa_free_weapon',kind:'equipment',definition_id:'equipment_sword_1_b',rarity_id:'rare',locked:false,training:false,options:[]});
const npc=state.roster.find(a=>a.character_id==='npc_swordsman')!;npc.equipment.weapon='qa_npc_weapon';npc.slot_progress.weapon.refine=5;npc.slot_progress.weapon.enchant={line_id:'offense',level:4};npc.slot_progress.weapon.cards[0]='qa_card_abysmal_knight';
state.wallet.gold=1000000;state.wallet.card_dust=10000;state.wallet.crystal=20000;state.gacha.card_v1={gold_misses:29,bronze_streak:9};
state.story.cleared_stage_ids=storyStages(content).map(s=>s.id);state.story.selected_farm_stage='1-1';state.farm.rate_snapshot=storyFarmSnapshot(storyStage('1-1',content)!,state,content);
const profile=state.farm.rate_snapshot.card_drops!;delete profile.definition_rarities;profile.quality_weights={bronze:850000,silver:140000,gold:10000};profile.version='card_farm_v2';profile.chance_per_million=200000;state.farm.reserved_through=new Date(Date.now()-12*3600000).toISOString();
process.stdout.write(JSON.stringify({state,expected:migrateAccountState(state,content).state,rarities:Object.fromEntries(Object.entries(origins).map(([id,o])=>[id,o.rarity_id]))}));
