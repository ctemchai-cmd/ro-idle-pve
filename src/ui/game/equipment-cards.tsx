import type { AccountState } from '../../contracts/index.ts';
import { equippedCardSlots } from '../../client/slots.ts';
import { rarityLabels, type EquipmentSlot } from '../../client/equipment.ts';

export function EquipmentCards({ state, characterId, slot }: { state: AccountState; characterId: string; slot: EquipmentSlot }) {
  const sockets = equippedCardSlots(state, characterId, slot);
  if (!sockets.length) return null;
  const label = `การ์ด ${sockets.filter(s => s.quality).length}/${sockets.length} · ` + sockets.map(s => `ช่อง ${s.index + 1}: ${s.name ? `${s.name} ${rarityLabels[s.quality!] ?? s.quality}` : 'ว่าง'}`).join(' · ');
  return <span className="gear-card-slots" role="img" aria-label={label} title={label}>{sockets.map(s => <i key={s.index} className={`gear-card-slot ${s.quality ? 'filled quality-' + s.quality : 'empty'}`} data-card-quality={s.quality ?? 'empty'} />)}</span>;
}
