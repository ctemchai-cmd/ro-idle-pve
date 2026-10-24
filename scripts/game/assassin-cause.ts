/** Controlled single-factor probes, not a second combat model or a class DPS penalty. */
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {validateContent} from '../../src/content/loader.ts';
import {auditFixture,auditInput,AUDIT_CASES,type AuditBuild, type Encounter} from './class-audit-fixtures.ts';
import {createBattle,advanceUntil} from '../../src/domain/combat/index.ts';
import type {BattleInput} from '../../src/contracts/battle-input.ts';
import type {SkillDefinition} from '../../src/contracts/index.ts';
const loaded=validateContent(JSON.parse(gunzipSync(await readFile('plan/evidence/task-132/content-before.json.gz')).toString()));if(!loaded.ok)throw loaded.errors;const content=loaded.value;
const selected=JSON.parse(gunzipSync(await readFile('plan/evidence/task-131/results.json.gz')).toString());
const seeds=Array.from({length:16},(_,i)=>22901+i);
const variants=['current','no_ep_attack','no_ep_penetration','no_katar','duration12','ratio52_5','ratio52_5_duration12']as const;
interface CauseSample{seed:number;dps:number;team_dps:number;physical_crit_rate:number;ep_uptime:number;ep_overlap:number;ep_mean_attack_bonus:number;skill_dps:Record<string,number>}
const rows=[];let fights=0;
for(const encounter of ['dummy','pressure']as const){
 const row=selected.confirmed.find((r:{condition:string;encounter:Encounter;build:AuditBuild})=>r.condition==='high-90-awaken10'&&r.encounter===encounter&&r.build.job==='assassin_cross');
 const fixture=auditFixture(row.build,AUDIT_CASES.find(c=>c.id==='high-90-awaken10')!,content),input=auditInput(fixture,encounter,content);
 for(const variant of variants){
  const modified=structuredClone(input)as BattleInput,main=modified.actors.find(a=>a.actor_id==='main')!;
  const skill=main.resolved_skills.assassin_enchant_poison!.definition as Extract<SkillDefinition,{kind:'active'}>;
  const attack=skill.effects.find(e=>e.type==='apply_status'&&e.status_id==='attack_up')!;if(attack.type!=='apply_status')throw Error('EP_ATTACK');
  if(variant==='no_ep_attack')attack.params.ratio=0;
  if(variant==='no_ep_penetration'){const e=skill.effects.find(e=>e.type==='apply_status'&&e.status_id==='awaken_penetration')!;if(e.type==='apply_status')e.params.ratio=0;}
  if(variant==='duration12'||variant==='ratio52_5_duration12')attack.duration_ms=12000;
  if(variant==='ratio52_5'||variant==='ratio52_5_duration12')attack.params.ratio=.525;
  if(variant==='no_katar'){
   const k=main.resolved_skills.assassin_katar_mastery!.definition;if(k.kind!=='passive')throw Error('KATAR_PASSIVE');
   for(const m of k.modifiers)if(m.stat==='crit_chance_bonus')m.value=0;
   for(const source of main.stat_blueprint.permanent_sources)if(source.source.definition_id==='assassin_katar_mastery')for(const m of source.modifiers)if(m.stat==='crit_chance_bonus')m.value=0;
  }
  const samples:CauseSample[]=[];
  for(const seed of seeds){
   const initial=createBattle(modified,content,seed);if(!initial.ok)throw initial.errors;const result=advanceUntil(initial.value,90000,content,{}, {max_events:200000});if(!result.ok)throw result.errors;
   const {events,state}=result.value,damage=events.filter(e=>e.type==='damage'&&e.actor_id==='main'),physical=damage.filter(e=>e.skill_id!=='assassin_cross_soul_destroyer'||e.effect_id!=='soul');
   const ep=events.filter(e=>e.type==='status_applied'&&e.actor_id==='main'&&e.skill_id==='assassin_enchant_poison'&&e.status_change?.status_id==='attack_up');
   const boundaries=ep.flatMap(e=>[{at:e.at_ms,delta:1,ratio:Number(e.status_change!.params.ratio)},{at:Math.min(90000,e.status_change!.expires_at),delta:-1,ratio:-Number(e.status_change!.params.ratio)}]).sort((a,b)=>a.at-b.at);
   let count=0,ratio=0,previous=0,uptime=0,overlap=0,ratioMs=0;
   for(const b of boundaries){const duration=b.at-previous;if(count>0)uptime+=duration;if(count>1)overlap+=duration;ratioMs+=duration*ratio;count+=b.delta;ratio+=b.ratio;previous=b.at;}
   const amounts:Record<string,number>={};for(const e of damage)amounts[e.skill_id!]=(amounts[e.skill_id!]??0)+Number(e.amount??0);
   samples.push({seed,dps:state.metrics.actors.main!.hp_damage/90,team_dps:state.metrics.team.player.hp_damage/90,physical_crit_rate:physical.filter(e=>e.detail==='critical').length/physical.length,ep_uptime:uptime/90000,ep_overlap:overlap/90000,ep_mean_attack_bonus:ratioMs/90000,skill_dps:Object.fromEntries(Object.entries(amounts).map(([k,v])=>[k,v/90]))});fights++;
  }
  const mean=Object.fromEntries(['dps','team_dps','physical_crit_rate','ep_uptime','ep_overlap','ep_mean_attack_bonus'].map(k=>[k,samples.reduce((n,s)=>n+Number(s[k as keyof typeof s]),0)/samples.length]));
  rows.push({encounter,variant,build:row.build,mean,samples});console.log(JSON.stringify({encounter,variant,...mean}));
 }
}
await writeFile('plan/evidence/task-132/diagnosis.json',JSON.stringify({content_hash:content.manifest.content_hash,method:'Identical selected131 builds/stats/gear/16seeds. Remove one contribution or adjust only Enchant Poison ratio/duration; all slot costs and timing remain. Counterfactual marginal effects interact and must not be summed.',fights,seeds,rows},null,2)+'\n');
