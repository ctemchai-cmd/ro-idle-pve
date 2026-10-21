import { loadValidatedContent } from '../content/index.ts';
import type { AccountState, SkillDefinition } from '../contracts/index.ts';
import { allowedSkill, characterSkillCap, compileCharacterSkills, skillQuote } from '../domain/progression/skills.ts';
import { resolveSkill } from '../domain/build/resolve-skill.ts';
import { equippedSources } from '../domain/build/equipment.ts';
import { previewCharacterStats } from '../domain/build/character.ts';
import { castDurationMs, skillIntervalMs } from '../domain/math/index.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
type Character=AccountState['roster'][number];
const labels=content.documents['strings.th.json']!.strings as unknown as Record<string,string>;
const statNames:Record<string,string>={physical_attack:'พลังโจมตี',magical_attack:'พลังเวท',max_hp:'HP สูงสุด',max_sp:'SP สูงสุด',physical_defense:'เกราะกายภาพ',magical_defense:'เกราะเวท',attack_speed:'ความเร็วโจมตี',cast_speed:'ความเร็วร่าย',flat_sp_regen:'ฟื้น SP',sp_regen_percent:'อัตราฟื้น SP',crit_chance_bonus:'โอกาสคริ',crit_damage_bonus:'ดาเมจคริ',hit_bonus:'ความแม่นยำ',evasion_bonus:'การหลบ',healing_done_bonus:'พลังฮีล',str:'STR',agi:'AGI',vit:'VIT',int:'INT',dex:'DEX',luk:'LUK'};
const statusNames:Record<string,string>={attack_up:'เพิ่มพลังโจมตี',magic_up:'เพิ่มพลังเวท',attack_speed_up:'เพิ่มความเร็วโจมตี',cast_speed_up:'เพิ่มความเร็วร่าย',stun:'สตัน',freeze:'แช่แข็ง',silence:'ใบ้',poison:'พิษ',bleed:'เลือดไหล',armor_break:'ลดเกราะ',guard:'ลดดาเมจ',provoke:'ยั่วยุ',regeneration:'ฟื้นฟูต่อเนื่อง'};
Object.assign(statNames,{crit_resistance:'ต้านคริ',control_accuracy:'โอกาสทำสถานะ',control_resistance:'ต้านสถานะ',outgoing_physical_bonus:'ดาเมจกายภาพ',outgoing_magical_bonus:'ดาเมจเวท',outgoing_true_bonus:'ดาเมจจริง',damage_taken_bonus:'ดาเมจที่ได้รับ',guard_percent:'ลดดาเมจ',armor_break_percent:'ลดเกราะ',penetration_percent:'เจาะเกราะ',outgoing_healing_bonus:'พลังฮีล',healing_received_bonus:'การรับฮีล',hp_regen_percent:'ฟื้น HP ตามสัดส่วน',flat_damage_reduction:'ลดดาเมจคงที่',flat_penetration:'เจาะเกราะคงที่',flat_hp_regen:'ฟื้น HP'});
Object.assign(statusNames,{aspd_up:'เพิ่มความเร็วโจมตี',defense_up:'เพิ่มเกราะกายภาพ',magic_defense_up:'เพิ่มเกราะเวท',guard_up:'ลดดาเมจ',crit_up:'เพิ่มคริ',mana_regen_up:'เพิ่มการฟื้น SP',cc_resistance_up:'ต้านสถานะ',exposed:'เพิ่มดาเมจที่ได้รับ',slow:'ช้าลง',fire_endow:'เสริมธาตุไฟ',counter_stance:'เตรียมสวนกลับ',devotion:'รับดาเมจแทนเพื่อน',attack_down:'ลดพลังโจมตี',accuracy_down:'ลดความแม่นยำ',venom:'พิษรุนแรง',chemical_burn:'เผาไหม้เคมี',frost_field:'เขตน้ำแข็ง'});
const statUnits=Object.fromEntries((content.documents['stat-definitions.json']!.stats as unknown as {id:string;unit:string}[]).map(s=>[s.id,s.unit]));
const number=(n:unknown)=>Number(n).toLocaleString('th-TH',{maximumFractionDigits:2}),percent=(n:unknown)=>number(Number(n)*100)+'%';
function summaries(definition:SkillDefinition):string[]{
 if(definition.kind==='passive')return [...definition.modifiers.map(m=>`${statNames[m.stat]??m.stat} ${Number(m.value)>=0?'+':''}${m.op==='add_percent'||statUnits[m.stat]==='ratio'?percent(m.value):number(m.value)}${m.when?' เมื่อเข้าเงื่อนไข':''}`),...definition.triggers.map(()=> 'ทำงานอัตโนมัติเมื่อเข้าเงื่อนไข')];
 return definition.effects.map(effect=>{
  let text='';
  if('formula'in effect){const f=effect.formula;
   if(f.id==='physical_power'||f.id==='magical_power'||f.id==='healing_power')text=`${effect.type==='heal'?'ฟื้น HP':effect.type==='shield'?'สร้างโล่':f.id==='physical_power'?'กายภาพ':'เวท'} ${percent(f.params.attack_ratio)} ${f.id==='physical_power'?'ATK':'MATK'}${Number(f.params.flat_power)?' + '+number(f.params.flat_power):''}`;
   else if(f.id==='flat_power')text=`${effect.type==='heal'?'ฟื้น HP':effect.type==='shield'?'โล่':'ดาเมจ'} ${number(f.params.amount)}`;
   else if(f.id==='sp_burst_power')text=`พลังโจมตี ${percent(f.params.attack_ratio)} ATK + ${percent(f.params.sp_ratio)} SP`;
   else text='ผลต่อเนื่องตามพลังของสกิล';
  }else if(effect.type==='apply_status'){const ratio=effect.params.ratio;text=(statusNames[effect.status_id]??effect.status_id)+(typeof ratio==='number'?' '+percent(ratio):'')+' · '+number(Number(effect.duration_ms)/1000)+'s';}
  else if(effect.type==='interrupt')text='ขัดการร่ายของเป้าหมาย';
  else if(effect.type==='revive')text='ชุบชีวิตเพื่อน';
  else if(effect.type==='remove_status')text='ล้างสถานะจากเป้าหมาย';
  else if(effect.type==='resource_change')text='เปลี่ยนทรัพยากรระหว่างต่อสู้';
  else if(effect.type==='summon')text='เรียกผู้ช่วยลงสนาม';
  else if(effect.type==='handler'&&effect.handler_id==='detonate_own_status')text=`ระเบิด${statusNames[String(effect.params.status_id)]??effect.params.status_id}ของตัวเอง ${number(effect.params.power_per_instance)} ต่อชั้น`;
  else text='กลไกเฉพาะอาชีพ';
  return text+('when'in effect&&effect.when?' เมื่อเข้าเงื่อนไข':'');
 });
}
export interface SkillOption {targetNote:string;id:string;name:string;kind:'active'|'passive';unlock:number;level:number;cap:number;max:number;locked:boolean;definition:SkillDefinition;next:SkillDefinition|null;price:Partial<AccountState['wallet']>|null;effects:string[];nextEffects:string[];castMs:number;afterCastMs:number;sp:number;nextCastMs:number|null;nextAfterCastMs:number|null;nextSp:number|null}
/** Shared permanent build, including equipped sources when account is provided. */
export function characterSkillOptions(actor:Character,state?:AccountState):{skills:SkillOption[];intervalMs:number}{
 const compiled=compileCharacterSkills(actor,content),stats=previewCharacterStats(actor,compiled.resolved_skills,content,state?equippedSources(actor,state,content):[]);
 const skills=Object.values(content.skills).filter(row=>allowedSkill(actor,row as unknown as SkillDefinition)).map(row=>{
  const source=row as unknown as SkillDefinition,level=actor.skill_levels[source.id]??0,cap=characterSkillCap(actor,source),locked=actor.level<source.unlock_level,target=level+1;
  const definition=structuredClone(resolveSkill(source.id,Math.max(1,level),content).definition)as SkillDefinition;
  let price:SkillOption['price']=null;if(!locked&&target<=cap)price=skillQuote(actor,source.id,target,content);
  const next=price?structuredClone(resolveSkill(source.id,target,content).definition)as SkillDefinition:null;
  const targetNote=definition.kind==='passive'?'ทำงานอัตโนมัติ':[...new Set([...definition.start_effects,...definition.effects].map(e=>e.target))].map(binding=>{if(binding==='self')return 'ตัวเอง';const selector=definition.selectors[binding];if(!selector)return 'ตามเป้าหมายสกิล';return (selector.team==='allies'?'ฝ่ายเรา':selector.team==='enemies'?'ศัตรู':'ตัวเอง')+(selector.select==='all'?' · ทั้งหมด':' · เป้าหมายเดียว');}).filter((s,i,a)=>a.indexOf(s)===i).join(' / ');
  return{targetNote,id:source.id,name:labels[source.name_key]??source.id,kind:source.kind,unlock:source.unlock_level,level,cap,max:source.max_level,locked,definition,next,price,effects:summaries(definition),nextEffects:next?summaries(next):[],castMs:definition.kind==='active'?castDurationMs(Number(definition.timing.cast_ms),stats.cast_speed):0,afterCastMs:definition.kind==='active'?castDurationMs(Number(definition.timing.after_cast_ms),stats.cast_speed):0,sp:definition.kind==='active'?Number(definition.cost.sp):0,nextCastMs:next?.kind==='active'?castDurationMs(Number(next.timing.cast_ms),stats.cast_speed):null,nextAfterCastMs:next?.kind==='active'?castDurationMs(Number(next.timing.after_cast_ms),stats.cast_speed):null,nextSp:next?.kind==='active'?Number(next.cost.sp):null};
 });
 // User-approved demo pacing remains explicit, separate from legacy abstract benchmarks.
 return{skills,intervalMs:skillIntervalMs(stats.attack_speed,3000)};
}
type Slots=Character['active_slots'];
/** Skill-first equip (21 Oct 2026): put `id` in `slot`; if it was already equipped it swaps with the occupant, otherwise it replaces it. */
export function placeSkill(slots:Slots,id:string,slot:number):Slots{const next=structuredClone(slots),from=next.indexOf(id);if(from>=0)next[from]=next[slot]??null;next[slot]=id;return next;}
export function removeSkill(slots:Slots,id:string):Slots{return slots.map(s=>s===id?null:s) as Slots;}
