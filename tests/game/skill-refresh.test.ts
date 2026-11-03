import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync}from'node:fs';import{gunzipSync}from'node:zlib';
import {content,unwrap}from'./combat-fixtures.ts';import{resolveSkill}from'../../src/domain/build/resolve-skill.ts';import{createBattle,advanceUntil,serializeBattle,restoreBattle}from'../../src/domain/combat/index.ts';import{auditFixture,auditInput,type AuditBuild}from'../../scripts/game/class-audit-fixtures.ts';
import patch from'../../plan/generators/skill-balance-2026-11.json';
const before=JSON.parse(gunzipSync(readFileSync('plan/evidence/task-190/content-before.json.gz')).toString());
test('refresh reviews all152 skills/32jobs and changes exactly11 explicit programs with costs/ranks/IDs/timing intact',()=>{
 const review=JSON.parse(readFileSync('plan/evidence/task-192/skill-review.json','utf8'));assert.equal(review.rows.length,152);assert.equal(new Set(review.rows.map((r:any)=>r.job)).size,32);assert.equal(Object.keys(patch.updates).length,11);
 for(const root of ['swordsman','acolyte','archer','mage','thief','merchant']){
  const key=`skills/${root}.json`,d=JSON.parse(readFileSync('plan/data/'+key,'utf8')),old=before.documents[key];
  for(const field of ['upgrades','hi_class_upgrades','awakened_upgrades'])assert.deepEqual(d[field],old[field],root+field);
  for(const s of [...d.skills,...d.hi_class_skills,...Object.values(d.awakened_variants)]as any[]){const aw=s.tags.includes('awakened'),b=aw?old.awakened_variants[s.id]:[...old.skills,...old.hi_class_skills].find((x:any)=>x.id===s.id),p=patch.updates[s.id as keyof typeof patch.updates];if(!p){assert.deepEqual(s,b,s.id);continue;}const actual=structuredClone(s);actual.effects=b.effects;actual.level_parameters=b.level_parameters;assert.deepEqual(actual,b,s.id+' only effect/curve change');}
 }
});
test('literal speed/attack budgets fix stacking sources without a stack cap, while Monk preparation remains unchanged',()=>{
 for(const [id,key,normal,aw]of[
  ['acolyte_blessing','haste',[.03,.08],[.088,.116]],
  ['acolyte_blessing','duration',[5500,10000],[11000,12500]],
  ['whitesmith_maximum_overthrust','ratio',[.4,.6],[.66,.87]],
  ['high_wizard_mystical_amplification','ratio',[.4,.55],[.605,.7975]],
  ['blacksmith_weapon_perfection','penetration',[.12,.24],[.264,.348]]]as const){
  for(const [awake,expected]of[[false,normal],[true,aw]]as const){const s=resolveSkill(id,1,content,awake).definition;assert.deepEqual([s.level_parameters[key]![0],s.level_parameters[key]!.at(-1)],expected,id);}
 }
 for(const aw of[false,true]){const palm=resolveSkill('champion_palm_strike',10,content,aw).definition;assert(palm.kind==='active');const hit=palm.effects[0]!;assert(hit.type==='damage');assert.equal(hit.hits,6);assert.equal(hit.crit_chance_bonus,.2);const gate=resolveSkill('champion_chain_crush_combo',10,content,aw).definition;assert(gate.kind==='active');assert.equal(gate.level_parameters.power!.at(-1),aw?36.25:25);assert.equal(gate.cost.spirit_spheres,5);}
});
test('Creator uses M.ATK for its finisher and shield; Weapon Perfection contributes precision instead of duplicate raw attacks',()=>{
 for(const aw of[false,true])for(const rank of[1,10]){
  const acid=resolveSkill('creator_acid_demonstration',rank,content,aw).definition;assert(acid.kind==='active');const hit=acid.effects[0]!;assert(hit.type==='damage');assert.equal(hit.damage_type,'magical');assert.equal(hit.formula.id,'magical_power');assert.equal(hit.hits,5);
  const shield=resolveSkill('creator_full_chemical_protection',rank,content,aw).definition;assert(shield.kind==='active');assert.equal((shield.effects.find(e=>e.type==='shield')as any).formula.id,'healing_power');
  const wp=resolveSkill('blacksmith_weapon_perfection',rank,content,aw).definition;assert(wp.kind==='active');assert(wp.effects.some(e=>e.type==='apply_status'&&e.status_id==='awaken_penetration'));assert(!wp.effects.some(e=>e.type==='apply_status'&&['attack_up','magic_up'].includes(e.status_id)));
 }
});
test('new Artifact stats, enhanced passive and refreshed buff programs replay identically at x1/x2/x3 and checkpoint restore',()=>{
 const build:AuditBuild={id:'refresh-clock',job:'champion',role:'damage',profile:'critical',slots:['monk_call_spirits','champion_chain_crush_combo','champion_palm_strike','acolyte_blessing']},f=auditFixture(build,{id:'new',level:100,tier:100,stage:3,awaken:10},content);
 f.account.artifacts!.items=[{instance_id:'artifact',definition_id:'artifact_monk_iron_fist',class_id:'champion',skill_id:'monk_iron_fist',rarity_id:'legendary',level:10,stars:5,locked:false,invested_gold:0,invested_essence:0}];f.account.artifacts!.slots.main=['artifact',null];const input=auditInput(f,'pressure',content);
 const run=(speed:number)=>{let state=unwrap(createBattle(input,content,7));const events:unknown[]=[];for(let t=100*speed;t<15000;t+=100*speed){const result=unwrap(advanceUntil(state,t,content));state=result.state;events.push(...result.events);if(t===6000)state=unwrap(restoreBattle(serializeBattle(state),content));}const last=unwrap(advanceUntil(state,15000,content));events.push(...last.events);return{checkpoint:serializeBattle(last.state),events};};const one=run(1);assert.deepEqual(run(2),one);assert.deepEqual(run(3),one);
});
