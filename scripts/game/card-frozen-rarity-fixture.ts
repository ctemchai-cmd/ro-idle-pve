// A disposable prior-v3 rate profile, not a player save or a granted production reward.
import type { AccountState } from '../../src/contracts/index.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { storyFarmSnapshot, storyStage } from '../../src/domain/modes/story.ts';
import { cardOrigins } from '../../src/content/card-catalog.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw Error('ISOLATED_STACK_REQUIRED');
const state=JSON.parse(await new Promise<string>(resolve=>{let input='';process.stdin.on('data',c=>input+=c);process.stdin.on('end',()=>resolve(input));})) as AccountState;
const loaded=loadValidatedContent();if(!loaded.ok)throw Error('CONTENT');const content=loaded.value,origins=cardOrigins(content);
state.story.selected_farm_stage='8-20';state.farm.rate_snapshot=storyFarmSnapshot(storyStage('8-20',content)!,state,content);state.farm.reserved_through=new Date(Date.now()-12*3600000).toISOString();
const profile=state.farm.rate_snapshot.card_drops!;const pool=profile.definition_pool.filter(id=>!origins[id]!.variant);if(!pool.length)throw Error('EMPTY_PRIOR_CARD_POOL');profile.definition_pool=[pool[0]!,...pool.slice(1)];profile.definition_weights=Object.fromEntries(profile.definition_pool.map(id=>[id,profile.definition_weights[id]!]));profile.definition_rarities=Object.fromEntries(profile.definition_pool.map(id=>[id,profile.definition_rarities![id]!]));
for(const id of ['card_angeling','card_deviling']){profile.definition_rarities[id]='epic';profile.definition_weights[id]=id==='card_angeling'?9000:20000;}
process.stdout.write(JSON.stringify({state,expected:migrateAccountState(state,content).state}));
