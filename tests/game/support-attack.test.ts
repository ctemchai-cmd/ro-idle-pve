import { withoutD166Curves } from './legacy-grimtooth-scope.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import raw from '../../src/generated/content.json';
import type { SkillDefinition } from '../../src/contracts/index.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { describeResolvedSkill } from '../../src/client/skills.ts';
import { EffectPipeline } from '../../src/domain/combat/effects.ts';
import { actor, battle, checkpoint, content, type Active } from './combat-fixtures.ts';
const ids=['knight_battle_cry','priest_impositio','merchant_loud_voice','blacksmith_weapon_perfection','whitesmith_maximum_overthrust','bard_battle_song'];
const before=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-132/content-after.json.gz',import.meta.url))).toString()) as typeof raw;
test('D164 only six allied attack buffs gain an exact M.ATK application; all152 definitions/costs/curves/IDs otherwise remain byte-equivalent data',()=>{
 for(const root of ['swordsman','acolyte','archer','mage','thief','merchant']){
  const key=`skills/${root}.json` as 'skills/acolyte.json',now=withoutD166Curves(raw.documents[key]);
  for(const row of [...now.skills,...now.hi_class_skills,...Object.values(now.awakened_variants)]){
   const s=row as unknown as SkillDefinition;
   if(s.kind!=='active')continue;
   const added=s.effects.filter(e=>e.id==='support_magic_up');assert.equal(added.length,ids.includes(s.id)?1:0,s.id);
   if(added.length){const original=s.effects.find(e=>e.type==='apply_status'&&e.status_id==='attack_up')!;assert.deepEqual(added[0],{...original,id:'support_magic_up',status_id:'magic_up'});s.effects=s.effects.filter(e=>e.id!=='support_magic_up') as Active['effects'];}
  }
  assert.deepEqual(now,before.documents[key],root);
 }
});
test('D164 base/Awaken ranks1–10 add both attacks equally, retain independent same-caster stacking and expire both instances together',()=>{
 for(const id of ids.filter(id=>!['knight_battle_cry','merchant_loud_voice'].includes(id)))for(const awakened of [false,true])for(const rank of [1,10]){
  const state=checkpoint(battle([actor('caster','player'),actor('friend','player'),actor('boss','enemy')])),caster=state.actors.find(a=>a.actor_id==='caster')!,friend=state.actors.find(a=>a.actor_id==='friend')!;
  const physical=friend.stats.physical_attack,magical=friend.stats.magical_attack,s=resolveSkill(id,rank,content,awakened).definition as Active;
  const e=s.effects.find(e=>e.type==='apply_status'&&e.status_id==='attack_up')!;assert.ok(e.type==='apply_status');if(e.type!=='apply_status')throw Error('BUFF');
  const pipe=new EffectPipeline(state,content,{emit:()=>{},metric:()=>{},interrupt:()=>{},revive:()=>{}});
  for(const t of [0,1000]){state.game_time_ms=t;const ctx=pipe.context(caster,id,'skill',id+t);ctx.selected={friends:[friend]};pipe.program(s.effects,ctx);}
  assert.ok(Math.abs(friend.stats.physical_attack/physical-(1+2*Number(e.params.ratio)))<1e-9,id);
  assert.ok(Math.abs(friend.stats.magical_attack/magical-(1+2*Number(e.params.ratio)))<1e-9,id);
  assert.equal(friend.statuses.filter(s=>s.status_id==='magic_up').length,2);
  state.game_time_ms=Number(e.duration_ms);pipe.expire();assert.equal(friend.statuses.filter(s=>s.status_id==='magic_up').length,1);
  state.game_time_ms=1000+Number(e.duration_ms);pipe.expire();assert.equal(friend.stats.physical_attack,physical);assert.equal(friend.stats.magical_attack,magical);
 }
});
test('D164 all152×20 rank descriptions use explicit P.ATK/M.ATK and never ambiguous ATK/MATK/พลังโจมตี; physical SP burst/HoT/ball and mixed SoulDestroyer are correct',()=>{
 let count=0;
 for(const source of Object.values(content.skills).filter(s=>s.class_id!=='enemy'))for(const awakened of [false,true])for(let rank=1;rank<=10;rank++){
  const s=resolveSkill(String(source.id),rank,content,awakened).definition as SkillDefinition,text=[...describeResolvedSkill(s,rank).effects,...describeResolvedSkill(s,rank).notes].join(' ');
  assert.doesNotMatch(text,/(?<![.\w])ATK\b|\bMATK\b|พลังโจมตี|NaN/,String(source.id));count++;
 }
 assert.equal(count,3040);
 const describe=(id:string)=>describeResolvedSkill(resolveSkill(id,10,content).definition as SkillDefinition,10).effects.join(' ');
 assert.match(describe('monk_asura'),/ดาเมจกายภาพ.*P\.ATK.*SP/);
 assert.match(describe('assassin_cross_soul_destroyer'),/P\.ATK.*M\.ATK/);
 assert.match(describe('priest_sanctuary'),/M\.ATK/);assert.match(describe('bard_healing_song'),/P\.ATK/);
 for(const id of ids.filter(id=>!['knight_battle_cry','merchant_loud_voice'].includes(id)))assert.match(describe(id),/เพิ่ม P\.ATK.*เพิ่ม M\.ATK/);
});
