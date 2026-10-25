import { useRef, useState } from 'react';
import type { GameContext } from './shell.tsx';
import { cardView, salvageCardsQuote } from '../../client/slots.ts';
import { CardIcon } from './card-art.tsx';
import { ResIcon, Sheet, resourceNames } from './kit.tsx';

/** Both card detail entry points require an explicit confirmation of this exact instance. */
export function CardSalvageButton({ context, instanceId, className = 'btn danger-outline', onSalvaged }: {
  context: GameContext; instanceId: string; className?: string; onSalvaged?: () => void;
}) {
  const [targetId, setTargetId] = useState<string | null>(null), [pending, setPending] = useState(false), gate = useRef(false);
  const item = context.state.inventory.find(i => i.kind === 'card' && i.instance_id === instanceId);
  const card = item?.kind === 'card' ? cardView(item, context.state) : undefined;
  const target = context.state.inventory.find(i => i.kind === 'card' && i.instance_id === targetId);
  const selected = target?.kind === 'card' ? cardView(target, context.state) : undefined;
  const blocked = context.locked || pending;
  async function confirm() {
    if (gate.current || blocked || !selected || selected.item.locked || selected.owner) return;
    gate.current = true; setPending(true);
    try {
      if (await context.submit('card.salvage', { instance_ids: [selected.item.instance_id] })) {
        setTargetId(null); onSalvaged?.();
      }
    } catch { context.toast('ย่อยไม่สำเร็จ ลองใหม่อีกครั้ง'); }
    finally { gate.current = false; setPending(false); }
  }
  return <>
    <button className={className} disabled={blocked || !card || card.item.locked || !!card.owner} onClick={() => setTargetId(instanceId)}>ย่อยการ์ด</button>
    {targetId && <Sheet title="ยืนยันย่อยการ์ด" className="card-salvage-sheet" onClose={() => { if (!gate.current) setTargetId(null); }}>
      {selected ? <><div className="salvage-card-summary"><span className={`card-portrait rarity-${selected.item.rarity_id}`}><CardIcon card={selected} pack={context.pack} /></span><div><b>{selected.name}</b><small>Lv.{selected.item.level}</small></div></div>
        <p className="salvage-warning">การ์ดใบนี้จะหายไปและกู้คืนไม่ได้</p>
        <div className="salvage-return"><span>ได้รับ</span>{Object.entries(salvageCardsQuote([selected.item])).map(([key, amount]) => <b key={key}><ResIcon k={key} pack={context.pack}/>{resourceNames[key as keyof typeof resourceNames] ?? key} {amount?.toLocaleString()}</b>)}</div>
        <div className="row two"><button className="btn ghost" disabled={pending} onClick={() => setTargetId(null)}>ยกเลิก</button><button className="btn danger-outline" disabled={blocked || selected.item.locked || !!selected.owner} onClick={() => void confirm()}>{pending ? 'กำลังย่อย…' : 'ยืนยันย่อย'}</button></div></> : <p className="hint">ไม่พบการ์ดใบนี้ในคลังแล้ว</p>}
    </Sheet>}
  </>;
}
