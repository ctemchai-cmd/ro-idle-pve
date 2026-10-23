// Offline-only report QA. No account, HTTP service, owner save, or external asset requests.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'plan/evidence/task-129');
(async()=>{let browser;const errors=[],network=[],checks=[];const check=(v,m)=>{if(!v)throw Error(m)};try{
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('file:'))network.push(r.url())});
 await page.goto(pathToFileURL(path.join(out,'report.html')).href);check(await page.locator('#condition option').count()===11,'CASES_11');check(await page.locator('#rows tr.data').count()===13,'CLASS2_13');
 await page.locator('#rows tr.data').first().click();check(await page.locator('.details .skills div').count()===4,'FOUR_SLOTS');check((await page.locator('.details').innerText()).includes('SP'),'STATS_AND_SKILLS');checks.push('Class2 13 / four ordered skills / stats and breakdown');
 await page.selectOption('#condition','high-90-awaken10');check(await page.locator('#rows tr.data').count()===13,'HIGH_13');await page.selectOption('#encounter','pressure');await page.selectOption('#sort','team_dps');await page.locator('#rows tr.data').first().click();checks.push('High Awaken10 / pressure / team sorting / detail');
 await page.selectOption('#phase','screen');check(await page.locator('#rows tr.data').count()===172,'ALL_HIGH_BUILDS_172');await page.selectOption('#phase','confirmed');await page.screenshot({path:path.join(out,'report-desktop.png')});
 for(const width of [390,320]){await page.setViewportSize({width,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'BODY_OVERFLOW_'+width);await page.screenshot({path:path.join(out,`report-${width}.png`)});}checks.push('all candidates / portrait390320 with scroll confined to table');
 const downloaded=page.waitForEvent('download');await page.click('#csv');const download=await downloaded;check(download.suggestedFilename()==='ro-class-audit.csv','EXPORT');checks.push('CSV export');check(!errors.length&&!network.length,'OFFLINE_NO_ERRORS');
 const result={passed:true,checks,errors,external_requests:network};fs.writeFileSync(path.join(out,'browser-review.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}catch(error){console.error(error);process.exitCode=1;fs.writeFileSync(path.join(out,'browser-review.json'),JSON.stringify({passed:false,error:error.message,checks,errors,network},null,2)+'\n');}finally{await browser?.close();}})();
