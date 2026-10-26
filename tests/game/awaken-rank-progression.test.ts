import test from 'node:test';import assert from 'node:assert/strict';
import type {AccountState,SkillDefinition} from '../../src/contracts/index.ts';
import {content} from './combat-fixtures.ts';import {initializeAccount} from '../../src/domain/progression/initialize.ts';
import {skillRankUnlockLevels,characterSkillCap,skillQuote} from '../../src/domain/progression/skills.ts';
import {migrateAccountState} from '../../src/domain/account/migrate.ts';import {AccountCommandRules} from '../../src/domain/account/commands.ts';
import prices from '../../src/domain/progression/legacy-skill-prices.ts';
import {progressionData} from '../../src/domain/progression/characters.ts';
const rules=new AccountCommandRules(content),at='2026-10-27T00:00:00Z';
function fixture(job:string,level:number){const j=content.jobs.byId[job]!,s=initializeAccount(content,{root_job_id:j.root as AccountState['roster'][number]['root_job_id'],gender:j.ancestors.includes('dancer')?'female':'male'},at,'2026-10-27',1),a=s.roster[0]!;a.level=level;a.job_id=job as typeof a.job_id;a.local_cap=level>80?100:80;a.completed_gate_ids=level>80?[20,40,60,80]:[20,40,60];a.unspent_status_points=progressionData(content).progression.level_rows.find(r=>r.level===level)!.total_status_points;return{s,a};}
function paid(s:AccountState,a:AccountState['roster'][number],id:string,rank:number){a.skill_levels[id]=rank;a.awakened_skills.push(id);const v=Object.fromEntries(Object.keys(s.wallet).map(k=>[k,0]))as typeof s.wallet;Object.assign(v,prices.awaken_unlock);for(const row of prices.awakened.upgrade_cost_rows)if(row.to_level<=rank)for(const key of Object.keys(v)as(keyof typeof v)[])v[key]+=(row as Partial<typeof v>)[key]??0;s.paid_ledger.push({entry_id:'paid_'+id,character_id:a.character_id,feature_id:'skill_awaken',skill_id:id,quantity:rank,cost_version:prices.awakened.cost_version,cost_versions:[prices.awakened.cost_version],paid_resources:v,refund_state:'active',refund_command_id:null});}

test('D190 all152 Awaken skills grow rank-by-rank, earlier rows finish first and normal schedules stay unchanged',()=>{
 const players=Object.values(content.skills).filter(s=>s.class_id!=='enemy')as unknown as SkillDefinition[];assert.equal(players.length,152);
 for(const d of players){const base=skillRankUnlockLevels(d),aw=skillRankUnlockLevels(d,true),unlock=d.unlock_level,end=unlock>=80?100:unlock>=70?98:unlock>=40?95:unlock>=30?90:unlock>=20?85:80;
 assert.equal(aw[0],Math.max(70,base.at(-1)!));assert.equal(aw.at(-1),end);assert.equal(new Set(aw).size,10);assert(aw.every((n,i)=>!i||n>aw[i-1]!));
 if(d.rank_unlock_levels)assert.deepEqual(base,d.rank_unlock_levels);
 }
 const {a}=fixture('champion',70);a.awakened_skills=['acolyte_heal','monk_call_spirits','monk_finger_offensive','monk_steel_body'];
 for(const[id,end]of [['acolyte_heal',80],['monk_call_spirits',85],['monk_finger_offensive',90],['monk_steel_body',95]]as const){const d=content.skills[id]as unknown as SkillDefinition;a.skill_levels[id]=1;a.level=70;assert.equal(characterSkillCap(a,d),1);assert.throws(()=>skillQuote(a,id,10,content),/SKILL_CAP_REACHED/);a.level=end-1;assert.equal(characterSkillCap(a,d),9);a.level=end;assert.equal(characterSkillCap(a,d),10);}
});
test('D190 old paid Awaken upgrades refund only excess gold/shards for Class1/Class2/High; retain unlock, flags, loadout and exact remaining ledger',()=>{
 const cases:[string,string,number][]= [['champion','acolyte_heal',70],['champion','monk_finger_offensive',75],['champion','champion_chain_crush_combo',90],['sniper','sniper_sharpshooting',90]];
 for(const job of content.jobs.order.filter(id=>content.jobs.byId[id]!.stage===3)){const row=content.jobs.byId[job]!;for(const [stage,level]of[[1,70],[2,85],[3,90]]as const){const definition=Object.values(content.skills).find(d=>row.ancestors.includes(String(d.class_id))&&content.jobs.byId[String(d.class_id)]?.stage===stage);assert(definition,job+'/'+stage);cases.push([job,String(definition.id),level]);}}
 for(const[job,id,level]of cases){
  const {s,a}=fixture(job,level);assert(content.skills[id],id);paid(s,a,id,10);a.active_slots=[id,null,null,null];const old=structuredClone(s),cap=characterSkillCap(a,content.skills[id]as unknown as SkillDefinition),expected={gold:0,awakening_shard:0};for(const r of prices.awakened.upgrade_cost_rows)if(r.to_level>cap){expected.gold+=r.gold;expected.awakening_shard+=r.awakening_shard;}
  const next=migrateAccountState(s,content).state;assert.equal(next.roster[0]!.skill_levels[id],cap);assert.deepEqual(next.roster[0]!.awakened_skills,[id]);assert.deepEqual(next.roster[0]!.active_slots,a.active_slots);assert.equal(next.wallet.gold-old.wallet.gold,expected.gold);assert.equal(next.wallet.awakening_shard-old.wallet.awakening_shard,expected.awakening_shard);
  const ledger=next.paid_ledger.find(r=>r.skill_id===id)!;assert.equal(ledger.paid_resources.awakening_shard,old.paid_ledger[0]!.paid_resources.awakening_shard-expected.awakening_shard);assert(ledger.paid_resources.awakening_shard>=prices.awaken_unlock.awakening_shard);assert.deepEqual(s,old);assert.deepEqual(migrateAccountState(next,content).state,next);assert.doesNotThrow(()=>rules.validateAccount(next));
 }
});
test('D190 unknown paid versions, mismatched amounts and refund overflow abort the full migration without modifying source',()=>{
 for(const mutate of[(s:AccountState)=>{s.paid_ledger[0]!.cost_version='unknown';},(s:AccountState)=>{s.paid_ledger[0]!.paid_resources.gold++;},(s:AccountState)=>{s.wallet.awakening_shard=Number.MAX_SAFE_INTEGER;}]){const{s,a}=fixture('champion',70);paid(s,a,'monk_finger_offensive',10);mutate(s);const old=structuredClone(s);assert.throws(()=>migrateAccountState(s,content),/HISTORY|OVERFLOW/);assert.deepEqual(s,old);}
});
