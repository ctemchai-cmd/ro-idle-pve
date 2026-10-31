import {useState} from 'react';
import {artifactView,artifactCatalog} from '../../client/artifacts.ts';
import {VirtualGrid} from './virtual-grid.tsx';
import {ArtifactGlyph,ArtifactDetailSheet} from './artifact-shared.tsx';
import type {GameContext} from './shell.tsx';
import {PageHeader,ResIcon,friendNames,jobNames,iconUrl,full} from './kit.tsx';
import './artifacts.css';

export function ArtifactPage({context}:{context:GameContext}){
 const{state,pack,go}=context,actor=state.roster.find(a=>a.character_id===context.characterId)??state.roster[0]!,stock=state.artifacts,rules=artifactCatalog();
 const[selected,setSelected]=useState<string|null>(null),[slot,setSlot]=useState<0|1>(0),[filter,setFilter]=useState('fit');
 const owned=stock?.items??[],order=new Map(rules.definitions.map((d,i)=>[d.id,i])),list=owned.filter(i=>filter==='all'||artifactView(i,state).fits(actor.character_id)).sort((a,b)=>(order.get(a.definition_id)??0)-(order.get(b.definition_id)??0));
 const unlocked=rules.definitions.some(d=>d.class_id===actor.job_id&&d.rarity_id==='legendary');
 return <div className="page artifact-page"><PageHeader title="Artifact" sub={`${friendNames[actor.character_id]} · ${jobNames[actor.job_id]}`} onBack={()=>go('buddy',actor.character_id)}/>
  <div className="artifact-overview"><select aria-label="ตัวละคร Artifact" value={actor.character_id} onChange={e=>context.selectCharacter(e.target.value)}>{state.roster.map(a=><option key={a.character_id} value={a.character_id}>{friendNames[a.character_id]} · {jobNames[a.job_id]}</option>)}</select><span><ResIcon pack={pack} k="artifact_essence"/>{full(stock?.essence??0)}</span></div>
  <div className="artifact-slots">{([0,1]as const).map(n=>{const item=owned.find(i=>i.instance_id===stock?.slots[actor.character_id]?.[n]);return <button key={n} className={`artifact-slot ${slot===n?'on':''}`} aria-pressed={slot===n} onClick={()=>{setSlot(n);if(item)setSelected(item.instance_id);}}>{item?<ArtifactGlyph item={item} context={context}/>:<span className="artifact-empty"><img src={iconUrl(pack,'feature_icons','artifact')??undefined} alt=""/></span>}<small>ช่อง {n+1}</small></button>;})}</div>
  {!unlocked&&<p className="hint">เปิดเมื่อเลื่อน Hi-class</p>}
  <div className="artifact-filter"><h3>คลัง {owned.length}/{rules.capacity}</h3><select aria-label="กรอง Artifact" value={filter} onChange={e=>setFilter(e.target.value)}><option value="fit">อาชีพนี้ใส่ได้</option><option value="all">ทั้งหมด</option></select></div>
  {list.length?<VirtualGrid items={list} renderItem={item=><button className="bag-cell artifact-cell" key={item.instance_id} aria-label={`${artifactView(item,state).name} Lv.${item.level}`} onClick={()=>setSelected(item.instance_id)}><ArtifactGlyph item={item} context={context}/>{artifactView(item,state).owner&&<em>ใส่อยู่</em>}</button>}/>:<div className="artifact-empty-inventory"><img src={iconUrl(pack,'feature_icons','artifact')??undefined} alt=""/><p>{filter==='fit'?'ยังไม่มี Artifact สำหรับอาชีพนี้':'ยังไม่มี Artifact'}</p></div>}
  <button className="btn artifact-store-link" onClick={()=>go('artifact_draw',actor.character_id)}><ResIcon pack={pack} k="artifact_ticket"/>สุ่ม Artifact ในร้านค้า</button>
  {selected&&<ArtifactDetailSheet key={selected} context={context} instanceId={selected} slot={slot} onClose={()=>setSelected(null)}/>}
 </div>;
}
