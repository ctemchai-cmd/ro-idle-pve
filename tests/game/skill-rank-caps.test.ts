import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, SkillDefinition } from '../../src/contracts/index.ts';
import type { ValidatedContent } from '../../src/content/model.ts';
import { content } from './combat-fixtures.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { progressionData, applyRosterCommand } from '../../src/domain/progression/characters.ts';
import { characterSkillCap, skillRankUnlockLevels, skillQuote, skillAwakenQuote } from '../../src/domain/progression/skills.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { compactPaidLedger } from '../../src/domain/progression/ledger.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import before136 from './fixtures/skill-rank-before-136.json';
import prices from '../../src/domain/progression/legacy-skill-prices.ts';
const at='2026-10-24T00:00:00.000Z',rules=new AccountCommandRules(content);
const zero=()=>Object.fromEntries(Object.keys(initializeAccount(content,{root_job_id:'swordsman',gender:'male'},at,'2026-10-24',1).wallet).map(k=>[k,0]))as AccountState['wallet'];
function fixture(level=40,job='knight'){
 const state=initializeAccount(content,{root_job_id:'swordsman',gender:'male'},at,'2026-10-24',1),a=state.roster[0]!;
 a.level=level;a.job_id=job as typeof a.job_id;a.completed_gate_ids=([20,40,60,80]as const).filter(l=>l<level);a.local_cap=level>80?100:level>60?80:level>40?60:level>20?40:20;
 a.unspent_status_points=progressionData(content).progression.level_rows.find(r=>r.level===level)!.total_status_points;
 state.wallet={...zero(),gold:1000000,skill_manual:10000,awakening_shard:10000};return{state,a};
}
function paid(state:AccountState,a:AccountState['roster'][number],id:string,level:number,awakened=false){
 a.skill_levels[id]=level;if(awakened)a.awakened_skills.push(id);
 const table=awakened?prices.awakened:prices.base,vector={...zero(),...(awakened?prices.awaken_unlock:{})};
 for(const r of table.upgrade_cost_rows)if(r.to_level<=level)for(const [k,n]of Object.entries(r))if(k in vector)vector[k as keyof typeof vector]+=n;
 const version=awakened?'awakening-costs-v1':prices.roots[a.root_job_id].cost_version;
 state.paid_ledger.push({entry_id:'paid_'+a.character_id+'_'+id+'_'+awakened,character_id:a.character_id,feature_id:awakened?'skill_awaken':'skill',skill_id:id,quantity:level,cost_version:version,cost_versions:[version],paid_resources:vector,refund_state:'active',refund_command_id:null});
}
test('D165 all Class2 ranks span40 levels from unlock; every boundary blocks quoting before spending',()=>{
 let count=0;
 for(const raw of Object.values(content.skills)){
  const s=raw as unknown as SkillDefinition;if(![20,30,40].includes(s.unlock_level)||s.class_id==='enemy')continue;count++;
  const state=initializeAccount(content,{root_job_id:content.jobs.byId[s.class_id]!.root as 'swordsman',gender:'male'},at,'2026-10-24',1),a=state.roster[0]!;a.job_id=s.class_id as typeof a.job_id;
  const levels=skillRankUnlockLevels(s);assert.equal(levels[0],s.unlock_level);assert.equal(levels.at(-1),s.unlock_level+40);
  for(let i=0;i<10;i++){a.level=levels[i]!;assert.equal(characterSkillCap(a,s),i+1);assert.doesNotThrow(()=>skillQuote(a,s.id,i+1,content));a.level--;assert.equal(characterSkillCap(a,s),i);assert.throws(()=>skillQuote(a,s.id,i+1,content),i===0?/SKILL_LOCKED/:/SKILL_CAP_REACHED/);}
 }
 assert.equal(count,96);
});
test('D165 Class1 and explicit High schedules are unchanged; no automatic upgrade or globalAwaken90 gate',()=>{
 const f=fixture(70,'lord_knight');
 for(const raw of Object.values(content.skills)){const s=raw as unknown as SkillDefinition;if(s.class_id==='enemy')continue;
  if(s.unlock_level<20)for(let l=1;l<=90;l++){f.a.level=l;assert.equal(characterSkillCap(f.a,s),Math.min(s.max_level,1+Math.floor((l-1)/5)));}
  if(s.rank_unlock_levels){assert.deepEqual(skillRankUnlockLevels(s),s.rank_unlock_levels);assert.equal(s.rank_unlock_levels.at(-1),s.unlock_level===70?88:89);}
 }
 f.a.level=70;f.a.skill_levels.knight_pierce=10;assert.doesNotThrow(()=>skillAwakenQuote(f.a,'knight_pierce',content));f.a.skill_levels.knight_counter_stance=8;assert.throws(()=>skillAwakenQuote(f.a,'knight_counter_stance',content),/SKILL_NOT_MAXED|SKILL_UNAVAILABLE/);
});
test('D165 Lv40 just unlocked rank7 becomes1 and refunds2100gold420manual; kept skills, loadout and other investments stay exact',()=>{
 const f=fixture();paid(f.state,f.a,'knight_counter_stance',7);f.a.active_slots[2]='knight_counter_stance';const before=structuredClone(f.state);
 const m=migrateAccountState(f.state,content);assert.equal(m.state.roster[0]!.skill_levels.knight_counter_stance,1);assert.equal(m.state.wallet.gold-before.wallet.gold,2100);assert.equal(m.state.wallet.skill_manual-before.wallet.skill_manual,420);
 assert.deepEqual(f.state,before);assert.deepEqual(m.state.roster[0],{...before.roster[0]!,skill_levels:{...before.roster[0]!.skill_levels,knight_counter_stance:1}});assert.deepEqual(m.state.roster.slice(1),before.roster.slice(1));
 assert.equal(m.state.paid_ledger[0]!.quantity,1);assert.equal(m.state.paid_ledger[0]!.paid_resources.gold,0);assert.deepEqual(migrateAccountState(m.state,content),{state:m.state,changes:[]});assert.doesNotThrow(()=>rules.validateAccount(m.state));
});
test('D165 partial rank trim preserves lower-rank actual investment and later reset refunds only remainder once',()=>{
 const f=fixture(60);paid(f.state,f.a,'knight_counter_stance',10);const start=structuredClone(f.state.wallet),m=migrateAccountState(f.state,content),a=m.state.roster[0]!;
 assert.equal(a.skill_levels.knight_counter_stance,5);assert.equal(m.state.wallet.gold-start.gold,3500);assert.equal(m.state.paid_ledger[0]!.paid_resources.gold,1000);
 const cmd={type:'character.reset_build',params:{character_id:'main',features:['skills']},request_id:'11111111-1111-4111-8111-111111111111',expected_revision:1,schema_version:1,...rules.versions}as const;
 applyRosterCommand(m.state,cmd as never,content);assert.equal(m.state.wallet.gold-start.gold,4500);assert.equal(m.state.wallet.skill_manual-start.skill_manual,900);const after=structuredClone(m.state.wallet);applyRosterCommand(m.state,cmd as never,content);assert.deepEqual(m.state.wallet,after);
});
test('D165 Awaken is retained; only excess Awaken ranks refund shards, base max and awakening payment remain refundable',()=>{
 const f=fixture(70,'lord_knight');paid(f.state,f.a,'knight_counter_stance',10);paid(f.state,f.a,'knight_counter_stance',10,true);const before=structuredClone(f.state),m=migrateAccountState(f.state,content);
 assert.equal(m.state.roster[0]!.skill_levels.knight_counter_stance,7);assert.deepEqual(m.state.roster[0]!.awakened_skills,['knight_counter_stance']);assert.deepEqual(m.state.paid_ledger.find(r=>r.feature_id==='skill'),before.paid_ledger[0]);assert.equal(m.state.wallet.awakening_shard-before.wallet.awakening_shard,135);assert.equal(m.state.wallet.gold-before.wallet.gold,54000);assert.doesNotThrow(()=>rules.validateAccount(m.state));
 assert.deepEqual(migrateAccountState(m.state,content).state,m.state);
});
test('D165 exact legacy prices are used even when current tables change; unknown version/mismatched actual-paid/overflow reject without mutating input',()=>{
 const f=fixture();paid(f.state,f.a,'knight_counter_stance',7);const changed=structuredClone(content)as ValidatedContent;
 const tables=changed.documents['skills/swordsman.json']!.upgrades as unknown as Record<string,{upgrade_cost_rows:{gold:number}[]}>;tables.knight_counter_stance!.upgrade_cost_rows.forEach(r=>r.gold*=9);
 assert.equal(migrateAccountState(f.state,changed).state.wallet.gold-f.state.wallet.gold,2100);
 for(const tweak of[(s:AccountState)=>{s.paid_ledger[0]!.cost_versions=['unknown'];},(s:AccountState)=>{s.paid_ledger[0]!.paid_resources.gold++;},(s:AccountState)=>{s.wallet.gold=Number.MAX_SAFE_INTEGER;}]){const input=structuredClone(f.state);tweak(input);const before=structuredClone(input);assert.throws(()=>migrateAccountState(input,content),/HISTORY|OVERFLOW/);assert.deepEqual(input,before);}
});
test('D165 within-cap skills/ledger survive byte-for-byte; free/unfunded fixture ranks never mint resources',()=>{
 const f=fixture(80,'lord_knight');paid(f.state,f.a,'knight_counter_stance',10);assert.deepEqual(migrateAccountState(f.state,content),{state:f.state,changes:[]});
 const free=fixture();free.a.skill_levels.knight_counter_stance=7;const before=structuredClone(free.state.wallet);assert.deepEqual(migrateAccountState(free.state,content).state.wallet,before);
});
test('D165 un-compacted legacy payments give same exact result as compact ledger',()=>{
 const f=fixture();paid(f.state,f.a,'knight_counter_stance',7);const row=f.state.paid_ledger[0]!;row.quantity=1;row.paid_resources=zero();
 for(let rank=2;rank<=7;rank++)f.state.paid_ledger.push({...structuredClone(row),entry_id:'rank_'+rank,quantity:1,paid_resources:{...zero(),gold:(rank-1)*100,skill_manual:(rank-1)*20}});
 const compact=structuredClone(f.state);compact.paid_ledger=compactPaidLedger(compact.paid_ledger);assert.deepEqual(migrateAccountState(f.state,content).state,migrateAccountState(compact,content).state);
});

test('D165 every authored example is legal, all skill programs/prices remain exact pre-change definitions',()=>{
 for(const root of Object.keys(prices.roots)){
  const d=JSON.parse(readFileSync(`plan/data/skills/${root}.json`,'utf8'));
  // Match Python sorted-key canonical bytes used by the independent frozen guard.
  delete d.builds;
  const sort=(v:unknown):unknown=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,x])=>[k,sort(x)])):v;
  assert.equal(createHash('sha256').update(JSON.stringify(sort(d))).digest('hex'),before136.skill_program_sha256[root as keyof typeof before136.skill_program_sha256],root);
  for(const b of JSON.parse(readFileSync(`plan/data/skills/${root}.json`,'utf8')).builds)for(const [id,rank]of Object.entries(b.skill_levels))assert.ok(Number(rank)<=characterSkillCap({level:b.level}as AccountState['roster'][number],content.skills[id]as unknown as SkillDefinition));
 }
});

test('D165 migration preserves ledger ordering across JSONB-style object-key reordering',()=>{
 const f=fixture();paid(f.state,f.a,'knight_counter_stance',7);paid(f.state,f.a,'knight_brandish',7);
 const reordered=structuredClone(f.state);reordered.roster[0]!.skill_levels=Object.fromEntries(Object.entries(reordered.roster[0]!.skill_levels).sort(([a],[b])=>a.localeCompare(b)));
 assert.equal(rules.canonical(migrateAccountState(reordered,content).state),rules.canonical(migrateAccountState(f.state,content).state));
});
