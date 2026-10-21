const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{randomUUID,randomBytes}=require('node:crypto');
const {createClient}=require('@supabase/supabase-js'),{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.RO_LIVE_URL,gateway=process.env.SUPABASE_URL;
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1'||![base,gateway].every(u=>u&&new URL(u).hostname==='127.0.0.1'))throw new Error('ISOLATED_STACK_REQUIRED');
const assert=(ok,message)=>{if(!ok)throw new Error(message);},runTs=(file,input)=>JSON.parse(execFileSync(process.execPath,['--import','tsx',path.join(root,file)],{input:JSON.stringify(input),env:process.env,cwd:root}).toString());
(async()=>{
 const admin=createClient(gateway,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),email='daily-end-'+randomUUID()+'@example.invalid',password=randomBytes(24).toString('base64url');
 const user=await admin.auth.admin.createUser({email,password,email_confirm:true});assert(!user.error&&user.data.user,'USER_CREATE_FAILED');const uid=user.data.user.id;
 const row=async()=>{const r=await admin.from('game_saves').select('*').eq('account_id',uid).single();assert(!r.error,'FIXTURE_READ_FAILED');return r.data;};
 let browser,error=null;const commands=[],checks=[],errors=[];let before,after;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname==='/api/commands')commands.push(r.postDataJSON().type);});
  await page.goto(base+'/auth');await page.getByLabel('อีเมล',{exact:true}).fill(email);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(password);await page.getByRole('button',{name:'เข้าสู่บัญชี',exact:true}).click();await page.waitForTimeout(300);await page.goto(base+'/play');
  const ready=()=>page.locator('.hud-save.ok').waitFor({timeout:25000});await page.getByRole('radio',{name:/^Mage/}).click();await page.getByRole('button',{name:'เริ่มการเดินทาง',exact:true}).click();await ready();
  await page.goto('about:blank');const initial=await row(),state=runTs('scripts/game/daily-terminal-fixture.ts',initial.state),revision=initial.revision+1,signed=runTs('scripts/game/sign-test-save.ts',{account_id:uid,revision,state});
  assert(!(await admin.from('game_save_history').insert({account_id:uid,revision,state,state_hash:signed.state_hash,signature:signed.signature,key_version:1})).error,'FIXTURE_HISTORY_FAILED');
  assert(!(await admin.from('game_saves').update({revision,state,state_hash:signed.state_hash}).eq('account_id',uid)).error,'FIXTURE_SAVE_FAILED');
  await page.goto(base+'/play?v=daily');await ready();await page.evaluate(()=>localStorage.setItem('ro.battleSpeed','4'));await page.reload();await ready();
  await page.locator('.daily-card').filter({hasText:'แก่นพลัง'}).getByRole('button',{name:'ท้าบอส',exact:true}).click();await page.locator('.field-arena.boss').waitFor();await ready();before=await row();
  await page.getByRole('dialog',{name:'ผลดันเจี้ยนรายวัน',exact:true}).waitFor({timeout:45000});await ready();after=await row();
  assert(!after.state.active_battle,'FINISH_POINTER_REMAINS');assert(commands.filter(t=>t==='battle.finish').length===1,'FINISH_NOT_ONCE');assert(!commands.includes('battle.retreat'),'DAILY_RETREATED_AT_TIMEOUT');assert(!commands.includes('battle.advance'),'PERIODIC_WRITES_REINTRODUCED');
  const a=after.state.daily_records.find(r=>r.boss_id==='essence');assert(a&&a.attempts_used===1,'TIMEOUT_SPENT_EXTRA_ATTEMPT');
  assert(await page.locator('.field-arena.boss').getAttribute('data-game-ms')==='60000','DID_NOT_REACH_DEADLINE');
  checks.push('Essence boss reaches exact60000ms and displays daily result at4x without a50ms-remainder hang');
  checks.push('Onebattle.finish commits; no retreat/advance and exactlyone dailyattempt consumed');
  await page.reload();await ready();const reloaded=await row();assert(reloaded.revision===after.revision&&JSON.stringify(reloaded.state.daily_records)===JSON.stringify(after.state.daily_records),'RELOAD_CHANGED_QUOTA_OR_REWARDS');
  assert(!errors.length,'BROWSER_RUNTIME_ERROR');checks.push('Reload keeps settled dailyHP/phase/quota/rewards without anotherwrite');
  // Synthetic historical incident metadata for this throwaway owner only; never run on a real account.
  const startReceipt=await admin.from('game_command_receipts').select('receipt').eq('account_id',uid).eq('command_type','battle.start_daily').single();assert(!startReceipt.error,'START_RECEIPT_MISSING');
  const incidentBattle=randomUUID(),oldStart=structuredClone(startReceipt.data.receipt);oldStart.request_id=randomUUID();oldStart.request_hash='1'.repeat(64);oldStart.server_at='2026-10-21T13:00:00.000Z';oldStart.result.battle_id=incidentBattle;
  const oldRetreat=structuredClone(oldStart);oldRetreat.request_id=randomUUID();oldRetreat.request_hash='2'.repeat(64);oldRetreat.command_type='battle.retreat';oldRetreat.result.code='DAILY_RETREATED';oldRetreat.server_at='2026-10-21T13:01:00.000Z';
  assert(!(await admin.from('game_command_receipts').insert([oldStart,oldRetreat].map(receipt=>({account_id:uid,request_id:receipt.request_id,request_hash:receipt.request_hash,command_type:receipt.command_type,receipt,created_at:receipt.server_at})))).error,'INCIDENT_FIXTURE_FAILED');
  await page.getByRole('button',{name:'ตั้งค่า',exact:true}).click();await page.getByRole('button',{name:'คืนสิทธิ์แก่นพลังรอบที่ค้าง',exact:true}).click();await ready();
  const repaired=await row(),expected=structuredClone(reloaded.state);expected.daily_records.find(r=>r.boss_id==='essence').attempts_used--;
  assert(JSON.stringify(repaired.state)===JSON.stringify(expected),'REFUND_CHANGED_OTHER_STATE');
  const backups=await admin.from('game_save_backups').select('state,signature').eq('account_id',uid);assert(!backups.error&&backups.data.length===1&&backups.data[0].signature&&JSON.stringify(backups.data[0].state)===JSON.stringify(reloaded.state),'REFUND_BACKUP_MISSING');
  const sdk=createClient(gateway,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),login=await sdk.auth.signInWithPassword({email,password});assert(!login.error&&login.data.session,'RETRY_LOGIN_FAILED');
  const retry=await fetch(base+'/api/commands',{method:'POST',headers:{authorization:'Bearer '+login.data.session.access_token,'content-type':'application/json'},body:JSON.stringify({type:'backup.restore_request',params:{checkpoint_id:'daily-clock:essence:2026-10-21',signature:'daily-clock-incident-2026-10-21'},request_id:randomUUID(),expected_revision:repaired.revision,schema_version:1,content_version:repaired.content_version,rules_version:repaired.rules_version,content_hash:repaired.content_hash})});
  const retryBody=await retry.json();assert(retry.status===200&&retryBody.receipt.outcome==='rejected'&&retryBody.receipt.result.code==='DAILY_CLOCK_ALREADY_REFUNDED','REFUND_REPEATED');assert((await row()).revision===repaired.revision,'RETRY_CHANGED_REVISION');
  checks.push('Owner requests one Essence incident refund; actual SQLsignedbackup preserves everything else and a freshUUIDretry cannot refund twice');
  await page.screenshot({path:path.join(root,'plan/evidence/task-067-daily-terminal.png')});
 }catch(e){error=String(e);}finally{
  if(browser)await browser.close();await admin.auth.admin.deleteUser(uid);
  const report={task_id:'TASK-067',passed:!error&&!errors.length&&checks.length===4,error,errors,checks,commands,before_revision:before?.revision,after_revision:after?.revision,owner_cloud_writes:false,personal_preview_restarted:false,scope:'Actual isolated Auth/PostgREST/Postgres and mobileChrome. SyntheticLv70/VIT50 team, full60s Essence at4x and explicitquota compensation with syntheticoldmetadata; no owner account access.'};
  fs.writeFileSync(path.join(root,'plan/evidence/task-067-daily-terminal-live.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
 }
})().catch(()=>{console.error('DAILY_TERMINAL_FIXTURE_FAILED');process.exitCode=1;});
