// Actual React card/gacha screens + shared reducers in disposable browser memory.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const out=path.resolve(__dirname,'../plan/evidence/task-153'),base=process.env.RO_PREVIEW_URL;
assert(base&&new URL(base).hostname==='127.0.0.1');
(async()=>{let browser,page,failure;const checks=[],errors=[],writes=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 page=await browser.newPage({viewport:{width:320,height:760},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname)});
 await page.goto(base+'/demo');await page.getByRole('button',{name:'หยุดชั่วคราว',exact:true}).click();
 await page.evaluate(async()=>{
  const [React,dom,{CardSheet},{StorePage},{BuddyPage},{cardView},{applySlotCommand},{pullCards,pullCost},{equipmentUpgradesFixture},{content},{AssetPack}]=await Promise.all([import('/node_modules/.vite/deps/react.js'),import('/node_modules/.vite/deps/react-dom_client.js'),import('/src/ui/game/card-sheet.tsx'),import('/src/ui/game/store.tsx'),import('/src/ui/game/buddy.tsx'),import('/src/client/slots.ts'),import('/src/domain/progression/slots.ts'),import('/src/domain/rewards/gacha.ts'),import('/tests/game/equipment-upgrades-fixture.ts'),import('/tests/game/combat-fixtures.ts'),import('/src/renderer/pack.ts')]);
  await import('/src/ui/game/game.css');const h=React.default.createElement,pack=await AssetPack.open(),host=document.createElement('div');host.className='game-shell';document.body.innerHTML='';document.body.append(host);const root=dom.default.createRoot(host);
  let state,mode,closed=false,update,serial=0,created=[],pendingRelease;const calls=[],toasts=[];
  function App(){const[,set]=React.default.useState(0);update=()=>set(n=>n+1);const context={state,pack,locked:false,busy:false,characterId:'main',go(){},selectCharacter(){},challenge(){},latest:()=>state,toast:t=>toasts.push(t),lastCreated:()=>created,lastCode:()=>null};
   context.submit=async(type,params)=>{calls.push({type,params:structuredClone(params)});const response=await new Promise(resolve=>pendingRelease=resolve);pendingRelease=null;if(response==='throw')throw Error('synthetic disconnect');if(!response)return false;
    const next=structuredClone(state);if(type==='card.salvage')applySlotCommand(next,{type,params},content);else if(type==='gacha.pull'){const cost=pullCost(params.pool_id,params.count,content);for(const[k,n]of Object.entries(cost))next.wallet[k]-=n;const items=pullCards(next,params.count,()=>.1,'ui153_'+(++serial),content);next.inventory.push(...items);created=items.map(i=>i.instance_id);}state=next;update();return true;};context.submitWhenReady=context.submit;
   return mode==='store'?h(StorePage,{context}):mode==='buddy'?h(BuddyPage,{context}):closed?null:h(CardSheet,{context,card:cardView(state.inventory.find(i=>i.instance_id==='free_card'),state),close(){closed=true;update();}});
  }
  window.card153={calls,toasts,pack,mount(nextMode,options={}){state=equipmentUpgradesFixture();Object.assign(state.wallet,{crystal:10000,card_dust:0,gold:2000000});state.inventory.push({instance_id:'free_card',definition_id:'card_weapon_1',kind:'card',rarity_id:'common',level:1,locked:!!options.locked});if(options.equipped)state.roster[0].slot_progress.weapon.cards[1]='free_card';mode=nextMode;closed=false;calls.length=0;created=[];root.render(h(App,{key:++serial}));},release(result=true){pendingRelease?.(result);},get state(){return state},patch(fn){fn(state);state=structuredClone(state);update();}};
 });
 const snapshot=()=>page.evaluate(()=>({calls:window.card153.calls,state:window.card153.state}));
 const mount=async(mode,options={})=>{await page.evaluate(([m,o])=>window.card153.mount(m,o),[mode,options]);await page.waitForTimeout(80)};
 const confirm=()=>page.getByRole('dialog',{name:'ยืนยันย่อยการ์ด',exact:true});
 for(const width of[320,390]){
  await page.setViewportSize({width,height:844});
  await mount('card');const before=await snapshot();await page.getByRole('button',{name:'ย่อยการ์ด',exact:true}).click();await confirm().waitFor();assert.equal((await snapshot()).calls.length,0);assert((await confirm().innerText()).includes('กู้คืนไม่ได้'));
  await page.screenshot({animations:'disabled',path:path.join(out,`salvage-confirm-${width}.png`)});assert(await confirm().getByRole('button',{name:'ยืนยันย่อย',exact:true}).evaluate(b=>{const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.height>=40;}));
  await confirm().getByRole('button',{name:'ยกเลิก',exact:true}).click();assert.deepEqual(await snapshot(),before);
  await page.getByRole('button',{name:'ย่อยการ์ด',exact:true}).click();await page.keyboard.press('Escape');assert.deepEqual(await snapshot(),before);
  await page.getByRole('button',{name:'ย่อยการ์ด',exact:true}).click();await confirm().getByRole('button',{name:'ยืนยันย่อย',exact:true}).evaluate(b=>{b.click();b.click();});assert.equal((await snapshot()).calls.length,1);assert(await confirm().getByRole('button',{name:'กำลังย่อย…'}).isDisabled());
  await page.evaluate(()=>window.card153.release());await confirm().waitFor({state:'detached'});const after=await snapshot();assert(!after.state.inventory.some(i=>i.instance_id==='free_card'));assert(after.state.wallet.card_dust>before.state.wallet.card_dust);
  await mount('card',{locked:true});assert(await page.getByRole('button',{name:'ย่อยการ์ด',exact:true}).isDisabled());
  await mount('card',{equipped:true});assert(await page.getByRole('button',{name:'ย่อยการ์ด',exact:true}).isDisabled());
 }
 checks.push({case:'CardSheet320390_cancel_escape_zero_commands_confirm_single_command_actual_salvage_locked_equipped',passed:true});
 await mount('buddy');await page.getByRole('button',{name:/^ช่อง อาวุธ/}).click();await page.getByRole('button',{name:'อัปเกรด',exact:true}).click();await page.getByRole('tab',{name:/^การ์ด/}).click();
 await page.locator('.card-pick-row[data-card-equipped="false"]').first().click();
 await page.locator('.card-selected-details summary').click();await page.getByRole('button',{name:'ย่อยการ์ด',exact:true}).click();await confirm().waitFor();assert.equal((await snapshot()).calls.length,0);
 await confirm().getByRole('button',{name:'ยืนยันย่อย',exact:true}).click();await page.evaluate(()=>window.card153.release(false));await page.waitForTimeout(40);assert(await confirm().isVisible());assert(!(await confirm().getByRole('button',{name:'ยืนยันย่อย',exact:true}).isDisabled()));await confirm().getByRole('button',{name:'ยกเลิก',exact:true}).click();
 checks.push({case:'Buddy_card_upgrade_path_requires_confirmation_failed_submit_keeps_card_and_allows_cancel',passed:true});
 for(const count of[1,10]){
  await page.setViewportSize({width:count===1?320:390,height:844});
  await mount('store');await page.getByRole('tab',{name:'สุ่มการ์ด',exact:true}).click();await page.getByRole('button',{name:new RegExp('^สุ่ม '+count+' ')}).click();assert.equal((await snapshot()).calls.length,1);await page.evaluate(()=>window.card153.release());
  const result=page.getByRole('dialog',{name:`ได้รับการ์ด ${count} ใบ`,exact:true});await result.waitFor();const before=await snapshot(),oldIds=before.state.inventory.map(i=>i.instance_id);
  await page.screenshot({animations:'disabled',path:path.join(out,`repeat-${count}-390.png`)});
  const again=result.getByRole('button',{name:new RegExp('^สุ่มอีก '+count+' ใบ')});assert(await again.isVisible());assert(await again.evaluate(b=>{const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.height>=44;}));
  await again.evaluate(b=>{b.click();b.click()});assert.equal((await snapshot()).calls.length,2);assert(await result.getByRole('button',{name:'กำลังสุ่ม…'}).isDisabled());assert.equal(await result.locator('.gacha-card').count(),count);
  await page.evaluate(()=>window.card153.release(false));await again.waitFor();assert.deepEqual((await snapshot()).state,before.state);assert.equal(await result.locator('.gacha-card').count(),count);
  await again.click();await page.evaluate(()=>window.card153.release());await page.waitForTimeout(80);const after=await snapshot();assert.equal(after.state.inventory.length,before.state.inventory.length+count);assert(after.state.wallet.crystal<before.state.wallet.crystal);assert.equal(await result.locator('.gacha-card').count(),count);assert(after.state.inventory.filter(i=>!oldIds.includes(i.instance_id)).length===count);
  await page.evaluate(()=>window.card153.patch(s=>s.wallet.crystal=0));assert(await again.isDisabled());
  await page.evaluate(()=>window.card153.patch(s=>{s.wallet.crystal=10000;while(s.inventory.length<500)s.inventory.push({...s.inventory.find(i=>i.kind==='card'),instance_id:'filler'+s.inventory.length});}));assert(await again.isDisabled());
 }
 checks.push({case:'Repeat1and10_keeps_results_during_wait_and_failure_single_flight_actual_cost_inventory_new_receipt_ids_insufficient_funds_full',passed:true});
 assert(!errors.length&&!writes.length);checks.push({case:'No_owner_network_writes_or_browser_errors',passed:true});
}catch(e){failure=String(e.stack||e);await page?.screenshot({path:path.join(out,'ui-failed.png')}).catch(()=>{});}finally{await browser?.close();const report={passed:!failure&&checks.length===4,checks,errors,writes,failure};fs.writeFileSync(path.join(out,'ui.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}})();
