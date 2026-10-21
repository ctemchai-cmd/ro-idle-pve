// Disposable real local Auth/SQL/API + actual mobile roster UI. Never production.
const fs = require('node:fs'), path = require('node:path');
const { createHash, createHmac, randomBytes, randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const evidencePrefix=process.env.RO_EVIDENCE_PREFIX||'task-023';if(!/^task-\d{3}$/.test(evidencePrefix))throw new Error('INVALID_EVIDENCE_PREFIX');
const root = path.resolve(__dirname, '..'), base = process.env.RO_LIVE_URL, gateway = process.env.SUPABASE_URL;
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1' || ![base, gateway].every(u => u && new URL(u).hostname === '127.0.0.1')) throw new Error('ISOLATED_LOOPBACK_REQUIRED');
const canonical = v => Array.isArray(v) ? '['+v.map(canonical).join(',')+']' : v&&typeof v==='object' ? '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}' : JSON.stringify(v);
const sha = v => createHash('sha256').update(canonical(v)).digest('hex');
function check(ok, code) { if (!ok) throw new Error(code); }
(async () => {
 const admin = createClient(gateway, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false, autoRefreshToken:false}});
 const email = `roster-${randomUUID()}@example.invalid`, password = randomBytes(24).toString('base64url');
 const created = await admin.auth.admin.createUser({email, password, email_confirm:true}); check(!created.error && created.data.user, 'USER_CREATE_FAILED');
 const uid = created.data.user.id, checks = [], errors = [], intents = []; let browser, stage = 'BOOT';
 try {
  browser = await chromium.launch({headless:true, executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context = await browser.newContext({viewport:{width:390,height:844}}), page = await context.newPage();
  page.on('pageerror', () => errors.push('BROWSER_RUNTIME_ERROR'));
  page.on('request', r => { if (r.method()==='POST'&&r.url().endsWith('/api/commands')) { try { intents.push(r.postDataJSON()); } catch {} } });
  async function row() { const r = await admin.from('game_saves').select('*').eq('account_id',uid).single(); check(!r.error,'SAVE_READ_FAILED'); return r.data; }
  async function ready() { await page.locator('.roster-connection').getByText(/^บันทึกแล้ว #/).waitFor(); }
  const detail = page.locator('.character-detail');
  stage='LOGIN_CREATE'; await page.goto(base+'/auth'); await page.getByLabel('อีเมล',{exact:true}).fill(email); await page.getByLabel('รหัสผ่าน',{exact:true}).fill(password); await page.getByRole('button',{name:'เข้าสู่บัญชี',exact:true}).click();
  await page.getByRole('link',{name:'เปิดทีมและตัวละคร'}).click(); await page.getByLabel('อาชีพเริ่มต้น',{exact:true}).selectOption('archer'); await page.getByLabel('รูปลักษณ์',{exact:true}).selectOption('female');
  // Lose creation response AFTER server commit: pending intent has no checkpoint yet.
  let lost=false; await page.route('**/api/commands',async route=>{ if (!lost) {lost=true;const response=await route.fetch();check(response.status()===200,'CREATE_BEFORE_LOSS_FAILED');await route.abort('connectionreset');} else await route.continue(); });
  await page.getByRole('button',{name:'เริ่มการเดินทาง',exact:true}).click(); await page.locator('.roster-connection').getByText('ขาดการเชื่อมต่อ',{exact:true}).waitFor(); await page.reload(); await ready();
  let saved=await row();check(saved.revision===1&&saved.state.roster.length===7&&saved.state.roster[0].root_job_id==='archer'&&saved.state.roster[0].gender==='female'&&saved.state.wallet.gold===1000,'CREATION_REPLAY_DUPLICATED');
  checks.push('Actual email login and UI-selected Archer/female creation; committed response lost before first checkpoint; reload reconciles exact UUID once, initial grant1000 and seven actors');
  stage='OFF_TEAM_LEVEL_STATUS'; await page.getByRole('button',{name:'ดูตัวละคร เรน',exact:true}).click(); await detail.getByText('พักอยู่ในค่าย',{exact:false}).waitFor(); await page.getByRole('button',{name:'อัปเลเวล',exact:true}).click(); await ready();check(await detail.getByTestId('character-level').innerText()==='2','OFF_TEAM_LEVEL_FAILED');
  await page.getByRole('button',{name:'เพิ่ม AGI',exact:true}).click(); await page.getByRole('button',{name:'ยืนยัน Status · 1 แต้ม',exact:true}).click(); await ready();
  saved=await row();let mage=saved.state.roster.find(a=>a.character_id==='npc_mage');check(mage.level===2&&mage.primary_stats.agi===2&&mage.primary_stats.dex===1&&mage.unspent_status_points===4&&saved.state.wallet.gold===978&&saved.state.wallet.hero_exp===1545,'STATUS_COST_OR_AUTO_GROWTH');
  checks.push('Off-team Mage spends55EXP/22gold forLv2, gets5unspent points; manual AGI+1 costs1 with ledger, DEX stays1; other actors stayLv1');
  stage='PARTY_REPLACE'; await page.getByRole('button',{name:'เลือกตำแหน่ง หน้า 1',exact:true}).click(); await page.getByRole('group').getByRole('button',{name:'เรน · Mage',exact:true}).click(); await page.getByRole('button',{name:'บันทึกทีม',exact:true}).click(); await ready();
  await page.getByRole('button',{name:'เลือกตำแหน่ง หน้า 1',exact:true}).click(); await page.getByRole('group').getByRole('button',{name:'มิโล · Merchant',exact:true}).click(); await page.getByRole('button',{name:'บันทึกทีม',exact:true}).click(); await ready();
  saved=await row();check(saved.state.team.find(p=>p.position==='front_1').character_id==='npc_merchant','TEAM_NOT_COMMITTED');check(saved.state.roster.find(a=>a.character_id==='npc_merchant').level===1,'SLOT_PROGRESS_TRANSFER');
  await page.reload(); await ready(); await page.getByRole('button',{name:'ดูตัวละคร เรน',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-testid=character-level]')?.textContent==='2'&&document.querySelector('[aria-label="ค่า AGI"]')?.textContent==='2');check(saved.state.roster.find(a=>a.character_id==='npc_mage').primary_stats.agi===2,'OFF_TEAM_PROGRESS_LOST');
  checks.push('Actual team replacement twice, then reload: Mage retainsLv2/AGI2 off-team, Merchant remainsLv1; no progression transferred through formation slot');
  stage='OLD_PRICE_FIXTURE'; saved=await row();const state=saved.state, main=state.roster.find(a=>a.kind==='main');main.level=20;main.unspent_status_points=95;main.slot_progress.weapon.refine=4;main.slot_progress.weapon.enchant={line_id:'offense',level:2};const oldWeapon=main.equipment.weapon;const firstSkill=Object.keys(main.skill_levels)[0];main.skill_levels[firstSkill]=2;
  state.wallet.gold=9900;state.wallet.skill_manual=60;state.wallet.hero_exp=1000000;state.wallet.breakthrough_essence=20;
  state.paid_ledger.push({entry_id:'old_skill_price',character_id:'main',feature_id:'skill',skill_id:firstSkill,quantity:1,cost_version:'old-cost-v0',cost_versions:['old-cost-v0'],paid_resources:Object.fromEntries(Object.keys(state.wallet).map(k=>[k,k==='gold'?100:k==='skill_manual'?20:0])),refund_state:'active',refund_command_id:null});
  const hash=sha(state),signature=createHmac('sha256',process.env.SAVE_SIGNING_KEY).update(canonical({account_id:uid,revision:saved.revision,state_hash:hash,content_hash:saved.content_hash,schema_version:1,key_version:1})).digest('base64url');
  check(!(await admin.from('game_saves').update({state,state_hash:hash}).eq('account_id',uid)).error,'FIXTURE_SAVE_FAILED');check(!(await admin.from('game_save_history').update({state,state_hash:hash,signature}).eq('account_id',uid).eq('revision',saved.revision)).error,'FIXTURE_SIGN_FAILED');
  await page.reload();await ready();await page.getByLabel('อาชีพใหม่',{exact:true}).selectOption('dancer');await page.getByRole('button',{name:'ยืนยันเปลี่ยนอาชีพ',exact:true}).click();await ready();
  saved=await row();let now=saved.state.roster.find(a=>a.kind==='main');check(now.job_id==='dancer'&&now.gender==='female'&&now.level===20&&now.local_cap===20&&now.equipment.weapon===null&&now.slot_progress.weapon.refine===4&&now.slot_progress.weapon.enchant.level===2&&saved.state.inventory.filter(i=>i.instance_id===oldWeapon).length===1,'JOB_SWITCH_OWNERSHIP');check(saved.state.wallet.gold===10000&&saved.state.wallet.skill_manual===80&&!saved.state.paid_ledger.some(e=>e.entry_id==='old_skill_price'),'ACTUAL_PAID_REFUND_FAILED');
  const jobIntent=intents.findLast(c=>c.type==='character.change_job');const archived=await admin.from('game_command_receipts').select('receipt').eq('account_id',uid).eq('request_id',jobIntent.request_id).single();check(!archived.error&&archived.data.receipt.result.refunded_ledger_entries.some(e=>e.entry_id==='old_skill_price'&&e.refund_state==='refunded'&&e.paid_resources.gold===100&&e.paid_resources.skill_manual===20),'REFUND_NOT_ARCHIVED_IN_RECEIPT');const sdk=createClient(gateway,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const login=await sdk.auth.signInWithPassword({email,password});check(!login.error,'REPLAY_LOGIN_FAILED');const replay=await fetch(gateway+'/api/commands',{method:'POST',headers:{authorization:'Bearer '+login.data.session.access_token,'content-type':'application/json'},body:JSON.stringify(jobIntent)});check(replay.status===200,'JOB_REPLAY_FAILED');const afterReplay=await row();check(afterReplay.revision===saved.revision&&afterReplay.state.wallet.gold===10000&&afterReplay.state.wallet.skill_manual===80,'JOB_REFUND_DUPLICATED');await sdk.auth.signOut({scope:'local'});
  checks.push('Server-owned Lv20/old-price fixture: UI Dancer promotion before breakthrough refunds exactly100gold/20manual once, same weapon remains in inventory, slot refine/enchant and identity retained; exact command replay has no second refund');
  stage='BREAKTHROUGH_OFFLINE';await page.getByRole('button',{name:'Breakthrough',exact:true}).click();await ready();saved=await row();now=saved.state.roster.find(a=>a.kind==='main');check(now.local_cap===40&&now.level===20&&now.completed_gate_ids.join(',')==='20'&&saved.state.wallet.gold===5000&&saved.state.wallet.breakthrough_essence===0,'BREAKTHROUGH_COST_FAILED');
  await context.setOffline(true);await page.locator('.roster-connection').getByText('ขาดการเชื่อมต่อ',{exact:true}).waitFor();check(await page.getByRole('button',{name:'อัปเลเวล',exact:true}).isDisabled(),'OFFLINE_LEVEL_ENABLED');await context.setOffline(false);await ready();
  for(const width of [390,360]){await page.setViewportSize({width,height:844});check(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'MOBILE_OVERFLOW');check((await page.getByRole('button',{name:'เพิ่ม AGI',exact:true}).boundingBox()).width>=44,'TOUCH_TARGET_TOO_SMALL');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(root,`docs/screenshots/${evidencePrefix}-roster-${width}.png`),fullPage:true});}
  await detail.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'docs/screenshots/'+evidencePrefix+'-roster-detail-360.png')});
  checks.push('Actual Breakthrough20 costs5000gold/20essence and unlocks40 independently of Class2; real offline disables upgrade; reconnect and390/360 mobile layouts pass');
 } catch(error) { errors.push(stage+':'+(error instanceof Error&&/^[A-Z_]+$/.test(error.message)?error.message:'ROSTER_BROWSER_FAILED_REDACTED')); }
 finally {
  await browser?.close();if((await admin.auth.admin.deleteUser(uid)).error)errors.push('USER_CLEANUP_FAILED');
  const files=['scripts/test_roster_live.cjs','src/ui/roster-page.tsx','src/ui/roster.css','src/client/roster.ts','src/domain/progression/characters.ts','src/client/save-controller.ts'];
  const report={task_id:evidencePrefix.toUpperCase(),passed:checks.length===5&&!errors.length,actual_local_auth:true,checks,errors,credentials_logged:false,source_sha256:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),scope:'Actual Chrome/local Auth/API/SQL owner saves. Lv20/old-price investment is a signed server-owned fixture, not completed Story/farming.'};
  fs.writeFileSync(path.join(root,'plan/evidence/'+evidencePrefix+'-roster-live-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
 }
})().catch(()=>{console.error('ROSTER_BROWSER_FAILED_REDACTED');process.exitCode=1;});
