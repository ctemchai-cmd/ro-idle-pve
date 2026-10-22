// Focused D-099 mechanics and save/reward checks. No calibration or balance runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { AccountState, Effect, ItemDefinition, Modifier } from '../../src/contracts/index.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { resolvedCardModifiers, resolvedCardTriggers } from '../../src/domain/build/equipment.ts';
import { EffectPipeline } from '../../src/domain/combat/effects.ts';
import { createBattle } from '../../src/domain/combat/index.ts';
import { fixedSpCost } from '../../src/domain/math/combat-modifiers.ts';
import { farmCardDrop } from '../../src/domain/rewards/card-drops.ts';
import { farmCardProfile } from '../../src/domain/modes/farm-card-profile.ts';
import { cardOrigins } from '../../src/content/card-catalog.ts';
import { weightedChoice } from '../../src/domain/rewards/weighted.ts';
import { reserveFarm } from '../../src/domain/rewards/farm.ts';
import { storyFarmSnapshot, storyStage, storyStages } from '../../src/domain/modes/story.ts';
import { actor, battle, checkpoint, content, skill, step, unwrap } from './combat-fixtures.ts';

type Card=Extract<AccountState['inventory'][number],{kind:'card'}>;
const card=(id:string,level=1,quality='bronze'):Card=>({instance_id:'test_'+id,definition_id:id,kind:'card',level,rarity_id:quality as Card['rarity_id'],locked:false});
const spec=JSON.parse(readFileSync('plan/generators/cards-spec.json','utf8'));
const time='2026-10-22T00:00:00.000Z',base=Date.parse(time);
function account(){return initializeAccount(content,{root_job_id:'swordsman',gender:'male'},time,'2026-10-22',1);}
function farming(stage='1-1') {const state=account();state.story.cleared_stage_ids=storyStages(content).slice(0,storyStages(content).findIndex(s=>s.id===stage)+1).map(s=>s.id);state.story.selected_farm_stage=stage;state.farm.rate_snapshot=storyFarmSnapshot(storyStage(stage,content)!,state,content);return state;}
function command(state:AccountState,type:string,params:unknown,now=base+300000){const rules=new AccountCommandRules(),cmd=rules.parse({type,params,request_id:'22222222-2222-4222-8222-222222222222',expected_revision:1,schema_version:1,...rules.versions});const clock:CommandTime={battle_seed:1,server_at:new Date(now).toISOString(),now_ms:now,new_lease_at:new Date(now+15000).toISOString(),last_ack_ms:0,lease_expires_ms:0,started_ms:0,farm_from_ms:Date.parse(state.farm.reserved_through),stored_last_ack_ms:0,stored_lease_ms:0};return rules.decide(cmd,state,null,clock,'b'.repeat(64));}
function withCard(id:string,overrides:Modifier[]=[],level=1){const input=actor('a','player'),item=card(id,level),def=content.items[id]! as unknown as ItemDefinition;input.stat_blueprint.permanent_sources.push({source:{instance_id:item.instance_id,owner_actor_id:'a',origin_actor_id:'a',origin_life_epoch:0,definition_id:id},modifiers:[...resolvedCardModifiers(item,content),...overrides],triggers:resolvedCardTriggers(item,content),...(def.defense_element?{defense_element:def.defense_element}:{})});return input;}
const bonus=(stat:Modifier['stat'],value:number):Modifier=>({id:'test_'+stat,stat,value,bucket:'bonus',op:'add_flat'});
function pipeline(id?:string,overrides:Modifier[]=[]){const state=checkpoint(battle([id?withCard(id,overrides):actor('a','player'),actor('b','enemy')])),events:unknown[]=[];let interrupted=0;const p=new EffectPipeline(state,content,{emit:e=>events.push(e),metric:()=>{},interrupt:()=>{interrupted++;},revive:()=>{}});return{state,p,events,get interrupted(){return interrupted;}};}
const damage=(type:'physical'|'magical'|'true'='physical',element='neutral'):Effect=>({id:'hit',type:'damage',target:'target',formula:{id:'flat_power',params:{amount:1000}},damage_type:type,element:element as 'neutral',hit_rule:'always',can_crit:false,hits:1,armor_rule:'normal'});
function incoming(f:ReturnType<typeof pipeline>,effect:Effect){const c=f.p.context(f.state.actors[1]!,'test','skill','root');c.selected={target:[f.state.actors[0]!]};f.p.program([effect],c);f.p.drain();return f.state.actors[0]!.stats.max_hp-f.state.actors[0]!.hp;}

test('66 native RO cards preserve all 60 legacy IDs, correct slots, exact art IDs and distinct source grades',()=>{
 const origins=cardOrigins(content),defs=Object.values(content.items).filter(i=>i.kind==='card');assert.equal(defs.length,66);assert.equal(new Set(spec.cards.map((c:{ro_item_id:number})=>c.ro_item_id)).size,66);
 const legacy=JSON.parse(readFileSync('plan/evidence/task-073-legacy-ids.json','utf8')) as string[];assert.equal(legacy.length,60);assert.ok(legacy.every(id=>content.items[id]?.kind==='card'));
 assert.deepEqual(Object.values(origins).reduce((r,o)=>(r[o.grade]++,r),{normal:0,mini:0,mvp:0}),{normal:49,mini:6,mvp:11});
 for(const row of spec.cards){const d=content.items[row.id]!;assert.equal(d.slot,row.slot);assert.equal(origins[row.id]!.ro_item_id,row.ro_item_id);const meta=JSON.parse(readFileSync(`assets/ro/items/card-${row.ro_item_id}.meta.json`,'utf8'));assert.equal(meta.id,`items.card-${row.ro_item_id}`);assert.equal(meta.kind,'card_illustration');assert.equal(meta.file.width,300);assert.equal(meta.file.height,400);}
 for(const[id,slot]of Object.entries({card_zerom:'accessory',card_andre:'weapon',card_lunatic:'weapon',card_raydric:'garment',card_sohee:'shoes',card_maya:'armor'}))assert.equal(content.items[id]!.slot,slot);
 assert.equal(origins.card_abysmal_knight!.grade,'normal');assert.equal(origins.card_garm!.monster_name,'Hatii');
});
test('quality/level improve benefits, reduce penalties, scale proc power once and pure control chance only',()=>{
 const base=resolvedCardModifiers(card('card_golden_thief_bug'),content),up=resolvedCardModifiers(card('card_golden_thief_bug',5,'gold'),content);
 for(let i=0;i<base.length;i++)assert.equal(up[i]!.value,Number(base[i]!.value)*(base[i]!.stat==='sp_cost_percent'?1/3:3));
 const a=resolvedCardTriggers(card('card_dark_lord'),content)[0]!,b=resolvedCardTriggers(card('card_dark_lord',5,'gold'),content)[0]!;assert.equal(a.chance,b.chance);assert.equal(Number(((b.effects[0] as Extract<Effect,{type:'damage'}>).formula.params as {attack_ratio:number}).attack_ratio),Number(((a.effects[0] as Extract<Effect,{type:'damage'}>).formula.params as {attack_ratio:number}).attack_ratio)*3);
 const x=resolvedCardTriggers(card('card_garm'),content)[0]!,y=resolvedCardTriggers(card('card_garm',5,'gold'),content)[0]!;assert.equal(y.chance,Number(x.chance)*3);assert.deepEqual(x.effects,y.effects);
 assert.deepEqual(resolvedCardTriggers(card('card_garm'),content),x?[x]:[]);
});
test('Raydric/Deviling reduce neutral damage and retain weaknesses; true damage bypasses new resistance',()=>{
 const baseline=incoming(pipeline(),damage()),ward=incoming(pipeline('card_raydric'),damage());assert.ok(ward<baseline);
 const fire=incoming(pipeline(),damage('magical','fire')),weak=incoming(pipeline('card_deviling'),damage('magical','fire'));assert.ok(weak>fire);
 assert.equal(incoming(pipeline('card_raydric'),damage('true')),incoming(pipeline(),damage('true')));
});
test('armor element and GTB magic-only guard/SP cost use shared stats; physical hits stay unchanged',()=>{
 assert.ok(incoming(pipeline('card_angeling'),damage('magical','holy'))<incoming(pipeline(),damage('magical','holy')));
 assert.ok(incoming(pipeline('card_golden_thief_bug'),damage('magical'))<incoming(pipeline(),damage('magical')));
 assert.equal(incoming(pipeline('card_golden_thief_bug'),damage()),incoming(pipeline(),damage()));
 const a=withCard('card_golden_thief_bug');a.resolved_skills={hit:{level:1,definition:skill('hit',0,60000,12)}};a.active_slots=['hit',null,null,null];const s=battle([a,actor('b','enemy')]),out=step(s,1500);assert.equal(s.actors[0]!.sp-out.state.actors[0]!.sp,15);assert.equal(fixedSpCost(12,out.state.actors[0]!.stats),15);
});
test('Marc/Marduk/Deviruchi resist only their status; hard CC still interrupts Phen',()=>{
 const status=(id:string):Effect=>({id:'cc',type:'apply_status',target:'target',status_id:id,duration_ms:1000,chance:1,params:id==='accuracy_down'?{ratio:.1}:{}});
 for(const[id,s]of [['card_marc','freeze'],['card_marduk','silence'],['card_deviruchi','accuracy_down']]){const f=pipeline(id);incoming(f,status(s!));assert.equal(f.state.actors[0]!.statuses.length,0);}
 const f=pipeline('card_phen',[bonus('interrupt_resistance',1)]);incoming(f,{id:'interrupt',type:'interrupt',target:'target'});assert.equal(f.interrupted,0);incoming(f,status('stun'));assert.equal(f.state.actors[0]!.statuses[0]!.status_id,'stun');assert.equal(f.interrupted,1);
});
test('Maya reflects magical only; normalized proc cannot recursively reflect itself',()=>{
 for(const[type,count]of [['physical',0],['magical',1]]as const){const input=withCard('card_maya');input.stat_blueprint.permanent_sources[0]!.triggers[0]!.chance=1;const state=checkpoint(battle([input,actor('b','enemy')])),events:{type:string}[]=[];const p=new EffectPipeline(state,content,{emit:e=>events.push(e),metric:()=>{},interrupt:()=>{},revive:()=>{}}),c=p.context(state.actors[1]!,'hit','skill','root');c.selected={target:[state.actors[0]!]};p.program([damage(type)],c);p.drain();assert.equal(events.filter(e=>e.type==='proc').length,count);}
});
test('Moonlight changes motion only, with identical virtual-time integration across frame chunks',()=>{
 const run=(hasCard:boolean)=>{const a=hasCard?withCard('card_moonlight_flower'):actor('a','player'),b=actor('b','enemy');a.normal_attack_enabled=true;a.spatial={x:100,y:100,radius:10,normal_range:25,move_speed:100};b.spatial={x:900,y:100,radius:10,normal_range:25,move_speed:0};return unwrap(createBattle({actors:[a,b],arena:{width:1000,height:300,step_ms:50},mode:{kind:'story',ref:'motion-card',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,1));};
 const before=run(false),initial=run(true),plain=step(before,1000),whole=step(initial,1000),split=step(step(initial,333).state,1000);
 assert.ok(whole.state.actors[0]!.spatial!.x>plain.state.actors[0]!.spatial!.x);assert.deepEqual(whole.state,split.state);assert.equal(initial.actors[0]!.phase_ready_at,before.actors[0]!.phase_ready_at);assert.equal(initial.actors[0]!.stats.attack_speed,before.actors[0]!.stats.attack_speed);
});
test('Osiris improves the existing revive recovery without adding a revive or replaying its old cast',()=>{
 const revive=skill('revive',1000,0,0);revive.selectors={dead:{team:'allies',life:'dead',select:'front_first',count:null,phase:'cast_resolve',missing:'skip'}};revive.effects=[{id:'revive',type:'revive',target:'dead',hp_ratio:.3,sp_ratio:.5}];
 const input=withCard('card_osiris'),first=step(battle([input,actor('healer','player',[revive]),actor('z','enemy')]),1600),killed=checkpoint(first.state);killed.actors[0]!.hp=0;const raised=step(killed,2500),a=raised.state.actors[0]!;
 assert.equal(a.life_epoch,1);assert.equal(a.hp,Math.floor(a.stats.max_hp*.7));assert.equal(a.sp,Math.floor(a.stats.max_sp*.9));assert.equal(a.action_phase,'normal_only');
});
test('every authored card proc resolves actual effects with target tags and no formula/status errors',()=>{
 for(const row of spec.cards.filter((r:{triggers:unknown[]})=>r.triggers.length)){
  const f=pipeline(row.id),a=f.state.actors[0]!,b=f.state.actors[1]!;b.tags=['race_demihuman','race_undead','element_water','element_earth','size_large','boss'];
  for(const source of a.stat_blueprint.permanent_sources)for(const t of source.triggers)t.chance=1;
  const c=f.p.context(row.triggers[0].event==='damage_received'?b:a,'hit',row.triggers[0].event==='normal_attack_hit'?'normal':'skill','root');c.damage_type=row.id==='card_maya'?'magical':'physical';
  f.p.event(row.triggers[0].event,a,c,row.triggers[0].event==='damage_received'?a:b,1000);f.p.drain();
  assert.ok(f.events.some((e:unknown)=>(e as {type:string}).type==='proc'),row.id);
 }
});
test('Hydra target bonus requires a physical hit against the matching race; its own proc cannot retrigger',()=>{
 for(const[type,match,count]of [['physical',true,1],['physical',false,0],['magical',true,0]]as const){const f=pipeline('card_hydra'),a=f.state.actors[0]!,b=f.state.actors[1]!;if(match)b.tags=['race_demihuman'];const c=f.p.context(a,'hit','skill','root');c.selected={target:[b]};f.p.program([damage(type)],c);f.p.drain();assert.equal(f.events.filter((e:unknown)=>(e as {type:string}).type==='proc').length,count);assert.equal(f.events.filter((e:unknown)=>(e as {type:string}).type==='damage').length,1+count);}
});
test('farm profile improves stage chance/quality, gates Mini/MVP, retains earlier cards and favors current tiers',()=>{
 const stages=storyStages(content),origins=cardOrigins(content);let chance=0,gold=0;
 for(let i=0;i<stages.length;i++){const s=farming(stages[i]!.id),p=s.farm.rate_snapshot!.card_drops!;assert.ok(p.chance_per_million>=chance&&p.quality_weights.gold>=gold);chance=p.chance_per_million;gold=p.quality_weights.gold;assert.equal(Object.values(p.quality_weights).reduce((a,b)=>a+b),1000000);assert.ok(p.definition_pool.every(id=>origins[id]!.grade==='normal'||stages[i]!.chapter>=(origins[id]!.grade==='mini'?2:6)));}
 const first=farming().farm.rate_snapshot!.card_drops!,last=farming(stages.at(-1)!.id).farm.rate_snapshot!.card_drops!;assert.equal(first.chance_per_million,10000);assert.equal(last.chance_per_million,20000);assert.equal(last.quality_weights.gold,350000);assert.equal(last.definition_pool.length,66);assert.ok(last.definition_pool.some(id=>origins[id]!.grade==='mvp'));assert.throws(()=>farmCardProfile(1,1,-1,130,content));
 assert.equal(weightedChoice(['a','b'],{a:9,b:1},.8999),'a');assert.equal(weightedChoice(['a','b'],{a:9,b:1},.9),'b');assert.throws(()=>weightedChoice(['a'],{a:1},1));
 let draws=0;assert.equal(farmCardDrop(first,()=>{draws++;return .9;}),null);assert.equal(draws,1);assert.ok(farmCardDrop(first,()=>0));
});
test('D-107 rare farm has1.44–2.88 expected cards per12h, true boundary chances and unchanged quality/grade rules',()=>{
 const stages=storyStages(content),interval=Number((content.documents['save-contracts.json']!.farm as unknown as {quantization:{drop_interval_ms:number}}).quantization.drop_interval_ms);assert.equal(interval,300000);
 for(const stage of stages){const p=farming(stage.id).farm.rate_snapshot!.card_drops!,expected=43200000/interval*p.chance_per_million/1e6;assert.ok(expected>=1.44&&expected<=2.88);assert.equal(p.version,'card_farm_v2');assert.ok(farmCardDrop(p,()=>0));assert.equal(farmCardDrop(p,()=>p.chance_per_million/1e6+1/4294967296),null);}
 const first=farming('1-1').farm.rate_snapshot!.card_drops!,last=farming('8-20').farm.rate_snapshot!.card_drops!;assert.deepEqual(first.quality_weights,{bronze:850000,silver:140000,gold:10000});assert.deepEqual(last.quality_weights,{bronze:150000,silver:500000,gold:350000});
});
test('D-107 frozen v1 accrual/owned/pending cards survive migration; claim settles old rate once then installs v2',()=>{
 const original=farming(),old=original.farm.rate_snapshot!.card_drops!;old.version='card_farm_v1';old.chance_per_million=200000;
 original.inventory.push({...card('card_angeling',4,'gold'),locked:true});
 original.pending_rewards.push({claim_id:'already_reserved',kind:'farm',resource_vector:Object.fromEntries(Object.keys(original.wallet).map(k=>[k,0])) as AccountState['wallet'],items:[card('card_weapon_1',3,'silver')],content_version:content.manifest.content_version,reserved_at:time,source_keys:['old-earned'],status:'pending'});
 const input=structuredClone(original),migrated=migrateAccountState(original,content).state;assert.deepEqual(migrated.inventory,input.inventory);assert.deepEqual(migrated.pending_rewards,input.pending_rewards);assert.deepEqual(migrated.farm.rate_snapshot!.card_drops,old);
 const end=base+12*3600000,expected=reserveFarm(migrated,base,end,new Date(end).toISOString(),'farm_22222222-2222-4222-8222-222222222222',content),actual=command(migrated,'farm.claim',{},end);
 assert.equal(actual.receipt.outcome,'committed');assert.deepEqual(actual.state.pending_rewards,expected.pending_rewards);assert.deepEqual(actual.state.farm.loot_rng,expected.farm.loot_rng);assert.deepEqual(actual.state.inventory,input.inventory);assert.equal(actual.state.farm.rate_snapshot!.card_drops!.version,'card_farm_v2');assert.equal(actual.state.farm.rate_snapshot!.card_drops!.chance_per_million,10000);assert.equal(actual.state.farm.reserved_through,new Date(end).toISOString());
 assert.deepEqual(original,input);
});
test('seeded farm split/cap/retry produces same fixed cards/gear and RNG without kill or speed input',()=>{
 const s=farming('8-20'),end=base+12*3600000,whole=reserveFarm(s,base,end,new Date(end).toISOString(),'whole',content),a=reserveFarm(s,base,base+333333,new Date(base+333333).toISOString(),'one',content),split=reserveFarm(a,base+333333,end,new Date(end).toISOString(),'two',content);
 const items=(state:AccountState)=>state.pending_rewards.flatMap(p=>p.items).map(({instance_id,...i})=>i);assert.deepEqual(items(whole),items(split));assert.deepEqual(whole.farm.loot_rng,split.farm.loot_rng);assert.deepEqual(whole.farm.remainders,split.farm.remainders);assert.ok(items(whole).some(i=>i.kind==='card'));assert.equal(items(whole).filter(i=>i.kind==='equipment').length,144);
 const cap=reserveFarm(s,base,base+20*3600000,new Date(base+20*3600000).toISOString(),'whole',content);assert.deepEqual(items(cap),items(whole));assert.deepEqual(whole,reserveFarm(s,base,end,new Date(end).toISOString(),'whole',content));assert.deepEqual(whole.wallet,s.wallet);
});
test('legacy snapshot settles before enabling cards; full bag never consumes or rerolls pending rewards',()=>{
 const s=farming();delete s.farm.rate_snapshot!.card_drops;const {state: migrated}=migrateAccountState(s,content);assert.equal(migrated.farm.rate_snapshot!.card_drops,undefined);const outdated=structuredClone(s);outdated.farm.rate_snapshot!.content_version='old';assert.equal(migrateAccountState(outdated,content).state.farm.rate_snapshot!.card_drops,undefined);
 const first=command(migrated,'farm.claim',{},base+3600000);assert.equal(first.receipt.outcome,'committed');assert.ok(first.state.pending_rewards.every(p=>p.items.every(i=>i.kind!=='card')));assert.ok(first.state.farm.rate_snapshot!.card_drops);
 const second=command(first.state,'farm.claim',{},base+13*3600000);assert.equal(second.state.farm.rate_snapshot!.card_drops!.version,'card_farm_v2');assert.ok(second.state.pending_rewards.at(-1)!.items.some(i=>i.kind==='equipment')); // A rare card is possible, never guaranteed by one seeded12h window.
 const pending=structuredClone(second.state.pending_rewards);while(second.state.inventory.length<500)second.state.inventory.push({...card('card_armor_1'),instance_id:'fill_'+second.state.inventory.length});const before=structuredClone(second.state),full=command(second.state,'reward.claim',{claim_id:pending.at(-1)!.claim_id});assert.equal(full.receipt.result.code,'INVENTORY_FULL');assert.deepEqual(full.state,before);assert.deepEqual(full.state.pending_rewards,pending);
});
test('slot correction migration returns incompatible cards to bag and preserves exact instance/quality/level/lock',()=>{
 const state=account(),main=state.roster[0]!,zerom={...card('card_zerom',5,'gold'),locked:true},wolf=card('card_weapon_1',3,'silver');state.inventory.push(zerom,wolf);main.slot_progress.shoes.cards[0]=zerom.instance_id;main.slot_progress.weapon.cards[0]=wolf.instance_id;
 const {state:after,changes}=migrateAccountState(state,content);assert.equal(after.roster[0]!.slot_progress.shoes.cards[0],null);assert.equal(after.roster[0]!.slot_progress.weapon.cards[0],wolf.instance_id);assert.deepEqual(after.inventory,state.inventory);assert.ok(changes.some(c=>c.includes('RO slot corrected')));new AccountCommandRules().validateAccount(after);assert.deepEqual(migrateAccountState(after,content).state,after);
});
