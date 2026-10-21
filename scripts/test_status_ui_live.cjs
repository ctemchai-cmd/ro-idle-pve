// Actual mobile game + throwaway Auth/SQL only. No balance runner or production account.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{randomUUID,randomBytes}=require('node:crypto');
const {createClient}=require('@supabase/supabase-js'),{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.RO_LIVE_URL,gateway=process.env.SUPABASE_URL;
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1'||![base,gateway].every(u=>u&&new URL(u).hostname==='127.0.0.1'))throw new Error('ISOLATED_STACK_REQUIRED');
const prefix=process.env.RO_EVIDENCE_PREFIX||'task-069';if(!/^task-\d{3}$/.test(prefix))throw new Error('INVALID_EVIDENCE_PREFIX');
const assert=(ok,m)=>{if(!ok)throw new Error(m);},runTs=(file,input)=>JSON.parse(execFileSync(process.execPath,['--import','tsx',path.join(root,file)],{input:JSON.stringify(input),env:process.env,cwd:root}).toString());
(async()=>{
 const admin=createClient(gateway,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),email='statuses-'+randomUUID()+'@example.invalid',password=randomBytes(24).toString('base64url');
 const user=await admin.auth.admin.createUser({email,password,email_confirm:true});assert(!user.error&&user.data.user,'CREATE_FIXTURE_USER');const uid=user.data.user.id;
 let browser,error=null;const checks=[],errors=[],commands=[],measurements={};
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname==='/api/commands')commands.push(r.postDataJSON().type);});
  await page.goto(base+'/auth');await page.getByLabel('อีเมล',{exact:true}).fill(email);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(password);await page.getByRole('button',{name:'เข้าสู่บัญชี',exact:true}).click();await page.getByRole('heading',{name:'เข้าสู่บัญชี',exact:true}).waitFor({state:'hidden'});await page.goto(base+'/play');
  const ready=()=>page.locator('.hud-save.ok').waitFor({timeout:25000});await page.getByRole('radio',{name:/^Acolyte/}).click();await page.getByRole('button',{name:'เริ่มการเดินทาง',exact:true}).click();await ready();
  await page.goto('about:blank');const r=await admin.from('game_saves').select('*').eq('account_id',uid).single();assert(!r.error,'READ_FIXTURE_SAVE');
  const state=runTs('scripts/game/status-ui-fixture.ts',r.data.state),revision=r.data.revision+1,signed=runTs('scripts/game/sign-test-save.ts',{account_id:uid,revision,state});
  assert(!(await admin.from('game_save_history').insert({account_id:uid,revision,state,state_hash:signed.state_hash,signature:signed.signature,key_version:1})).error,'SIGN_FIXTURE_HISTORY');
  assert(!(await admin.from('game_saves').update({revision,state,state_hash:signed.state_hash}).eq('account_id',uid)).error,'WRITE_FIXTURE_SAVE');
  await page.goto(base+'/play?v=daily');await ready();await page.evaluate(()=>localStorage.setItem('ro.battleSpeed','1'));await page.reload();await ready();
  await page.locator('.daily-card').filter({hasText:'แก่นพลัง'}).getByRole('button',{name:'ท้าบอส',exact:true}).click();await page.locator('.field-arena.boss').waitFor();await ready();
  await page.evaluate(()=>{window.__statusLayout=[];window.__statusLayoutTimer=setInterval(()=>{const bar=document.querySelector('.boss-bar');if(bar)window.__statusLayout.push({height:bar.getBoundingClientRect().height,statuses:document.querySelectorAll('.boss-status-panel .combat-status').length,casting:!!document.querySelector('.boss-hud>.boss-cast')});},100);});
  const focus=page.locator('.focus-status-panel');await focus.getByRole('button',{name:/Spirit Sphere 5 จาก 5 ลูก ATK เพิ่ม 5 เปอร์เซ็นต์/}).waitFor({timeout:15000});
  await focus.locator('.sphere-counter img[data-skill-icon="monk_call_spirits"]').waitFor();
  await focus.getByRole('button',{name:/Spirit Sphere 5 จาก 5/}).click();const sphere=page.getByRole('dialog');assert((await sphere.innerText()).includes('ATK +5%'),'WRONG_SPHERE_BONUS');await sphere.getByRole('button',{name:'ปิด',exact:true}).click();
  await focus.locator('[data-status-id="monk_steel_body:buff"]').waitFor({timeout:15000});assert(await focus.locator('[data-status-id="monk_steel_body:debuff"]').count()===1,'SELF_DEBUFF_NOT_SHOWN');
  await page.waitForFunction(()=>[...document.querySelectorAll('.focus-status-panel .combat-status img')].some(i=>i.complete&&i.naturalWidth>0));
  await page.screenshot({path:path.join(root,`plan/evidence/${prefix}-battle-statuses.png`)});checks.push('RealMonk CallSpirits shows5/5 +5% with orbit, SteelBody shows independent buff and debuff native icons');
  assert(await page.locator('.boss-status-panel .combat-status.debuff').count()>0,'BOSS_DEBUFF_NOT_SHOWN');
  await focus.getByRole('button',{name:/Spirit Sphere 0 จาก 5 ลูก ATK เพิ่ม 0 เปอร์เซ็นต์/}).waitFor({timeout:16000});checks.push('FingerOffensive consumes5 at cast start; live resource display immediately becomes0/5 +0%');
  const blessing=focus.locator('[data-status-id="acolyte_blessing:buff"]');await page.waitForFunction(()=>document.querySelector('.focus-status-panel [data-status-id="acolyte_blessing:buff"] .status-stacks')?.textContent==='2',{},{timeout:30000});
  await blessing.click();const detail=page.getByRole('dialog');assert(await detail.locator('.status-instance').count()===4,'BLESSING_EFFECTS_MISCOUNTED');const names=await detail.innerText();assert(names.includes('จาก คุณ')&&names.includes('จาก ลูเมน')&&names.includes('ชั้นถัดไปหมด'),'SOURCE_OR_EXPIRY_MISSING');
  await page.screenshot({path:path.join(root,`plan/evidence/${prefix}-status-details.png`)});await detail.getByRole('button',{name:'ปิด',exact:true}).click();checks.push('TwoBlessing sources show2stacks/4effects with actual separate source/expiry in tappable detail sheet');
  await page.setViewportSize({width:320,height:740});await page.waitForTimeout(200);assert(await page.locator('.game-frame').evaluate(n=>n.scrollWidth<=n.clientWidth),'MOBILE_OVERFLOW');
  const overlap=await page.evaluate(()=>{const a=document.querySelector('.focus-status-panel').getBoundingClientRect(),b=document.querySelector('.party-strip').getBoundingClientRect();return a.bottom>b.top;});assert(!overlap,'STATUS_STRIP_OVERLAPS_PARTY');await page.setViewportSize({width:390,height:844});
  const layout=await page.evaluate(()=>{clearInterval(window.__statusLayoutTimer);return window.__statusLayout;});measurements.boss_panel={samples:layout.length,min_height:Math.min(...layout.map(s=>s.height)),max_height:Math.max(...layout.map(s=>s.height)),cast_states:[...new Set(layout.map(s=>s.casting))],status_counts:[...new Set(layout.map(s=>s.statuses))]};assert(measurements.boss_panel.cast_states.length===2&&measurements.boss_panel.status_counts.length>1,'BOSS_STATES_NOT_EXERCISED');assert(layout.length>10&&Math.max(...layout.map(s=>s.height))-Math.min(...layout.map(s=>s.height))<1,'BOSS_PANEL_JUMPS');assert(await page.locator('.boss-bar .combat-status-strip').count()===0,'BOSS_ICONS_INSIDE_PANEL');
  const size=await focus.locator('.combat-status img').first().evaluate(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}));measurements.icon_size=size;assert(size.w<=18&&size.h<=18,'STATUS_ICONS_TOO_BIG');
  assert(!commands.includes('battle.advance')&&!commands.includes('battle.finish'),'STATUS_INSPECTION_WRITES_PROGRESS');await page.getByRole('button',{name:'ถอยทัพ',exact:true}).click();await ready();await page.locator('.field-arena:not(.boss)').waitFor();assert(await page.locator('.farm-status-toggle,.farm-status-sheet,.field-arena:not(.boss) .combat-status-strip').count()===0,'FARM_STATUS_NOT_REMOVED');await page.screenshot({path:path.join(root,`plan/evidence/${prefix}-farm-clean.png`)});
  assert(!errors.length,'BROWSER_RUNTIME_ERROR');checks.push('320px mobile no overlap/overflow; icons18px, nativeCallSpirit icon, stableboss panel across cast/status changes; farm has no status controls; inspection never writes battle.advance');
 }catch(e){error=String(e);}finally{
  if(browser)await browser.close();await admin.auth.admin.deleteUser(uid);
  const report={task_id:prefix.toUpperCase(),passed:!error&&!errors.length&&checks.length===4,error,errors,checks,commands,measurements,owner_cloud_writes:false,personal_preview_restarted:false,balance_simulation:false,scope:'Actual isolated Auth/PostgREST/PostgreSQL and mobileChrome; test-only Lv40Monk/support team, targeted UI interactions only, no balance/calibration runner.'};
  fs.writeFileSync(path.join(root,`plan/evidence/${prefix}-status-live.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
 }
})().catch(()=>{console.error('STATUS_FIXTURE_FAILED');process.exitCode=1;});
