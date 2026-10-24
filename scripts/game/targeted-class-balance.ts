/** D163/TASK132: matched causal A/B plus a bounded re-screen, on the actual engine. */
import {readFile,writeFile,mkdir}from'node:fs/promises';
import {gunzipSync}from'node:zlib';
import {createHash}from'node:crypto';
import assert from'node:assert/strict';
import {loadValidatedContent}from'../../src/content/index.ts';
import {validateContent}from'../../src/content/loader.ts';
import {canonical}from'../../src/content/value.ts';
import {AUDIT_CASES,auditBuilds,auditFixture,auditInput,auditFight,type AuditSample,type AuditBuild}from'./class-audit-fixtures.ts';
const args=process.argv.slice(2),opt=(key:string,fallback:string)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1]!;};
const loaded=loadValidatedContent(),frozen=validateContent(JSON.parse(gunzipSync(await readFile('plan/evidence/task-132/content-before.json.gz')).toString()));if(!loaded.ok||!frozen.ok)throw Error('INVALID_CONTENT');
const content=loaded.value,before=frozen.value,worker=Number(opt('--worker','0')),workers=Number(opt('--workers','3')),out=opt('--out','.local/balance/task-132');await mkdir(out,{recursive:true});
const previous=JSON.parse(gunzipSync(await readFile('plan/evidence/task-131/results.json.gz')).toString());
const damageJobs=['assassin_cross','sniper','lord_knight','stalker','high_wizard','champion','creator','professor','whitesmith'];
const work=AUDIT_CASES.flatMap(condition=>{const jobs=condition.id.startsWith('class2-70-gear')?['assassin']:condition.id==='high-90-awaken10'?damageJobs:['high-90-base','high-90-awaken1'].includes(condition.id)?['assassin_cross','whitesmith']:[];return jobs.map(job=>({condition,job}));});
const screenSeeds=[12901,12902,12903],seeds=Array.from({length:16},(_,i)=>22901+i);
const summarize=(samples:AuditSample[])=>{
 const mean=Object.fromEntries(['dps','normal_dps','skill_dps','team_dps','hps','sp_skips','sphere_skips','casts','interrupted','survivors','burst10_dps','last30_dps'].map(k=>[k,samples.reduce((n,s)=>n+Number(s[k as keyof AuditSample]),0)/samples.length]));
 const m=mean.dps!,sd=Math.sqrt(samples.reduce((n,s)=>n+(s.dps-m)**2,0)/(samples.length-1));
 return{n:samples.length,mean,dps_ci95:[m-1.96*sd/Math.sqrt(samples.length),m+1.96*sd/Math.sqrt(samples.length)]};
};
if(args[0]==='comparators'){
 const rows=[];let fights=0;
 for(const condition of AUDIT_CASES.filter(c=>c.id.startsWith('class2-70-gear')))for(const job of ['hunter','wizard']){
  const old=previous.confirmed.find((r:{condition:string;encounter:string;build:AuditBuild})=>r.condition===condition.id&&r.encounter==='dummy'&&r.build.job===job);
  const fixture=auditFixture(old.build,condition,content),input=auditInput(fixture,'dummy',content),samples=seeds.map(seed=>{fights++;return auditFight(input,seed,content).sample;});
  rows.push({condition,job,build:old.build,summary:summarize(samples),samples});
 }
 await writeFile('plan/evidence/task-132/comparators.json',JSON.stringify({content_hash:content.manifest.content_hash,fights,method:'Fresh current-content16seed Class2 Hunter/Wizard checks, using the unchanged131 selected builds and equal gear budgets.',rows},null,2)+'\n');console.log(JSON.stringify({fights,rows:rows.map(r=>({condition:r.condition.id,job:r.job,dps:r.summary.mean.dps}))}));
}else if(args[0]==='merge'){
 const files=await Promise.all(Array.from({length:workers},(_,i)=>readFile(`${out}/worker-${i}.json`,'utf8').then(JSON.parse)));assert.ok(files.every(f=>f.content_hash===content.manifest.content_hash));
 const confirmed=files.flatMap(f=>f.confirmed),fixed=files.flatMap(f=>f.fixed),screen=files.flatMap(f=>f.screen);assert.equal(confirmed.length,34);assert.equal(new Set(confirmed.map(r=>`${r.condition.id}:${r.job}:${r.encounter}`)).size,34);assert.equal(fixed.length,34);
 const band=confirmed.filter(r=>r.condition.id==='high-90-awaken10'&&r.encounter==='dummy').map(r=>({job:r.job,dps:r.summary.mean.dps,in_band:r.summary.mean.dps>=9000&&r.summary.mean.dps<=11000}));assert.equal(band.length,9);
 const report={content_hash:content.manifest.content_hash,before_hash:before.manifest.content_hash,fights:files.reduce((n,f)=>n+f.fights,0),screenSeeds,seeds,damageJobs,method:'Same Common gear, point budgets and actual skill prices. Fixed A/B replays old131 winning builds on frozen/current content; re-screen uses3 seeds, independent16 seeds confirm candidates. DPS=damage/90s. One neutral boss, no cards/refine/enchant; only4Active Awaken, passives base. Target9–11k applies to9High damage jobs on90/Aw10, not supports/tanks or lower levels.',band,confirmed,fixed,screen};
 await writeFile('plan/evidence/task-132/results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({fights:report.fights,band,all_in_band:band.every(r=>r.in_band)}));
}else{
 const start=Date.now(),confirmed=[],fixed=[],screen=[];let fights=0;
 for(const [index,{condition,job}]of work.entries()){
  if(index%workers!==worker)continue;
  const candidates=auditBuilds(content,condition.stage).filter(b=>b.job===job),fixtures=candidates.map(b=>auditFixture(b,condition,content));
  for(const encounter of ['dummy','pressure']as const){
   const groups=fixtures.map(f=>{const input=auditInput(f,encounter,content),samples=screenSeeds.map(seed=>{fights++;return auditFight(input,seed,content).sample;});return{build:f.build,summary:summarize(samples)};});
   screen.push(...groups.map(g=>({...g,condition,job,encounter})));
   const score=encounter==='dummy'?'dps':'team_dps',winner=groups.sort((a,b)=>b.summary.mean[score]!-a.summary.mean[score]!)[0]!;
   const chosen=fixtures.find(f=>f.build.id===winner.build.id)!,input=auditInput(chosen,encounter,content),samples=seeds.map((seed,i)=>{const run=auditFight(input,seed,content);fights++;if(i===0)void 0;return run.sample;});
   const replay=auditFight(input,seeds[0]!,content);fights++;
   await writeFile(`${out}/replay-${condition.id}-${encounter}-${job}.json`,JSON.stringify({content_hash:content.manifest.content_hash,seed:seeds[0],input,expected_sample:replay.sample,final_sha256:createHash('sha256').update(canonical(replay.final)).digest('hex')}));
   confirmed.push({condition,job,encounter,build:chosen.build,primary:chosen.primary,costs:chosen.costs,summary:summarize(samples),samples});
   const old=previous.confirmed.find((r:{condition:string;encounter:string;build:AuditBuild})=>r.condition===condition.id&&r.encounter===encounter&&r.build.job===job);
   const oldBuild=old.build as AuditBuild,oldFixture=auditFixture(oldBuild,condition,before),newFixture=auditFixture(oldBuild,condition,content);assert.deepEqual(oldFixture.primary,newFixture.primary);assert.deepEqual(oldFixture.costs,newFixture.costs);
   const left=[],right=[];
   for(const seed of seeds){const a=auditFight(auditInput(oldFixture,encounter,before),seed,before),b=auditFight(auditInput(newFixture,encounter,content),seed,content);assert.deepEqual(a.initial.actors.find(x=>x.actor_id==='main')!.stats,b.initial.actors.find(x=>x.actor_id==='main')!.stats);left.push(a.sample);right.push(b.sample);fights+=2;}
   fixed.push({condition,job,encounter,build:oldBuild,before:summarize(left),after:summarize(right),samples_before:left,samples_after:right});
  }
  console.log(JSON.stringify({worker,condition:condition.id,job,fights,elapsed_s:(Date.now()-start)/1000,dps:confirmed.at(-2)!.summary.mean.dps}));
  await writeFile(`${out}/worker-${worker}.json`,JSON.stringify({content_hash:content.manifest.content_hash,fights,confirmed,fixed,screen}));
 }
}
