// Readonly native pixel/rig comparison. No login, account, commands or owner saves.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const base=process.env.RO_PREVIEW_URL,out=path.resolve('plan/evidence/task-174');
assert(base&&new URL(base).hostname==='127.0.0.1');fs.mkdirSync(out,{recursive:true});
(async()=>{let browser;const checks=[],errors=[],writes=[];try{
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname);});
 await page.goto(base+'/animation-preview');await page.getByRole('button',{name:'หยุดภาพ',exact:true}).click();
 checks.push(await page.evaluate(async()=>{
  const [{AssetPack},native,{NativeActorTween,actorTweenSample},{presetSwing}]=await Promise.all([import('/src/renderer/pack.ts'),import('/src/renderer/native.mjs'),import('/src/renderer/actor-tween.ts'),import('/src/renderer/actor-animation.ts')]);
  const pack=await AssetPack.open(),rows=[],canvas=document.createElement('canvas');canvas.width=canvas.height=600;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
  const digest=p=>{let h=2166136261;for(const n of p)h=Math.imul(h^n,16777619);return h>>>0;};
  const rig=async gender=>{const p=pack.index.actor_jobs.find(j=>j.job_id==='swordsman').presets.find(p=>p.gender===gender);const [body,head,weapon]=await Promise.all([pack.asset(p.body.meta),pack.asset(p.head.meta),pack.asset(p.weapon.meta)]);return{body,head,weapon,...presetSwing(p)};};
  for(const gender of['male','female']){const parts=await rig(gender),before=JSON.stringify(Object.values(parts).filter(v=>v?.meta).map(v=>v.meta)),tween=new NativeActorTween();
   const paint=(at,facing,enabled,method='new',state='attack')=>{ctx.clearRect(0,0,600,600);if(method==='old')native.drawActor(ctx,parts,state,at,300,450,facing,2);else tween.draw(ctx,parts,state,at,300,450,facing,2,enabled);return ctx.getImageData(0,0,600,600).data;};
   for(const facing of['left','right']){let exact=0;for(let at=0;at<=900;at+=100){const a=digest(paint(at,facing,true,'old')),b=digest(paint(at,facing,true));if(a!==b)throw Error('NATIVE_KEY_CHANGED:'+gender+facing+at);exact++;}
    for(const state of['idle','walk','standby','hurt','dead'])if(digest(paint(450,facing,true,'old',state))!==digest(paint(450,facing,true,'new',state)))throw Error('OTHER_STATE_CHANGED');
    for(const at of[50,350,450,550,850])if(digest(paint(at,facing,false))!==digest(paint(at,facing,true,'old')))throw Error('REDUCED_MOTION_CHANGED');
    const old=new Set(),fresh=new Set();for(let at=0;at<900;at+=25){old.add(digest(paint(at,facing,true,'old')));fresh.add(digest(paint(at,facing,true)));const p=paint(at,facing,true);for(let x=0;x<600;x++)if(p[x*4+3]||p[((599*600)+x)*4+3])throw Error('VERTICAL_CROP');for(let y=0;y<600;y++)if(p[(y*600)*4+3]||p[(y*600+599)*4+3])throw Error('HORIZONTAL_CROP');}
    if(fresh.size<18||fresh.size<=old.size)throw Error('NO_NEW_POSES');rows.push({gender,facing,exact_native_keys:exact,original_distinct_samples:old.size,computed_distinct_samples:fresh.size,uncropped:true});
   }
   if(JSON.stringify(Object.values(parts).filter(v=>v?.meta).map(v=>v.meta))!==before)throw Error('MUTATED_METADATA');
   // One shared scratch allocation survives repeated texture mixes; no per-frame surfaces.
   for(let i=0;i<200;i++)paint(350,'right',true);if(tween.scratchBytes!==1769472)throw Error('SCRATCH_GROWTH');
   let common=0;const originalDraw=ctx.drawImage;ctx.drawImage=function(...args){if(args[0]===tween.surfaces[2]){const [first,second,mix]=tween.surfaces.map(c=>c.getContext('2d').getImageData(0,0,384,384).data);for(let i=3;i<first.length;i+=4)if(first[i]===255&&second[i]===255){common++;if(mix[i]<254)throw Error('COMMON_OPACITY_DARKENED');}}return originalDraw.apply(this,args);};paint(350,'right',true);ctx.drawImage=originalDraw;if(common<100)throw Error('NO_COMMON_PIXEL_ORACLE');
   for(const at of[50,350,450,550,850]){const right=Uint8ClampedArray.from(paint(at,'right',true)),left=paint(at,'left',true);for(let y=0;y<600;y++)for(let x=0;x<600;x++)for(let k=0;k<4;k++)if(right[(y*600+x)*4+k]!==left[(y*600+599-x)*4+k])throw Error('MIRROR_CHANGED:'+at);}
   for(const at of[350,450,550,850]){const sample=actorTweenSample(parts,'attack',at);if(!sample||sample.anchor[1]>=0)throw Error('INVALID_RIG_ANCHOR');}
  }
  window.actorTween174={pack,rig,native,NativeActorTween,canvas};return{case:'native_keys_poses_rig_reduced_motion_memory',rows,scratch_bytes:1769472,exact_mirrors:true,common_pixel_opacity_preserved:true};
 }));
 // Real art, large comparison sheet. Original in first column, computed in second.
 const sheet=await page.evaluate(async()=>{const p=window.actorTween174,c=document.createElement('canvas');c.width=880;c.height=1120;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#edf5ff';x.fillRect(0,0,c.width,c.height);x.fillStyle='#274465';x.font='18px system-ui';
  let row=0;for(const gender of['male','female']){const parts=await p.rig(gender),t=new p.NativeActorTween();for(const at of[350,450,550,850]){const foot=135+row*135;x.fillText(gender+' '+at+'ms',8,foot-90);p.native.drawActor(x,parts,'attack',at,330,foot,'right',1.4);t.draw(x,parts,'attack',at,650,foot,'right',1.4);row++;}}return c.toDataURL().split(',')[1];});fs.writeFileSync(path.join(out,'poses.png'),Buffer.from(sheet,'base64'));
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 checks.push(await page.evaluate(async()=>{const p=window.actorTween174,parts=await p.rig('male'),t=new p.NativeActorTween(),x=p.canvas.getContext('2d'),timings=[];for(let i=0;i<40;i++)t.draw(x,parts,'attack',350,300,450,'right',2);
  for(let i=0;i<180;i++){const start=performance.now();x.clearRect(0,0,600,600);for(let a=0;a<4;a++)t.draw(x,parts,'attack',(i*17+a*43)%899,300,450,'right',2);timings.push(performance.now()-start);}timings.sort((a,b)=>a-b);return{case:'bounded_four_actor_draw_cpu4x',median_ms:timings[90],p95_ms:timings[171],scratch_bytes:t.scratchBytes};}));await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 assert(checks.at(-1).p95_ms<16.7,'four actor prototype exceeds frame budget in bounded draw');
 checks.push(await page.evaluate(async()=>{
  const [{DemoSession},{BattleRenderer}]=await Promise.all([import('/src/client/demo.ts'),import('/src/renderer/battle.ts')]),p=window.actorTween174,s=new DemoSession('boss',2);
  await p.pack.prepare(s.scene,s.view().actors.flatMap(a=>a.slots.filter(Boolean)));
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1440;
  const r=new BattleRenderer(canvas,p.pack,s.scene),before=JSON.stringify(s.initial),hash=()=>{const d=canvas.getContext('2d').getImageData(0,0,720,1440).data;let h=0;for(const n of d)h=(Math.imul(h,31)+n)|0;return h;};
  const view=s.view();r.accept([{type:'normal_attack',actor_id:'main',at_ms:0,phase:0,sequence:1}]);
  r.smoothActors=false;r.draw(view,450,450);const old=hash();r.smoothActors=true;r.draw(view,450,450);if(hash()===old)throw Error('MAIN_RENDERER_NOT_INTEGRATED');
  r.motion=false;r.draw(view,450,450);const reduced=hash();r.smoothActors=false;r.draw(view,450,450);if(hash()!==reduced)throw Error('MAIN_REDUCED_CHANGED');
  if(JSON.stringify(s.initial)!==before)throw Error('BATTLE_MUTATED');return{case:'actual_battle_renderer_swordsman_allowlist_reduced_motion',passed:true,engine_state_unchanged:true};
 }));
 checks.push(await page.evaluate(async()=>{
  const {wardrobeRefs}=await import('/src/renderer/shell.ts'),p=window.actorTween174,x=p.canvas.getContext('2d'),rows=[];
  for(const gender of['male','female'])for(const tier of[1,20,40,60,80,100]){
   const refs=wardrobeRefs(p.pack.index,'swordsman',gender,{head_tier:tier,garment_tier:tier}),parts=await p.rig(gender);
   if(refs.headgear)parts.headgear=await p.pack.asset(refs.headgear);if(refs.garment)parts.garment=await p.pack.asset(refs.garment);
   const t=new p.NativeActorTween(),old=JSON.stringify(Object.values(parts).filter(a=>a?.meta).map(a=>a.meta));
   for(const facing of['left','right'])for(let at=0;at<900;at+=25){x.clearRect(0,0,600,600);t.draw(x,parts,'attack',at,300,450,facing,2);}
   if(JSON.stringify(Object.values(parts).filter(a=>a?.meta).map(a=>a.meta))!==old)throw Error('WARDROBE_METADATA_MUTATED');rows.push({gender,tier,headgear:refs.headgear,garment:refs.garment});
  }return{case:'native_worn_headgear_garment_all_tiers_and_facings',rows};
 }));
 for(const width of[320,390]){await page.setViewportSize({width,height:844});for(const gender of['ชาย','หญิง']){await page.getByRole('button',{name:gender,exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.state==='attack');const slider=page.getByRole('slider');await slider.fill('450');await page.getByRole('button',{name:/หัน/}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,`preview-${width}-${gender==='ชาย'?'male':'female'}.png`)});}checks.push({case:'mobile_controls_'+width,overflow:false,gender_facing_pause_scrub:true});}
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await reduced.goto(base+'/animation-preview');await reduced.getByRole('button',{name:'เล่นต่อ',exact:true}).waitFor();await reduced.waitForFunction(()=>document.querySelector('canvas')?.dataset.time==='0');await reduced.waitForTimeout(150);assert.equal(await reduced.locator('canvas').getAttribute('data-time'),'0');checks.push({case:'reduced_motion_initially_static',passed:true});await reduced.close();
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);fs.writeFileSync(path.join(out,'native.json'),JSON.stringify({passed:true,checks,page_errors:errors,writes},null,2));console.log(JSON.stringify({passed:true,groups:checks.length,checks}));
 }catch(e){fs.writeFileSync(path.join(out,'native-failure.json'),JSON.stringify({error:String(e),checks,errors,writes},null,2));throw e;}finally{await browser?.close();}})();
