/** D166: bounded equal-budget A/B including Grimtooth substitutions; actual shared engine. */
import {readFile,writeFile,mkdir}from'node:fs/promises';
import {gunzipSync}from'node:zlib';
import{createHash}from'node:crypto';
import assert from'node:assert/strict';
import{validateContent}from'../../src/content/loader.ts';
import{loadValidatedContent}from'../../src/content/index.ts';
import{canonical}from'../../src/content/value.ts';
import{AUDIT_CASES,auditBuilds,auditFixture,auditInput,auditFight,type AuditBuild,type AuditSample,type AuditCase}from'./class-audit-fixtures.ts';
const args=process.argv.slice(2),opt=(k:string,d:string)=>{const i=args.indexOf(k);return i<0?d:args[i+1]!;};
const loaded=loadValidatedContent(),old=validateContent(JSON.parse(gunzipSync(await readFile('plan/evidence/task-137/content-before.json.gz')).toString()));if(!loaded.ok||!old.ok)throw Error('CONTENT_REQUIRED');
const content=loaded.value,before=old.value,worker=Number(opt('--worker','0')),workers=Number(opt('--workers','2')),out=opt('--out','.local/balance/task-137');await mkdir(out,{recursive:true});
const seeds=[12901,12902,12903],holdout=Array.from({length:16},(_,i)=>22901+i);
const conditions=AUDIT_CASES.filter(c=>['class2-70-gear60','high-90-awaken10'].includes(c.id));
function candidates(condition:AuditCase):AuditBuild[]{
 const job=condition.stage===2?'assassin':'assassin_cross',base=auditBuilds(content,condition.stage).filter(b=>b.job===job),all=[...base];
 for(const b of base)if(!b.slots.includes('assassin_grimtooth'))for(let i=0;i<4;i++)if(b.slots[i]!=='assassin_enchant_poison'&&b.slots[i]!=='thief_envenom'){
  const slots=[...b.slots];slots[i]='assassin_grimtooth';all.push({...b,id:b.id+'-grim'+i,slots});
 }
 return [...new Map(all.map(b=>[b.profile+':'+b.slots.join(','),b])).values()];
}
function summary(samples:AuditSample[]){
 const keys=['dps','normal_dps','skill_dps','team_dps','hps','sp_skips','casts','interrupted','survivors','burst10_dps','last30_dps']as const;
 const mean=Object.fromEntries(keys.map(k=>[k,samples.reduce((n,s)=>n+s[k],0)/samples.length]));
 const d=mean.dps!,sd=Math.sqrt(samples.reduce((n,s)=>n+(s.dps-d)**2,0)/Math.max(1,samples.length-1));
 const skill_dps=Object.fromEntries([...new Set(samples.flatMap(s=>Object.keys(s.skill_damage)))].map(id=>[id,samples.reduce((n,s)=>n+(s.skill_damage[id]??0)/90,0)/samples.length]));
 return{n:samples.length,mean,dps_ci95:[d-1.96*sd/Math.sqrt(samples.length),d+1.96*sd/Math.sqrt(samples.length)],skill_dps};
}
if(args[0]==='screen'){
 const groups=[];let fights=0;
 for(const condition of conditions)for(const [index,build]of candidates(condition).entries()){
  if(index%workers!==worker)continue;
  const left=auditFixture(build,condition,before),right=auditFixture(build,condition,content);assert.deepEqual(left.costs,right.costs);assert.deepEqual(left.primary,right.primary);
  for(const encounter of['dummy','pressure']as const){
   const a=auditInput(left,encounter,before),b=auditInput(right,encounter,content),ls=[],rs=[];
   for(const seed of seeds){const l=auditFight(a,seed,before),r=auditFight(b,seed,content);assert.deepEqual(l.initial.actors.find(a=>a.actor_id==='main')!.stats,r.initial.actors.find(a=>a.actor_id==='main')!.stats);ls.push(l.sample);rs.push(r.sample);fights+=2;}
   groups.push({condition,build,encounter,before:summary(ls),after:summary(rs),samples_before:ls,samples_after:rs});
  }
  console.log(JSON.stringify({worker,condition:condition.id,build:build.id,fights,dps:groups.at(-2)!.after.mean.dps}));
  await writeFile(`${out}/screen-${worker}.json`,JSON.stringify({content_hash:content.manifest.content_hash,before_hash:before.manifest.content_hash,fights,groups}));
 }
}else if(args[0]==='confirm'){
 const parts=await Promise.all(Array.from({length:workers},(_,i)=>readFile(`${out}/screen-${i}.json`,'utf8').then(JSON.parse)));assert.ok(parts.every(p=>p.content_hash===content.manifest.content_hash));
 const groups=parts.flatMap(p=>p.groups),confirmed=[],jobs=['assassin','assassin_cross'];let fights=parts.reduce((n,p)=>n+p.fights,0);
 for(const condition of conditions)for(const encounter of['dummy','pressure']as const){
  const scope=groups.filter(g=>g.condition.id===condition.id&&g.encounter===encounter),score=encounter==='dummy'?'dps':'team_dps';
  const choose=(version:'before'|'after',grimOnly=false)=>[...scope].filter(g=>!grimOnly||g.build.slots.includes('assassin_grimtooth')).sort((a,b)=>b[version].mean[score]-a[version].mean[score])[0];
  const priorId=condition.stage===3?'assassin_cross-3-critical':'assassin-3-critical';
  const choices=[choose('before'),choose('after'),choose('after',true),...scope.filter(g=>g.build.id===priorId)],chosen=[...new Map(choices.map(g=>[g.build.id,g])).values()];
  for(const g of chosen){
   const build=g.build as AuditBuild,oldFixture=auditFixture(build,condition,before),newFixture=auditFixture(build,condition,content),ls=[],rs=[];
   assert.deepEqual(oldFixture.costs,newFixture.costs);assert.deepEqual(oldFixture.primary,newFixture.primary);
   for(const seed of holdout){ls.push(auditFight(auditInput(oldFixture,encounter,before),seed,before).sample);rs.push(auditFight(auditInput(newFixture,encounter,content),seed,content).sample);fights+=2;}
   const input=auditInput(newFixture,encounter,content),replay=auditFight(input,holdout[0]!,content);fights++;
   const name=`replay-${condition.id}-${encounter}-${build.id}.json`;await writeFile(`${out}/${name}`,JSON.stringify({content_hash:content.manifest.content_hash,seed:holdout[0],input,sample:replay.sample,final_sha256:createHash('sha256').update(canonical(replay.final)).digest('hex')}));
   confirmed.push({condition,encounter,build,chosen_before:g.build.id===choose('before').build.id,chosen_after:g.build.id===choose('after').build.id,chosen_grim:g.build.id===choose('after',true).build.id,primary:newFixture.primary,costs:newFixture.costs,before:summary(ls),after:summary(rs),samples_before:ls,samples_after:rs,replay:name});
   console.log(JSON.stringify({condition:condition.id,encounter,build:build.id,before:summary(ls).mean.dps,after:summary(rs).mean.dps}));
  }
 }
 const high=confirmed.filter(r=>r.condition.stage===3&&r.encounter==='dummy'),best=high.sort((a,b)=>b.after.mean.dps!-a.after.mean.dps!)[0]!;
 const result={content_hash:content.manifest.content_hash,before_hash:before.manifest.content_hash,fights,screen_fights:parts.reduce((n,p)=>n+p.fights,0),screenSeeds:seeds,holdoutSeeds:holdout,jobs,method:'Actual90s neutral boss, Common60/equal manual points/actual costs; Class270 uses D165caps, High90 uses4ActiveAw10+basepassives; original+all one-slot Grim substitutions, dummy and pressure. Select3 seeds, confirm16 heldout; fixed A/B each selected build, no old evidence relabel.',best_high:{build:best.build,dps:best.after.mean.dps,in_band:best.after.mean.dps!>=9000&&best.after.mean.dps!<=11000},confirmed,screen:groups};
 await writeFile('plan/evidence/task-137/results.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({fights,best_high:result.best_high}));
}else if(args[0]==='growth'){
 const results=[];let fights=0;
 for(const id of['growth-40-gear40','class2-70-gear1','class2-70-gear20','class2-70-gear40','high-90-base','high-90-awaken1']){
  const condition=AUDIT_CASES.find(c=>c.id===id)!,job=condition.stage===2?'assassin':'assassin_cross';
  const build:AuditBuild={id:job+'-grim-growth-critical',job,role:'damage',profile:'critical',slots:['assassin_enchant_poison','assassin_sonic_blow','assassin_grimtooth','thief_backstab']};
  const a=auditFixture(build,condition,before),b=auditFixture(build,condition,content);assert.deepEqual(a.costs,b.costs);assert.deepEqual(a.primary,b.primary);
  const ls=[],rs=[];for(const seed of holdout){ls.push(auditFight(auditInput(a,'dummy',before),seed,before).sample);rs.push(auditFight(auditInput(b,'dummy',content),seed,content).sample);fights+=2;}
  results.push({condition,build,before:summary(ls),after:summary(rs),samples_before:ls,samples_after:rs});
 }
 await writeFile('plan/evidence/task-137/growth.json',JSON.stringify({content_hash:content.manifest.content_hash,before_hash:before.manifest.content_hash,fights,results},null,2)+'\n');console.log(JSON.stringify({fights,rows:results.map(r=>({condition:r.condition.id,before:r.before.mean.dps,after:r.after.mean.dps}))}));
}else throw Error('screen --worker N / confirm / growth');
