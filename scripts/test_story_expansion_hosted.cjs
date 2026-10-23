// Public read-only proof; never signs in or accesses an owner's save.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),base='https://ro-idle-pve.vercel.app',checks=[],errors=[],mutations=[];
const check=(value,message)=>{if(!value)throw Error(message)},sha=bytes=>createHash('sha256').update(bytes).digest('hex');
(async()=>{let browser,failure;try{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'src/generated/runtime-manifest.json'))),local=JSON.parse(fs.readFileSync(path.join(root,'runtime/ro/manifest.json')));
 const response=await fetch(base+'/api/health',{cache:'no-store'}),health=await response.json();check(response.status===200&&health.ok&&health.content_hash===expected.content_hash&&response.headers.get('x-ro-api-region')==='sin1','API_VERSION_REGION');
 for(const endpoint of ['/api/checkpoint','/api/save-slots'])check((await fetch(base+endpoint,{cache:'no-store'})).status===401,'ANONYMOUS_'+endpoint);
 const version=await(await fetch(base+'/content-version.json',{cache:'no-store'})).json();check(version.content_hash===expected.content_hash,'CLIENT_VERSION');for(const file of ['plan/data/stages.json','plan/data/enemies.json','plan/data/loot.json','plan/data/cards.json','plan/data/economy.json','plan/data/schemas/account-state.json'])check(version.input_sha256[file]===sha(fs.readFileSync(path.join(root,file))),'EXPANSION_INPUT_SHA');checks.push({case:'SIN1_new_content_and_both_signin_gates',content_hash:health.content_hash});
 const packResponse=await fetch(base+'/ro/manifest.json',{cache:'no-store'}),pack=await packResponse.json();check(packResponse.headers.get('cache-control')==='no-store'&&pack.pack_hash===local.pack_hash,'PACK_VERSION');
 const verified=[],javascript=[];
 for(const pattern of [/^dist\/assets\/shell-.*\.js$/,/^dist\/assets\/gear-upgrades-.*\.js$/,/^dist\/assets\/auth-page-.*\.js$/,/^dist\/assets\/element-badge-.*\.js$/,/^dist\/assets\/shell-.*\.css$/]){
  const file=version.build_files.find(f=>pattern.test(f.path));check(file,'BUNDLE_RECORD_'+pattern);const r=await fetch(base+'/'+file.path.replace(/^dist\//,''),{cache:'no-store'});check(r.ok,'BUNDLE_HTTP');const bytes=Buffer.from(await r.arrayBuffer());check(sha(bytes)===file.sha256,'DECLARED_BUNDLE_SHA');verified.push(file.path);javascript.push(bytes.toString());
 }
 const code=javascript.join('\n');check(code.includes('เลือกเซฟ')&&code.includes('save-slot-card')&&code.includes('x-ro-save-slot')&&code.includes('เปลี่ยนเซฟ')&&code.includes('Rebuild the validated content bundle'),'TEN_SLOT_CLIENT_DEPLOYED');
 checks.push({case:'chapter9_and_new_enemy_traits_input_SHA_and_declared_bundles',pack_hash:pack.pack_hash,verified});
 check(code.includes('enemy_identity')&&code.includes('definition'),'AUTHORED_MONSTER_IDENTITY_DEPLOYED');
 checks.push({case:'authored_monster_identity_in_verified_game_bundles',passed:true});
 const{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-browser-check/node_modules/playwright-core');browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(!['GET','HEAD','OPTIONS'].includes(request.method()))mutations.push(new URL(request.url()).pathname);});
 await page.goto(base+'/play');await page.getByRole('heading',{name:'เข้าสู่บัญชี',exact:true}).waitFor();await page.screenshot({path:path.join(root,'plan/evidence/task-117-hosted-login.png')});check(!errors.length&&!mutations.length,'PUBLIC_ERRORS_OR_WRITES');checks.push({case:'production_mobile_login_zero_writes',passed:true});
 }catch(error){failure=error.message;}finally{
  await browser?.close();const report={task_id:'TASK-117',passed:checks.length===4&&!failure,checks,errors,mutations,failure,scope:'Public signed-out API/bundles/login only. Actual Android and owner authenticated command latency are outside this read-only smoke.'};fs.writeFileSync(path.join(root,'plan/evidence/task-117-hosted.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
 }
})();
