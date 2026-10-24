// Disposable loopback legacy fixture, never reads or writes owner data.
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { progressionData } from '../../src/domain/progression/characters.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import type { AccountState } from '../../src/contracts/index.ts';
import prices from '../../src/domain/progression/legacy-skill-prices.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw Error('ISOLATED_REQUIRED');
const loaded=loadValidatedContent();if(!loaded.ok)throw Error('CONTENT_REQUIRED');const content=loaded.value,at=new Date().toISOString();
const state=initializeAccount(content,{root_job_id:'swordsman',gender:'male'},at,new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok'}).format(new Date()),17);
const main=state.roster[0]!,priest=state.roster.find(a=>a.character_id==='npc_acolyte')!;
for(const[a,level,job]of[[main,40,'knight'],[priest,70,'high_priest']]as const){a.level=level;a.job_id=job;a.completed_gate_ids=([20,40,60,80]as const).filter(l=>l<level);a.local_cap=level===40?40:80;a.unspent_status_points=progressionData(content).progression.level_rows.find(r=>r.level===level)!.total_status_points;}
Object.assign(state.wallet,{gold:1000000,skill_manual:10000,awakening_shard:10000});
const zero=()=>Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0]))as AccountState['wallet'];
function paid(a:typeof main,id:string,rank:number,aw=false){
 a.skill_levels[id]=rank;if(aw)a.awakened_skills.push(id);
 const table=aw?prices.awakened:prices.base,vector={...zero(),...(aw?prices.awaken_unlock:{})};
 for(const r of table.upgrade_cost_rows)if(r.to_level<=rank)for(const[k,n]of Object.entries(r))if(k in vector)vector[k as keyof typeof vector]+=n;
 const version=aw?'awakening-costs-v1':prices.roots[a.root_job_id].cost_version;
 state.paid_ledger.push({entry_id:'paid_'+a.character_id+'_'+id+'_'+aw,character_id:a.character_id,feature_id:aw?'skill_awaken':'skill',skill_id:id,quantity:rank,cost_version:version,cost_versions:[version],paid_resources:vector,refund_state:'active',refund_command_id:null});
}
paid(main,'knight_counter_stance',7);paid(main,'knight_brandish',7);paid(main,'knight_pierce',3);main.active_slots=['knight_counter_stance','knight_brandish','knight_pierce',null];
paid(priest,'priest_kyrie',10);paid(priest,'priest_kyrie',10,true);
const expected=migrateAccountState(state,content).state;new AccountCommandRules(content).validateAccount(expected);
process.stdout.write(JSON.stringify({legacy:state,expected}));
