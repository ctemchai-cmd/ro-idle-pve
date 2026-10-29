// Public readonly release verification; never signs in or reads an owner's save.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const base='https://ro-idle-pve.vercel.app',out='plan/evidence/task-174';
(async()=>{let browser;const checks=[],errors=[],writes=[];try{
 const expected=JSON.parse(fs.readFileSync('plan/evidence/task-174/gameplay-before.json'));
 const health=await fetch(base+'/api/health',{cache:'no-store'});assert.equal(health.headers.get('x-ro-api-region'),'sin1');assert.equal((await health.json()).content_hash,expected.content_hash);
 for(const p of['/api/checkpoint','/api/save-slots'])assert.equal((await fetch(base+p)).status,401);
 const version=await(await fetch(base+'/content-version.json',{cache:'no-store'})).json(),pack=await(await fetch(base+'/ro/manifest.json',{cache:'no-store'})).json();assert.equal(version.content_hash,expected.content_hash);assert.equal(pack.pack_hash,expected.runtime_asset_pack_hash);
 const files=version.build_files.filter(f=>/^dist\/assets\/.*\.(js|css)$/.test(f.path)),source=[];
 for(const file of files){const r=await fetch(base+'/'+file.path.replace(/^dist\//,'')),b=Buffer.from(await r.arrayBuffer());assert(r.ok);assert.equal(createHash('sha256').update(b).digest('hex'),file.sha256);source.push(b.toString());}
 for(const needle of['animation-preview','ท่าคั่น + ผสาน','คำนวณตำแหน่งคั่น','smoothActors'])assert(source.join('\n').includes(needle),needle);
 checks.push({case:'production_SIN1_auth401_same_core_pack_all_bundle_SHA',content_hash:version.content_hash,pack_hash:pack.pack_hash,bundles:files.length});
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname);});
 for(const width of[320,390]){await page.setViewportSize({width,height:844});await page.goto(base+'/animation-preview');await page.getByRole('button',{name:'หยุดภาพ',exact:true}).click();await page.getByRole('slider').fill('450');assert.equal(await page.locator('canvas').getAttribute('data-state'),'attack');await page.getByRole('button',{name:'หญิง',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.time==='0');await page.getByRole('slider').fill('550');await page.getByRole('button',{name:'หันขวา',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.time==='550');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:out+'/hosted-preview-'+width+'.png'});checks.push({case:'public_preview_'+width,loaded_native_assets:true,gender_facing_pause_scrub:true,overflow:false});}
 await page.goto(base+'/play');await page.getByRole('heading',{name:'เข้าสู่บัญชี',exact:true}).waitFor();assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);checks.push({case:'login_and_no_owner_access',page_errors:errors,writes});
 fs.writeFileSync(out+'/hosted.json',JSON.stringify({passed:true,checks},null,2));console.log(JSON.stringify({passed:true,groups:checks.length,checks}));
 }finally{await browser?.close();}})();
