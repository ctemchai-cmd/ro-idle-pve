// Real game UI, throwaway Auth/DB only; no personal preview or production account.
const fs=require('node:fs'),path=require('node:path'),{randomUUID,randomBytes}=require('node:crypto');
const {createClient}=require('@supabase/supabase-js'),{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.RO_LIVE_URL,gateway=process.env.SUPABASE_URL,tag=process.env.RO_NAV_TAG||'baseline';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1'||![base,gateway].every(u=>u&&new URL(u).hostname==='127.0.0.1')||!/^[a-z0-9-]+$/.test(tag))throw new Error('ISOLATED_STACK_REQUIRED');
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
(async()=>{
 const admin=createClient(gateway,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),email='navigation-'+randomUUID()+'@example.invalid',password=randomBytes(24).toString('base64url');
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert(!created.error&&created.data.user,'FIXTURE_CREATE_FAILED');const uid=created.data.user.id;
 let browser,error=null,profile;const samples=[],apiRequests=[],errors=[];
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/auth');
  await page.getByLabel('อีเมล',{exact:true}).fill(email);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(password);await page.getByRole('button',{name:'เข้าสู่บัญชี',exact:true}).click();
  await page.waitForTimeout(350);await page.goto(base+'/play');await page.getByRole('radio',{name:/^Mage/}).click();await page.getByRole('button',{name:'เริ่มการเดินทาง',exact:true}).click();await page.locator('.hud-save.ok').waitFor();await page.waitForTimeout(2200);
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
  page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))apiRequests.push({method:r.method(),path:new URL(r.url()).pathname});});
  const routes=[['กระเป๋า','backpack-page'],['ทีม','team-page'],['ตัวละคร','buddy-page'],['ร้านค้า','store-page'],['ดันเจี้ยน','dungeon-page']];
  for(let n=0;n<3;n++)for(const [label,cls]of routes){
   await page.evaluate(cls=>{
    window.__navTime=null;let start=0;const tapped=()=>{start=performance.now();document.removeEventListener('click',tapped,true);};document.addEventListener('click',tapped,true);
    const observer=new MutationObserver(()=>{if(!start||!document.querySelector('.'+cls))return;observer.disconnect();requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__navTime=performance.now()-start;}));});
    observer.observe(document.querySelector('.game-frame'),{childList:true,subtree:true});
   },cls);
   await page.getByRole('navigation',{name:'เมนูหลัก'}).getByRole('button',{name:label,exact:true}).click();await page.waitForFunction(()=>typeof window.__navTime==='number',{},{timeout:10000});
   samples.push({route:cls,round:n+1,click_to_paint_ms:Math.round(await page.evaluate(()=>window.__navTime))});
  }
  profile=(await cdp.send('Profiler.stop')).profile;await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  assert(!apiRequests.length,'NAVIGATION_CALLS_API');assert(!errors.length,'BROWSER_RUNTIME_ERROR');
 }catch(e){error=String(e);}finally{
  if(browser)await browser.close();await admin.auth.admin.deleteUser(uid);
  const hot=new Map(),nodes=new Map((profile?.nodes||[]).map(n=>[n.id,n]));
  for(let i=0;i<(profile?.samples||[]).length;i++){const node=nodes.get(profile.samples[i]),name=node.callFrame.functionName||'(anonymous)',url=node.callFrame.url.replace(base||'','').split('?')[0],key=name+' '+url;hot.set(key,(hot.get(key)||0)+(profile.timeDeltas?.[i]||0)/1000);}
  const report={task_id:'TASK-066',passed:!error&&!errors.length&&samples.length===15,error,errors,cpu_throttling:4,samples,api_requests:apiRequests,hot_functions:[...hot].sort((a,b)=>b[1]-a[1]).slice(0,24).map(([fn,ms])=>({fn,self_ms:Math.round(ms)})),owner_cloud_writes:false,personal_preview_restarted:false,scope:'Actual mobile game UI on isolated local stack with empty starter bag, not owner phone; click capture to second RAF, CPU4x. No save requests while changing menus.'};
  fs.writeFileSync(path.join(root,`plan/evidence/task-066-navigation-${tag}.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
 }
})().catch(()=>{console.error('NAVIGATION_FIXTURE_FAILED');process.exitCode=1;});
