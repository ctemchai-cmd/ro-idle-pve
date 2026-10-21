// M0 definition fingerprinting, not a runtime build or asset pack.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const data = path.join(root, 'plan/data');
const sha = value => createHash('sha256').update(value).digest('hex');
// Shared ASCII-key canonicalization/projection; no duplicate hash implementation.
import { canonical } from '../../src/content/value.ts';
import { engineProjection as project } from '../../scripts/game/content-projection.ts';
const fixed = ['progression','combat-rules','stat-definitions','status-effects','class-status-effects','effect-primitives','formula-registry','equipment','cards','slot-progress','economy','loot','gacha','stages','enemies','tower','daily-bosses','summon-actors','save-contracts','simulation-contracts'];
const files = [...fixed.map(n => path.join(data,n+'.json')), ...fs.readdirSync(path.join(data,'skills')).filter(n=>n.endsWith('.json')).map(n=>path.join(data,'skills',n))].sort();
const values = files.map(p => [path.relative(root,p), JSON.parse(fs.readFileSync(p,'utf8'))]);
const engineDataHash = sha(canonical(values.map(([p,d])=>[p,project(d)])));
const schemaFiles = fs.readdirSync(path.join(data,'schemas')).filter(n=>n.endsWith('.json')).sort().map(n=>path.join(data,'schemas',n));
const schemaHash = sha(canonical(schemaFiles.map(p=>[path.relative(root,p),JSON.parse(fs.readFileSync(p,'utf8'))])));
const presentationFiles = [path.join(data,'actor-presentations.json'),path.join(data,'strings.th.json'),...fs.readdirSync(path.join(data,'presentations')).map(n=>path.join(data,'presentations',n))].sort();
const allInputFiles = [...files,...schemaFiles,...presentationFiles];
const manifest = {
  schema_version:1, phase:'M0 authored data/contracts only', content_version:'class2-v1.0.0', rules_version:'combat-baseline-v1',
  engine_data_hash:engineDataHash, schema_hash:schemaHash,
  presentation_selection_hash:sha(canonical([...values,...presentationFiles.map(p=>[path.relative(root,p),JSON.parse(fs.readFileSync(p,'utf8'))])])),
  implementation_hash:null, runtime_asset_pack_hash:null,
  runtime_requirement:'TASK-015/019 must add implementation/asset hashes and refuse publish without them; M0 hash is not proof of replay/runtime correctness',
  input_sha256:Object.fromEntries(allInputFiles.map(p=>[path.relative(root,p),sha(fs.readFileSync(p))])),
  reference_builds:values.filter(([p])=>p.includes('/skills/')).map(([p,d])=>({source:p,build_ids:d.builds.map(b=>b.id)})),
};
const sample = structuredClone(values.find(([p])=>p.endsWith('/skills/swordsman.json'))[1]);
const before = canonical(project(sample)); sample.skills[0].presentation_id='another_visual';
if (canonical(project(sample))!==before) throw new Error('cosmetic mutation changed engine projection');
sample.skills[0].cost.sp = 999;
if (canonical(project(sample))===before) throw new Error('gameplay mutation missing from engine projection');
fs.writeFileSync(path.join(data,'release-content-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({engine_sources:files.length,schemas:schemaFiles.length,engine_data_hash:engineDataHash,cosmetic_projection_check:'pass',gameplay_projection_check:'pass',implementation:'not built'}));
