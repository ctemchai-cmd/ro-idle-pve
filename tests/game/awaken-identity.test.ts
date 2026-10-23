import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import raw from '../../src/generated/content.json';
import manifest from './fixtures/awaken-identities-130.json';
import { actor,content,unwrap,type Active } from './combat-fixtures.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { createBattle,advanceUntil } from '../../src/domain/combat/index.ts';
import type { BattleCheckpoint,SkillDefinition } from '../../src/contracts/index.ts';
import { effectDescriptions } from '../../src/client/skills.ts';

const before=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-129/content-before.json.gz',import.meta.url))).toString()) as typeof raw;
test('D160 keeps every base definition, price, native icon and saved logical ID; 152 explicit gains replace generic CC fallback',()=>{
 assert.equal(manifest.count,152);assert.equal(new Set(manifest.variants.map(s=>s.id)).size,152);
 for(const root of ['swordsman','acolyte','archer','mage','thief','merchant']as const){
  const file=`skills/${root}.json`as 'skills/acolyte.json',old=before.documents[file],now=raw.documents[file];
  for(const key of ['skills','hi_class_skills','upgrades','hi_class_upgrades','awakened_upgrades']as const)assert.deepEqual(now[key],old[key],`${root}:${key}`);
 }
 for(const entry of manifest.variants){
  const base=resolveSkill(entry.id,10,content).definition as SkillDefinition;
  assert.ok(entry.gains.length>0,entry.id);
  for(let rank=1;rank<=10;rank++){
   const aw=resolveSkill(entry.id,rank,content,true).definition as SkillDefinition;
   assert.equal(aw.id,base.id);assert.equal(aw.presentation_id,base.presentation_id);
   if(aw.kind==='active'&&base.kind==='active'){
    assert.deepEqual(aw.timing,base.timing,entry.id);
    assert.ok(!aw.effects.some(e=>e.type==='apply_status'&&e.status_id==='cc_resistance_up'&&e.id.startsWith('awaken_')),entry.id);
   }
  }
 }
});
test('D160 extra hits use a uniform +20% total direct-power budget at all ranks, without doubling one-hit skills accidentally',()=>{
 for(const row of manifest.variants)for(const gain of row.gains){
  if(gain.type!=='extra_hits'||!('after'in gain)||!('before'in gain))continue;
  for(let rank=1;rank<=10;rank++){
   const aw=resolveSkill(row.id,rank,content,true).definition as Active,hit=aw.effects.find(e=>e.type==='damage')!;
   assert.ok(hit.type==='damage');if(hit.type!=='damage')continue;
   assert.equal(hit.hits,gain.after);assert.ok(gain.after!>gain.before!);
   const old=Object.values(before.documents).flatMap(d=>'awakened_variants'in d?Object.values(d.awakened_variants):[]).find(s=>s.id===row.id)!;
   const oldHit=(old as Active).effects.find(e=>e.type==='damage')!;assert.ok(oldHit.type==='damage');if(oldHit.type!=='damage')continue;
   assert.ok('attack_ratio'in oldHit.formula.params);assert.ok('attack_ratio'in hit.formula.params);
   const param=oldHit.formula.params.attack_ratio as unknown as {level_param:string};
   const oldPerHit=(old as SkillDefinition).level_parameters[param.level_param]![rank-1]!;
   assert.ok(Math.abs(Number(hit.formula.params.attack_ratio)*Number(hit.hits)-oldPerHit*Number(oldHit.hits)*1.2)<.00002,row.id);
  }
 }
});
function application(id:string,rank=10,withLocalPenetration=true){
 const s=structuredClone(resolveSkill(id,rank,content,true).definition)as Active;s.timing.after_cast_ms=60000;
 if(!withLocalPenetration)for(const e of s.effects)if(e.type==='damage')delete e.penetration_bonus;
 const caster=actor('caster','player',[s]);caster.stat_blueprint.derived_offsets.physical_attack=1000;caster.stat_blueprint.derived_offsets.magical_attack=1000;caster.stat_blueprint.derived_offsets.max_sp=2000;
 const boss=actor('boss','enemy');boss.stat_blueprint.derived_offsets.physical_defense=400;boss.stat_blueprint.derived_offsets.magical_defense=400;
 const initial=structuredClone(unwrap(createBattle({actors:[caster,actor('friend','player'),boss],mode:{kind:'story',ref:'awaken-identity',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,17)))as BattleCheckpoint;
 initial.actors.find(a=>a.actor_id==='caster')!.spirit_spheres=5;for(const a of initial.actors.filter(a=>a.team==='player'))a.hp-=10000;
 return unwrap(advanceUntil(initial,14000,content));
}
test('D160 actual caster penetration precedes own hit; armor shatter follows a landed hit; multi-hit is emitted, healing adds a real shield',()=>{
 const asura=application('monk_asura'),pen=asura.events.find(e=>e.type==='status_applied'&&e.status_change?.status_id==='awaken_penetration'),hit=asura.events.find(e=>e.type==='damage'&&e.skill_id==='monk_asura');
 assert.ok(pen&&hit);assert.ok(pen.sequence<hit.sequence);assert.ok(asura.state.metrics.actors.caster!.sp_spent>=2000);assert.equal(asura.state.metrics.actors.caster!.casts_started,1);
 const unscoped=application('monk_asura',10,false).events.find(e=>e.type==='damage'&&e.skill_id==='monk_asura')!;
 assert.equal(hit.raw,unscoped.raw);assert.ok(hit.amount!>unscoped.amount!,'local penetration must improve this cast despite its frozen offensive snapshot');
 const bash=application('swordsman_bash');assert.ok(bash.events.some(e=>e.type==='status_applied'&&e.status_change?.status_id==='armor_break'));
 const finger=application('monk_finger_offensive');assert.equal(finger.events.filter(e=>e.type==='damage'&&e.skill_id==='monk_finger_offensive').length,6);
 const heal=application('acolyte_heal');assert.ok(heal.state.metrics.actors.caster!.effective_heal>0);assert.ok(heal.state.metrics.actors.caster!.shield_created>0);
 const song=resolveSkill('bard_healing_song',10,content,true).definition as Active,shield=song.effects.find(e=>e.type==='shield');assert.ok(shield?.type==='shield'&&shield.formula.id==='physical_power');
 const sanc=resolveSkill('priest_sanctuary',10,content,true).definition as Active;assert.ok(!sanc.effects.some(e=>e.type==='heal'));assert.ok(sanc.effects.some(e=>e.type==='apply_status'&&e.status_id==='awaken_healing_received'));
 const breaker=application('sage_spell_breaker');assert.equal(breaker.events.filter(e=>e.type==='damage').length,0,'original interrupt-success damage predicate remains enforced');assert.ok(breaker.events.some(e=>e.status_change?.status_id==='awaken_penetration'));
});
test('D160 native descriptions expose new role bonuses and actual hit counts; no unknown Awaken status labels',()=>{
 for(const id of ['monk_call_spirits','swordsman_provoke','monk_asura','acolyte_blessing','priest_sanctuary','archer_concentration','monk_finger_offensive']){
  const s=resolveSkill(id,10,content,true).definition as Active,text=effectDescriptions(s.effects).join(' ');
  assert.ok(!text.includes('awaken_skill_power')&&!text.includes('awaken_penetration')&&!text.includes('awaken_healing_received'),id);
  assert.ok(!text.includes('ต้านสถานะ'),id);
 }
});
