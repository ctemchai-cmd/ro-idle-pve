import fs from 'node:fs';import raw from '../../src/generated/content.json';
import {validateContent} from '../../src/content/loader.ts';import type{ValidatedContent}from'../../src/content/model.ts';
import {auditFixture,auditInput,auditFight,type AuditBuild,type AuditCase} from './class-audit-fixtures.ts';
const id='champion_chain_crush_combo',rows=[]as {candidate:string;phase:number;profile:string;encounter:string;seed:number;dps:number;gate_damage:number;alive_ms:number;team_dps:number;sp_skips:number}[];
const curve=(a:number,b:number)=>Array.from({length:10},(_,i)=>Math.round((a+(b-a)*i/9)*1e6)/1e6);
for(const[candidate,base,aw]of [['old',[5,8],[8.8,11.6]],['1200-2500',[12,25],[27.5,36.25]],['1500-3000',[15,30],[33,43.5]]]as const){
 const data=structuredClone(raw)as any,doc=data.documents['skills/acolyte.json'];doc.hi_class_skills.find((s:any)=>s.id===id).level_parameters.power=curve(base[0],base[1]);doc.awakened_variants[id].level_parameters.power=curve(aw[0],aw[1]);const loaded=validateContent(data);if(!loaded.ok)throw Error(JSON.stringify(loaded.errors));const content:ValidatedContent=loaded.value;
 for(const phase of[0,10]as const)for(const profile of['power','sp_burst']){
  const build:AuditBuild={id:'gate-'+profile,job:'champion',role:'damage',profile,slots:['monk_call_spirits',id,'acolyte_heal','acolyte_blessing']},condition:AuditCase={id:'gate100-aw'+phase,level:100,tier:60,stage:3,awaken:phase};const fixture=auditFixture(build,condition,content);
  for(const encounter of['dummy','pressure']as const){const input=auditInput(fixture,encounter,content);for(const seed of[7,19,41,103]){const s=auditFight(input,seed,content).sample;rows.push({candidate,phase,profile,encounter,seed,dps:s.dps,gate_damage:s.skill_damage[id]??0,alive_ms:s.alive_ms,team_dps:s.team_dps,sp_skips:s.sp_skips});}}
 }
}
const groups=[...new Set(rows.map(r=>[r.candidate,r.phase,r.profile,r.encounter].join('/')))].map(key=>{const a=rows.filter(r=>[r.candidate,r.phase,r.profile,r.encounter].join('/')===key);return{key,mean_dps:a.reduce((n,r)=>n+r.dps,0)/a.length,mean_gate_damage:a.reduce((n,r)=>n+r.gate_damage,0)/a.length,mean_alive_ms:a.reduce((n,r)=>n+r.alive_ms,0)/a.length};});fs.writeFileSync('plan/evidence/task-167/candidates.json',JSON.stringify({scope:'96 bounded Champion fights; two same-budget profiles/base and Awaken/neutral dummy and team pressure/four matched seeds. Not global calibration or an exhaustive build search.',rows,groups},null,2)+'\n');console.log(JSON.stringify(groups));
