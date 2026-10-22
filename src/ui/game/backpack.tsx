import { CardIcon } from './card-art.tsx';
import { Icon } from '../icon.tsx';
import { useMemo, useState } from 'react';
import { VirtualGrid } from './virtual-grid.tsx';
import type { Modifier } from '../../contracts/index.ts';
import { equipmentData, equipmentSlots, inventoryView, itemModifiers, itemSalvageQuote, rarityLabels, rarityRank, slotLabels, type EquipmentSlot } from '../../client/equipment.ts';
import { cardInventory } from '../../client/slots.ts';
import { gearGrowthOptions } from '../../client/gear-upgrades.ts';
import type { GameContext } from './shell.tsx';
import { CostChips, ItemIcon, PageHeader, Sheet, canPay, friendNames, jobNames, reasonText, resourceNames, statLabels, type Wallet } from './kit.tsx';
import { OptionLines, StatChanges, modifierText } from './buddy.tsx';
import { ClassIcon } from './class-icon.tsx';
import { CardGrade } from './card-grade.tsx';
import { CardSheet } from './card-sheet.tsx';
import { EquipmentCards } from './equipment-cards.tsx';
import { EquipmentProgress } from './equipment-progress.tsx';

type Filter = 'all' | EquipmentSlot | 'card';
type Gear = ReturnType<typeof inventoryView>[number];
const growthReasons: Record<string, string> = { ITEM_EQUIPPED: 'ถอดชิ้นนี้ก่อนนำไปผสม', ITEM_LOCKED: 'ปลดล็อกก่อนนำไปผสม', TRAINING_WEAPON_RESTRICTED: 'อาวุธฝึกหัดผสมและอัป Tier ไม่ได้', RARITY_MAX_REACHED: 'Supreme เป็น rarity สูงสุดแล้ว', TIER_MAX_REACHED: 'ถึง Tier สูงสุดของรุ่นนี้แล้ว', NOT_ENOUGH_MATCHING_EQUIPMENT: 'ต้องมีของว่างไม่ล็อก 3 ชิ้น ชนิด/Tier/rarity เดียวกัน', ITEM_LEVEL_REQUIRED: 'ผู้สวมต้องมีเลเวลถึง Tier ถัดไป', BUILD_LOCKED_DURING_BATTLE: 'จบไฟต์ก่อนพัฒนาของ' };
const quoteText = (q: Partial<Wallet>) => Object.entries(q).filter(([, n]) => n).map(([k, n]) => `${resourceNames[k as keyof Wallet] ?? k} ${n!.toLocaleString()}`).join(' · ') || 'ไม่ได้อะไร';
function BaseChange({ before, after }: { before: Modifier[]; after: Modifier[] }) {
  return <div className="stat-changes">{after.map(m => { const old = Number(before.find(r => r.id === m.id && r.stat === m.stat)?.value ?? 0); return <p key={m.id + m.stat}><span>{statLabels[m.stat as keyof typeof statLabels] ?? m.stat}</span><span className="diff"><s>{old.toLocaleString()}</s> → <b className={Number(m.value) >= old ? 'up' : 'down'}>{Number(m.value).toLocaleString()}</b></span></p>; })}</div>;
}

function GearSheet({ context, row, close }: { context: GameContext; row: Gear; close: () => void }) {
  const { state, pack, submit, locked } = context, id = row.item.instance_id, [mode, setMode] = useState<'equip' | 'fusion' | 'tier' | 'salvage' | null>(null);
  const growth = useMemo(() => gearGrowthOptions(state, row.owner?.character_id ?? 'main', id), [state, id, row.owner?.character_id]);
  const fits = useMemo(() => state.roster.map(a => ({ actor: a, reason: inventoryView(state, a.character_id).find(r => r.item.instance_id === id)?.reason ?? null })), [state, id]);
  return <Sheet title={row.name} onClose={close}>
    <div className="slot-summary"><span className={`icon-frame big rarity-${row.item.rarity_id}`}><ItemIcon id={row.iconId} pack={pack} />{row.owner && <><EquipmentCards state={state} characterId={row.owner.character_id} slot={row.owner.slot} /><EquipmentProgress state={state} characterId={row.owner.character_id} slot={row.owner.slot} /></>}</span>
      <div><b>{rarityLabels[row.item.rarity_id]} · {slotLabels[row.slot]} · Lv.{row.definition.required_level}</b><small className="mods">{itemModifiers(row.item).map(modifierText).join(' · ')}</small><OptionLines item={row.item} /><small>{row.owner ? `สวมโดย ${friendNames[row.owner.character_id]}` : 'ยังไม่มีคนสวม'}{row.item.locked && <> · <Icon name="lock" /> ล็อก</>}{row.item.training ? ' · อาวุธฝึกหัด' : ''}</small></div></div>
    <div className="action-grid">
      <button className={`btn ${mode === 'equip' ? 'primary' : ''}`} onClick={() => setMode(mode === 'equip' ? null : 'equip')}>สวมให้…</button>
      <button className="btn" disabled={locked} onClick={() => void submit('equipment.lock', { item_instance_id: id, locked: !row.item.locked })}>{row.item.locked ? 'ปลดล็อก' : 'ล็อก'}</button>
      <button className={`btn ${mode === 'fusion' ? 'primary' : ''}`} onClick={() => setMode(mode === 'fusion' ? null : 'fusion')}>ผสม rarity</button>
      <button className={`btn ${mode === 'tier' ? 'primary' : ''}`} onClick={() => setMode(mode === 'tier' ? null : 'tier')}>อัป Tier</button>
      <button className="btn danger-outline" disabled={!!row.owner || row.item.locked} onClick={() => setMode(mode === 'salvage' ? null : 'salvage')}>ย่อย</button>
    </div>
    {mode === 'equip' && <div className="pick-list">{fits.map(({ actor, reason }) => <button key={actor.character_id} className="list-row" disabled={locked || !!reason || actor.equipment[row.slot] === id} onClick={() => void submit('equipment.equip', { character_id: actor.character_id, slot: row.slot, item_instance_id: id }).then(ok => { if (ok) close(); })}>
      <ClassIcon pack={pack} job={actor.job_id} size={26} /><span className="row-main"><b>{friendNames[actor.character_id]} · {jobNames[actor.job_id]}</b><small>Lv.{actor.level}{actor.equipment[row.slot] === id ? ' · สวมอยู่' : reason ? ` · ${reasonText[reason] ?? reason}` : ''}</small></span></button>)}</div>}
    {mode === 'fusion' && <div className="detail-box">{growth.fusion ? <><p>{rarityLabels[growth.item.rarity_id]} ×3 → <b>{rarityLabels[growth.fusion.output.rarity_id]}</b> · ใช้ของว่างที่ไม่ล็อก 3 ชิ้น (รวมชิ้นนี้)</p><BaseChange before={growth.base} after={growth.fusion.modifiers} />{growth.fusion.after && <StatChanges before={growth.fusion.before} after={growth.fusion.after} />}<CostChips cost={growth.fusion.cost} wallet={state.wallet} pack={pack} />
      <button className="btn primary wide" disabled={locked || !canPay(state.wallet, growth.fusion.cost)} onClick={() => void submit('equipment.fuse', growth.fusion!.params).then(ok => { if (ok) close(); })}>ยืนยันผสม 3 ชิ้น</button></> : <p className="hint warn">{growthReasons[growth.fusionReason] ?? 'ยังผสมชุดนี้ไม่ได้'}</p>}</div>}
    {mode === 'tier' && <div className="detail-box">{growth.tier ? <><p>Lv.{growth.definition.tier_level} → <b>Lv.{growth.tier.definition.tier_level}</b> · คง rarity · ค่าพัฒนาช่องและการ์ดยังอยู่</p><BaseChange before={growth.base} after={growth.tier.modifiers} />{growth.tier.after && <StatChanges before={growth.tier.before} after={growth.tier.after} />}<CostChips cost={growth.tier.cost} wallet={state.wallet} pack={pack} />
      <button className="btn primary wide" disabled={locked || !canPay(state.wallet, growth.tier.cost)} onClick={() => void submit('equipment.tier_up', growth.tier!.params)}>ยืนยันอัป Tier</button></> : <p className="hint warn">{growthReasons[growth.tierReason] ?? 'ยังอัป Tier ไม่ได้'}</p>}</div>}
    {mode === 'salvage' && <div className="detail-box"><p>ย่อยแล้วได้ {quoteText(itemSalvageQuote([row.item]))}</p><button className="btn danger wide" disabled={locked} onClick={() => void submit('equipment.salvage', { instance_ids: [id] }).then(ok => { if (ok) close(); })}>ยืนยันย่อย</button></div>}
  </Sheet>;
}


export function BackpackPage({ context }: { context: GameContext }) {
  const { state, pack, submit, locked, go } = context, [filter, setFilter] = useState<Filter>('all'), [open, setOpen] = useState<string | null>(null), [bulk, setBulk] = useState<string[] | null>(null);
  // Rarity/Level filters (user request, 20 Oct 2026): none picked = all; they narrow the grid and "select all" for salvage.
  const [rarities, setRarities] = useState<string[]>([]), [levels, setLevels] = useState<number[]>([]);
  const gear = useMemo(() => inventoryView(state, 'main').sort((a, b) => b.definition.required_level - a.definition.required_level || (rarityRank[b.item.rarity_id] ?? 0) - (rarityRank[a.item.rarity_id] ?? 0)), [state]);
  const cards = useMemo(() => equipmentSlots.flatMap(s => cardInventory(state, s)).sort((a, b) => (rarityRank[b.item.rarity_id] ?? 0) - (rarityRank[a.item.rarity_id] ?? 0) || b.item.level - a.item.level), [state]);
  const narrowed = rarities.length > 0 || levels.length > 0, matches = (g: {item:{rarity_id:string};definition:{tier_level:number}}) => (!rarities.length || rarities.includes(g.item.rarity_id)) && (!levels.length || levels.includes(g.definition.tier_level));
  const slotGear = filter === 'card' ? [] : gear.filter(g => filter === 'all' || g.slot === filter), shownGear = slotGear.filter(matches), shownCards = filter === 'card' || (filter === 'all'&&!levels.length) ? cards.filter(c=>!rarities.length||rarities.includes(c.item.rarity_id)) : [];
  const filterItems=[...slotGear,...(filter==='card'||filter==='all'?cards:[])];
  const presentRarities = [...new Set(filterItems.map(g => g.item.rarity_id))].sort((a, b) => (rarityRank[a] ?? 0) - (rarityRank[b] ?? 0)), presentLevels = [...new Set(slotGear.map(g => g.definition.tier_level))].sort((a, b) => a - b);
  const toggle = <T,>(list: T[], value: T) => list.includes(value) ? list.filter(x => x !== value) : [...list, value];
  const free = shownGear.filter(g => !g.owner && !g.item.locked), bulkItems = state.inventory.filter(i => bulk?.includes(i.instance_id)), openGear = gear.find(g => g.item.instance_id === open), openCard = cards.find(c => c.item.instance_id === open);
  const tap = (id: string, selectable: boolean) => { if (!bulk) { setOpen(id); return; } if (selectable) setBulk(bulk.includes(id) ? bulk.filter(x => x !== id) : [...bulk, id]); };
  const filters: [Filter, string][] = [['all', 'ทั้งหมด'], ...equipmentSlots.map(s => [s, slotLabels[s]] as [Filter, string]), ['card', 'การ์ด']];
  return <div className="page backpack-page">
    <PageHeader title="กระเป๋า" sub={`${state.inventory.length} / ${equipmentData.inventory_capacity} ช่อง${state.inventory.length >= equipmentData.inventory_capacity ? ' · เต็ม' : ''}`} onBack={() => go('home')} right={<button className={`btn small ${bulk ? 'primary' : 'ghost'}`} onClick={() => setBulk(bulk ? null : [])}>{bulk ? 'เสร็จ' : 'ย่อยหลายชิ้น'}</button>} />
    <div className="filter-row" role="tablist">{filters.map(([id, label]) => <button key={id} role="tab" aria-selected={filter === id} className={`chip ${filter === id ? 'on' : ''}`} onClick={() => {setFilter(id);if(id==='card')setLevels([]);}}>{label}</button>)}</div>
    {filterItems.length > 0 && <div className="filter-row sub" role="group" aria-label="กรองตาม Rarity และ Level">
      {presentRarities.map(r => <button key={r} aria-pressed={rarities.includes(r)} className={`chip small rarity-chip rarity-${r} ${rarities.includes(r) ? 'on' : ''}`} onClick={() => setRarities(toggle(rarities, r))}>{rarityLabels[r] ?? r}</button>)}
      {filter!=='card'&&<span className="filter-gap" aria-hidden="true" />}
      {(filter==='card'?[]:presentLevels).map(l => <button key={l} aria-pressed={levels.includes(l)} className={`chip small ${levels.includes(l) ? 'on' : ''}`} onClick={() => setLevels(toggle(levels, l))}>Lv{l}</button>)}
      {narrowed && <button className="chip small ghost" onClick={() => { setRarities([]); setLevels([]); }}>ล้างตัวกรอง</button>}
    </div>}
    <VirtualGrid items={[...shownGear.map(g => ({ kind: 'gear' as const, g })), ...shownCards.map(c => ({ kind: 'card' as const, c })), ...Array.from({ length: Math.max(0, 20 - shownGear.length - shownCards.length) }, (_, i) => ({ kind: 'empty' as const, i }))]} renderItem={row => {
      if (row.kind === 'empty') return <span key={`empty${row.i}`} className="bag-cell empty" aria-hidden="true" />;
      if (row.kind === 'gear') { const g = row.g, selectable = !g.owner && !g.item.locked, picked = bulk?.includes(g.item.instance_id); return <button key={g.item.instance_id} data-id={g.item.instance_id} className={`bag-cell rarity-${g.item.rarity_id} ${picked ? 'picked' : ''} ${bulk && !selectable ? 'dim' : ''}`} aria-label={`${g.name} ${rarityLabels[g.item.rarity_id]}${g.owner ? ' สวมอยู่' : ''}`} onClick={() => tap(g.item.instance_id, selectable)}>
        <ItemIcon id={g.iconId} pack={pack} />{g.owner && <><i className="e-badge" title={`สวมโดย ${friendNames[g.owner.character_id]}`}>E</i><EquipmentCards state={state} characterId={g.owner.character_id} slot={g.owner.slot} /><EquipmentProgress state={state} characterId={g.owner.character_id} slot={g.owner.slot} /></>}{g.item.locked && <i className="lock-mark"><Icon name="lock" /></i>}<small>Lv{g.definition.tier_level}</small>{picked && <i className="check"><Icon name="check" /></i>}
      </button>; }
      const c = row.c; return <button key={c.item.instance_id} className={`bag-cell card rarity-${c.item.rarity_id} ${bulk ? 'dim' : ''}`} data-card-grade={c.origin?.grade} data-card-rarity={c.item.rarity_id} aria-label={`${c.name} ${rarityLabels[c.item.rarity_id]} การ์ด`} onClick={() => { if (!bulk) setOpen(c.item.instance_id); }}>
        <span className="card-art"><CardIcon card={c} pack={pack} /></span>{c.origin?.grade!=='normal'||c.item.rarity_id==='rare'?<CardGrade grade={c.origin?.grade} rarity={c.item.rarity_id} variant={c.origin?.variant} />:null}{c.owner && <i className="e-badge">E</i>}{c.item.locked && <i className="lock-mark"><Icon name="lock" /></i>}<small aria-label={`ระดับการ์ด ${c.item.level}`}>{c.item.level}</small>
      </button>;
    }} />
    {!shownGear.length && !shownCards.length && <p className="hint center">ยังไม่มีของในหมวดนี้</p>}
    {bulk && <footer className="bulk-bar"><span>เลือก {bulk.length} ชิ้น<small>{bulk.length ? quoteText(itemSalvageQuote(bulkItems)) : '0 ชิ้น'}</small></span>
      <button className="btn ghost small" onClick={() => setBulk(free.map(g => g.item.instance_id))}>{narrowed ? 'เลือกที่กรอง' : 'เลือกทั้งหมด'} ({free.length})</button>
      <button className="btn danger small" disabled={locked || !bulk.length} onClick={() => void submit('equipment.salvage', { instance_ids: bulk }).then(ok => { if (ok) setBulk([]); })}>ย่อย</button></footer>}
    {openGear && <GearSheet context={context} row={openGear} close={() => setOpen(null)} />}
    {openCard && <CardSheet context={context} card={openCard} close={() => setOpen(null)} />}
  </div>;
}
