import{describeResolvedSkill}from'../../src/client/skills.ts';
import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{gunzipSync}from'node:zlib';
import spec from'../../plan/generators/hi-finisher-hierarchy.json';import {application}from'../../scripts/game/audit-hi-hierarchy.ts';
import{actor,skill,content,unwrap,type Active}from'./combat-fixtures.ts';import{resolveSkill}from'../../src/domain/build/resolve-skill.ts';import{createBattle,advanceUntil}from'../../src/domain/combat/index.ts';
import{withoutHierarchyDocument}from'./legacy-workshop-scope.ts';
const before=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-168/before.json.gz')).toString())as Record<string,string>;
test('D192 actual one-application damage/heal/buff/guard probes clear every named Class2Aw1 floor at Hi normalLv1',()=>{
 const cache=new Map<string,ReturnType<typeof application>>();const get=(id:string,aw:boolean)=>{const key=id+'/'+aw;if(!cache.has(key))cache.set(key,application(id,1,aw));return cache.get(key)!;};
 for(const p of spec.comparisons){const hi=get(p.skill,false),old=get(p.reference,true),metric=p.metric as 'damage'|'heal_per_target'|'offense'|'guard';assert(hi[metric]>=old[metric]*p.minimum_ratio,`${p.skill} ${metric} ${hi[metric]} vs${p.reference} ${old[metric]}`);}
 assert.equal(new Set(Object.values(content.skills).filter(s=>(s.tags as string[]).includes('hi_class')).map(s=>s.class_id)).size,13);
 const mage=resolveSkill('high_wizard_mystical_amplification',1,content).definition,wizard=resolveSkill('wizard_amplified_magic',1,content,true).definition;assert(Number(mage.level_parameters.ratio?.[0])>Number(wizard.level_parameters.ratio?.[0]));assert(content.statuses.mystical_focus!.allows_magical_crit);
});
test('D192 only declared High parameter fields and Chase modifier change; all126Class2 programs, all costs/times/IDs/options and every other status stay exact',()=>{
 for(const[file,text]of Object.entries(before)){const key=file.replace('plan/data/',''),actual=JSON.parse(readFileSync(file,'utf8'));assert.deepEqual(withoutHierarchyDocument(key,actual),JSON.parse(text),file);}
 for(const[id,patch]of Object.entries(spec.entries)){const doc=content.documents['skills/'+patch.root+'.json']as any,normal=doc.hi_class_skills.find((s:any)=>s.id===id),aw=doc.awakened_variants[id];for(const[key,curve]of Object.entries(patch.base_parameters))assert.deepEqual(normal.level_parameters[key],curve,id);for(const[key,curve]of Object.entries(patch.awakened_parameters))assert.deepEqual(aw.level_parameters[key],curve,id);}
});
test('D192 Chase skill power affects every hit of the next whole damaging action; normals do not gain it or consume charge',()=>{
 for(const aw of[false,true])for(let rank=1;rank<=10;rank++){const text=describeResolvedSkill(resolveSkill('stalker_chase_walk',rank,content,aw).definition as Active,rank).effects.join(' ');assert.match(text,/ดาเมจสกิล \+/);assert.match(text,/Ignore DEF\/MDEF/);}
 const charge=structuredClone(resolveSkill('stalker_chase_walk',1,content).definition)as Active;const follow=skill('rogue_raid',500,60000,0,1000);follow.effects[0]={...follow.effects[0]as Extract<Active['effects'][number],{type:'damage'}>,hits:3,armor_rule:'ignore'};
 const run=(enabled:boolean)=>{const first=structuredClone(charge);if(!enabled){const effect=first.effects[0];assert.equal(effect.type,'apply_status');if(effect.type==='apply_status')effect.params.skill_power=0;}const caster=actor('caster','player',[first,follow],true);caster.stat_blueprint.derived_offsets.max_sp=10000;const start=unwrap(createBattle({actors:[caster,actor('boss','enemy')],mode:{kind:'story',ref:'charge-power',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,19));return unwrap(advanceUntil(start,9000,content));};
 const base=run(false),charged=run(true),sum=(r:typeof base)=>r.events.filter(e=>e.skill_id===follow.id&&e.type==='damage').reduce((n,e)=>n+Number(e.amount),0);assert.equal(sum(charged),sum(base)*1.4);assert.equal(charged.events.filter(e=>e.skill_id===follow.id&&e.type==='damage').length,3);
 assert(!charged.state.actors.find(a=>a.actor_id==='caster')!.statuses.some(s=>s.status_id==='chase_charge'));
 const normal=charged.events.filter(e=>e.actor_id==='caster'&&e.type==='damage'&&e.skill_id==='normal_attack');assert(normal.length>0);assert.equal(new Set(normal.map(e=>e.raw)).size,1);
});
