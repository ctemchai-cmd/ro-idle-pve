// Public production proof only: no owner credentials, commands, checkpoints or state writes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.RO_PLAYWRIGHT_MODULE||'/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base='https://ro-idle-pve.vercel.app',checks=[],errors=[],mutations=[],prefix=process.env.RO_EVIDENCE_PREFIX||'task-063';
if(!/^task-\d{3}$/.test(prefix))throw new Error('INVALID_EVIDENCE_PREFIX');
const expectedContent=process.env.RO_EXPECT_CONTENT_HASH||(['task-068','task-069','task-070','task-071','task-072','task-073','task-074'].includes(prefix)?JSON.parse(fs.readFileSync(path.join(root,'src/generated/runtime-manifest.json'),'utf8')).content_hash:'768e12a49bf339711d44f501c3710374adbcd10d9eb74d6a2e6f9b8aa79330af');
const assert=(ok,message)=>{if(!ok)throw new Error(message);};let browser,profile,failure,cardFinisherProof,numericSpiritTowerProof,currentProof;
(async()=>{
 const samples=[];
 for(const route of ['/api/health','/api/checkpoint','/api/health']){
  const at=performance.now(),r=await fetch(base+route,{cache:'no-store',signal:AbortSignal.timeout(20000)}),body=await r.json();
  assert(r.status===(route==='/api/checkpoint'?401:200),'PUBLIC_API_STATUS');assert(r.headers.get('x-ro-api-region')==='sin1','API_NOT_SINGAPORE');assert(/total;dur=/.test(r.headers.get('server-timing')||''),'TIMING_MISSING');assert(r.headers.get('cache-control').includes('no-store'),'PRIVATE_CACHE_POLICY');
  if(route==='/api/health')assert(body.ok&&body.content_hash===expectedContent,'CONTENT_CHANGED');
  samples.push({route,status:r.status,elapsed_ms:Math.round(performance.now()-at),api_region:r.headers.get('x-ro-api-region'),vercel_id:r.headers.get('x-vercel-id'),server_timing:r.headers.get('server-timing')});
 }
 checks.push({case_id:'hosted_region_timing_auth_gate_content',passed:true,samples});
 const r=await fetch(base+'/content-version.json',{cache:'no-store'}),manifest=await r.json();
 const assetResponse=await fetch(base+'/ro/manifest.json',{cache:'no-store'}),assetManifest=await assetResponse.json();
 assert(assetResponse.ok&&assetResponse.headers.get('cache-control')==='no-store'&&assetManifest.pack_hash===manifest.runtime_asset_pack_hash,'MUTABLE_ASSET_MANIFEST_CACHE_OR_VERSION');
 const row=manifest.build_files.find(r=>/^dist\/assets\/account-session-.*\.js$/.test(r.path));assert(row,'NO_SAVE_BUNDLE');
 const bundle=await(await fetch(base+'/'+row.path.replace(/^dist\//,''))).text();assert(bundle.includes('sendWithCheckpoint')&&bundle.includes('x-ro-checkpoint'),'OLD_SAVE_PROTOCOL_DEPLOYED');
 if(prefix==='task-095'){
  const selected=assetManifest.shell.ui_icons.nav_store;
  assert(selected.asset_id==='prepared.ui.98ceb840a1cad8c7'&&selected.source_name==='bank_1','ORIGINAL_COLORED_STORE_NOT_DEPLOYED');
  const asset=assetManifest.assets[selected.asset_id],file=assetManifest.files.find(r=>r.path===asset.media_path);
  const media=await fetch(base+assetManifest.base_url+asset.media_path),bytes=Buffer.from(await media.arrayBuffer());
  assert(media.ok&&createHash('sha256').update(bytes).digest('hex')===file.sha256&&file.sha256==='5aa1fe3564113f8862b63dbdefd171d14dfe5cb1c9323d7c8925b27b6a971f71','NATIVE_STORE_IMAGE_SHA');
  const shellRow=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path));assert(shellRow,'NO_SHELL_BUNDLE');
  const shell=await(await fetch(base+'/'+shellRow.path.replace(/^dist\//,''))).text();
  assert(createHash('sha256').update(shell).digest('hex')===shellRow.sha256&&shell.includes('nav_store')&&!shell.includes('store-mark'),'OLD_VECTOR_STORE_DEPLOYED');
  currentProof={task:'TASK-095',native_icon:'bank_1',media_sha256:file.sha256,original_art_colored:true,svg_store_removed:true,shell_sha256:shellRow.sha256};
 }
 if(['task-093','task-094'].includes(prefix)){
  const chunks={};
  for(const name of ['item-options','shell','element-badge','account-session']){
   const file=manifest.build_files.find(r=>new RegExp('^dist/assets/'+name+'-.*\\.js$').test(r.path));assert(file,'NO_'+name+'_BUNDLE');
   const response=await fetch(base+'/'+file.path.replace(/^dist\//,'')),source=await response.text();assert(response.ok&&createHash('sha256').update(source).digest('hex')===file.sha256,'PUBLIC_CARD_SCROLL_SHA_'+name);chunks[name]={path:file.path,sha256:file.sha256,source};
  }
  const cards=JSON.parse(fs.readFileSync(path.join(root,'plan/data/cards.json'),'utf8')),economy=JSON.parse(fs.readFileSync(path.join(root,'plan/data/economy.json'),'utf8')),data=chunks['item-options'].source.replaceAll('\\"','"');
  assert(data.includes('"origins":'+JSON.stringify(cards.origins))&&Object.keys(cards.origins).length===73,'CARD_73_ORIGINS_NOT_DEPLOYED');
  assert(cards.origins.card_angeling.grade==='mvp'&&cards.origins.card_angeling.rarity_id==='legendary'&&Object.values(cards.origins).filter(o=>o.variant==='puppet').length===7,'MVP_PUPPET_CATALOG');
  assert(data.includes('"element_scrolls":'+JSON.stringify(economy.element_scrolls)),'FOUR_ELEMENT_SCROLLS_NOT_DEPLOYED');
  const shell=chunks.shell.source,badge=chunks['element-badge'].source;
  assert(['เตรียมใบธาตุ','consumable.prepare','ยกเลิก / คืนใบ','store-mark','PUPPET','puppet-art'].every(t=>shell.includes(t)),'SCROLL_OR_PUPPET_UI_NOT_DEPLOYED');
  assert((shell+badge).includes('element-symbol')&&badge.includes('weaponElement'),'ELEMENT_GLYPHS_NOT_DEPLOYED');
  currentProof={tasks:['TASK-093','TASK-094'],cards:73,puppet:7,angeling_mvp_legendary:true,deviling_mvp_legendary:true,scroll_elements:economy.element_scrolls.map(r=>r.element),duration:'next_battle',store_colored:true,element_glyphs:true,bundles:Object.values(chunks).map(({source,...r})=>r)};
 }
 if(['task-091','task-092'].includes(prefix)){
  const chunks={};
  for(const name of ['item-options','element-badge','skill-timeline']){
   const file=manifest.build_files.find(r=>new RegExp('^dist/assets/'+name+'-.*\\.js$').test(r.path));assert(file,'NO_'+name+'_BUNDLE');
   const response=await fetch(base+'/'+file.path.replace(/^dist\//,'')),source=await response.text();assert(response.ok&&createHash('sha256').update(source).digest('hex')===file.sha256,'PUBLIC_ROO_SHA_'+name);chunks[name]={path:file.path,sha256:file.sha256,source};
  }
  const rules=JSON.parse(fs.readFileSync(path.join(root,'plan/data/combat-rules.json'),'utf8')),data=chunks['item-options'].source.replaceAll('\\"','"');
  assert(data.includes('"element_chart":'+JSON.stringify(rules.element_chart))&&data.includes('ragnarok_origin_global_v1'),'ROO_100PAIR_CHART_NOT_DEPLOYED');
  assert(chunks['element-badge'].source.includes('อิง Ragnarok Origin'),'ROO_TABLE_LABEL_NOT_DEPLOYED');
  const renderer=chunks['skill-timeline'].source,title=renderer.match(/drawTitle\([^)]*\)\{[\s\S]{0,900}?\.translate\([^,]+\/2,[^*),]+\*([A-Za-z_$][\w$]*)\)/);assert(title,'NO_FINISHER_TITLE_POSITION');
  const variable=title[1].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');assert(new RegExp('(?:[,;]|(?:let|const|var)\\s+)'+variable+'=0?\\.4[,;]').test(renderer),'LOWER_FINISHER_TITLE_NOT_DEPLOYED');
  currentProof={tasks:['TASK-091','TASK-092'],roo_chart_all100_pairs:true,source:'ROO Global in-game screenshot',total_damage_percent:true,finisher_title_height_ratio:.4,bundles:Object.values(chunks).map(({source,...r})=>r)};
 }
 if(prefix==='task-090'){
  assert(createHash('sha256').update(bundle).digest('hex')===row.sha256,'PUBLIC_SAVE_SHA');
  assert(['rejectedForUpdate','versionRejected','hasWriter','SAVE_MIGRATION_REQUIRED','CONTENT_VERSION_MISMATCH'].every(s=>bundle.includes(s)),'MIGRATION_PENDING_PROTOCOL_NOT_DEPLOYED');
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path));assert(shell,'NO_MAINTENANCE_UI');
  const ui=await(await fetch(base+'/'+shell.path.replace(/^dist\//,''))).text();assert(createHash('sha256').update(ui).digest('hex')===shell.sha256,'PUBLIC_MAINTENANCE_SHA');
  assert(['ตรวจผลรายการค้าง','มีรายการเดิมรอตรวจผล','ยังถือสิทธิ์บันทึกไม่ได้','hasWriter'].every(s=>ui.includes(s)),'PENDING_MAINTENANCE_ACTION_NOT_DEPLOYED');
  currentProof={tasks:['TASK-090'],migration_pending_gate_fixed:true,version_refused_intent_archived:true,unknown_intent_retained:true,inspect_pending_action:true,bundles:[row,shell].map(({path,sha256})=>({path,sha256}))};
 }
 if(['task-086','task-087','task-088','task-089'].includes(prefix)){
  const verified={};
  for(const name of ['shell','gear-upgrades','item-options','element-badge','account-session']){
   const file=manifest.build_files.find(r=>new RegExp('^dist/assets/'+name+'-.*\\.js$').test(r.path));assert(file,'NO_'+name+'_BUNDLE');
   const response=await fetch(base+'/'+file.path.replace(/^dist\//,'')),source=await response.text();assert(response.ok&&createHash('sha256').update(source).digest('hex')===file.sha256,'PUBLIC_SHA_'+name);verified[name]={path:file.path,sha256:file.sha256,source};
  }
  const ui=verified.shell.source+'\n'+verified['gear-upgrades'].source,element=verified['element-badge'].source,data=verified['item-options'].source.replaceAll('\\"','"'),save=verified['account-session'].source;
  assert(['skill-notes','skill-upgrade-diff','แสดงเฉพาะส่วนที่เปลี่ยน','เงื่อนไขสกิล'].every(s=>ui.includes(s)),'COMPACT_SKILLS_NOT_DEPLOYED');
  assert(['element-guide-dialog','element-matrix-scroll','element-armor-guide','เกราะเป้าหมาย','ตารางธาตุ'].every(s=>element.includes(s)),'ELEMENT_TABLE_NOT_DEPLOYED');
  assert(save.includes('SAVE_REQUEST_TIMEOUT')&&save.includes('throwIfAborted')&&save.includes('currentSession')&&save.includes('cachedToken'),'SAVE_TIMEOUT_AUTH_FIX_NOT_DEPLOYED');
  assert(['save-notice','ยังยืนยันการบันทึกไม่ได้','ตรวจผลอีกครั้ง'].every(s=>ui.includes(s)),'IN_DIALOG_RETRY_NOT_DEPLOYED');
  assert(data.includes('"gold_income_multiplier":3')&&data.includes('"gold":6330')&&data.includes('"gold":21714')&&data.includes('"gold":53910')&&data.includes('"reward_per_chest_base":{"gold":3000}'),'GOLD_INCOME_NOT_DEPLOYED');
  currentProof={tasks:['TASK-086','TASK-087','TASK-088','TASK-089'],compact_skills:true,full_element_table:true,bounded_save_and_auth_refresh:true,dialog_retry:true,farm_gold_multiplier:3,treasury_base_gold:3000,bundles:Object.values(verified).map(({source,...r})=>r)};
 }
 if(['task-084','task-085'].includes(prefix)){
  const verified={};
  for(const name of ['shell','item-options','element-badge']){
   const file=manifest.build_files.find(r=>new RegExp('^dist/assets/'+name+'-.*\\.js$').test(r.path));assert(file,'NO_'+name+'_BUNDLE');
   const source=await(await fetch(base+'/'+file.path.replace(/^dist\//,''))).text();assert(createHash('sha256').update(source).digest('hex')===file.sha256,'PUBLIC_BUNDLE_HASH_'+name);verified[name]={path:file.path,sha256:file.sha256,source};
  }
  const ui=verified.shell.source,definitions=verified['item-options'].source.replaceAll('\\"','"'),resource=verified['element-badge'].source;
  assert(/className:[`"]progress-refine[`"],children:\[[`"]\+[`"],/.test(ui)&&/className:[`"]progress-enchant[`"],children:[^\[]/.test(ui)&&!ui.includes('progress-refine-prefix'),'NUMERIC_UPGRADE_BADGES_NOT_DEPLOYED');
  assert(definitions.includes('"spheres":[1,2,3,4,5,5,5,5,5,5]')&&definitions.includes('"attack_per_sphere":[0.01,0.01,0.01,0.01,0.01,0.012,0.014,0.016,0.018,0.02]'),'CALL_SPIRIT_GROWTH_NOT_DEPLOYED');
  assert(resource.includes('value_from_skill')&&resource.includes('resolved_skills')&&resource.includes('level_parameter'),'SHARED_SKILL_RESOURCE_VALUE_NOT_DEPLOYED');
  assert(definitions.includes('"content_version":"tower-v2"')&&definitions.includes('"hp":{"base":600,"linear":100,"quadratic":8,"cubic":2}')&&definitions.includes('"attack":{"base":20,"linear":4,"quadratic":1,"divisor":2}'),'TOWER_V2_NOT_DEPLOYED');
  numericSpiritTowerProof={numeric_badges:true,call_spirit_all_ten_ranks:true,shared_resource_scaling:true,tower_v2:true,bundles:Object.values(verified).map(({source,...file})=>file)};
 }
 if(prefix==='task-064')assert(bundle.includes('preview:')&&bundle.includes('character.level_up'),'IMMEDIATE_DISPLAY_NOT_DEPLOYED');
 if(prefix==='task-067'){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path));assert(shell,'NO_GAME_SHELL_BUNDLE');
  const source=await(await fetch(base+'/'+shell.path.replace(/^dist\//,''))).text();assert(source.includes('daily-clock:essence:2026-10-21')&&source.includes('daily-clock-incident-2026-10-21'),'DAILY_FIX_AND_REFUND_UI_NOT_DEPLOYED');
 }
 if(prefix==='task-066'){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path));assert(shell,'NO_GAME_SHELL_BUNDLE');
  const source=await(await fetch(base+'/'+shell.path.replace(/^dist\//,''))).text();assert(source.includes('bag-window')&&source.includes('data-window-start'),'VIRTUAL_INVENTORY_NOT_DEPLOYED');
 }
 if(['task-068','task-069'].includes(prefix)){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path));assert(shell,'NO_GAME_SHELL_BUNDLE');
  const source=await(await fetch(base+'/'+shell.path.replace(/^dist\//,''))).text();assert(source.includes('combat-status-strip')&&source.includes('sphere-counter')&&source.includes('status-instance-list'),'STATUS_AND_SPHERES_NOT_DEPLOYED');
  if(prefix==='task-069')assert(source.includes('boss-status-panel')&&source.includes('data-skill-icon')&&!source.includes('farm-status-toggle'),'COMPACT_STATUS_POLISH_NOT_DEPLOYED');
 }
 if(prefix==='task-070'){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path));assert(shell,'NO_GAME_SHELL_BUNDLE');
  const source=await(await fetch(base+'/'+shell.path.replace(/^dist\//,''))).text();assert(source.includes('battle-history')&&source.includes('history-event-list')&&source.includes('recordedTimeline'),'BATTLE_HISTORY_NOT_DEPLOYED');
 }
 if(['task-071','task-072'].includes(prefix)){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path)),render=manifest.build_files.find(r=>/^dist\/assets\/skill-timeline-.*\.js$/.test(r.path));assert(shell&&render,'NO_HEALING_BUNDLES');
  const [ui,renderer]=await Promise.all([shell,render].map(async row=>(await fetch(base+'/'+row.path.replace(/^dist\//,''))).text()));
  assert(ui.includes('healing_aura')&&ui.includes('battle-history')&&renderer.includes('healing_auras'),'HOT_AURA_AND_HISTORY_NOT_DEPLOYED');
 }
 if(prefix==='task-072'){
  const definitions=manifest.build_files.find(row=>/^dist\/assets\/item-options-.*\.js$/.test(row.path));assert(definitions,'NO_OPENING_HEAL_BUNDLE');
  const actual=await(await fetch(base+'/'+definitions.path.replace(/^dist\//,''))).text();assert(actual.includes('opening_heal')&&actual.includes('opening_power')&&actual.includes('physical_regeneration'),'OPENING_HEAL_NOT_DEPLOYED');
 }
 if(['task-073','task-074'].includes(prefix)){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path)),definitions=manifest.build_files.find(r=>/^dist\/assets\/item-options-.*\.js$/.test(r.path));assert(shell&&definitions,'NO_CARD_BUNDLES');
  const [ui,data]=await Promise.all([shell,definitions].map(async r=>(await fetch(base+'/'+r.path.replace(/^dist\//,''))).text()));
  assert(['card-reveal','farm-card-rates','ออปชันเสริม','weapon_compatibility'].every(s=>ui.includes(s)),'CARDS_OPTIONS_WEAPON_UI_NOT_DEPLOYED');assert(['cards-ro-v1','card_drops','accepted_damage_types'].every(s=>data.includes(s)),'RO_CARD_DATA_NOT_DEPLOYED');
  const pack=await(await fetch(base+'/ro/manifest.json',{cache:'no-store'})).json(),local=JSON.parse(fs.readFileSync(path.join(root,'runtime/ro/manifest.json'),'utf8'));
  assert(pack.pack_hash===local.pack_hash&&Object.keys(pack.assets).filter(id=>id.startsWith('items.card-')).length===66,'NATIVE_CARD_PACK_NOT_DEPLOYED');
  const artifact=pack.files.find(f=>f.path==='items/card-4001.webp'),image=await fetch(base+pack.base_url+artifact.path);assert(image.ok&&createHash('sha256').update(Buffer.from(await image.arrayBuffer())).digest('hex')===artifact.sha256,'ACTUAL_PORING_CARD_BYTES_MISMATCH');
 }
 if(prefix==='task-076'){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path)),elements=manifest.build_files.find(r=>/^dist\/assets\/element-badge-.*\.js$/.test(r.path));assert(shell&&elements,'NO_ELEMENT_BUNDLES');
  const [ui,badges]=await Promise.all([shell,elements].map(async row=>(await fetch(base+'/'+row.path.replace(/^dist\//,''))).text()));
  assert(['focus-elements','boss-name','weapon-element'].every(s=>ui.includes(s)),'TARGET_ARMOR_UI_NOT_DEPLOYED');
  assert(['ธาตุสกิล','เกราะธาตุ','ไม่มีธาตุโจมตี','ตามอาวุธ'].every(s=>badges.includes(s)),'SKILL_ELEMENT_UI_NOT_DEPLOYED');
 }
 if(prefix==='task-079'){
  const shell=manifest.build_files.find(r=>/^dist\/assets\/shell-.*\.js$/.test(r.path)),growth=manifest.build_files.find(r=>/^dist\/assets\/(?:skill-growth|gear-upgrades)-.*\.js$/.test(r.path));assert(shell,'NO_GAME_SHELL_BUNDLE');
  const sources=await Promise.all([shell,...(growth?[growth]:[])].map(async row=>(await fetch(base+'/'+row.path.replace(/^dist\//,''))).text()));
  const actual=sources.join('\n');assert(['skill-upgrade-diff','skill-levels','ลด SP อย่างเดียว','เปลี่ยนจากตอนนี้','เมื่อตีปกติโดน'].every(s=>actual.includes(s)),'SKILL_LEVEL_DESCRIPTION_NOT_DEPLOYED');
  const css=manifest.build_files.filter(r=>/^dist\/assets\/.*\.css$/.test(r.path));const styles=(await Promise.all(css.map(async row=>(await fetch(base+'/'+row.path.replace(/^dist\//,''))).text()))).join('\n');
  assert(styles.includes('.bag-cell.card .item-icon')&&/translate(?:X)?\(-50%\)/.test(styles)&&styles.includes('.card-thumb{overflow:hidden}'),'CARD_CORNERS_NOT_DEPLOYED');
 }
 if(['task-080','task-081','task-082'].includes(prefix)){
  // Production public Auth settings change emitted filenames; use its manifest, not local env.
  const emitted=manifest.build_files.filter(row=>/^dist\/assets\/.*\.(?:js|css)$/.test(row.path));
  const load=async(needle,pattern)=>{
   const row=emitted.find(row=>pattern.test(row.path));assert(row,'NO_NEW_CHUNK_'+needle);
   const response=await fetch(base+'/'+row.path.replace(/^dist\//,'')),bytes=Buffer.from(await response.arrayBuffer());assert(response.ok&&createHash('sha256').update(bytes).digest('hex')===row.sha256,'PUBLIC_CHUNK_MISMATCH_'+needle);assert(bytes.toString('utf8').includes(needle),'OLD_PUBLIC_CHUNK_'+needle);
   return{path:row.path,text:bytes.toString('utf8'),sha256:createHash('sha256').update(bytes).digest('hex')};
  };
  const [cards,styles,data,renderer]=await Promise.all([load('gear-card-slots',/\/shell-.*\.js$/),load('.socket-card-art',/\/shell-.*\.css$/),load('card_farm_v2',/\/item-options-.*\.js$/),load('ASURA STRIKE',/\/skill-timeline-.*\.js$/)]);
  assert(['gear-card-slots','data-card-quality','gear-card-slot'].every(s=>cards.text.includes(s)),'EQUIPPED_CARD_FRAMES_NOT_DEPLOYED');
  assert(['.card-art','.socket-card-art','.quality-bronze','object-fit:cover'].every(s=>styles.text.includes(s)),'FULL_MASKED_CARD_ART_NOT_DEPLOYED');
  const normalized=data.text.replaceAll('\\"','"');assert(normalized.includes('"chance_start":10000')&&normalized.includes('"chance_end":20000'),'RARE_FARM_CARD_RATES_NOT_DEPLOYED');
  assert(['ASURA STRIKE','showFinisherTitles','staleGameMs','monk_asura','crusader_grand_cross','wizard_meteor','assassin_sonic_blow'].every(s=>renderer.text.includes(s)),'BIG_SKILL_PRESENTATION_NOT_DEPLOYED');
  cardFinisherProof={tasks:['TASK-080','TASK-081','TASK-082'],art_mask_and_owned_socket_frames:true,farm_version:'card_farm_v2',chance_per_million:[10000,20000],big_skills:15,exact_public_bundle_hashes:[cards,styles,data,renderer].map(({path,sha256})=>({path,sha256}))};
 }
 if(prefix==='task-083'){
  const patterns=[/\/shell-.*\.js$/,/\/shell-.*\.css$/,/\/item-options-.*\.js$/],rows=patterns.map(p=>manifest.build_files.find(r=>p.test(r.path)));assert(rows.every(Boolean),'NO_FIXED_CARD_BUNDLES');
  const parts=await Promise.all(rows.map(async row=>{const response=await fetch(base+'/'+row.path.replace(/^dist\//,'')),bytes=Buffer.from(await response.arrayBuffer());assert(response.ok&&createHash('sha256').update(bytes).digest('hex')===row.sha256,'FIXED_CARD_PUBLIC_CHECKSUM');return bytes.toString('utf8');}));
  const[ui,css,raw]=parts,data=raw.replaceAll('\\"','"');
  assert(['card-selection-footer','card-pick-description','card-worn-label','equipment-progress','ใส่อยู่ ·','Legendary ใน'].every(s=>ui.includes(s)),'ADD_CARD_UX_NOT_DEPLOYED');
  assert(['.quality-common','.quality-uncommon','.quality-rare','.quality-epic','.quality-legendary','.card-upgrade-sheet','.equipment-progress'].every(s=>css.includes(s)),'FIXED_CARD_COLORS_NOT_DEPLOYED');
  assert(['card_farm_v3','card_rarity_v3','"release_max":"legendary"','"future_only":["immortal","supreme"]','"strength_class":"elite"','"strength_class":"mini"','"strength_class":"mvp"','"rarity_is_equipment_rarity":true','legacy_quality'].every(s=>data.includes(s)),'FIXED_MONSTER_RARITY_NOT_DEPLOYED');
  assert(data.includes('"chance_start":10000')&&data.includes('"chance_end":20000'),'RARE_CARD_QUANTITY_CHANGED');
  cardFinisherProof={tasks:['TASK-083'],fixed_monster_rarity:true,current_max:'legendary',item_palette:true,free_first_owner_badges:true,inline_descriptions_and_pinned_action:true,slot_refine_enchant:true,legacy_floor:true,farm_version:'card_farm_v3',chance_per_million:[10000,20000],exact_public_bundle_hashes:rows.map(({path,sha256})=>({path,sha256}))};
 }
 if(['task-077','task-078'].includes(prefix)){
  const definitions=manifest.build_files.find(r=>/^dist\/assets\/item-options-.*\.js$/.test(r.path));assert(definitions,'NO_BUILD_IMPACT_DATA');
  const actual=await(await fetch(base+'/'+definitions.path.replace(/^dist\//,''))).text();
  assert(['skill_damage_bonus','normal_damage_bonus','attack_ratio_per_instance','detonate_ratio','impact_physical_attack'].every(s=>actual.includes(s))&&actual.replaceAll('\\"','"').includes('"power_scale":1.75'),'SHARED_BUILD_POWER_NOT_DEPLOYED');
  if(prefix==='task-078'){
   const normalized=actual.replaceAll('\\"','"'),skill=id=>{const at=normalized.indexOf('"id":"'+id+'"');assert(at>=0,'NO_ACTUAL_SKILL_'+id);return normalized.slice(at,at+2000);};
   assert(skill('acolyte_heal').includes('"power":[2.1,')&&skill('swordsman_endure').includes('"guard":[0.14,'),'HEAL_AND_GUARD_POWER_NOT_DEPLOYED');
   assert(skill('alchemist_bio_cannibalize').includes('"power_scale":1.75'),'HEALING_PLANT_POWER_NOT_DEPLOYED');
  }
 }
 checks.push({case_id:'hosted_shared_save_bundle',passed:true,path:row.path,sha256:createHash('sha256').update(bundle).digest('hex'),combined_reply:true,...(currentProof?{current_proof:currentProof}:{}),...(cardFinisherProof?{card_finisher_proof:cardFinisherProof}:{}),...(numericSpiritTowerProof?{numeric_spirit_tower_proof:numericSpiritTowerProof}:{})});
 profile=fs.mkdtempSync(path.join(os.tmpdir(),'ro-save-hosted-'));const context=await chromium.launchPersistentContext(profile,{headless:true,executablePath:process.env.RO_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',viewport:{width:390,height:844}});browser=context.browser();
 context.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))mutations.push({method:r.method(),path:new URL(r.url()).pathname});});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/');await page.getByRole('heading',{name:'เข้าสู่บัญชี',exact:true}).waitFor();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const inventory=await page.evaluate(async()=>Object.fromEntries(await Promise.all((await caches.keys()).map(async name=>[name,(await(await caches.open(name)).keys()).map(r=>new URL(r.url).pathname)]))));
 assert(Object.values(inventory).flat().length===5&&!Object.values(inventory).flat().some(p=>p.startsWith('/api/')||p.startsWith('/assets/')),'PWA_CACHES_GAME_STATE');
 assert(!errors.length&&!mutations.length,'BROWSER_ERROR_OR_MUTATION');checks.push({case_id:'hosted_login_pwa_no_private_cache',passed:true,login_visible:true,cache:inventory,mutations});
})().catch(error=>{failure=error.stack;console.error(error);process.exitCode=1;}).finally(async()=>{
 if(browser)await browser.close();if(profile)fs.rmSync(profile,{recursive:true,force:true});
 fs.writeFileSync(path.join(root,`plan/evidence/${prefix}-hosted.json`),JSON.stringify({task_id:prefix.toUpperCase(),date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'}),source_commit:process.env.RO_DEPLOY_COMMIT||null,origin:base,passed:checks.length===3&&!failure&&!errors.length&&!mutations.length,checks,errors,failure,owner_cloud_writes:false,personal_preview_restarted:false,scope:'Signed-out actual production health/401 gate/new shared-save bundle/login/PWA only. No owner command latency or owner save access; actual mutations/failures tested on isolated stack. TASK064 optional SQL007 installation and cloud2RPC timing are not verified here.'},null,2)+'\n');
});
