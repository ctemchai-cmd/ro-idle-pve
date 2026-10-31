import {useRef,useState} from 'react';
import {artifactView,artifactCatalog,artifactDrawOptions} from '../../client/artifacts.ts';
import {SkillIcon} from '../skill-icon.tsx';
import {ClassIcon} from './class-icon.tsx';
import {ArtifactGlyph,ArtifactDetailSheet,artifactRarityNames} from './artifact-shared.tsx';
import type {GameContext} from './shell.tsx';
import {ResIcon,Sheet,full,jobNames,iconUrl} from './kit.tsx';
import './artifacts.css';

export function ArtifactSummon({context}:{context:GameContext}){
 const{state,pack,locked,submit}=context,actor=state.roster.find(a=>a.character_id===context.characterId)!,rules=artifactCatalog();
 const[selectedJob,setJob]=useState<string>(actor.job_id),[drawing,setDrawing]=useState(false),[revealed,setRevealed]=useState<string[]>([]),[showResults,setShowResults]=useState(false),[lastCount,setLastCount]=useState<1|10>(1),[selected,setSelected]=useState<string|null>(null),gate=useRef(false);
 const view=artifactDrawOptions(state,selectedJob),stock=state.artifacts,gold=view.pool.find(d=>d.rarity_id==='legendary'),previews=['rare','epic'].map(r=>view.pool.find(d=>d.rarity_id===r)).filter(d=>!!d),owned=stock?.items??[];
 async function draw(n:1|10){
  const latest=context.latest()??state,quote=artifactDrawOptions(latest,view.job);
  if(gate.current||locked||!quote.quote(n).allowed)return;
  gate.current=true;setDrawing(true);
  try{const before=new Set(latest.artifacts?.items.map(i=>i.instance_id));if(await submit('artifact.draw',{job_id:quote.job,count:n})){const current=context.latest()??state,created=context.lastCreated().filter(id=>current.artifacts?.items.some(i=>i.instance_id===id));setRevealed(created.length?created:current.artifacts?.items.filter(i=>!before.has(i.instance_id)).map(i=>i.instance_id)??[]);setLastCount(n);setShowResults(true);}}
  catch{context.toast('สุ่ม Artifact ไม่สำเร็จ ลองเชื่อมต่อเซฟอีกครั้ง');}
  finally{gate.current=false;setDrawing(false);}
 }
 const price=(n:1|10)=>{const q=view.quote(n);return <span className="artifact-draw-price">{q.tickets>0&&<span><ResIcon pack={pack} k="artifact_ticket"/>{full(q.tickets)}</span>}{q.crystal>0&&<span><ResIcon pack={pack} k="crystal"/>{full(q.crystal)}</span>}</span>;};
 return <section className="artifact-summon" aria-label="สุ่ม Artifact"><header className="artifact-summon-header"><span>ARTIFACT SUMMON</span><div><h2>พลังแห่งอาชีพ</h2><span className="artifact-ticket-stock"><ResIcon pack={pack} k="artifact_ticket"/>{full(stock?.tickets??0)}</span></div></header>
  <div className="artifact-summon-stage" data-drawing={drawing}><span className="artifact-summon-halo" aria-hidden="true"/><div className="artifact-summon-orbit">{previews.map((d,i)=><span key={d!.id} className={`artifact-preview rarity-${d!.rarity_id} side-${i}`}><SkillIcon id={d!.skill_id} pack={pack}/></span>)}<span className="artifact-preview featured rarity-legendary">{gold?<SkillIcon id={gold.skill_id} pack={pack}/>:<img src={iconUrl(pack,'feature_icons','artifact')??undefined} alt=""/>}</span></div><strong>{gold?`เสริม ${gold.name}`:'Artifact ประจำอาชีพ'}</strong><small>{view.job?jobNames[view.job]:'เปิดเมื่อเลื่อน Hi-class'}</small></div>
  <div className="artifact-draw-class"><ClassIcon job={view.job||actor.job_id} pack={pack} size={30}/><label>เลือกสายอาชีพ<select aria-label="สาย Artifact" value={view.job} onChange={e=>setJob(e.target.value)} disabled={drawing||!view.jobs.length}>{view.jobs.length?view.jobs.map(id=><option key={id} value={id}>{jobNames[id]}</option>):<option value="">ยังไม่มี Hi-class</option>}</select></label></div>
  <div className="artifact-pity"><span>การันตี <b>Legendary</b></span><strong>อีก {view.pity} ครั้ง</strong><progress max={rules.legendary_pity} value={rules.legendary_pity-view.pity}/></div>
  <div className="artifact-summon-actions">{([1,10]as const).map(n=><button key={n} className={`btn ${n===10?'primary':''}`} disabled={locked||drawing||!view.quote(n).allowed} onClick={()=>void draw(n)}><b>{drawing?'กำลังอัญเชิญ…':`สุ่ม ${n}`}</b>{price(n)}</button>)}</div>
  <details className="artifact-odds"><summary>โอกาสพื้นฐาน / Artifact ในสายนี้</summary><div className="artifact-rarity-odds">{view.odds.map(o=><span key={o.id} className={`rarity-${o.id}`}><i/>{artifactRarityNames[o.id]}<b>{o.percent}%</b></span>)}</div><div className="artifact-pool">{view.pool.map(d=><span key={d.id} className={`rarity-${d.rarity_id}`}><SkillIcon id={d.skill_id} pack={pack}/><small>{d.name}</small></span>)}</div></details>
  <small className="artifact-capacity">คลัง {owned.length}/{rules.capacity}</small>
  {showResults&&revealed.length>0&&<Sheet title={`ได้รับ Artifact ${revealed.length} ชิ้น`} className="artifact-reveal-sheet" onClose={()=>setShowResults(false)}><div className="artifact-reveal-grid">{revealed.map(id=>{const item=owned.find(i=>i.instance_id===id);if(!item)return null;const v=artifactView(item,state);return <button key={id} className={`artifact-reveal-card rarity-${v.definition.rarity_id}`} onClick={()=>setSelected(id)} aria-label={`รายละเอียด ${v.name}`}><ArtifactGlyph item={item} context={context}/><b>{v.name}</b><small>{artifactRarityNames[v.definition.rarity_id]}</small></button>;})}</div><footer className="artifact-result-actions"><button className="btn" onClick={()=>setShowResults(false)}>เสร็จสิ้น</button><button className="btn primary" disabled={locked||drawing||!view.quote(lastCount).allowed} onClick={()=>void draw(lastCount)}><b>{drawing?'กำลังอัญเชิญ…':`สุ่มอีก ${lastCount}`}</b>{price(lastCount)}</button></footer></Sheet>}
  {selected&&<ArtifactDetailSheet key={selected} context={context} instanceId={selected} slot={0} onClose={()=>setSelected(null)}/>}
 </section>;
}
