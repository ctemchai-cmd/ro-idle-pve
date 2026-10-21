// TASK-020 round7: compact timeline labels and actual caster normal-attack missiles.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.RO_PREVIEW_URL||'http://127.0.0.1:5173',checks=[],errors=[],external=[];
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
async function check(id,fn){try{const result=await fn();checks.push({case_id:id,passed:true,result});console.log(JSON.stringify({check:id,passed:true}));}catch(error){checks.push({case_id:id,passed:false,error:String(error)});throw error;}}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)errors.push(`HTTP${response.status()}:${response.url()}`);});
  await page.route('**/*',route=>{const url=route.request().url();if(url.startsWith(base+'/')||url.startsWith('data:'))route.continue();else{external.push(url);route.abort();}});
  await page.goto(base);await page.waitForSelector('.companion');await page.waitForFunction(()=>!document.querySelector('.arena-overlay'));
  await check('compact_labels_leave_more_visible_time_at_all_viewports',async()=>{
   await page.getByRole('button',{name:'หยุดชั่วคราว',exact:true}).click();await page.getByRole('button',{name:'Timeline',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.timeline-entry').length>5);
   const sizes=[];
   for(const [width,height]of[[360,640],[390,844],[1280,900]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(80);
    const layout=await page.evaluate(()=>{const labels=[...document.querySelectorAll('.timeline-row .timeline-actor-label')],track=document.querySelector('.timeline-row .timeline-track'),region=document.querySelector('.timeline-now-region'),viewport=document.querySelector('.timeline-viewport');return{labels:labels.map(node=>({text:node.innerText,title:node.title,width:node.getBoundingClientRect().width})),trackLeft:track.getBoundingClientRect().left,nowLeft:region.getBoundingClientRect().left,visibleTimeWidth:viewport.getBoundingClientRect().right-track.getBoundingClientRect().left,overflow:document.documentElement.scrollWidth>innerWidth};});
    assert(layout.labels.every(label=>label.width<=68.1),'Name column still too wide');assert(layout.labels[0].text==='คุณ\nSwordsman','Main label not shortened');assert(layout.labels.some(label=>label.text==='เรน\nMage'),'Mage name/class not split');assert(layout.labels.some(label=>label.text==='poring\nบอส'),'Boss label not compact');assert(layout.labels.every(label=>label.title),'Full names inaccessible');assert(Math.abs(layout.trackLeft-layout.nowLeft)<.5,'Now marker not aligned after shrinking labels');assert(layout.visibleTimeWidth>200&&!layout.overflow,'Timeline space/overflow regressed');sizes.push({width,height,...layout});
    if(width===390)await page.screenshot({path:path.join(root,'docs/screenshots/timeline-compact-labels.png')});
   }
   await page.setViewportSize({width:390,height:844});await page.getByLabel('ช่วงเวลา Timeline').selectOption('10000');await page.getByLabel('ช่วงเวลา Timeline').selectOption('20000');await page.getByRole('button',{name:'เล่น Timeline ต่อ',exact:true}).click();
   const moving=await page.evaluate(async()=>{const el=document.querySelector('.timeline-now'),positions=[];await new Promise(resolve=>{let n=0;function frame(){positions.push(el.getBoundingClientRect().left);if(++n<30)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});return positions.slice(1).filter((x,i)=>Math.abs(x-positions[i])>.01).length;});assert(moving>20,'Timeline no longer moves each frame');await page.getByRole('button',{name:'หยุด Timeline',exact:true}).click();await page.keyboard.press('Escape');return{sizes,moving_frames_out_of29:moving,zoom_pause:true};
  });
  await check('actual_normal_attacks_launch_caster_orbs_before_any_skill',async()=>{
   const result=await page.evaluate(async()=>{
    const {DemoSession}=await import('/src/client/demo.ts'),{AssetPack}=await import('/src/renderer/pack.ts'),{BattleRenderer}=await import('/src/renderer/battle.ts'),{canonical}=await import('/src/content/value.ts');
    const pack=await AssetPack.open(),samples=[];let captured=false;
    const canvas=document.createElement('canvas');canvas.id='caster-normal-proof';canvas.width=720;canvas.height=820;canvas.style.cssText='position:fixed;z-index:999;top:0;left:50%;transform:translateX(-50%);width:360px;height:410px';document.body.append(canvas);
    for(const job of ['mage','wizard','sage']){
     const session=new DemoSession('boss',2);const appearance=session.scene.actors.find(a=>a.actor_id==='npc_mage');const scene={...session.scene,actors:session.scene.actors.map(a=>a.actor_id===appearance.actor_id?{...a,job_id:job}:a)};await pack.prepare(scene,session.view().actors.flatMap(a=>a.slots.filter(Boolean)));const renderer=new BattleRenderer(canvas,pack,scene);renderer.selected='npc_mage';let event;
     for(let at=50;at<3000&&!event;at+=50){const events=session.advanceTo(at);renderer.accept(events);event=events.find(e=>e.type==='normal_attack'&&e.actor_id==='npc_mage');}
     if(!event)throw new Error('No real mage normal before first skill');if(session.history.some(e=>e.type==='cast_start'))throw new Error('Caster shot fixture confounded by skill');
     const spec=pack.index.combat_visuals.normal_attacks[job]?.special_sfx[0];if(spec?.shape!=='orb')throw new Error('Missing caster default projectile:'+job);
     renderer.draw(session.view(),event.at_ms+spec.release_ms+spec.travel_ms*.5);const shots=renderer.frameStats.projectiles.filter(s=>s.source==='npc_mage');if(!shots.some(s=>s.target===event.target_id&&s.shape==='orb'))throw new Error('No actual normal orb:'+job);
     samples.push({job,normal_attack_at_ms:event.at_ms,target:event.target_id,source_world:event.world_source,target_world:event.world_target,shots,gameplay_class_fixture:'mage; job presentation varied to cover mage/wizard/sage default missile configuration'});
     if(!captured){captured=true;window.__casterProof=canvas.toDataURL();}
     session.advanceTo(90000);const reference=new DemoSession('boss',2);reference.advanceTo(90000);if(canonical(session.state)!==canonical(reference.state)||canonical(session.history)!==canonical(reference.history))throw new Error('Missile rendering altered engine');
    }
    const image=new Image();image.src=window.__casterProof;await image.decode();canvas.getContext('2d').drawImage(image,0,0);window.__casterPack=pack;return{samples,normal_only:true,exact_state_events_metrics:true,pack_hash:pack.index.pack_hash};
   });
   await page.locator('#caster-normal-proof').screenshot({path:path.join(root,'docs/screenshots/mage-normal-projectile.png')});await page.evaluate(()=>{document.querySelector('#caster-normal-proof').remove();window.__casterPack.dispose();});return result;
  });
  await check('rebuilt_pack_media_decodes_locally_without_errors',async()=>{
   const media=await page.evaluate(async()=>{const{AssetPack}=await import('/src/renderer/pack.ts'),{DemoSession}=await import('/src/client/demo.ts');const pack=await AssetPack.open(),s=new DemoSession();await pack.prepare(s.scene,s.view().actors.flatMap(a=>a.slots.filter(Boolean)));const result=await pack.validateMedia();const info={...result,pack_hash:pack.index.pack_hash,selected_ids:Object.keys(pack.index.assets).length};pack.dispose();return info;});assert(media.images===216&&media.audio===34&&media.font,'Media decode regression');assert(!errors.length&&!external.length,JSON.stringify({errors,external}));return media;
  });
 }finally{
  await browser.close();const inputs=['src/ui/skill-timeline.tsx','src/ui/timeline.css','src/renderer/combat-visuals.json','src/renderer/battle.ts','src/renderer/projectiles.ts','runtime/ro/manifest.json','src/generated/runtime-manifest.json','scripts/test_timeline_caster_polish.cjs'];const hashes=Object.fromEntries(inputs.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')]));fs.writeFileSync(path.join(root,'plan/evidence/task-020-timeline-caster-browser.json'),JSON.stringify({task_id:'TASK-020',round:7,date:'2026-10-20',passed:checks.length===3&&checks.every(c=>c.passed)&&!errors.length&&!external.length,checks,errors,external_requests:external,input_sha256:hashes,scope:'Targeted Chrome viewport/normal missile regression. Caster job appearances vary on same real mage combat input to isolate presentation. No claim of complete Wizard/Sage class gameplay validation.'},null,2)+'\n');
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
