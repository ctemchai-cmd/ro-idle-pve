// Actual production-compiled Timeline geometry and nested details; synthetic battle only.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const base=process.env.RO_PREVIEW_URL;assert(base&&new URL(base).hostname==='127.0.0.1');
(async()=>{let browser;const errors=[],writes=[],checks=[];try{
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const page=await browser.newPage({viewport:{width:320,height:844},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(r.url());});
 await page.goto(base+'/after/');await page.waitForFunction(()=>window.perfReady176);
 await page.evaluate(()=>window.actorPerf176.mount('after',1));await page.locator('#actor-perf .boss-bar').waitFor();
 await page.getByRole('button',{name:'Timeline สกิล',exact:true}).click();
 await page.waitForFunction(()=>window.actorPerf176.session.state.game_time_ms>6000&&document.querySelectorAll('.timeline-entry').length>10);
 for(const width of[320,390]){
  await page.setViewportSize({width,height:844});
  for(const windowMs of[10000,20000,40000]){
   await page.getByRole('combobox',{name:'ช่วงเวลา Timeline'}).selectOption(String(windowMs));await page.waitForTimeout(120);
   const row=await page.evaluate(windowMs=>{
    const node=document.querySelector('.skill-timeline'),region=node.querySelector('.timeline-now-region'),marker=node.querySelector('.timeline-now'),lanes=[...node.querySelectorAll('.timeline-content')];
    const now=window.actorPerf176.session.state.game_time_ms,start=Math.max(0,now-windowMs/4),track=lanes[0].getBoundingClientRect().width;
    return{windowMs,now,expected_now:(now-start)/windowMs*region.clientWidth,actual_now:new DOMMatrix(getComputedStyle(marker).transform).m41,
     expected_shift:-start/windowMs*track,shifts:lanes.map(n=>new DOMMatrix(getComputedStyle(n).transform).m41),root_shift:node.style.getPropertyValue('--timeline-shift'),root_now:node.style.getPropertyValue('--timeline-now-x'),overflow:document.documentElement.scrollWidth>innerWidth};
   },windowMs);
   // BossField's display clock may lead the 50ms engine step by up to 49ms;
   // allow that interpolation plus one display frame in the coordinate oracle.
   const tolerance=65/windowMs*710+1;
   assert(Math.abs(row.actual_now-row.expected_now)<tolerance,JSON.stringify(row));for(const shift of row.shifts)assert(Math.abs(shift-row.expected_shift)<tolerance,JSON.stringify(row));
   assert(row.shifts.every(shift=>shift===row.shifts[0]));
   assert.equal(row.root_shift,'');assert.equal(row.root_now,'');assert.equal(row.overflow,false);checks.push({width,...row});
  }
 }
 await page.locator('.timeline-skill').first().evaluate(n=>n.click());await page.getByRole('dialog',{name:/รายละเอียดสกิล/}).waitFor();
 assert((await page.locator('.skill-information-effects li').count())>0);
 await page.getByRole('button',{name:'ปิดรายละเอียดสกิล',exact:true}).click();assert(await page.getByRole('heading',{name:'จังหวะของทุกคน'}).isVisible());
 await page.screenshot({path:'plan/evidence/task-176/timeline-390.png'});
 await page.getByRole('button',{name:'ปิด',exact:true}).click();await page.evaluate(()=>window.actorPerf176.root.unmount());
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 fs.writeFileSync('plan/evidence/task-176/timeline.json',JSON.stringify({passed:true,checks,nested_details:true,errors,writes},null,2));console.log(JSON.stringify({passed:true,geometry_cases:checks.length,nested_details:true}));
}finally{await browser?.close();}})();
