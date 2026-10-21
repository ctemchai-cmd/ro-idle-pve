const fs = require('node:fs'), path = require('node:path');
const { createHash, createHmac, randomBytes, randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_LIVE_URL, gateway = process.env.SUPABASE_URL;
const prefix = process.env.RO_EVIDENCE_PREFIX || 'task-026';
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1' || !/^task-\d{3}$/.test(prefix) || ![base,gateway].every(u => u && new URL(u).hostname === '127.0.0.1')) throw new Error('ISOLATED_LOOPBACK_REQUIRED');
const canonical = v => Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}' : JSON.stringify(v);
const sha = v => createHash('sha256').update(canonical(v)).digest('hex');
function check(ok, code) { if (!ok) throw new Error(code); }
function gear(id, definition = 'equipment_sword_1', rarity = 'common') { return { instance_id:id, definition_id:definition, kind:'equipment', rarity_id:rarity, training:false, locked:false }; }
(async () => {
 const admin = createClient(gateway, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false,autoRefreshToken:false} });
 const email = `equipment-${randomUUID()}@example.invalid`, password = randomBytes(24).toString('base64url');
 const created = await admin.auth.admin.createUser({email,password,email_confirm:true}); check(!created.error && created.data.user, 'USER_CREATE_FAILED');
 const uid = created.data.user.id, checks = [], errors = [], layouts = []; let browser, stage = 'BOOT';
 try {
  const sdk = createClient(gateway, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
  const login = await sdk.auth.signInWithPassword({email,password}); check(!login.error, 'SDK_LOGIN_FAILED'); const token = login.data.session.access_token;
  const manifest = JSON.parse(fs.readFileSync(path.join(root,'src/generated/runtime-manifest.json'))), versions = {schema_version:1,content_version:manifest.content_version,content_hash:manifest.content_hash,rules_version:manifest.rules_version};
  async function row() { const r = await admin.from('game_saves').select('*').eq('account_id',uid).single(); check(!r.error,'SAVE_READ_FAILED'); return r.data; }
  async function send(type, params, revision, requestId = randomUUID()) {
   const intent = {type,params,expected_revision:revision,request_id:requestId,...versions};
   const response = await fetch(gateway+'/api/commands',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(intent)});
   check(response.status === 200,'API_COMMAND_FAILED'); return {receipt:(await response.json()).receipt,intent};
  }
  async function seal(saved) {
   const hash = sha(saved.state), signature = createHmac('sha256',process.env.SAVE_SIGNING_KEY).update(canonical({account_id:uid,revision:saved.revision,state_hash:hash,content_hash:manifest.content_hash,schema_version:1,key_version:1})).digest('base64url');
   check(!(await admin.from('game_saves').update({state:saved.state,state_hash:hash}).eq('account_id',uid)).error,'FIXTURE_SAVE_FAILED');
   check(!(await admin.from('game_save_history').update({state:saved.state,state_hash:hash,signature}).eq('account_id',uid).eq('revision',saved.revision)).error,'FIXTURE_SIGN_FAILED');
  }
  await send('account.create',{root_job_id:'swordsman',gender:'male'},0); let saved = await row();
  const main = saved.state.roster.find(a=>a.character_id==='main');
  main.level=60; main.local_cap=80; main.completed_gate_ids=[20,40,60]; main.unspent_status_points=295;
  main.equipment.weapon='qa_common60'; main.slot_progress.weapon={refine:10,enchant:{line_id:'offense',level:2},cards:['qa_gold_card',null,null]};
  saved.state.roster.find(a=>a.character_id==='npc_acolyte').slot_progress.weapon.refine=4;
  saved.state.roster.find(a=>a.character_id==='npc_mage').slot_progress.weapon.refine=2;
  saved.state.inventory.push(gear('qa_common60','equipment_sword_60'),gear('qa_epic60','equipment_sword_60','epic'),{kind:'card',instance_id:'qa_gold_card',definition_id:'card_weapon_1',rarity_id:'gold',level:5,locked:false});
  saved.state.wallet.gold=10000; await seal(saved);
  browser = await chromium.launch({headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context = await browser.newContext({viewport:{width:390,height:844}}), page = await context.newPage(); page.on('pageerror',()=>errors.push('BROWSER_RUNTIME_ERROR'));
  async function ready(){await page.locator('.roster-connection').getByText(/^บันทึกแล้ว #/).waitFor();}
  async function openGear(){const section=page.locator('.character-equipment');if(!await section.evaluate(n=>n.open))await section.locator('summary').first().click();await section.locator('.equipment-slots').waitFor();return section;}
  async function choose(id){await page.getByRole('button',{name:'ดูอุปกรณ์ '+id,exact:true}).click();}
  const inspect=page.locator('.equipment-inspect');
  stage='LOGIN_COMPARE'; await page.goto(base+'/auth'); await page.getByLabel('อีเมล',{exact:true}).fill(email);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(password);await page.getByRole('button',{name:'เข้าสู่บัญชี',exact:true}).click();await page.getByRole('link',{name:'เปิดทีมและตัวละคร'}).click();await ready();await openGear();
  check(await page.locator('.equipment-slots button').count()===6,'SIX_SLOTS_MISSING');
  const beforeAttack=Number((await page.getByTestId('equipment-physical_attack').innerText()).replaceAll(',',''));
  await choose('qa_epic60');check((await inspect.locator('.equipment-compare').innerText()).includes(String(beforeAttack+95)),'EPIC_PREVIEW_WRONG');check((await inspect.innerText()).includes('ร่าย / พัก'),'TIMING_PREVIEW_MISSING');await inspect.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,`docs/screenshots/${prefix}-equipment-compare-390.png`)});
  await inspect.getByRole('button',{name:'สวมอุปกรณ์',exact:true}).click();await ready();saved=await row();
  check(saved.state.roster[0].equipment.weapon==='qa_epic60','EPIC_EQUIP_FAILED');check(canonical(saved.state.roster[0].slot_progress.weapon)===canonical(main.slot_progress.weapon),'SLOT_PROGRESS_CHANGED');check(Number((await page.getByTestId('equipment-physical_attack').innerText()).replaceAll(',',''))===beforeAttack+95,'EQUIPPED_STATS_WRONG');
  await page.reload();await ready();await openGear();check(Number((await page.getByTestId('equipment-physical_attack').innerText()).replaceAll(',',''))===beforeAttack+95,'RELOAD_STATS_WRONG');
  const start=await send('battle.start_story',{stage_id:'1-1'},saved.revision);check(start.receipt.result.code==='STORY_STARTED','BATTLE_BUILD_FAILED');saved=await row();const checkpoint=await admin.from('game_battle_checkpoints').select('payload').eq('account_id',uid).eq('battle_id',saved.state.active_battle.battle_id).single();check(!checkpoint.error&&checkpoint.data.payload.actors.find(a=>a.actor_id==='main').stats.physical_attack===beforeAttack+95,'BATTLE_PREVIEW_PARITY');await send('battle.retreat',{battle_id:saved.state.active_battle.battle_id},saved.revision);
  checks.push('Real owner UI six slots: Common60→Epic60 preview and saved battle PATK agree (+95), Refine10/Enchant2/GoldCard5 remain on main slot and reload unchanged; signed Lv60 fixture, no farming claim');
  stage='TRANSFER';await page.reload();await ready();await page.getByRole('button',{name:'ดูตัวละคร เรน',exact:true}).click();await openGear();await choose('starter_npc_acolyte_weapon');check((await inspect.innerText()).includes('ย้ายชิ้นนี้จาก ลูเมน'),'TRANSFER_SOURCE_MISSING');await inspect.getByRole('button',{name:'ย้ายมาสวม',exact:true}).click();await ready();saved=await row();check(saved.state.roster.find(a=>a.character_id==='npc_acolyte').equipment.weapon===null,'ORIGINAL_OWNER_NOT_EMPTY');check(saved.state.roster.find(a=>a.character_id==='npc_mage').equipment.weapon==='starter_npc_acolyte_weapon','NEW_OWNER_MISSING');check(saved.state.inventory.filter(i=>i.instance_id==='starter_npc_acolyte_weapon').length===1,'DUPLICATED_TRANSFER_ITEM');check(saved.state.roster.find(a=>a.character_id==='npc_acolyte').slot_progress.weapon.refine===4&&saved.state.roster.find(a=>a.character_id==='npc_mage').slot_progress.weapon.refine===2,'TRANSFERRED_SLOT_PROGRESS');
  checks.push('Actual off-team Mage borrows Acolyte staff by UI; original slot empty, one canonical instance, originalRefine4 and replacementRefine2 remain independent');
  stage='LOCK_PURCHASE_LOSS';await page.getByRole('button',{name:'ดูตัวละคร คุณ',exact:true}).click();await openGear();await choose('qa_common60');await inspect.getByRole('button',{name:'ล็อกป้องกันการย่อย',exact:true}).click();await ready();check(await inspect.getByRole('button',{name:'เลือกย่อยชิ้นนี้',exact:true}).isDisabled(),'LOCKED_SALVAGE_ENABLED');saved=await row();const locked=await send('equipment.salvage',{instance_ids:['qa_common60','starter_main_weapon']},saved.revision);check(locked.receipt.result.code==='ITEM_LOCKED'&&(await row()).revision===saved.revision,'LOCKED_BATCH_MUTATED');
  const shop=page.locator('.equipment-shop');await shop.locator('summary').click();check((await shop.innerText()).includes('ผสม / อัป Tier ไม่ได้'),'TRAINING_RESTRICTIONS_HIDDEN');let dropped=false;
  await page.route('**/api/commands',async route=>{if(!dropped){dropped=true;const response=await route.fetch();check(response.status()===200,'PURCHASE_FAILED_BEFORE_LOSS');await route.abort('connectionreset');}else await route.continue();});
  const money=saved.state.wallet.gold;await shop.getByRole('button',{name:'ซื้ออาวุธฝึกหัด',exact:true}).click();await page.locator('.roster-connection').getByText('ขาดการเชื่อมต่อ',{exact:true}).waitFor();await page.reload();await ready();await openGear();saved=await row();check(saved.state.wallet.gold===money-125&&saved.state.inventory.filter(i=>i.training).length===1,'LOST_PURCHASE_DUPLICATED');
  checks.push('Locked item cannot be salvaged; protected batch atomic. Training restrictions visible; actual committed purchase response dropped then refresh recovers one instance and one125gold debit');
  stage='FULL_BAG';for(let i=saved.state.inventory.length;i<500;i++)saved.state.inventory.push(gear('qa_bag_'+i));const vector=Object.fromEntries(Object.keys(saved.state.wallet).map(k=>[k,0]));vector.gold=500;saved.state.pending_rewards.push({claim_id:'qa_pending',kind:'farm',resource_vector:vector,items:[gear('qa_fixed_drop')],content_version:manifest.content_version,reserved_at:new Date().toISOString(),source_keys:['server-owned-capacity-fixture'],status:'pending'});await seal(saved);await page.reload();await ready();await openGear();check((await page.locator('.character-equipment').innerText()).includes('500 / 500'),'FULL_BAG_INDICATOR');await page.locator('.equipment-shop summary').click();check(await page.locator('.equipment-shop').getByRole('button',{name:'ซื้ออาวุธฝึกหัด',exact:true}).isDisabled(),'FULL_BAG_PURCHASE_ENABLED');
  const fullClaim=await send('reward.claim',{claim_id:'qa_pending'},saved.revision);check(fullClaim.receipt.result.code==='INVENTORY_FULL','FULL_CLAIM_ALLOWED');check((await row()).state.pending_rewards.find(c=>c.claim_id==='qa_pending').items[0].instance_id==='qa_fixed_drop','PENDING_DROP_CHANGED');
  await choose('qa_common60');await inspect.getByRole('button',{name:'ปลดล็อกชิ้นนี้',exact:true}).click();await ready();await inspect.getByRole('button',{name:'เลือกย่อยชิ้นนี้',exact:true}).click();await page.getByRole('button',{name:'ยืนยันย่อย 1 ชิ้น',exact:true}).click();await ready();saved=await row();check(saved.state.inventory.length===499&&!saved.state.inventory.some(i=>i.instance_id==='qa_common60'),'SALVAGE_DID_NOT_FREE_SPACE');const salvageReceipt=await admin.from('game_command_receipts').select('receipt').eq('account_id',uid).order('created_at',{ascending:false}).limit(1);check(!salvageReceipt.error,'SALVAGE_RECEIPT_READ_FAILED');
  const payout=await send('reward.claim',{claim_id:'qa_pending'},saved.revision);check(payout.receipt.outcome==='committed','FIXED_REWARD_NOT_PAID');saved=await row();check(saved.state.inventory.length===500&&saved.state.inventory.filter(i=>i.instance_id==='qa_fixed_drop').length===1,'FIXED_DROP_NOT_ONCE');
  checks.push('Server-owned500-item fixture: UI purchase disabled, API reward rejected without changing fixed bundle. Unlock/salvage still enabled at capacity; freeing one space pays the original drop once');
  stage='RELOAD_LAYOUT_OFFLINE';await page.reload();await ready();await page.getByRole('button',{name:'ดูตัวละคร เรน',exact:true}).click();await openGear();saved=await row();check(saved.state.roster.find(a=>a.character_id==='npc_mage').equipment.weapon==='starter_npc_acolyte_weapon','OFF_TEAM_OWNER_RELOAD');
  await page.getByLabel('กรองอุปกรณ์',{exact:true}).selectOption('free');
  for(const width of[390,360]){await page.setViewportSize({width,height:844});await page.locator('.equipment-inspect').scrollIntoViewIfNeeded();await page.waitForTimeout(300);const geometry=await page.evaluate(()=>({viewport:innerWidth,content:document.documentElement.scrollWidth}));check(geometry.content<=width,'HORIZONTAL_OVERFLOW');layouts.push(geometry);await page.screenshot({path:path.join(root,`docs/screenshots/${prefix}-equipment-${width}.png`),fullPage:false});}
  await context.setOffline(true);await page.locator('.roster-connection').getByText('ขาดการเชื่อมต่อ',{exact:true}).waitFor();check(await page.getByRole('button',{name:'ถอดอาวุธ',exact:true}).isDisabled(),'OFFLINE_EQUIP_ENABLED');await context.setOffline(false);await ready();check(!(await page.getByRole('button',{name:'ถอดอาวุธ',exact:true}).isDisabled()),'RECONNECT_EQUIP_DISABLED');
  checks.push('Actual390/360 Chrome inventory icons and comparison UI without horizontal overflow; off-team assignment survives reload; offline disables mutation and reconnect restores owner state');
 } catch(error) { let message=error instanceof Error?error.message:'UNKNOWN';for(const secret of[email,password,process.env.SUPABASE_SERVICE_ROLE_KEY,process.env.SAVE_SIGNING_KEY])if(secret)message=message.replaceAll(secret,'[redacted]');errors.push(stage+':'+message); }
 finally {
  await browser?.close();if((await admin.auth.admin.deleteUser(uid)).error)errors.push('USER_CLEANUP_FAILED');
  const files=['scripts/test_equipment_live.cjs','src/domain/progression/equipment.ts','src/domain/build/equipment-definition.ts','src/domain/build/equipment.ts','src/domain/account/commands.ts','src/client/equipment.ts','src/client/skills.ts','src/ui/character-equipment.tsx','src/ui/equipment.css'];
  const report={task_id:prefix.toUpperCase(),passed:checks.length===5&&!errors.length,actual_local_auth:true,checks,errors,layouts,credentials_logged:false,source_sha256:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),scope:'Real local Auth/API/SQL/Chrome owner commands. Explicit signed server-owned Lv60/Refine/Enchant/card and500-item boundary fixtures; not a claim that these resources were earned by play.'};
  fs.writeFileSync(path.join(root,'plan/evidence/'+prefix+'-equipment-live-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
 }
})().catch(()=>{console.error('EQUIPMENT_BROWSER_FAILED_REDACTED');process.exitCode=1;});
