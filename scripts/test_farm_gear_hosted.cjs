// Public deployment/artifact proof; authenticated Field is checked on synthetic loopback only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'plan/evidence/task-147'),base='https://ro-idle-pve.vercel.app';
(async()=>{let browser,failure;const checks=[],errors=[],writes=[];try{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'src/generated/runtime-manifest.json'))),pack=JSON.parse(fs.readFileSync(path.join(root,'runtime/ro/manifest.json')));
 const r=await fetch(base+'/api/health',{cache:'no-store'}),health=await r.json();assert(r.ok&&health.content_hash===expected.content_hash&&r.headers.get('x-ro-api-region')==='sin1');
 for(const route of['/api/checkpoint','/api/save-slots'])assert.equal((await fetch(base+route)).status,401);
 assert.equal((await(await fetch(base+'/ro/manifest.json',{cache:'no-store'})).json()).pack_hash,pack.pack_hash);
 checks.push({case:'public_API_SIN1_auth401_unchanged_content_pack',content_hash:health.content_hash,pack_hash:pack.pack_hash});
 const version=await(await fetch(base+'/content-version.json',{cache:'no-store'})).json();assert.equal(version.content_hash,expected.content_hash);const files=version.build_files.filter(f=>/^dist\/assets\/.*\.(js|css)$/.test(f.path)),sources=[];
 for(const file of files){const response=await fetch(base+'/'+file.path.replace(/^dist\//,'')),bytes=Buffer.from(await response.arrayBuffer());assert(response.ok);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);sources.push(bytes.toString());}
 const source=sources.join('\n');for(const needle of['farm-gear-guide','farm-gear-label','stage-gear-level','ระดับอุปกรณ์ที่ดรอปจากการฟาร์ม','ดูทุกบท','data-farm-gear-level'])assert(source.includes(needle),needle);
 checks.push({case:'all_public_declared_bundle_SHA_and_actual_UI_feature',files:files.length});
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname)});
 for(const width of[320,390]){await page.setViewportSize({width,height:844});await page.goto(base+'/');await page.locator('input[type="password"]').waitFor({timeout:30000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,'hosted-login-'+width+'.png')});}
 assert(!errors.length&&!writes.length,JSON.stringify({errors,writes}));checks.push({case:'public_auth_shell_mobile320390_no_errors_no_owner_writes',passed:true});
 }catch(e){failure=String(e.stack||e);}finally{await browser?.close();const report={passed:!failure&&checks.length===3,checks,errors,writes,failure,scope:'Public API, production artifacts and unauthenticated shell. Actual Field verified locally; no owner login/save writes.'};fs.writeFileSync(path.join(out,'hosted.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
})();
