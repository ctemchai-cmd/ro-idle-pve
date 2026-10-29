// Fast readonly control regression for every real job/gender/attack option.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const base=process.env.RO_PREVIEW_URL,out='plan/evidence/task-175';assert(base&&new URL(base).hostname==='127.0.0.1');
(async()=>{let browser,page,progress;try{
 const pack=JSON.parse(fs.readFileSync('runtime/ro/manifest.json')),cases=[],errors=[],writes=[];
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});page=await browser.newPage({viewport:{width:320,height:844},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname);});
 await page.goto(base+'/animation-preview');await page.getByRole('button',{name:'หยุดภาพ',exact:true}).click();
 for(const job of pack.actor_jobs){await page.getByRole('combobox',{name:'อาชีพ',exact:true}).selectOption(job.job_id);await page.waitForFunction(id=>document.querySelector('canvas')?.dataset.job===id,job.job_id);
  for(const p of job.presets){await page.getByRole('button',{name:p.gender==='male'?'ชาย':'หญิง',exact:true}).click();await page.waitForFunction(g=>document.querySelector('canvas')?.dataset.gender===g,p.gender);const states=['attack',...(p.attack_variant_indices??[]).slice(1).map((_,i)=>'attack'+(i+2))];
   for(const state of states){progress={job:job.job_id,gender:p.gender,state};if(states.length>1)await page.getByRole('combobox',{name:'ท่าโจมตี',exact:true}).selectOption(state);await page.getByRole('slider').fill('350');await page.waitForFunction(state=>{const d=document.querySelector('canvas')?.dataset;return d?.time==='350'&&d.swing===state&&d.state===state;},state);await page.waitForTimeout(30);assert.equal(await page.locator('canvas').getAttribute('data-time'),'350');cases.push({job:job.job_id,gender:p.gender,state});}
  }
 }assert.equal(cases.length,68);assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);fs.writeFileSync(out+'/controls.json',JSON.stringify({passed:true,cases,errors,writes},null,2));console.log(JSON.stringify({passed:true,cases:cases.length}));
 }catch(e){console.log(JSON.stringify({progress,canvas:await page?.locator('canvas').first().evaluate(n=>({...n.dataset})).catch(()=>null)}));throw e;}finally{await browser?.close();}})();
