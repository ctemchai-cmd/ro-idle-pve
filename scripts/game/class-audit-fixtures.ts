/** TASK-129: synthetic, validated builds; imports the actual game rules, never a second combat model. */
import type { AccountState, BattleActor, CombatStats, PrimaryStats, SkillDefinition } from '../../src/contracts/index.ts';
import type { BattleInput } from '../../src/contracts/battle-input.ts';
import type { ValidatedContent } from '../../src/content/model.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { progressionData } from '../../src/domain/progression/characters.ts';
import { allowedSkill, applySkillCommand, characterSkillCap, compileCharacterSkills, type SkillCommand } from '../../src/domain/progression/skills.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { allocateTowards } from '../../src/simulation/balance.ts';
import { fixedEnemyBlueprint, storyParty } from '../../src/domain/build/story.ts';
import { resolveStats } from '../../src/domain/math/index.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { createBattle, advanceUntil, type BattleState } from '../../src/domain/combat/index.ts';
import { metricRates } from '../../src/domain/combat/statistics.ts';

type Character = AccountState['roster'][number];
type Job = Character['job_id'];
export type Encounter = 'dummy' | 'pressure';
export interface AuditBuild { id: string; job: Job; role: string; profile: string; slots: string[] }
export interface AuditCase { id: string; level: number; tier: 1 | 20 | 40 | 60; stage: 1 | 2 | 3; awaken: 0 | 1 | 10 }
const roots:Record<string,{profile:string;slots:string[]}>= {
  swordsman:{profile:'power',slots:['swordsman_bash','swordsman_provoke','swordsman_magnum_break','swordsman_endure']},
  acolyte:{profile:'magic',slots:['acolyte_blessing','acolyte_heal','acolyte_holy_light','acolyte_increase_agi']},
  archer:{profile:'power',slots:['archer_concentration','archer_double_strafe','archer_arrow_shower','archer_crippling_shot']},
  mage:{profile:'magic',slots:['mage_fire_bolt','mage_cold_bolt','mage_lightning_bolt','mage_soul_strike']},
  thief:{profile:'power',slots:['thief_quick_step','thief_envenom','thief_sand_attack','thief_backstab']},
  merchant:{profile:'power',slots:['merchant_mammonite','merchant_cart_revolution','merchant_loud_voice','merchant_first_aid']},
};
const physical = { str: 55, agi: 25, vit: 15, int: 12, dex: 30, luk: 1 };
const profiles: Record<string, PrimaryStats> = {
  power: physical, speed: { str: 40, agi: 55, vit: 10, int: 10, dex: 30, luk: 1 },
  critical: { str: 40, agi: 35, vit: 10, int: 10, dex: 20, luk: 50 },
  magic: { str: 1, agi: 10, vit: 15, int: 60, dex: 40, luk: 1 },
  spell_speed: { str: 1, agi: 25, vit: 15, int: 45, dex: 65, luk: 1 },
  sp_burst: { str: 50, agi: 10, vit: 10, int: 60, dex: 30, luk: 1 },
  hybrid: { str: 45, agi: 20, vit: 15, int: 45, dex: 30, luk: 1 },
  tank: { str: 25, agi: 10, vit: 65, int: 25, dex: 30, luk: 1 },
};
const validators=new WeakMap<ValidatedContent,AccountCommandRules>();
// These are bounded candidate builds, not a claim of exhaustive optimization.
const base: Record<string, { role: string; profile: string; sets: string[][] }> = {
  knight: { role: 'damage/tank', profile: 'power', sets: [
    ['knight_twohand_quicken','knight_pierce','knight_brandish','swordsman_bash'],
    ['knight_battle_cry','knight_twohand_quicken','knight_pierce','knight_brandish'],
    ['swordsman_provoke','knight_counter_stance','swordsman_endure','knight_battle_cry']] },
  crusader: { role: 'tank/damage', profile: 'hybrid', sets: [
    ['crusader_holy_cross','crusader_grand_cross','swordsman_bash','swordsman_magnum_break'],
    ['swordsman_provoke','crusader_auto_guard','crusader_devotion','crusader_defender'],
    ['crusader_auto_guard','crusader_holy_cross','crusader_grand_cross','swordsman_bash']] },
  priest: { role: 'heal/support', profile: 'magic', sets: [
    ['acolyte_blessing','priest_impositio','priest_magnificat','acolyte_holy_light'],
    ['priest_sanctuary','priest_resurrection','priest_kyrie','priest_magnificat'],
    ['acolyte_blessing','priest_sanctuary','priest_resurrection','priest_impositio']] },
  monk: { role: 'damage/tank', profile: 'power', sets: [
    ['monk_call_spirits','monk_finger_offensive','monk_triple_attack','acolyte_blessing'],
    ['monk_call_spirits','monk_asura','acolyte_blessing','monk_triple_attack'],
    ['monk_steel_body','swordsman_provoke','monk_call_spirits','acolyte_heal']] },
  hunter: { role: 'damage/control', profile: 'power', sets: [
    ['hunter_hunters_mark','hunter_rapid_fire','hunter_blitz_beat','archer_double_strafe'],
    ['archer_concentration','hunter_rapid_fire','hunter_blitz_beat','hunter_claymore'],
    ['hunter_hunters_mark','hunter_rapid_fire','hunter_blitz_beat','hunter_claymore']] },
  bard: { role: 'support/heal', profile: 'power', sets: [
    ['bard_battle_song','bard_healing_song','bard_dissonance','bard_performance_strike'],
    ['bard_battle_song','bard_encore','bard_healing_song','bard_performance_strike'],
    ['archer_concentration','bard_performance_strike','archer_double_strafe','bard_dissonance']] },
  dancer: { role: 'support/heal', profile: 'power', sets: [
    ['dancer_battle_song','dancer_healing_song','dancer_dissonance','dancer_performance_strike'],
    ['dancer_battle_song','dancer_encore','dancer_healing_song','dancer_performance_strike'],
    ['archer_concentration','dancer_performance_strike','archer_double_strafe','dancer_dissonance']] },
  wizard: { role: 'damage/control', profile: 'magic', sets: [
    ['wizard_meteor','wizard_heavens_drive','wizard_jupitel','mage_fire_bolt'],
    ['wizard_storm_gust','wizard_jupitel','mage_cold_bolt','wizard_quagmire'],
    ['wizard_meteor','wizard_storm_gust','wizard_jupitel','wizard_heavens_drive']] },
  sage: { role: 'damage/support', profile: 'magic', sets: [
    ['sage_fire_endow','sage_psychic_bolt','sage_spell_breaker','mage_fire_bolt'],
    ['sage_fire_endow','sage_magic_barrier','sage_psychic_bolt','mage_lightning_bolt'],
    ['sage_fire_endow','sage_dispel','sage_spell_breaker','sage_magic_barrier']] },
  assassin: { role: 'damage', profile: 'critical', sets: [
    ['assassin_enchant_poison','assassin_sonic_blow','thief_backstab','thief_quick_step'],
    ['thief_envenom','assassin_venom_dust','assassin_detonate','assassin_sonic_blow'],
    ['assassin_enchant_poison','assassin_sonic_blow','assassin_grimtooth','thief_backstab']] },
  rogue: { role: 'damage/debuff', profile: 'power', sets: [
    ['rogue_strip_armor','rogue_expose','rogue_raid','rogue_copy_archer_double_strafe'],
    ['rogue_strip_armor','rogue_strip_weapon','rogue_expose','rogue_raid'],
    ['rogue_strip_armor','rogue_expose','rogue_intimidate','rogue_copy_acolyte_heal']] },
  blacksmith: { role: 'damage/support', profile: 'power', sets: [
    ['blacksmith_adrenaline','blacksmith_weapon_perfection','blacksmith_cart_crash','blacksmith_hammer_fall'],
    ['blacksmith_meltdown','blacksmith_cart_crash','blacksmith_hammer_fall','merchant_mammonite'],
    ['blacksmith_adrenaline','blacksmith_weapon_perfection','merchant_loud_voice','blacksmith_cart_crash']] },
  alchemist: { role: 'damage/heal/summon', profile: 'magic', sets: [
    ['alchemist_hell_plant','alchemist_acid_terror','alchemist_demonstration','alchemist_bio_cannibalize'],
    ['alchemist_hell_plant','alchemist_bio_cannibalize','alchemist_potion_pitcher','merchant_loud_voice'],
    ['alchemist_hell_plant','alchemist_acid_terror','alchemist_demonstration','alchemist_potion_pitcher']] },
};
// Monk's provoke comes from Steel Body itself; no cross-tree skill injection.
base.monk!.sets[2] = ['monk_steel_body','monk_call_spirits','acolyte_heal','acolyte_blessing'];
const high: Record<string, { parent: string; profile: string; sets: string[][] }> = {
  lord_knight: { parent:'knight',profile:'power',sets:[['lord_knight_aura_blade','knight_twohand_quicken','lord_knight_spiral_pierce','knight_pierce'],['knight_battle_cry','lord_knight_aura_blade','lord_knight_spiral_pierce','knight_brandish']] },
  paladin:{parent:'crusader',profile:'hybrid',sets:[['paladin_shield_chain','crusader_holy_cross','crusader_grand_cross','paladin_gospel'],['swordsman_provoke','crusader_auto_guard','paladin_gospel','paladin_shield_chain']]},
  high_priest:{parent:'priest',profile:'magic',sets:[['acolyte_blessing','priest_impositio','high_priest_assumptio','high_priest_basilica'],['priest_sanctuary','priest_resurrection','high_priest_assumptio','priest_magnificat']]},
  champion:{parent:'monk',profile:'power',sets:[['monk_call_spirits','monk_finger_offensive','champion_palm_strike','champion_chain_crush_combo'],['monk_call_spirits','monk_asura','champion_palm_strike','champion_chain_crush_combo']]},
  sniper:{parent:'hunter',profile:'power',sets:[['hunter_hunters_mark','sniper_falcon_assault','sniper_sharpshooting','hunter_rapid_fire'],['archer_concentration','sniper_falcon_assault','hunter_blitz_beat','hunter_rapid_fire']]},
  clown:{parent:'bard',profile:'power',sets:[['clown_marionette_control','bard_battle_song','clown_arrow_vulcan','bard_healing_song'],['clown_marionette_control','clown_arrow_vulcan','bard_performance_strike','archer_double_strafe']]},
  gypsy:{parent:'dancer',profile:'power',sets:[['dancer_battle_song','dancer_healing_song','gypsy_tarot_card_of_fate','gypsy_moonlit_water_mill'],['gypsy_tarot_card_of_fate','dancer_performance_strike','archer_double_strafe','dancer_dissonance']]},
  high_wizard:{parent:'wizard',profile:'magic',sets:[['high_wizard_mystical_amplification','high_wizard_napalm_vulcan','wizard_meteor','wizard_heavens_drive'],['high_wizard_mystical_amplification','high_wizard_napalm_vulcan','wizard_storm_gust','wizard_jupitel']]},
  professor:{parent:'sage',profile:'magic',sets:[['professor_double_casting','sage_fire_endow','sage_psychic_bolt','mage_fire_bolt'],['professor_double_casting','professor_soul_change','sage_psychic_bolt','mage_fire_bolt']]},
  assassin_cross:{parent:'assassin',profile:'hybrid',sets:[['assassin_enchant_poison','assassin_cross_soul_destroyer','assassin_cross_meteor_assault','assassin_sonic_blow'],['thief_envenom','assassin_venom_dust','assassin_detonate','assassin_cross_soul_destroyer']]},
  stalker:{parent:'rogue',profile:'power',sets:[['stalker_chase_walk','stalker_full_strip','rogue_expose','rogue_raid'],['stalker_full_strip','rogue_expose','rogue_raid','rogue_copy_archer_double_strafe']]},
  whitesmith:{parent:'blacksmith',profile:'power',sets:[['whitesmith_maximum_overthrust','blacksmith_adrenaline','blacksmith_weapon_perfection','whitesmith_cart_termination'],['whitesmith_maximum_overthrust','whitesmith_cart_termination','blacksmith_cart_crash','blacksmith_hammer_fall']]},
  creator:{parent:'alchemist',profile:'hybrid',sets:[['creator_acid_demonstration','alchemist_hell_plant','alchemist_demonstration','alchemist_acid_terror'],['creator_full_chemical_protection','creator_acid_demonstration','alchemist_hell_plant','alchemist_potion_pitcher']]},
};
export const AUDIT_CASES: AuditCase[] = [
  ...([1,20,40,60] as const).map(tier=>({id:`class2-70-gear${tier}`,level:70,tier,stage:2 as const,awaken:0 as const})),
  {id:'growth-20-gear20',level:20,tier:20,stage:2,awaken:0},
  {id:'growth-40-gear40',level:40,tier:40,stage:2,awaken:0},
  {id:'high-90-base',level:90,tier:60,stage:3,awaken:0},
  {id:'high-90-awaken1',level:90,tier:60,stage:3,awaken:1},
  {id:'high-90-awaken10',level:90,tier:60,stage:3,awaken:10},
  {id:'class1-1-gear1',level:1,tier:1,stage:1,awaken:0},
  {id:'class1-10-gear1',level:10,tier:1,stage:1,awaken:0},
];
export function auditBuilds(content:ValidatedContent,stage:1|2|3):AuditBuild[]{
  const out:AuditBuild[]=[];
  if(stage===1)return Object.entries(roots).flatMap(([job,s])=>[s.profile,s.profile==='magic'?'spell_speed':'speed'].map(profile=>({id:`${job}-root-${profile}`,job:job as Job,role:'class1',profile,slots:s.slots})));
  for(const job of content.jobs.order.filter(id=>content.jobs.byId[id]!.stage===stage)){
    const spec=stage===2?base[job]!:high[job]!,parent=stage===2?job:high[job]!.parent;
    const sets=stage===2?spec.sets:[...base[parent]!.sets.slice(0,2),...spec.sets];
    const choices=spec.profile==='magic'?['magic','spell_speed']:spec.profile==='hybrid'?['hybrid','magic','power','speed','critical']:job==='monk'||job==='champion'?['power','sp_burst','speed','critical']:[spec.profile,'speed','power','critical'];
    for(const [i,slots]of sets.entries())for(const profile of [...new Set(choices)])
      out.push({id:`${job}-${i+1}-${profile}`,job:job as Job,role:base[parent]!.role,profile,slots});
  }
  return out;
}
export interface AuditFixture { account: AccountState; build:AuditBuild; condition:AuditCase; costs:Partial<AccountState['wallet']>; primary:PrimaryStats; point_budget:number; points_spent:number }
export function auditFixture(build:AuditBuild,condition:AuditCase,content:ValidatedContent):AuditFixture{
  const job=content.jobs.byId[build.job]!;
  const state=initializeAccount(content,{root_job_id:job.root as Character['root_job_id'],gender:job.ancestors.includes('dancer')?'female':'male'},'2026-10-24T00:00:00.000Z','2026-10-24',129);
  for(const key of Object.keys(state.wallet)as(keyof typeof state.wallet)[])state.wallet[key]=100000000;
  const funded={...state.wallet},data=progressionData(content),pointBudget=data.progression.level_rows.find(r=>r.level===condition.level)!.total_status_points;
  let serial=1;const request=()=>`00000000-0129-4000-8000-${String(serial++).padStart(12,'0')}`;
  const upgrade=(character_id:string,skill_id:string,target_level:number)=>applySkillCommand(state,{type:'skill.upgrade',params:{character_id,skill_id,target_level},request_id:request()} as SkillCommand,content);
  const setup=(id:string,jobId:Job,profile:string,wanted:string[],awaken:AuditCase['awaken'])=>{
    const actor=state.roster.find(a=>a.character_id===id)!,gates=data.progression.breakthrough_gates.filter(g=>g.at_level<condition.level);
    const allocation=allocateTowards(profiles[profile]!,pointBudget,content);
    Object.assign(actor,{job_id:jobId,level:condition.level,local_cap:gates.at(-1)?.unlocks_local_cap??data.progression.base_local_cap,completed_gate_ids:gates.map(g=>g.at_level),primary_stats:allocation.stats,unspent_status_points:pointBudget-allocation.spent});
    if(content.jobs.byId[jobId]!.ancestors.includes('bard'))actor.gender='male';
    if(content.jobs.byId[jobId]!.ancestors.includes('dancer'))actor.gender='female';
    for(const id of wanted){const d=content.skills[id];if(!d||d.kind!=='active'||!allowedSkill(actor,d as unknown as SkillDefinition,content))throw new Error(`AUDIT_INVALID_CANDIDATE:${jobId}:${id}`);}
    const zero=Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0]))as typeof state.wallet;
    if(allocation.spent)state.paid_ledger.push({entry_id:`status_${id}`,character_id:id,feature_id:'status',skill_id:null,quantity:allocation.spent,cost_version:'synthetic-equal-point-budget',cost_versions:['synthetic-equal-point-budget'],paid_resources:zero,refund_state:'active',refund_command_id:null});
    const available=Object.values(content.skills).filter(s=>allowedSkill(actor,s as unknown as SkillDefinition,content)&&Number(s.unlock_level)<=actor.level);
    for(const definition of available)if(definition.kind==='passive'||wanted.includes(String(definition.id))){
      const rank=characterSkillCap(actor,definition as unknown as SkillDefinition);
      if((actor.skill_levels[String(definition.id)]??0)<rank)upgrade(id,String(definition.id),rank);
    }
    const slots=wanted.filter(s=>actor.skill_levels[s]&&available.some(d=>d.id===s));
    // At lower levels retain locked slots as null, with the normal four-slot SI cost.
    actor.active_slots=wanted.map(s=>slots.includes(s)?s:null) as Character['active_slots'];
    if(actor.active_slots.length!==4)throw new Error('AUDIT_REQUIRES_FOUR_SLOTS');
    if(awaken)for(const skill_id of slots){
      applySkillCommand(state,{type:'skill.awaken',params:{character_id:id,skill_id},request_id:request()}as SkillCommand,content);
      // condition.awaken is the requested upper bound; old case IDs stay stable,
      // while live fixtures always obey D190's current per-character rank caps.
      const target=Math.min(awaken,characterSkillCap(actor,content.skills[skill_id] as unknown as SkillDefinition));
      if(target>1)upgrade(id,skill_id,target);
    }
    const compatibility=content.documents['equipment.json']!.weapon_compatibility as Record<string,string>;
    for(const slot of ['weapon','head','armor','garment','shoes','accessory']as const){
      const definition=Object.values(content.items).find(d=>d.kind==='equipment'&&d.slot===slot&&d.tier_level===condition.tier&&(slot!=='weapon'||d.weapon_type===compatibility[jobId]));
      if(!definition)throw new Error(`AUDIT_GEAR_NOT_FOUND:${jobId}:${slot}:${condition.tier}`);
      const instance_id=`audit_${id}_${slot}`;
      state.inventory.push({instance_id,definition_id:String(definition.id),kind:'equipment',rarity_id:'common',locked:false,training:false,options:[]});actor.equipment[slot]=instance_id;
    }
  };
  setup('main',build.job,build.profile,build.slots,condition.awaken);
  // Exactly the same three companions across every main class in a condition.
  setup('npc_swordsman',condition.level<20?'swordsman':condition.level>70?'lord_knight':'knight','tank',condition.level<20?roots.swordsman!.slots:['swordsman_provoke','swordsman_endure','knight_counter_stance','knight_battle_cry'],0);
  setup('npc_acolyte',condition.level<20?'acolyte':condition.level>70?'high_priest':'priest','magic',condition.level<20?roots.acolyte!.slots:['priest_sanctuary','priest_resurrection','priest_magnificat','acolyte_blessing'],0);
  setup('npc_archer',condition.level<20?'archer':condition.level>70?'clown':'bard','power',condition.level<20?roots.archer!.slots:['bard_battle_song','bard_healing_song','bard_dissonance','bard_performance_strike'],0);
  let validator=validators.get(content);if(!validator){validator=new AccountCommandRules(content);validators.set(content,validator);}validator.validateAccount(state);
  const main=state.roster[0];
  return{account:state,build,condition,costs:Object.fromEntries(Object.keys(funded).map(k=>[k,funded[k as keyof typeof funded]-state.wallet[k as keyof typeof funded]])),primary:main.primary_stats,point_budget:pointBudget,points_spent:pointBudget-main.unspent_status_points};
}

export function auditInput(fixture:AuditFixture,encounter:Encounter,content:ValidatedContent):BattleInput{
  const state=fixture.account,compiled=Object.fromEntries(state.team.map(p=>[p.character_id,compileCharacterSkills(state.roster.find(a=>a.character_id===p.character_id)!,content)]));
  const party=storyParty(state,content,compiled,Object.fromEntries(state.team.map(p=>[p.character_id,`audit_${fixture.build.id}`])));
  const level=fixture.condition.level,defense=20+level*2;
  const template=party[0]!.stat_blueprint,baseline=resolveStats(template,content);
  const stats:CombatStats={...baseline,str:1,agi:1,vit:1,int:1,dex:1,luk:1,max_hp:1e9,max_sp:1e6,physical_attack:80+level*4,magical_attack:80+level*4,physical_defense:defense,magical_defense:defense,attack_speed:100,cast_speed:100,
    hit_bonus:0,evasion_bonus:0,crit_chance_bonus:0,crit_damage_bonus:0,crit_resistance:0,control_accuracy:0,control_resistance:0};
  // Clear every remaining secondary stat; never inherit a candidate's strengths onto the boss.
  for(const key of Object.keys(stats)as(keyof CombatStats)[])if(!(key in {str:1,agi:1,vit:1,int:1,dex:1,luk:1,max_hp:1,max_sp:1,physical_attack:1,magical_attack:1,physical_defense:1,magical_defense:1,attack_speed:1,cast_speed:1}))stats[key]=0;
  const ids=encounter==='pressure'?['enemy_bite','enemy_cataclysm','enemy_doom','enemy_firestorm']:[];
  const enemy:BattleInput['actors'][number]={actor_id:'audit_boss',team:'enemy',kind:'enemy',position:'front_1',stat_blueprint:fixedEnemyBlueprint(level,stats,'neutral',content),active_slots:[ids[0]??null,ids[1]??null,ids[2]??null,ids[3]??null],resolved_skills:Object.fromEntries(ids.map(id=>[id,structuredClone(resolveSkill(id,1,content))]))as BattleActor['resolved_skills'],tags:['boss','element:neutral','element_neutral','race_demi_human','size_large'],build_hash:'audit_boss_fixed',normal_attack_enabled:encounter==='pressure',spatial:{x:520,y:400,move_speed:encounter==='pressure'?85:0,radius:30,normal_range:80}};
  return{actors:[...(encounter==='dummy'?party.filter(a=>a.actor_id==='main'):party),enemy],arena:{width:720,height:820,step_ms:50},timing:{skill_interval_base_ms:3000,normal_attack_base_ms:1500},mode:{kind:'story',ref:`audit_${encounter}_${fixture.condition.id}`,time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}};
}
export interface AuditSample {
  seed:number; dps:number; normal_dps:number; skill_dps:number; team_dps:number; hps:number; shields:number; sp_skips:number; sphere_skips:number; sp_spent:number; casts:number; interrupted:number; boss_interrupted:number; alive_ms:number; survivors:number; duration_ms:number;
  burst10_dps:number; last30_dps:number; skill_damage:Record<string,number>; skill_healing:Record<string,number>;
}
export function auditFight(input:BattleInput,seed:number,content:ValidatedContent):{sample:AuditSample;initial:BattleState;final:BattleState}{
  const created=createBattle(input,content,seed);if(!created.ok)throw new Error(JSON.stringify(created.errors));
  const run=advanceUntil(created.value,90000,content,{}, {max_events:200000});if(!run.ok)throw new Error(JSON.stringify(run.errors));
  const final=run.value.state,m=final.metrics.actors.main!,normal=final.metrics.skills['main:normal_attack']?.hp_damage??0;
  const skill_damage=Object.fromEntries(Object.entries(final.metrics.skills).filter(([id])=>id.startsWith('main:')).map(([id,row])=>[id.slice(5),row.hp_damage]));
  const total=Object.values(skill_damage).reduce((a,b)=>a+b,0);
  if(Math.abs(total-m.hp_damage)>1e-6*Math.max(1,total))throw new Error('AUDIT_OWNER_DAMAGE_NOT_RECONCILED');
  const ownerIds=new Set(['main']);
  for(const event of run.value.events)if(event.type==='summon'&&ownerIds.has(event.target_id??''))ownerIds.add(event.actor_id);
  const damage=run.value.events.filter(e=>e.type==='damage'&&ownerIds.has(e.actor_id));
  const amount=(e:typeof damage[number])=>Number(e.amount??0);
  return{initial:created.value,final,sample:{seed,dps:metricRates(m,90000).dps,normal_dps:normal/90,skill_dps:(m.hp_damage-normal)/90,team_dps:final.metrics.team.player.hp_damage/90,hps:m.effective_heal/90,shields:m.shield_absorbed,sp_skips:m.sp_skips,sphere_skips:m.sphere_skips,sp_spent:m.sp_spent,casts:m.casts_resolved,interrupted:m.casts_interrupted,boss_interrupted:final.metrics.actors.audit_boss!.casts_interrupted,alive_ms:m.alive_time_ms,survivors:final.actors.filter(a=>a.kind==='party'&&a.hp>0).length,duration_ms:final.game_time_ms,burst10_dps:damage.filter(e=>e.at_ms<=10000).reduce((n,e)=>n+amount(e),0)/10,last30_dps:damage.filter(e=>e.at_ms>60000).reduce((n,e)=>n+amount(e),0)/30,skill_damage,skill_healing:Object.fromEntries(Object.entries(final.metrics.skills).filter(([id])=>id.startsWith('main:')).map(([id,row])=>[id.slice(5),row.effective_heal]))}};
}
