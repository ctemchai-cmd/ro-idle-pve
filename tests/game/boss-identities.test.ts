import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { content, actor, skill, unwrap } from './combat-fixtures.ts';
import { validateContent } from '../../src/content/loader.ts';
import { storyStages, storyBoss, storyBossBase } from '../../src/domain/modes/story.ts';
import { storyInput } from '../../src/domain/build/story.ts';
import { bossProfile } from '../../src/domain/modes/boss-profile.ts';
import { createBattle, advanceUntil, serializeBattle, restoreBattle } from '../../src/domain/combat/index.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { SavedBattleSession, storyStageInfo, storyBossLabel } from '../../src/client/story.ts';
const old=unwrap(validateContent(JSON.parse(gunzipSync(readFileSync('plan/evidence/task-195/before-content.json.gz')).toString())));
const spec=JSON.parse(readFileSync('plan/generators/boss-identities.json','utf8'));
const pack=JSON.parse(readFileSync('runtime/ro/manifest.json','utf8'));
const stat=(id:string)=>storyStages(content).find(s=>s.id===id)!;
test('D217 researched75 identities;74 pre-Renewal matches, Kraken Renewal-only; literal former skin identities corrected',()=>{
 assert.equal(Object.keys(spec.profiles).length,75);assert.equal(Object.values(spec.profiles).filter((r:any)=>r.renewal_agrees_pre_renewal===true).length,74);
 assert.equal(spec.profiles.kraken.renewal_agrees_pre_renewal,null);
 for(const[id,monster,element]of[['1-1','mastering','water'],['1-2','vocal','earth'],['1-3','eclipse','neutral'],['2-1','elder_wilow','fire'],['2-4','choco','fire'],['4-1','ghostring','ghost'],['4-2','deviling','dark'],['4-3','angeling','holy'],['5-20','drake','undead'],['8-20','baphomet','dark']]){
  const boss=storyBoss(stat(id!),content);assert.equal(boss.definition_id,monster);assert.equal(boss.element,element);
 }
 assert.equal(spec.profiles.choco.monster_id,1214);assert.equal(bossProfile(content)!.defense_elements.maya,'earth');assert.equal(bossProfile(content)!.defense_elements.orc_lord,'earth');
});
test('D217 all420 stages keep encounter power/skills/rewards;122 old skins now one shared identity for armor/race/size',()=>{
 let changed=0;const count:Record<string,number>={};
 for(const stage of storyStages(content)){
  const previous=storyBoss(stage,old),boss=storyBoss(stage,content),mapped=spec.story_identities[stage.id],input=storyInput(stage,boss,[],content),enemy=input.actors[0]!;
  assert.deepEqual({...boss,definition_id:previous.definition_id,element:previous.element},previous,stage.id+' only identity/armor change');
  assert.deepEqual(stage,storyStages(old).find(s=>s.id===stage.id));
  if(mapped){changed++;assert.equal(boss.definition_id,mapped);assert.equal(storyStageInfo(stage.id)!.enemy_identity,'definition');const row=spec.profiles[mapped];assert(enemy.tags!.includes('race_'+row.race));assert(enemy.tags!.includes('size_'+row.size));assert.equal(storyBossLabel(stage.id)!.size,row.size);}
  assert(enemy.tags!.includes('element:'+boss.element));assert(enemy.tags!.includes('element_'+boss.element));
  assert.equal(enemy.stat_blueprint.weapon_element,previous.attack_element);count[boss.element]=(count[boss.element]??0)+1;
 }
 assert.equal(changed,122);assert(count.earth!<100,'Earth template inflation removed, without arbitrary element balancing');
});
test('D217 actual checkpoint/UI cannot cosmetically replace canonical boss; renderer and1/2/3 replay agree',()=>{
 const stage=stat('4-1'),boss=storyBoss(stage,content),player={...actor('main','player',[skill('probe',0,1000,0,1000)]),spatial:{x:220,y:400,move_speed:120,radius:18,normal_range:80}},input=storyInput({...stage,time_limit_ms:6000},boss,[player],content);
 const initial=unwrap(createBattle(input,content,195)),account=initializeAccount(content,{root_job_id:'swordsman',gender:'male'},'2026-11-05T00:00:00Z','2026-11-05',1);
 let callbacks=0;const session=new SavedBattleSession(serializeBattle(initial),account,()=>{callbacks++;return{label:'WRONG Orc',meta_path:'wrong'};});
 assert.equal(callbacks,0);assert(session.scene.actors.find(a=>a.actor_id==='enemy_front')!.body_meta?.includes('ghostring'));assert(session.view().actors.find(a=>a.actor_id==='enemy_front')!.name?.includes('Ghostring'));
 const run=(speed:number)=>{let state=structuredClone(initial);const events=[];for(let ms=0;ms<6000;){ms=Math.min(6000,ms+50*speed);const step=unwrap(advanceUntil(state,ms,content));state=step.state;events.push(...step.events);if(ms===3000)state=unwrap(restoreBattle(serializeBattle(state),content));}return{state,events};};
 const result=run(1);assert.deepEqual(run(2),result);assert.deepEqual(run(3),result);session.advanceTo(6000);assert.deepEqual(serializeBattle(session.state),serializeBattle(result.state));
 const hit=result.events.find(e=>e.type==='damage'&&e.actor_id==='main');assert(hit&&hit.amount!>0);
});
test('D217 invalid stage/monster/missing identity fails content; frozen no-profile still keeps template IDs',()=>{
 const raw=JSON.parse(readFileSync('src/generated/content.json','utf8'));
 for(const mutate of[(m:any)=>delete m['4-1'],(m:any)=>m['4-1']='unknown',(m:any)=>m['wrong']='ghostring']){const x=structuredClone(raw);mutate(x.documents['enemies.json'].boss_combat.story_identities);assert.equal(validateContent(x).ok,false);}
 const legacy=structuredClone(old);delete (legacy.documents['enemies.json'] as Record<string,unknown>).boss_combat;assert.deepEqual(storyBoss(stat('4-1'),legacy),storyBossBase(stat('4-1')));assert.equal(storyBoss(stat('4-1'),legacy).definition_id,'ork_warrior');
});
test('D217 ten matching Origin element images retain original source bytes; all old combat effects/media unchanged',()=>{
 const sources=JSON.parse(readFileSync('plan/evidence/task-195/icon-sources.json','utf8'));
 assert.equal(new Set(sources.filter((r:any)=>r.element!=='weapon').map((r:any)=>r.source_url)).size,10);
 for(const r of sources){const ref=pack.shell.element_icons[r.element],asset=pack.assets[ref.asset_id],bytes=readFileSync('assets/ro/'+asset.media_path);assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);assert.equal(createHash('sha256').update(readFileSync(r.local_path)).digest('hex'),r.sha256);const meta=JSON.parse(readFileSync('assets/ro/'+asset.meta_path,'utf8'));assert.equal(meta.file.width,80);assert.equal(meta.file.height,r.height);}
 const before=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-195/before-pack.json.gz')).toString());for(const k of['combat_visuals','recipes','presentations'])assert.deepEqual(pack[k],before[k]);assert.equal(pack.sizes.initial_profile_raw_bytes,before.sizes.initial_profile_raw_bytes);assert(pack.sizes.media_and_sidecar_bytes+pack.sizes.manifest_bytes<33554432);
});
