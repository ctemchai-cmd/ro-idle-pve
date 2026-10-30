// Actual browser storage/ports/controller + signed shared API fixture; no real account.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const base=process.env.RO_PREVIEW_URL,fixtureUrl=process.env.RO_BULK_NATIVE_URL;
assert([base,fixtureUrl].every(v=>v&&new URL(v).hostname==='127.0.0.1'));
(async()=>{let browser,page,failure;const errors=[],checks=[];try{
 const initial=await(await fetch(fixtureUrl+'/fixture')).json();assert(JSON.stringify(initial.command).length>16384);
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(25000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{const r=route.request(),response=await fetch(fixtureUrl+new URL(r.url()).pathname,{method:r.method(),headers:r.headers(),...(['GET','HEAD'].includes(r.method())?{}:{body:r.postDataBuffer()})});await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});});
 await page.addInitScript(initial=>{
  const key='ro-idle:save:v1:bulk-native:'+initial.id;if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({checkpoint:initial.checkpoint,pending:initial.command}));
 },initial);
 async function mount(){
  await page.goto(base+'/animation-preview');await page.getByRole('button',{name:'หยุดภาพ',exact:true}).click();
  await page.evaluate(async(initial)=>{
   const[R,D,{TopHud},{SaveController},{createBrowserSavePorts}]=await Promise.all([import('/node_modules/.vite/deps/react.js'),import('/node_modules/.vite/deps/react-dom_client.js'),import('/src/ui/game/hud.tsx'),import('/src/client/save-controller.ts'),import('/src/client/save-browser.ts')]);await import('/src/ui/game/game.css');
   const auth={snapshot:{user:{id:initial.owner}},getAccessToken:async()=>'isolated.fixture.token',markUnauthorized:()=>{}},ports=createBrowserSavePorts(auth,'bulk-native',localStorage,navigator.locks,fetch,{slot:initial.slot,save_id:initial.id}),controller=new SaveController(ports);
   const host=document.createElement('main');host.className='game-root';host.style.cssText='position:fixed;inset:0;z-index:9999';document.body.append(host);const root=D.default.createRoot(host),h=R.default.createElement;
   const context={state:initial.checkpoint.save.state,pack:null,locked:true,busy:true,characterId:'main',submit:()=>{throw Error('UNEXPECTED_NEW_COMMAND');},go:()=>{},toast:()=>{}};
   controller.subscribe(save=>root.render(h('div',{className:'game-frame'},h(TopHud,{context:{...context,state:save.checkpoint?.save.state??context.state},save,controller,sound:false,toggleSound:()=>{},reconnect:()=>controller.reconnect(),slotNumber:3}))));
   window.bulkPhone={controller,root};await controller.start(initial.id);
  },initial);
 }
 await mount();await page.evaluate(()=>localStorage.setItem('unrelated-save-marker','unchanged'));await page.locator('.hud-alert .save-error-code').filter({hasText:'COMMAND_TOO_LARGE'}).waitFor();
 assert.equal(await page.evaluate(()=>window.bulkPhone.controller.snapshot.pending.request_id),initial.command.request_id);assert.equal((await(await fetch(fixtureUrl+'/summary')).json()).writes,0);await page.screenshot({path:'plan/evidence/task-177/pwa-before-413.png'});checks.push({case:'actual_browser_cached500_sale_reproduces413_loop',passed:true});
 await fetch(fixtureUrl+'/upgrade');await page.evaluate(()=>{window.bulkPhone.controller.dispose();window.bulkPhone.root.unmount();});await mount();await page.locator('.hud-save.ok').waitFor();
 assert.equal(await page.evaluate(()=>window.bulkPhone.controller.snapshot.pending),null);assert.equal(await page.evaluate(()=>window.bulkPhone.controller.snapshot.checkpoint.save.state.inventory.length),0);await page.screenshot({path:'plan/evidence/task-177/pwa-after-recovery.png'});checks.push({case:'PWA_reopen_replays_same_UUID_all500_atomic_ready',passed:true});
 await page.evaluate(()=>{window.bulkPhone.controller.dispose();window.bulkPhone.root.unmount();});await mount();await page.locator('.hud-save.ok').waitFor();
 const summary=await(await fetch(fixtureUrl+'/summary')).json();assert.equal(summary.writes,1);assert.equal(summary.revision,2);assert.equal(summary.items,0);assert.deepEqual(summary.sent,[initial.command.request_id,initial.command.request_id]);assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-save-marker')),'unchanged');assert.deepEqual(errors,[]);checks.push({case:'next_reopen_no_repeat_sale_other_storage_untouched',passed:true});
 await page.evaluate(()=>{window.bulkPhone.controller.dispose();window.bulkPhone.root.unmount();});fs.writeFileSync('plan/evidence/task-177/pwa-recovery.json',JSON.stringify({passed:true,checks,summary,errors,scope:'Real browser cache/SaveController/ports and actual signed Fetch API/shared rules on disposable loopback fixture. No owner Auth/cloud save/SQL. Not physical Android.'},null,2)+'\n');console.log(JSON.stringify({passed:true,groups:checks.length,writes:summary.writes}));
 }catch(e){failure=String(e.stack??e);console.log(failure);await page?.screenshot({path:'plan/evidence/task-177/pwa-native-failed.png'}).catch(()=>{});process.exitCode=1;}finally{await browser?.close();}
})();
