import { useRef, useState } from 'react';
import type { GameContext } from './shell.tsx';
import { cardView, salvageCardsQuote } from '../../client/slots.ts';
import { CardIcon } from './card-art.tsx';
import { assignedOwner, rarityLabels, rarityRank } from '../../client/equipment.ts';
import { ResIcon, Sheet, resourceNames } from './kit.tsx';

/** Both card detail entry points require an explicit confirmation of this exact instance. */
export function CardSalvageButton({ context, instanceId, className = 'btn danger-outline', onSalvaged }: {
  context: GameContext; instanceId: string; className?: string; onSalvaged?: () => void;
}) {
  const [targetId, setTargetId] = useState<string | null>(null);
  const item = context.state.inventory.find(i => i.kind === 'card' && i.instance_id === instanceId);
  const card = item?.kind === 'card' ? cardView(item, context.state) : undefined;
  return <>
    <button className={className} disabled={context.locked || !card || card.item.locked || !!card.owner} onClick={() => setTargetId(instanceId)}>ย่อยการ์ด</button>
    {targetId && <CardSalvageConfirmation context={context} instanceIds={[targetId]} onClose={() => setTargetId(null)} onSalvaged={onSalvaged}/>}
  </>;
}

/** Freeze the requested IDs at the opener; recheck all of them against live state.
 * A changed/protected selection must never silently become a smaller batch. */
export function CardSalvageConfirmation({ context, instanceIds, onClose, onSalvaged }: {
  context: GameContext; instanceIds: readonly string[]; onClose: () => void; onSalvaged?: () => void;
}) {
  const [pending, setPending] = useState(false), gate = useRef(false), ids = new Set(instanceIds);
  const items = context.state.inventory.filter((i): i is ReturnType<typeof cardView>['item'] => i.kind === 'card' && ids.has(i.instance_id));
  const ready = ids.size > 0 && ids.size <= 500 && ids.size === instanceIds.length && items.length === ids.size && items.every(i => !i.locked && !assignedOwner(context.state, i.instance_id));
  const preview = items.slice(0, 8).map(i => cardView(i, context.state)), selected = preview[0], multiple = instanceIds.length > 1;
  const rarities = [...new Set(items.map(i => i.rarity_id))].sort((a, b) => (rarityRank[a] ?? 0) - (rarityRank[b] ?? 0));
  const upgraded = items.filter(i => i.level > 1).length, blocked = context.locked || pending;
  async function confirm() {
    if (gate.current || blocked || !ready) return;
    gate.current = true; setPending(true);
    try {
      if (await context.submit('card.salvage', { instance_ids: [...instanceIds] })) {
        onClose(); onSalvaged?.();
      }
    } catch { context.toast('ย่อยไม่สำเร็จ ลองใหม่อีกครั้ง'); }
    finally { gate.current = false; setPending(false); }
  }
  return <Sheet title={multiple ? `ยืนยันย่อยการ์ด ${instanceIds.length} ใบ` : 'ยืนยันย่อยการ์ด'} className="card-salvage-sheet" onClose={() => { if (!gate.current) onClose(); }}>
    {selected ? <>
      {multiple ? <><div className="salvage-card-preview" aria-label="การ์ดที่เลือก">{preview.map(c => <span key={c.item.instance_id} className={`rarity-${c.item.rarity_id}`} title={`${c.name} Lv.${c.item.level}`}><CardIcon card={c} pack={context.pack}/></span>)}{items.length > preview.length && <b>+{items.length - preview.length}</b>}</div>
        <div className="salvage-rarities">{rarities.map(r => <span key={r} className={`rarity-${r}`}>{rarityLabels[r]} <b>×{items.filter(i => i.rarity_id === r).length}</b></span>)}</div></> : <div className="salvage-card-summary"><span className={`card-portrait rarity-${selected.item.rarity_id}`}><CardIcon card={selected} pack={context.pack} /></span><div><b>{selected.name}</b><small>Lv.{selected.item.level}</small></div></div>}
      <p className="salvage-warning">{multiple ? `การ์ดที่เลือก ${instanceIds.length} ใบ` : 'การ์ดใบนี้'}จะหายไปและกู้คืนไม่ได้{upgraded > 0 && <strong> · มีการ์ดที่อัปเลเวลแล้ว {upgraded} ใบ</strong>}</p>
      {!ready && <p className="hint warn" role="alert">รายการเปลี่ยนไป หรือมีการ์ดที่ล็อก/ใส่อยู่ กรุณาเลือกใหม่</p>}
      <div className="salvage-return"><span>ได้รับ</span>{Object.entries(salvageCardsQuote(items)).map(([key, amount]) => <b key={key}><ResIcon k={key} pack={context.pack}/>{resourceNames[key as keyof typeof resourceNames] ?? key} {amount?.toLocaleString()}</b>)}</div>
      <div className="row two"><button className="btn ghost" disabled={pending} onClick={onClose}>ยกเลิก</button><button className="btn danger-outline" disabled={blocked || !ready} onClick={() => void confirm()}>{pending ? 'กำลังย่อย…' : 'ยืนยันย่อย'}</button></div>
    </> : <p className="hint">ไม่พบการ์ดที่เลือกในคลังแล้ว</p>}
  </Sheet>;
}
