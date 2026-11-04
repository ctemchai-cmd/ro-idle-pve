const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const base=process.env.RO_PREVIEW_URL,out='plan/evidence/plant-render-20261104';assert(base&&new URL(base).hostname==='127.0.0.1');
(async()=>{let browser,page,failure;const checks=[],errors=[],writes=[];try{
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(r.url());});await page.goto(base+'/animation-preview');await page.getByRole('button',{name:'หยุดภาพ',exact:true}).click();
 for(const width of[320,390]){
  await page.setViewportSize({width,height:844});
  for(const skill of['alchemist_hell_plant','alchemist_bio_cannibalize']){
   const result=await page.evaluate(async({skill})=>{
    const[{AssetPack},{SkillPreviewSession},{BattleRenderer}]=await Promise.all([import('/src/renderer/pack.ts'),import('/src/client/skill-preview.ts'),import('/src/renderer/battle.ts')]);
    document.querySelector('#plant-canvas')?.remove();const canvas=document.createElement('canvas');canvas.id='plant-canvas';canvas.width=720;canvas.height=820;canvas.style.cssText='position:fixed;inset:0;width:100vw;height:auto;z-index:99999';document.body.append(canvas);
    const pack=await AssetPack.open(),session=new SkillPreviewSession({job:'alchemist',skill,rank:10,gender:'male'});await pack.prepare(session.scene,session.preparedSkills);const renderer=new BattleRenderer(canvas,pack,session.scene);renderer.selected='caster';renderer.showFinishers=false;
    const kind=skill==='alchemist_hell_plant'?'hell_plant':'healing_plant',native=pack.summons.get(kind);
    if(native.asset!==await pack.asset(native.config.meta))throw Error("Artwork must use unmodified native pixels");
    let firstHit=null,snapshot;for(let ms=25;ms<=7000;ms+=25){const events=session.advanceTo(ms);renderer.accept(events);renderer.draw(session.view(),ms);firstHit??=events.find(e=>e.type==='damage'&&e.origin==='periodic');if(firstHit&&ms>=firstHit.at_ms+140){snapshot=structuredClone(renderer.frameStats);break;}}
    if(!firstHit)throw Error('No real plant hit');const now=session.state.game_time_ms,view=session.view();renderer.selected='ally_1';renderer.draw(view,now);const wrongFocus=renderer.frameStats.damage.length;
    renderer.selected='caster';renderer.draw(view,now);const position=view.actors.find(a=>a.actor_id===firstHit.actor_id);const point=renderer.point(position);
    renderer.motion=false;renderer.draw(view,now);const staticFrame=JSON.stringify(renderer.frameStats.summons);renderer.draw(view,now+10);const staticSame=staticFrame===JSON.stringify(renderer.frameStats.summons);renderer.motion=true;renderer.draw(view,now);
    // Last hit stays visible even when a same-batch despawn removes its source from the next view.
    renderer.accept([{type:'despawn',actor_id:firstHit.actor_id,at_ms:now,phase:1,sequence:9999}]);renderer.draw({...view,actors:view.actors.filter(a=>a.actor_id!==firstHit.actor_id)},now);const afterDespawn=renderer.frameStats.damage.some(e=>e.source===firstHit.actor_id),noPlant=renderer.frameStats.summons.length===0;
    renderer.draw(view,now);const images=pack.summons.size;pack.dispose();
    return{kind,meta:native.config.meta,nativeLayers:snapshot.summons,number:snapshot.damage.find(e=>e.sequence===firstHit.sequence),actual:firstHit.amount,wrongFocus,afterDespawn,noPlant,staticSame,spatialMatches:point[0]===position.spatial.x&&point[1]===position.spatial.y,onlyOneKindLoaded:images===1};
   },{skill});
   assert(result.nativeLayers.length>0&&result.nativeLayers.every(s=>s.layers>0));assert.equal(result.number.amount,result.actual);assert.equal(result.wrongFocus,0);assert(result.afterDespawn&&result.noPlant&&result.staticSame&&result.spatialMatches&&result.onlyOneKindLoaded);
   await page.locator('#plant-canvas').screenshot({path:out+`/${result.kind}-${width}.png`});checks.push({width,skill,...result});
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 }catch(e){failure=String(e.stack||e);await page?.screenshot({path:out+'/native-failed.png'}).catch(()=>{});}finally{await browser?.close();const report={passed:!failure,checks,errors,writes,failure};fs.writeFileSync(out+'/native.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(failure)process.exitCode=1;}
})();
