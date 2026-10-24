import test from'node:test';
import assert from'node:assert/strict';
import {readFileSync}from'node:fs';
import {gunzipSync}from'node:zlib';
import raw from'../../src/generated/content.json';
import {resolveSkill}from'../../src/domain/build/resolve-skill.ts';
import {describeResolvedSkill}from'../../src/client/skills.ts';
import {EffectPipeline}from'../../src/domain/combat/effects.ts';
import {actor,battle,checkpoint,content,type Active}from'./combat-fixtures.ts';
const previous=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-132/content-before.json.gz',import.meta.url))).toString())as typeof raw;
test('D163 only Enchant Poison base/Awaken ATK-duration and High Cart Termination power change; all prices, sources, CT/ACD/SP and other programs remain exact',()=>{
 for(const root of ['swordsman','acolyte','archer','mage','thief','merchant']as const){const key=`skills/${root}.json`as'skills/thief.json',now=structuredClone(raw.documents[key])as any,old=previous.documents[key];
  if(root==='thief'){now.skills.find((s:{id:string})=>s.id==='assassin_enchant_poison').level_parameters.ratio=old.skills.find(s=>s.id==='assassin_enchant_poison')!.level_parameters.ratio;
   now.awakened_variants.assassin_enchant_poison.level_parameters.ratio=old.awakened_variants.assassin_enchant_poison.level_parameters.ratio;now.awakened_variants.assassin_enchant_poison.level_parameters.duration=old.awakened_variants.assassin_enchant_poison.level_parameters.duration;}
  if(root==='merchant'){const prior=previous.documents['skills/merchant.json'];now.hi_class_skills.find((s:{id:string})=>s.id==='whitesmith_cart_termination').level_parameters.power=prior.hi_class_skills.find(s=>s.id==='whitesmith_cart_termination')!.level_parameters.power;now.awakened_variants.whitesmith_cart_termination.level_parameters.power=prior.awakened_variants.whitesmith_cart_termination.level_parameters.power;}
  assert.deepEqual(now,old,root);
 }
 for(let rank=1;rank<=10;rank++){
  const base=resolveSkill('assassin_enchant_poison',rank,content).definition as Active,aw=resolveSkill('assassin_enchant_poison',rank,content,true).definition as Active;
  const e=base.effects[0]!,a=aw.effects[0]!;assert.ok(e.type==='apply_status'&&a.type==='apply_status');if(e.type!=='apply_status'||a.type!=='apply_status')throw Error('EP');
  const prior=(previous.documents['skills/thief.json'].skills.find(s=>s.id===base.id)!.level_parameters as Partial<Record<string,number[]>>).ratio![rank-1]!;
  assert.ok(Math.abs(Number(e.params.ratio)-prior*.3/.4375)<.000001);
  assert.ok(Math.abs(Number(a.params.ratio)-(.33+.03*(rank-1)/9))<.000001);assert.equal(a.duration_ms,Math.round(11000+1000*(rank-1)/9));
  assert.ok(Number(a.params.ratio)>.3&&Number(a.duration_ms)>10000,'Awaken1 and every later rank exceed baseMax');
  assert.equal(Number((aw.effects[1]as Extract<Active['effects'][number],{type:'apply_status'}>).duration_ms),6000);
 }
 const text=describeResolvedSkill(resolveSkill('assassin_enchant_poison',10,content,true).definition as Active,10).effects.join(' ');assert.ok(text.includes('36%')&&text.includes('12s'));assert.ok(!text.includes('63.44%'));
});
test('D163 Enchant Poison still stacks independently from the same caster, adds ATK in its original bucket and expires each application separately',()=>{
 const state=checkpoint(battle([actor('caster','player'),actor('boss','enemy')])),caster=state.actors.find(a=>a.actor_id==='caster')!,base=caster.stats.physical_attack;
 const pipe=new EffectPipeline(state,content,{emit:()=>{},metric:()=>{},interrupt:()=>{},revive:()=>{}}),s=resolveSkill('assassin_enchant_poison',10,content,true).definition as Active;
 for(const time of[0,1000]){state.game_time_ms=time;const c=pipe.context(caster,s.id,'skill','ep'+time);c.selected={self:[caster]};pipe.program(s.effects,c);}
 const active=caster.statuses.filter(s=>s.status_id==='attack_up');assert.equal(active.length,2);assert.deepEqual(active.map(s=>s.expires_at),[12000,13000]);assert.ok(Math.abs(caster.stats.physical_attack-base*1.72)<1e-9);
 state.game_time_ms=12000;pipe.expire();assert.equal(caster.statuses.filter(s=>s.status_id==='attack_up').length,1);assert.ok(Math.abs(caster.stats.physical_attack-base*1.36)<1e-9);state.game_time_ms=13000;pipe.expire();assert.equal(caster.stats.physical_attack,base);
});
