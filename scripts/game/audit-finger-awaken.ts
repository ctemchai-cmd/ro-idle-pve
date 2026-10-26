import fs from 'node:fs';
import {actor,content,unwrap,type Active} from '../../tests/game/combat-fixtures.ts';
import {resolveSkill} from '../../src/domain/build/resolve-skill.ts';
import {createBattle,advanceUntil,serializeBattle} from '../../src/domain/combat/index.ts';
type AuditRow={defense:number;phase:string;rank:number;coefficient_total:number;damage:number[];mean:number;hits:number[];sp:number;balls:number};
const id='monk_finger_offensive',rows:AuditRow[]=[];
for(const defense of [0,300,1000])for(const [phase,rank,awakened]of [['base',10,false],['awaken1',1,true],['awaken10',10,true]]as const){
 const damage=[],hits=[],definition=structuredClone(resolveSkill(id,rank,content,awakened).definition)as Active;
 definition.timing.after_cast_ms=60000;
 for(const seed of [1,7,19,41,103,433,1799,2039]){
  const caster=actor('caster','player',[definition]);caster.resolved_skills[id]!.level=rank;caster.stat_blueprint.derived_offsets.physical_attack=1000;caster.stat_blueprint.derived_offsets.max_sp=2000;
  const target=actor('boss','enemy');target.stat_blueprint.derived_offsets.physical_defense=defense-12;
  const start=serializeBattle(unwrap(createBattle({actors:[caster,target],mode:{kind:'story',ref:'finger-audit',time_limit_ms:90000,ticket_day:null,daily_phase:null,daily_current_hp:null,reserved_phase_keys:[]}},content,seed)));
  start.actors.find(a=>a.actor_id==='caster')!.spirit_spheres=5;
  const end=unwrap(advanceUntil(start,5000,content));const events=end.events.filter(e=>e.actor_id==='caster'&&e.skill_id===id&&e.type==='damage');
  damage.push(end.state.metrics.actors.caster!.hp_damage);hits.push(events.length);
  if(end.events.filter(e=>e.type==='cast_resolve'&&e.actor_id==='caster').length!==1)throw Error('EXPECTED_ONE_CAST');
 }
 rows.push({defense,phase,rank,coefficient_total:Number(definition.effects.find(e=>e.type==='damage')?.hits)*Number((definition.effects.find(e=>e.type==='damage')?.formula.params as {attack_ratio?:number})?.attack_ratio??0),damage,mean:damage.reduce((a,b)=>a+b,0)/damage.length,hits,sp:Number(definition.cost.sp),balls:Number(definition.cost.spirit_spheres)});
}
const comparisons=[0,300,1000].map(defense=>{const group=rows.filter(r=>r.defense===defense),base=group[0]!.mean;return{defense,awaken1_increase:group[1]!.mean/base-1,awaken10_increase:group[2]!.mean/base-1};});
fs.writeFileSync('plan/evidence/task-166/finger-audit.json',JSON.stringify({scope:'72 single-cast fights, matched eight seeds/1000 P.ATK/neutral/equal DEF; actual hit/crit/mitigation engine. Not team DPS calibration. No skill power changes.',rows,comparisons},null,2)+'\n');console.log(JSON.stringify(comparisons));
