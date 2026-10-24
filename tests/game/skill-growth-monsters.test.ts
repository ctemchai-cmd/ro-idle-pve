import test from 'node:test';
import assert from 'node:assert/strict';
import {content,actor,battle,step,checkpoint,type Active} from './combat-fixtures.ts';
import {resolveSkill} from '../../src/domain/build/resolve-skill.ts';
import type { SkillDefinition } from '../../src/contracts/index.ts';
import {towerBoss} from '../../src/domain/modes/tower.ts';
const active=(id:string,level=1)=>structuredClone(resolveSkill(id,level,content).definition) as Active;

test('D139 Happiness Heal restores all living allies, excludes dead, keeps existing cost/timing and stable ID',()=>{
 for(const [level,ratio]of [[1,4.2],[10,7]]as const){
  const heal=active('priest_resurrection',level);assert.equal((content.documents['strings.th.json']!.strings as Record<string,string>).priest_resurrection,'Happiness Heal');
  assert.deepEqual(heal.cost,{sp:60,spirit_spheres:0});assert.deepEqual(heal.timing,{cast_ms:1600,after_cast_ms:1300,interruptible:true});
  assert.equal(heal.effects.length,1);assert.equal(heal.effects[0]!.type,'heal');
  const inputs=[actor('p','player',[heal]),actor('friend','player'),actor('dead','player'),actor('boss','enemy')];inputs.forEach(a=>a.normal_attack_enabled=false);
  const state=checkpoint(battle(inputs));for(const a of state.actors){a.stats.max_hp=10000;a.hp=100;a.stats.magical_attack=100;}
  const dead=state.actors.find(a=>a.actor_id==='dead')!;dead.hp=0;dead.action_phase='dead';dead.phase_ready_at=null;
  const result=step(state,3200),events=result.events.filter(e=>e.type==='heal'&&e.skill_id==='priest_resurrection');
  assert.deepEqual(events.map(e=>e.target_id).sort(),['friend','p']);for(const e of events)assert.equal(e.amount,100*ratio);
  assert.equal(result.state.actors.find(a=>a.actor_id==='dead')!.hp,0);assert.ok(!result.events.some(e=>e.type==='revive'));
 }
});

test('D139 every player skill has real rank growth; five previous SP-only actions improve at every rank',()=>{
 const ids=(Object.values(content.skills) as unknown as SkillDefinition[]).filter(s=>s.class_id!=='enemy');assert.equal(ids.length,152);
 for(const s of ids){
  if(s.kind!=='active'||s.max_level<2)continue;
  const definitions=Array.from({length:s.max_level},(_,i)=>active(String(s.id),i+1));
  const strip=(d:Active)=>JSON.stringify({...d,cost:{...d.cost,sp:0}});
  assert.ok(new Set(definitions.map(strip)).size>1,`${s.id} only changes SP`);
 }
 for(const[id,start,end]of [['swordsman_provoke',4500,7500],['hunter_ankle_snare',1200,2400],['dancer_encore',1000,1800]]as const){
  const values=Array.from({length:10},(_,i)=>Number((active(id,i+1).effects[0] as {duration_ms:number}).duration_ms));
  assert.equal(values[0],start);assert.equal(values[9],end);assert.ok(values.every((v,i)=>!i||v>values[i-1]!));
 }
 const plants=Array.from({length:10},(_,i)=>active('alchemist_hell_plant',i+1).effects[0] as {power_scale:number;duration_ms:number});
 assert.equal(plants[0]!.power_scale,1.75);assert.equal(plants[9]!.power_scale,3.0625);assert.ok(plants.every((v,i)=>v.duration_ms===10000&&(!i||v.power_scale>plants[i-1]!.power_scale)));
});

test('D139 Story/Tower/Daily rotations are distinct, valid and retain first heavy cast without changing calibrated stats',()=>{
 const stages=content.documents['stages.json']!.stages as unknown as {chapter:number;index:number;encounter:{active_slots:(string|null)[]}[]}[];
 const rotations=new Set<string>();
 for(const s of stages){const slots=s.encounter[0]!.active_slots,ids=slots.filter((id):id is string=>id!==null);assert.equal(slots.length,4);assert.equal(new Set(ids).size,ids.length);ids.forEach(id=>assert.ok(content.skills[id]));rotations.add(ids.join(','));if([5,10,15].includes(s.index))assert.ok((content.skills[ids[0]!]!.tags as readonly string[]).includes('heavy_cast'));}
 assert.ok(rotations.size>=15);assert.ok(stages.some(s=>s.encounter[0]!.active_slots.filter(Boolean).length===4));
 assert.deepEqual(towerBoss(5,content).active_slots,['enemy_firestorm','enemy_lightning_bolt','enemy_enrage','enemy_sonic_blow']);
 const daily=content.documents['daily-bosses.json']!.bosses as unknown as {active_slots:(string|null)[]}[];assert.equal(new Set(daily.map(b=>JSON.stringify(b.active_slots))).size,3);
 for(const id of ['enemy_cold_bolt','enemy_lightning_bolt','enemy_sonic_blow','enemy_hammer_fall','enemy_mend']){
  const s=active(id);assert.equal(s.cost.sp,0);for(const e of s.effects)if(e.type==='damage'||e.type==='heal')assert.equal(e.formula.id,'physical_power');
 }
});

test('D139 four-action monster rotation uses identical events/checkpoint at1x/2x/4x and actual stun interrupts it',()=>{
 const ids=['enemy_cold_bolt','enemy_armor_break','enemy_sonic_blow','enemy_mend'];
 const p=actor('p','player'),z=actor('z','enemy',ids.map(id=>active(id)));p.normal_attack_enabled=false;z.normal_attack_enabled=false;
 const initial=checkpoint(battle([p,z]));for(const a of initial.actors){a.stats.max_hp=100000;a.hp=50000;}
 const runs=[1,2,4].map(speed=>{let state=checkpoint(initial);const events=[];while(state.game_time_ms<30000){const next=step(state,Math.min(30000,state.game_time_ms+50*speed));events.push(...next.events);state=checkpoint(next.state);}return{events,checkpoint:state};});
 assert.deepEqual(runs[1],runs[0]);assert.deepEqual(runs[2],runs[0]);for(const id of ids)assert.ok(runs[0]!.events.some(e=>e.type==='cast_start'&&e.skill_id===id),id);
 const stun=active('hunter_ankle_snare',10);stun.timing.cast_ms=500;stun.cost.sp=0;(stun.effects[0] as {chance:number}).chance=1;
 const interrupter=actor('p','player',[stun]);interrupter.normal_attack_enabled=false;const target=actor('z','enemy',[active('enemy_cold_bolt')]);target.normal_attack_enabled=false;
 const result=step(battle([interrupter,target]),4000);assert.ok(result.events.some(e=>e.type==='cast_interrupt'&&e.actor_id==='z'));assert.ok(!result.events.some(e=>e.type==='damage'&&e.skill_id==='enemy_cold_bolt'));
});
