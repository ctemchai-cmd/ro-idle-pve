// Disposable real Auth/API/Postgres plus public read-only native preview. No owner save.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{randomUUID,randomBytes}=require('node:crypto');
const{createClient}=require('@supabase/supabase-js'),{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.RO_LIVE_URL,gateway=process.env.SUPABASE_URL,check=(v,m)=>assert.ok(v,m),evidence=n=>path.join(root,'plan/evidence/'+n);
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1'||![base,gateway].every(u=>u&&new URL(u).hostname==='127.0.0.1'))throw Error('ISOLATED_REQUIRED');
const ts=(file,input)=>JSON.parse(execFileSync(process.execPath,['--import','tsx',path.join(root,file)],{cwd:root,env:process.env,input:JSON.stringify(input)}).toString());
(async()=>{let browser,page,preview,uid,failure,stage='SETUP';const checks=[],errors=[],writes=[],media=[],samples=[];
 const admin=createClient(gateway,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const email='preview-'+randomUUID()+'@example.invalid',password=randomBytes(24).toString('base64url'),u=await admin.auth.admin.createUser({email,password,email_confirm:true});check(!u.error,'USER');uid=u.data.user.id;
  const client=createClient(gateway,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),login=await client.auth.signInWithPassword({email,password});check(!login.error,'LOGIN');const token=login.data.session.access_token;
  const v=JSON.parse(fs.readFileSync(path.join(root,'src/generated/runtime-manifest.json'))),versions={schema_version:1,content_version:v.content_version,content_hash:v.content_hash,rules_version:v.rules_version};
  const command=(type,params,revision)=>({type,params,expected_revision:revision,request_id:randomUUID(),...versions});
  const send=async c=>{const r=await fetch(gateway+'/api/commands',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(c)});return{status:r.status,body:await r.json()};};
  const read=async()=>{const r=await admin.from('game_saves').select('*').eq('account_id',uid).single();check(!r.error,'READ');return r.data;};
  check((await send(command('account.create',{root_job_id:'mage',gender:'female'},0))).body.receipt?.outcome==='committed','CREATE');
  const old=await read(),state=ts('scripts/game/story-expansion-fixture.ts',{}),stages=JSON.parse(fs.readFileSync(path.join(root,'plan/data/stages.json'))).stages;
  state.story.cleared_stage_ids=stages.filter(s=>s.chapter<=9).map(s=>s.id);
  const revision=old.revision+1,signed=ts('scripts/game/sign-test-save.ts',{account_id:uid,revision,state});
  const hist=await admin.from('game_save_history').insert({account_id:uid,revision,state,state_hash:signed.state_hash,signature:signed.signature,key_version:1});check(!hist.error,'HISTORY_'+(hist.error?.code??'')+'_'+(hist.error?.message??''));check(!(await admin.from('game_saves').update({revision,state,state_hash:signed.state_hash}).eq('account_id',uid)).error,'SAVE');
  for(const id of['10-1','11-1','12-1']){const before=await read(),r=await send(command('battle.start_story',{stage_id:id},before.revision));check(r.body.receipt?.result?.code==='STAGE_LOCKED','FUTURE_BOSS_LOCK_'+id);const after=await read();assert.deepEqual(after.state,before.state);}
  for(const id of['10-1','11-1','12-1']){const before=await read(),r=await send(command('farm.set_stage',{stage_id:id},before.revision));check(r.body.receipt?.result?.code==='FARM_STAGE_NOT_CLEARED','FUTURE_FARM_LOCK_'+id);assert.deepEqual((await read()).state,before.state);}
  checks.push('Actual API rejects all3 dormant chapter starts/farm without durable state changes');
  browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/auth');await page.getByLabel('อีเมล',{exact:true}).fill(email);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(password);await page.getByRole('button',{name:'เข้าสู่บัญชี',exact:true}).click();await page.getByRole('heading',{name:'เข้าสู่บัญชี',exact:true}).waitFor({state:'hidden'});await page.goto(base+'/play');await page.getByRole('button',{name:/^เลือกเซฟ 1(?: ·|$)/}).click();await page.locator('.hud-save.ok').waitFor();
  stage='LOCKED_MAP';await page.getByRole('button',{name:'รอ Hi-class',exact:true}).waitFor();check(await page.getByRole('button',{name:'รอ Hi-class',exact:true}).isDisabled(),'WAITING_DISABLED');
  for(const width of[390,320]){await page.setViewportSize({width,height:844});await page.getByRole('button',{name:'เปิดแผนที่และเลือกด่าน',exact:true}).click();for(const chapter of[10,11,12]){await page.getByRole('tab',{name:'บท '+chapter,exact:true}).click();check(await page.locator('.stage-cell').count()===50,'FIFTY_CELLS');check(await page.locator('.stage-cell:not(:disabled)').count()===0,'FUTURE_CELL_ENABLED');check((await page.locator('.chapter-release-gate').innerText()).includes(chapter===12?'Awaken':'Hi-class'),'GATE_LABEL');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'MAP_OVERFLOW');await page.screenshot({path:evidence(`task-118-chapter${chapter}-${width}.png`)});}await page.getByRole('button',{name:'ปิด',exact:true}).click();}
  await page.getByRole('button',{name:'ตั้งค่า',exact:true}).click();const link=page.getByRole('link',{name:'Skill Preview',exact:true});check(await link.getAttribute('target')==='_blank','SAFE_NEW_TAB');await page.getByRole('button',{name:'ปิด',exact:true}).click();
  checks.push('Actual390/320 maps show3 future50-cell chapters locked, Hi/Awaken messages and disabled waiting button; Settings new-tab preview');
  stage='PUBLIC_PREVIEW';preview=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});preview.on('pageerror',e=>errors.push(e.message));preview.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname);if(/\.webp|\.png|\.wav|\.ogg/.test(r.url()))media.push(r.url());});
  await preview.goto(base+'/skill-preview?job=monk&skill=monk_asura&rank=10');await preview.locator('.skill-preview[data-ready="true"]').waitFor({timeout:30000});check(await preview.getByLabel('อาชีพ',{exact:true}).locator('option').count()===19,'JOBS');
  await preview.getByRole('button',{name:'เปิดเสียง',exact:true}).click();check(await preview.getByRole('button',{name:'ปิดเสียง',exact:true}).getAttribute('aria-pressed')==='true','AUDIO_ENABLED');await preview.getByRole('button',{name:'เล่นใหม่',exact:true}).click();await preview.locator('.skill-preview[data-ready="true"]').waitFor();await preview.waitForTimeout(4200);await preview.screenshot({path:evidence('task-119-asura-390.png')});await preview.locator('.sp-log summary').click();check((await preview.locator('.sp-log').innerText()).includes('ดาเมจ'),'ASURA_OUTCOME');
  check(media.some(u=>/\.(wav|ogg)(\?|$)/.test(u)),'REAL_SFX_FETCH');
  for(const width of[320,390]){await preview.setViewportSize({width,height:844});check(await preview.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'PREVIEW_OVERFLOW');await preview.screenshot({path:evidence(`task-119-layout-${width}.png`)});}
  checks.push('Public native Asura rank10 with real spheres/damage/SFX,320390 layout and zero owner/account writes');
  stage='ALL_JOBS';const jobs=await preview.getByLabel('อาชีพ',{exact:true}).locator('option').evaluateAll(o=>o.map(e=>e.value));
  for(const job of jobs){await preview.getByLabel('อาชีพ',{exact:true}).selectOption(job);await preview.waitForFunction(j=>document.querySelector('.skill-preview[data-ready="true"]')&&document.querySelector('select[aria-label="อาชีพ"]').value===j,job);check(await preview.locator('.sp-skills button').count()>=5,'SKILLS_'+job);samples.push({job,icons:await preview.locator('.sp-skills img').count()});check(samples.at(-1).icons===await preview.locator('.sp-skills button').count(),'ICON_MISSING_'+job);}
  // Rapid selection bypasses waits deliberately; final scene must win despite older in-flight media.
  for(const job of['wizard','monk','dancer','alchemist','sage'])await preview.getByLabel('อาชีพ',{exact:true}).selectOption(job);
  await preview.getByRole('button',{name:'Spell Breaker',exact:true}).click();await preview.waitForFunction(()=>document.querySelector('.skill-preview[data-ready="true"][data-skill="sage_spell_breaker"]'));
  await preview.waitForTimeout(3400);check((await preview.locator('.sp-log').innerText()).includes('ขัดร่าย'),'SPELL_BREAKER_CONTEXT');await preview.screenshot({path:evidence('task-119-spell-breaker-390.png')});
  await preview.getByRole('button',{name:'หยุดชั่วคราว',exact:true}).click();const paused=await preview.locator('.sp-clock').innerText();await preview.waitForTimeout(350);check(await preview.locator('.sp-clock').innerText()===paused,'PAUSE_CLOCK');await preview.getByRole('button',{name:'เล่นต่อ',exact:true}).click();
  await preview.getByRole('button',{name:'ความเร็ว',exact:true}).click();check((await preview.getByRole('button',{name:'ความเร็ว',exact:true}).innerText()).includes('2'),'SPEED');
  for(const[job,skill]of[['bard','Healing Song'],['alchemist','Hell Plant'],['monk','Call Spirits']]){await preview.getByLabel('อาชีพ',{exact:true}).selectOption(job);await preview.getByRole('button',{name:skill,exact:true}).click();await preview.locator('.skill-preview[data-ready="true"]').waitFor();await preview.waitForTimeout(2300);await preview.screenshot({path:evidence('task-119-'+job+'-390.png')});}
  await preview.getByLabel('เลเวลสกิล',{exact:true}).selectOption('10');await preview.locator('.skill-preview[data-ready="true"][data-rank="10"]').waitFor();check(new URL(preview.url()).searchParams.get('rank')==='10','QUERY_RANK');
  stage='VISIBILITY';
  await preview.getByRole('button',{name:'เล่นใหม่',exact:true}).click();await preview.locator('.skill-preview[data-ready="true"]').waitFor();await preview.waitForTimeout(250);
  await preview.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await preview.waitForTimeout(150);const hiddenClock=await preview.locator('.sp-clock').innerText();await preview.waitForTimeout(400);check(await preview.locator('.sp-clock').innerText()===hiddenClock,'HIDDEN_CLOCK');
  await preview.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await preview.waitForTimeout(250);check(await preview.locator('.sp-clock').innerText()!==hiddenClock,'RESUME_CLOCK');
  await preview.setViewportSize({width:844,height:390});check(await preview.locator('.sp-rotate').isVisible(),'PORTRAIT_LOCK');await preview.setViewportSize({width:390,height:844});
  const emblem=await preview.locator('.class-icon img').boundingBox();check(emblem.width<=28&&emblem.height<=28,'EMBLEM_BOUNDS');
  checks.push('Injected browser visibility gate pauses/resumes virtual time without catchup; actual native profession emblem stays28px');
  stage='FUTURE_NATIVE_ART';
  const native=await browser.newPage({viewport:{width:720,height:600}});await native.goto(base+'/skill-preview');await native.locator('.skill-preview[data-ready="true"]').waitFor();
  const rendered=await native.evaluate(async state=>{
   const{previewStorySession}=await import('/src/client/story.ts'),{AssetPack}=await import('/src/renderer/pack.ts'),{drawActor}=await import('/src/renderer/native.mjs');
   const pack=await AssetPack.open();const ids=['10-40','10-50','11-10','11-40','11-50','12-10','12-20','12-30','12-40','12-50'];
   const canvas=document.createElement('canvas');canvas.width=720;canvas.height=600;canvas.style.cssText='display:block;width:720px;height:600px;background:#e8eff8';document.body.replaceChildren(canvas);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.font='12px system-ui';const out=[];
   for(const[i,id]of ids.entries()){
    const session=previewStorySession(state,id);await pack.prepare(session.scene,session.initial.actors.flatMap(a=>a.active_slots.filter(Boolean)));
    const look=session.scene.actors.find(a=>a.actor_id==='enemy_front'),parts=pack.actors.get('enemy_front');const x=(i%5)*144+72,y=Math.floor(i/5)*300+235;
    ctx.fillStyle='#fff';ctx.fillRect(x-70,y-220,140,275);drawActor(ctx,parts,'idle',300,x,y,'left',.8);ctx.fillStyle='#263f68';ctx.textAlign='center';ctx.fillText(id,x,y+23);ctx.fillText(session.scene.title,x,y+41,134);out.push({stage:id,meta:look.body_meta,width:parts.body.image.naturalWidth,drawn:true});
   }pack.dispose();return out;
  },state);
  check(rendered.length===10&&rendered.every(r=>r.drawn&&r.width>0),'NATIVE10');samples.push({native_new_bosses:rendered});await native.screenshot({path:evidence('task-118-native-bosses.png')});await native.close();
  checks.push('All10 newly selected native boss atlases decode and render a sampled east-flipped idle pose; not exhaustive animation review');
  check(!writes.length&&!errors.length,'BROWSER_ERRORS_OR_PREVIEW_WRITES');
  checks.push('All19 jobs native icons/actors prepare; rapid selection final Sage, real interrupt, pause/replay/speed/rank/query and heal/plant/sphere scenes');
 }catch(e){failure=stage+': '+e.message;try{await(preview??page)?.screenshot({path:evidence('task-118-119-ui-failure.png')});}catch{}}
 finally{await browser?.close();if(uid)await admin.auth.admin.deleteUser(uid);const report={task_ids:['TASK-118','TASK-119'],passed:checks.length===6&&!failure,checks,errors,preview_writes:writes,samples,media_requests:media.length,failure,scope:'Disposable account with current released180 stages. Preview is public and read-only. No owner access, Android latency or balance win-rate claim.'};fs.writeFileSync(evidence('task-118-119-ui-live.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
})().catch(()=>{console.error('PREVIEW_SETUP_REDACTED');process.exitCode=1;});
