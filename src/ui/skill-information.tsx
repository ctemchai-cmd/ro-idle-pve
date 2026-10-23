import { useEffect,useRef } from 'react';
import { createPortal } from 'react-dom';
import type { SkillInformation } from '../client/skill-catalog.ts';
import type { AssetPack } from '../renderer/pack.ts';
import { SkillElements } from './element-badge.tsx';
import { SkillIcon } from './skill-icon.tsx';
import { Icon } from './icon.tsx';

export function SkillInformationBody({info,pack}:{info:SkillInformation;pack:AssetPack|null}){
 const active=info.definition.kind==='active'?info.definition:null;
 return <div className="skill-information" data-skill={info.definition.id} data-level={info.level}>
  <p className="skill-information-kind">{info.definition.tags.includes('awakened')?'Awaken · ':''}{active?'Active':'Passive'} · {info.targetNote}</p>
  <SkillElements definition={info.definition} pack={pack}/>
  {active&&<p className="skill-information-timing"><span>SP พื้นฐาน <b>{typeof active.cost.sp==='number'?active.cost.sp:'ทั้งหมด'}</b></span><span>ร่ายพื้นฐาน <b>{Number(active.timing.cast_ms)/1000}s</b></span><span>ACD พื้นฐาน <b>{Number(active.timing.after_cast_ms)/1000}s</b></span></p>}
  <ul className="skill-information-effects">{info.effects.map((effect,i)=><li key={i}>{effect}</li>)}</ul>
  {!!info.notes.length&&<details className="skill-information-notes"><summary>เงื่อนไข</summary>{info.notes.map((note,i)=><p key={i}>{note}</p>)}</details>}
 </div>;
}
/** A portal isolates the nested modal's Escape/backdrop from its Timeline parent. */
export function SkillInformationDialog({info,pack,context,name,onClose}:{info:SkillInformation|null;pack:AssetPack;context?:string;name:string;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const node=ref.current!,opener=document.activeElement;node.showModal();return()=>{if(node.open)node.close();if(opener instanceof HTMLElement&&opener.isConnected)opener.focus({preventScroll:true});};},[]);
 return createPortal(<dialog ref={ref} className="skill-information-dialog" aria-label={`รายละเอียดสกิล · ${name}`} onCancel={e=>{e.preventDefault();e.stopPropagation();onClose();}} onClick={e=>{if(e.target===e.currentTarget){e.stopPropagation();onClose();}}}>
  <header><SkillIcon id={info?.definition.id??''} pack={pack} awakened={info?.definition.tags.includes('awakened')}/><div><h2>{name}</h2>{info&&<small>Lv.{info.level}</small>}</div><button type="button" autoFocus aria-label="ปิดรายละเอียดสกิล" onClick={onClose}><Icon name="close"/></button></header>
  <div className="skill-information-dialog-body">{context&&<p className="skill-information-context">{context}</p>}{info?<SkillInformationBody info={info} pack={pack}/>:<p>ไม่มีรายละเอียดสกิลในบันทึกไฟต์นี้</p>}</div>
 </dialog>,document.body);
}
