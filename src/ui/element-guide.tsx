import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { elementMatchups, elementName, type Element } from '../client/elements.ts';
import { Icon } from './icon.tsx';

const rows = elementMatchups(), elements = rows.map(row => row.attack);
const percent = (ratio: number) => (ratio * 100).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + '%';
interface Props { onClose: () => void; attack?: Element; armor?: Element }

export function ElementGuide({ onClose, attack: initialAttack = 'fire', armor: initialArmor = 'earth' }: Props) {
  const ref = useRef<HTMLDialogElement>(null), titleId = useId();
  const [attack, setAttack] = useState(initialAttack), [armor, setArmor] = useState(initialArmor);
  const selected = rows.find(row => row.attack === attack)!.targets.find(cell => cell.armor === armor)!.multiplier;
  useEffect(() => {
    const node = ref.current!, opener = document.activeElement; node.showModal();
    return () => { if (node.open) node.close(); if (opener instanceof HTMLElement && opener.isConnected) opener.focus(); };
  }, []);
  return createPortal(<dialog ref={ref} className="element-guide-dialog" aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <header><h2 id={titleId}>ตารางธาตุ</h2><button type="button" autoFocus aria-label="ปิดตารางธาตุ" onClick={onClose}><Icon name="close" /></button></header>
    <div className="element-guide-body">
      <div className="element-pair-select"><label>ธาตุโจมตี<select aria-label="ธาตุโจมตี" value={attack} onChange={e => setAttack(e.target.value as Element)}>{elements.map(e => <option key={e} value={e}>{elementName(e)}</option>)}</select></label><label>เกราะเป้าหมาย<select aria-label="เกราะเป้าหมาย" value={armor} onChange={e => setArmor(e.target.value as Element)}>{elements.map(e => <option key={e} value={e}>{elementName(e)}</option>)}</select></label></div>
      <p className={`element-pair-result ${selected > 1 ? 'strong' : selected < 1 ? 'weak' : 'normal'}`} role="status">{elementName(attack)} → {elementName(armor)} <strong>{percent(selected)}</strong><small>{selected === 1 ? 'ดาเมจปกติ' : `${selected > 1 ? 'แรงขึ้น' : 'เบาลง'} ${percent(Math.abs(selected - 1))}`}</small></p>
      <p className="element-guide-hint">แถว: โจมตี · คอลัมน์: เกราะ · เลื่อนซ้าย–ขวาดูครบ 10 ธาตุ</p>
      <div className="element-matrix-scroll" tabIndex={0} role="region" aria-label="ตารางธาตุครบทุกคู่ เลื่อนซ้ายขวาได้">
        <table className="element-matrix"><caption>ตัวคูณธาตุโจมตีต่อเกราะเป้าหมาย</caption><thead><tr><th scope="col">โจมตี ↓<br />เกราะ →</th>{elements.map(e => <th key={e} scope="col" className={e === armor ? 'chosen' : ''}>{elementName(e)}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.attack}><th scope="row" className={row.attack === attack ? 'chosen' : ''}>{elementName(row.attack)}</th>{row.targets.map(cell => <td key={cell.armor} className={cell.multiplier > 1 ? 'strong' : cell.multiplier < 1 ? 'weak' : 'normal'}><button type="button" aria-label={`${elementName(row.attack)}โจมตีเกราะ${elementName(cell.armor)} ${percent(cell.multiplier)}`} aria-pressed={row.attack === attack && cell.armor === armor} onClick={() => { setAttack(row.attack); setArmor(cell.armor); }}>{percent(cell.multiplier)}</button></td>)}</tr>)}</tbody></table>
      </div>
      <p className="element-guide-legend"><span className="strong">มากกว่า 100% · ได้เปรียบ</span><span className="normal">100% · ปกติ</span><span className="weak">ต่ำกว่า 100% · เสียเปรียบ</span></p>
      <p className="element-guide-note">ค่าปัจจุบันของเกม ก่อนคิดเกราะ/ต้านธาตุ/บัฟ<br />“ตามอาวุธ” ใช้ธาตุอาวุธขณะโจมตี</p>
    </div>
  </dialog>, document.body);
}

export function ElementGuideButton({ attack, armor }: { attack?: Element; armor?: Element }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="element-guide-link" aria-haspopup="dialog" onClick={() => setOpen(true)}><Icon name="help" />ตารางธาตุ</button>{open && <ElementGuide attack={attack} armor={armor} onClose={() => setOpen(false)} />}</>;
}
