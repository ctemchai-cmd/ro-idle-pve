import {useEffect,useState} from 'react';
import type {AuthController} from '../../client/auth-controller.ts';
import {readSaveSlots,type SaveSlots,type SaveSelection} from '../../client/save-slots.ts';
import {AssetPack} from '../../renderer/pack.ts';
import {ClassIcon} from './class-icon.tsx';
import {Icon} from '../icon.tsx';
import {jobNames} from './kit.tsx';
export function SaveSlotChooser({auth,select}:{auth:AuthController;select:(selection:SaveSelection)=>void}){
 const [data,setData]=useState<SaveSlots|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0),[pack,setPack]=useState<AssetPack|null>(null);
 useEffect(()=>{let live=true,opened:AssetPack|null=null;void AssetPack.open().then(p=>{if(!live){p.dispose();return;}opened=p;setPack(p);}).catch(()=>{});return()=>{live=false;opened?.dispose();};},[]);
 useEffect(()=>{const request=new AbortController();let live=true;setError(false);setData(null);const timer=setTimeout(()=>request.abort(),15000);void readSaveSlots(auth,request.signal).then(d=>{if(live)setData(d);}).catch(()=>{if(live)setError(true);}).finally(()=>clearTimeout(timer));return()=>{live=false;clearTimeout(timer);request.abort();};},[auth,retry]);
 return <div className="game-root"><div className="game-frame"><main className="save-slots-page">
  <header className="save-slots-heading"><div><span className="save-slots-brand">RO Idle</span><h1>เลือกเซฟ</h1></div><a className="icon-btn" href="/auth" aria-label="บัญชี"><Icon name="account"/></a></header>
  {error?<div className="save-slots-message" role="alert"><p>โหลดรายการเซฟไม่สำเร็จ</p><button className="btn primary" onClick={()=>setRetry(n=>n+1)}>ลองอีกครั้ง</button></div>:!data?<p className="save-slots-message" role="status">กำลังโหลดเซฟ…</p>:<>
   {!data.enabled&&<p className="hint">หลายเซฟยังไม่เปิดใช้งานบนเซิร์ฟเวอร์นี้ เล่นเซฟเดิมต่อได้ <button className="btn small ghost" onClick={()=>setRetry(n=>n+1)}>โหลดรายการอีกครั้ง</button></p>}
   <div className="save-slot-list">{data.slots.map(s=><button key={s.slot} className={`save-slot-card ${s.initialized?'occupied':'empty'}`} aria-label={`เลือกเซฟ ${s.slot}${s.initialized?'':' · เริ่มใหม่'}`} onClick={()=>select({slot:s.slot,save_id:s.save_id})}>
    <span className="save-slot-number">เซฟ {s.slot}</span>
    {s.initialized===true?<><span className="save-slot-job">{s.job_id&&jobNames[s.job_id]?<ClassIcon job={s.job_id} pack={pack} size={38}/>:<Icon name="save"/>}<b>{s.job_id?jobNames[s.job_id]??'ตัวละคร':'ตัวละคร'}</b></span><strong className="save-slot-level">Lv.{Number.isSafeInteger(s.level)?s.level:'—'}</strong><small>ผ่าน {s.cleared_stages} ด่าน</small>{s.updated_at&&<time dateTime={s.updated_at}>{new Date(s.updated_at).toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</time>}</>:s.initialized===null?<><Icon name="save"/><b>เล่นเซฟเดิม</b></>:<><span className="save-slot-plus" aria-hidden="true">+</span><b>สร้างตัวละครใหม่</b></>}
   </button>)}</div>
  </>}
 </main></div></div>;
}
