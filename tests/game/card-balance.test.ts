import {withoutWorkshopDocument,withoutWorkshopPack} from './legacy-workshop-scope.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {AccountState,Effect,ItemDefinition} from '../../src/contracts/index.ts';
import {beforeD183,withoutD183Document} from './legacy-card-balance-scope.ts';
import {actor,battle,checkpoint,content,skill,step,unwrap} from './combat-fixtures.ts';
import {resolvedCardModifiers,resolvedCardTriggers,resolvedItemCombatBonuses} from '../../src/domain/build/equipment.ts';
import {cardRarity} from '../../src/domain/build/card-rarity.ts';
import {EffectPipeline} from '../../src/domain/combat/effects.ts';
import {resolveStats,hpRegen} from '../../src/domain/math/index.ts';
import {restoreBattle,serializeBattle} from '../../src/domain/combat/index.ts';
import {initializeAccount} from '../../src/domain/progression/initialize.ts';
import {migrateAccountState} from '../../src/domain/account/migrate.ts';
import {cardView} from '../../src/client/slots.ts';
import {modifierText} from '../../src/ui/game/buddy.tsx';
type Card=Extract<AccountState['inventory'][number],{kind:'card'}>;
const card=(id:string,level=1):Card=>({kind:'card',instance_id:id,definition_id:id,rarity_id:cardRarity(id,content),level,locked:false});
function input(ids:string[]=[],level=1){const a=actor('a','player');a.stat_blueprint.derived_offsets.max_hp=10000;a.stat_blueprint.derived_offsets.physical_attack=1000;a.stat_blueprint.derived_offsets.magical_attack=1000;a.stat_blueprint.derived_offsets.physical_defense=200;a.stat_blueprint.derived_offsets.magical_defense=200;
 a.stat_blueprint.permanent_sources=ids.map((id,i)=>{const c=card(id,level),d=content.items[id] as unknown as ItemDefinition;return{source:{instance_id:id+i,definition_id:id,owner_actor_id:'a',origin_actor_id:'a',origin_life_epoch:0},modifiers:resolvedCardModifiers(c,content),triggers:resolvedCardTriggers(c,content),combat_bonuses:resolvedItemCombatBonuses(c,content),...(d.defense_element?{defense_element:d.defense_element}:{})};});return a;}
const stats=(ids:string[]=[],level=1)=>resolveStats(input(ids,level).stat_blueprint,content);
test('D183 changes only card power fields and authoring growth policy; all80 identities/art/slots/rarities/costs and all non-card gameplay stay exact',()=>{
 const before=beforeD183['plan/data/cards.json'];assert.deepEqual(withoutD183Document('cards.json',content.documents['cards.json']),before);
 for(const p of['gacha','loot','equipment','slot-progress','economy','progression','strings.th'])assert.deepEqual(withoutWorkshopDocument(p+'.json',JSON.parse(readFileSync('plan/data/'+p+'.json','utf8'))),beforeD183['plan/data/'+p+'.json'],p);
 assert.deepEqual(withoutWorkshopPack(JSON.parse(readFileSync('runtime/ro/manifest.json','utf8'))),beforeD183['runtime/ro/manifest.json']);
 const policy=JSON.parse(readFileSync('plan/generators/build-impact-spec.json','utf8'));assert.equal(policy.card_growth_multiplier,.3);delete policy.card_growth_multiplier;assert.deepEqual(policy,beforeD183['plan/generators/build-impact-spec.json']);
});
test('D183 single Lv1 generic attack budgets are meaningful without the prior35–45% outliers; flat bonuses still grow at Lv5',()=>{
 const mods=(id:string)=>resolvedCardModifiers(card(id),content),pct=(id:string,stat:string)=>mods(id).filter(m=>m.stat===stat&&m.op==='add_percent').reduce((n,m)=>n+Number(m.value),0);
 assert.equal(pct('card_andre','physical_attack'),.105);assert.equal(pct('card_pupa','max_hp'),.042);assert(Math.abs(pct('card_time_holder','magical_attack')-.216)<1e-10);assert(Math.abs(pct('card_fallen_bishop','magical_attack')-.252)<1e-10);
 const imp=stats(['card_imp']);assert(imp.outgoing_magical_bonus>.15&&imp.outgoing_magical_bonus<.2);assert.equal(imp.magical_attack,stats().magical_attack);
 for(const id of Object.keys((content.documents['cards.json'] as any).origins))for(let lv=1;lv<=5;lv++)assert(resolvedCardModifiers(card(id,lv),content).every(m=>Number.isFinite(m.value)));
 assert(stats(['card_andre'],5).physical_attack>stats(['card_andre']).physical_attack);
});
test('D183 Pupa and Peco Peco offer close midgame survival with different flat HP/guard versus HP%/healing roles',()=>{
 const base=stats(),p=stats(['card_pupa']),q=stats(['card_pecopeco']);assert(p.guard_percent>0&&q.healing_received_bonus>0);assert.equal(q.guard_percent,0);
 const pe=p.max_hp/(1-p.guard_percent),qe=q.max_hp/(1-q.guard_percent);assert(pe/base.max_hp>1.06);assert(qe/base.max_hp>1.08);assert(Math.max(pe,qe)/Math.min(pe,qe)<1.08);
});
test('D183 AGI/evasion/status/element/conditional utility has an unconditional useful lane; specialty remains intact',()=>{
 const base=stats();for(const id of['card_kukre','card_accessory_3','card_chonchon','card_dragon_fly']){const s=stats([id]);assert(s.attack_speed>base.attack_speed);assert((s.normal_damage_bonus??0)>0,id);}
 assert(stats(['card_marduk']).magical_attack>base.magical_attack);assert(stats(['card_marduk']).silence_resistance>=1);
 assert(stats(['card_marc']).max_hp>base.max_hp);assert(stats(['card_marc']).freeze_resistance>=1);
 assert(stats(['card_hode']).physical_defense>base.physical_defense);assert(stats(['card_isis']).magical_attack>base.magical_attack);
 assert((stats(['card_hydra']).skill_damage_bonus??0)>0);assert((stats(['card_abysmal_knight']).normal_damage_bonus??0)>0);assert(stats(['card_kaho']).physical_attack>base.physical_attack);
});
test('D183 weak MVPs have actual ordinary-fight utility without adding resurrection; GTB triple-Lv5 remains below full magic immunity',()=>{
 const b=stats(),o=stats(['card_osiris']),m=stats(['card_moonlight_flower']),g=stats(['card_garm']),e=stats(['card_eddga']);assert(o.max_hp>b.max_hp&&o.healing_received_bonus>0&&o.sp_regen_percent>0);assert.equal((content.items.card_osiris as unknown as ItemDefinition).triggers.length,0);
 assert(m.attack_speed>b.attack_speed&&m.evasion_bonus>0&&m.move_speed_percent>0);assert(g.max_hp>b.max_hp&&g.guard_percent>0);assert(hpRegen(e)>hpRegen(b));
 assert(stats(['card_golden_thief_bug']).max_hp>b.max_hp);const three=stats(['card_golden_thief_bug','card_golden_thief_bug','card_golden_thief_bug'],5);assert(three.magical_guard_percent>.7&&three.magical_guard_percent<.85);
});
test('D183 Abysmal keeps one real conditional root proc, smaller bonus and unmatched normal baseline',()=>{
 for(const matched of[false,true]){const a=input(['card_abysmal_knight']),target=actor('b','enemy');target.tags=matched?['boss']:[];const s=checkpoint(battle([a,target])),events:{type:string;skill_id?:string;amount?:number}[]=[];
 const p=new EffectPipeline(s,content,{emit:e=>events.push(e),metric:()=>{},interrupt:()=>{},revive:()=>{}}),ctx=p.context(s.actors[0]!,'swordsman_bash','skill','root');ctx.selected={foe:[s.actors[1]!]};const effect:Effect={id:'hit',type:'damage',target:'foe',formula:{id:'flat_power',params:{amount:1000}},damage_type:'physical',element:'neutral',hit_rule:'always',can_crit:false,hits:3,armor_rule:'ignore'};p.program([effect],ctx);p.drain();const extra=events.filter(e=>e.type==='damage'&&e.skill_id==='card_abysmal_knight');assert.equal(extra.length,matched?1:0);if(matched)assert(extra[0]!.amount!>=180&&extra[0]!.amount!<=190);}
});
test('D183 changed tempo/cards checkpoint and1x/2x/4x run identical state/events with the same seeded engine',()=>{
 const a=input(['card_moonlight_flower','card_kukre','card_abysmal_knight','card_weapon_3'],5),s=skill('card_speed_hit',250,300,0,100);a.normal_attack_enabled=true;a.active_slots=[s.id,null,null,null];a.resolved_skills={[s.id]:{level:1,definition:s}};const start=battle([a,actor('b','enemy')],123),wire=serializeBattle(start);assert.deepEqual(serializeBattle(unwrap(restoreBattle(wire,content))),wire);
 const run=(chunk:number)=>{let state=unwrap(restoreBattle(wire,content));const events=[];for(let t=chunk;t<=12000;t+=chunk){const r=step(state,t);state=r.state;events.push(...r.events);}return{state,events};};assert.deepEqual(run(50),run(100));assert.deepEqual(run(50),run(200));
});
test('D183 migration preserves all80 owned instances/levels/locks/slot investments and actual descriptions contain no raw stat keys',()=>{
 const s=initializeAccount(content,{root_job_id:'mage',gender:'female'},'2026-10-26T00:00:00.000Z','2026-10-26',17);for(const id of Object.keys((content.documents['cards.json'] as any).origins))s.inventory.push({...card(id,5),locked:true});s.roster[0]!.slot_progress.weapon.refine=15;s.roster[0]!.slot_progress.weapon.cards[0]='card_time_holder';const before=structuredClone(s),next=migrateAccountState(s,content).state;assert.deepEqual(next,before);assert.deepEqual(s,before);
 for(const item of s.inventory.filter((i):i is Card=>i.kind==='card')){const view=cardView(item,s);assert([...view.modifiers.map(modifierText),...view.effects].every(text=>!/undefined|NaN|[a-z]+_[a-z]+/.test(text)),item.definition_id);}
});
