import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadValidatedContent } from '../../src/content/index.ts';
import { validateContent } from '../../src/content/loader.ts';
import { canonical } from '../../src/content/value.ts';
import { AUDIT_CASES, auditBuilds, auditFight, auditFixture, auditInput, type AuditSample, type Encounter } from './class-audit-fixtures.ts';

const args=process.argv.slice(2),opt=(key:string,otherwise:string)=>{const i=args.indexOf(key);return i<0?otherwise:args[i+1]!;};
const command=args[0]??'run',out=opt('--out','plan/evidence/task-129'),worker=Number(opt('--worker','0')),workers=Number(opt('--workers','1'));
const frozen=opt('--content','');const loaded=frozen?validateContent(JSON.parse(gunzipSync(await readFile(frozen)).toString())):loadValidatedContent();if(!loaded.ok)throw new Error(JSON.stringify(loaded.errors));const content=loaded.value;
const screenSeeds=[12901,12902,12903],confirmSeeds=Array.from({length:16},(_,i)=>22901+i);
const summarize=(samples:AuditSample[])=>{
  const numeric=Object.keys(samples[0]!).filter(k=>typeof samples[0]![k as keyof AuditSample]==='number'&&k!=='seed');
  const mean=Object.fromEntries(numeric.map(k=>[k,samples.reduce((n,s)=>n+Number(s[k as keyof AuditSample]),0)/samples.length]));
  const dps=samples.map(s=>s.dps),team=samples.map(s=>s.team_dps);
  const interval=(values:number[])=>{const n=values.length,m=values.reduce((a,b)=>a+b,0)/n,sd=n>1?Math.sqrt(values.reduce((s,x)=>s+(x-m)**2,0)/(n-1)):0;return[m-1.96*sd/Math.sqrt(n),m+1.96*sd/Math.sqrt(n)];};
  const aggregate=(key:'skill_damage'|'skill_healing')=>Object.fromEntries([...new Set(samples.flatMap(s=>Object.keys(s[key])))].map(id=>[id,samples.reduce((n,s)=>n+(s[key][id]??0),0)/samples.length]));
  return{n:samples.length,mean,dps_ci95:interval(dps),team_dps_ci95:interval(team),dps_min:Math.min(...dps),dps_max:Math.max(...dps),skill_damage:aggregate('skill_damage'),skill_healing:aggregate('skill_healing')};
};
type Group={condition:string;encounter:Encounter;build:ReturnType<typeof auditBuilds>[number];summary:ReturnType<typeof summarize>;costs:unknown;primary:unknown;point_budget:number;points_spent:number;initial_stats:unknown;sample_seeds:number[]};
const json=async(file:string,value:unknown)=>writeFile(file,JSON.stringify(value,null,2)+'\n');
await mkdir(out,{recursive:true});
if(command==='run'){
  const previous=args.includes('--resume')?JSON.parse(await readFile(path.join(out,`worker-${worker}.json`),'utf8')):null;
  if(previous&&previous.content_hash!==content.manifest.content_hash)throw new Error('AUDIT_STALE_RESUME');
  const start=performance.now(),screen:Group[]=[],confirmed:Group[]=[],samples:{condition:string;encounter:string;build:string;phase:string;sample:AuditSample}[]=previous?.samples??[];
  let battles=previous?.battles??0,caseIndex=0;
  for(const condition of AUDIT_CASES.filter(c=>!args.includes('--conditions')||opt('--conditions','').split(',').includes(c.id))){
    if(caseIndex++%workers!==worker)continue;
    const candidates=auditBuilds(content,condition.stage);
    const fixtures=candidates.map(build=>auditFixture(build,condition,content));
    for(const encounter of ['dummy','pressure']as const){
      const groups:Group[]=[];
      for(const fixture of fixtures){
        const cached=previous?.screen.find((g:Group)=>g.condition===condition.id&&g.encounter===encounter&&g.build.id===fixture.build.id);
        if(cached){groups.push(cached);continue;}
        const input=auditInput(fixture,encounter,content),rows:AuditSample[]=[];let initial_stats:unknown;
        for(const seed of screenSeeds){const result=auditFight(input,seed,content);rows.push(result.sample);initial_stats=result.initial.actors.find(a=>a.actor_id==='main')!.stats;battles++;samples.push({condition:condition.id,encounter,build:fixture.build.id,phase:'screen',sample:result.sample});}
        groups.push({condition:condition.id,encounter,build:fixture.build,summary:summarize(rows),costs:fixture.costs,primary:fixture.primary,point_budget:fixture.point_budget,points_spent:fixture.points_spent,initial_stats,sample_seeds:screenSeeds});
      }
      screen.push(...groups);
      const score=encounter==='dummy'?'dps':'team_dps';
      for(const job of [...new Set(groups.map(g=>g.build.job))]){
        const winner=groups.filter(g=>g.build.job===job).sort((a,b)=>b.summary.mean[score]!-a.summary.mean[score]!)[0]!;
        const cached=previous?.confirmed.find((g:Group)=>g.condition===condition.id&&g.encounter===encounter&&g.build.id===winner.build.id);
        if(cached){confirmed.push(cached);continue;}
        const fixture=fixtures.find(f=>f.build.id===winner.build.id)!,input=auditInput(fixture,encounter,content),rows:AuditSample[]=[];
        for(const [index,seed]of confirmSeeds.entries()){
          const result=auditFight(input,seed,content);rows.push(result.sample);battles++;samples.push({condition:condition.id,encounter,build:winner.build.id,phase:'confirm',sample:result.sample});
          if(index===0)await json(path.join(out,`replay-${condition.id}-${encounter}-${job}.json`),{schema_version:1,content_hash:content.manifest.content_hash,seed,input,fixture:{build:fixture.build,condition,primary:fixture.primary,costs:fixture.costs,point_budget:fixture.point_budget,points_spent:fixture.points_spent},expected_sample:result.sample,final_sha256:createHash('sha256').update(canonical(result.final)).digest('hex')});
        }
        confirmed.push({...winner,summary:summarize(rows),sample_seeds:confirmSeeds});
      }
      console.log(JSON.stringify({worker,condition:condition.id,encounter,candidates:groups.length,battles,elapsed_s:Math.round((performance.now()-start)/1000),top:confirmed.filter(g=>g.condition===condition.id&&g.encounter===encounter).sort((a,b)=>b.summary.mean[score]!-a.summary.mean[score]!).slice(0,3).map(g=>({job:g.build.job,dps:Math.round(g.summary.mean.dps!),team_dps:Math.round(g.summary.mean.team_dps!)}))}));
      await json(path.join(out,`worker-${worker}.json`),{content_hash:content.manifest.content_hash,worker,workers,battles,elapsed_ms:(previous?.elapsed_ms??0)+performance.now()-start,screen,confirmed,samples});
    }
  }
  console.log(JSON.stringify({complete:true,worker,battles,elapsed_s:(performance.now()-start)/1000}));
}else if(command==='merge'){
  const files=await Promise.all(Array.from({length:workers},(_,i)=>readFile(path.join(out,`worker-${i}.json`),'utf8').then(JSON.parse)));
  if(files.some(f=>f.content_hash!==content.manifest.content_hash))throw new Error('AUDIT_STALE_CONTENT');
  const confirmed:Group[]=files.flatMap(f=>f.confirmed),screen:Group[]=files.flatMap(f=>f.screen),samples=files.flatMap(f=>f.samples);
  const expected=AUDIT_CASES.filter(c=>!args.includes('--conditions')||opt('--conditions','').split(',').includes(c.id)).reduce((n,c)=>n+(c.stage===1?6:13)*2,0);if(confirmed.length!==expected||new Set(confirmed.map(g=>`${g.condition}:${g.encounter}:${g.build.job}`)).size!==expected)throw new Error('AUDIT_INCOMPLETE_MATRIX');
  const result={schema_version:1,content_hash:content.manifest.content_hash,created_at:new Date().toISOString(),machine:{cpu:os.cpus()[0]?.model,node:process.version},method:{duration_ms:90000,equipment:'six matching Common tier items; no random options/refine/enchant/cards/scrolls',skills:'four active slots + all legal learned passives at character rank cap; only equipped actives Awaken; companions never Awaken',budget:'equal character-level manual point entitlement and skill-rank cap; actual skill prices differ and are reported, no claim of equal gold/time',boss:'one neutral, large demi-human, 1e9HP, DEF=MDEF=20+2*level, attack=magic=80+4*level, ASPD=CSPD100; fixed across classes',dummy:'main alone; boss stationary/no attacks',pressure:'same fixed Knight/Priest/Bard core (promoted to same-branch High at90), active attacking boss with Bite/Cataclysm/Doom/Firestorm',selection:'three screening seeds; best personal DPS on dummy and best team DPS on pressure, sixteen disjoint confirm seeds; no exhaustive global optimization',screenSeeds,confirmSeeds,ci95:'normal approximation over RNG seeds, not balance/skill-selection uncertainty',limitations:['Single neutral target; elemental/race/size matchups and AoE value not generalized','No gear/card/refine investments or SP consumables; class SP economy may differ with real equipment','Fixed supportive core can undervalue extra healing or duplicate roles; team DPS is not a controlled causal support delta','Finite 90s; longer fights can change uncapped additive buff stacking and SP exhaustion','Same seed does not preserve identical RNG draw alignment after builds change','Growth20/40 intentionally includes locked slots as null; they retain their full SI cost']},battles:files.reduce((n,f)=>n+f.battles,0),worker_cpu_elapsed_ms:files.reduce((n,f)=>n+f.elapsed_ms,0),confirmed,screen};
  await json(path.join(out,'results.json'),result);await json(path.join(out,'samples.json'),samples);
  const cols=['condition','encounter','job','build','n','dps','normal_dps','skill_dps','team_dps','hps','sp_skips','sphere_skips','casts','boss_interrupted','alive_ms','survivors','burst10_dps','last30_dps'];
  const csv=[cols.join(','),...confirmed.map(g=>cols.map(k=>k==='condition'?g.condition:k==='encounter'?g.encounter:k==='job'?g.build.job:k==='build'?g.build.id:k==='n'?g.summary.n:g.summary.mean[k]??'').join(','))].join('\n')+'\n';await writeFile(path.join(out,'summary.csv'),csv);
  console.log(JSON.stringify({complete:true,battles:result.battles,confirmed:confirmed.length,candidates:screen.length,content_hash:result.content_hash}));
}else if(command==='replay'){
  const file=opt('--file','');const replay=JSON.parse(await readFile(file,'utf8'));
  if(replay.content_hash!==content.manifest.content_hash)throw new Error('AUDIT_STALE_REPLAY');
  const result=auditFight(replay.input,replay.seed,content),hash=createHash('sha256').update(canonical(result.final)).digest('hex');
  if(hash!==replay.final_sha256||canonical(result.sample)!==canonical(replay.expected_sample))throw new Error('AUDIT_REPLAY_MISMATCH');console.log(JSON.stringify({replay:'passed',file,hash}));
}else throw new Error('AUDIT_COMMAND:run|merge|replay');
