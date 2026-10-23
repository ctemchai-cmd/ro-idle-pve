// Read-only deployed route/media/behavior proof. No owner Auth or save access.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),base='https://ro-idle-pve.vercel.app',checks=[],errors=[],writes=[];
const check=(v,m)=>{if(!v)throw Error(m)},sha=b=>createHash('sha256').update(b).digest('hex');
(async()=>{let browser,failure;try{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'src/generated/runtime-manifest.json'))),local=JSON.parse(fs.readFileSync(path.join(root,'runtime/ro/manifest.json')));
 const response=await fetch(base+'/api/health',{cache:'no-store'}),health=await response.json();check(response.ok&&health.content_hash===expected.content_hash&&response.headers.get('x-ro-api-region')==='sin1','API_VERSION_REGION');
 for(const endpoint of['/api/checkpoint','/api/save-slots'])check((await fetch(base+endpoint)).status===401,'AUTH_'+endpoint);
 const version=await(await fetch(base+'/content-version.json',{cache:'no-store'})).json();check(version.content_hash===expected.content_hash,'CLIENT_VERSION');
 for(const file of['plan/data/stages.json','plan/data/enemies.json','plan/data/economy.json','plan/data/loot.json','plan/data/cards.json','plan/data/schemas/battle-checkpoint.json','plan/data/progression.json'])check(version.input_sha256[file]===sha(fs.readFileSync(path.join(root,file))),'INPUT_'+file);
 checks.push({case:'productionSIN1_new330stage_data_and_auth_gates',content_hash:health.content_hash});
 const p=await fetch(base+'/ro/manifest.json',{cache:'no-store'}),pack=await p.json();check(pack.pack_hash===local.pack_hash&&p.headers.get('cache-control')==='no-store','PACK');
 const newNames=['kraken','turtle_general','maya','pharaoh','amon_ra','moonlight','mistress','knight_of_windstorm','golden_bug','randgris'],verified=[];
 for(const name of newNames){const asset=Object.values(local.assets).find(a=>a.meta_path.includes('/'+name+'--'));check(asset,'NATIVE_'+name);for(const file of[asset.meta_path,asset.media_path]){const r=await fetch(base+local.base_url+file),b=Buffer.from(await r.arrayBuffer()),record=local.files.find(f=>f.path===file);check(r.ok&&sha(b)===record.sha256,'NATIVE_SHA_'+file);verified.push(file);}}
 checks.push({case:'new_pack_and10native_media_metadata_SHA',pack_hash:pack.pack_hash,files:verified.length});
 const bundles=[],code=[];
 for(const pattern of[/^dist\/assets\/skill-preview-.*\.js$/,/^dist\/assets\/skill-preview-.*\.css$/,/^dist\/assets\/shell-.*\.js$/,/^dist\/assets\/index-.*\.js$/]){
  const f=version.build_files.find(f=>pattern.test(f.path));check(f,'BUNDLE_'+pattern);const r=await fetch(base+'/'+f.path.replace(/^dist\//,'')),b=Buffer.from(await r.arrayBuffer());check(r.ok&&sha(b)===f.sha256,'BUNDLE_SHA');bundles.push(f.path);code.push(b.toString());
 }
 check(code.some(c=>c.includes('Skill Preview')&&c.includes('skill-preview')),'PREVIEW_CODE');check(code.some(c=>c.includes('รอ ')&&c.includes('Hi-class')),'CHAPTER_GATE_CODE');checks.push({case:'declared_lazy_preview_and_game_bundles_SHA',bundles});
 const{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-browser-check/node_modules/playwright-core');browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname);});
 await page.goto(base+'/skill-preview?job=monk&skill=monk_finger_offensive&rank=10');await page.locator('.skill-preview[data-ready="true"]').waitFor({timeout:30000});check(await page.getByLabel('อาชีพ',{exact:true}).locator('option').count()===19,'19JOBS');check(await page.getByLabel('เลเวลสกิล',{exact:true}).inputValue()==='10','RANK10');await page.waitForTimeout(4700);await page.locator('.sp-log summary').click();check((await page.locator('.sp-log').innerText()).includes('ดาเมจ'),'FINGER_DAMAGE');
 for(const width of[390,320]){await page.setViewportSize({width,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'WIDTH');await page.screenshot({path:path.join(root,`plan/evidence/task-119-hosted-${width}.png`)});}
 await page.getByLabel('อาชีพ',{exact:true}).selectOption('bard');await page.getByRole('button',{name:'Healing Song',exact:true}).click();await page.locator('.skill-preview[data-ready="true"][data-skill="bard_healing_song"]').waitFor();await page.waitForTimeout(6000);check((await page.locator('.sp-log').innerText()).includes('ฟื้น HP'),'REAL_HEAL');
 checks.push({case:'production_public_mobile_native_finger_and_real_heal_no_signin',passed:true});
 // Exercise a transient image failure on a fresh context. The retry performs a clean reload.
 const retry=await browser.newPage({viewport:{width:320,height:844},isMobile:true,hasTouch:true});let blocked=false;
 await retry.route('**/ro/manifest.json',route=>{if(!blocked){blocked=true;return route.fulfill({status:503,body:'temporary'});}return route.continue();});
 await retry.goto(base+'/skill-preview');await retry.getByRole('button',{name:'ลองอีกครั้ง',exact:true}).waitFor();await retry.getByRole('button',{name:'ลองอีกครั้ง',exact:true}).click();await retry.locator('.skill-preview[data-ready="true"]').waitFor({timeout:30000});
 check(!errors.length&&!writes.length,'ERRORS_OR_WRITES');checks.push({case:'transient_asset_manifest_failure_retry_recovers',passed:true});
 }catch(e){failure=e.message;}finally{await browser?.close();const report={task_ids:['TASK-118','TASK-119'],passed:checks.length===5&&!failure,checks,errors,writes,failure,scope:'Public production only; no owner login/read/write and no cloud command-latency or balance claim.'};fs.writeFileSync(path.join(root,'plan/evidence/task-118-119-hosted.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
})();
