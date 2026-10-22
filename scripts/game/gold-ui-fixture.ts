// Disposable stack only: install a canonical chapter1 profile for old-rate migration/claim proof.
import type { AccountState } from '../../src/contracts/index.ts';
import { storyFarmSnapshot, storyStage } from '../../src/domain/modes/story.ts';
import { content } from '../../tests/game/combat-fixtures.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw Error('ISOLATED_LOOPBACK_REQUIRED');
const state=JSON.parse(await new Promise<string>(resolve=>{let input='';process.stdin.on('data',chunk=>input+=chunk);process.stdin.on('end',()=>resolve(input));})) as AccountState;
state.story.selected_farm_stage='1-1';state.farm.rate_snapshot=storyFarmSnapshot(storyStage('1-1',content)!,state,content);
process.stdout.write(JSON.stringify(state));
