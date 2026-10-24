// Public read-only proof. Authenticated progression is proved only on disposable loopback services.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base='https://ro-idle-pve.vercel.app',checks=[],errors=[],writes=[];
const check=(v,m)=>{if(!v)throw Error(m)},sha=b=>createHash('sha256').update(b).digest('hex');
(async()=>{let browser,failure;try{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'src/generated/runtime-manifest.json'))),local=JSON.parse(fs.readFileSync(path.join(root,'runtime/ro/manifest.json')));
 const r=await fetch(base+'/api/health',{cache:'no-store'}),health=await r.json();check(r.ok&&health.content_hash===expected.content_hash&&r.headers.get('x-ro-api-region')==='sin1','API_CONTENT_REGION');
 for(const p of['/api/checkpoint','/api/save-slots'])check((await fetch(base+p)).status===401,'AUTH_'+p);
 const pack=await(await fetch(base+'/ro/manifest.json',{cache:'no-store'})).json();check(pack.pack_hash===local.pack_hash&&pack.actor_jobs.length===32,'PACK32');
 for(const job of pack.actor_jobs.filter(j=>!['swordsman','knight','crusader','acolyte','priest','monk','archer','hunter','bard','dancer','mage','wizard','sage','thief','assassin','rogue','merchant','blacksmith','alchemist'].includes(j.job_id)))check(pack.shell.class_icons[job.job_id].asset_id==='ui.job-'+job.job_id,'REAL_EMBLEM_'+job.job_id);
 checks.push({case:'API_SIN1_auth401_pack32_real_emblems',content_hash:health.content_hash,pack_hash:pack.pack_hash});
 const version=await(await fetch(base+'/content-version.json',{cache:'no-store'})).json();check(version.content_hash===expected.content_hash,'VERSION');const files=version.build_files.filter(f=>/^dist\/assets\/.*\.(js|css)$/.test(f.path)),source=[];
 for(const f of files){const r=await fetch(base+'/'+f.path.replace(/^dist\//,'')),b=Buffer.from(await r.arrayBuffer());check(r.ok&&sha(b)===f.sha256,'BUNDLE_SHA');source.push(b.toString());}
 for(const s of['skill.awaken','skill.convert_shards','awakening_shard','champion_chain_crush_combo','inner','hi-class-v1','awaken_penetration','awaken_skill_power','awaken_healing_received','penetration_bonus','single_target_damage_bonus'])check(source.join('\n').includes(s),'SOURCE_FEATURE_'+s);
 checks.push({case:'all_declared_bundle_SHA_Hi_Awaken_currency_commands',files:files.length});
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname);});
 for(const [width,job,id,needle]of[[390,'assassin_cross','assassin_enchant_poison','30%'],[320,'assassin','assassin_enchant_poison','30%'],[320,'whitesmith','whitesmith_cart_termination','1,078%']]){
  await page.setViewportSize({width,height:844});await page.goto(base+`/skill-preview?job=${job}&skill=${id}&rank=10&gender=male`);await page.locator('.skill-preview[data-ready="true"]').waitFor({timeout:30000});check(await page.getByLabel('อาชีพ',{exact:true}).locator('option').count()===32,'CATALOG32');
  check((await page.locator('.sp-details ul').innerText()).includes(needle),'DESCRIPTION_'+id);check((await page.locator('.sp-header').innerText()).includes('152 สกิล'),'152_SKILLS');check((await page.locator('.sp-details').innerText()).includes('Lv.'+(job==='assassin'?70:90)),'PREVIEW_LEVEL');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'OVERFLOW');await page.screenshot({path:path.join(root,`plan/evidence/task-132-hosted-${job}-${width}.png`)});
 }
 checks.push({case:'public_native_AssassinCross_Assassin_EP30_Whitesmith1078_mobile320390',passed:true});check(!errors.length&&!writes.length,'ERROR_OR_WRITE');checks.push({case:'no_owner_login_or_writes',passed:true});
 }catch(e){failure=e.message;}finally{await browser?.close();const report={passed:!failure&&checks.length===4,checks,errors,writes,failure};fs.writeFileSync(path.join(root,'plan/evidence/task-132-hosted.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
})();
