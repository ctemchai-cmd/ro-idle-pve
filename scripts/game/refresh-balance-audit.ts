/** Reproducible Nov2026 skill audit. Synthetic accounts, real shared engine, no owner data. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {validateContent} from '../../src/content/loader.ts';
import {loadValidatedContent} from '../../src/content/index.ts';
import {auditBuilds,auditFixture,auditInput,auditFight,type AuditCase,type AuditSample,type AuditBuild} from './class-audit-fixtures.ts';
const args=process.argv.slice(2),opt=(k:string,d:string)=>args.includes(k)?args[args.indexOf(k)+1]!:d;
const frozen=opt('--content',''),loaded=frozen?validateContent(JSON.parse(gunzipSync(await readFile(frozen)).toString())):loadValidatedContent();
if(!loaded.ok)throw new Error(JSON.stringify(loaded.errors));const c=loaded.value;
const worker=Number(opt('--worker','0')),workers=Number(opt('--workers','1')),out=opt('--out','.local/balance/task-192/before');await mkdir(out,{recursive:true});
const allCases:AuditCase[]=[{id:'class1-10-tier1',level:10,tier:1,stage:1,awaken:0},...([1,20,40,60]as const).map(tier=>({id:`class2-70-tier${tier}`,level:70,tier,stage:2 as const,awaken:0 as const})),...([0,1,10]as const).map(awaken=>({id:`high-100-tier100-aw${awaken}`,level:100,tier:100 as const,stage:3 as const,awaken}))];
const filter=opt('--conditions','').split(',').filter(Boolean),cases=filter.length?allCases.filter(c=>filter.includes(c.id)):allCases;
const screenSeeds=[319201,319202],holdoutSeeds=Array.from({length:8},(_,i)=>419201+i);
const summary=(samples:AuditSample[])=>{const keys=['dps','normal_dps','skill_dps','team_dps','hps','shields','sp_skips','sphere_skips','casts','boss_interrupted','survivors','burst10_dps','last30_dps']as const;return Object.fromEntries(keys.map(k=>[k,samples.reduce((sum,s)=>sum+s[k],0)/samples.length]));};
const work=cases.flatMap(condition=>{const builds=auditBuilds(c,condition.stage);return [...new Set(builds.map(b=>b.job))].map(job=>({condition,job,builds:builds.filter(b=>b.job===job)}));});
if(args[0]==='merge'){
 const rows=await Promise.all(Array.from({length:workers},(_,i)=>readFile(`${out}/worker-${i}.json`,'utf8').then(JSON.parse)));if(rows.some(r=>r.content_hash!==c.manifest.content_hash))throw new Error('STALE_AUDIT');
 const confirmed=rows.flatMap(r=>r.confirmed),screen=rows.flatMap(r=>r.screen);if(confirmed.length!==work.length*2)throw new Error('INCOMPLETE_AUDIT');
 const report={content_hash:c.manifest.content_hash,fights:rows.reduce((n,r)=>n+r.fights,0),screenSeeds,holdoutSeeds,cases,confirmed,screen,method:'All32 current jobs; legal ranks; same manual point entitlement/Common equipment tier per condition; fixed90s neutral single target; damage/support core identical; no Artifact/cards/refine/enchant; two seed candidate screen and8 disjoint holdout seeds. Pressure scales only boss damage by12 atlevel70+, and reports survival/team contribution, not soloDPS ranking for supports. Bounded candidate search, not exhaustive or every boss.'};
 await writeFile(`${out}/results.json`,JSON.stringify(report));console.log(JSON.stringify({fights:report.fights,confirmed:confirmed.length}));
}else{
 let fights=0;const confirmed:unknown[]=[],screen:unknown[]=[];
 for(const[index,group]of work.entries()){
  if(index%workers!==worker)continue;const{condition,job}=group;
  const candidates:AuditBuild[]=[...group.builds];if(['sage','professor'].includes(job))for(const b of group.builds.filter(b=>b.slots.includes('sage_spell_breaker')))candidates.push({...b,id:b.id+'-control',profile:'speed'});
  const extra:Partial<Record<string,string[][]>>={champion:[['monk_call_spirits','champion_chain_crush_combo','champion_palm_strike','acolyte_blessing'],['monk_call_spirits','champion_chain_crush_combo','acolyte_blessing','acolyte_heal']],creator:[['merchant_loud_voice','creator_acid_demonstration','alchemist_hell_plant','alchemist_acid_terror']],professor:[['professor_double_casting','sage_spell_breaker','professor_soul_change','sage_psychic_bolt']],high_priest:[['high_priest_basilica','priest_impositio','priest_sanctuary','high_priest_assumptio']]};
  for(const [n,slots]of(extra[job]??[]).entries())for(const profile of ['champion','creator'].includes(job)?['power','hybrid','critical']:['magic','spell_speed','speed'])candidates.push({...group.builds[0]!,id:`${job}-extra${n}-${profile}`,slots,profile});
  const fixtures=candidates.map(b=>auditFixture(b,condition,c));
  for(const encounter of ['dummy','pressure']as const){
   const prepare=(fixture:typeof fixtures[number])=>{const input=auditInput(fixture,encounter,c);if(encounter==='pressure'&&condition.level>=70){const boss=input.actors.find(a=>a.actor_id==='audit_boss')!;boss.stat_blueprint.derived_offsets.physical_attack*=12;boss.stat_blueprint.derived_offsets.magical_attack*=12;}return input;};
   const ranked=fixtures.map(f=>{const input=prepare(f),samples=screenSeeds.map(seed=>{fights++;return auditFight(input,seed,c).sample;});return{build:f.build,summary:summary(samples)};});
   screen.push({condition:condition.id,job,encounter,ranked});const score=encounter==='dummy'?'dps':'team_dps',winner=ranked.sort((a,b)=>b.summary[score]!-a.summary[score]!)[0]!;
   const fixture=fixtures.find(f=>f.build.id===winner.build.id)!,input=prepare(fixture),samples=holdoutSeeds.map(seed=>{fights++;return auditFight(input,seed,c).sample;});
   confirmed.push({condition:condition.id,job,encounter,build:winner.build,primary:fixture.primary,costs:fixture.costs,summary:summary(samples),samples});
  }
  await writeFile(`${out}/worker-${worker}.json`,JSON.stringify({content_hash:c.manifest.content_hash,fights,screen,confirmed}));console.log(JSON.stringify({worker,condition:condition.id,job,fights}));
 }
}
