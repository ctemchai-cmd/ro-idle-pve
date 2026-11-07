import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { content, actor, skill, unwrap } from './combat-fixtures.ts';
import { validateContent } from '../../src/content/loader.ts';
import { storyStages, storyBoss, storyBossBase } from '../../src/domain/modes/story.ts';
import { towerBoss } from '../../src/domain/modes/tower.ts';
import { dailyBossActor, dailyPolicy } from '../../src/domain/modes/daily.ts';
import { mvpBoss, mvpRules } from '../../src/domain/modes/mvp.ts';
import { eventBoss, eventPeriod, eventRules } from '../../src/domain/modes/events.ts';
import { storyInput } from '../../src/domain/build/story.ts';
import { applyBossProfile, bossProfile } from '../../src/domain/modes/boss-profile.ts';
import { createBattle, advanceUntil, serializeBattle, restoreBattle } from '../../src/domain/combat/index.ts';
import type { ValidatedContent } from '../../src/content/model.ts';

function legacy(): ValidatedContent { const c=structuredClone(content);delete(c.documents['enemies.json'] as Record<string,unknown>).boss_combat;return c; }
const old=legacy(),profile=bossProfile(content)!;
function compare(before:ReturnType<typeof storyBoss>,after:ReturnType<typeof storyBoss>){
 assert.equal(after.element,profile.defense_elements[after.definition_id]);
 assert.equal(after.attack_element,before.element,'armor correction does not silently retune outgoing elements');
 for(const key of Object.keys(before.resolved_base) as (keyof typeof before.resolved_base)[])
  assert.equal(after.resolved_base[key],['physical_attack','magical_attack'].includes(key)?Math.round(before.resolved_base[key]!*1.15):before.resolved_base[key],after.definition_id+'/'+key);
 assert.deepEqual(after.active_slots,before.active_slots);assert.deepEqual(after.passives,before.passives);
}
test('all420 Story bosses, generated Tower floors, daily phases, MVP tiers and Event tiers share one armor/attack profile',()=>{
 const ids=new Set<string>();for(const stage of storyStages(content)){const b=storyBoss(stage,content);compare(storyBoss(stage,old),b);ids.add(b.definition_id);assert.deepEqual(storyBossBase(stage),storyBoss(stage,old));}
 for(const floor of[1,2,3,4,5,20,40,41,100,101,1000])compare(towerBoss(floor,old),towerBoss(floor,content));
 for(const id of['essence','forge','treasury'] as const)for(const phase of[1,2,40,100])compare(dailyBossActor(id,phase,15,old),dailyBossActor(id,phase,15,content));
 for(const b of mvpRules(content).bosses)for(let tier=1;tier<=10;tier++)compare(mvpBoss(b.id,tier,old),mvpBoss(b.id,tier,content));
 const r=eventRules(content);for(let n=0;n<r.rotation.length;n++){const p=eventPeriod(r.anchor_ms+n*r.period_ms,content);if(p.kind==='boss')for(let tier=1;tier<=5;tier++)compare(eventBoss(p,tier,old),eventBoss(p,tier,content));}
 assert.equal(ids.size,72);assert.equal(Object.keys(profile.defense_elements).length,75);
});
test('known Origin corrections and documented unknowns; every profile has provenance or explicit retained status',()=>{
 assert.deepEqual(['poring','wolf','ork_warrior','golem','drake','phreeoni','dark_lord'].map(id=>profile.defense_elements[id]),['water','earth','earth','neutral','undead','neutral','undead']);
 const spec=JSON.parse(readFileSync('plan/generators/boss-origin-profiles.json','utf8'));
 for(const[id,row]of Object.entries(spec.profiles)as[string,{element:string;basis:string;source:string|null}][]){assert.equal(profile.defense_elements[id],row.element);assert(row.basis==='origin_reference'?row.source?.startsWith('https://'):row.basis==='retained_existing_unverified'&&row.source===null);}
 assert.equal(Object.values(spec.profiles).filter((r:any)=>r.basis==='retained_existing_unverified').length,5);
});
test('invalid/missing elements or attack multipliers reject content; frozen absence retains exact legacy builder',()=>{
 const raw=JSON.parse(readFileSync('src/generated/content.json','utf8'));
 for(const mutate of[(p:any)=>p.attack_multiplier=-1,(p:any)=>p.attack_multiplier=Infinity,(p:any)=>delete p.defense_elements.poring,(p:any)=>p.defense_elements.poring='fake']){const c=structuredClone(raw);mutate(c.documents['enemies.json'].boss_combat);assert.equal(validateContent(c).ok,false);}
 const b=storyBossBase(storyStages(content)[0]!);assert.equal(applyBossProfile(b,old),b);
 assert.throws(()=>applyBossProfile({...b,resolved_base:{...b.resolved_base,physical_attack:Number.MAX_SAFE_INTEGER}},content),/BOSS_ATTACK_OVERFLOW/);
});
test('actual engine uses corrected armor for damage and elemental-card tags, while outgoing element stays authored',()=>{
 const base=storyBoss(storyStages(content)[0]!,content),damage=(element:'neutral'|'wind'|'water')=>{
  const hit=skill('hit',0,0,0,1000);const effect=hit.effects[0]!;if(effect.type==='damage')effect.element=element;
  const player={...actor('a','player',[hit]),spatial:{x:220,y:400,move_speed:120,radius:18,normal_range:80}},input=storyInput({id:'origin',time_limit_ms:10000},{...base,resolved_base:{...base.resolved_base,max_hp:10000000},active_slots:[null,null,null,null]},[player],content);
  const enemy=input.actors[1]!;enemy.normal_attack_enabled=false;assert(enemy.tags!.includes('element:water'));assert(enemy.tags!.includes('element_water'));assert.equal(enemy.stat_blueprint.weapon_element,'neutral');
  return unwrap(advanceUntil(unwrap(createBattle(input,content,194)),4000,content)).events.find(e=>e.type==='damage'&&e.actor_id==='a')!.amount!;
 };
 assert.equal(damage('wind'),Math.floor(damage('neutral')*1.75));assert.equal(damage('water'),Math.floor(damage('neutral')*.25));
});
test('daily respawns keep corrected armor and original attack element; virtual1/2/3 and reload yield identical results',()=>{
 const boss=dailyBossActor('treasury',1,2,content),hit=skill('hit',0,0,0,6000),player={...actor('a','player',[hit],true),spatial:{x:220,y:400,move_speed:120,radius:18,normal_range:80}};player.stat_blueprint.derived_offsets.physical_attack=10000;
 const initial=unwrap(createBattle(storyInput({id:'treasury',time_limit_ms:12000},boss,[player],content,{kind:'daily',ref:'treasury@2',daily_phase:1,daily_current_hp:boss.resolved_base.max_hp,ticket_day:'2026-11-04'}),content,194));
 const run=(speed:number)=>{let state=structuredClone(initial);const events=[];for(let ms=0;ms<12000;){ms=Math.min(12000,ms+50*speed);const step=unwrap(advanceUntil(state,ms,content,dailyPolicy(content)));state=step.state;events.push(...step.events);if(ms===6000)state=unwrap(restoreBattle(serializeBattle(state),content));}return{state,events};};
 const result=run(1);assert(result.events.some(e=>e.type==='phase_advance'));assert.deepEqual(run(2),result);assert.deepEqual(run(3),result);
 const enemy=result.state.actors.find(a=>a.actor_id==='enemy_front')!;assert(enemy.tags.includes('element:fire'));assert.equal(enemy.stat_blueprint.weapon_element,'neutral');
 const phase=dailyBossActor('treasury',result.state.mode.daily_phase!,2,content);assert.equal(enemy.stats.physical_attack,phase.resolved_base.physical_attack);assert.equal(enemy.stats.max_hp,phase.resolved_base.max_hp);
});
