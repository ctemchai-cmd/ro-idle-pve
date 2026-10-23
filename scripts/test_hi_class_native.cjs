// Isolated Vite + actual shared Canvas actor rig; no Auth, API commands or saves.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.RO_PREVIEW_URL;assert(base&&new URL(base).hostname==='127.0.0.1');
(async()=>{let browser,failure;const errors=[],writes=[],checks=[];try{
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage({viewport:{width:900,height:1500}});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname)});await page.goto(base+'/demo');await page.locator('body').waitFor();
 const data=await page.evaluate(async()=>{
  const{AssetPack}=await import('/src/renderer/pack.ts'),{drawActor,actorFrame,actorDuration,attachmentFrame}=await import('/src/renderer/native.mjs');
  const pack=await AssetPack.open(),jobs=['lord_knight','paladin','high_priest','champion','sniper','clown','gypsy','high_wizard','professor','assassin_cross','stalker','whitesmith','creator'];const rows=[],images=[];let frames=0,mirrors=0;
  const test=document.createElement('canvas');test.width=test.height=320;const ctx=test.getContext('2d');ctx.imageSmoothingEnabled=false;
  const gallery=document.createElement('canvas');gallery.width=900;gallery.height=8*180;const g=gallery.getContext('2d');g.imageSmoothingEnabled=false;g.font='12px sans-serif';
  let count=0;
  for(const job of pack.index.actor_jobs.filter(j=>jobs.includes(j.job_id)))for(const preset of job.presets){
   if(count%8===0){g.fillStyle='#eaf1fa';g.fillRect(0,0,900,1440);}const parts={body:await pack.asset(preset.body.meta),head:await pack.asset(preset.head.meta),...(preset.weapon?{weapon:await pack.asset(preset.weapon.meta)}:{}),attackIndex:preset.attack_source_action_index,...(preset.attack_variant_indices?{attackVariants:preset.attack_variant_indices}:{})};
   for(const state of['idle','walk','attack']){
    const first=actorFrame(parts,state,0),clip=first.action;if(!clip||!clip.frames.length)throw Error('NO_ACTION_'+preset.preset_id+'_'+state);
    for(let i=0;i<clip.frames.length;i++){
     const ms=i*clip.frame_duration_ms,body=actorFrame(parts,state,ms);if(parts.head&&!attachmentFrame(parts.head,clip,body.frame,body.index,state))throw Error('HEAD_ATTACHMENT_'+preset.preset_id+'_'+state+'_'+i);
     if(state==='attack'&&parts.weapon&&!attachmentFrame(parts.weapon,clip,body.frame,body.index,state))throw Error('WEAPON_ATTACHMENT_'+preset.preset_id+'_'+i);
     const pixels=[];for(const facing of['right','left']){ctx.clearRect(0,0,320,320);if(!drawActor(ctx,parts,state,ms,160,240,facing,1.6))throw Error('EMPTY_RIG');pixels.push(ctx.getImageData(0,0,320,320).data);frames++;}
     let occupied=0,diffs=0;for(let y=0;y<320;y++)for(let x=0;x<320;x++){const a=(y*320+x)*4,b=(y*320+319-x)*4;if(pixels[0][a+3]||pixels[1][b+3])occupied++;if([0,1,2,3].some(c=>Math.abs(pixels[0][a+c]-pixels[1][b+c])>2))diffs++;}
     if(!occupied||diffs/occupied>.005)throw Error('RIG_MIRROR_'+preset.preset_id+'_'+state+'_'+i);mirrors++;
    }
   }
   const y=(count%8)*180+145,cases=[['idle',0,'right'],['walk',250,'right'],['attack',0,'right'],['attack',actorDuration(parts,'attack')*.5,'right'],['attack',actorDuration(parts,'attack')*.8,'left']];
   for(let col=0;col<cases.length;col++){const[state,ms,facing]=cases[col];drawActor(g,parts,state,ms,85+col*180,y,facing,1.3);g.fillStyle='#243c61';g.fillText(job.job_id+' '+preset.gender,col*180+8,y+17);g.fillText(state+' '+Math.round(ms)+' '+facing,col*180+8,y+32);}
   rows.push({job:job.job_id,gender:preset.gender,body:preset.body,head:preset.head,weapon:preset.weapon??null,attack_source_action_index:preset.attack_source_action_index});count++;if(count%8===0)images.push(gallery.toDataURL('image/png'));
  }
  if(count!==24)throw Error('HIGH_PRESET_COUNT');
  const icons=[];for(const job of jobs){const ref=pack.index.shell.class_icons[job],asset=await pack.asset(ref.asset_id);if(asset.meta.kind!=='job_emblem')throw Error('WRONG_JOB_ROLE');icons.push({job,id:asset.meta.id,width:asset.image.naturalWidth,height:asset.image.naturalHeight});}
  pack.dispose();return{rows,icons,frames,mirrors,images};
 });
 for(let i=0;i<data.images.length;i++)fs.writeFileSync(path.join(root,`plan/evidence/task-123-native-gallery-${i+1}.png`),Buffer.from(data.images[i].split(',')[1],'base64'));delete data.images;
 checks.push({case:'24_actual_native_High_body_head_weapon_rigs',...data});assert.equal(errors.length,0);assert.equal(writes.length,0);checks.push({case:'no_Auth_API_save_writes',passed:true});
 }catch(e){failure=e.stack||String(e)}finally{await browser?.close();const report={task_id:'TASK-123',passed:checks.length===2&&!failure,checks,errors,writes,failure,scope:'Every selected native idle/walk/attack frame, attachments and complete mirror automated; separate manual review is limited to the three galleries, not all animation frames or cosmetics.'};fs.writeFileSync(path.join(root,'plan/evidence/task-123-native.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failure,checks:checks.length}));if(!report.passed)process.exitCode=1;}
})();
