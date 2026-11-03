import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';import{gunzipSync}from'node:zlib';
import config from'../../plan/generators/artifact-randomization.json';
const pack=JSON.parse(readFileSync('runtime/ro/manifest.json','utf8')),old=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-190/pack-before.json.gz')).toString()),hash=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
test('all13 class jewelry images are the explicitly selected local source pixels, never skill art',()=>{
 assert.equal(Object.keys(config.profiles).length,13);assert.equal(Object.keys(pack.shell.artifact_icons).length,13);
 for(const[job,p]of Object.entries(config.profiles)){const ref=pack.shell.artifact_icons[job],asset=pack.assets[ref.asset_id];assert.equal(ref.source_name,p.source_path);assert(p.source_path.startsWith('assets/modern/item/jewelry/'));assert.equal(asset.category,'items');assert.equal(hash('runtime/ro/payload/'+asset.media_path),hash(p.source_path),job);assert.equal(hash('assets/ro/'+asset.media_path),hash(p.source_path));}
});
test('jewelry pack preserves every retained native media byte and remains below original mobile budgets',()=>{
 for(const f of pack.files as{path:string;sha256:string}[]){const prior=old.files.find((p:{path:string})=>p.path===f.path);if(prior&&!f.path.endsWith('.json'))assert.equal(f.sha256,prior.sha256,f.path);assert.equal(hash('runtime/ro/payload/'+f.path),f.sha256);}
 assert(pack.sizes.media_and_sidecar_bytes+pack.sizes.manifest_bytes<33554432);assert(pack.sizes.initial_profile_raw_bytes<=old.sizes.initial_profile_raw_bytes);
});
