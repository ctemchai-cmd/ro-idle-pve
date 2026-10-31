import {useRef,useState} from 'react';
import './artifacts.css';
import {artifactView,artifactCatalog,artifactDetails,type ArtifactItem} from '../../client/artifacts.ts';
import {SkillIcon} from '../skill-icon.tsx';
import {Icon} from '../icon.tsx';
import {ClassIcon} from './class-icon.tsx';
import type {GameContext} from './shell.tsx';
import {Sheet,full,friendNames,iconUrl} from './kit.tsx';

export const artifactRarityNames:Record<string,string>={common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic',legendary:'Legendary'};
export function ArtifactGlyph({item,context}:{item:ArtifactItem;context:GameContext}){
 const v=artifactView(item,context.state);
 return <span className={`artifact-art rarity-${v.definition.rarity_id}`}><SkillIcon id={v.definition.skill_id} pack={context.pack}/><small>Lv.{item.level}</small>{item.stars>0&&<b aria-label={`${item.stars} ดาว`}><Icon name="sparkles"/>{item.stars}</b>}</span>;
}
export function ArtifactEquipmentSlot({context,slot,onInspect}:{context:GameContext;slot:0|1;onInspect:(id:string,slot:0|1)=>void}){
 const actor=context.state.roster.find(a=>a.character_id===context.characterId)!,id=context.state.artifacts?.slots[actor.character_id]?.[slot],item=context.state.artifacts?.items.find(i=>i.instance_id===id),enabled=artifactCatalog().definitions.some(d=>d.class_id===actor.job_id&&d.rarity_id==='legendary');
 return <button className={`gear-tile buddy-artifact-slot ${item?'rarity-'+artifactView(item,context.state).definition.rarity_id:'rarity-none'}`} data-artifact-slot={slot} aria-label={`Artifact ช่อง ${slot+1}${item?' · '+artifactView(item,context.state).name:''}`} onClick={()=>item?onInspect(item.instance_id,slot):context.go('artifacts',actor.character_id)}>
  {item&&<ArtifactGlyph item={item} context={context}/>}
  {!item&&<span className="artifact-empty-symbol"><img src={iconUrl(context.pack,'feature_icons','artifact')??undefined} alt=""/>{!enabled&&<Icon name="lock"/>}</span>}<span className="artifact-slot-label">Artifact {slot+1}</span>
 </button>;
}
/** The same item sheet opens from a character equipment slot and the full inventory. */
export function ArtifactDetailSheet({context,instanceId,slot,onClose}:{context:GameContext;instanceId:string;slot:0|1;onClose:()=>void}){
 const{state,pack,submit,locked}=context,stock=state.artifacts,owned=stock?.items??[],item=owned.find(i=>i.instance_id===instanceId),actor=state.roster.find(a=>a.character_id===context.characterId)!;
 const[confirm,setConfirm]=useState<'salvage'|'star'|null>(null),[working,setWorking]=useState(false),gate=useRef(false);
 if(!item)return null;const view=artifactView(item,state),donors=owned.filter(i=>i.instance_id!==item.instance_id&&i.definition_id===item.definition_id&&!i.locked&&i.stars===0&&!artifactView(i,state).owner).slice(0,view.copies);
 const disabled=locked||working;
 async function act(type:Parameters<typeof submit>[0],params:unknown){if(gate.current||locked)return false;gate.current=true;setWorking(true);try{return await submit(type,params);}catch{context.toast('ทำรายการ Artifact ไม่สำเร็จ');return false;}finally{gate.current=false;setWorking(false);}}
 return <Sheet title="Artifact" onClose={onClose} className="artifact-sheet"><div className="artifact-identity"><ArtifactGlyph item={item} context={context}/><span><b>{view.name}</b><small className={`rarity-${view.definition.rarity_id}`}>{artifactRarityNames[view.definition.rarity_id]} · Lv.{item.level} · {item.stars} ดาว</small><strong>พลังสกิล +{(view.bonus*100).toLocaleString('th-TH',{maximumFractionDigits:1})}%</strong>{view.owner&&<small><ClassIcon job={state.roster.find(a=>a.character_id===view.owner)!.job_id} pack={pack} size={20}/> {friendNames[view.owner]} · สวมอยู่</small>}</span></div>
  <details className="artifact-skill-details"><summary>รายละเอียดสกิลเมื่อเสริม</summary><ul className="artifact-description">{artifactDetails(item,state).effects.map((text,i)=><li key={i}>{text}</li>)}</ul></details>
  <div className="artifact-actions"><button className="btn primary" disabled={disabled||!view.fits(actor.character_id)} onClick={()=>void act('artifact.equip',{character_id:actor.character_id,slot,instance_id:item.instance_id})}>สวมช่อง {slot+1}</button>{view.owner&&<button className="btn" disabled={disabled} onClick={()=>{const index=stock!.slots[view.owner!]!.indexOf(item.instance_id);void act('artifact.equip',{character_id:view.owner,slot:index,instance_id:null});}}>ถอด</button>}
   <button className="btn" disabled={disabled} onClick={()=>void act('artifact.lock',{instance_id:item.instance_id,locked:!item.locked})}>{item.locked?'ปลดล็อก':'ล็อก'}</button>
   {view.next&&<button className="btn" disabled={disabled||state.wallet.gold<view.next.gold||(stock?.essence??0)<view.next.essence} onClick={()=>void act('artifact.upgrade',{instance_id:item.instance_id,target_level:item.level+1})}>Lv.{item.level+1} · {full(view.next.gold)} ทอง + {view.next.essence} Essence</button>}
   {item.stars<5&&<button className="btn" disabled={disabled||donors.length<view.copies} onClick={()=>setConfirm('star')}>เพิ่มดาว · ชิ้นซ้ำ {donors.length}/{view.copies}</button>}
   <button className="btn danger" disabled={disabled||item.locked||!!view.owner} onClick={()=>setConfirm('salvage')}>ย่อย</button></div>
  {confirm&&<section className="artifact-confirm" role="alertdialog" aria-label="ยืนยัน Artifact"><b>{confirm==='star'?`ใช้ชิ้นซ้ำ ${view.copies} ชิ้น เพิ่มเป็น ${item.stars+1} ดาว`:`ย่อย ${view.name} Lv.${item.level}?`}</b><small>คืนทุนเลเวลของชิ้นที่ใช้ตามจำนวนที่จ่ายจริง</small><div className="row two"><button className="btn" disabled={working} onClick={()=>setConfirm(null)}>ยกเลิก</button><button className="btn primary" disabled={disabled} onClick={()=>void(async()=>{const ok=confirm==='star'?await act('artifact.star',{instance_id:item.instance_id,donor_ids:donors.map(d=>d.instance_id)}):await act('artifact.salvage',{instance_ids:[item.instance_id]});if(ok){setConfirm(null);if(confirm==='salvage')onClose();}})()}>ยืนยัน</button></div></section>}
 </Sheet>;
}
