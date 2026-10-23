/** Same exact pre-patch selected builds, gear, points, prices and 16 seeds; effects are the only treatment. */
import { readFile,writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { loadValidatedContent } from '../../src/content/index.ts';
import { AUDIT_CASES,auditFixture,auditInput,auditFight,type AuditBuild,type AuditSample,type Encounter } from './class-audit-fixtures.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw loaded.errors;const content=loaded.value;
const phase=process.argv[2]??'high-90-awaken10';if(!['high-90-awaken1','high-90-awaken10'].includes(phase))throw Error('AWAKEN_PHASE_REQUIRED');
const before=JSON.parse(gunzipSync(await readFile('plan/evidence/task-129/results.json.gz')).toString());
const rows=[];let fights=0;
for(const row of before.confirmed.filter((r:{condition:string})=>r.condition===phase)){
 const fixture=auditFixture(row.build as AuditBuild,AUDIT_CASES.find(c=>c.id===phase)!,content),input=auditInput(fixture,row.encounter as Encounter,content);
 assert.deepEqual(fixture.primary,row.primary);assert.deepEqual(fixture.costs,row.costs);
 const samples:AuditSample[]=[];
 for(const seed of row.sample_seeds as number[]){const run=auditFight(input,seed,content);assert.deepEqual(run.initial.actors.find(a=>a.actor_id==='main')!.stats,row.initial_stats);samples.push(run.sample);fights++;}
 const mean=Object.fromEntries(['dps','normal_dps','skill_dps','team_dps','hps','sp_skips','sphere_skips','casts','interrupted','survivors','alive_ms'].map(k=>[k,samples.reduce((n,s)=>n+Number(s[k as keyof AuditSample]),0)/samples.length]));
 rows.push({job:row.build.job,encounter:row.encounter,build:row.build,before:row.summary.mean,after:mean,percent_dps:(mean.dps!/row.summary.mean.dps-1)*100,percent_team_dps:(mean.team_dps!/row.summary.mean.team_dps-1)*100,samples});
}
await writeFile(`plan/evidence/task-130-${phase}-comparison.json`,JSON.stringify({content_before:before.content_hash,content_after:content.manifest.content_hash,phase,fights,method:'Fixed pre-patch winners, no re-optimization. Identical initial stats, skill prices, 4 Active Awaken budget, Common60 gear and16 seeds asserted. New effect programs only.',rows},null,2)+'\n');
console.log(JSON.stringify({phase,fights,content_after:content.manifest.content_hash,rows:rows.filter(r=>r.encounter==='dummy').map(r=>({job:r.job,before:Math.round(r.before.dps),after:Math.round(r.after.dps!),change:Math.round(r.percent_dps)}))}));
