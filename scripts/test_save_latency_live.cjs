// Shared production save adapters in real Chrome + fresh Auth/API/Postgres; no personal/hosted account.
const fs=require('node:fs'),path=require('node:path'),{randomUUID,randomBytes,createHash,createHmac}=require('node:crypto');
const {createClient}=require('@supabase/supabase-js'),{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),prefix=process.env.RO_EVIDENCE_PREFIX||'task-063',base=process.env.RO_LIVE_URL,gateway=process.env.SUPABASE_URL;
if(!/^task-\d{3}$/.test(prefix)||process.env.RO_SUPABASE_LOCAL_STACK!=='1'||![base,gateway].every(u=>u&&new URL(u).hostname==='127.0.0.1'))throw new Error('ISOLATED_LOOPBACK_REQUIRED');
const assert=(ok,message)=>{if(!ok)throw new Error(message);},checks=[],samples=[],errors=[];
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
(async()=>{
 const admin=createClient(gateway,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),email='latency-'+randomUUID()+'@example.invalid',password=randomBytes(24).toString('base64url');
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert(!created.error&&created.data.user,'USER_CREATE_FAILED');const uid=created.data.user.id;
 let browser,page,stage='BOOT';const requests=[];let measure=false,drop=false,legacy=false,corrupt=false,hold=false,releaseSave;const dbSamples=[];
 try{
  const sdk=createClient(gateway,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),login=await sdk.auth.signInWithPassword({email,password});assert(!login.error&&login.data.session,'LOGIN_FAILED');
  browser=await chromium.launch({headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context=await browser.newContext({viewport:{width:390,height:844}});page=await context.newPage();page.on('pageerror',()=>errors.push('BROWSER_RUNTIME_ERROR'));
  await page.route('**/api/**',async route=>{
   const request=route.request(),url=new URL(request.url());if(measure)requests.push({method:request.method(),path:url.pathname});
   if(hold&&request.method()==='POST'&&url.pathname==='/api/commands')await new Promise(resolve=>{releaseSave=resolve;});
   await new Promise(resolve=>setTimeout(resolve,120)); // Equal, explicit network round-trip penalty for baseline/new paths.
   const response=await route.fetch();
   if(request.method()==='POST'&&url.pathname==='/api/commands'){
    const timing=response.headers()['server-timing']||'';dbSamples.push({type:request.postDataJSON().type,timing});
    if(drop){await route.abort('failed');return;}
    if(legacy||corrupt){const body=await response.json();if(legacy)delete body.checkpoint;if(corrupt&&body.checkpoint){body.checkpoint.save.state.wallet.gold++;corrupt=false;}await route.fulfill({response,json:body});return;}
   }
   await route.fulfill({response});
  });
  await page.goto(base+'/auth');await page.locator('.auth-card').waitFor();
  await page.evaluate(async ({uid,token})=>{
   const {SaveController}=await import('/src/client/save-controller.ts'),{createBrowserSavePorts}=await import('/src/client/save-browser.ts');
   const {loadValidatedContent}=await import('/src/content/index.ts');window.__versions=loadValidatedContent().value.manifest;
   const auth={getAccessToken:async()=>token,snapshot:{user:{id:uid}},markUnauthorized(){}};
   window.__ports=createBrowserSavePorts(auth,'latency-fixture',localStorage,navigator.locks);window.__save=new SaveController(window.__ports);await window.__save.start(uid);
   window.__command=(type,params)=>({type,params,request_id:crypto.randomUUID(),expected_revision:window.__save.snapshot.checkpoint?.save.revision??0,schema_version:1,content_version:window.__versions.content_version,rules_version:window.__versions.rules_version,content_hash:window.__versions.content_hash});
   window.__submit=async(type,params)=>{const c=window.__command(type,params);await window.__save.submit(c);return{request_id:c.request_id,status:window.__save.snapshot.status,outcome:window.__save.snapshot.lastReceipt?.outcome,code:window.__save.snapshot.lastReceipt?.result.code,revision:window.__save.snapshot.checkpoint?.save.revision};};
  },{uid,token:login.data.session.access_token});
  const row=async()=>{const r=await admin.from('game_saves').select('*').eq('account_id',uid).single();assert(!r.error,'FIXTURE_READ_FAILED');return r.data;};
  const submit=async(type,params)=>{requests.length=0;measure=true;const at=performance.now();let reply;try{reply=await page.evaluate(async({type,params})=>window.__submit(type,params),{type,params});}finally{measure=false;}return{...reply,elapsed_ms:Math.round(performance.now()-at),requests:[...requests]};};
  const single=result=>assert(result.status==='ready'&&result.outcome==='committed'&&result.requests.length===1&&result.requests[0].method==='POST','NOT_SINGLE_REQUEST:'+JSON.stringify(result));
  stage='CREATE';const creation=await submit('account.create',{root_job_id:'mage',gender:'male'});single(creation);samples.push({type:'account.create',...creation});
  const initial=await row(),state=initial.state;for(const key of Object.keys(state.wallet))state.wallet[key]=100000;
  const hash=createHash('sha256').update(canonical(state)).digest('hex'),signature=createHmac('sha256',process.env.SAVE_SIGNING_KEY).update(canonical({account_id:uid,revision:initial.revision,state_hash:hash,content_hash:initial.content_hash,schema_version:1,key_version:1})).digest('base64url');
  assert(!(await admin.from('game_saves').update({state,state_hash:hash}).eq('account_id',uid)).error,'FIXTURE_WALLET_FAILED');
  assert(!(await admin.from('game_save_history').update({state,state_hash:hash,signature}).eq('account_id',uid).eq('revision',initial.revision)).error,'FIXTURE_SIGNATURE_FAILED');
  await page.evaluate(()=>window.__save.reconnect());
  const main=state.roster.find(a=>a.is_main)||state.roster[0];
  stage='MUTATIONS';
  for(const [type,params]of[
   ['character.level_up',{character_id:main.character_id,target_level:10}],
   ['skill.upgrade',{character_id:main.character_id,skill_id:'mage_fire_bolt',target_level:2}],
   ['skill.set_loadout',{character_id:main.character_id,skill_ids:['mage_fire_bolt',null,null,null]}],
   ['equipment.purchase_weapon',{character_id:main.character_id,weapon_type:'staff',tier_level:1}],
   ['party.set',{placements:state.team}]
  ]){const result=await submit(type,params);single(result);assert(result.code&&!/INVALID|INSUFFICIENT|NOT_FOUND/.test(result.code),'MUTATION_REJECTED:'+result.code);samples.push({type,...result});}
  checks.push('Creation, level, skill upgrade/loadout, equipment and team use one actual HTTP POST with a schema/hash/owner-validated DB checkpoint');
  stage='BASELINE';const pairs=[];
  for(let i=0;i<3;i++){
   requests.length=0;measure=true;const before=performance.now();await page.evaluate(async placements=>{const c=window.__command('party.set',{placements});await window.__ports.send(c);await window.__ports.receipt(c.request_id);await window.__ports.checkpoint();},state.team);measure=false;
   const old={requests:[...requests],elapsed_ms:Math.round(performance.now()-before)};assert(old.requests.length===3,'BASELINE_NOT_THREE_REQUESTS');
   await page.evaluate(()=>window.__save.reconnect());const next=await submit('party.set',{placements:state.team});single(next);pairs.push({old_protocol:old,combined:next});
  }
  samples.push({paired_protocol_benchmark:pairs,injected_network_delay_ms_per_request:120});
  assert(pairs.every(p=>p.combined.elapsed_ms<p.old_protocol.elapsed_ms),'NO_CONTROLLED_LATENCY_IMPROVEMENT:'+JSON.stringify(pairs.map(p=>({old:p.old_protocol.elapsed_ms,combined:p.combined.elapsed_ms}))));
  checks.push('Three matched party commands compare historical POST/receipt/checkpoint against combined POST with identical120ms network delay per request');
  stage='LOSS';const beforeLoss=await row();drop=true;const loss=await submit('party.set',{placements:state.team});drop=false;samples.push({dropped_reply:loss});assert(loss.status==='offline','LOSS_NOT_PAUSED:'+JSON.stringify(loss));
  const afterLoss=await row();assert(afterLoss.revision===beforeLoss.revision+1,'LOSS_NOT_COMMITTED_ONCE');requests.length=0;measure=true;await page.evaluate(()=>window.__save.reconnect());measure=false;
  assert((await row()).revision===afterLoss.revision&&requests.some(r=>r.path.includes('/api/receipts/'))&&!requests.some(r=>r.method==='POST'),'RECOVERY_REPEATED_WRITE');
  checks.push('Dropped committed combined reply retains UUID; reconnect checks original receipt and canonical checkpoint without another write');
  stage='LEGACY';legacy=true;const fallback=await submit('party.set',{placements:state.team});legacy=false;assert(fallback.status==='ready'&&fallback.requests.length===2&&fallback.requests[1].path==='/api/checkpoint','LEGACY_FALLBACK_INVALID');samples.push({legacy_fallback:fallback});
  stage='CORRUPT';corrupt=true;const bad=await submit('party.set',{placements:state.team});assert(bad.status==='offline','CORRUPT_CHECKPOINT_ACCEPTED');await page.evaluate(()=>window.__save.reconnect());assert(await page.evaluate(()=>window.__save.snapshot.status)==='ready','CORRUPT_RECONCILE_FAILED');
  checks.push('Receipt-only compatibility uses POST+checkpoint without redundant receipt lookup; tampered inline state hash is rejected and reconciled');
  await page.evaluate(()=>window.__save.dispose());
  if(prefix==='task-064'){
   stage='DATABASE_ROUNDS';const recurring=dbSamples.filter(s=>s.type!=='account.create');
   assert(recurring.length>=5&&recurring.every(s=>/db_read;dur=[\d.]+;desc="1 calls"/.test(s.timing)&&/db_commit;dur=[\d.]+;desc="1 calls"/.test(s.timing)&&!/db_(environment|receipt|context);/.test(s.timing)),'DATABASE_ROUNDTRIPS_NOT_REDUCED');
   samples.push({database_roundtrips:recurring.slice(0,5)});
   checks.push('Real recurring commands read context/receipt in one DB RPC and commit/return the DB checkpoint in one RPC; no additional context/receipt/environment HTTP calls');
   stage='ACTUAL_UI';await page.getByLabel('อีเมล',{exact:true}).fill(email);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(password);await page.getByRole('button',{name:'เข้าสู่บัญชี',exact:true}).click();
   await page.waitForTimeout(300);await page.goto(base+'/play?v=buddy');await page.locator('.hud-save.ok').waitFor();
   await page.getByRole('button',{name:'Upgrade',exact:true}).click();await page.locator('.level-jump > b').first().filter({hasText:'Lv.10'}).waitFor();
   const devtools=await context.newCDPSession(page);await devtools.send('Emulation.setCPUThrottlingRate',{rate:4});
   hold=true;const started=performance.now();await page.getByRole('button',{name:'อัป +1',exact:true}).click();
   await page.locator('.level-jump > b').first().filter({hasText:'Lv.11'}).waitFor({timeout:1500});const displayMs=Math.round(performance.now()-started);
   assert(displayMs<1000,'LEVEL_DISPLAY_WAITS_FOR_NETWORK');assert((await row()).state.roster.find(a=>a.character_id==='main').level===10,'HELD_WRITE_ALREADY_COMMITTED');
   await page.waitForFunction(()=>!!document.querySelector('.hud-save.busy'));
   await page.screenshot({path:path.join(root,'plan/evidence/task-064-level-immediate.png')});
   assert(releaseSave,'SAVE_NOT_SENT');hold=false;releaseSave();await page.locator('.hud-save.ok').waitFor();
   assert((await row()).state.roster.find(a=>a.character_id==='main').level===11,'LEVEL_NOT_SAVED');
   await devtools.send('Emulation.setCPUThrottlingRate',{rate:1});await page.reload();await page.locator('.hud-save.ok').waitFor();assert((await row()).state.roster.find(a=>a.character_id==='main').level===11,'RELOAD_LOST_LEVEL');
   samples.push({actual_mobile_ui_click_to_level_ms:displayMs,cpu_throttling:4,server_reply_held_until_after_preview:true});
   checks.push('Actual mobile game UI level-up renders before a deliberately held server request under4x CPU throttle; release saves once and reload retains the level');
  }
 }catch(error){errors.push(stage+':'+String(error));}
 finally{
  if(browser)await browser.close();if((await admin.auth.admin.deleteUser(uid)).error)errors.push('FIXTURE_CLEANUP_FAILED');
  const refs=['api/index.ts','src/client/save-controller.ts','src/client/save-browser.ts','scripts/test_save_latency_live.cjs'];
  const report={task_id:prefix.toUpperCase(),passed:checks.length===(prefix==='task-064'?6:4)&&!errors.length,checks,errors,samples,owner_cloud_writes:false,personal_preview_restarted:false,input_sha256:Object.fromEntries(refs.map(ref=>[ref,createHash('sha256').update(fs.readFileSync(path.join(root,ref))).digest('hex')])),scope:'Actual fresh local Auth/PostgREST/Postgres and Chrome. TASK064 additionally clicks the real mobile game UI with server response held and4x CPU throttle. Equal artificial120ms request delay benchmarks protocol overhead, not actual owner phone/network latency. Wallet is a signed synthetic fixture; no owner login or cloud access.'};
  fs.writeFileSync(path.join(root,`plan/evidence/${prefix}-save-latency-live.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
 }
})().catch(error=>{console.error('LATENCY_TEST_FAILED');process.exitCode=1;});
