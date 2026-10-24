import test from'node:test';import assert from'node:assert/strict';
import{definitionSize,actorSize,sizeName}from'../../src/client/monster-size.ts';import{MonsterSizeBadge}from'../../src/ui/monster-size-badge.tsx';import{renderToStaticMarkup}from'react-dom/server';import{createElement}from'react';
import{content,actor,skill,unwrap}from'./combat-fixtures.ts';import{storyStages,storyBoss}from'../../src/domain/modes/story.ts';import{storyInput}from'../../src/domain/build/story.ts';import{towerBoss,towerStageRef}from'../../src/domain/modes/tower.ts';import{dailyBossActor}from'../../src/domain/modes/daily.ts';import{storyBossLabel,towerView,dailyView}from'../../src/client/story.ts';import{initializeAccount}from'../../src/domain/progression/initialize.ts';
import{resolvedCardTriggers}from'../../src/domain/build/equipment.ts';import{cardRarity}from'../../src/domain/build/card-rarity.ts';import{createBattle,advanceUntil}from'../../src/domain/combat/index.ts';
import type{AccountState}from'../../src/contracts/index.ts';
test('D166 size labels match all authored Story bosses and actual mode-factory size tags, never sprite scale',()=>{
 const observed=new Set();for(const stage of storyStages(content)){const boss=storyBoss(stage),input=storyInput(stage,boss,[],content),enemy=input.actors[0]!,size=definitionSize(boss.definition_id);assert.ok(size,boss.definition_id);assert.equal(actorSize(enemy),size);assert.equal(storyBossLabel(stage.id)!.size,size);observed.add(size);}
 assert.deepEqual([...observed].sort(),['large','medium','small']);assert.equal(definitionSize('poring'),'medium');assert.equal(definitionSize('whisper'),'small');assert.equal(definitionSize('baphomet'),'large');
});
test('D166 Tower and all three daily bosses before-fight data matches actual enemy tags across floors and phases',()=>{
 const state=initializeAccount(content,{root_job_id:'swordsman',gender:'male'},'2026-10-24T00:00:00Z','2026-10-24',1);
 for(const f of[1,2,3,4,5,100,101,1000]){const boss=towerBoss(f,content),input=storyInput(towerStageRef(f,content),boss,[],content,{kind:'tower'});assert.equal(towerView(state,f,1).floors[0]!.size,actorSize(input.actors[0]!));}
 for(const row of dailyView(state,Date.parse('2026-10-24T00:00:00Z')).bosses)for(const phase of[1,3,20]){const boss=dailyBossActor(row.id,phase,8,content),input=storyInput({id:row.id,time_limit_ms:90000},boss,[],content,{kind:'daily'});assert.equal(row.size,actorSize(input.actors[0]!));assert.ok(row.size);}
});
test('D166 unknown/contradictory tags remain explicit unknown; duplicated valid tags are fine; accessible compact markup names sizes',()=>{
 assert.equal(definitionSize('missing'),null);for(const tags of[[],['boss'],['size_huge'],['size_large','size_small'],['size_large','size_invalid']])assert.equal(actorSize({tags}),null);
 assert.equal(actorSize({tags:['size_medium','size_medium']}),'medium');for(const size of['small','medium','large',null]as const){const html=renderToStaticMarkup(createElement(MonsterSizeBadge,{size}));assert.ok(html.includes('ขนาด'+sizeName(size)));assert.ok(html.includes(`data-size="${size??'unknown'}"`));}
});
test('D166 actual Minorous card bonus only triggers against the displayed large size; medium/small labels do not activate it',()=>{
 const totals=[];for(const size of['small','medium','large']as const){
  const d=skill('size_probe',0,60000,0,100);d.effects[0]!.type==='damage'&&(d.effects[0]!.hit_rule='always');const a=actor('caster','player',[d]);
  const item={kind:'card',instance_id:'minorous',definition_id:'card_minorous',rarity_id:cardRarity('card_minorous',content),level:1,locked:false}as Extract<AccountState['inventory'][number],{kind:'card'}>;
  a.stat_blueprint.permanent_sources.push({source:{instance_id:'minorous',owner_actor_id:'caster',origin_actor_id:'caster',origin_life_epoch:0,definition_id:'card_minorous'},modifiers:[],triggers:resolvedCardTriggers(item,content)});
  const enemy=actor('boss','enemy');enemy.tags=['boss','size_'+size];assert.equal(actorSize(enemy),size);
  const state=unwrap(createBattle({actors:[a,enemy],mode:{kind:'story',ref:'size',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,17)),r=unwrap(advanceUntil(state,2500,content)),card=r.events.filter(e=>e.type==='damage'&&e.effect_id==='bonus_hit');
  assert.equal(card.length,size==='large'?1:0,size);totals.push(r.state.metrics.actors.caster!.hp_damage);
 }
 assert.equal(totals[0],totals[1]);assert.ok(totals[2]!>totals[1]!);
});
