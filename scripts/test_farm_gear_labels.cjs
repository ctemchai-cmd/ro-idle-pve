// Actual Field UI and actual farm pools. Synthetic account only; no Auth/SQL/owner requests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),task=process.env.RO_GEAR_EVIDENCE_TASK||'147',out=path.join(root,'plan/evidence/task-'+task),base=process.env.RO_PREVIEW_URL;assert(['147','148'].includes(task));
assert(base&&new URL(base).hostname==='127.0.0.1');
(async()=>{let browser,page,failure;const checks=[],errors=[],writes=[];try{
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(new URL(r.url()).pathname)});
 await page.goto(base+'/demo');await page.getByRole('button',{name:'หยุดชั่วคราว',exact:true}).click();
 const parity=await page.evaluate(async()=>{
  const [{default:React},dom,{Field},{initializeAccount},{content},{storyStage,storyStages,storyFarmSnapshot},{storyGearLevel,storyGearRanges}]=await Promise.all([import('/node_modules/.vite/deps/react.js'),import('/node_modules/.vite/deps/react-dom_client.js'),import('/src/ui/game/field.tsx'),import('/src/domain/progression/initialize.ts'),import('/tests/game/combat-fixtures.ts'),import('/src/domain/modes/story.ts'),import('/src/client/story.ts')]);await import('/src/ui/game/game.css');
  const at=new Date().toISOString(),initial=initializeAccount(content,{root_job_id:'mage',gender:'female'},at,at.slice(0,10),17),stages=storyStages(content),mismatches=[];
  for(const stage of stages){const snapshot=storyFarmSnapshot(stage,initial,content),level=storyGearLevel(stage.id);if(level!==snapshot.gear_tier||!snapshot.definition_pool.every(id=>content.items[id].tier_level===level))mismatches.push(stage.id);}
  const host=document.createElement('main');host.id='farm-gear-native';host.className='game-root';host.style.cssText='position:fixed;inset:0;z-index:9999';document.body.append(host);const h=React.createElement;
  window.farmGearTest={host,stages,content,mount:(stageId,legacy=false)=>{
   window.farmGearTest.root?.unmount();const state=structuredClone(initial),calls=[];
   state.story.cleared_stage_ids=stages.map(s=>s.id);state.story.selected_farm_stage=stageId;
   state.farm.rate_snapshot=stageId?storyFarmSnapshot(storyStage(stageId,content),state,content):null;
   if(legacy)state.farm.rate_snapshot.gear_tier=20;
   state.farm.reserved_through=new Date(Date.now()-3600000).toISOString();
   if(!stageId)state.story.cleared_stage_ids=[];
   const save={status:'ready',pending:null,lastReceipt:null,checkpoint:null},context={state,pack:null,locked:false,busy:false,characterId:'main',latest:()=>state,submit:async(type,params)=>{calls.push({type,params});if(type==='farm.set_stage'){state.story.selected_farm_stage=params.stage_id;state.farm.rate_snapshot=storyFarmSnapshot(storyStage(params.stage_id,content),state,content);render();}return true;},submitWhenReady:async()=>{throw Error('UNEXPECTED_DURABLE_ACTION')},go:()=>{},toast:()=>{},lastCreated:()=>[],lastCode:()=>null,selectCharacter:()=>{},challenge:()=>{throw Error('UNEXPECTED_CHALLENGE')}};
   window.farmGearTest.state=state;window.farmGearTest.calls=calls;window.farmGearTest.root=(dom.createRoot??dom.default.createRoot)(host);
   function render(){window.farmGearTest.root.render(h('div',{className:'game-frame'},h(Field,{context:{...context},covered:false,save,request:null,consumeRequest:()=>{}})));}render();
  }};
  return{stages:stages.length,mismatches,ranges:storyGearRanges(),unknown:storyGearLevel('missing-stage')};
 });
 assert.equal(parity.stages,330);assert.deepEqual(parity.mismatches,[]);assert.equal(parity.unknown,null);assert.equal(parity.ranges.length,12);if(task==='148')assert.deepEqual(parity.ranges.slice(-2).map(r=>r.level),[80,100]);checks.push({case:'330_actual_snapshot_and_36_definition_pool_levels',...parity});
 const rows=[];for(const[width,height]of[[320,640],[390,844]]){
  await page.setViewportSize({width,height});
  for(const[stageId,level,legacy]of[['1-1',1,false],['2-1',1,false],['3-1',20,false],['4-1',40,false],['6-1',60,false],['11-1',parity.ranges.find(r=>r.chapter===11).level,false],['12-50',parity.ranges.find(r=>r.chapter===12).level,false],['2-1',20,true]]){
   await page.evaluate(([id,legacy])=>window.farmGearTest.mount(id,legacy),[stageId,legacy]);const host=page.locator('#farm-gear-native');
   await host.locator('.stage-chip').waitFor();assert((await host.locator('.stage-chip').innerText()).includes('อุปกรณ์ Lv.'+level));
   await host.getByRole('button',{name:'รางวัลฟาร์มอัตโนมัติ',exact:true}).click();await host.getByRole('heading',{name:'รางวัล AFK',exact:true}).waitFor();assert.equal(await host.locator('.farm-gear-label').getAttribute('data-farm-gear-level'),String(level));await host.getByRole('button',{name:'ปิด',exact:true}).click();
   await host.getByRole('button',{name:'เปิดแผนที่และเลือกด่าน',exact:true}).click();const guide=host.locator('.farm-gear-guide');assert.equal(await guide.getAttribute('open'),null);await guide.locator('summary').click();assert.equal(await guide.locator('tbody tr').count(),12);
   const mapping=await guide.locator('tbody tr').allTextContents();for(const range of parity.ranges)assert(mapping.some(row=>row.includes(range.first)&&row.includes(range.last)&&row.includes('Lv.'+range.level)));
   const geometry=await guide.evaluate(el=>({width:el.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth,viewport:innerWidth,summaryHeight:el.querySelector('summary').getBoundingClientRect().height}));assert(geometry.scroll<=geometry.client&&geometry.width<=width&&geometry.summaryHeight>=40,JSON.stringify(geometry));
   if(stageId==='3-1'&&!legacy){await page.screenshot({path:path.join(out,'all-chapters-'+width+'.png')});await guide.locator('summary').click();await host.getByRole('tab',{name:'บท 3',exact:true}).click();await host.locator('.stage-cell').filter({has:page.locator('b',{hasText:/^3-1$/})}).click();assert((await host.locator('.stage-actions .farm-gear-label').innerText()).includes('Lv.20'));await page.screenshot({path:path.join(out,'selected-stage-'+width+'.png')});}
   rows.push({width,height,stageId,level,legacy,...geometry});await host.getByRole('button',{name:'ปิด',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.farmGearTest.calls),[]);
  }
  await page.evaluate(()=>window.farmGearTest.mount('2-1'));const host=page.locator('#farm-gear-native');await host.getByRole('button',{name:'เปิดแผนที่และเลือกด่าน',exact:true}).click();await host.getByRole('tab',{name:'บท 3',exact:true}).click();await host.locator('.stage-cell').filter({has:page.locator('b',{hasText:/^3-1$/})}).click();await host.getByRole('button',{name:'ฟาร์มที่ด่านนี้',exact:true}).click();await host.locator('.stage-chip .stage-gear-level').filter({hasText:'Lv.20'}).waitFor();assert.deepEqual(await page.evaluate(()=>window.farmGearTest.calls),[{type:'farm.set_stage',params:{stage_id:'3-1'}}]);
  await page.evaluate(()=>window.farmGearTest.mount(null));await host.locator('.stage-chip').waitFor();assert.equal(await host.locator('.stage-gear-level').count(),0);await host.getByRole('button',{name:'รางวัลฟาร์มอัตโนมัติ',exact:true}).click();assert.equal(await host.locator('.farm-gear-label').count(),0);assert((await host.locator('.hint').innerText()).includes('1-1'));await host.getByRole('button',{name:'ปิด',exact:true}).click();
 }
 assert(!errors.length&&!writes.length,JSON.stringify({errors,writes}));checks.push({case:'native_Field_mobile_frozen_profile_no_farm_table_navigation',rows,no_extra_HTTP_writes:true});await page.evaluate(()=>window.farmGearTest.root.unmount());
 }catch(e){failure=String(e.stack||e);await page?.screenshot({path:path.join(out,'failed.png')}).catch(()=>{});}finally{await browser?.close();const report={passed:!failure&&checks.length===2,checks,errors,writes,failure,scope:'Actual Field and shared farm pools with isolated synthetic state; no owner Auth/API/SQL writes'};fs.writeFileSync(path.join(out,task==='148'?'farm-native.json':'native.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:checks.length,failure}));if(!report.passed)process.exitCode=1;}
})();
