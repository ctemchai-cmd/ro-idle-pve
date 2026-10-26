// Actual React/native assets, disposable memory only. No owner account or writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const base=process.env.RO_PREVIEW_URL,out=path.resolve(__dirname,'../plan/evidence/task-163');assert(base&&new URL(base).hostname==='127.0.0.1');
(async()=>{let browser,failure;const checks=[],errors=[],writes=[];try{
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage({viewport:{width:320,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname);});
 await page.goto(base+'/demo');await page.getByRole('button',{name:'หยุดชั่วคราว',exact:true}).click();
 await page.evaluate(async()=>{
  const[R,D,{TowerPage},{AssetPack},{content},{initializeAccount},{storyStages}]=await Promise.all([import('/node_modules/.vite/deps/react.js'),import('/node_modules/.vite/deps/react-dom_client.js'),import('/src/ui/game/tower.tsx'),import('/src/renderer/pack.ts'),import('/tests/game/combat-fixtures.ts'),import('/src/domain/progression/initialize.ts'),import('/src/domain/modes/story.ts')]);await import('/src/ui/game/game.css');
  const pack=await AssetPack.open(),host=document.createElement('main');host.className='game-root game-frame';document.body.innerHTML='';document.body.append(host);const root=D.default.createRoot(host),h=R.default.createElement,state=initializeAccount(content,{root_job_id:'mage',gender:'male'},'2026-10-27T00:00:00Z','2026-10-27',1);state.story.cleared_stage_ids=storyStages(content).map(s=>s.id);
  window.towerRewards={calls:[],mount:(highest)=>{state.tower.highest_cleared_floor=highest;root.render(h('div',{className:'page-layer',style:{top:0,bottom:0}},h(TowerPage,{context:{state,pack,locked:false,go:()=>{},challenge:(...args)=>window.towerRewards.calls.push(args)}})));},close:()=>root.unmount()};
 });
 for(const width of[320,390]){
  await page.setViewportSize({width,height:844});
  for(const [floor,gold,exp,crystal,cards] of [[1,1750,1200,0,0],[5,5500,4000,50,0],[10,12000,9000,100,1],[20,26000,20000,200,2],[100,106000,84000,200,2]]){
   await page.evaluate(f=>window.towerRewards.mount(f-1),floor);await page.locator('.tower-floor-badge b').getByText(String(floor),{exact:true}).waitFor();
   const reward=page.locator('.tower-reward');for(const[label,n]of[['ทอง',gold],['EXP',exp],['Crystal',crystal]])if(n)assert.equal(await reward.locator(`[aria-label="${label} ${n.toLocaleString('en-US')}"]`).count(),1,label);if(cards)assert.equal(await reward.locator(`[aria-label="การ์ดสุ่ม ${cards} ใบ"]`).count(),1);
   await page.waitForFunction(()=>[...document.querySelectorAll('.tower-page img')].every(i=>i.complete&&i.naturalWidth>0));
   const layout=await page.evaluate(()=>{const p=document.querySelector('.tower-page');return{overflow:p.scrollWidth>p.clientWidth||document.documentElement.scrollWidth>innerWidth,icons:document.querySelectorAll('.tower-reward img').length,labels:[...document.querySelectorAll('.tower-reward-items>span')].map(e=>e.getAttribute('aria-label'))};});assert(!layout.overflow);assert(layout.icons>=3);if(floor===1){assert.equal(await page.locator('.tower-milestone').count(),1);assert((await page.locator('.tower-milestone').innerText()).includes('5'));}else assert.equal(await page.locator('.tower-milestone').count(),0);
   await page.screenshot({path:path.join(out,`tower-${floor}-${width}.png`)});checks.push({case:`actual_Tower_floor${floor}_width${width}`,passed:true,...layout});
  }
 }
 await page.locator('.tower-go').click();await page.locator('.tower-auto').click();assert.deepEqual(await page.evaluate(()=>window.towerRewards.calls),[[{kind:'tower',floor:100}],[{kind:'tower',floor:100},true]]);checks.push({case:'challenge_and_auto_intents_preserved',passed:true});
 await page.evaluate(()=>window.towerRewards.close());assert(!errors.length&&!writes.length);
 }catch(e){failure=String(e.stack||e);}finally{await browser?.close();const report={passed:!failure&&checks.length===11,checks,errors,writes,failure,scope:'Actual React, shared Tower view/content, native runtime pack, disposable memory; not owner Auth/Postgres.'};fs.writeFileSync(path.join(out,'native.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
})();
