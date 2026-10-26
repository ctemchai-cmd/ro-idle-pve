import{assertD179File}from'./legacy-magic-card-scope.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import visuals from '../../src/renderer/combat-visuals.json';
import {performanceAuraConfig,performanceAuras,performanceAuraArea} from '../../src/renderer/performance-aura.ts';
import {battleRenderView} from '../../src/client/story.ts';
import {resolveSkill} from '../../src/domain/build/resolve-skill.ts';
import {actor,battle,step,skill,content,type Active} from './combat-fixtures.ts';
import type {ActorRenderView} from '../../src/contracts/presentation.ts';
const config=performanceAuraConfig(visuals,Object.keys(content.skills))!;
test('song footprint covers spread diagonal teammates with body margin, follows their points, excludes enemies/dead/summons',()=>{
 const {view}=actual('bard_healing_song'),source=view.actors.find(a=>a.actor_id==='singer')!;
 const positions=[[100,300],[400,300],[100,650],[400,650]];
 const actors=positions.map((_,i)=>({...structuredClone(source),actor_id:i?'friend'+i:'singer'}));
 actors.push({...structuredClone(source),actor_id:'dead',hp:0},{...structuredClone(source),actor_id:'summon',summon_of:'singer'},{...structuredClone(source),actor_id:'enemy',team:'enemy'});
 const point=(a:ActorRenderView)=>positions[actors.indexOf(a)] as [number,number]??[2000,2000];
 const area=performanceAuraArea(actors,'singer',config.ring_size,point)!;
 assert(area.width>=420&&area.height>=260);
 for(const[x,y]of positions)assert(Math.hypot((Math.abs(x!-area.x)+40)/(area.width/2),(Math.abs(y!-area.y)+28)/(area.height/2))<=1.0000001);
 const moved=performanceAuraArea(actors,'singer',config.ring_size,a=>{const[x,y]=point(a);return[x+55,y+80];})!;
 assert.equal(moved.x,area.x+55);assert.equal(moved.y,area.y+80);assert.equal(moved.width,area.width);
 assert.equal(performanceAuraArea(actors,'dead',config.ring_size,point),undefined);
});
function actual(id:string,awakened=false){
 const definition=resolveSkill(id,10,content,awakened).definition as Active;
 for(let seed=1;seed<=20;seed++){
  const input=actor('singer','player',[definition]);input.stat_blueprint.derived_offsets.max_sp=10000;
  const initial=battle([input,actor('friend','player'),actor('target','enemy')],seed),first=step(initial,7000).events.find(e=>e.type==='status_applied'&&e.skill_id===id);
  if(first){const state=step(initial,first.at_ms+50).state;return{initial,state,view:battleRenderView(state,{})};}
 }
 throw Error('No status application '+id);
}
test('eight actual base/Awaken song programs produce one aura at the living performer, with real status lifetime and no view mutation',()=>{
 assert.equal(Object.keys(config.skills).length,8);
 for(const id of Object.keys(config.skills))for(const aw of[false,true]){
  const {initial,view}=actual(id,aw),before=JSON.stringify(view),auras=performanceAuras(view.actors,view.game_time_ms,config);
  assert.equal(auras.length,1,id);assert.equal(auras[0]!.source,'singer');assert.equal(auras[0]!.style,config.skills[id]);assert.deepEqual(auras[0]!.skills,[id]);
  const instances=view.actors.flatMap(a=>a.statuses?.filter(g=>g.icon_skill_id===id).flatMap(g=>g.instances)??[]);assert.equal(auras[0]!.expires_at,Math.max(...instances.map(s=>s.expires_at)));assert.equal(JSON.stringify(view),before);
  assert.deepEqual(performanceAuras(battleRenderView(initial,{}).actors,0,config),[]);
  assert.deepEqual(performanceAuras(view.actors,auras[0]!.expires_at,config),[],id+' exact expiry');
 }
});
test('recipient copies, independent same-caster stacks and simultaneous songs merge only visually; a second performer remains separate',()=>{
 const {view}=actual('bard_healing_song'),actors=structuredClone([...view.actors]),source=actors.find(a=>a.actor_id==='singer')!,friend=actors.find(a=>a.actor_id==='friend')!;
 const original=friend.statuses![0]!,instance=original.instances[0]!;
 friend.statuses=[...friend.statuses!,{...original,id:'another-song',icon_skill_id:'bard_battle_song',instances:[{...instance,instance_id:'new_stack',expires_at:instance.expires_at+1000}]}];
 const second={...structuredClone(source),actor_id:'dancer',statuses:[]} as ActorRenderView;actors.push(second);
 friend.statuses=[...friend.statuses!,{...original,id:'other-singer',icon_skill_id:'dancer_healing_song',instances:[{...instance,source_actor_id:'dancer'}]}];
 const auras=performanceAuras(actors,view.game_time_ms,config);assert.equal(auras.length,2);assert.deepEqual(auras.find(a=>a.source==='singer')!.skills,['bard_battle_song','bard_healing_song']);assert.equal(auras.find(a=>a.source==='singer')!.expires_at,instance.expires_at+1000);
 second.hp=0;assert.equal(performanceAuras(actors,view.game_time_ms,config).length,1);source.hp=0;assert.deepEqual(performanceAuras(actors,view.game_time_ms,config),[]);
});
test('future status applications, removed statuses and instant performance strikes cannot invent a persistent aura',()=>{
 const {view}=actual('dancer_healing_song'),future=view.actors.map(a=>({...a,statuses:a.statuses?.map(g=>({...g,instances:g.instances.map(s=>({...s,applied_at:view.game_time_ms+1000}))}))}));
 assert.deepEqual(performanceAuras(future,view.game_time_ms,config),[]);
 assert.deepEqual(performanceAuras(view.actors.map(a=>({...a,statuses:[]})),view.game_time_ms,config),[]);
 assert.equal(config.skills.bard_performance_strike,undefined);assert.equal(config.skills.dancer_performance_strike,undefined);
 assert.deepEqual(performanceAuras(view.actors.map(a=>({...a,statuses:a.statuses?.map(g=>({...g,icon_skill_id:'toString'}))})),view.game_time_ms,config),[]);
});
test('actual interrupted Healing Song emits no status and no aura',()=>{
 const song=resolveSkill('bard_healing_song',10,content).definition as Active,stop=skill('aura_interrupt',50,10000,0);stop.effects=[{id:'stop',type:'interrupt',target:'foe'}];
 const singer=actor('singer','player',[song]);singer.stat_blueprint.derived_offsets.max_sp=10000;
 const result=step(battle([singer,actor('boss','enemy',[stop])]),5000);assert(result.events.some(e=>e.type==='cast_interrupt'&&e.actor_id==='singer'));assert(!result.events.some(e=>e.type==='status_applied'&&e.skill_id===song.id));assert.deepEqual(performanceAuras(battleRenderView(result.state,{}).actors,5000,config),[]);
});
test('bad native aura references, dimensions, timing, style and unknown skills reject before drawing',()=>{
 for(const edit of[(p:any)=>{p.ring_meta='bad.png'},(p:any)=>{p.ring_size=[NaN,1]},(p:any)=>{p.period_ms=0},(p:any)=>{p.alpha=2},(p:any)=>{p.skills.bard_healing_song='missing'},(p:any)=>{p.skills.missing='bard'}]){const copy=structuredClone(visuals);edit(copy.performance_auras);assert.throws(()=>performanceAuraConfig(copy,Object.keys(content.skills)),/INVALID_PERFORMANCE_AURA/);}
 assert.equal(performanceAuraConfig({}),null);
});
test('gameplay source documents/schemas remain byte-identical, native pixels match their source checksums, initial profile remains1.62MB and pack fits32MiB',()=>{
 const before=JSON.parse(readFileSync('plan/evidence/task-149/gameplay-before.json','utf8'));
 for(const[file,sha]of Object.entries(before))assertD179File(file,sha);
 for(const ref of[config.ring_meta,config.note_meta]){const meta=JSON.parse(readFileSync('assets/ro/'+ref,'utf8')),bytes=readFileSync('assets/ro/library/'+meta.file.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.file.sha256);}
 const pack=JSON.parse(readFileSync('runtime/ro/manifest.json','utf8'));assert(pack.sizes.initial_profile_raw_bytes<=1621492,'D175 lossless runtime metadata encoding may reduce the initial profile');assert(pack.sizes.media_and_sidecar_bytes+pack.sizes.manifest_bytes<33554432);
});
