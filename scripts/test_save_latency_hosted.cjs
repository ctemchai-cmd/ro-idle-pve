// Public production proof only: no owner credentials, commands, checkpoints or state writes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base='https://ro-idle-pve.vercel.app',checks=[],errors=[],mutations=[],prefix=process.env.RO_EVIDENCE_PREFIX||'task-063';
if(!/^task-\d{3}$/.test(prefix))throw new Error('INVALID_EVIDENCE_PREFIX');
const expectedContent=process.env.RO_EXPECT_CONTENT_HASH||(['task-068','task-069','task-070','task-071'].includes(prefix)?JSON.parse(fs.readFileSync(path.join(root,'src/generated/runtime-manifest.json'),'utf8')).content_hash:'768e12a49bf339711d44f501c3710374adbcd10d9eb74d6a2e6f9b8aa79330af');
const assert=(ok,message)=>{if(!ok)throw new Error(message);};let browser,profile,failure;
(async()=>{
 const samples=[];
 for(const route of ['/api/health','/api/checkpoint','/api/health']){
  const at=performance.now(),r=await fetch(base+route,{cache:'no-store',signal:AbortSignal.timeout(20000)}),body=await r.json();
  assert(r.status===(route==='/api/checkpoint'?401:200),'PUBLIC_API_STATUS');assert(r.headers.get('x-ro-api-region')==='sin1','API_NOT_SINGAPORE');assert(/total;dur=/.test(r.headers.get('server-timing')||''),'TIMING_MISSING');assert(r.headers.get('cache-control').includes('no-store'),'PRIVATE_CACHE_POLICY');
  if(route==='/api/health')assert(body.ok&&body.content_hash===expectedContent,'CONTENT_CHANGED');
  samples.push({route,status:r.status,elapsed_ms:Math.round(performance.now()-at),api_region:r.headers.get('x-ro-api-region'),vercel_id:r.headers.get('x-vercel-id'),server_timing:r.headers.get('server-timing')});
 }
 checks.push({case_id:'hosted_region_timing_auth_gate_content',passed:true,samples});
 const r=await fetch(base+'/content-version.json',{cache:'no-store'}),manifest=await r.json();
 const row=manifest.build_files.find(r=>/^dist\/assets\/account-session-.*\.js$/.test(r.path));assert(row,'NO_SAVE_BUNDLE');
 const bundle=await(await fetch(base+'/'+row.path.replace(/^dist\//,''))).text();assert(bundle.includes('sendWithCheckpoint')&&bundle.includes('x-ro-checkpoint'),'OLD_SAVE_PROTOCOL_DEPLOYED');
 if(prefix==='task-064')assert(bundle.includes('preview:')&&bundle.includes('character.level_up'),'IMMEDIATE_DISPLAY_NOT_DEPLOYED');
 if(prefix==='task-067'){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path));assert(shell,'NO_GAME_SHELL_BUNDLE');
  const source=await(await fetch(base+'/'+shell.path.replace(/^dist\//,''))).text();assert(source.includes('daily-clock:essence:2026-10-21')&&source.includes('daily-clock-incident-2026-10-21'),'DAILY_FIX_AND_REFUND_UI_NOT_DEPLOYED');
 }
 if(prefix==='task-066'){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path));assert(shell,'NO_GAME_SHELL_BUNDLE');
  const source=await(await fetch(base+'/'+shell.path.replace(/^dist\//,''))).text();assert(source.includes('bag-window')&&source.includes('data-window-start'),'VIRTUAL_INVENTORY_NOT_DEPLOYED');
 }
 if(['task-068','task-069'].includes(prefix)){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path));assert(shell,'NO_GAME_SHELL_BUNDLE');
  const source=await(await fetch(base+'/'+shell.path.replace(/^dist\//,''))).text();assert(source.includes('combat-status-strip')&&source.includes('sphere-counter')&&source.includes('status-instance-list'),'STATUS_AND_SPHERES_NOT_DEPLOYED');
  if(prefix==='task-069')assert(source.includes('boss-status-panel')&&source.includes('data-skill-icon')&&!source.includes('farm-status-toggle'),'COMPACT_STATUS_POLISH_NOT_DEPLOYED');
 }
 if(prefix==='task-070'){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path));assert(shell,'NO_GAME_SHELL_BUNDLE');
  const source=await(await fetch(base+'/'+shell.path.replace(/^dist\//,''))).text();assert(source.includes('battle-history')&&source.includes('history-event-list')&&source.includes('recordedTimeline'),'BATTLE_HISTORY_NOT_DEPLOYED');
 }
 if(prefix==='task-071'){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path)),render=manifest.build_files.find(r=>/^dist\/assets\/skill-timeline-.*\.js$/.test(r.path));assert(shell&&render,'NO_HEALING_BUNDLES');
  const [ui,renderer]=await Promise.all([shell,render].map(async row=>(await fetch(base+'/'+row.path.replace(/^dist\//,''))).text()));
  assert(ui.includes('healing_aura')&&ui.includes('battle-history')&&renderer.includes('healing_auras'),'HOT_AURA_AND_HISTORY_NOT_DEPLOYED');
 }
 checks.push({case_id:'hosted_shared_save_bundle',passed:true,path:row.path,sha256:createHash('sha256').update(bundle).digest('hex'),combined_reply:true});
 profile=fs.mkdtempSync(path.join(os.tmpdir(),'ro-save-hosted-'));const context=await chromium.launchPersistentContext(profile,{headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',viewport:{width:390,height:844}});browser=context.browser();
 context.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))mutations.push({method:r.method(),path:new URL(r.url()).pathname});});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/');await page.getByRole('heading',{name:'เข้าสู่บัญชี',exact:true}).waitFor();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const inventory=await page.evaluate(async()=>Object.fromEntries(await Promise.all((await caches.keys()).map(async name=>[name,(await(await caches.open(name)).keys()).map(r=>new URL(r.url).pathname)]))));
 assert(Object.values(inventory).flat().length===5&&!Object.values(inventory).flat().some(p=>p.startsWith('/api/')||p.startsWith('/assets/')),'PWA_CACHES_GAME_STATE');
 assert(!errors.length&&!mutations.length,'BROWSER_ERROR_OR_MUTATION');checks.push({case_id:'hosted_login_pwa_no_private_cache',passed:true,login_visible:true,cache:inventory,mutations});
})().catch(error=>{failure=error.stack;console.error(error);process.exitCode=1;}).finally(async()=>{
 if(browser)await browser.close();if(profile)fs.rmSync(profile,{recursive:true,force:true});
 fs.writeFileSync(path.join(root,`plan/evidence/${prefix}-hosted.json`),JSON.stringify({task_id:prefix.toUpperCase(),date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'}),source_commit:process.env.RO_DEPLOY_COMMIT||null,origin:base,passed:checks.length===3&&!failure&&!errors.length&&!mutations.length,checks,errors,failure,owner_cloud_writes:false,personal_preview_restarted:false,scope:'Signed-out actual production health/401 gate/new shared-save bundle/login/PWA only. No owner command latency or owner save access; actual mutations/failures tested on isolated stack. TASK064 optional SQL007 installation and cloud2RPC timing are not verified here.'},null,2)+'\n');
});
