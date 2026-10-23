import {useState} from 'react';
import {quoteShardConversion} from '../../client/skills.ts';
import type {GameContext} from './shell.tsx';
import {Sheet,CostChips,canPay,full} from './kit.tsx';

export function ShardExchangeSheet({context,onClose}:{context:GameContext;onClose:()=>void}){
 const {state,pack,submit,locked}=context;
 const [direction,setDirection]=useState<'base_to_awakened'|'awakened_to_base'>('base_to_awakened'),[quantity,setQuantity]=useState(1);
 const valid=Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=1000000,quote=valid?quoteShardConversion(direction,quantity):null;
 const unit=quoteShardConversion(direction,1),costKey=direction==='base_to_awakened'?'skill_manual':'awakening_shard';
 const max=Math.min(1000000,Math.floor(state.wallet[costKey]/(unit.cost[costKey]??1)));
 return <Sheet title="แลกเศษสกิล" onClose={onClose}>
  <div className="row"><button className={`chip ${direction==='base_to_awakened'?'on':''}`} onClick={()=>setDirection('base_to_awakened')}>รวมเศษ</button><button className={`chip ${direction==='awakened_to_base'?'on':''}`} onClick={()=>setDirection('awakened_to_base')}>ย่อยเศษ Awaken</button></div>
  <label className="shard-quantity">จำนวนเศษ Awaken<input type="number" inputMode="numeric" min={1} max={1000000} value={Number.isNaN(quantity)?'':quantity} onChange={e=>setQuantity(e.target.valueAsNumber)}/><button className="btn" disabled={!max} onClick={()=>setQuantity(max)}>สูงสุด</button></label>
  {quote&&<><CostChips cost={quote.cost} wallet={state.wallet} pack={pack}/><p className="shard-result">ได้รับ {full(direction==='base_to_awakened'?quote.gain.awakening_shard??0:quote.gain.skill_manual??0)} {direction==='base_to_awakened'?'เศษ Awaken':'คู่มือสกิล'}</p></>}
  <button className="btn primary wide" disabled={locked||!quote||!canPay(state.wallet,quote.cost)} onClick={()=>void submit('skill.convert_shards',{direction,quantity})}>{direction==='base_to_awakened'?'รวมเศษ':'ย่อยเศษ'}</button>
 </Sheet>;
}
