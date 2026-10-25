import { ScrollIcon } from './scroll-icon.tsx';
import { CardIcon } from './card-art.tsx';
import { CardGrade } from './card-grade.tsx';
import { CardSheet } from './card-sheet.tsx';
import { cardView } from '../../client/slots.ts';
import { useRef, useState } from 'react';
import { Icon } from '../icon.tsx';
import { optionLineSummary, revealItems, storeView } from '../../client/store.ts';
import { rarityLabels, slotLabels, type EquipmentSlot } from '../../client/equipment.ts';
import type { GameContext } from './shell.tsx';
import { CostChips, ItemIcon, PageHeader, ResIcon, Sheet, canPay, friendNames, jobNames, full, compact, type Wallet } from './kit.tsx';

type Section = 'shop' | 'scrolls' | 'cards' | 'gear';
/** Store (TASK-051/037, D-063): daily shop, card gacha and equipment gacha. No real money; every purchase is a server command. */
export function StorePage({ context }: { context: GameContext }) {
  const { state, pack, submit, locked, go } = context, [section, setSection] = useState<Section>('shop'), [revealed, setRevealed] = useState<string[]>([]), [openCardId,setOpenCardId]=useState<string|null>(null);
  const [scrollCharacterId,setScrollCharacterId]=useState(context.characterId);
  const [revealOpen,setRevealOpen]=useState(false),[skip,setSkip]=useState(false),[pulling,setPulling]=useState(false),pullGate=useRef(false);
  const [lastCardCount,setLastCardCount]=useState<1|10>(1);
  const openCard=state.inventory.find(item=>item.kind==='card'&&item.instance_id===openCardId);
  const view = storeView(state, Date.now());
  async function pull(pool: 'card_v1' | 'equipment_v1', count: 1 | 10) {
    const price=pool==='card_v1'?view.cards:view.gear;
    if(pullGate.current||locked||!canPay(state.wallet,count===10?price.cost10:price.cost1)||state.inventory.length+count>500)return;
    pullGate.current=true;setPulling(true);
    try { if(await submit('gacha.pull',{pool_id:pool,count})) {setSkip(false);setRevealed(context.lastCreated());setRevealOpen(pool==='card_v1');if(pool==='card_v1')setLastCardCount(count);} }
    catch {context.toast('สุ่มไม่สำเร็จ ลองใหม่อีกครั้ง');}
    finally {pullGate.current=false;setPulling(false);}
  }
  const buyGate=useRef(false),[buying,setBuying]=useState<string|null>(null);
  async function buy(id:string,quantity:number){
    if(buyGate.current||locked||quantity<1)return;
    buyGate.current=true;setBuying(id);
    try{await submit('shop.buy',{offer_id:id,quantity});}catch{context.toast('แลกไม่สำเร็จ ลองใหม่อีกครั้ง');}finally{buyGate.current=false;setBuying(null);}
  }
  const results = revealItems(state, revealed);
  const resultGrid = <div className={`gacha-results ${section==='cards'?'card-results':''} ${skip?'skip-reveal':''}`} aria-label="ผลการสุ่ม">{results.map((row,i)=><div key={row.item.instance_id} className={`gacha-card rarity-${row.item.rarity_id}`} style={{animationDelay:`${i*90}ms`}}>
    {row.item.kind==='card'?<button className="card-reveal" aria-label={`ดู${row.name}`} onClick={()=>setOpenCardId(row.item.instance_id)}><CardIcon card={row} pack={pack}/><b>{row.name}</b></button>:<span className={`icon-frame rarity-${row.item.rarity_id}`}><ItemIcon id={row.iconId} pack={pack}/></span>}
    <small>{rarityLabels[row.item.rarity_id]}</small>{row.item.kind==='card'&&<CardGrade grade={row.origin?.grade} rarity={row.item.rarity_id} variant={row.origin?.variant}/>}<em>{slotLabels[row.slot as EquipmentSlot]}{row.lines?` · ${row.lines} Option`:''}</em>
  </div>)}</div>;
  return <div className="page store-page">
    <PageHeader title="ร้านค้า" sub={`รีเซ็ตสิทธิ์ซื้อทุกวัน 00:00 (เวลาไทย) · วันนี้ ${view.day}`} onBack={() => go('home')} />
    <div className="seg store-seg" role="tablist">{([['shop', 'ร้านค้า'], ['scrolls', 'ใบธาตุ'], ['cards', 'สุ่มการ์ด'], ['gear', 'สุ่มอุปกรณ์']] as [Section, string][]).map(([id, label]) => <button key={id} role="tab" aria-selected={section === id} className={section === id ? 'on' : ''} onClick={() => { setSection(id); setRevealed([]); }}>{label}</button>)}</div>
    {(section === 'shop'||section === 'scrolls') && <div className="shop-grid">{view.offers.filter(offer=>(section==='scrolls')===!!offer.scroll).map(offer => <article key={offer.id} data-offer={offer.id} className={`shop-offer ${offer.left ? '' : 'sold-out'}`}>
      <div className="shop-grant">{offer.scroll&&<ScrollIcon pack={pack} element={offer.scroll.element} />}{(Object.entries(offer.grant) as [keyof Wallet, number][]).map(([k, n]) => <span key={k}><ResIcon pack={pack} k={k} /><b>{full(n)}</b></span>)}</div>
      <b className="shop-name">{offer.name}</b>{offer.scroll&&<small>หนึ่งไฟต์ · ในคลัง {view.scrolls.find(row=>row.id===offer.id)?.stock??0}</small>}<small>เหลือวันนี้ {offer.left}/{offer.daily_limit}</small>
      <div className="shop-unit-price"><span>ต่อครั้ง</span>{(Object.entries(offer.price)as[keyof Wallet,number][]).map(([k,n])=><strong key={k}><ResIcon pack={pack} k={k}/>{full(n)}</strong>)}</div>
      <div className="shop-actions"><button className="btn small" aria-label={`แลก ${offer.name} 1 ครั้ง`} disabled={locked||!!buying||!offer.maxQuantity} onClick={()=>void buy(offer.id,1)}>{buying===offer.id?'กำลังแลก…':'แลก 1'}</button><button className="btn primary small" aria-label={`แลกทั้งหมด ${offer.name} ${offer.maxQuantity} ครั้ง`} disabled={locked||!!buying||!offer.maxQuantity} onClick={()=>void buy(offer.id,offer.maxQuantity)}>แลกหมด <b>×{offer.maxQuantity}</b></button></div>
      <small className="shop-batch-cost" aria-label={`ราคารวม ${offer.name}`}>{offer.maxPrice?<>รวม {(Object.entries(offer.maxPrice)as[keyof Wallet,number][]).map(([k,n])=><span key={k}><ResIcon pack={pack} k={k}/>{compact(n)}</span>)}</>:offer.left?'เงินไม่พอ':'ครบโควตาวันนี้'}</small>
    </article>)}</div>}
    {section === 'scrolls' && <section className="scroll-preparation" aria-label="เตรียมใบธาตุ">
      <header><b>เตรียมใบธาตุ</b><small>ตีปกติและสกิลธาตุตามอาวุธ · หนึ่งไฟต์ถัดไป</small></header>
      <label className="scroll-character">ตัวละคร<select aria-label="ตัวละครสำหรับใบธาตุ" value={scrollCharacterId} disabled={locked} onChange={event=>setScrollCharacterId(event.target.value)}>{state.roster.map(actor=><option key={actor.character_id} value={actor.character_id}>{friendNames[actor.character_id]} · {jobNames[actor.job_id]}</option>)}</select></label>
      {view.prepared[scrollCharacterId]&&<div className="scroll-prepared"><ScrollIcon pack={pack} element={view.prepared[scrollCharacterId]!.element}/><span>เตรียม{view.prepared[scrollCharacterId]!.name}ไว้แล้ว</span><button className="btn ghost small" disabled={locked} onClick={()=>void submit('consumable.prepare',{character_id:scrollCharacterId,definition_id:null})}>ยกเลิก / คืนใบ</button></div>}
      <div className="scroll-choices">{view.scrolls.map(row=><button key={row.id} className={`scroll-choice element-${row.element}`} disabled={locked||row.stock<1||view.prepared[scrollCharacterId]?.id===row.id} aria-pressed={view.prepared[scrollCharacterId]?.id===row.id} onClick={()=>void submit('consumable.prepare',{character_id:scrollCharacterId,definition_id:row.id})}><ScrollIcon pack={pack} element={row.element}/><span><b>{row.name}</b><small>{view.prepared[scrollCharacterId]?.id===row.id?'เตรียมแล้ว':`ในคลัง ${row.stock}`}</small></span></button>)}</div>
    </section>}
    {section !== 'shop' && section !== 'scrolls' && (() => { const card = section === 'cards', data = card ? view.cards : view.gear, pool = card ? 'card_v1' : 'equipment_v1';
      return <section className="gacha-box">
        {card&&<div className={`card-summon-stage ${pulling?'summoning':''}`} aria-label={pulling?'กำลังอัญเชิญการ์ด':'อัญเชิญการ์ด'}>
          <span className="summon-orbit" aria-hidden="true"/><div className="summon-deck" aria-hidden="true">{[-1,0,1].map(n=><span className={`summon-back back-${n+1}`} key={n}><Icon name="card"/></span>)}</div>
          <span className="summon-caption">MIDGARD COLLECTION</span><h2>{pulling?'กำลังอัญเชิญ…':'การ์ดแห่งมิดการ์ด'}</h2><p>Normal · Elite · Mini · MVP</p>
        </div>}
        <div className={`gacha-banner ${card ? 'cards' : 'gear'}`}><b>{card ? 'การ์ด RO · ระดับตามมอนสเตอร์' : `อุปกรณ์ Tier ${view.gear.tier}`}</b><small>{card ? `การันตี Rare+ ใน ${view.cards.silver_in} · Legendary ใน ${view.cards.gold_in}` : `การันตี Epic+ ใน ${view.gear.epic_in} · Legendary+ ใน ${view.gear.legendary_in}`}</small></div>
        <ul className="gacha-odds">{data.odds.map(row => <li key={row.id} className={`rarity-${row.id}`}><span>{rarityLabels[row.id] ?? row.id}</span><b>{row.percent}%</b></li>)}</ul>
        {!card && <p className="hint">ได้ของ Tier ตามบทที่ผ่านล่าสุด · Rare+ มี Option สุ่ม ({optionLineSummary()} แถว)</p>}
        <div className="row two">
          <button className="btn" disabled={locked || pulling || !canPay(state.wallet, data.cost1) || state.inventory.length + 1 > 500} onClick={() => void pull(pool, 1)}>สุ่ม 1 <CostChips pack={pack} cost={data.cost1} wallet={state.wallet} /></button>
          <button className="btn primary" disabled={locked || pulling || !canPay(state.wallet, data.cost10) || state.inventory.length + 10 > 500} onClick={() => void pull(pool, 10)}>สุ่ม 10 <CostChips pack={pack} cost={data.cost10} wallet={state.wallet} /></button>
        </div>
        {results.length > 0 && !revealOpen && resultGrid}
      </section>; })()}
    {revealOpen&&results.length>0&&<Sheet title={`ได้รับการ์ด ${results.length} ใบ`} className="tall gacha-reveal-sheet" onClose={()=>setRevealOpen(false)}>
      <div className="summon-results-scroll">{resultGrid}</div><div className="summon-result-actions">
        <button className="btn ghost small" disabled={pulling} onClick={()=>setSkip(true)}>ข้ามเอฟเฟกต์</button><button className="btn ghost small" onClick={()=>setRevealOpen(false)}>เสร็จสิ้น</button>
        <button className="btn primary summon-again" disabled={locked||pulling||!canPay(state.wallet,lastCardCount===10?view.cards.cost10:view.cards.cost1)||state.inventory.length+lastCardCount>500} onClick={()=>void pull('card_v1',lastCardCount)}>{pulling?'กำลังสุ่ม…':`สุ่มอีก ${lastCardCount} ใบ`}<CostChips pack={pack} cost={lastCardCount===10?view.cards.cost10:view.cards.cost1} wallet={state.wallet}/></button>
      </div>
    </Sheet>}
    {openCard?.kind==='card'&&<CardSheet context={context} card={cardView(openCard,state)} close={()=>setOpenCardId(null)}/>}
  </div>;
}
