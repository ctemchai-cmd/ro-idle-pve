// Isolated real components/native icons; no Auth, owner save, or balance batch.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),checks=[],errors=[],mutations=[];
const assert=(ok,why)=>{if(!ok)throw Error(why);};
(async()=>{let server,browser,temp,failure;try{
 temp=fs.mkdtempSync(path.join(os.tmpdir(),'ro-spirit-growth-'));
 const {createServer}=await import('vite');
 const module=`
 import React from 'react';import {createRoot} from 'react-dom/client';
 import '/src/ui/style.css';import '/src/ui/modern-theme.css';import '/src/ui/game/game.css';
 import {SkillsPage} from '/src/ui/game/skills.tsx';import {BuddyPage} from '/src/ui/game/buddy.tsx';
 import {CombatStatusStrip} from '/src/ui/game/combat-status.tsx';import {AssetPack} from '/src/renderer/pack.ts';
 import {initializeAccount} from '/src/domain/progression/initialize.ts';import {resolveSkill} from '/src/domain/build/resolve-skill.ts';
 import {recomputeStats} from '/src/domain/combat/status.ts';import {battleRenderView} from '/src/client/story.ts';
 import {actor,battle,checkpoint,content} from '/tests/game/combat-fixtures.ts';
 const state=initializeAccount(content,{root_job_id:'acolyte',gender:'male'},'2026-10-22T00:00:00Z','2026-10-22',1),main=state.roster[0];
 main.level=70;main.job_id='monk';main.skill_levels.monk_call_spirits=6;main.skill_levels.monk_spirit_combo=10;main.active_slots=['monk_call_spirits',null,null,null];
 state.inventory.push({instance_id:'probe_weapon',kind:'equipment',definition_id:'equipment_knuckle_1',rarity_id:'rare',locked:false,training:false,options:[]});
 main.equipment.weapon='probe_weapon';main.slot_progress.weapon.refine=5;main.slot_progress.weapon.enchant={line_id:'offense',level:5};
 const pack=await AssetPack.open(),mount=createRoot(document.getElementById('probe'));let sequence=0;window.probeCommands=[];
 const context={state,pack,locked:false,busy:false,characterId:main.character_id,latest:()=>state,go:()=>{},selectCharacter:()=>{},toast:()=>{},challenge:()=>{},lastCode:()=>null,lastCreated:()=>[],submit:async(...args)=>{window.probeCommands.push(args);return false;},submitWhenReady:async()=>false};
 window.renderProbe=(view,level=6)=>{main.skill_levels.monk_call_spirits=level;let component;
 if(view==='status'){const input=actor('main','player');input.resolved_skills.monk_call_spirits=structuredClone(resolveSkill('monk_call_spirits',level,content));const st=checkpoint(battle([input,actor('boss','enemy')])),a=st.actors.find(a=>a.actor_id==='main');a.spirit_spheres=3;recomputeStats(a,content);const v=battleRenderView(st,{main:'คุณ · Monk',boss:'Poring'});component=React.createElement(CombatStatusStrip,{actor:v.actors.find(a=>a.actor_id==='main'),actors:v.actors,pack,now:0,focus:true});}
 else component=React.createElement(view==='buddy'?BuddyPage:SkillsPage,{context});
 mount.render(React.createElement('div',{className:'game-root',key:++sequence},React.createElement('div',{className:'game-frame'},React.createElement('main',{className:'game-main'},component))));};
 window.probeReady=true;window.renderProbe('skills');`;
 server=await createServer({root,envDir:temp,mode:'test',plugins:[{name:'spirit-growth-probe',enforce:'pre',resolveId(id){if(id==='/__spirit_probe.jsx')return id;},load(id){if(id==='/__spirit_probe.jsx')return module;},configureServer(v){v.middlewares.use(async(req,res,next)=>{if(req.url!=='/__spirit_probe')return next();const html=await v.transformIndexHtml('/__spirit_probe','<!doctype html><html data-theme="ro"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="probe"></div><script type="module" src="/__spirit_probe.jsx"></script></body></html>');res.writeHead(200,{'Content-Type':'text/html'});res.end(html);});}}],server:{host:'127.0.0.1',port:0}});await server.listen();
 browser=await chromium.launch({headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))mutations.push(new URL(r.url()).pathname);});
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__spirit_probe');await page.waitForFunction(()=>window.probeReady);
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});await page.evaluate(()=>window.renderProbe('buddy'));const tile=page.getByRole('button',{name:/^ช่อง อาวุธ/});await tile.locator('.progress-enchant').waitFor();
  assert(await tile.locator('.progress-refine').innerText()==='+5'&&await tile.locator('.progress-enchant').innerText()==='5','NUMERIC_BADGES');
  assert(await tile.locator('.equipment-progress').getAttribute('aria-label')==='Refine +5 · Enchant 5','ACCESSIBLE_NAMES');
  assert(await tile.locator('.progress-refine').evaluate(n=>getComputedStyle(n).backgroundColor)==='rgb(38, 105, 198)'&&await tile.locator('.progress-enchant').evaluate(n=>getComputedStyle(n).backgroundColor)==='rgb(134, 81, 199)','BADGE_COLORS');
  assert(await page.locator('.equipment-progress').count()===1,'EMPTY_SLOT_BADGES');await page.screenshot({path:path.join(root,`plan/evidence/task-084-badges-${width}.png`)});
 }
 checks.push('Real BuddyPage at320/390: +5 /5, blue/purple, descriptive accessible names, no empty-slot badges');
 for(const [level,count,percent]of [[1,1,1],[5,5,1],[6,5,1.2],[10,5,2]]){
  await page.evaluate(level=>window.renderProbe('skills',level),level);await page.locator('.effect-block').filter({hasText:`ตอนนี้ Lv.${level}`}).waitFor();const text=await page.locator('.effect-block').innerText();assert(text.includes(`Spirit Sphere ${count} ลูก`)&&text.includes(`${percent}% ต่อลูก`),'RANK_DESCRIPTION_'+level);
  assert(await page.locator('.skill-growth-note').count()===0,'SP_ONLY_NOTE');
 }
 for(const width of[320,390]){await page.setViewportSize({width,height:844});await page.evaluate(()=>window.renderProbe('skills',6));await page.locator('.skill-upgrade-diff').filter({hasText:'1.4%'}).waitFor();await page.locator('.skill-levels summary').click();assert(await page.locator('.skill-levels li').count()===10,'TEN_RANK_ROWS');assert((await page.locator('.skill-levels li').first().innerText()).includes('1 ลูก')&&(await page.locator('.skill-levels li').last().innerText()).includes('2%'),'RANK_TABLE');assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'MOBILE_OVERFLOW');await page.screenshot({path:path.join(root,`plan/evidence/task-084-call-spirit-${width}.png`)});}
 checks.push('Actual SkillsPage1/5/6/10 and expanded ten-rank SkillGrowth320/390: counts/percent/next-level delta, no SP-only note or horizontal overflow');
 await page.evaluate(()=>window.renderProbe('status',6));await page.getByRole('button',{name:/Spirit Sphere 3 จาก 5 ลูก ATK เพิ่ม 3.6/}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();assert((await dialog.innerText()).includes('ATK +3.6%')&&(await dialog.innerText()).includes('ATK 1.2%'),'DECIMAL_BONUS_DETAILS');await page.locator('[data-skill-icon="monk_call_spirits"]').first().waitFor();await page.screenshot({path:path.join(root,'plan/evidence/task-084-sphere-details-390.png')});
 assert((await page.evaluate(()=>window.probeCommands)).length===0&&!mutations.length&&!errors.length,'WRITE_OR_BROWSER_ERROR');checks.push('Real shared-engine rank6/three-sphere status dialog shows3.6%total/1.2%each/nativeCallSpirit icon; zero commands/API writes');
 }catch(e){failure=e.stack||String(e);}finally{if(browser)await browser.close();if(server)await server.close();if(temp)fs.rmSync(temp,{recursive:true,force:true});const report={task_id:'TASK-084',passed:!failure&&checks.length===3,checks,errors,mutations,failure,scope:'Real components/shared-engine fixed fixture in isolated desktop Chrome emulating320/390px, not owner phone or Auth/save integration.',owner_cloud_writes:false,personal_preview_restarted:false,balance_simulation:false};fs.writeFileSync(path.join(root,'plan/evidence/task-084-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
})();
