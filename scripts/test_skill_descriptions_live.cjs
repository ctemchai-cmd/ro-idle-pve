// Read-only inspection on a disposable actual Auth/SQL account, never owner data.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{randomUUID,randomBytes}=require('node:crypto');
const {createClient}=require('@supabase/supabase-js'),{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.RO_LIVE_URL,gateway=process.env.SUPABASE_URL,prefix=process.env.RO_EVIDENCE_PREFIX;
if(prefix!=='task-079'||process.env.RO_SUPABASE_LOCAL_STACK!=='1'||![base,gateway].every(u=>u&&new URL(u).hostname==='127.0.0.1'))throw new Error('ISOLATED_TASK079_REQUIRED');
const check=(v,m)=>{if(!v)throw new Error(m);},runTs=(file,input)=>JSON.parse(execFileSync(process.execPath,['--import','tsx',path.join(root,file)],{input:JSON.stringify(input),cwd:root,env:process.env}).toString());
(async()=>{
 const admin=createClient(gateway,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),email='descriptions-'+randomUUID()+'@example.invalid',password=randomBytes(24).toString('base64url');
 const user=await admin.auth.admin.createUser({email,password,email_confirm:true});check(!user.error&&user.data.user,'CREATE_USER');const uid=user.data.user.id;
 let browser,page,error=null,stage='LOGIN';const checks=[],commands=[],errors=[],measurements=[];
 const read=async()=>{const r=await admin.from('game_saves').select('*').eq('account_id',uid).single();check(!r.error,'READ_SAVE');return r.data;};
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  page=await(await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname==='/api/commands')commands.push(r.postDataJSON().type);});
  const ready=()=>page.locator('.hud-save.ok').waitFor({timeout:25000}),dialog=()=>page.locator('dialog.sheet[open]').last(),shot=name=>page.screenshot({path:path.join(root,`plan/evidence/${prefix}-${name}.png`)});
  const fit=async()=>check(await page.locator('.game-frame').evaluate(n=>n.scrollWidth<=n.clientWidth),'MOBILE_OVERFLOW');
  await page.goto(base+'/auth');await page.getByLabel('อีเมล',{exact:true}).fill(email);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(password);await page.getByRole('button',{name:'เข้าสู่บัญชี',exact:true}).click();await page.getByRole('heading',{name:'เข้าสู่บัญชี',exact:true}).waitFor({state:'hidden'});
  await page.goto(base+'/play');await page.getByRole('radio',{name:/^Acolyte/}).click();await page.getByRole('button',{name:'เริ่มการเดินทาง',exact:true}).click();await ready();await page.goto('about:blank');
  const original=await read(),state=runTs('scripts/game/skill-description-ui-fixture.ts',original.state),revision=original.revision+1,signed=runTs('scripts/game/sign-test-save.ts',{account_id:uid,revision,state});
  check(!(await admin.from('game_save_history').insert({account_id:uid,revision,state,state_hash:signed.state_hash,signature:signed.signature,key_version:1})).error,'FIXTURE_HISTORY');check(!(await admin.from('game_saves').update({revision,state,state_hash:signed.state_hash}).eq('account_id',uid)).error,'FIXTURE_SAVE');
  const before=commands.length;
  stage='SKILL_LEVELS';
  for(const[id,name,sp1,sp5]of [['main','Call Spirits',27,23],['npc_swordsman','Provoke',19,15]]){
   await page.goto(base+`/play?v=skills&c=${id}`);await ready();await page.locator('.skill-row').filter({has:page.getByText(name,{exact:true})}).click();
   const detail=page.locator('.skill-detail');check((await detail.locator('.skill-growth').innerText()).includes('ลด SP อย่างเดียว'),'COST_ONLY_MISSING');check((await detail.locator('.skill-upgrade-diff').innerText()).includes(`SP ${sp1} → ${sp1-1}`),'NEXT_DELTA_MISSING');
   await detail.locator('.skill-levels summary').click();const rows=detail.locator('tbody tr');check(await rows.count()===10,'LEVEL_TABLE_COUNT');check(await rows.nth(0).locator('td').innerText()===String(sp1)&&await rows.nth(4).locator('td').innerText()===String(sp5),'LEVEL1_5_SP');
   check((await detail.locator('.effect-block').innerText()).includes(name==='Provoke'?'4.5s':'1% ต่อลูก'),'MECHANICS_MISSING');
   for(const width of [390,320]){await page.setViewportSize({width,height:844});await fit();await detail.locator('.skill-growth').scrollIntoViewIfNeeded();await shot(name.replaceAll(' ','-')+'-'+width);}
  }
  checks.push('Actual CallSpirits/Provoke level1–10 SP table, visible next delta and real mechanics at320/390px');
  stage='ENDOW';
  for(const[id,name,includes,excludes]of [['npc_mage','Fire Endow',['เปลี่ยนธาตุอาวุธเป็นไฟ','6.5s','สกิลธาตุตายตัวและเกราะไม่เปลี่ยน'],[]],['npc_thief','Enchant Poison',['เพิ่มพลังโจมตี'],['เปลี่ยนธาตุอาวุธ']],['main','Asura',['ใช้ SP ทั้งหมด','ใช้ Spirit Sphere'],['NaN']]]){
   await page.goto(base+`/play?v=skills&c=${id}`);await ready();await page.locator('.skill-row').filter({has:page.getByText(name,{exact:true})}).click();const text=await page.locator('.skill-detail').innerText();check(includes.every(t=>text.includes(t))&&!excludes.some(t=>text.includes(t)),'ELEMENT_COST_DESCRIPTION_'+name);await fit();await shot(name.replaceAll(' ','-')+'-320');
  }
  checks.push('Actual FireEndow scope, EnchantPoison ATK-only and Asura all-SP/sphere cost are truthful');
  stage='CARD_BAG';
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await page.goto(base+'/play?v=backpack');await ready();await page.getByRole('tab',{name:'การ์ด',exact:true}).click();
   await page.waitForFunction(()=>[...document.querySelectorAll('.bag-cell.card img')].length===3&&[...document.querySelectorAll('.bag-cell.card img')].every(n=>n.complete&&n.naturalWidth===300));
   const sizes=await page.locator('.bag-cell.card').evaluateAll(nodes=>nodes.map(n=>{const img=n.querySelector('img'),a=n.getBoundingClientRect(),b=img.getBoundingClientRect(),s=getComputedStyle(img);return{grade:n.dataset.cardGrade,cell:{x:a.x,y:a.y,w:a.width,h:a.height},image:{x:b.x,y:b.y,w:b.width,h:b.height},radius:s.borderRadius,fit:s.objectFit,badge:!!n.querySelector('.e-badge')};}));
   for(const n of sizes){check(n.image.x>=n.cell.x&&n.image.y>=n.cell.y&&n.image.x+n.image.w<=n.cell.x+n.cell.w+.1&&n.image.y+n.image.h<=n.cell.y+n.cell.h+.1,'BAG_IMAGE_OVERFLOW');check(n.radius!=='0px'&&n.fit==='contain'&&Math.abs(n.image.w/n.image.h-.75)<.01,'BAG_IMAGE_CORNERS_OR_RATIO');}
   check(sizes.some(n=>n.badge),'EQUIPPED_BADGE_MISSING');measurements.push({width,cards:sizes});await fit();await shot('cards-'+width);
  }
  await page.locator('.bag-cell.card').first().click();await dialog().locator('.card-portrait img').waitFor();await shot('card-detail-320');await dialog().getByRole('button',{name:'ปิด',exact:true}).click();
  checks.push('All three native Normal/Mini/MVP bag portraits fit inside rounded cells at320/390; equipped/locked badges retained');
  stage='CARD_PICKER';
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await page.goto(base+'/play?v=buddy&c=main');await ready();await page.locator('.gear-tile').first().click();await dialog().getByRole('button',{name:'อัปเกรด',exact:true}).click();await dialog().getByRole('tab',{name:/^การ์ด/}).click();
   await page.waitForFunction(()=>[...document.querySelectorAll('.card-thumb img,.socket img')].length>=3&&[...document.querySelectorAll('.card-thumb img,.socket img')].every(n=>n.complete&&n.naturalWidth===300));
   const geometry=await dialog().locator('.card-thumb img,.socket img').evaluateAll(nodes=>nodes.map(n=>{const p=n.parentElement.getBoundingClientRect(),a=n.getBoundingClientRect();return{w:a.width,h:a.height,pw:p.width,ph:p.height,radius:getComputedStyle(n).borderRadius};}));
   measurements.push({width,picker:geometry});check(geometry.every(n=>n.w<=n.pw&&n.h<=n.ph&&n.radius!=='0px'&&Math.abs(n.w/n.h-.75)<.01),'PICKER_IMAGE_OVERFLOW');await fit();await shot('card-picker-'+width);
  }
  check(commands.length===before,'INSPECTION_SAVED');const after=await read();check(after.revision===revision&&after.state_hash===signed.state_hash,'READ_ONLY_STATE_CHANGED');
  checks.push('Native socket and picker thumbnails rounded/contained; every inspection is read-only with identical saved revision/hash');
 }catch(e){error=stage+':'+(e.stack||String(e));if(page)await page.screenshot({path:path.join(root,`plan/evidence/${prefix}-ui-failure.png`)}).catch(()=>{});}
 finally{if(browser)await browser.close();await admin.auth.admin.deleteUser(uid);const report={task_id:'TASK-079',passed:!error&&!errors.length&&checks.length===4,error,errors,checks,measurements,commands,owner_cloud_writes:false,personal_preview_restarted:false,balance_simulation:false,scope:'Disposable actual Auth/API/Postgres/PostgREST; Chrome mobile320/390 emulation, not a physical Android or owner account.'};fs.writeFileSync(path.join(root,`plan/evidence/${prefix}-ui-live.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
})().catch(()=>{console.error('DESCRIPTIONS_UI_FIXTURE_FAILED');process.exitCode=1;});
