// Synthetic Hunter and public UI only. Never signs in, reads or writes owner saves.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const base=process.env.RO_PREVIEW_URL;assert(base&&new URL(base).hostname==='127.0.0.1');
(async()=>{let browser,page,failure;const checks=[],errors=[],writes=[];try{
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 page=await browser.newPage({viewport:{width:320,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname);});
 await page.addInitScript(()=>localStorage.setItem('ro.battleSpeed','4'));
 await page.goto(base+'/animation-preview');await page.getByRole('button',{name:'หยุดภาพ',exact:true}).click();
 await page.evaluate(async()=>{
  const[R,D,{TopHud},{BossField},{AssetPack},{auditFixture,auditBuilds,AUDIT_CASES},{content},{storyStage,storyBoss},{storyInput,storyParty},{compileCharacterSkills},{createBattle,serializeBattle},{SavedBattleSession}]=await Promise.all([import('/node_modules/.vite/deps/react.js'),import('/node_modules/.vite/deps/react-dom_client.js'),import('/src/ui/game/hud.tsx'),import('/src/ui/game/field.tsx'),import('/src/renderer/pack.ts'),import('/scripts/game/class-audit-fixtures.ts'),import('/tests/game/combat-fixtures.ts'),import('/src/domain/modes/story.ts'),import('/src/domain/build/story.ts'),import('/src/domain/progression/skills.ts'),import('/src/domain/combat/index.ts'),import('/src/client/story.ts')]);await import('/src/ui/game/game.css');
  const state=auditFixture(auditBuilds(content,2).find(b=>b.job==='hunter'),AUDIT_CASES.find(c=>c.id==='class2-70-gear60'),content).account;
  const h=R.default.createElement,host=document.createElement('main');host.className='game-root';host.style.cssText='position:fixed;inset:0;z-index:9999';document.body.append(host);const root=D.default.createRoot(host),test={root,state,retries:0,session:null,pack:null};window.deviceSaveSpeed=test;
  const context={state,pack:null,locked:true,busy:true,characterId:'main',latest:()=>state,submit:()=>{throw Error('UNEXPECTED_COMMAND');},submitWhenReady:()=>{throw Error('UNEXPECTED_COMMAND');},go:()=>{},toast:()=>{},lastCode:()=>null,lastCreated:()=>[],selectCharacter:()=>{}};
  test.hud=reason=>root.render(h('div',{className:'game-frame'},h(TopHud,{context,save:{status:'error',reason,checkpoint:null,pending:null,lastReceipt:null},controller:{},sound:false,toggleSound:()=>{},reconnect:()=>test.retries++,slotNumber:3,switchSave:()=>{}})));
  test.battle=async()=>{
   root.render(null);await new Promise(r=>setTimeout(r,30));const pack=test.pack=await AssetPack.open(),stage=storyStage('6-10',content),enemy=structuredClone(storyBoss(stage));enemy.resolved_base.max_hp=1000000000;enemy.resolved_base.physical_attack=1;
   const skills=Object.fromEntries(state.team.map(p=>[p.character_id,compileCharacterSkills(state.roster.find(a=>a.character_id===p.character_id),content)])),party=storyParty(state,content,skills,Object.fromEntries(state.roster.map(a=>[a.character_id,'readonly-speed']))),made=createBattle(storyInput(stage,enemy,party,content),content,178);if(!made.ok)throw Error(JSON.stringify(made.errors));
   const session=test.session=new SavedBattleSession(serializeBattle(made.value),state);await pack.prepare(session.scene,session.initial.actors.flatMap(a=>Object.keys(a.resolved_skills)));
   root.render(h('div',{className:'game-frame'},h(BossField,{context:{...context,pack},app:{session,id:'readonly-speed178'},running:true,checkpoint:null,outcome:null,retreat:null,statsRef:{current:null},timelineRef:{current:null}})));
  };
 });
 for(const width of[320,390]){
  await page.setViewportSize({width,height:844});
  for(const reason of['REVISION_CONFLICT','SAVE_REQUEST_TIMEOUT','BATTLE_LEASE_EXPIRED','INVALID_SAVE_SLOT','not a public code']){
   await page.evaluate(reason=>window.deviceSaveSpeed.hud(reason),reason);
   const code=page.locator('.hud-alert .save-error-code'),expected='รหัส: '+(reason==='not a public code'?'UNKNOWN_SAVE_ERROR':reason);
   await page.waitForFunction(expected=>document.querySelector('.hud-alert .save-error-code')?.textContent===expected,expected);
   assert.equal(await code.innerText(),expected);
   assert(await page.locator('.hud-alert').evaluate(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&n.scrollWidth<=n.clientWidth;}));
   const previous=await page.evaluate(()=>window.deviceSaveSpeed.retries);await page.getByRole('button',{name:'เชื่อมต่อใหม่',exact:true}).click();assert.equal(await page.evaluate(()=>window.deviceSaveSpeed.retries),previous+1);
  }
  await page.evaluate(()=>window.deviceSaveSpeed.hud('BATTLE_LEASE_EXPIRED'));await page.waitForTimeout(80);await page.screenshot({path:`plan/evidence/task-177/error-${width}.png`});
  await page.getByRole('button',{name:'ตั้งค่า',exact:true}).click();await page.getByRole('dialog').getByText('รหัส: BATTLE_LEASE_EXPIRED',{exact:true}).waitFor();await page.getByRole('button',{name:'ปิด',exact:true}).click();
  checks.push({case:'bounded_save_code_retry_settings_'+width,passed:true});
 }
 await page.evaluate(()=>window.deviceSaveSpeed.battle());await page.locator('.chip-btn.speed').waitFor();
 assert.equal(await page.locator('.chip-btn.speed').innerText(),'3×');
 const speeds=[];for(const expected of[1,2,3]){
  await page.locator('.chip-btn.speed').click();assert.equal(await page.locator('.chip-btn.speed').innerText(),expected+'×');
  const sample=await page.evaluate(()=>new Promise(resolve=>{const at=performance.now(),game=window.deviceSaveSpeed.session.state.game_time_ms;setTimeout(()=>resolve({wall:performance.now()-at,game:window.deviceSaveSpeed.session.state.game_time_ms-game}),250);}));
  assert(Math.abs(sample.game-sample.wall*expected)<150+sample.wall*.15,JSON.stringify({expected,...sample}));speeds.push({expected,...sample});
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('ro.battleSpeed')),'3');checks.push({case:'actual_saved_BossField_old4_to3_then1_2_3_virtual_clock',speeds,passed:true});
 await page.evaluate(()=>{window.deviceSaveSpeed.root.unmount();window.deviceSaveSpeed.pack.dispose();});
 await page.goto(base+'/skill-preview?job=hunter');await page.getByRole('button',{name:'หยุดชั่วคราว',exact:true}).click();const preview=page.getByRole('button',{name:'ความเร็ว',exact:true});for(const expected of[1,2,3,1]){assert.equal(await preview.innerText(),'×'+expected);await preview.click();}checks.push({case:'preview',passed:true});
 await page.goto(base+'/demo');await page.getByRole('button',{name:'หยุดชั่วคราว',exact:true}).click();const demo=page.getByRole('button',{name:'เปลี่ยนความเร็วต่อสู้',exact:true});for(const expected of[1,2,3,1]){assert.equal(await demo.innerText(),expected+'×');await demo.click();}checks.push({case:'demo_only1_2_3',passed:true});
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 }catch(e){failure=String(e.stack??e);await page?.screenshot({path:'plan/evidence/task-178/native-failed.png'}).catch(()=>{});}finally{
  await browser?.close();const report={passed:!failure&&checks.length===5,checks,errors,writes,failure,scope:'Actual UI/real shared engine, synthetic Hunter only; not owner save recovery or physical-phone reproduction.'};
  fs.writeFileSync('plan/evidence/task-178/native.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync('plan/evidence/task-177/native.json',JSON.stringify({...report,actual_owner_cause:'unknown',owner_recovered:false},null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
 }
})();
