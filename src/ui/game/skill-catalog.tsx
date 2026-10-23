import { useEffect,useMemo,useState } from 'react';
import { catalogSkillInformation,skillCatalogJobs,skillDefinitionsForJob,skillCatalogName } from '../../client/skill-catalog.ts';
import type { AssetPack } from '../../renderer/pack.ts';
import { ClassIcon } from './class-icon.tsx';
import { Sheet,jobNames } from './kit.tsx';
import { SkillIcon } from '../skill-icon.tsx';
import { SkillInformationBody } from '../skill-information.tsx';

export function SkillCatalogSheet({pack,initialJob,onClose}:{pack:AssetPack|null;initialJob:string;onClose:()=>void}){
 const [job,setJob]=useState(()=>skillCatalogJobs.some(j=>j.id===initialJob)?initialJob:skillCatalogJobs[0]!.id),[rank,setRank]=useState(1),[search,setSearch]=useState('');
 const definitions=useMemo(()=>skillDefinitionsForJob(job),[job]);
 const rows=useMemo(()=>definitions.map(s=>catalogSkillInformation(s.id,rank)!),[definitions,rank]);
 const found=useMemo(()=>rows.filter(s=>s.name.toLowerCase().includes(search.trim().toLowerCase())),[rows,search]);
 const max=Math.max(1,...definitions.map(s=>s.max_level));
 useEffect(()=>{if(pack)void pack.prepareIcons(definitions.map(s=>s.id));},[pack,definitions]);
 return <Sheet title="สมุดสกิล" onClose={onClose} className="tall skill-catalog-sheet">
  <div className="skill-catalog-controls"><ClassIcon pack={pack} job={job} size={26}/><select aria-label="อาชีพในสมุดสกิล" value={job} onChange={e=>{setJob(e.target.value);setSearch('');}}>{skillCatalogJobs.filter(j=>j.id===j.root).map(root=><optgroup key={root.id} label={jobNames[root.id]}>{skillCatalogJobs.filter(j=>j.root===root.id).map(j=><option key={j.id} value={j.id}>{jobNames[j.id]??j.id}</option>)}</optgroup>)}</select><label>Lv.<select aria-label="เลเวลในสมุดสกิล" value={rank} onChange={e=>setRank(Number(e.target.value))}>{Array.from({length:max},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}</select></label></div>
  <input className="skill-catalog-search" type="search" aria-label="ค้นหาสกิล" placeholder="ชื่อสกิล" value={search} onChange={e=>setSearch(e.target.value)}/>
  <div className="skill-catalog-list" aria-label={`สกิล ${jobNames[job]}`} key={job}>
   {found.map(info=><details className="skill-catalog-row" key={`${info.definition.id}:${rank}`} data-skill={info.definition.id} data-level={info.level}>
    <summary><SkillIcon id={info.definition.id} pack={pack}/><span><strong>{skillCatalogName(info.definition.id)}</strong><small>{jobNames[info.definition.class_id]} · {info.definition.kind==='active'?'Active':'Passive'}</small><span className="skill-catalog-preview">{info.effects.filter(text=>!text.startsWith('ใช้ SP')).join(' · ')}</span></span><svg className="skill-catalog-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
    <SkillInformationBody info={info} pack={pack}/>
   </details>)}
   {!found.length&&<p className="skill-catalog-empty">ไม่พบสกิล</p>}
  </div>
 </Sheet>;
}
