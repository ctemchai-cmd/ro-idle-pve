import { useRef,useState } from 'react';
import type { GameContext } from './shell.tsx';
import { craftingMaterialName,craftingOption,craftingView,type CraftingMaterial } from '../../client/equipment-crafting.ts';
import { rarityLabels } from '../../client/equipment.ts';
import { Sheet,ResIcon,iconUrl,full,reasonText,statLabels,ratioStats } from './kit.tsx';
import type { AssetPack } from '../../renderer/pack.ts';

export function CraftingIcon({pack,kind}:{pack:AssetPack|null;kind:CraftingMaterial}){
 const url=iconUrl(pack,'resource_icons',kind);return url?<img className="res-icon crafting-icon" src={url} alt=""/>:null;
}
const lineText=(o:ReturnType<typeof craftingOption>)=>`${statLabels[o.stat]??o.stat} +${(o.value*(o.percent||ratioStats.has(o.stat)?100:1)).toLocaleString('th-TH',{maximumFractionDigits:2})}${o.percent||ratioStats.has(o.stat)?'%':''}`;
const messages:Record<string,string>={OPTION_LINE_MISSING:'ชิ้นนี้ยังไม่มีออปชันให้รีโรล',OPTION_ROLL_PENDING:'มีผลรีโรลรอเลือกอยู่',ITEM_LOCKED:'ปลดล็อกอุปกรณ์ก่อนขัดเกลา',TRAINING_WEAPON_RESTRICTED:'อาวุธฝึกหัดใช้หินไม่ได้',RARITY_MAX_REACHED:'Rarity สูงสุดแล้ว'};
export function EquipmentCrafting({context,itemId}:{context:GameContext;itemId:string}){
 const[open,setOpen]=useState(false),[tab,setTab]=useState<'roll'|'rarity'>('roll'),[index,setIndex]=useState(0),[confirm,setConfirm]=useState<string|null>(null),[busy,setBusy]=useState(false),gate=useRef(false);
 const view=craftingView(context.state,itemId,index),{item,definition,stock,pending}=view,{pack}=context;
 const doCommand=async(type:string,params:unknown)=>{if(gate.current||context.locked)return;gate.current=true;setBusy(true);try{if(await context.submit(type,params))setConfirm(null);}catch{context.toast('ยังบันทึกไม่สำเร็จ กรุณาลองอีกครั้ง');}finally{gate.current=false;setBusy(false);}};
 const blocked=busy||context.locked,quote=view.rarity;
 return <><button className="btn crafting-open" onClick={()=>setOpen(true)}><CraftingIcon pack={pack} kind="option_stone"/>ขัดเกลาอุปกรณ์{pending&&<span className="tag on">รอเลือกผล</span>}</button>
 {open&&<Sheet title="ขัดเกลาอุปกรณ์" className="tall crafting-sheet" onClose={()=>setOpen(false)}>
  <div className="crafting-body"><div className="crafting-item"><b>{view.name}</b><span className={`rarity-label rarity-${item.rarity_id}`}>{rarityLabels[item.rarity_id]}</span></div>
  <div className="crafting-stock">{(['option_stone','rarity_stone']as const).map(k=><span key={k}><CraftingIcon pack={pack} kind={k}/>{craftingMaterialName(k)} <b>{full(stock[k])}</b></span>)}</div>
  <div className="seg" role="tablist">{(['roll','rarity']as const).map(t=><button key={t} role="tab" aria-selected={tab===t} onClick={()=>{setTab(t);setConfirm(null);}}>{t==='roll'?'รีโรลออปชัน':'เลื่อน Rarity'}</button>)}</div>
  {pending?<section className="crafting-result"><b>ผลรีโรลบรรทัด {pending.option_index+1}</b><div className="crafting-compare"><div><small>เดิม</small><strong>{lineText(craftingOption(pending.original,definition.tier_level))}</strong></div><div><small>ใหม่</small><strong>{lineText(craftingOption(pending.replacement,definition.tier_level))}</strong></div></div><small>หินใช้ไปแล้ว · เลือกผลได้ภายหลัง</small></section>:tab==='roll'?<section><div className="crafting-lines" role="radiogroup" aria-label="เลือกออปชันรีโรล">{item.options.map((o,i)=><button key={i} className={`crafting-line ${i===index?'on':''}`} role="radio" aria-checked={i===index} onClick={()=>setIndex(i)}><span>{i+1}</span><b>{lineText(craftingOption(o,definition.tier_level))}</b></button>)}</div>{view.roll?<p className="crafting-cost"><CraftingIcon pack={pack} kind="option_stone"/>×{view.roll.stone_cost}</p>:<p className="hint">{messages[view.rollReason]??reasonText[view.rollReason]??view.rollReason}</p>}</section>:<section>
  {quote?<><div className="crafting-rarity"><b className={`rarity-label rarity-${item.rarity_id}`}>{rarityLabels[item.rarity_id]}</b><span>→</span><b className={`rarity-label rarity-${quote.step.to}`}>{rarityLabels[quote.step.to]}</b></div><p className="hint">สำเร็จ 100% · คง Tier และออปชันเดิม</p><div className="crafting-cost"><span><CraftingIcon pack={pack} kind="rarity_stone"/>×{quote.stone_cost}</span><span><ResIcon pack={pack} k="gold"/>{full(quote.gold_cost)}</span></div>{confirm&&<p className="hint">ยืนยันใช้หิน {quote.stone_cost} ก้อนเลื่อนเป็น {rarityLabels[quote.step.to]}</p>}</>:<p className="hint">{messages[view.rarityReason]??reasonText[view.rarityReason]??view.rarityReason}</p>}
  </section>}
  {view.otherPending&&<p className="hint warn">เลือกผลรีโรลของชิ้นที่ค้างก่อน</p>}</div>
  <div className="crafting-footer">{pending?<div className="row two"><button className="btn" disabled={blocked} onClick={()=>void doCommand('equipment.option_decide',{item_instance_id:itemId,roll_id:pending.roll_id,accept:false})}>เก็บค่าเดิม</button><button className="btn primary" disabled={blocked||item.locked} onClick={()=>void doCommand('equipment.option_decide',{item_instance_id:itemId,roll_id:pending.roll_id,accept:true})}>ใช้ค่าใหม่</button></div>:tab==='roll'?<button className="btn primary wide" disabled={blocked||!view.roll||stock.option_stone<(view.roll?.stone_cost??1)} onClick={()=>void doCommand('equipment.option_roll',{item_instance_id:itemId,option_index:index,expected_option:item.options[index]})}>สุ่มออปชันใหม่</button>:<button className="btn primary wide" disabled={blocked||!quote||stock.rarity_stone<(quote?.stone_cost??1)||context.state.wallet.gold<(quote?.gold_cost??0)} onClick={()=>confirm===item.rarity_id?void doCommand('equipment.rarity_up',{item_instance_id:itemId,expected_rarity:confirm}):setConfirm(item.rarity_id)}>{confirm===item.rarity_id?'ยืนยันเลื่อน Rarity':'เลื่อน Rarity'}</button>}</div>
 </Sheet>}
 </>;
}
