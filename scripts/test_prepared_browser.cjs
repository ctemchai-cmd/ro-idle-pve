// Run against the local asset lab. Install playwright-core outside the asset tree.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {chromium} = require(process.env.RO_PLAYWRIGHT_MODULE || 'playwright-core');
const root = path.resolve(__dirname, '..');
const base = process.env.RO_PREVIEW_URL || 'http://127.0.0.1:8765';
const origin = new URL(base).origin;
const output = path.join(root, 'assets/ro/prepared/browser-validation.json');
const screenshots = path.join(root, 'docs/screenshots');
const sha = filename => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, filename))).digest('hex');

(async () => {
  const browser = await chromium.launch({headless:true,
    executablePath:process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args:['--autoplay-policy=no-user-gesture-required']});
  try {
    const page = await browser.newPage({viewport:{width:1500,height:1100},deviceScaleFactor:1});
    const errors = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {if(response.status() >= 400)errors.push(`${response.status()} ${response.url()}`)});
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith(origin+'/') || url.startsWith('data:')) route.continue();
      else {external.push(url); route.abort()}
    });
    await page.goto(base+'/preview/asset-lab/');
    await page.waitForFunction(() => window.assetLab?.ready, {timeout:60000});
    fs.mkdirSync(screenshots, {recursive:true});
    await page.evaluate(async () => {
      const lab=window.assetLab;
      await lab.apply({hat:lab.data.classic_hats.find(h=>h.gender==='male'&&h.view_ids.includes(2)).id});
      lab.pause(true);lab.draw(400);
    });
    await page.screenshot({path:path.join(screenshots,'asset-lab.png'),fullPage:true});
    const result = await page.evaluate(async () => {
      const lab=window.assetLab, matrix=[];
      for(const actor of lab.data.actors){
        const hat=lab.data.classic_hats.find(h=>h.gender===actor.gender&&h.view_ids.includes(2));
        const compatible=category=>lab.data.wardrobe.find(g=>g.category===category&&g.gender===actor.gender&&g.class_sprite===actor.class_sprite);
        const garment=compatible('garments'),shield=compatible('shields');
        const applied=await lab.apply({actor:actor.id,hat:hat?.id??'',garment:garment?.id??'',shield:shield?.id??''});
        for(const facing of ['right','left'])for(const pose of ['idle','attack','hurt','dead']){
          lab.config.pose=pose;lab.config.facing=facing;lab.draw(350);
          if(lab.stats.layers<2)throw Error(`No character layers: ${actor.id}`);
        }
        matrix.push({...applied,hat:hat?.id??null,garment:garment?.id??null,shield:shield?.id??null,pose_samples:8});
      }
      // Exercise every selected recipe at several timeline points, including native STR.
      for(const recipe of lab.data.skill_recipes){
        await lab.apply({skill:recipe.skill_id});lab.setCastStart(0);
        for(const t of [100,350,750])lab.draw(t);
      }
      lab.setCastStart(-Infinity);
      for(const scene of lab.data.backgrounds){await lab.apply({background:scene.map});lab.draw(400)}
      const context=new AudioContext(),checked=new Set();
      const refs=[...lab.data.music,...Object.values(lab.data.audio_events),...lab.data.skill_recipes.flatMap(r=>r.sounds.map(meta=>({meta})))];
      for(const ref of refs){
        const asset=await lab.asset(ref);if(checked.has(asset.url))continue;
        checked.add(asset.url);
        const response=await fetch(asset.url);if(!response.ok)throw Error(`Audio HTTP ${response.status}`);
        await context.decodeAudioData(await response.arrayBuffer());
      }
      await context.close();
      return {actor_matrix:matrix,pose_samples:matrix.length*8,recipes_rendered:lab.data.skill_recipes.length,
        backgrounds_rendered:lab.data.backgrounds.length,audio_files_decoded:checked.size,
        font_loaded:document.fonts.check('16px ROThai'),runtime_errors:[...lab.stats.errors]};
    });
    await page.evaluate(async()=>{
      const lab=window.assetLab;
      await lab.apply({actor:'1-male',pose:'attack',facing:'right',hat:lab.data.classic_hats.find(h=>h.gender==='male'&&h.view_ids.includes(2)).id,
        garment:'',shield:'',background:'prt_fild08',skill:89});lab.setCastStart(0);lab.draw(750);
    });
    await page.screenshot({path:path.join(screenshots,'asset-lab-effect.png'),fullPage:true});
    const garmentSamples=await page.evaluate(async()=>{
      const lab=window.assetLab,actor=lab.data.actors.find(a=>a.id==='1-female');
      const garments=lab.data.wardrobe.filter(g=>g.category==='garments'&&g.gender===actor.gender&&g.class_sprite===actor.class_sprite);
      const shield=lab.data.wardrobe.find(g=>g.category==='shields'&&g.gender===actor.gender&&g.class_sprite===actor.class_sprite);
      const pictures=[];
      for(const garment of garments){
        await lab.apply({actor:actor.id,pose:'idle',facing:pictures.length%2?'left':'right',hat:'',garment:garment.id,shield:shield?.id??''});
        lab.setCastStart(-Infinity);lab.draw(400);
        pictures.push({garment:garment.id,item_ids:garment.item_ids,src:lab.canvas.toDataURL()});
      }
      const gallery=document.createElement('div');gallery.style.cssText='display:grid;grid-template-columns:repeat(2,640px);gap:8px;background:#eee;padding:8px;width:1296px';
      gallery.id='garment-gallery';
      for(const picture of pictures){const cell=document.createElement('div'),label=document.createElement('div'),image=new Image();
        label.textContent='Garment item '+picture.item_ids.join(', ');image.src=picture.src;image.style.width='640px';cell.append(label,image);gallery.append(cell)}
      document.body.replaceChildren(gallery);await Promise.all([...gallery.querySelectorAll('img')].map(i=>i.decode()));
      return pictures.map(({src,...record})=>record);
    });
    await page.locator('#garment-gallery').screenshot({path:path.join(screenshots,'asset-lab-garments.png')});
    const hashes=Object.fromEntries(['assets/ro/prepared/catalog.json','assets/ro/prepared/game-pack.json',
      'preview/asset-lab/renderer.mjs','preview/asset-lab/app.mjs'].map(file=>[file,sha(file)]));
    const failed=errors.length||external.length||result.runtime_errors.length||!result.font_loaded;
    const report={schema_version:1,generated_at:new Date().toISOString(),browser:browser.version(),
      ...result,garment_samples:garmentSamples,errors,external_requests:external,input_sha256:hashes,
      status:failed?'failed':'passed',scope:'Automated loading/playback smoke test. Screenshots reviewed separately; does not certify every wardrobe sprite or full RO blend fidelity.'};
    fs.writeFileSync(output,JSON.stringify(report));
    console.log(JSON.stringify({status:report.status,pose_samples:report.pose_samples,audio_files_decoded:report.audio_files_decoded,
      recipes_rendered:report.recipes_rendered,garment_samples:garmentSamples.length,errors,external_requests:external}));
    if(failed)process.exitCode=1;
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
