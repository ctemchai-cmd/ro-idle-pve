import {withoutD169Document}from'./legacy-hi-v2-scope.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import legacyPrices from '../../src/domain/progression/legacy-skill-prices.ts';
import spec from '../../plan/generators/skill-distinctness.json';
import raw from '../../src/generated/content.json';
import type { SkillDefinition } from '../../src/contracts/index.ts';
import { actor, battle, checkpoint, content, unwrap, type Active } from './combat-fixtures.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { EffectPipeline } from '../../src/domain/combat/effects.ts';
import { advanceUntil, createBattle, type BattleState } from '../../src/domain/combat/index.ts';
import { describeResolvedSkill } from '../../src/client/skills.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { withoutD168Roles } from './legacy-distinctness-scope.ts';
const before=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-142/before-content.json.gz',import.meta.url))).toString()) as typeof raw;
const ids=Object.keys(spec.updates),get=(id:string,rank=10,aw=false)=>resolveSkill(id,rank,content,aw).definition as SkillDefinition;
const active=(id:string,rank=10,aw=false)=>get(id,rank,aw) as Active;
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<.00002,`${a} != ${b}`);
function lab(){
 const state=checkpoint(battle([actor('caster','player'),actor('friend','player'),actor('boss','enemy')]));
 const caster=state.actors.find(a=>a.actor_id==='caster')!,friend=state.actors.find(a=>a.actor_id==='friend')!,boss=state.actors.find(a=>a.actor_id==='boss')!,events:Record<string,unknown>[]=[],interrupted:string[]=[];
 const pipe=new EffectPipeline(state,content,{emit:e=>events.push(e),metric:()=>{},interrupt:a=>interrupted.push(a.actor_id),revive:()=>{}});
 function apply(id:string,rank=10,aw=false){const s=active(id,rank,aw),ctx=pipe.context(caster,id,'skill',id+state.event_sequence);ctx.selected=pipe.bindings(ctx,s.selectors);pipe.program(s.effects,ctx);pipe.drain();return s;}
 return{state,caster,friend,boss,pipe,events,interrupted,apply};
}
test('D168 exact authored scope18 stable IDs: outside declared programs, seven new statuses, public name and Ruwach presentation all documents remain identical; every price/timing/unlock unchanged',()=>{
 let count=0;
 for(const [key,old]of Object.entries(before.documents)){
  const now=withoutD169Document(key,raw.documents[key as keyof typeof raw.documents]) as Record<string,unknown>;
  if(key.startsWith('skills/')){assert.deepEqual(withoutD168Roles(now),old,key);count+=((now.skills as unknown[])?.length??0)+(now.hi_class_skills as unknown[])?.length;}
  else if(key==='status-effects.json'){now.statuses=(now.statuses as {id:string}[]).filter(s=>!spec.statuses.some(n=>n.id===s.id));assert.deepEqual(now,old);}
  else if(key==='strings.th.json'){(now.strings as Record<string,string>).acolyte_increase_agi='Increase Agi';assert.deepEqual(now,old);}
  else if(key==='presentations/acolyte.json'||key==='presentations/archer.json'){const arr=now.presentations as {id:string}[];const previous=(old as typeof now).presentations as {id:string}[];now.presentations=arr.map(r=>['visual_acolyte_increase_agi','visual_bard_encore'].includes(r.id)?previous.find(p=>p.id===r.id)!:r);assert.deepEqual(now,old);}
  else assert.deepEqual(now,old,key);
 }
 assert.equal(count,152);assert.equal(ids.length,18);
});
test('D1683040 base/Awaken rank descriptions are resolved, localized and progress; selected360rank programs retain original SP/CT/ACD and every phase grows beyond rank1',()=>{
 for(const id of ids)for(const aw of[false,true]){
  const d=Object.values(before.documents).filter(d=>'skills'in d).flatMap(d=>aw?Object.values((d as any).awakened_variants??{}):[...(d as any).skills,...((d as any).hi_class_skills??[])]).find((s:any)=>s.id===id) as SkillDefinition;
  const first=get(id,1,aw),last=get(id,10,aw);assert.notDeepEqual(first,last,id);
  for(let rank=1;rank<=10;rank++){
   const s=get(id,rank,aw),text=describeResolvedSkill(s,rank).effects.join(' ');assert.doesNotMatch(text,/NaN|undefined|blessing_attributes|endure_focus|intimidated|dance_ward|normal_power_up|skill_power_up|evasion_up/,id);
   if(s.kind==='active'&&d.kind==='active'){assert.deepEqual(s.timing,d.timing);const original=structuredClone(d.cost);function bind(x:any):any{if(x&&typeof x==='object'){if('level_param'in x)return d.level_parameters[x.level_param]![rank-1];if(Array.isArray(x))return x.map(bind);return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,bind(v)]));}return x;}assert.deepEqual(s.cost,bind(original));}
  }
 }
 let descriptions=0;for(const s of Object.values(content.skills).filter(s=>s.class_id!=='enemy'))for(const aw of[false,true])for(let rank=1;rank<=10;rank++){const text=describeResolvedSkill(get(String(s.id),rank,aw),rank).effects.join(' ');assert.doesNotMatch(text,/NaN|undefined/);descriptions++;}assert.equal(descriptions,3040);
});
test('D168 Blessing affects primary STR/INT/DEX+ASPD; Impo remains raw P/M attack; same-caster applications independently stack and expire',()=>{
 const l=lab(),stats=structuredClone(l.friend.stats);l.apply('acolyte_blessing');near(l.friend.stats.str/stats.str,1.2625);near(l.friend.stats.int/stats.int,1.2625);near(l.friend.stats.dex/stats.dex,1.2625);near(l.friend.stats.attack_speed,(stats.attack_speed+.25*(l.friend.stats.dex-stats.dex))*1.14);assert.equal(l.friend.stats.agi,stats.agi);
 l.state.game_time_ms=1000;l.apply('acolyte_blessing');near(l.friend.stats.str/stats.str,1.525);near(l.friend.stats.attack_speed,(stats.attack_speed+.25*(l.friend.stats.dex-stats.dex))*1.28);
 const afterBless=structuredClone(l.friend.stats);l.apply('priest_impositio');assert.equal(l.friend.stats.str,afterBless.str);assert.ok(l.friend.stats.physical_attack>afterBless.physical_attack);assert.ok(l.friend.stats.magical_attack>afterBless.magical_attack);
 l.state.game_time_ms=10000;l.pipe.expire();assert.equal(l.friend.statuses.filter(s=>s.status_id==='blessing_attributes').length,1);near(l.friend.stats.str/stats.str,1.2625);
 l.state.game_time_ms=11000;l.pipe.expire();assert.equal(l.friend.stats.str,stats.str);assert.equal(l.friend.stats.attack_speed,stats.attack_speed);
});
test('D168 Loud strengthens skill+healing while BattleCry strengthens normals+crit; no raw attack or hidden caps',()=>{
 const l=lab(),p=l.friend.stats.physical_attack,m=l.friend.stats.magical_attack;l.apply('merchant_loud_voice');near(Number(l.friend.stats.skill_damage_bonus),.4);near(l.friend.stats.outgoing_healing_bonus,.4);assert.equal(l.friend.stats.normal_damage_bonus,0);
 l.apply('knight_battle_cry');near(l.friend.stats.normal_damage_bonus,.21);near(l.friend.stats.crit_chance_bonus,.08);assert.equal(l.friend.stats.physical_attack,p);assert.equal(l.friend.stats.magical_attack,m);
 for(let i=0;i<10;i++)l.apply('merchant_loud_voice');near(Number(l.friend.stats.skill_damage_bonus),4.4);assert.equal(l.friend.statuses.filter(s=>s.status_id==='skill_power_up').length,11);
});
test('D168 actual Endure rejects hardCC and direct interruption, does not mitigate; AutoGuard mitigates but does not supply control resistance',()=>{
 const l=lab(),guard=l.caster.stats.guard_percent;l.apply('swordsman_endure');near(l.caster.stats.control_resistance,1);near(l.caster.stats.interrupt_resistance,1);assert.equal(l.caster.stats.guard_percent,guard);
 l.caster.action_phase='casting';const ctx=l.pipe.context(l.boss,'cc','skill','enemy');ctx.selected={foe:[l.caster]};l.pipe.program([{id:'stun',type:'apply_status',target:'foe',status_id:'stun',duration_ms:2000,params:{},chance:1},{id:'break',type:'interrupt',target:'foe'}],ctx);assert.equal(l.caster.statuses.filter(s=>s.status_id==='stun').length,0);assert.deepEqual(l.interrupted,[]);
 const a=lab();a.apply('crusader_auto_guard');near(a.caster.stats.guard_percent,.49);assert.equal(a.caster.stats.control_resistance,0);
});
test('D168 Ruwach actual Holy hits + DEF/MDEF break affect both armor lanes, base/Awaken; Intimidate is silence+both attack down, not stun',()=>{
 for(const aw of[false,true]){const l=lab();l.apply('acolyte_increase_agi',10,aw);assert.equal(l.events.filter(e=>e.type==='damage').length,aw?2:1);near(l.boss.stats.armor_break_percent,aw?.261:.18);const hits=l.events.filter(e=>e.type==='damage');assert.ok(hits.every(e=>Number(e.raw)>0));assert.equal(active('acolyte_increase_agi',10,aw).effects[0]!.type,'damage');}
 const l=lab(),p=l.boss.stats.physical_attack,m=l.boss.stats.magical_attack;l.apply('rogue_intimidate');near(l.boss.stats.physical_attack/p,.75);near(l.boss.stats.magical_attack/m,.75);assert.equal(l.boss.statuses.filter(s=>s.status_id==='stun').length,0);assert.equal(active('rogue_intimidate').effects[0]!.type,'apply_status');
});
test('D168 Encore CSPD+SP regen, evasion and separate ward mitigation are real stats',()=>{
 const l=lab(),cs=l.friend.stats.cast_speed;l.apply('bard_encore');near(l.friend.stats.cast_speed/cs,1.2);near(l.friend.stats.sp_regen_percent,.5);assert.equal(l.boss.statuses.filter(s=>s.status_id==='stun').length,0);
 l.apply('dancer_dissonance');near(l.friend.stats.damage_taken_bonus,-.15);assert.equal(l.friend.stats.guard_percent,0);
 const a=l.caster.stats.attack_speed;l.apply('thief_quick_step');near(l.caster.stats.evasion_bonus,.22);assert.equal(l.caster.stats.attack_speed,a);
});
test('D168 Bard raw healing/strike budget retained per phase, distinct from Dancer; Sanctuary six immediate MATK HoT ticks unchanged',()=>{
 for(const aw of[false,true])for(let rank=1;rank<=10;rank++){
  const doc=before.documents['skills/archer.json'],old=(aw?doc.awakened_variants.bard_healing_song:doc.skills.find(s=>s.id==='bard_healing_song')) as unknown as SkillDefinition;
  const values=old.level_parameters,r=rank-1,s=active('bard_healing_song',rank,aw),opening=s.effects.find(e=>e.type==='heal')!,hot=s.effects.find(e=>e.type==='apply_status'&&e.status_id==='physical_regeneration')!;if(opening.type!=='heal'||hot.type!=='apply_status')throw Error('SONG');
  const ticks=aw?6:5,total=Number((values as any).opening_power[r])+ticks*Number((values as any).power[r]);near(Number((opening.formula.params as {attack_ratio:number}).attack_ratio),total/2);near(Number(hot.params.power_ratio)*ticks,total/2);
  const strike=active('bard_performance_strike',rank,aw).effects.find(e=>e.type==='damage')!,dance=active('dancer_performance_strike',rank,aw).effects.find(e=>e.type==='damage')!;if(strike.type!=='damage'||dance.type!=='damage')throw Error('STRIKE');assert.equal(strike.hits,aw?4:2);assert.equal(dance.hits,1);near(Number((strike.formula.params as {attack_ratio:number}).attack_ratio)*Number(strike.hits),Number((dance.formula.params as {attack_ratio:number}).attack_ratio)*Number(dance.hits));
 }
 const s=active('priest_sanctuary');assert.equal(s.effects.filter(e=>e.type==='heal').length,0);assert.equal((content.statuses.sanctuary_regeneration!.periodic as {tick_on_apply:boolean}).tick_on_apply,true);
});
function fight(){const s=structuredClone(active('acolyte_increase_agi',10,true));s.timing.after_cast_ms=60000;const a=actor('caster','player',[s]);a.stat_blueprint.derived_offsets.max_sp=1000;return unwrap(createBattle({actors:[a,actor('boss','enemy')],mode:{kind:'story',ref:'role-replay',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,37));}
test('D168 new program uses identical1x/2x/4x event order and checkpoint continuation; all four ordered slots remain unchanged',()=>{
 const initial=fight(),expected=unwrap(advanceUntil(initial,12000,content));for(const speed of[1,2,4]){let state:BattleState=structuredClone(initial);const events=[];for(let t=250*speed;t<12000;t+=250*speed){const r=unwrap(advanceUntil(state,t,content));state=JSON.parse(JSON.stringify(r.state));events.push(...r.events);}const final=unwrap(advanceUntil(state,12000,content));events.push(...final.events);assert.deepEqual(final.state,expected.state);assert.deepEqual(events,expected.events);}
});
test('D168 old10-slot-compatible state keeps AGI legacy ID, rank, loadout, Awaken and paid history through migration; no refund/reprice',()=>{
 const at='2026-10-25T00:00:00.000Z',state=initializeAccount(content,{root_job_id:'acolyte',gender:'male'},at,'2026-10-25',1),a=state.roster[0]!;a.level=90;a.local_cap=100;a.completed_gate_ids=[20,40,60,80];a.job_id='high_priest';a.skill_levels.acolyte_increase_agi=10;a.awakened_skills=['acolyte_increase_agi'];a.active_slots[1]='acolyte_increase_agi';
 const empty=()=>Object.fromEntries(Object.keys(state.wallet).map(k=>[k,0]))as typeof state.wallet;
 for(const aw of[false,true]){const vector={...empty(),...(aw?legacyPrices.awaken_unlock:{})},table=aw?legacyPrices.awakened:legacyPrices.base,version=aw?'awakening-costs-v1':legacyPrices.roots.acolyte.cost_version;
  for(const row of table.upgrade_cost_rows)for(const [key,value]of Object.entries(row))if(key in vector)vector[key as keyof typeof vector]+=value;
  state.paid_ledger.push({entry_id:'legacy_paid_'+aw,character_id:'main',feature_id:aw?'skill_awaken':'skill',skill_id:'acolyte_increase_agi',quantity:10,cost_version:version,cost_versions:[version],paid_resources:vector,refund_state:'active',refund_command_id:null});
 }
 const original=structuredClone(state);const migrated=migrateAccountState(state,content);assert.deepEqual(migrated.state.roster[0]!.skill_levels,original.roster[0]!.skill_levels);assert.deepEqual(migrated.state.roster[0]!.active_slots,original.roster[0]!.active_slots);assert.deepEqual(migrated.state.roster[0]!.awakened_skills,original.roster[0]!.awakened_skills);assert.deepEqual(migrated.state.paid_ledger,original.paid_ledger);assert.deepEqual(migrated.state.wallet,original.wallet);assert.deepEqual(migrateAccountState(migrated.state,content).state,migrated.state);assert.doesNotThrow(()=>new AccountCommandRules(content).validateAccount(migrated.state));
});
test('D168 each selected Awaken1 improves its main budget beyond baseMax;18phase curves grow without a weaker first Awaken',()=>{
 for(const id of ids){const base=get(id,10),aw=get(id,1,true);
  if(base.kind==='passive'&&aw.kind==='passive'){for(const mod of base.modifiers){const next=aw.modifiers.find(m=>m.stat===mod.stat&&m.id===mod.id)!;assert.ok(next&&Math.abs(Number(next.value))>Math.abs(Number(mod.value)),id+mod.id);}continue;}
  if(base.kind!=='active'||aw.kind!=='active')throw Error('PHASE');
  if(id==='swordsman_endure'){assert.ok(Number(aw.effects[0]!.type==='apply_status'&&aw.effects[0].duration_ms)>5000);assert.ok(aw.effects.length>base.effects.length);continue;}
  for(const effect of base.effects){const next=aw.effects.find(e=>e.id===effect.id)!;assert.ok(next,id+effect.id);
   if(effect.type==='damage'&&next.type==='damage'){const b=Number((effect.formula.params as {attack_ratio:number}).attack_ratio)*Number(effect.hits),n=Number((next.formula.params as {attack_ratio:number}).attack_ratio)*Number(next.hits);assert.ok(n>b,id);}
   if(effect.type==='heal'&&next.type==='heal')assert.ok(Number((next.formula.params as {attack_ratio:number}).attack_ratio)>Number((effect.formula.params as {attack_ratio:number}).attack_ratio),id);
   if(effect.type==='apply_status'&&next.type==='apply_status'){for(const [key,value]of Object.entries(effect.params)){if(typeof value==='number'&&value!==0)assert.ok(Math.abs(Number(next.params[key]))>Math.abs(value),id+key);}}
  }
 }
});
