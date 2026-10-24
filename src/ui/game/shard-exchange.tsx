import {useRef,useState} from 'react';
import {quoteShardConversion} from '../../client/skills.ts';
import type {GameContext} from './shell.tsx';
import {Sheet,CostChips,ResIcon,canPay,full} from './kit.tsx';

export function ShardExchangeSheet({context,onClose}:{context:GameContext;onClose:()=>void}){
 const {state,pack,submit,locked}=context;
 const [direction,setDirection]=useState<'base_to_awakened'|'awakened_to_base'>('base_to_awakened'),[quantity,setQuantity]=useState(1),[busy,setBusy]=useState(false),gate=useRef(false);
 const merging=direction==='base_to_awakened',valid=Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=1000000,quote=valid?quoteShardConversion(direction,quantity):null;
 const unit=quoteShardConversion(direction,1),costKey=merging?'skill_manual':'awakening_shard',gainKey=merging?'awakening_shard':'skill_manual';
 const max=Math.min(1000000,Math.floor(state.wallet[costKey]/(unit.cost[costKey]??1))),disabled=locked||busy;
 async function exchange(){
  if(gate.current||disabled||!quote||!canPay(state.wallet,quote.cost))return;
  gate.current=true;setBusy(true);
  try{await submit('skill.convert_shards',{direction,quantity});}catch{context.toast('แลกไม่สำเร็จ ลองใหม่อีกครั้ง');}finally{gate.current=false;setBusy(false);}
 }
 return <Sheet title="แลกเศษสกิล" className="shard-exchange-sheet" onClose={onClose}>
  <div className="shard-exchange">
   <div className="seg exchange-tabs" role="tablist" aria-label="รูปแบบการแลกเศษ">
    <button role="tab" aria-selected={merging} className={merging?'on':''} disabled={disabled} onClick={()=>{setDirection('base_to_awakened');setQuantity(1);}}>รวมเศษ</button>
    <button role="tab" aria-selected={!merging} className={!merging?'on':''} disabled={disabled} onClick={()=>{setDirection('awakened_to_base');setQuantity(1);}}>ย่อยเศษ Awaken</button>
   </div>
   <div className="exchange-route" aria-label="อัตราแลกเปลี่ยน">
    <div><ResIcon pack={pack} k={costKey}/><strong>{full(unit.cost[costKey]??0)}</strong><small>{merging?'Skill Book':'เศษ Awaken'}</small></div>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>
    <div><ResIcon pack={pack} k={gainKey}/><strong>{full(unit.gain[gainKey]??0)}</strong><small>{merging?'เศษ Awaken':'Skill Book'}</small></div>
   </div>
   <div className="exchange-quantity">
    <label htmlFor="shard-quantity">จำนวนเศษ Awaken<small>แลกได้สูงสุด {full(max)}</small></label>
    <div className="exchange-stepper"><button type="button" aria-label="ลดจำนวน" disabled={disabled||!valid||quantity<=1} onClick={()=>setQuantity(n=>n-1)}>−</button><input id="shard-quantity" aria-label="จำนวนเศษ Awaken" type="number" inputMode="numeric" min={1} max={Math.max(1,max)} value={Number.isNaN(quantity)?'':quantity} disabled={disabled} onChange={e=>setQuantity(e.target.valueAsNumber)}/><button type="button" aria-label="เพิ่มจำนวน" disabled={disabled||!valid||quantity>=max} onClick={()=>setQuantity(n=>n+1)}>+</button><button type="button" className="exchange-max" disabled={disabled||!max} onClick={()=>setQuantity(max)}>สูงสุด</button></div>
   </div>
   {quote?<div className="exchange-summary"><div><span>ใช้</span><CostChips cost={quote.cost} wallet={state.wallet} pack={pack}/></div><div><span>ได้รับ</span><strong><ResIcon pack={pack} k={gainKey}/>{full(quote.gain[gainKey]??0)}<small>{merging?'เศษ Awaken':'Skill Book'}</small></strong></div></div>:<p className="hint warn">ใส่จำนวนเต็มตั้งแต่ 1 ขึ้นไป</p>}
   <button className="btn primary wide exchange-submit" disabled={disabled||!quote||!canPay(state.wallet,quote.cost)} onClick={()=>void exchange()}>{busy?'กำลังแลก…':merging?'รวมเศษ':'ย่อยเศษ'}</button>
  </div>
 </Sheet>;
}
