// Frozen175 pixel reference versus cached60Hz poses; no account/Auth/commands.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const base=process.env.RO_PREVIEW_URL,out='plan/evidence/task-176';assert(base&&new URL(base).hostname==='127.0.0.1');
(async()=>{let browser;const checks=[],errors=[],writes=[];try{
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname);});
 await page.goto(base+'/animation-preview');await page.getByRole('button',{name:'หยุดภาพ',exact:true}).click();
 checks.push(await page.evaluate(async()=>{
  const[{AssetPack},{NativeActorTween:Before},{NativeActorTween:After,POSE_SAMPLE_MS},{presetSwing},{actorDuration},{wardrobeRefs},{BattleRenderer}]=await Promise.all([import('/src/renderer/pack.ts'),import('/plan/evidence/task-176/before-actor-tween.mjs'),import('/src/renderer/actor-tween.ts'),import('/src/renderer/actor-animation.ts'),import('/src/renderer/native.mjs'),import('/src/renderer/shell.ts'),import('/src/renderer/battle.ts')]);
  const pack=await AssetPack.open(),before=new Before(),after=pack.actorTween,c=document.createElement('canvas');c.width=c.height=320;const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=false;let keyPixels=0,poses=0,worn=0;
  const hash=()=>{let h=2166136261;for(const n of new Uint32Array(x.getImageData(0,0,320,320).data.buffer))h=Math.imul(h^n,16777619);return h>>>0;};
  const paint=(renderer,rig,state,time,facing,enabled=true)=>{x.clearRect(0,0,320,320);renderer.draw(x,rig,state,time,160,250,facing,1,enabled);return hash();};
  const rigs=[];for(const job of pack.index.actor_jobs)for(const p of job.presets){const[body,head,weapon]=await Promise.all([pack.asset(p.body.meta),pack.asset(p.head.meta),p.weapon?pack.asset(p.weapon.meta):undefined]);const rig={body,head,weapon,...presetSwing(p)},states=['attack',...(p.attack_variant_indices??[]).slice(1).map((_,i)=>'attack'+(i+2))];rigs.push({job:job.job_id,gender:p.gender,rig,states});const frozen=JSON.stringify([body.meta,head.meta,weapon?.meta]);
   for(const state of states)for(const facing of['left','right']){const length=actorDuration(rig,state);for(let frame=0;frame<length/100;frame++)for(let phase=0;phase<6;phase++){
     const time=(frame+phase/6)*100,a=paint(before,rig,state,time,facing),b=paint(after,rig,state,time,facing);if(a!==b)throw Error('CANONICAL_PIXEL_CHANGED:'+job.job_id+':'+p.gender+':'+state+':'+time);poses++;if(phase===0)keyPixels++;
    }
    for(const time of[99.9,399.9,length-0.1]){const frame=Math.floor(time/100),phase=Math.floor((time/100-frame)*6),sample=(frame+phase/6)*100;if(time-sample>POSE_SAMPLE_MS+1e-6||sample>time)throw Error('EARLY_OR_LATE_POSE');if(paint(after,rig,state,time,facing)!==paint(before,rig,state,sample,facing))throw Error('RELEASE_ADVANCED_EARLY');}
    for(const other of['idle','walk','standby','hurt','dead'])if(paint(after,rig,other,350,facing)!==paint(before,rig,other,350,facing))throw Error('OTHER_STATE_CHANGED');if(paint(after,rig,state,350,facing,false)!==paint(before,rig,state,350,facing,false))throw Error('REDUCED_MOTION_CHANGED');
   }
   for(const tier of[1,20,40,60,80,100]){const refs=wardrobeRefs(pack.index,job.job_id,p.gender,{head_tier:tier,garment_tier:tier}),w={...rig,headgear:refs.headgear?await pack.asset(refs.headgear):undefined,garment:refs.garment?await pack.asset(refs.garment):undefined};for(const state of states)for(const facing of['left','right'])for(const time of[350,actorDuration(rig,state)-50])if(paint(after,w,state,time,facing)!==paint(before,w,state,time,facing))throw Error('WORN_CROP_CHANGED:'+job.job_id+':'+tier);worn++;}
   if(JSON.stringify([body.meta,head.meta,weapon?.meta])!==frozen)throw Error('SOURCE_MUTATION');
  }
  const bounded=after.cacheStats();if(bounded.bytes>12*1024*1024||bounded.frames>256||bounded.evictions===0)throw Error('UNBOUNDED_CACHE');
  // New renderer/rig wrappers around the same assets reuse images; costume/weapon
  // replacement even on the same wrapper must create the correct new identity.
  const r=rigs[0].rig,draw=(rig)=>paint(after,rig,'attack',350,'right');draw(r);const warm=after.cacheStats();for(let n=0;n<100;n++)draw({...r});const hot=after.cacheStats();if(hot.compositions!==warm.compositions||hot.hits<warm.hits+100)throw Error('RECOMPOSED_IDENTICAL_RIG');
  const originalWeapon=r.weapon;r.weapon=undefined;if(draw(r)!==paint(before,r,'attack',350,'right'))throw Error('WEAPON_INVALIDATION');r.weapon=originalWeapon;draw(r);
  const scene={actors:[],skill_labels:{},enemy_recipes:{}};if(new BattleRenderer(c,pack,scene).actorTween!==new BattleRenderer(c,pack,scene).actorTween)throw Error('PER_RENDERER_CACHE');
  const result={case:'frozen175_canonical_pixels_all_rigs_worn_early_release_and_bounded_reuse',jobs:pack.index.actor_jobs.length,rigs:rigs.length,clips:rigs.reduce((n,r)=>n+r.states.length,0),canonical_pose_cases:poses,key_pose_cases:keyPixels,worn_cases:worn,bounded,hot_reused_compositions:hot.compositions-warm.compositions,hot_hits:hot.hits-warm.hits};
  pack.dispose();const cleared=after.cacheStats();if(cleared.bytes||cleared.frames||cleared.scratch_bytes)throw Error('PACK_DISPOSAL_LEAK');return{...result,disposed_bytes:cleared.bytes};
 }));
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);fs.writeFileSync(out+'/native.json',JSON.stringify({passed:true,checks,errors,writes},null,2));console.log(JSON.stringify({passed:true,checks}));
 }catch(e){fs.writeFileSync(out+'/native-failure.json',JSON.stringify({error:String(e),checks,errors,writes},null,2));throw e;}finally{await browser?.close();}})();
