// TASK-020 round10: timing comes from the engine; native casting audio is a presentation cue.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.RO_PREVIEW_URL||'http://127.0.0.1:5173';
const checks=[],errors=[],external=[],assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
async function check(id,fn){const result=await fn();checks.push({case_id:id,passed:true,result});console.log(JSON.stringify({check:id,passed:true}));}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP${r.status()}:${r.url()}`);});
  await page.route('**/*',route=>{const url=route.request().url();if(url.startsWith(base+'/')||url.startsWith('data:'))route.continue();else{external.push(url);route.abort();}});
  await page.goto(base);await page.waitForFunction(()=>document.querySelectorAll('.companion').length===4&&!document.querySelector('.arena-overlay'));
  await page.getByRole('button',{name:'หยุดชั่วคราว',exact:true}).click();
  await page.evaluate(async()=>{
   const loaded=pathname=>{const entry=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname===pathname);if(!entry)throw new Error('Missing module:'+pathname);return import(entry.name);};
   const {DemoSession}=await loaded('/src/client/demo.ts'),{BattleAudio}=await loaded('/src/renderer/audio.ts');window.__DemoSession=DemoSession;
   const advance=DemoSession.prototype.advanceTo,enable=BattleAudio.prototype.enable,sound=BattleAudio.prototype.sound,stop=BattleAudio.prototype.stopSound;
   window.__castEvents=[];window.__soundCalls=[];window.__stopCalls=[];
   DemoSession.prototype.advanceTo=function(...args){const events=advance.apply(this,args);window.__liveSession=this;window.__castEvents.push(...events);return events;};
   BattleAudio.prototype.enable=function(...args){window.__mixer=this;return enable.apply(this,args);};
   BattleAudio.prototype.sound=function(ref,channel){window.__soundCalls.push({ref,channel,game_ms:window.__liveSession?.state.game_time_ms});if(window.__isolateCast&&!channel?.startsWith('cast:'))return Promise.resolve();return sound.call(this,ref,channel);};
   BattleAudio.prototype.stopSound=function(channel){window.__stopCalls.push({channel,game_ms:window.__liveSession?.state.game_time_ms});return stop.call(this,channel);};
  });
  await check('icon_time_rails_soft_grid_and_ASPD_first_casts',async()=>{
   await page.getByRole('button',{name:'Timeline',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.timeline-entry').length>5);
   const timings=await page.evaluate(()=>{const s=new window.__DemoSession();return [...document.querySelectorAll('.timeline-row')].map(row=>{const id=row.dataset.actor,a=s.initial.actors.find(a=>a.actor_id===id),entries=[...row.querySelectorAll('.timeline-entry')];return{id,aspd:a.stats.attack_speed,phase_ready_at:a.phase_ready_at,start_ms:Number(entries[0].dataset.startMs),label:entries[0].querySelector('time').textContent,title:entries[0].querySelector('button').title};});});
   assert(timings.every(r=>r.start_ms===r.phase_ready_at),'Timeline invented a start offset');assert(new Set(timings.filter(r=>r.id!=='enemy_front').map(r=>r.start_ms)).size===4,'Demo ASPD not differentiated');
   assert(await page.locator('.timeline-skill-name').count()===0,'Visible skill names remain');
   const geometry=await page.evaluate(()=>({rows:[...document.querySelectorAll('.timeline-row')].map(n=>({actor:n.dataset.actor,border:getComputedStyle(n).borderBottomWidth,rail:getComputedStyle(n.querySelector('.timeline-track'),'::before').borderTopWidth,rail_content:getComputedStyle(n.querySelector('.timeline-track'),'::before').content})),grid:{style:getComputedStyle(document.querySelector('.timeline-grid')).borderLeftStyle,opacity:getComputedStyle(document.querySelector('.timeline-grid')).opacity},now:getComputedStyle(document.querySelector('.timeline-now')).borderLeftStyle}));
   assert(geometry.rows.every(r=>r.border==='0px'&&r.rail==='1px'&&r.rail_content==='""'),'Wrong horizontal rail placement');assert(geometry.grid.style==='dashed'&&Number(geometry.grid.opacity)<=.3&&geometry.now==='dashed','Vertical grid not subdued');
   const sizes=[];for(const [width,height]of[[390,844],[360,640],[1280,900]]){await page.setViewportSize({width,height});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!overflow,'Viewport overflow');await page.screenshot({path:path.join(root,`docs/screenshots/timeline-rails-${width}.png`),animations:'disabled'});sizes.push({width,height,overflow});}
   await page.setViewportSize({width:390,height:844});await page.getByRole('combobox',{name:'ช่วงเวลา Timeline',exact:true}).selectOption('10000');await page.locator('.timeline-skill').first().click();const detail=await page.locator('.timeline-detail').innerText();assert(detail.includes('เริ่ม')&&detail.includes('ร่าย'),'Accessible skill details lost');
   const before=await page.locator('.timeline-content').first().evaluate(n=>getComputedStyle(n).transform);await page.waitForTimeout(180);assert(before===await page.locator('.timeline-content').first().evaluate(n=>getComputedStyle(n).transform),'Paused Timeline drifts');await page.keyboard.press('Escape');return{timings,geometry,sizes,zoom_and_details:true,pause_stable:true};
  });
  await check('actual_native_cast_start_signal_and_lifecycle',async()=>{
   await page.getByRole('button',{name:'เปิดเสียง',exact:true}).click();await page.waitForFunction(()=>window.__mixer?.snapshot().enabled);
   await page.evaluate(()=>{const m=window.__mixer,a=m.context.createAnalyser();a.fftSize=256;m.bus.connect(a);window.__castAnalyser=a;window.__isolateCast=true;window.__soundCalls=[];window.__stopCalls=[];});
   await page.getByRole('button',{name:'เล่นต่อ',exact:true}).click();
   const signal=await page.evaluate(async()=>{const a=window.__castAnalyser,data=new Float32Array(a.fftSize),until=performance.now()+4300;let peak=0,nonzero=0;await new Promise(resolve=>{function sample(){a.getFloatTimeDomainData(data);const value=Math.max(...data.map(Math.abs));peak=Math.max(peak,value);if(value>.00001)nonzero++;if(performance.now()<until)requestAnimationFrame(sample);else resolve();}sample();});return{peak,nonzero_frames:nonzero};});
   await page.getByRole('button',{name:'หยุดชั่วคราว',exact:true}).click();
   const result=await page.evaluate(()=>{const s=window.__liveSession,castRef=s.content.manifest.runtime_asset_pack_hash;return{pack_hash:castRef,starts:window.__castEvents.filter(e=>e.type==='cast_start').map(e=>({actor:e.actor_id,at:e.at_ms,duration:e.cast_duration_ms})),resolves:window.__castEvents.filter(e=>['cast_resolve','cast_interrupt','death'].includes(e.type)).map(e=>({actor:e.actor_id,at:e.at_ms,type:e.type})),sounds:window.__soundCalls.filter(s=>s.channel?.startsWith('cast:')),stops:window.__stopCalls,state:window.__mixer.snapshot()};});
   const index=JSON.parse(fs.readFileSync(path.join(root,'runtime/ro/manifest.json'))),expected=index.audio_events.cast_start.id;
   const positive=result.starts.filter(e=>e.duration>0),instant=result.starts.filter(e=>e.duration===0);assert(signal.peak>.00001&&signal.nonzero_frames>0,'No native cast waveform');assert(positive.length>=3&&positive.every(e=>result.sounds.some(s=>s.channel==='cast:'+e.actor&&s.ref===expected)),'Missing positive cast audio');assert(instant.every(e=>!result.sounds.some(s=>s.channel==='cast:'+e.actor)),'Instant skill played casting cue');assert(result.state.active_effects===0,'Cast cue outlived completion');
   assert(positive.every(e=>result.resolves.some(r=>r.actor===e.actor&&r.at>e.at)),'Cast not completed in sample');
   return{...signal,...result,scope:'Live UI events routed through native beginspell audio. Non-cast SFX suppressed only in this instrumented sample to isolate actual cast waveform; BGM plays on its separate media element. Objective signal/lifecycle, not subjective listening.'};
  });
  await check('selected_pack_local_media_decode_and_clean_browser',async()=>{
   const media=await page.evaluate(async()=>{const entry=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/renderer/pack.ts'),{AssetPack}=await import(entry.name),p=await AssetPack.open(),s=new window.__DemoSession();await p.prepare(s.scene,s.view().actors.flatMap(a=>a.slots.filter(Boolean)));const result={...await p.validateMedia(),pack_hash:p.index.pack_hash,assets:Object.keys(p.index.assets).length};p.dispose();return result;});assert(media.images===216&&media.audio===35&&media.font&&media.assets===252,'Media decode regression');assert(!errors.length&&!external.length,JSON.stringify({errors,external}));return media;
  });
 }finally{
  await browser.close();const inputs=['src/ui/skill-timeline.tsx','src/ui/timeline.css','src/ui/modern-theme.css','src/ui/adventure.css','src/client/demo.ts','src/contracts/presentation.ts','src/domain/combat/engine.ts','src/renderer/battle.ts','src/renderer/audio.ts','src/renderer/pack.ts','assets/ro/prepared/game-pack.json','assets/ro/library/effects/sound/ef_beginspell--082e3c4a333c.meta.json','runtime/ro/manifest.json','src/generated/runtime-manifest.json','scripts/build_preparation_manifest.py','scripts/test_timeline_casting.cjs'];const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');const shots=[390,360,1280].map(width=>`docs/screenshots/timeline-rails-${width}.png`).filter(p=>fs.existsSync(path.join(root,p)));
  fs.writeFileSync(path.join(root,'plan/evidence/task-020-timeline-cast-browser.json'),JSON.stringify({task_id:'TASK-020',round:10,date:'2026-10-20',passed:checks.length===3&&checks.every(c=>c.passed)&&!errors.length&&!external.length,checks,errors,external_requests:external,input_sha256:Object.fromEntries(inputs.map(p=>[p,hash(p)])),screenshots:Object.fromEntries(shots.map(p=>[p,hash(p)])),scope:'Chrome mobile/desktop emulation; shared-engine first-cast timing and actual native cast audio waveform. No physical device/Safari or subjective listening certification.'},null,2)+'\n');
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
