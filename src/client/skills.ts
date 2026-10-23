import { heldResourceModifiers } from '../domain/combat/resources.ts';
import { statNames, statusNames } from './status-labels.ts';
import { loadValidatedContent } from './content.ts';
import type { AccountState, BattleActor, Effect, SkillDefinition } from '../contracts/index.ts';
import { allowedSkill, characterSkillCap, compileCharacterSkills, skillQuote } from '../domain/progression/skills.ts';
import { resolveSkill } from '../domain/build/resolve-skill.ts';
import { equippedSources } from '../domain/build/equipment.ts';
import { previewCharacterStats } from '../domain/build/character.ts';
import { castDurationMs, skillIntervalMs } from '../domain/math/index.ts';
import { fixedSpCost } from '../domain/math/combat-modifiers.ts';
import { effectDamageElements, elementName } from './elements.ts';
const loaded=loadValidatedContent();if(!loaded.ok)throw new Error('CONTENT_UNAVAILABLE');const content=loaded.value;
type Character=AccountState['roster'][number];
const labels=content.documents['strings.th.json']!.strings as unknown as Record<string,string>;
const statUnits=Object.fromEntries((content.documents['stat-definitions.json']!.stats as unknown as {id:string;unit:string}[]).map(s=>[s.id,s.unit]));
const number=(n:unknown)=>Number(n).toLocaleString('th-TH',{maximumFractionDigits:2}),percent=(n:unknown)=>number(Number(n)*100)+'%';
function summaries(definition:SkillDefinition,level:number,learnedSkills?:BattleActor['resolved_skills']):string[]{
 const skills={...learnedSkills,[definition.id]:{level,definition}};
 if(definition.kind==='passive')return [...definition.modifiers.map(m=>`${statNames[m.stat]??m.stat} ${Number(m.value)>=0?'+':''}${m.op==='add_percent'||statUnits[m.stat]==='ratio'?percent(m.value):number(m.value)}${m.when?' เมื่อเข้าเงื่อนไข':''}`),...definition.triggers.flatMap(trigger=>effectDescriptions(trigger.effects,skills,true).map(text=>(trigger.event==='normal_attack_hit'?'ตีปกติโดน':trigger.event==='damage_received'?'รับดาเมจ':'เมื่อเข้าเงื่อนไข')+` · โอกาส ${percent(trigger.chance)} · `+text))];
 return [...(typeof definition.cost.sp==='object'&&'mode' in definition.cost.sp?[`ใช้ SP ทั้งหมด (ขั้นต่ำ ${number(definition.cost.sp.minimum_sp)})`]:[]),...(Number(definition.cost.spirit_spheres)>0?[`ใช้บอล ${number(definition.cost.spirit_spheres)} ลูกเมื่อเริ่มร่าย`]:[]),...effectDescriptions(definition.start_effects,skills,true).map(text=>'เริ่มร่าย · '+text),...effectDescriptions(definition.effects,skills,true)];
}
function skillNotes(definition:SkillDefinition):string[]{
 const effects=definition.kind==='active'?[...definition.start_effects,...definition.effects]:definition.triggers.flatMap(t=>t.effects),notes:string[]=[];
 if(effects.some(e=>e.type==='resource_change'&&e.resource==='spirit_spheres'))notes.push('ถือบอลได้สูงสุด 5 ลูก · โบนัส ATK คิดจากลูกที่เหลือหลังใช้สกิล');
 if(definition.kind==='active'&&Number(definition.cost.spirit_spheres)>0)notes.push('หัก SP/บอลเมื่อเริ่มร่าย · ถูกขัดไม่คืน');
 if(effects.some(e=>e.type==='apply_status'&&e.status_id==='provoke'))notes.push('ดึงตีปกติและสกิลเดี่ยวเข้าผู้ยั่วยุที่ยังมีชีวิต · ไม่รวมท่าหมู่/สุ่มเป้า');
 if(effects.some(e=>e.type==='apply_status'&&typeof content.statuses[e.status_id]?.weapon_element==='string'))notes.push('ธาตุอาวุธมีผลกับตีปกติ/สกิลตามอาวุธ · ไม่เปลี่ยนสกิลธาตุตายตัวหรือเกราะ');
 return notes;
}
/** Read-only catalog view; rank resolution and all effect text share the game's implementation. */
export function previewSkillDetails(id:string,rank:number){
 const definition=resolveSkill(id,rank,content).definition as SkillDefinition;
 return {definition,effects:summaries(definition,rank),notes:skillNotes(definition)};
}
/** Shared effect text for authored skills and card procs; no second formula authority. */
export function effectDescriptions(effects: readonly Effect[], resolved_skills?: BattleActor['resolved_skills'], compact=false): string[] {
 return effects.map(effect=>{
  let text='';
  if('formula'in effect){const f=effect.formula;
   if(f.id==='physical_power'||f.id==='magical_power'||f.id==='healing_power')text=`${effect.type==='heal'?'ฟื้น HP':effect.type==='shield'?'สร้างโล่':f.id==='physical_power'?'กายภาพ':'เวท'} ${percent(f.params.attack_ratio)} ${f.id==='physical_power'?effect.type==='heal'?'P.ATK':'ATK':'MATK'}${Number(f.params.flat_power)?' + '+number(f.params.flat_power):''}`;
   else if(f.id==='event_damage_power')text=`ดาเมจเพิ่มเติม ${percent(f.params.ratio)} ของดาเมจที่เกิดขึ้น`;
   else if(f.id==='flat_power')text=`${effect.type==='heal'?'ฟื้น HP':effect.type==='shield'?'โล่':'ดาเมจ'} ${number(f.params.amount)}`;
   else if(f.id==='sp_burst_power')text=`พลังโจมตี ${percent(f.params.attack_ratio)} ATK + ${percent(f.params.sp_ratio)} SP`;
   else text='ผลต่อเนื่องตามพลังของสกิล';
  }else if(effect.type==='apply_status'){const ratio=effect.params.ratio;text=(statusNames[effect.status_id]??effect.status_id)+(typeof ratio==='number'?' '+percent(ratio):'');
   const status=content.statuses[effect.status_id] as unknown as {periodic?:{interval_ms:number;effects:{type:string;formula?:{id:string}}[]}|null},tick=status?.periodic?.effects.find(e=>e.type==='heal'||e.type==='damage');
   if(tick&&typeof effect.params.power_ratio==='number')text+=` ${percent(effect.params.power_ratio)} ${tick.formula?.id==='physical_power'?'P.ATK':'MATK'} ทุก ${number(status.periodic!.interval_ms/1000)}s`;
   text+=' · '+number(Number(effect.duration_ms)/1000)+'s';
   if(Number(effect.chance)<1)text+=` · โอกาส ${percent(effect.chance)}`;
   if(effect.status_id==='provoke'&&!compact)text+=' · บังคับตีปกติและสกิลเลือกเป้าเดี่ยวให้หันมาหาผู้ยั่วยุที่ยังมีชีวิต; ท่าหมู่และสุ่มเป้าไม่ถูกบังคับ';}
  else if(effect.type==='interrupt')text='ขัดการร่ายของเป้าหมาย';
  else if(effect.type==='revive')text=`ชุบชีวิตเพื่อน · HP ${percent(effect.hp_ratio)} · SP ${percent(effect.sp_ratio)}`;
  else if(effect.type==='remove_status')text=`ล้าง${effect.polarity==='buff'?'บัฟ':effect.polarity==='debuff'?'ดีบัฟ':'สถานะ'}${effect.max_instances===null?'ทั้งหมด':'สูงสุด '+number(effect.max_instances)+' ชั้น'}${effect.tags.length?' · '+effect.tags.map(tag=>statusNames[tag]??tag).join(' / '):''}`;
  else if(effect.type==='resource_change'){
   const bonus=effect.resource==='spirit_spheres'?percent(heldResourceModifiers({sp:0,spirit_spheres:1,resolved_skills},content).filter(m=>m.stat==='physical_attack').reduce((n,m)=>n+Number(m.value),0)):'';
   text=effect.resource==='spirit_spheres'?(compact?`บอล ${Number(effect.amount)>=0?'+':''}${number(effect.amount)} ลูก · ATK +${bonus}/ลูก`:`เพิ่ม Spirit Sphere ${number(effect.amount)} ลูก (สูงสุด 5) · บอลที่ถือเพิ่ม ATK ${bonus} ต่อลูก · เมื่อใช้บอล โบนัสคิดจากลูกที่เหลือหลังหัก`):`SP ${Number(effect.amount)>=0?'+':''}${number(effect.amount)}`;
  }
  else if(effect.type==='summon'){
   const actors=content.documents['summon-actors.json']!.actors as unknown as {id:string;action:{interval_ms:number;effects:{type:string}[]}}[],helper=actors.find(a=>a.id===effect.actor_definition_id);
   const roles=helper?[...(helper.action.effects.some(e=>e.type==='damage')?['โจมตี']:[]),...(helper.action.effects.some(e=>e.type==='heal')?['ฮีล']:[])].join('+'):'';
   text=`ผู้ช่วย ${number(Number(effect.duration_ms)/1000)}s · สูงสุด ${effect.max_owned} ตัว`+(roles?` · ${roles}ทุก ${number(helper!.action.interval_ms/1000)}s`:'')+(typeof effect.power_scale==='number'?` · พลัง ${percent(effect.power_scale)}`:'');
  }
  else if(effect.type==='handler'&&effect.handler_id==='detonate_own_status')text=`ระเบิด${statusNames[String(effect.params.status_id)]??effect.params.status_id}ของตัวเอง ${typeof effect.params.attack_ratio_per_instance==='number'?[...(Number(effect.params.power_per_instance)?[number(effect.params.power_per_instance)]:[]),`${percent(effect.params.attack_ratio_per_instance)} ATK`].join(' + '):number(effect.params.power_per_instance)} ต่อชั้น`;
  else text='กลไกเฉพาะอาชีพ';
  if(effect.type==='damage'&&Number(effect.hits)>1)text+=` × ${number(effect.hits)} ครั้ง`;
  if(effect.type==='damage') {
   if(effect.critical_rule==='always')text+=' · คริเสมอ';
   if(effect.crit_chance_bonus)text+=` · คริ +${percent(effect.crit_chance_bonus)} เฉพาะท่า`;
   if(effect.crit_damage_bonus)text+=` · ดาเมจคริ +${percent(effect.crit_damage_bonus)} เฉพาะท่า`;
  }
  if(effect.type==='shield')text+=` · ${number(Number(effect.duration_ms)/1000)}s`;
  const elements=effectDamageElements([effect]);
  if(elements.length)text+=' · '+(effect.type==='damage'||effect.type==='handler'?'':'ดาเมจ')+elements.map(e=>e==='weapon'?elementName(e):'ธาตุ'+elementName(e)).join(' / ');
  if(effect.type==='apply_status'){const element=content.statuses[effect.status_id]?.weapon_element;if(typeof element==='string')text+=compact?' · อาวุธธาตุ'+elementName(element as Parameters<typeof elementName>[0]):' · เปลี่ยนธาตุอาวุธเป็น'+elementName(element as Parameters<typeof elementName>[0])+' มีผลกับตีปกติและสกิลตามธาตุอาวุธ; สกิลธาตุตายตัวและเกราะไม่เปลี่ยน';}
  return text+('when'in effect&&effect.when?(effect.when.type==='effect_succeeded'?' · เมื่อขัดร่ายสำเร็จ':effect.when.type==='hit_landed'?' · เมื่อโจมตีโดน':' เมื่อเข้าเงื่อนไข'):'');
 });
}
export interface SkillOption {targetNote:string;id:string;name:string;kind:'active'|'passive';unlock:number;level:number;cap:number;max:number;locked:boolean;previewSkills?:BattleActor['resolved_skills'];definition:SkillDefinition;next:SkillDefinition|null;price:Partial<AccountState['wallet']>|null;effects:string[];nextEffects:string[];notes?:string[];castMs:number;afterCastMs:number;sp:number;nextCastMs:number|null;nextAfterCastMs:number|null;nextSp:number|null;previewSpeed:number;previewSpPercent:number}
export interface SkillLevelRow {level:number;sp:number|null;castMs:number;afterCastMs:number;effects:string[];definition:SkillDefinition}
/** Resolve only the selected skill on demand; no command, simulation, or authored curve duplication. */
export function skillLevelComparison(skill:SkillOption):{rows:SkillLevelRow[];spOnly:boolean}{
 const rows=Array.from({length:skill.max},(_,i)=>{
  const definition=resolveSkill(skill.id,i+1,content).definition as SkillDefinition;
  return{level:i+1,definition,effects:summaries(definition,i+1,skill.previewSkills),sp:definition.kind==='active'&&typeof definition.cost.sp==='number'?fixedSpCost(definition.cost.sp,{sp_cost_percent:skill.previewSpPercent}):null,castMs:definition.kind==='active'?castDurationMs(Number(definition.timing.cast_ms),skill.previewSpeed):0,afterCastMs:definition.kind==='active'?castDurationMs(Number(definition.timing.after_cast_ms),skill.previewSpeed):0};
 });
 const withoutSp=(d:SkillDefinition)=>JSON.stringify(d.kind==='active'?{...d,cost:{...d.cost,sp:0}}:d);
 return{rows,spOnly:rows[0]?.definition.kind==='active'&&rows.every(r=>withoutSp(r.definition)===withoutSp(rows[0]!.definition))&&new Set(rows.map(r=>r.sp)).size>1};
}
export function skillUpgradeChanges(before:SkillLevelRow,after:SkillLevelRow):string[]{
 const changes:string[]=[];
 if(before.sp!==after.sp)changes.push(`SP ${before.sp===null?'ทั้งหมด':number(before.sp)} → ${after.sp===null?'ทั้งหมด':number(after.sp)}`);
 if(before.castMs!==after.castMs)changes.push(`ร่าย ${number(before.castMs/1000)}s → ${number(after.castMs/1000)}s`);
 if(before.afterCastMs!==after.afterCastMs)changes.push(`พัก ${number(before.afterCastMs/1000)}s → ${number(after.afterCastMs/1000)}s`);
 for(let i=0;i<Math.max(before.effects.length,after.effects.length);i++)if(before.effects[i]!==after.effects[i])changes.push(...effectChanges(before.effects[i],after.effects[i]));
 return changes;
}
/** Keep shared labels/units once, and omit unchanged clauses instead of repeating paragraphs. */
function effectChanges(before:string|undefined,after:string|undefined):string[]{
 if(!before||!after)return[after??`นำออก: ${before}`];
 const a=before.split(' · '),b=after.split(' · ');
 if(a.length!==b.length)return[`${before} → ${after}`];
 const numeric=/[+-]?\d[\d,]*(?:\.\d+)?/g;
 return b.flatMap((text,i)=>{
  if(text===a[i])return[];
  const old=a[i]!.match(numeric),next=text.match(numeric);
  if(!old||!next||old.length!==next.length||a[i]!.replace(numeric,'#')!==text.replace(numeric,'#'))return[`${a[i]} → ${text}`];
  let n=0;return[text.replace(numeric,value=>{const previous=old[n++];return value===previous?value:`${previous} → ${value}`;})];
 });
}
/** Shared permanent build, including equipped sources when account is provided. */
/** Icon prefetch needs only class membership, not a full stat/skill preview. */
export function characterSkillIconIds(actor:Character):string[]{
 return Object.values(content.skills).filter(row=>allowedSkill(actor,row as unknown as SkillDefinition)).map(row=>String(row.id));
}
export function characterSkillOptions(actor:Character,state?:AccountState):{skills:SkillOption[];intervalMs:number}{
 const compiled=compileCharacterSkills(actor,content),stats=previewCharacterStats(actor,compiled.resolved_skills,content,state?equippedSources(actor,state,content):[]);
 const skills=Object.values(content.skills).filter(row=>allowedSkill(actor,row as unknown as SkillDefinition)).map(row=>{
  const source=row as unknown as SkillDefinition,level=actor.skill_levels[source.id]??0,cap=characterSkillCap(actor,source),locked=actor.level<source.unlock_level,target=level+1;
  const definition=structuredClone(resolveSkill(source.id,Math.max(1,level),content).definition)as SkillDefinition;
  let price:SkillOption['price']=null;if(!locked&&target<=cap)price=skillQuote(actor,source.id,target,content);
  const next=price?structuredClone(resolveSkill(source.id,target,content).definition)as SkillDefinition:null;
  const targetNote=definition.kind==='passive'?'ทำงานอัตโนมัติ':[...new Set([...definition.start_effects,...definition.effects].map(e=>e.target))].map(binding=>{if(binding==='self')return 'ตัวเอง';const selector=definition.selectors[binding];if(!selector)return 'ตามเป้าหมายสกิล';return (selector.team==='allies'?'ฝ่ายเรา':selector.team==='enemies'?'ศัตรู':'ตัวเอง')+(selector.select==='all'?' · ทั้งหมด':' · เป้าหมายเดียว');}).filter((s,i,a)=>a.indexOf(s)===i).join(' / ');
  return{previewSkills:compiled.resolved_skills,previewSpeed:stats.cast_speed,previewSpPercent:stats.sp_cost_percent,targetNote,id:source.id,name:labels[source.name_key]??source.id,kind:source.kind,unlock:source.unlock_level,level,cap,max:source.max_level,locked,definition,next,price,notes:skillNotes(definition),effects:summaries(definition,Math.max(1,level),compiled.resolved_skills),nextEffects:next?summaries(next,target,compiled.resolved_skills):[],castMs:definition.kind==='active'?castDurationMs(Number(definition.timing.cast_ms),stats.cast_speed):0,afterCastMs:definition.kind==='active'?castDurationMs(Number(definition.timing.after_cast_ms),stats.cast_speed):0,sp:definition.kind==='active'?typeof definition.cost.sp==='number'?fixedSpCost(definition.cost.sp,stats):NaN:0,nextCastMs:next?.kind==='active'?castDurationMs(Number(next.timing.cast_ms),stats.cast_speed):null,nextAfterCastMs:next?.kind==='active'?castDurationMs(Number(next.timing.after_cast_ms),stats.cast_speed):null,nextSp:next?.kind==='active'?typeof next.cost.sp==='number'?fixedSpCost(next.cost.sp,stats):NaN:null};
 });
 // User-approved demo pacing remains explicit, separate from legacy abstract benchmarks.
 return{skills,intervalMs:skillIntervalMs(stats.attack_speed,3000)};
}
type Slots=Character['active_slots'];
/** Skill-first equip (21 Oct 2026): put `id` in `slot`; if it was already equipped it swaps with the occupant, otherwise it replaces it. */
export function placeSkill(slots:Slots,id:string,slot:number):Slots{const next=structuredClone(slots),from=next.indexOf(id);if(from>=0)next[from]=next[slot]??null;next[slot]=id;return next;}
export function removeSkill(slots:Slots,id:string):Slots{return slots.map(s=>s===id?null:s) as Slots;}
