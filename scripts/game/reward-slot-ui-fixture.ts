// Synthetic disposable loopback account, never production/owner data.
import type { AccountState } from '../../src/contracts/index.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { storyFarmSnapshot, storyStage, storyStages } from '../../src/domain/modes/story.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw Error('ISOLATED_STACK_REQUIRED');
const state=JSON.parse(await new Promise<string>(resolve=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>resolve(s));}))as AccountState;
const loaded=loadValidatedContent();if(!loaded.ok)throw Error('CONTENT');const content=loaded.value;
for(const slot of ['weapon','head','armor','garment','shoes','accessory']as const){const id='qa_main_'+slot;state.inventory.push({instance_id:id,kind:'equipment',definition_id:'equipment_'+(slot==='weapon'?'sword':slot)+'_1',rarity_id:'common',locked:false,training:false,options:[]});state.roster[0]!.equipment[slot]=id;}
state.wallet.gold=200000;state.wallet.refine_ore=1000;state.wallet.enchant_dust=1000;
state.story.cleared_stage_ids=storyStages(content).filter(s=>s.chapter<=2).map(s=>s.id);state.story.selected_farm_stage='1-1';state.farm.rate_snapshot=storyFarmSnapshot(storyStage('1-1',content)!,state,content);state.farm.reserved_through=new Date(Date.now()-3600000).toISOString();
const zero=Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0]))as AccountState['wallet'];
state.pending_rewards=Array.from({length:10},(_,i)=>({claim_id:'qa_daily_'+i,kind:'daily',resource_vector:{...zero,gold:100},items:[],content_version:content.manifest.content_version,reserved_at:new Date().toISOString(),source_keys:['daily:qa:'+i],status:'pending'}));
new AccountCommandRules().validateAccount(state);process.stdout.write(JSON.stringify({state}));
