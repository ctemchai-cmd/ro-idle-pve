// Disposable loopback only; not a production account migration.
import type { AccountState } from '../../src/contracts/index.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { storyFarmSnapshot, storyStage, storyStages } from '../../src/domain/modes/story.ts';
import { equipStarterSet } from '../../tests/game/gear-fixtures.ts';
import { content } from '../../tests/game/combat-fixtures.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw Error('ISOLATED_REQUIRED');
let state=JSON.parse(await new Promise<string>(resolve=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>resolve(s));})) as AccountState;
for(const key of Object.keys(state.wallet) as (keyof AccountState['wallet'])[])state.wallet[key]=1e6;
state=applySandboxRoster(state,'character.level_up',{character_id:'main',target_level:10});state=equipStarterSet(state);
state.inventory.push({kind:'equipment',instance_id:'better_staff',definition_id:'equipment_staff_1',rarity_id:'legendary',locked:false,training:false,options:[]});
state.story.cleared_stage_ids=storyStages(content).slice(0,31).map(s=>s.id);state.story.selected_farm_stage='2-1';
state.farm.rate_snapshot=storyFarmSnapshot(storyStage('2-1',content)!,state,content);state.farm.reserved_through=new Date(Date.now()-43200000).toISOString();state.farm.loot_rng={state:17,draw_count:0};
state.pending_rewards.push({claim_id:'old20',kind:'farm',items:[{kind:'equipment',instance_id:'earned20',definition_id:'equipment_staff_20',rarity_id:'rare',locked:false,training:false,options:[]}],resource_vector:Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0])) as AccountState['wallet'],content_version:content.manifest.content_version,reserved_at:new Date().toISOString(),source_keys:['legacy_fixture'],status:'pending'});
process.stdout.write(JSON.stringify(state));
