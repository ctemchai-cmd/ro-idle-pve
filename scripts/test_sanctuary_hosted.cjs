// Public read-only smoke; actual authenticated battle timing proved on disposable local SQL/Auth.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),base='https://ro-idle-pve.vercel.app',checks=[],errors=[],writes=[];
const check=(v,m)=>{if(!v)throw Error(m)},sha=b=>createHash('sha256').update(b).digest('hex');
(async()=>{let browser,failure;try{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'src/generated/runtime-manifest.json'))),local=JSON.parse(fs.readFileSync(path.join(root,'runtime/ro/manifest.json')));
 const response=await fetch(base+'/api/health',{cache:'no-store'}),health=await response.json();check(response.ok&&health.content_hash===expected.content_hash&&response.headers.get('x-ro-api-region')==='sin1','API_REGION_CONTENT');
 for(const endpoint of['/api/checkpoint','/api/save-slots'])check((await fetch(base+endpoint)).status===401,'AUTH_'+endpoint);
 const pack=await(await fetch(base+'/ro/manifest.json',{cache:'no-store'})).json();check(pack.pack_hash===local.pack_hash,'PACK_CHANGED');checks.push({case:'SIN1_new_content_auth401_unchanged_pack',content_hash:health.content_hash,pack_hash:pack.pack_hash});
 const version=await(await fetch(base+'/content-version.json',{cache:'no-store'})).json();check(version.content_hash===expected.content_hash&&version.implementation_hash===expected.implementation_hash,'VERSION');
 const bundles=version.build_files.filter(f=>/^dist\/assets\/.*\.(js|css)$/.test(f.path)),code=[];
 for(const f of bundles){const r=await fetch(base+'/'+f.path.replace(/^dist\//,'')),b=Buffer.from(await r.arrayBuffer());check(r.ok&&sha(b)===f.sha256,'BUNDLE_SHA_'+f.path);code.push(b.toString());}
 for(const text of['sanctuary_regeneration','เริ่มทันที','ใส่ของที่ดีกว่า'])check(code.join('\n').includes(text),'FEATURE_'+text);checks.push({case:'declared_client_bundle_SHA_and_dedicated_HoT_program',files:bundles.length});
 const{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-browser-check/node_modules/playwright-core');browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname);});
 for(const [width,rank,power]of[[390,10,175],[320,1,105]]){
  await page.setViewportSize({width,height:844});await page.goto(base+`/skill-preview?job=priest&skill=priest_sanctuary&rank=${rank}&gender=female`);await page.locator('.skill-preview[data-ready="true"]').waitFor({timeout:30000});
  const effects=page.locator('.sp-details li');check(await effects.count()===1,'PURE_HOT_ONLY');const text=await effects.innerText();check(text.includes(`${power}% MATK ทุก 1s · 6s · เริ่มทันที`),'POWER_TIMING_RANK');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'MOBILE_OVERFLOW');await page.screenshot({path:path.join(root,`plan/evidence/task-127-hosted-sanctuary-${width}.png`)});
 }
 checks.push({case:'public_mobile390320_rank10_and1_pure_HoT_actual_description',passed:true});
 for(const job of['bard','dancer']){
  await page.goto(base+`/skill-preview?job=${job}&skill=${job}_healing_song&rank=10&gender=${job==='bard'?'male':'female'}`);await page.locator('.skill-preview[data-ready="true"]').waitFor({timeout:30000});const text=await page.locator('.sp-details ul').innerText();check(await page.locator('.sp-details li').count()===2&&text.includes('175% P.ATK')&&text.includes('87.5% P.ATK ทุก 1s')&&!text.includes('เริ่มทันที'),'SONG_UNCHANGED');
 }
 check(!errors.length&&!writes.length,'ERRORS_OR_WRITES');checks.push({case:'Bard_Dancer_opening_plus_HoT_preserved_zero_owner_access_or_writes',passed:true});
 }catch(e){failure=e.message;}finally{await browser?.close();const report={task_id:'TASK-127',passed:checks.length===4&&!failure,checks,errors,writes,failure,scope:'Public API/bundleSHA/nativepack/read-only preview390320. Actual in-game Sanctuary ticks/aura/expiry and songs separately proved on isolated real Auth/API/Postgres. No owner login or writes.'};fs.writeFileSync(path.join(root,'plan/evidence/task-127-hosted.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
})();
