import { CardGrade } from './card-grade.tsx';
import { CardSheet } from './card-sheet.tsx';
import { cardView } from '../../client/slots.ts';
import { useState } from 'react';
import { optionLineSummary, revealItems, storeView } from '../../client/store.ts';
import { rarityLabels, slotLabels, type EquipmentSlot } from '../../client/equipment.ts';
import type { GameContext } from './shell.tsx';
import { CostChips, ItemIcon, PageHeader, ResIcon, canPay, full, type Wallet } from './kit.tsx';

type Section = 'shop' | 'cards' | 'gear';
/** Store (TASK-051/037, D-063): daily shop, card gacha and equipment gacha. No real money; every purchase is a server command. */
export function StorePage({ context }: { context: GameContext }) {
  const { state, pack, submit, locked, go } = context, [section, setSection] = useState<Section>('shop'), [revealed, setRevealed] = useState<string[]>([]), [openCardId,setOpenCardId]=useState<string|null>(null);
  const openCard=state.inventory.find(item=>item.kind==='card'&&item.instance_id===openCardId);
  const view = storeView(state, Date.now());
  async function pull(pool: 'card_v1' | 'equipment_v1', count: 1 | 10) { setRevealed([]); if (await submit('gacha.pull', { pool_id: pool, count })) setRevealed(context.lastCreated()); }
  const results = revealItems(state, revealed);
  return <div className="page store-page">
    <PageHeader title="ร้านค้า" sub={`รีเซ็ตสิทธิ์ซื้อทุกวัน 00:00 (เวลาไทย) · วันนี้ ${view.day}`} onBack={() => go('home')} />
    <div className="seg store-seg" role="tablist">{([['shop', 'ร้านค้า'], ['cards', 'สุ่มการ์ด'], ['gear', 'สุ่มอุปกรณ์']] as [Section, string][]).map(([id, label]) => <button key={id} role="tab" aria-selected={section === id} className={section === id ? 'on' : ''} onClick={() => { setSection(id); setRevealed([]); }}>{label}</button>)}</div>
    {section === 'shop' && <div className="shop-grid">{view.offers.map(offer => <article key={offer.id} className={`shop-offer ${offer.left ? '' : 'sold-out'}`}>
      <div className="shop-grant">{(Object.entries(offer.grant) as [keyof Wallet, number][]).map(([k, n]) => <span key={k}><ResIcon pack={pack} k={k} /><b>{full(n)}</b></span>)}</div>
      <b className="shop-name">{offer.name}</b><small>เหลือวันนี้ {offer.left}/{offer.daily_limit}</small>
      <button className="btn primary small" disabled={locked || !offer.left || !canPay(state.wallet, offer.price)} onClick={() => void submit('shop.buy', { offer_id: offer.id, quantity: 1 })}><CostChips pack={pack} cost={offer.price} wallet={state.wallet} /></button>
    </article>)}</div>}
    {section !== 'shop' && (() => { const card = section === 'cards', data = card ? view.cards : view.gear, pool = card ? 'card_v1' : 'equipment_v1';
      return <section className="gacha-box">
        <div className={`gacha-banner ${card ? 'cards' : 'gear'}`}><b>{card ? `การ์ด RO · Tier ${view.gear.tier}` : `อุปกรณ์ Tier ${view.gear.tier}`}</b><small>{card ? `การันตี Silver+ ใน ${view.cards.silver_in} · Gold ใน ${view.cards.gold_in}` : `การันตี Epic+ ใน ${view.gear.epic_in} · Legendary+ ใน ${view.gear.legendary_in}`}</small></div>
        <ul className="gacha-odds">{data.odds.map(row => <li key={row.id} className={`rarity-${row.id}`}><span>{rarityLabels[row.id] ?? row.id}</span><b>{row.percent}%</b></li>)}</ul>
        {!card && <p className="hint">ได้ของ Tier ตามบทที่ผ่านล่าสุด · Rare+ มี Option สุ่ม ({optionLineSummary()} แถว)</p>}
        <div className="row two">
          <button className="btn" disabled={locked || !canPay(state.wallet, data.cost1)} onClick={() => void pull(pool, 1)}>สุ่ม 1 <CostChips pack={pack} cost={data.cost1} wallet={state.wallet} /></button>
          <button className="btn primary" disabled={locked || !canPay(state.wallet, data.cost10) || state.inventory.length + 10 > 500} onClick={() => void pull(pool, 10)}>สุ่ม 10 <CostChips pack={pack} cost={data.cost10} wallet={state.wallet} /></button>
        </div>
        {results.length > 0 && <div className="gacha-results" aria-label="ผลการสุ่ม">{results.map((row, i) => <div key={row.item.instance_id} className={`gacha-card rarity-${row.item.rarity_id}`} style={{ animationDelay: `${i * 70}ms` }}>
          {row.item.kind==='card'?<button className="card-reveal" aria-label={`ดู${row.name}`} onClick={()=>setOpenCardId(row.item.instance_id)}><ItemIcon id={row.iconId} pack={pack} /><b>{row.name}</b></button>:<span className={`icon-frame rarity-${row.item.rarity_id}`}><ItemIcon id={row.iconId} pack={pack} /></span>}<small>{rarityLabels[row.item.rarity_id]}</small>{row.item.kind==='card'&&<CardGrade grade={row.origin?.grade} />}<em>{slotLabels[row.slot as EquipmentSlot]}{row.lines ? ` · ${row.lines} Option` : ''}</em>
        </div>)}</div>}
      </section>; })()}
    <p className="hint">Crystal ได้จากหอคอย ดันเจี้ยน และร้านค้า · ไม่มีการซื้อด้วยเงินจริง</p>
    {openCard?.kind==='card'&&<CardSheet context={context} card={cardView(openCard,state)} close={()=>setOpenCardId(null)}/>}
  </div>;
}
