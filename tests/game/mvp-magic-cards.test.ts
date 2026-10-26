import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import type {AccountState,Effect} from '../../src/contracts/index.ts';
import {beforeD180,withoutD180Document,mvpMagicIds} from './legacy-mvp-magic-scope.ts';
import {content,actor,battle,checkpoint,skill,step,unwrap} from './combat-fixtures.ts';
import {equipStarterSet} from './gear-fixtures.ts';
import {initializeAccount} from '../../src/domain/progression/initialize.ts';
import {equippedSources,resolvedCardModifiers,cardPowerMultiplier} from '../../src/domain/build/equipment.ts';
import {equipmentStats} from '../../src/client/equipment.ts';
import {cardView} from '../../src/client/slots.ts';
import {EffectPipeline} from '../../src/domain/combat/effects.ts';
import {fixedSpCost} from '../../src/domain/math/combat-modifiers.ts';
import {restoreBattle,serializeBattle} from '../../src/domain/combat/index.ts';
import {storyStage,storyStages,storyFarmSnapshot} from '../../src/domain/modes/story.ts';
import {migrateAccountState} from '../../src/domain/account/migrate.ts';
import {AccountCommandRules,type CommandTime} from '../../src/domain/account/commands.ts';
import {reserveFarm} from '../../src/domain/rewards/farm.ts';
import {pullCards} from '../../src/domain/rewards/gacha.ts';

type Card=Extract<AccountState['inventory'][number],{kind:'card'}>;
const at='2026-10-26T00:00:00.000Z',start=Date.parse(at);
const card=(id:string,level=1,instance=id):Card=>({kind:'card',instance_id:instance,definition_id:id,rarity_id:'legendary',level,locked:false});
function equipped(ids:string[]=[],level=1){const state=equipStarterSet(initializeAccount(content,{root_job_id:'mage',gender:'female'},at,'2026-10-26',17)),main=state.roster[0]!;for(const p of Object.values(main.slot_progress))p.refine=15;
 for(const id of ids){const c=card(id,level,`${id}_${state.inventory.length}`),slot=content.items[id]!.slot as keyof typeof main.equipment;state.inventory.push(c);const p=main.slot_progress[slot];p.refine=15;p.cards[p.cards.findIndex(c=>!c)]=c.instance_id;}return{state,main,sources:equippedSources(main,state,content)};}
function input(ids:string[]=[],level=1){const a=actor('a','player');a.stat_blueprint.permanent_sources=equipped(ids,level).sources;a.stat_blueprint.derived_offsets.magical_attack=500;a.stat_blueprint.derived_offsets.max_sp=10000;return a;}
test('D180 adds exactly2 Legendary MVP identities/real slots and preserves every78prior definition/trait/name and all rate/pity/cost rules',()=>{
 for(const key of Object.keys(beforeD180))assert.deepEqual(withoutD180Document(key,JSON.parse(readFileSync('plan/data/'+key,'utf8'))),beforeD180[key],key);
 const data=content.documents['cards.json'] as any;assert.equal(data.definitions.length,80);assert.equal(new Set(data.presentations.map((r:any)=>r.symbol_asset_id)).size,73);
 for(const[id,item,mob,slot]of[['card_fallen_bishop',4441,1871,'shoes'],['card_time_holder',4625,3074,'weapon']] as const){const d=content.items[id]!,o=data.origins[id];assert.equal(d.slot,slot);assert.equal(o.ro_item_id,item);assert.equal(o.monster_id,mob);assert.equal(o.grade,'mvp');assert.equal(o.rarity_id,'legendary');assert.equal(d.tier_level,60);assert.deepEqual(d.triggers,[]);assert.equal(d.combat_bonuses,undefined);}
});
test('D180 resolved Lv1–5 uses the existing single rarity/level scale; MATK25.2/21.6% with smaller SP tradeoffs at Lv1',()=>{
 for(const id of mvpMagicIds)for(let lv=1;lv<=5;lv++){const c=card(id,lv),scale=cardPowerMultiplier(c,content),mods=resolvedCardModifiers(c,content),atk=mods.find(m=>m.stat==='magical_attack')!;assert.equal(Number(atk.value),(id==='card_fallen_bishop'?.14:.12)*scale);const penalty=mods.find(m=>m.stat!=='magical_attack')!;assert.equal(Number(penalty.value),(id==='card_fallen_bishop'?-.15:.1)/scale);}
 assert(Math.abs(Number(resolvedCardModifiers(card('card_fallen_bishop'),content)[0]!.value)-.252)<1e-12);assert(Math.abs(Number(resolvedCardModifiers(card('card_time_holder'),content)[0]!.value)-.216)<1e-12);
 const baseline=equipmentStats(equipped().state,'main').stats;
 for(const id of mvpMagicIds){const s=equipmentStats(equipped([id]).state,'main').stats;assert(s.magical_attack>baseline.magical_attack);assert.equal(s.physical_attack,baseline.physical_attack);assert.equal(s.cast_speed,baseline.cast_speed);assert.equal(s.attack_speed,baseline.attack_speed);if(id==='card_fallen_bishop')assert(s.max_sp<baseline.max_sp);else assert(s.sp_cost_percent>baseline.sp_cost_percent);}
});
function power(ids:string[],lane:'magical'|'physical'|'heal'){
 const a=input(ids),s=checkpoint(battle([a,actor('target','enemy')]));s.actors[1]!.hp-=100000;const target=s.actors[1]!,before=target.hp,events:unknown[]=[];
 const p=new EffectPipeline(s,content,{emit:e=>events.push(e),metric:()=>{},interrupt:()=>{},revive:()=>{}}),c=p.context(s.actors[0]!,'mage_fire_bolt','skill','root');c.selected={foe:[target]};
 const formula:Extract<Effect,{type:'heal'}>['formula']={id:lane==='physical'?'physical_power':lane==='heal'?'healing_power':'magical_power' as const,params:{attack_ratio:1,flat_power:0}};
 const effect:Effect=lane==='heal'?{id:'heal',type:'heal',target:'foe',formula}:{id:'hit',type:'damage',target:'foe',formula,damage_type:lane,element:'neutral',hit_rule:'always',can_crit:false,hits:1,armor_rule:'normal'};
 p.program([effect],c);p.drain();return{amount:Math.abs(target.hp-before),events,rng:s.rng};
}
test('D180 actual equipped pipeline raises magical damage and MATK healing, keeps physical damage/hits/RNG identical, and stacks three copies additively',()=>{
 for(const id of mvpMagicIds)for(const lane of['magical','heal','physical'] as const){const a=power([],lane),b=power([id],lane);if(lane==='physical')assert.equal(b.amount,a.amount);else assert(b.amount>a.amount);assert.equal(b.events.length,a.events.length);assert.deepEqual(b.rng,a.rng);}
 for(const id of mvpMagicIds){const a=power([id],'magical'),b=power([id,id,id],'magical');assert(b.amount>a.amount);assert.deepEqual(b.rng,a.rng);}
});
test('D180 SP is actually paid at cast start and checkpoint1×/2×/4× has identical events/RNG/state',()=>{
 for(const id of mvpMagicIds){const a=input([id]),d=skill('mvp_test',300,30000,100,10);a.active_slots=[d.id,null,null,null];a.resolved_skills={[d.id]:{level:1,definition:d}};const state=battle([a,actor('target','enemy')]),wire=serializeBattle(state);assert.deepEqual(serializeBattle(unwrap(restoreBattle(wire,content))),wire);
  const run=(chunk:number)=>{let s=unwrap(restoreBattle(wire,content));const events=[];for(let t=chunk;t<=4000;t+=chunk){const n=step(s,t);s=n.state;events.push(...n.events);}return{s,events};};const n=run(50);assert.deepEqual(n,run(100));assert.deepEqual(n,run(200));const cast=n.events.find(e=>e.type==='cast_start')!;assert(cast);const spent=step(state,cast.at_ms).state;assert.equal(state.actors[0]!.sp-spent.actors[0]!.sp,fixedSpCost(100,state.actors[0]!.stats));
 }
});
test('D180 actual gacha reaches both new Legendary cards with2draws and farm retains its chapter6 MVP gate and card chance',()=>{
 const g=content.documents['gacha.json'] as any,o=(content.documents['cards.json'] as any).origins;
 for(const id of mvpMagicIds){const pool=g.definitions.filter((id:string)=>o[id].rarity_id==='legendary'),total=pool.reduce((n:number,id:string)=>n+g.definition_weights[id],0),index=pool.indexOf(id),prior=pool.slice(0,index).reduce((n:number,id:string)=>n+g.definition_weights[id],0);let draws=0;const rolls=[.99,(prior+5)/total],result=pullCards(equipped().state,1,()=>rolls[draws++]!,'new',content);assert.equal(result[0]!.definition_id,id);assert.equal(result[0]!.rarity_id,'legendary');assert.equal(draws,2);assert.equal(g.definition_weights[id],10);}
 const s=equipped().state;for(const stage of storyStages(content)){const p=storyFarmSnapshot(stage,s,content).card_drops!;for(const id of mvpMagicIds)assert.equal(p.definition_pool.includes(id),stage.chapter>=6);assert(p.chance_per_million>=10000&&p.chance_per_million<=20000);}
});
test('D180 unpaid78card pool/pending/inventory/ledger and RNG remain exact through migration, first farm.claim pays oldpool then installs80',()=>{
 const s=equipped().state,stage=storyStage('8-20',content)!;s.story.cleared_stage_ids=storyStages(content).filter(s=>s.chapter<=8).map(s=>s.id);s.story.selected_farm_stage=stage.id;s.farm.rate_snapshot=storyFarmSnapshot(stage,s,content);s.farm.rate_snapshot.content_version='before-D180';const p=s.farm.rate_snapshot.card_drops!;p.definition_pool=p.definition_pool.filter(id=>!mvpMagicIds.includes(id)) as [string,...string[]];for(const id of mvpMagicIds){delete p.definition_weights[id];delete p.definition_rarities![id];}s.farm.remainders.gold=543;s.farm.drop_carry_ms=456;
 const before=structuredClone(s),m=migrateAccountState(s,content).state;assert.deepEqual(m,before);const end=start+43200000,iso=new Date(end).toISOString(),request='15600000-1111-4111-8111-111111111111',old=reserveFarm(s,start,end,iso,'farm_'+request,content),rules=new AccountCommandRules(content),cmd=rules.parse({type:'farm.claim',params:{collect_rewards:false},request_id:request,expected_revision:1,schema_version:1,...rules.versions}),clock:CommandTime={server_at:iso,now_ms:end,new_lease_at:iso,last_ack_ms:0,lease_expires_ms:0,started_ms:0,farm_from_ms:start,stored_last_ack_ms:0,stored_lease_ms:0},next=rules.decide(cmd,m,null,clock,'a'.repeat(64));assert.equal(next.receipt.outcome,'committed');assert.deepEqual(next.state.pending_rewards,old.pending_rewards);assert.deepEqual(next.state.farm.loot_rng,old.farm.loot_rng);assert.deepEqual(next.state.farm.remainders,old.farm.remainders);assert.deepEqual(next.state.inventory,s.inventory);assert.deepEqual(next.state.paid_ledger,s.paid_ledger);assert(mvpMagicIds.every(id=>next.state.farm.rate_snapshot!.card_drops!.definition_pool.includes(id)));rules.validateAccount(next.state);assert.deepEqual(s,before);
});
test('D180 actual UI descriptions/current-next values and native illustration metadata use the precise cards/slots',()=>{
 for(const id of mvpMagicIds){const f=equipped([id]),item=f.state.inventory.find(i=>i.definition_id===id)! as Card,view=cardView(item,f.state);assert.equal(view.origin!.grade,'mvp');assert.equal(view.item.rarity_id,'legendary');assert(view.nextModifiers);assert(!/undefined|NaN/.test(JSON.stringify(view)));assert(view.modifiers.some(m=>m.stat==='magical_attack'));const meta=JSON.parse(readFileSync(`assets/ro/items/card-${view.origin!.ro_item_id}.meta.json`,'utf8'));assert.equal(meta.file.width,300);assert.equal(meta.file.height,400);assert.equal(meta.kind,'card_illustration');}
});
test('D180 runtime manifest removes exactly two unused authoring fields, preserving all presentation visual/audio/recipe fields and source provenance',()=>{
 const pack=JSON.parse(readFileSync('runtime/ro/manifest.json','utf8')),source:Record<string,any>={};
 for(const file of readdirSync('plan/data/presentations')){if(!file.endsWith('.json'))continue;const d=JSON.parse(readFileSync('plan/data/presentations/'+file,'utf8'));for(const row of[...d.presentations,...d.hi_class_presentations??[]])source[row.id]=row;}
 for(const[id,p]of Object.entries(pack.presentations)){const old=source[id];assert(old?.provenance,id);const{provenance:_,icon_asset_id:__,...expected}=old;assert.deepEqual(p,expected,id);}
 assert.equal(pack.sizes.initial_profile_raw_bytes<=1579562,true);assert(pack.sizes.manifest_bytes+pack.sizes.media_and_sidecar_bytes<=33554432);assert.equal(pack.sizes.pack_budget_bytes,33554432);
});
