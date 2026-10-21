// Real isolated Auth/PostgREST/SQL/mobile Chrome; no owner save or balance runner.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{randomUUID,randomBytes}=require('node:crypto');
const {createClient}=require('@supabase/supabase-js'),{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.RO_LIVE_URL,gateway=process.env.SUPABASE_URL,prefix=process.env.RO_EVIDENCE_PREFIX||'task-071';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1'||![base,gateway].every(u=>u&&new URL(u).hostname==='127.0.0.1')||!/^task-\d{3}$/.test(prefix))throw new Error('ISOLATED_STACK_REQUIRED');
const assert=(ok,m)=>{if(!ok)throw new Error(m);},runTs=(file,input)=>JSON.parse(execFileSync(process.execPath,['--import','tsx',path.join(root,file)],{input:JSON.stringify(input),env:process.env,cwd:root}).toString());
(async()=>{
 const admin=createClient(gateway,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),email='healing-'+randomUUID()+'@example.invalid',password=randomBytes(24).toString('base64url');
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert(!created.error&&created.data.user,'CREATE_FIXTURE_USER');const uid=created.data.user.id;
 let browser,page,error=null;const checks=[],errors=[],commands=[],measurements={};
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname==='/api/commands')commands.push(r.postDataJSON().type);});
  await page.goto(base+'/auth');await page.getByLabel('อีเมล',{exact:true}).fill(email);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(password);await page.getByRole('button',{name:'เข้าสู่บัญชี',exact:true}).click();await page.getByRole('heading',{name:'เข้าสู่บัญชี',exact:true}).waitFor({state:'hidden'});await page.goto(base+'/play');
  const ready=()=>page.locator('.hud-save.ok').waitFor({timeout:25000});await page.getByRole('radio',{name:/^Archer/}).click();await page.getByRole('button',{name:'เริ่มการเดินทาง',exact:true}).click();await ready();
  await page.goto('about:blank');const row=await admin.from('game_saves').select('*').eq('account_id',uid).single();assert(!row.error,'READ_FIXTURE_SAVE');const state=runTs('scripts/game/healing-ui-fixture.ts',row.data.state),revision=row.data.revision+1,signed=runTs('scripts/game/sign-test-save.ts',{account_id:uid,revision,state});
  assert(!(await admin.from('game_save_history').insert({account_id:uid,revision,state,state_hash:signed.state_hash,signature:signed.signature,key_version:1})).error,'FIXTURE_HISTORY');assert(!(await admin.from('game_saves').update({revision,state,state_hash:signed.state_hash}).eq('account_id',uid)).error,'FIXTURE_SAVE');
  await page.goto(base+'/play?v=daily');await ready();await page.evaluate(()=>localStorage.setItem('ro.battleSpeed','1'));await page.reload();await ready();
  // Wrap the real renderer only in this disposable browser. No game globals or save hooks added.
  await page.evaluate(async()=>{const {BattleRenderer}=await import('/src/renderer/battle.ts'),draw=BattleRenderer.prototype.draw;window.__auraFrames=[];BattleRenderer.prototype.draw=function(view,ms){if(window.__staticAura)this.motion=false;draw.call(this,view,ms);const sample={time:view.game_time_ms,motion:this.motion,expected:view.actors.filter(a=>a.hp>0&&a.healing_aura).map(a=>a.actor_id).sort(),drawn:[...this.frameStats.healing_auras].sort(),alive:view.actors.filter(a=>a.team==='player'&&a.hp>0).length,statuses:view.actors.filter(a=>a.team==='player').map(a=>({id:a.actor_id,ids:a.status_ids}))};window.__auraNow=sample;if(window.__auraFrames.length<3000)window.__auraFrames.push(sample);};});
  if(prefix==='task-072')await page.evaluate(async()=>{const {BattleRenderer}=await import('/src/renderer/battle.ts'),accept=BattleRenderer.prototype.accept;window.__healingEvents=[];BattleRenderer.prototype.accept=function(events){window.__healingEvents.push(...events.filter(e=>['bard_healing_song','dancer_healing_song'].includes(e.skill_id)&&['cast_resolve','heal'].includes(e.type)));accept.call(this,events);};});
  await page.locator('.daily-card').filter({hasText:'แก่นพลัง'}).getByRole('button',{name:'ท้าบอส',exact:true}).click();await page.locator('.field-arena.boss').waitFor();await ready();
  if(prefix==='task-072')await page.evaluate(()=>window.__healingEvents=[]);
  await page.waitForFunction(()=>window.__auraNow?.drawn.length===4&&window.__auraNow.statuses.every(a=>a.ids.includes('regeneration')&&a.ids.includes('physical_regeneration')),{},{timeout:15000});const active=await page.evaluate(()=>window.__auraNow);assert(JSON.stringify(active.expected)===JSON.stringify(active.drawn),'AURA_RENDER_MISMATCH');
  const focus=page.locator('.focus-status-panel');await focus.locator('[data-status-id="bard_healing_song:buff"]').waitFor();await focus.locator('[data-status-id="bard_healing_song:buff"]').click();const dialog=page.getByRole('dialog');assert((await dialog.innerText()).includes('P.ATK'),'SONG_STATUS_WRONG_POWER_LABEL');await dialog.getByRole('button',{name:'ปิด',exact:true}).click();
  await page.screenshot({path:path.join(root,`plan/evidence/${prefix}-hot-active.png`)});measurements.active=active;checks.push('Real Bard/Dancer HoT status produces exactly one drawn green aura per living recipient, with P.ATK in actual status details');
  await page.evaluate(()=>window.__staticAura=true);await page.waitForFunction(()=>window.__auraNow?.motion===false&&window.__auraNow.drawn.length===4);checks.push('Actual renderer draws HoT with motion disabled; no separate combat or animation timer');
  await page.waitForFunction(()=>window.__auraNow?.time>10000&&window.__auraNow.time<15000&&window.__auraNow.alive===4&&window.__auraNow.drawn.length===0,{},{timeout:15000});
  measurements.expired=await page.evaluate(()=>window.__auraNow);await page.screenshot({path:path.join(root,`plan/evidence/${prefix}-hot-expired.png`)});checks.push('After actual status expiry all four still-living recipients lose their rings before the next song rotation');
  if(prefix==='task-072'){
   const events=await page.evaluate(()=>window.__healingEvents);measurements.song_events={};
   for(const id of ['bard_healing_song','dancer_healing_song']){
    const own=events.filter(e=>e.skill_id===id),resolve=own.find(e=>e.type==='cast_resolve'),opening=own.filter(e=>e.type==='heal'&&e.effect_id==='opening_heal'),ticks=own.filter(e=>e.type==='heal'&&e.effect_id==='heal_tick');
    assert(resolve&&opening.length===4&&opening.every(e=>e.at_ms===resolve.at_ms),'OPENING_NOT_AT_RESOLVE');
    assert(ticks.length===20&&ticks.every(e=>e.at_ms>resolve.at_ms),'WRONG_HOT_TICK_COUNT');
    const times=[...new Set(ticks.map(e=>e.at_ms))];assert(times.every((time,i)=>time===resolve.at_ms+(i+1)*1000),'WRONG_HOT_TICK_TIMES');
    measurements.song_events[id]={resolve_ms:resolve.at_ms,opening_events:opening.length,opening_effective_heal:opening.reduce((n,e)=>n+e.amount,0),tick_events:ticks.length,tick_times:times};
   }
  }
  assert(!commands.includes('battle.advance')&&!commands.includes('battle.finish')&&!errors.length,'VISUALS_WRITE_OR_RUNTIME_ERROR');const frames=await page.evaluate(()=>window.__auraFrames);assert(frames.length>25&&frames.every(f=>JSON.stringify(f.expected)===JSON.stringify(f.drawn)),'AURA_FRAME_MISMATCH');measurements.frames_checked=frames.length;measurements.commands_before_retreat=[...commands];
  await page.setViewportSize({width:320,height:740});assert(await page.locator('.game-frame').evaluate(n=>n.scrollWidth<=n.clientWidth),'MOBILE_OVERFLOW');await page.getByRole('button',{name:'ถอยทัพ',exact:true}).click();await ready();checks.push('Mobile320px no overflow; aura/status inspection adds no command or mid-fight save');
 }catch(e){error=e.stack||String(e);if(page)await page.screenshot({path:path.join(root,`plan/evidence/${prefix}-healing-failure.png`)}).catch(()=>{});}finally{
  if(browser)await browser.close();await admin.auth.admin.deleteUser(uid);const report={task_id:prefix.toUpperCase(),passed:!error&&!errors.length&&checks.length===4,error,errors,checks,measurements,commands,owner_cloud_writes:false,personal_preview_restarted:false,balance_simulation:false,scope:'Actual isolated Auth/PostgREST/Postgres/mobileChrome. Disposable Lv40 Bard/Dancer/Priest/Knight team; first HoT lifetime and real renderer inspected, no balance/calibration runner.'};fs.writeFileSync(path.join(root,`plan/evidence/${prefix}-healing-live.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
 }
})().catch(()=>{console.error('HEALING_FIXTURE_FAILED');process.exitCode=1;});
