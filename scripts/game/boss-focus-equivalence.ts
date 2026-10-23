/** Verify that the final Plagiarism synchronization cannot alter the measured matrix. */
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateContent} from '../../src/content/loader.ts';
import {loadValidatedContent} from '../../src/content/index.ts';
import {canonical} from '../../src/content/value.ts';
import {AUDIT_CASES,auditBuilds,auditFixture,auditInput,auditFight} from './class-audit-fixtures.ts';
const original=JSON.parse(gunzipSync(await readFile('.local/balance/task-131/content-measured.json.gz')).toString());
const loaded=loadValidatedContent(),measured=validateContent(original);if(!loaded.ok||!measured.ok)throw Error('INVALID_CONTENT');
const final=loaded.value,old=measured.value;
assert.deepEqual(final.schemas,old.schemas);assert.equal(final.manifest.implementation_hash,old.manifest.implementation_hash);
const documents=structuredClone(final.documents),thief=documents['skills/thief.json'] as any,prior=old.documents['skills/thief.json']as any;
const id='rogue_copy_mage_fire_bolt';
thief.skills.find((s:{id:string})=>s.id===id).level_parameters.power=structuredClone(prior.skills.find((s:{id:string})=>s.id===id).level_parameters.power);
thief.awakened_variants[id].level_parameters.power=structuredClone(prior.awakened_variants[id].level_parameters.power);
assert.deepEqual(documents,old.documents,'only copied Fire Bolt base/Awaken power can change after measured content');
let fixtures=0,inputs=0;const inputHashes:string[]=[],examples=[];
for(const c of AUDIT_CASES)for(const build of auditBuilds(final,c.stage)){
 const a=auditFixture(build,c,old),b=auditFixture(build,c,final);assert.deepEqual(a.primary,b.primary);assert.deepEqual(a.costs,b.costs);fixtures++;
 for(const encounter of ['dummy','pressure']as const){
  const left=auditInput(a,encounter,old),right=auditInput(b,encounter,final);assert.deepEqual(left,right,`${c.id}:${build.id}:${encounter}`);inputs++;
  inputHashes.push(createHash('sha256').update(canonical(right)).digest('hex'));
  if(c.id==='class2-70-gear60'&&['wizard-1-magic','rogue-1-power'].includes(build.id)){
   const x=auditFight(left,22901,old),y=auditFight(right,22901,final);assert.deepEqual(x.sample,y.sample);
   const checkpoint={...structuredClone(y.final),content_hash:x.final.content_hash};assert.deepEqual(checkpoint,x.final);
   examples.push({condition:c.id,build:build.id,encounter,seed:22901,sample_identical:true,final_identical_except_content_hash:true});
  }
 }
}
const report={passed:true,measured_hash:old.manifest.content_hash,released_hash:final.manifest.content_hash,only_delta:'rogue_copy_mage_fire_bolt base and Awaken power synchronized to Fire Bolt; none of the bounded audit candidates equips that copied skill',fixtures,inputs,all_input_sha256:createHash('sha256').update(canonical(inputHashes)).digest('hex'),examples,method:'Schema and implementation hashes equal. All documents equal after restoring exactly two declared power arrays. Every complete compiled battle input, initial budget and cost equals the measured version. Four actual seed replays have identical samples and checkpoints except manifest content_hash. This is an equivalence proof, not a new full seed batch.'};
await writeFile('plan/evidence/task-131/content-equivalence.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
