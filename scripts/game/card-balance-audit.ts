// D183: bounded card comparisons with the actual shared math/effect pipeline.
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import type { AccountState, Effect, ItemDefinition, Modifier, StatBlueprint, BattleCheckpoint } from '../../src/contracts/index.ts';
import type { ValidatedContent } from '../../src/content/model.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { createBattle, type ActorInput } from '../../src/domain/combat/index.ts';
import { resolvedCardModifiers, resolvedCardTriggers, resolvedItemCombatBonuses } from '../../src/domain/build/equipment.ts';
import { EffectPipeline } from '../../src/domain/combat/effects.ts';
import { resolveStats, hpRegen, spRegen, hitChance, critChance, critMultiplier } from '../../src/domain/math/index.ts';

const loaded=loadValidatedContent();if(!loaded.ok)throw Error(JSON.stringify(loaded.errors));
const current=loaded.value, frozen=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-159/before.json.gz')).toString());
const oldCards=frozen['plan/data/cards.json'],previous={...current,documents:{...current.documents,'cards.json':oldCards},items:{...current.items,...Object.fromEntries(oldCards.definitions.map((d:{id:string})=>[d.id,d]))}} as ValidatedContent;
type Card=Extract<AccountState['inventory'][number],{kind:'card'}>;
const profiles=[{level:1,primary:5,attack:100,hp:1200,sp:150,defense:100},{level:40,primary:50,attack:800,hp:10000,sp:700,defense:400},{level:90,primary:100,attack:4000,hp:50000,sp:3000,defense:1200}];
function blueprint(profile:typeof profiles[number]):StatBlueprint {
 const p=profile.primary,b:StatBlueprint={kind:'fixed',level:profile.level,job_id:null,allocated_primary:{str:p,agi:p,vit:p,int:p,dex:p,luk:p},derived_offsets:{physical_attack:0,magical_attack:0,max_hp:0,max_sp:0,physical_defense:0,magical_defense:0,attack_speed:0,cast_speed:0},permanent_sources:[],weapon_element:'neutral'};
 const s=resolveStats(b,current);for(const[key,value]of Object.entries({physical_attack:profile.attack,magical_attack:profile.attack,max_hp:profile.hp,max_sp:profile.sp,physical_defense:profile.defense,magical_defense:profile.defense}))b.derived_offsets[key as keyof typeof b.derived_offsets]=value-(s[key as keyof typeof s]??0);return b;
}
function input(bp:StatBlueprint,id:string,team:'player'|'enemy'):ActorInput{return{actor_id:id,team,kind:team==='player'?'party':'enemy',position:'front_1',build_hash:'card-budget-only',normal_attack_enabled:false,stat_blueprint:bp,active_slots:[null,null,null,null],resolved_skills:{},tags:[]};}
function measure(content:ValidatedContent,id:string|undefined,level:number,profile:typeof profiles[number]){
 const bp=blueprint(profile),definition=id?content.items[id] as unknown as ItemDefinition:undefined;
 if(id){const item:Card={kind:'card',instance_id:'card',definition_id:id,rarity_id:(content.documents['cards.json'] as any).origins[id].rarity_id,level,locked:false};bp.permanent_sources=[{source:{instance_id:'card',definition_id:id,owner_actor_id:'a',origin_actor_id:'a',origin_life_epoch:0},modifiers:resolvedCardModifiers(item,content),triggers:resolvedCardTriggers(item,content),combat_bonuses:resolvedItemCombatBonuses(item,content),...(definition!.defense_element?{defense_element:definition!.defense_element}:{})}];}
 const stats=resolveStats(bp,content),target=blueprint(profile);
 const amount=(type:'physical'|'magical'|'heal',origin:'normal'|'skill',matching:boolean,incoming=false)=>{
  let total=0;for(let seed=1;seed<=8;seed++){
   const a=input(bp,'a','player'),b=input(target,'b','enemy');if(matching)b.tags=['boss','size_large','element_neutral',...((definition?.triggers??[]).flatMap(t=>t.when?.type==='has_tag'&&t.when.actor==='event_target'?[t.when.tag]:[]))];
   const made=createBattle({actors:[a,b],mode:{kind:'story',ref:'card-budget',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,seed);if(!made.ok)throw Error(JSON.stringify(made.errors));
   const state=structuredClone(made.value) as BattleCheckpoint;state.actors.forEach(a=>a.hp=100000000);const p=new EffectPipeline(state,content,{emit:()=>{},metric:()=>{},interrupt:()=>{},revive:()=>{}}),source=state.actors[incoming?1:0]!,recipient=state.actors[incoming?0:1]!,c=p.context(source,type==='magical'?'mage_fire_bolt':'swordsman_bash',origin,'audit');c.selected={target:[recipient]};
   // A matching bonus is a separate explicitly conditional scenario, not a fictional live boss.
   const effect:Effect=type==='heal'?{id:'audit',type:'heal',target:'target',formula:{id:'healing_power',params:{attack_ratio:1,flat_power:0}}}:{id:'audit',type:'damage',target:'target',formula:{id:type==='magical'?'magical_power':'physical_power',params:{attack_ratio:1,flat_power:0}},damage_type:type,element:'neutral',hit_rule:'always',can_crit:false,hits:1,armor_rule:'normal'};
   if(type==='heal')recipient.hp=1;const before=recipient.hp;p.program([effect],c);p.drain();total+=Math.abs(recipient.hp-before);
  }return total/8;
 };
 const targetStats=resolveStats(target,content),normalExpectation=hitChance(stats,targetStats)*(1+critChance(stats,targetStats)*(critMultiplier(stats)-1));
 return{physical_skill:amount('physical','skill',false),magical_skill:amount('magical','skill',false),physical_matching:amount('physical','skill',true),magical_matching:amount('magical','skill',true),physical_normal:amount('physical','normal',false)*normalExpectation,magical_normal:amount('magical','normal',false),heal:amount('heal','skill',false),incoming_physical:amount('physical','skill',false,true),incoming_magical:amount('magical','skill',false,true),max_hp:stats.max_hp,max_sp:stats.max_sp,hp_regen:hpRegen(stats),sp_regen:spRegen(stats),aspd:stats.attack_speed,cspd:stats.cast_speed,evasion:stats.evasion_bonus,guard:stats.guard_percent,modifiers:bp.permanent_sources[0]?.modifiers??[] as Modifier[]};
}
const rows=[];for(const profile of profiles){const baseline=measure(current,undefined,1,profile);for(const id of Object.keys((current.documents['cards.json'] as any).origins))for(const level of[1,5])rows.push({id,level,profile_level:profile.level,rarity:(current.documents['cards.json'] as any).origins[id].rarity_id,baseline,before:measure(previous,id,level,profile),after:measure(current,id,level,profile)});}
const report={scope:'80 cards ×2 card levels ×3 equal fixed budgets. Actual stats/effect pipeline,8 matched seeds per effect. Separate matched/unmatched tags. No global job calibration; does not estimate full fight DPS or sum unlike stats into a score.',rows};if(rows.some(r=>r.baseline.heal<=0))throw Error('Invalid healing audit baseline');writeFileSync('plan/evidence/task-159/audit.json.gz',gzipSync(JSON.stringify(report)));
console.log(JSON.stringify({rows:rows.length,cards:80,profiles:profiles.length,matched_seeds:8}));
