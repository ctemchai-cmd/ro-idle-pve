/** D161 fixed A/B: same pre-patch selected builds, initial stats, prices and heldout seeds. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {loadValidatedContent} from '../../src/content/index.ts';
import {validateContent} from '../../src/content/loader.ts';
import {AUDIT_CASES,auditFixture,auditInput,auditFight,type AuditBuild,type AuditSample,type Encounter} from './class-audit-fixtures.ts';
const unwrap=<T>(r:{ok:true;value:T}|{ok:false;errors:unknown})=>{if(!r.ok)throw r.errors;return r.value;};
const after=unwrap(loadValidatedContent()),before=unwrap(validateContent(JSON.parse(gunzipSync(await readFile('plan/evidence/task-131/content-before.json.gz')).toString())));
const selection=JSON.parse(gunzipSync(await readFile('plan/evidence/task-129/results.json.gz')).toString());
const args=process.argv.slice(2),phase=args[0]??'class2-70-gear60';
const rows=[];let fights=0;const start=Date.now();
for(const group of selection.confirmed.filter((r:{condition:string})=>r.condition===phase)){
 const condition=AUDIT_CASES.find(c=>c.id===phase)!,build=group.build as AuditBuild,encounter=group.encounter as Encounter;
 const b=auditFixture(build,condition,before),a=auditFixture(build,condition,after);
 assert.deepEqual(a.primary,b.primary);assert.deepEqual(a.costs,b.costs);
 const old:AuditSample[]=[],current:AuditSample[]=[];
 for(const seed of group.sample_seeds as number[]){
  const left=auditFight(auditInput(b,encounter,before),seed,before),right=auditFight(auditInput(a,encounter,after),seed,after);
  assert.deepEqual(left.initial.actors.find(a=>a.actor_id==='main')!.stats,right.initial.actors.find(a=>a.actor_id==='main')!.stats);
  old.push(left.sample);current.push(right.sample);fights+=2;
 }
 const mean=(s:AuditSample[])=>Object.fromEntries(['dps','normal_dps','skill_dps','team_dps','hps','shields','sp_skips','casts','interrupted','survivors','burst10_dps','last30_dps'].map(k=>[k,s.reduce((n,r)=>n+Number(r[k as keyof AuditSample]),0)/s.length]));
 const left=mean(old),right=mean(current);
 rows.push({job:build.job,encounter,build,costs:a.costs,primary:a.primary,seeds:group.sample_seeds,before:left,after:right,percent_dps:(right.dps!/left.dps!-1)*100,samples_before:old,samples_after:current});
}
assert.equal(rows.length,26,'requires every Class2/High job on both encounter types');
await mkdir('plan/evidence/task-131',{recursive:true});
await writeFile(`plan/evidence/task-131/fixed-${phase}.json`,JSON.stringify({before_hash:before.manifest.content_hash,after_hash:after.manifest.content_hash,phase,fights,elapsed_ms:Date.now()-start,method:'Old TASK129 candidate winners re-executed on frozen deployed9ae8 and current. Equal initial stats, cost, gear and16 seeds asserted; no reoptimization.',rows},null,2)+'\n');
console.log(JSON.stringify({phase,fights,elapsed_s:(Date.now()-start)/1000,rows:rows.filter(r=>r.encounter==='dummy').map(r=>({job:r.job,before:Math.round(r.before.dps!),after:Math.round(r.after.dps!),change:Math.round(r.percent_dps)}))}));
