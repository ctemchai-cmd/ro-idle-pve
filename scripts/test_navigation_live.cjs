// Real game UI, throwaway Auth/DB only; no personal preview or production account.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{randomUUID,randomBytes}=require('node:crypto');
const {createClient}=require('@supabase/supabase-js'),{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.RO_LIVE_URL,gateway=process.env.SUPABASE_URL,tag=process.env.RO_NAV_TAG||'baseline',prefix=process.env.RO_EVIDENCE_PREFIX||'task-066';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1'||![base,gateway].every(u=>u&&new URL(u).hostname==='127.0.0.1')||!/^[a-z0-9-]+$/.test(tag))throw new Error('ISOLATED_STACK_REQUIRED');
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
(async()=>{
 const admin=createClient(gateway,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),email='navigation-'+randomUUID()+'@example.invalid',password=randomBytes(24).toString('base64url');
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert(!created.error&&created.data.user,'FIXTURE_CREATE_FAILED');const uid=created.data.user.id;
 let browser,error=null,profile;const samples=[],apiRequests=[],errors=[],functional=[];
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/auth');
  await page.getByLabel('อีเมล',{exact:true}).fill(email);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(password);await page.getByRole('button',{name:'เข้าสู่บัญชี',exact:true}).click();
  await page.waitForTimeout(350);await page.goto(base+'/play');await page.locator('.save-slot-card').first().waitFor();await page.getByRole('button',{name:/^เลือกเซฟ 1(?: ·|$)/}).click();await page.getByRole('radio',{name:/^Mage/}).click();await page.getByRole('button',{name:'เริ่มการเดินทาง',exact:true}).click();await page.locator('.hud-save.ok').waitFor();await page.waitForTimeout(2200);
  if(process.env.RO_NAV_POPULATED==='1'){
   await page.goto('about:blank');
   const r=await admin.from('game_saves').select('*').eq('account_id',uid).single();assert(!r.error,'FIXTURE_READ_FAILED');
   const run=(file,input)=>JSON.parse(execFileSync(process.execPath,['--import','tsx',path.join(root,file)],{input:JSON.stringify(input),cwd:root,env:process.env}).toString());
   const state=run('scripts/game/compact-ui-fixture.ts',r.data.state),revision=r.data.revision+1;
   const template=state.inventory.find(i=>i.kind==='equipment');while(state.inventory.length<500)state.inventory.push({...template,instance_id:'nav_'+state.inventory.length});
   const signed=run('scripts/game/sign-test-save.ts',{account_id:uid,revision,state});
   assert(!(await admin.from('game_save_history').insert({account_id:uid,revision,state,state_hash:signed.state_hash,signature:signed.signature,key_version:1})).error,'HISTORY_SEED_FAILED');
   assert(!(await admin.from('game_saves').update({revision,state,state_hash:signed.state_hash}).eq('account_id',uid)).error,'SAVE_SEED_FAILED');
   await page.goto(base+'/play');await page.locator('.save-slot-card').first().waitFor();await page.getByRole('button',{name:/^เลือกเซฟ 1(?: ·|$)/}).click();await page.locator('.hud-save.ok').waitFor();await page.waitForTimeout(2200);
  }
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
  const navigationRequest=r=>{if(new URL(r.url()).pathname.startsWith('/api/'))apiRequests.push({method:r.method(),path:new URL(r.url()).pathname});};page.on('request',navigationRequest);
  const routes=[['กระเป๋า','backpack-page'],['ทีม','team-page'],['ตัวละคร','buddy-page'],['ร้านค้า','store-page'],['ดันเจี้ยน','dungeon-page']];
  const tap=async(locator,cls,round)=>{
   await page.evaluate(cls=>{
    window.__navTime=null;window.__clickDelay=null;let start=0;const tapped=()=>{start=performance.now();document.removeEventListener('pointerup',tapped,true);};document.addEventListener('pointerup',tapped,true);document.addEventListener('click',()=>{window.__clickDelay=performance.now()-start;},{capture:true,once:true});
    const observer=new MutationObserver(()=>{if(!start||!document.querySelector('.'+cls))return;observer.disconnect();requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__navTime=performance.now()-start;}));});
    observer.observe(document.querySelector('.game-frame'),{childList:true,subtree:true});
   },cls);
   await locator.tap();await page.waitForFunction(()=>typeof window.__navTime==='number',{},{timeout:10000});
   const time=await page.evaluate(()=>({total:window.__navTime,input:window.__clickDelay}));samples.push({route:cls,round,tap_to_paint_ms:Math.round(time.total),input_delay_ms:Math.round(time.input),click_to_paint_ms:Math.round(time.total-time.input)});
  };
  for(let n=0;n<3;n++)for(const [label,cls]of routes){
   await tap(page.getByRole('navigation',{name:'เมนูหลัก'}).getByRole('button',{name:label,exact:true}),cls,n+1);
   if(label==='ตัวละคร'&&process.env.RO_NAV_POPULATED==='1'){
    await tap(page.getByRole('button',{name:'Stats',exact:true}),'stats-page',n+1);
    await tap(page.getByRole('button',{name:'ย้อนกลับ',exact:true}),'buddy-page',n+1);
    await tap(page.getByRole('button',{name:'Skill',exact:true}),'skills-page',n+1);
    await tap(page.getByRole('button',{name:'ตัวละครถัดไป',exact:true}),'skills-page',n+1);
   }
  }
  profile=(await cdp.send('Profiler.stop')).profile;await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  assert(!apiRequests.length,'NAVIGATION_CALLS_API');assert(!errors.length,'BROWSER_RUNTIME_ERROR');
  page.off('request',navigationRequest);
  if(process.env.RO_NAV_CHECK_WINDOW==='1'){
   const nav=label=>page.getByRole('navigation',{name:'เมนูหลัก'}).getByRole('button',{name:label,exact:true}),viewport=page.locator('.page-layer'),window=page.locator('.bag-window');
   const scrollEnd=async()=>{await viewport.evaluate(n=>n.scrollTop=n.scrollHeight);await page.waitForFunction(()=>Number(document.querySelector('.bag-window')?.getAttribute('data-window-start'))>100);};
   const ownState=async()=>{const r=await admin.from('game_saves').select('state').eq('account_id',uid).single();assert(!r.error,'FUNCTIONAL_SAVE_READ');return r.data.state;};
   const settled=async()=>{await page.locator('.hud-save.ok').waitFor();};
   await nav('กระเป๋า').click();await page.waitForFunction(()=>!!document.querySelector('.bag-window .bag-cell'));
   const mounted=await page.locator('.bag-cell').count();assert(mounted<120,'ALL_500_ITEMS_MOUNTED');
   await scrollEnd();await page.locator('[data-id="nav_499"]').click();await page.getByRole('dialog').waitFor();
   await page.getByRole('dialog').getByRole('button',{name:'ล็อก',exact:true}).click();await settled();
   await page.getByRole('dialog').getByRole('button',{name:'ปลดล็อก',exact:true}).waitFor();await page.getByRole('button',{name:'ปิด',exact:true}).click();
   assert(await page.locator('[data-id="nav_499"] .lock-mark').count()===1,'VISIBLE_GRID_STALE_AFTER_SAVE');
   await page.getByRole('tab').nth(2).click();await page.waitForFunction(()=>document.querySelector('.bag-window')?.getAttribute('data-window-start')==='0');
   assert(await page.locator('.bag-cell[data-id]').count()>0&&!await page.locator('.bag-cell[data-id^="nav_"]').count(),'FILTER_STALE_OR_BLANK');
   await page.getByRole('tab',{name:'ทั้งหมด',exact:true}).click();await page.getByRole('button',{name:'ย่อยหลายชิ้น',exact:true}).click();
   const state=await ownState(),worn=new Set(state.roster.flatMap(a=>Object.values(a.equipment))),free=state.inventory.filter(i=>i.kind==='equipment'&&!i.locked&&!worn.has(i.instance_id)).length;
   await page.getByRole('button',{name:new RegExp('^เลือกทั้งหมด')}).click();assert((await page.locator('.bulk-bar').innerText()).includes(`เลือก ${free} ชิ้น`),'BULK_MISSES_OFFSCREEN_ITEMS');
   await scrollEnd();assert(await page.locator('[data-id="nav_498"].picked').count()===1,'OFFSCREEN_SELECTION_LOST');await page.getByRole('button',{name:'เสร็จ',exact:true}).click();
   await page.setViewportSize({width:320,height:740});await page.waitForTimeout(150);assert(await viewport.evaluate(n=>n.scrollWidth<=n.clientWidth),'NARROW_GRID_OVERFLOW');await page.setViewportSize({width:390,height:844});
   await nav('ทีม').click();assert(await viewport.evaluate(n=>n.scrollTop)===0,'PAGE_SCROLL_NOT_RESET');
   functional.push({case_id:'virtual_inventory_500_scroll_filter_resize_bulk_and_saved_lock',passed:true,mounted_cells:mounted,bulk_selected:free});
   // Real saves after navigating: no owner account, every value comes from this fixture's DB.
   await nav('ตัวละคร').click();const character=await page.evaluate(()=>new URLSearchParams(location.search).get('c')||'main');
   await page.getByRole('button',{name:'Stats',exact:true}).click();const before=(await ownState()).roster.find(a=>a.character_id===character).primary_stats.int;
   await page.getByRole('button',{name:/^เพิ่ม INT /}).click();await page.getByRole('button',{name:/^ยืนยัน \(/}).click();await settled();
   assert((await ownState()).roster.find(a=>a.character_id===character).primary_stats.int===before+1,'STATUS_SAVE_FAILED');
   await page.getByRole('button',{name:'ตัวละครถัดไป',exact:true}).click();await page.getByRole('button',{name:'ตัวละครก่อนหน้า',exact:true}).click();assert((await page.getByLabel('ค่า INT',{exact:true}).innerText()).startsWith(String(before+1)),'STATUS_STALE_AFTER_CHARACTER_SWITCH');
   await page.getByRole('button',{name:'ย้อนกลับ',exact:true}).click();await page.getByRole('button',{name:'Skill',exact:true}).click();
   const skillName=await page.locator('.skill-detail h2').innerText(),skillBefore=Number(await page.locator('.level-line b').innerText());
   await page.getByRole('button',{name:'อัปเกรด',exact:true}).click();await settled();assert(Number(await page.locator('.level-line b').innerText())===skillBefore+1,'SKILL_STALE_AFTER_SAVE');
   await page.getByRole('button',{name:'ย้อนกลับ',exact:true}).click();await page.getByRole('button',{name:'Skill',exact:true}).click();
   await page.locator('.skill-row').filter({hasText:skillName}).first().click();assert(Number(await page.locator('.level-line b').innerText())===skillBefore+1,'SKILL_STALE_AFTER_NAVIGATION');
   await nav('กระเป๋า').click();await scrollEnd();await page.locator('[data-id="nav_498"]').click();await page.getByRole('button',{name:'สวมให้…',exact:true}).click();
   await page.getByRole('dialog').locator('.pick-list .list-row').filter({hasText:'คุณ ·'}).click();await settled();
   assert((await ownState()).roster.find(a=>a.character_id==='main').equipment.weapon==='nav_498','EQUIPMENT_SAVE_FAILED');
   assert(await page.locator('[data-id="nav_498"] .gear-owner-mark').count()===1,'EQUIPMENT_STALE_AFTER_SAVE');
   await page.reload();await page.locator('.save-slot-card').first().waitFor();await page.getByRole('button',{name:/^เลือกเซฟ 1(?: ·|$)/}).click();await settled();await scrollEnd();assert(await page.locator('[data-id="nav_498"] .gear-owner-mark').count()===1&&await page.locator('[data-id="nav_499"] .lock-mark').count()===1,'GRID_STALE_AFTER_RELOAD');
   assert(!errors.length,'FUNCTIONAL_BROWSER_ERROR');functional.push({case_id:'status_skill_equipment_changes_remain_current_across_routes_and_reload',passed:true,character_id:character,skill:skillName});
   await page.screenshot({path:path.join(root,'plan/evidence/'+prefix+'-inventory-window.png')});
  }
 }catch(e){error=String(e);}finally{
  if(browser)await browser.close();await admin.auth.admin.deleteUser(uid);
  const hot=new Map(),nodes=new Map((profile?.nodes||[]).map(n=>[n.id,n]));
  for(let i=0;i<(profile?.samples||[]).length;i++){const node=nodes.get(profile.samples[i]),name=node.callFrame.functionName||'(anonymous)',url=node.callFrame.url.replace(base||'','').split('?')[0],key=name+' '+url;hot.set(key,(hot.get(key)||0)+(profile.timeDeltas?.[i]||0)/1000);}
  const report={task_id:prefix.toUpperCase(),passed:!error&&!errors.length&&samples.length===(process.env.RO_NAV_POPULATED==='1'?27:15),error,errors,cpu_throttling:4,inventory_size:process.env.RO_NAV_POPULATED==='1'?500:0,samples,api_requests:apiRequests,functional,hot_functions:[...hot].sort((a,b)=>b[1]-a[1]).slice(0,24).map(([fn,ms])=>({fn,self_ms:Math.round(ms)})),owner_cloud_writes:false,personal_preview_restarted:false,scope:'Actual mobile touch navigation on isolated local stack, not owner phone; pointerup to secondRAF, CPU4x. Includes Class2/stats/skills when populated. No save requests while changing menus. Explicit functional save checks use only throwaway fixture account.'};
  fs.writeFileSync(path.join(root,`plan/evidence/${prefix}-navigation-${tag}.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
 }
})().catch(()=>{console.error('NAVIGATION_FIXTURE_FAILED');process.exitCode=1;});
