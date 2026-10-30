// Anonymous release verification only; no owner account/save access.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const base='https://ro-idle-pve.vercel.app',out='plan/evidence/task-178';
(async()=>{let browser;const checks=[],errors=[],writes=[];try{
 const expected=JSON.parse(fs.readFileSync(out+'/gameplay-before.json')),health=await fetch(base+'/api/health',{cache:'no-store'});assert.equal(health.status,200);assert.equal(health.headers.get('x-ro-api-region'),'sin1');assert.equal((await health.json()).content_hash,expected.content_hash);
 for(const path of['/api/checkpoint','/api/save-slots'])assert.equal((await fetch(base+path)).status,401);
 const version=await(await fetch(base+'/content-version.json',{cache:'no-store'})).json(),fingerprints=Object.fromEntries(Object.keys(expected).map(k=>[k,version[k]]));assert.deepEqual(fingerprints,expected);checks.push({case:'SIN1_anonymous401_all_five_fingerprints',fingerprints});
 const files=version.build_files.filter(f=>/^dist\/assets\/.*\.(js|css)$/.test(f.path)),source=[];
 for(const file of files){const r=await fetch(base+'/'+file.path.replace(/^dist\//,''));assert(r.ok);const bytes=Buffer.from(await r.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);source.push(bytes.toString());}
 for(const marker of['save-error-code','UNKNOWN_SAVE_ERROR','ro.battleSpeed'])assert(source.join('\n').includes(marker),marker);checks.push({case:'all_deployed_bundle_SHA_and_diagnostic_markers',bundles:files.length});
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage({viewport:{width:320,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(25000);
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname);});
 await page.addInitScript(()=>localStorage.setItem('ro.battleSpeed','4'));
 const cases=[];for(const width of[320,390]){
  await page.setViewportSize({width,height:844});
  for(const route of['/demo','/skill-preview?job=hunter']){
   await page.goto(base+route);await page.getByRole('button',{name:'หยุดชั่วคราว',exact:true}).click();
   const control=page.getByRole('button',{name:route==='/demo'?'เปลี่ยนความเร็วต่อสู้':'ความเร็ว',exact:true});
   for(const speed of[1,2,3,1]){assert.equal(await control.innerText(),route==='/demo'?speed+'×':'×'+speed);await control.click();}
   assert.equal(await page.evaluate(()=>localStorage.getItem('ro.battleSpeed')),'3');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));cases.push({width,route,speeds:[1,2,3,1],old4_to3:true,overflow:false});
  }
 }
 checks.push({case:'public_mobile_controls_only1_2_3',cases});
 await page.goto(base+'/play');await page.getByRole('heading',{name:'เข้าสู่บัญชี',exact:true}).waitFor();assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);checks.push({case:'public_login_no_owner_access',errors,writes});
 fs.writeFileSync(out+'/hosted.json',JSON.stringify({passed:true,checks},null,2)+'\n');console.log(JSON.stringify({passed:true,groups:checks.length,bundles:files.length,mobile_cases:cases.length}));
 }finally{await browser?.close();}
})();
