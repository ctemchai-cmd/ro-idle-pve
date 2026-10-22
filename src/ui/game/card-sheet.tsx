import type { GameContext } from './shell.tsx';
import { cardView, salvageCardsQuote } from '../../client/slots.ts';
import { rarityLabels, slotLabels, type EquipmentSlot } from '../../client/equipment.ts';
import { CardGrade } from './card-grade.tsx';
import { modifierText } from './buddy.tsx';
import { CostChips, ItemIcon, Sheet, canPay, friendNames, resourceNames, type Wallet } from './kit.tsx';
const quoteText=(q:Partial<Wallet>)=>Object.entries(q).filter(([,n])=>n).map(([k,n])=>`${resourceNames[k as keyof Wallet]} ${n!.toLocaleString()}`).join(' · ');

export function CardSheet({ context, card, close }: { context: GameContext; card: ReturnType<typeof cardView>; close: () => void }) {
  const { state, pack, submit, locked } = context, owned = state.inventory.some(item => item.instance_id === card.item.instance_id);
  return <Sheet title={card.name} onClose={close}>
    <div className="card-identity"><span className={`card-portrait rarity-${card.item.rarity_id}`}><ItemIcon id={card.iconId} pack={pack} /></span><div><CardGrade grade={card.origin?.grade} rarity={card.item.rarity_id} /><b>ระดับ {rarityLabels[card.item.rarity_id]}</b><small>ช่อง{slotLabels[card.definition.slot as EquipmentSlot]} · Lv.{card.item.level}</small><small>{card.owner ? `ใส่อยู่ · ${friendNames[card.owner.character_id]}` : 'ยังไม่ได้ใส่'}</small>{card.item.legacy_quality&&<small className="legacy-card-bonus">รักษาพลังและมูลค่าย่อยจากการ์ดเดิม</small>}</div></div>
    <ul className="card-effects">{card.modifiers.map((m,i)=><li key={i}>{modifierText(m)}</li>)}{card.effects.map((text,i)=><li key={`effect-${i}`}>{text}</li>)}</ul>
    {card.nextEffects&&<details className="card-next"><summary>หลังอัป Lv.{card.item.level+1}</summary><ul className="card-effects">{card.nextModifiers?.map((m,i)=><li key={i}>{modifierText(m)}</li>)}{card.nextEffects.map((text,i)=><li key={`effect-${i}`}>{text}</li>)}</ul></details>}
    <p className="hint">ใส่การ์ดได้จากหน้าตัวละคร › ช่องอุปกรณ์ › อัปเกรด › การ์ด</p>
    {owned && (card.price ? <div className="row"><CostChips cost={card.price} wallet={state.wallet} pack={pack} /><button className="btn small primary" disabled={locked || !canPay(state.wallet, card.price)} onClick={() => void submit('card.upgrade', { card_instance_id: card.item.instance_id, target_level: card.item.level + 1 })}>อัป Lv.{card.item.level + 1}</button></div> : <p className="hint">ระดับสูงสุดแล้ว</p>)}
    {owned && <div className="row"><button className="btn ghost" disabled={locked} onClick={() => void submit('equipment.lock', { item_instance_id: card.item.instance_id, locked: !card.item.locked })}>{card.item.locked ? 'ปลดล็อก' : 'ล็อก'}</button><button className="btn danger-outline" disabled={locked || card.item.locked || !!card.owner} onClick={() => void submit('card.salvage', { instance_ids: [card.item.instance_id] }).then(ok => { if (ok) close(); })}>ย่อย ({quoteText(salvageCardsQuote([card.item]))})</button></div>}
    {!owned && <p className="hint">รับรางวัลก่อน เพื่ออัปเกรดหรือสวมใส่การ์ดใบนี้</p>}
  </Sheet>;
}

