// Temporary production-only benchmark, excluded from the deployed app routes.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const folder=path.join(root,'.local/perf-176');fs.mkdirSync(folder,{recursive:true});
const source=fs.readFileSync(path.join(root,'scripts/test_actor_tween_performance.cjs'),'utf8'),marker=' await page.evaluate(async()=>{',start=source.indexOf(marker)+marker.length,end=source.indexOf('\n });\n',start);
if(start<marker.length||end<start)throw Error('FIXTURE_SLICE');
const body=source.slice(start,end).replace("'/node_modules/.vite/deps/react.js'","'react'").replace("'/node_modules/.vite/deps/react-dom_client.js'","'react-dom/client'");
fs.writeFileSync(folder+'/fixture.mjs','await(async()=>{'+body+'\n})();window.perfReady176=true;');
fs.writeFileSync(folder+'/fixture.html','<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script type="module" src="./fixture.mjs"></script></body></html>');
const baseline=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'plan/evidence/task-176/before.json.gz'))));
const frozen=['src/client/combat-status.ts','src/ui/game/combat-status.tsx','src/ui/game/kit.tsx','src/ui/skill-timeline.tsx'];
for(const mode of['before','after']){
 const out='/private/tmp/ro-176-prod/'+mode;
 await build({root,envDir:folder,envPrefix:'RO_PERF_PUBLIC_',base:'/'+mode+'/',build:{outDir:out,emptyOutDir:true,rollupOptions:{input:folder+'/fixture.html'}},plugins:[{name:'frozen-presentation-baseline176',enforce:'pre',load(id){const file=path.relative(root,id);if(mode==='before'&&frozen.includes(file))return baseline[file];}}]});
 fs.copyFileSync(out+'/.local/perf-176/fixture.html',out+'/index.html');
}
const ro='/private/tmp/ro-176-prod/ro';if(!fs.existsSync(ro))fs.symlinkSync(path.join(root,'dist/ro'),ro,'dir');
