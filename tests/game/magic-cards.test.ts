import{withoutD180Document}from'./legacy-mvp-magic-scope.ts';
import bundle from '../../src/generated/content.json';
// D179 mechanical checks, not a balance calibration or owner-save operation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { AccountState, CombatBonus, Effect, ItemDefinition } from '../../src/contracts/index.ts';
import { validateContent } from '../../src/content/loader.ts';
import { localSchemaReference } from '../../src/content/schema-ref.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { applyRosterCommand } from '../../src/domain/progression/characters.ts';
import { pullCards } from '../../src/domain/rewards/gacha.ts';
import { cardOrigins } from '../../src/content/card-catalog.ts';
import { equippedSources, resolvedItemCombatBonuses, resolvedCardModifiers, cardPowerMultiplier } from '../../src/domain/build/equipment.ts';
import { cardRarity } from '../../src/domain/build/card-rarity.ts';
import { equipmentStats } from '../../src/client/equipment.ts';
import { cardView } from '../../src/client/slots.ts';
import { EffectPipeline } from '../../src/domain/combat/effects.ts';
import { conditionalCombatBonuses } from '../../src/domain/combat/conditional-bonuses.ts';
import { restoreBattle, serializeBattle } from '../../src/domain/combat/index.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { reserveFarm } from '../../src/domain/rewards/farm.ts';
import { storyFarmSnapshot, storyStage, storyStages } from '../../src/domain/modes/story.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { equipStarterSet } from './gear-fixtures.ts';
import { actor, battle, checkpoint, content, skill, step, unwrap, type Active } from './combat-fixtures.ts';

const ids=['card_scaraba','card_necromancer','card_agav','card_siroma','card_imp'];
const old=JSON.parse(readFileSync('plan/evidence/task-155/before-cards.json','utf8'));
const at='2026-10-26T00:00:00.000Z',start=Date.parse(at);
type Card=Extract<AccountState['inventory'][number],{kind:'card'}>;
const card=(id:string,level=1,instance=id):Card=>({kind:'card',instance_id:instance,definition_id:id,level,rarity_id:cardRarity(id,content),locked:false});
function equipped(list:string[]=[],level=1){
 const state=equipStarterSet(initializeAccount(content,{root_job_id:'mage',gender:'female'},at,'2026-10-26',17));
 const main=state.roster[0]!;for(const id of list){const item=card(id,level,`${id}_${state.inventory.length}`),slot=content.items[id]!.slot as keyof typeof main.equipment;state.inventory.push(item);const p=main.slot_progress[slot];p.refine=15;p.cards[p.cards.findIndex(id=>id===null)]=item.instance_id;}
 return{state,main,sources:equippedSources(main,state,content)};
}
function input(list:string[]=[],level=1){const a=actor('a','player');a.stat_blueprint.permanent_sources=equipped(list,level).sources;a.stat_blueprint.derived_offsets.magical_attack=500;a.stat_blueprint.derived_offsets.max_sp=10000;return a;}
function hit(a=actor('a','player'),type:'magical'|'physical'|'true'='magical',origin:CombatBonus['origins'][number]='skill',skillId='mage_fire_bolt',hits=3,defense=400){
 const target=actor('target','enemy');target.stat_blueprint.derived_offsets.magical_defense=defense;target.stat_blueprint.derived_offsets.physical_defense=defense;
 const state=checkpoint(battle([a,target])),before=structuredClone(state),events:unknown[]=[];
 const p=new EffectPipeline(state,content,{emit:e=>events.push(e),metric:()=>{},interrupt:()=>{},revive:()=>{}}),c=p.context(state.actors[0]!,skillId,origin,'root');c.selected={foe:[state.actors[1]!]};
 const effect:Effect={id:'hit',type:'damage',target:'foe',formula:{id:'flat_power',params:{amount:1000}},damage_type:type,element:'neutral',hit_rule:'always',can_crit:false,hits,armor_rule:'normal'};
 p.program([effect],c);p.drain();return{damage:state.actors[1]!.stats.max_hp-state.actors[1]!.hp,state,before,events};
}
test('D179 adds exactly5 real identities; all73 prior definitions, presentations, origins and monster traits are unchanged',()=>{
 const cards=withoutD180Document('cards.json',content.documents['cards.json']) as any;
 assert.equal(cards.definitions.length,78);assert.deepEqual(cards.definitions.filter((d:any)=>!ids.includes(d.id)),old.definitions);
 for(const key of['presentations','origins','monster_traits'])if(Array.isArray(old[key]))for(const row of old[key])assert.deepEqual(cards[key].find((r:any)=>r.id===row.id),row);else for(const[id,value]of Object.entries(old[key]))assert.deepEqual(cards[key][id],value);
 for(const[key,value]of Object.entries(old))if(!['definitions','presentations','origins','monster_traits','content_version','catalog_basis'].includes(key))assert.deepEqual(cards[key],value,key);
 const unchanged=JSON.parse(readFileSync('plan/evidence/task-155/unchanged-before.json','utf8'));for(const[file,sha]of Object.entries(unchanged))assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),sha,file);
 for(const id of ids){const d=content.items[id]!;assert.equal(d.kind,'card');assert(d.presentation_id);assert.equal((d as unknown as ItemDefinition).triggers.length,0);}
});
test('D179 equipped Scaraba/Agav raise actual M.ATK; general magic-damage cards leave M.ATK and healing power alone',()=>{
 const before=equipmentStats(equipped().state,'main').stats;
 for(const id of['card_scaraba','card_agav'])assert(equipmentStats(equipped([id]).state,'main').stats.magical_attack>before.magical_attack,id);
 for(const id of['card_siroma','card_imp']){const stats=equipmentStats(equipped([id]).state,'main').stats;assert.equal(stats.magical_attack,before.magical_attack);assert.equal(stats.outgoing_healing_bonus,before.outgoing_healing_bonus);assert(stats.outgoing_magical_bonus>before.outgoing_magical_bonus);assert.equal(stats.cast_speed,before.cast_speed);}
});
test('D179 actual MATK healing increases with Scaraba/Agav; Siroma/Imp only increase damage',()=>{
 const heal=(cards:string[])=>{const s=checkpoint(battle([input(cards),actor('target','enemy')]));s.actors[1]!.hp-=100000;const p=new EffectPipeline(s,content,{emit:()=>{},metric:()=>{},interrupt:()=>{},revive:()=>{}}),c=p.context(s.actors[0]!,'acolyte_heal','skill','root');c.selected={foe:[s.actors[1]!]};const before=s.actors[1]!.hp;p.program([{id:'heal',type:'heal',target:'foe',formula:{id:'healing_power',params:{attack_ratio:1,flat_power:0}}}],c);p.drain();return s.actors[1]!.hp-before;};
 const baseline=heal([]);for(const id of['card_scaraba','card_agav'])assert(heal([id])>baseline);for(const id of['card_siroma','card_imp'])assert.equal(heal([id]),baseline);
});
test('D179 generic Siroma/Imp boost every magical skill, normal and periodic hit, including Awaken; physical/true unchanged',()=>{
 const baseline=input();
 for(const id of['card_siroma','card_imp'])for(const origin of['skill','normal','periodic'] as const)for(const skillId of['mage_fire_bolt','mage_cold_bolt','wizard_storm_gust']){
  const plain=hit(baseline,'magical',origin,skillId),boost=hit(input([id]),'magical',origin,skillId);assert(boost.damage>plain.damage,`${id}/${origin}/${skillId}`);assert.equal(boost.events.length,plain.events.length);assert.deepEqual(boost.state.rng,plain.state.rng);
 }
 for(const type of['physical','true'] as const)assert.equal(hit(input(['card_siroma','card_imp']),type).damage,hit(baseline,type).damage);
 for(const aw of[false,true]){const d=structuredClone(resolveSkill('mage_fire_bolt',10,content,aw).definition) as Active;d.timing={cast_ms:0,after_cast_ms:60000,interruptible:true};d.cost={sp:0,spirit_spheres:0};const run=(cards:string[])=>{const a=input(cards);a.active_slots=[d.id,null,null,null];a.resolved_skills={[d.id]:{level:10,definition:d}};return step(battle([a,actor('target','enemy')]),4000);};const a=run([]),b=run(['card_imp']);assert(b.state.actors[1]!.hp<a.state.actors[1]!.hp);assert.deepEqual(a.state.rng,b.state.rng);assert.equal(a.events.filter(e=>e.type==='damage').length,b.events.filter(e=>e.type==='damage').length);}
});
test('D179 Necromancer is real pre-mitigation magical penetration, scales once and never leaks into physical/proc/reflect',()=>{
 const a=input(['card_necromancer']),without=structuredClone(a);for(const s of without.stat_blueprint.permanent_sources)delete s.combat_bonuses;
 for(const origin of['skill','normal','periodic'] as const){const p=hit(without,'magical',origin),q=hit(a,'magical',origin);assert(q.damage>p.damage);assert.deepEqual(q.state.rng,p.state.rng);assert.deepEqual(q.state.actors[0]!.stat_blueprint,a.stat_blueprint);assert.equal(q.events.length,p.events.length);}
 for(const type of['physical','true'] as const)assert.equal(hit(a,type).damage,hit(without,type).damage);
 for(const origin of['proc','reflect','system','transfer'] as const)assert.equal(hit(a,'magical',origin).damage,hit(without,'magical',origin).damage);
 assert.equal(hit(a,'magical','skill','mage_fire_bolt',3,-12).damage,hit(without,'magical','skill','mage_fire_bolt',3,-12).damage);
 for(let level=1;level<=5;level++){const c=card('card_necromancer',level);assert.equal(resolvedItemCombatBonuses(c,content)[0]!.penetration_bonus,.105*cardPowerMultiplier(c,content));}
 assert(resolvedItemCombatBonuses(card('card_necromancer',5),content)[0]!.penetration_bonus!>resolvedItemCombatBonuses(card('card_necromancer'),content)[0]!.penetration_bonus!);
});
test('D179 repeated instances add within existing buckets and generic profile filters match without RNG or mutations',()=>{
 const b=hit(input(['card_imp'])),c=hit(input(['card_imp','card_imp','card_imp']));assert(c.damage>b.damage);assert.deepEqual(b.state.rng,c.state.rng);
 const a=input(['card_necromancer']),source=a.stat_blueprint.permanent_sources.find(s=>s.combat_bonuses)!;source.combat_bonuses![0]!.skill_ids=['mage_fire_bolt'];source.combat_bonuses![0]!.damage_bonus=.2;
 const before=structuredClone(a);assert.deepEqual(conditionalCombatBonuses(a.stat_blueprint.permanent_sources,'magical','skill','mage_cold_bolt'),{damage:0,penetration:0});assert.equal(conditionalCombatBonuses(a.stat_blueprint.permanent_sources,'magical','skill','mage_fire_bolt').damage,.2);assert.deepEqual(a,before);
});
test('D179 battle checkpoint preserves frozen bonuses; virtual1x/2x/4x chunks produce identical state/events/RNG',()=>{
 const a=input(['card_necromancer','card_imp']),d=skill('test_hit',200,1000,0);d.effects=[{...(d.effects[0] as Extract<Effect,{type:'damage'}>),damage_type:'magical'}];a.active_slots=[d.id,null,null,null];a.resolved_skills={[d.id]:{level:1,definition:d}};
 const state=battle([a,actor('target','enemy')]),wire=serializeBattle(state);assert.deepEqual(serializeBattle(unwrap(restoreBattle(wire,content))),wire);
 const run=(chunk:number)=>{let s=unwrap(restoreBattle(wire,content));const events=[];for(let t=chunk;t<=12000;t+=chunk){const r=step(s,t);s=r.state;events.push(...r.events);}return{s,events};};assert.deepEqual(run(50),run(100));assert.deepEqual(run(50),run(200));
});
test('D179 optional schema accepts legacy sources and rejects bad profiles/local-schema references',()=>{
 const raw=()=>structuredClone(bundle) as any;assert(validateContent(raw()).ok);
 for(const change of[(b:any)=>b.damage_types=[],(b:any)=>b.origins=['invalid'],(b:any)=>b.skill_ids=['unknown'],(b:any)=>b.penetration_bonus=0,(b:any)=>b.penetration_bonus=-1,(b:any)=>b.penetration_bonus=Infinity]){const r=raw(),d=r.documents['cards.json'].definitions.find((d:any)=>d.id==='card_necromancer');change(d.combat_bonuses[0]);assert.equal(validateContent(r).ok,false);}
 {const r=raw(),d=r.documents['cards.json'].definitions.find((d:any)=>d.id==='card_necromancer');d.combat_bonuses.push(structuredClone(d.combat_bonuses[0]));assert.equal(validateContent(r).ok,false);}
 for(const ref of['https://evil.invalid/schema','../item.json','file:///etc/passwd','item.json#/$defs/missing','#/$defs/missing','missing.json',null])assert.throws(()=>localSchemaReference(ref,content.schemas,'item'));
 assert.deepEqual(localSchemaReference('item.json#/$defs/combat_bonus',content.schemas,'battle-checkpoint'),{schema:'item',fragment:'/$defs/combat_bonus'});assert.deepEqual(localSchemaReference('#/$defs/combat_bonus',content.schemas,'item'),{schema:'item',fragment:'/$defs/combat_bonus'});
});
test('D179 migration keeps frozen unpaid card pool/RNG/remainders/ledger, settles it first then installs expanded pool',()=>{
 const s=initializeAccount(content,{root_job_id:'mage',gender:'female'},at,'2026-10-26',17),stage=storyStage('8-20',content)!;s.story.cleared_stage_ids=storyStages(content).filter(r=>r.chapter<=8).map(r=>r.id);s.story.selected_farm_stage=stage.id;s.farm.rate_snapshot=storyFarmSnapshot(stage,s,content);
 s.farm.rate_snapshot.content_version='class2-before-D179';const p=s.farm.rate_snapshot.card_drops!;p.definition_pool=p.definition_pool.filter(id=>!ids.includes(id)) as [string,...string[]];for(const id of ids){delete p.definition_weights[id];delete p.definition_rarities![id];}s.inventory.push(card('card_fabre'));s.farm.remainders.gold=123;s.farm.drop_carry_ms=777;
 applyRosterCommand(s,{type:'character.level_up',params:{character_id:'main',target_level:2},request_id:'155-investment',expected_revision:1,schema_version:1,...new AccountCommandRules(content).versions},content);assert.equal(s.paid_ledger.length,1);applyRosterCommand(s,{type:'character.allocate_status',params:{character_id:'main',allocation:{...s.roster[0]!.primary_stats,int:s.roster[0]!.primary_stats.int+1}},request_id:'155-status',expected_revision:1,schema_version:1,...new AccountCommandRules(content).versions},content);
 s.pending_rewards.push({claim_id:'old_reserved',kind:'farm',resource_vector:{...Object.fromEntries(Object.keys(s.wallet).map(k=>[k,0])),gold:33} as AccountState['wallet'],items:[{...card('card_fabre'),instance_id:'pending_fabre',locked:true}],content_version:content.manifest.content_version,reserved_at:at,source_keys:['old_window'],status:'pending'});
 const before=structuredClone(s),m=migrateAccountState(s,content).state;assert.deepEqual(m,s);const end=start+43200000,iso=new Date(end).toISOString();const oldPaid=reserveFarm(s,start,end,iso,'farm_15500000-1111-4111-8111-111111111111',content);
 const rules=new AccountCommandRules(content),cmd=rules.parse({type:'farm.claim',params:{collect_rewards:false},request_id:'15500000-1111-4111-8111-111111111111',expected_revision:1,schema_version:1,...rules.versions});
 const clock:CommandTime={server_at:iso,now_ms:end,new_lease_at:iso,last_ack_ms:0,lease_expires_ms:0,started_ms:0,farm_from_ms:start,stored_last_ack_ms:0,stored_lease_ms:0};
 const next=rules.decide(cmd,m,null,clock,'a'.repeat(64));assert.equal(next.receipt.outcome,'committed');assert.deepEqual(next.state.pending_rewards,oldPaid.pending_rewards);assert.deepEqual(next.state.farm.loot_rng,oldPaid.farm.loot_rng);assert.deepEqual(next.state.farm.remainders,oldPaid.farm.remainders);assert.equal(next.state.farm.drop_carry_ms,oldPaid.farm.drop_carry_ms);assert.deepEqual(next.state.inventory,s.inventory);assert.deepEqual(next.state.paid_ledger,s.paid_ledger.filter(e=>e.feature_id!=='character_level'));assert(ids.every(id=>next.state.farm.rate_snapshot!.card_drops!.definition_pool.includes(id)));rules.validateAccount(next.state);assert.deepEqual(s,before);
});
test('D179 all five new identities are reachable in actual gacha at the fixed monster rarity using the original two-draw budget',()=>{
 const gacha=content.documents['gacha.json'] as any,origins=cardOrigins(content);
 for(const id of ids){const rarity=cardRarity(id,content),pool=gacha.definitions.filter((id:string)=>origins[id]!.rarity_id===rarity),total=pool.reduce((n:number,id:string)=>n+gacha.definition_weights[id],0),index=pool.indexOf(id),prior=pool.slice(0,index).reduce((n:number,id:string)=>n+gacha.definition_weights[id],0);assert(index>=0);
  const rolls=[rarity==='uncommon'?.6:.8,(prior+gacha.definition_weights[id]/2)/total];let draws=0;const result=pullCards(equipped().state,1,()=>rolls[draws++]!,'probe',content);assert.equal(result[0]!.definition_id,id);assert.equal(result[0]!.rarity_id,rarity);assert.equal(draws,2);
 }
});
test('D179 descriptions use current rarity/level, broad magic damage and actual penetration; no Bolt wording remains',()=>{
 for(const id of ids)for(const level of[1,5]){const view=cardView(card(id,level),equipped().state),text=JSON.stringify(view);assert(!/Cold Bolt|Fire Bolt/.test(text));assert(!/undefined|NaN/.test(text));}
 const mods=resolvedCardModifiers(card('card_imp'),content);assert.equal(mods.length,1);assert.equal(mods[0]!.stat,'outgoing_magical_bonus');assert.equal(Number(mods[0]!.value),.2625*cardPowerMultiplier(card('card_imp'),content));
});
