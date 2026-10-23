import { OwnerBadge } from './owner-badge.tsx';
import { CardIcon } from './card-art.tsx';
import { Icon } from '../icon.tsx';
import { useMemo, useState } from 'react';
import type { CombatStats, Modifier } from '../../contracts/index.ts';
import { effectiveLevelCap, levelQuote, rosterData as data, type Character, type RootJob } from '../../client/roster.ts';
import { equipmentData, equipmentPreview, equipmentUpgradeHints, inventoryView, itemModifiers, itemOptions, rarityLabels, rarityRank, slotLabels, weaponLabels, type EquipmentSlot } from '../../client/equipment.ts';
import { cardInventory, cardStatUnits, slotEnchantLines, refineModifiers, nextRefineChance, nextRefinePityBonus, refinePercent, slotsData, refundEnchant, salvageCardsQuote, slotChangePreview, slotUpgradeQuote, socketCapacity, socketUnlockRefine, socketUnlockHint } from '../../client/slots.ts';
import type { GameContext } from './shell.tsx';
import { ClassIcon } from './class-icon.tsx';
import { orderedCharacters } from './character-nav.tsx';
import { CardGrade } from './card-grade.tsx';
import { EquipmentCards } from './equipment-cards.tsx';
import { EquipmentProgress } from './equipment-progress.tsx';
import { ActorCanvas, CostChips, Diff, ItemIcon, PageHeader, Sheet, canPay, friendNames, iconUrl, jobNames, lookOf, reasonText, resourceNames, seconds, statLabels, type Wallet } from './kit.tsx';

const leftSlots: EquipmentSlot[] = ['weapon', 'armor', 'accessory'], rightSlots: EquipmentSlot[] = ['head', 'garment', 'shoes'];
const roots = Object.keys(data.class_tree) as RootJob[];
type ItemRow = ReturnType<typeof inventoryView>[number];
/** D-062 option lines in their own colour so players can tell rolled lines from the base item stats. */
export function OptionLines({ item }: { item: Parameters<typeof itemOptions>[0] }) {
  const lines = itemOptions(item);
  return lines.length ? <ul className="option-lines" aria-label="ออปชันเสริม">{lines.map((m, i) => <li key={i} data-option-stat={m.stat}>
    <span><Icon name="sparkles" />{statLabels[m.stat as keyof CombatStats] ?? m.stat}</span><b className={Number(m.value) < 0 ? 'negative' : ''}>{modifierValue(m)}</b>
  </li>)}</ul> : null;
}
const modifierValue = (m: Modifier) => { const ratio = m.op === 'add_percent' || cardStatUnits[m.stat] === 'ratio', value = Number(m.value); return `${value >= 0 ? '+' : ''}${(value * (ratio ? 100 : 1)).toLocaleString('th-TH', { maximumFractionDigits: 2 })}${ratio ? '%' : ''}`; };
export const modifierText = (m: Modifier) => `${statLabels[m.stat as keyof CombatStats] ?? m.stat} ${modifierValue(m)}`;
export function StatChanges({ before, after }: { before: { stats: CombatStats; intervalMs: number }; after: { stats: CombatStats; intervalMs: number } }) {
  const keys = (Object.keys(after.stats) as (keyof CombatStats)[]).filter(k => (before.stats[k] ?? 0) !== (after.stats[k] ?? 0));
  return <div className="stat-changes" aria-label="ค่าก่อนและหลัง">{keys.length ? keys.map(k => <p key={k}><span>{statLabels[k] ?? k}</span><Diff before={(before.stats[k] ?? 0)} after={(after.stats[k] ?? 0)} keyName={k} /></p>) : <p><span>ค่าต่อสู้</span><span className="diff-same">เท่าเดิม</span></p>}
    {before.intervalMs !== after.intervalMs && <p><span>รอคิวสกิล</span><span className="diff"><s>{seconds(before.intervalMs)}</s> → <b className={after.intervalMs < before.intervalMs ? 'up' : 'down'}>{seconds(after.intervalMs)}</b></span></p>}</div>;
}
function GearTile({ row, slot, pack, state, characterId, upgradeId, onClick }: { row: ItemRow | undefined; slot: EquipmentSlot; pack: GameContext['pack']; state:GameContext['state']; characterId:string; upgradeId?:string; onClick: () => void }) {
  return <button className={`gear-tile rarity-${row?.item.rarity_id ?? 'none'}`} aria-label={`ช่อง ${slotLabels[slot]}${row ? ` · ${row.name}` : ' · ว่าง'}${upgradeId ? ' · มีของที่ดีกว่า' : ''}`} onClick={onClick}>
    {row ? <ItemIcon id={row.iconId} pack={pack} /> : <span className="gear-empty">{slotLabels[slot]}</span>}
    <EquipmentProgress state={state} characterId={characterId} slot={slot} />
    {row && <small className="tier-badge">Lv{row.definition.tier_level}</small>}
    <EquipmentCards state={state} characterId={characterId} slot={slot} />
    {upgradeId && <span className="gear-upgrade-alert" aria-hidden="true" title="มีของที่ดีกว่า" />}
  </button>;
}

function UpgradeSheet({ context, actor, slot, close }: { context: GameContext; actor: Character; slot: EquipmentSlot; close: () => void }) {
  const { state, pack, submit, locked } = context, progress = actor.slot_progress[slot], enchantLines = slotEnchantLines(slot), params = { character_id: actor.character_id, slot };
  const [fx, setFx] = useState<{ ok: boolean; text: string; key: number } | null>(null);
  async function refineNow() {
    const target = progress.refine + 1;
    if (!await submit('slot.refine', { ...params, target_level: target })) return;
    const failed = context.lastCode() === 'REFINE_FAILED';
    setFx({ ok: !failed, text: failed ? 'ล้มเหลว…' : `+${target} สำเร็จ!`, key: Date.now() }); setTimeout(() => setFx(null), 1600);
  }
  const [tab, setTab] = useState<'refine' | 'enchant' | 'card'>('refine'), [line, setLine] = useState<keyof typeof enchantLines>((progress.enchant.line_id as keyof typeof enchantLines | null) ?? 'offense'), [confirmLine, setConfirmLine] = useState(false), [socket, setSocket] = useState(0), [cardId, setCardId] = useState<string | null>(progress.cards[0] ?? null);
  const refine = progress.refine < slotsData.refine.max ? slotUpgradeQuote(progress.refine, progress.refine + 1, 'refine') : null, enchant = progress.enchant.level < 10 ? slotUpgradeQuote(progress.enchant.level, progress.enchant.level + 1, 'enchant') : null;
  const changeLine = progress.enchant.line_id !== null && progress.enchant.line_id !== line;
  const refinePreview = useMemo(() => tab === 'refine' && refine && !state.active_battle ? slotChangePreview(state, actor.character_id, 'slot.refine', { ...params, target_level: progress.refine + 1 }) : null, [state, actor.character_id, slot, tab]);
  const enchantPreview = useMemo(() => tab === 'enchant' && enchant && !changeLine && !state.active_battle ? slotChangePreview(state, actor.character_id, 'slot.enchant', { ...params, line_id: line, target_level: progress.enchant.level + 1 }) : null, [state, actor.character_id, slot, tab, line]);
  const capacity = socketCapacity(progress.refine), cards = useMemo(()=>tab === 'card' ? cardInventory(state, slot) : [],[state,slot,tab]), card = cards.find(c => c.item.instance_id === cardId);
  let cardPreview: ReturnType<typeof slotChangePreview> | null = null;
  if (card && socket < capacity && progress.cards[socket] !== card.item.instance_id && !state.active_battle) cardPreview = slotChangePreview(state, actor.character_id, 'card.assign', { ...params, card_slot: socket, card_instance_id: card.item.instance_id });
  return <Sheet title={`พัฒนาช่อง${slotLabels[slot]} · ${friendNames[actor.character_id]}`} onClose={close} className={tab==='card'?'tall card-upgrade-sheet':'tall'}>
    <div className="seg" role="tablist">{(['refine', 'enchant', 'card'] as const).map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t === 'refine' ? `Refine +${progress.refine}` : t === 'enchant' ? `Enchant ${progress.enchant.level}` : `การ์ด ${progress.cards.filter(Boolean).length}/${capacity}`}</button>)}</div>
    {!actor.equipment[slot] && <p className="hint warn">ช่องนี้ยังไม่มีของสวม ค่าพัฒนาจะเก็บไว้กับช่องจนกว่าจะสวม</p>}
    {tab === 'refine' && <section className="upgrade-pane refine-pane">
      {fx && <div key={fx.key} className={`refine-fx ${fx.ok ? 'ok' : 'fail'}`} role="status"><span className="burst" /><b>{fx.text}</b></div>}
      <div className="level-jump"><b>+{progress.refine}</b><span>→</span><b className="next">{refine ? `+${progress.refine + 1}` : 'MAX'}</b></div>
      {refine && <div className="refine-chance"><b>{refinePercent(nextRefineChance(progress))}</b><span>โอกาสสำเร็จ{progress.refine_failures ? ` · รวมโอกาสสะสมจากพลาด ${progress.refine_failures} ครั้ง` : ''}</span></div>}
      <p className="hint">+1 ถึง +4 สำเร็จแน่นอน · พลาดเสียแค่วัตถุดิบ ระดับไม่ลด {refine && <> · โอกาสสะสมเพิ่ม {refinePercent(nextRefinePityBonus(progress))} ต่อครั้ง</>} · {socketUnlockHint()}</p>
      <p className="hint slot-bonus" aria-label="ผล Refine ต่อขั้น">ต่อ +1 · {refineModifiers(slot).map(modifierText).join(' · ')}</p>
      {refine ? <><CostChips cost={refine} wallet={state.wallet} pack={pack} />{refinePreview && <StatChanges before={refinePreview.before} after={refinePreview.after} />}
        <button className="btn primary wide" disabled={locked || !canPay(state.wallet, refine)} onClick={() => void refineNow()}>Refine +{progress.refine + 1}</button></> : <p className="hint">Refine สูงสุดแล้ว</p>}
    </section>}
    {tab === 'enchant' && <section className="upgrade-pane">
      <div className="chip-row" role="radiogroup" aria-label="สาย Enchant">{(Object.keys(enchantLines) as (keyof typeof enchantLines)[]).map(id => <button key={id} role="radio" aria-checked={line === id} className={`chip ${line === id ? 'on' : ''}`} onClick={() => { setLine(id); setConfirmLine(false); }}>{enchantLines[id]!.label}</button>)}</div>
      <p className="hint slot-bonus" aria-label="ผล Enchant ต่อระดับ">ต่อระดับ · {enchantLines[line]!.modifiers.map(modifierText).join(' · ')}</p>
      {changeLine ? <><p className="hint warn">เปลี่ยนสายแล้วเริ่ม Lv.0 · คืนเฉพาะที่จ่ายจริง</p><CostChips cost={refundEnchant(state, actor.character_id, slot)} wallet={state.wallet} pack={pack} />
        {confirmLine ? <div className="row"><button className="btn primary" disabled={locked} onClick={() => void submit('slot.change_enchant', { ...params, line_id: line })}>ยืนยันเปลี่ยนสาย</button><button className="btn ghost" onClick={() => setConfirmLine(false)}>ยกเลิก</button></div> : <button className="btn wide" disabled={locked} onClick={() => setConfirmLine(true)}>เปลี่ยนเป็นสาย {enchantLines[line]!.label}</button>}</>
        : <><div className="level-jump"><b>Lv.{progress.enchant.level}</b><span>→</span><b className="next">{enchant ? `Lv.${progress.enchant.level + 1}` : 'MAX'}</b></div>
          {enchant ? <><CostChips cost={enchant} wallet={state.wallet} pack={pack} />{enchantPreview && <StatChanges before={enchantPreview.before} after={enchantPreview.after} />}
            <button className="btn primary wide" disabled={locked || !canPay(state.wallet, enchant)} onClick={() => void submit('slot.enchant', { ...params, line_id: line, target_level: progress.enchant.level + 1 })}>Enchant Lv.{progress.enchant.level + 1}</button></> : <p className="hint">Enchant สูงสุดแล้ว</p>}</>}
    </section>}
    {tab === 'card' && <section className="upgrade-pane card-upgrade-pane">
      <div className="socket-row" role="group" aria-label="ช่องการ์ด">{progress.cards.map((id, index) => { const source = cards.find(c => c.item.instance_id === id); return <button key={index} className={`socket ${socket === index ? 'on' : ''}`} disabled={index >= capacity} aria-pressed={socket === index} onClick={() => { setSocket(index); setCardId(id); }}>
        {source ? <span className={`card-art socket-card-art rarity-${source.item.rarity_id}`}><CardIcon card={source} pack={pack} /></span> : <span>{index >= capacity ? <Icon name="lock" /> : '+'}</span>}<small>{index >= capacity ? `ปลด +${socketUnlockRefine(index)}` : source ? source.name : `ช่อง ${index + 1}`}</small>
      </button>; })}</div>
      {progress.cards[socket] && <button className="btn small ghost" disabled={locked} onClick={() => void submit('card.unassign', { ...params, card_slot: socket })}>ถอดการ์ดช่อง {socket + 1}</button>}
      {cards.length ? <div className="card-list">{cards.map(c => <button key={c.item.instance_id} data-card-equipped={!!c.owner} className={`list-row card-pick-row ${c.owner ? 'equipped' : ''} ${cardId === c.item.instance_id ? 'on' : ''}`} onClick={() => setCardId(c.item.instance_id)}>
        <span className={`icon-frame card-thumb rarity-${c.item.rarity_id}`}><CardIcon card={c} pack={pack} /></span><span className="row-main"><b>{c.name} <CardGrade grade={c.origin?.grade} rarity={c.item.rarity_id} variant={c.origin?.variant} /></b><small>{rarityLabels[c.item.rarity_id]} · Lv.{c.item.level}</small><span className="card-pick-description">{[...c.modifiers.map(modifierText),...c.effects].join(' · ')}</span>{c.owner&&<em className="card-worn-label"><Icon name="check" />ใส่อยู่ · <OwnerBadge state={state} characterId={c.owner.character_id} pack={pack}/></em>}</span>
      </button>)}</div> : <p className="hint">ยังไม่มีการ์ดสำหรับช่องนี้</p>}
      <footer className="card-selection-footer" aria-label="ยืนยันใส่การ์ด">
        {card ? <><b className="card-selected-name">{card.name}<span>{rarityLabels[card.item.rarity_id]} · Lv.{card.item.level}</span></b>
          {cardPreview ? <button className="btn primary wide" disabled={locked} onClick={() => void submit('card.assign', { ...params, card_slot: socket, card_instance_id: card.item.instance_id })}>{card.owner ? 'ย้ายมาใส่' : 'ใส่การ์ด'}ช่อง {socket + 1}</button> : <p className="hint">{progress.cards[socket]===card.item.instance_id?'ใส่อยู่ในช่องนี้แล้ว':'ยังใส่ช่องนี้ไม่ได้'}</p>}
          <details className="card-selected-details" key={card.item.instance_id}><summary>รายละเอียด / เปรียบเทียบ / อัปเกรด</summary><div>
            <ul className="card-effects">{card.modifiers.map((m,i)=><li key={i}>{modifierText(m)}{card.nextModifiers?` → ${modifierText(card.nextModifiers[i]!)}`:''}</li>)}{card.effects.map((text,i)=><li key={`e${i}`}>{text}</li>)}</ul>
            {cardPreview&&<StatChanges before={cardPreview.before} after={cardPreview.after}/>}
            {card.owner&&<p className="hint">ย้ายจาก <OwnerBadge state={state} characterId={card.owner.character_id} pack={pack}/> · ช่องเดิมจะว่าง</p>}
            {card.price?<div className="row"><CostChips cost={card.price} wallet={state.wallet} pack={pack}/><button className="btn small" disabled={locked||!canPay(state.wallet,card.price)} onClick={()=>void submit('card.upgrade',{card_instance_id:card.item.instance_id,target_level:card.item.level+1})}>อัปการ์ด Lv.{card.item.level+1}</button></div>:<p className="hint">การ์ดระดับสูงสุดแล้ว</p>}
            <div className="row"><button className="btn small ghost" disabled={locked} onClick={()=>void submit('equipment.lock',{item_instance_id:card.item.instance_id,locked:!card.item.locked})}>{card.item.locked?'ปลดล็อก':'ล็อก'}</button><button className="btn small ghost danger" disabled={locked||card.item.locked||!!card.owner} onClick={()=>void submit('card.salvage',{instance_ids:[card.item.instance_id]})}>ย่อย ({Object.entries(salvageCardsQuote([card.item])).map(([k,n])=>`${resourceNames[k as keyof Wallet]??k} ${n}`).join(' · ')})</button></div>
          </div></details>
        </>:<p className="hint">ยังไม่ได้เลือกการ์ด</p>}
      </footer>
    </section>}
  </Sheet>;
}

function ChangeSheet({ context, actor, slot, upgradeId, close }: { context: GameContext; actor: Character; slot: EquipmentSlot; upgradeId?:string; close: () => void }) {
  const { state, pack, submit, locked } = context, [picked, setPicked] = useState<string | null>(null);
  const rows = useMemo(() => inventoryView(state, actor.character_id).filter(r => r.slot === slot && (slot !== 'weapon' || r.definition.weapon_type === equipmentData.weapon_compatibility[actor.job_id])).sort((a, b) => Number(b.item.instance_id === upgradeId) - Number(a.item.instance_id === upgradeId) || b.definition.required_level - a.definition.required_level || (rarityRank[b.item.rarity_id] ?? 0) - (rarityRank[a.item.rarity_id] ?? 0) || Number(!!a.reason) - Number(!!b.reason)), [state, actor.character_id, actor.job_id, slot, upgradeId]);
  const current = actor.equipment[slot], price = equipmentData.targeted_weapon_purchase.cost_rows.find(r => r.tier_level === 1)!.gold, weapon = equipmentData.weapon_compatibility[actor.job_id]!;
  const fit: Record<string, string> = { ITEM_LEVEL_REQUIRED: 'เลเวลยังไม่ถึง', WEAPON_INCOMPATIBLE: 'อาชีพนี้ใช้ไม่ได้', ITEM_SLOT_MISMATCH: 'ชนิดช่องไม่ตรง' };
  return <Sheet title={`เปลี่ยน${slotLabels[slot]} · ${friendNames[actor.character_id]}`} onClose={close} className="tall">
    <div className="item-list">{rows.map(r => { const mine = current === r.item.instance_id, open = picked === r.item.instance_id, mods = itemModifiers(r.item); let preview: ReturnType<typeof equipmentPreview> | null = null;
      if (open && !r.reason && !mine && !state.active_battle) preview = equipmentPreview(state, actor.character_id, slot, r.item.instance_id);
      return <div key={r.item.instance_id} className={`list-item ${open ? 'open' : ''} ${r.reason ? 'dim' : ''}`}>
        <button className="list-row" aria-expanded={open} onClick={() => setPicked(open ? null : r.item.instance_id)}>
          <span className={`icon-frame rarity-${r.item.rarity_id}`}><ItemIcon id={r.iconId} pack={pack} />{(mine || r.owner) && <i className="e-badge">E</i>}{r.owner && <><EquipmentCards state={state} characterId={r.owner.character_id} slot={r.owner.slot} /><EquipmentProgress state={state} characterId={r.owner.character_id} slot={r.owner.slot} /></>}</span>
          <span className="row-main"><b>{r.name}</b><small>{rarityLabels[r.item.rarity_id]} · Lv.{r.definition.required_level}{r.item.training ? ' · ฝึกหัด' : ''}{r.item.locked && <> · <Icon name="lock" /> ล็อก</>}</small><small className="mods">{mods.slice(0, 2).map(modifierText).join(' · ')}</small></span>
          <span className="row-side">{r.item.instance_id === upgradeId ? <span className="gear-upgrade-tag" role="img" aria-label="อุปกรณ์ที่ดีกว่า" title="อุปกรณ์ที่ดีกว่า"><Icon name="chevrons-up" /></span> : mine ? <em className="tag on">สวมอยู่ <OwnerBadge state={state} characterId={actor.character_id} pack={pack}/></em> : r.owner ? <em className="tag"><OwnerBadge state={state} characterId={r.owner.character_id} pack={pack}/></em> : r.reason ? <em className="tag warn">{fit[r.reason] ?? r.reason}</em> : null}</span>
        </button>
        {open && <div className="list-detail"><OptionLines item={r.item} />{r.reason ? <p className="hint warn">{fit[r.reason] ?? reasonText[r.reason] ?? r.reason}</p> : mine ? <div className="row"><p className="hint">กำลังสวมอยู่</p><button className="btn small ghost" disabled={locked} onClick={() => void submit('equipment.unequip', { character_id: actor.character_id, slot })}>ถอดออก</button></div>
          : <>{preview && <StatChanges before={preview.before} after={preview.after} />}{r.owner && <p className="hint">ย้ายจาก <OwnerBadge state={state} characterId={r.owner.character_id} pack={pack}/> · ช่องของเขาจะว่าง</p>}<button className="btn primary wide" disabled={locked} onClick={() => void submit('equipment.equip', { character_id: actor.character_id, slot, item_instance_id: r.item.instance_id }).then(ok => { if (ok) close(); })}>{r.owner ? 'ย้ายมาสวม' : 'สวมใส่'}</button></>}</div>}
      </div>; })}
      {!rows.length && <p className="hint">ยังไม่มีของสำหรับช่องนี้</p>}</div>
    {slot === 'weapon' && <div className="buy-box"><span>ซื้อ{weaponLabels[weapon]}ฝึกหัด Lv.1<small>ผสมไม่ได้ · ย่อยได้ 0</small></span><button className="btn small" disabled={locked || state.wallet.gold < price || state.inventory.length >= equipmentData.inventory_capacity} onClick={() => void submit('equipment.purchase_weapon', { character_id: actor.character_id, weapon_type: weapon, tier_level: 1 })}>{price.toLocaleString()} ทอง</button></div>}
  </Sheet>;
}

function SlotSheet({ context, actor, slot, close, open }: { context: GameContext; actor: Character; slot: EquipmentSlot; close: () => void; open: (s: 'upgrade' | 'change') => void }) {
  const { state, pack } = context, row = inventoryView(state, actor.character_id).find(r => r.item.instance_id === actor.equipment[slot]), progress = actor.slot_progress[slot];
  return <Sheet title={slotLabels[slot]} onClose={close}>
    <div className="slot-summary">
      <span className={`icon-frame big rarity-${row?.item.rarity_id ?? 'none'}`}>{row ? <ItemIcon id={row.iconId} pack={pack} /> : <span className="gear-empty">ว่าง</span>}<EquipmentCards state={state} characterId={actor.character_id} slot={slot} /><EquipmentProgress state={state} characterId={actor.character_id} slot={slot} /></span>
      <div><b>{row?.name ?? 'ยังไม่ได้สวม'}</b>{row && <small>{rarityLabels[row.item.rarity_id]} · Lv.{row.definition.required_level}</small>}{row && <small className="mods">{itemModifiers(row.item).map(modifierText).join(' · ')}</small>}{row && <OptionLines item={row.item} />}</div>
    </div>
    <ul className="slot-facts"><li><span>Refine</span><b>+{progress.refine}</b></li><li><span>Enchant</span><b>{progress.enchant.line_id ? `${slotEnchantLines(slot)[progress.enchant.line_id]?.label??progress.enchant.line_id} Lv.${progress.enchant.level}` : '—'}</b></li><li><span>การ์ด</span><b>{progress.cards.filter(Boolean).length} / {socketCapacity(progress.refine)}</b></li></ul>
    <div className="row two"><button className="btn primary" onClick={() => open('upgrade')}><Icon name="upgrade" /> อัปเกรด</button><button className="btn" onClick={() => open('change')}>⇄ เปลี่ยน</button></div>
  </Sheet>;
}

function CharacterUpgradeSheet({ context, actor, close }: { context: GameContext; actor: Character; close: () => void }) {
  const { state, pack, submit, locked } = context, cap = effectiveLevelCap(actor, data), [job, setJob] = useState(actor.job_id), [reset, setReset] = useState(false);
  const cost = actor.level < cap ? levelQuote(actor, actor.level + 1, data) : null;
  let best = actor.level; for (let t = actor.level + 1; t <= cap; t++) { if (canPay(state.wallet, levelQuote(actor, t, data))) best = t; else break; }
  const gate = data.progression.breakthrough_gates.find(g => g.at_level === actor.level && actor.local_cap === actor.level && !actor.completed_gate_ids.includes(g.at_level));
  const jobs = actor.kind === 'main' ? roots.flatMap(r => [r, ...data.class_tree[r]]) : [actor.root_job_id, ...data.class_tree[actor.root_job_id]];
  const refund = state.paid_ledger.filter(e => e.character_id === actor.character_id && e.feature_id === 'skill' && e.refund_state === 'active').reduce((sum, e) => { for (const k of Object.keys(sum) as (keyof Wallet)[]) sum[k] += e.paid_resources[k]; return sum; }, Object.fromEntries(Object.keys(state.wallet).map(k => [k, 0])) as Wallet);
  return <Sheet title={`อัปเกรด ${friendNames[actor.character_id]}`} onClose={close} className="tall">
    <section className="upgrade-pane"><h3>เลเวล</h3>
      <div className="level-jump"><b>Lv.{actor.level}</b><span>→</span><b className="next">{cost ? `Lv.${actor.level + 1}` : actor.level === data.release.level_cap ? 'MAX' : 'รอ Breakthrough'}</b><small>เพดาน {cap}</small></div>
      {cost && <><CostChips cost={cost} wallet={state.wallet} pack={pack} /><div className="row two"><button className="btn primary" disabled={locked || !canPay(state.wallet, cost)} onClick={() => void submit('character.level_up', { character_id: actor.character_id, target_level: actor.level + 1 })}>อัป +1</button>
        <button className="btn" disabled={locked || best <= actor.level + 1} onClick={() => void submit('character.level_up', { character_id: actor.character_id, target_level: best })}>อัปถึง Lv.{Math.max(best, actor.level + 1)}</button></div></>}
    </section>
    {gate && <section className="upgrade-pane highlight"><h3>Breakthrough Lv.{gate.at_level}</h3><p className="hint">ปลดเพดานถึง Lv.{Math.min(data.release.level_cap, gate.unlocks_local_cap)}</p><CostChips cost={gate.cost} wallet={state.wallet} pack={pack} />
      <button className="btn primary wide" disabled={locked || !canPay(state.wallet, gate.cost)} onClick={() => void submit('character.breakthrough', { character_id: actor.character_id, gate_level: gate.at_level })}>Breakthrough</button></section>}
    <section className="upgrade-pane"><h3>เปลี่ยนอาชีพ</h3>
      <div className="chip-row">{jobs.map(j => { const class2 = !roots.includes(j as RootJob), lockedJob = class2 && actor.level < data.promotion.class2_min_level; return <button key={j} className={`chip job-chip ${job === j ? 'on' : ''}`} disabled={lockedJob} onClick={() => setJob(j)}><ClassIcon pack={pack} job={j} size={18} />{jobNames[j]}{lockedJob ? ` · Lv.${data.promotion.class2_min_level}` : ''}</button>; })}<button className="chip job-chip hi-class" disabled title="Hi-class เปิดในรุ่นถัดไป (Lv.70)"><Icon name="sparkles" /> Hi-class · เร็วๆ นี้</button></div>
      {job !== actor.job_id ? <><p className="hint">เปลี่ยนฟรี · รีเซ็ต Status/สกิลและคืนทุนที่จ่ายจริง · อาวุธที่ใช้ไม่ได้กลับเข้ากระเป๋า</p><CostChips cost={refund} wallet={state.wallet} pack={pack} />
        <button className="btn primary wide" disabled={locked} onClick={() => void submit('character.change_job', { character_id: actor.character_id, job_id: job })}>เปลี่ยนเป็น {jobNames[job]}</button></> : <p className="hint">อาชีพปัจจุบัน: {jobNames[actor.job_id]}{actor.kind === 'npc' ? ' · เพื่อนเปลี่ยนได้ภายในสายเดิม' : ''}</p>}
    </section>
    <section className="upgrade-pane"><h3>รีเซ็ตบิลด์</h3><p className="hint">คืนแต้ม Status และทุนสกิลที่จ่ายจริง · เลเวลและการพัฒนาช่องอุปกรณ์ยังอยู่</p>
      {reset ? <div className="row"><button className="btn danger" disabled={locked} onClick={() => void submit('character.reset_build', { character_id: actor.character_id, features: ['stats', 'skills'] }).then(() => setReset(false))}>ยืนยันรีเซ็ต</button><button className="btn ghost" onClick={() => setReset(false)}>ยกเลิก</button></div> : <button className="btn ghost wide" disabled={locked} onClick={() => setReset(true)}>รีเซ็ต Status / สกิล</button>}
    </section>
  </Sheet>;
}

export function RosterStrip({ context }: { context: GameContext }) {
  const { state, pack, characterId, selectCharacter } = context;
  const ordered = orderedCharacters(state);
  return <div className="roster-strip" role="tablist" aria-label="เลือกตัวละคร">{ordered.map(a => { const inTeam = state.team.some(p => p.character_id === a.character_id); return <button key={a.character_id} role="tab" aria-selected={characterId === a.character_id} className={`roster-card ${inTeam ? 'in-team' : ''} ${characterId === a.character_id ? 'on' : ''}`} onClick={() => selectCharacter(a.character_id)}>
    <ActorCanvas pack={pack} look={lookOf(a, state)} width={72} height={84} scale={1.5} footY={128} /><span className="roster-class"><ClassIcon pack={pack} job={a.job_id} size={18} /></span><span className="roster-name">{inTeam && <i className="team-dot" aria-label="อยู่ในทีม" />}{friendNames[a.character_id]}</span><span className="roster-lv">{a.level}</span>
  </button>; })}</div>;
}

export function BuddyPage({ context }: { context: GameContext }) {
  const { state, pack, characterId, go } = context, actor = state.roster.find(a => a.character_id === characterId)!, items = useMemo(() => inventoryView(state, actor.character_id), [state, actor.character_id]);
  const upgrades = useMemo(() => equipmentUpgradeHints(state, actor.character_id, items), [state, actor.character_id, items]);
  const [slot, setSlot] = useState<EquipmentSlot | null>(null), [sheet, setSheet] = useState<'slot' | 'upgrade' | 'change' | 'character' | null>(null);
  const inTeam = state.team.some(p => p.character_id === actor.character_id), row = (s: EquipmentSlot) => items.find(i => i.item.instance_id === actor.equipment[s]);
  const tile = (s: EquipmentSlot) => <GearTile key={s} row={row(s)} slot={s} pack={pack} state={state} characterId={actor.character_id} upgradeId={upgrades[s]} onClick={() => { setSlot(s); setSheet('slot'); }} />;
  const statsIcon = iconUrl(pack, 'ui_icons', 'stats'), skillIcon = iconUrl(pack, 'ui_icons', 'skill'), upgradeIcon = iconUrl(pack, 'ui_icons', 'upgrade');
  return <div className="page buddy-page">
    <PageHeader title={<>{friendNames[actor.character_id]} <span className="title-class"><ClassIcon pack={pack} job={actor.job_id} size={20} /><em>{jobNames[actor.job_id]}</em></span></>} sub={`Lv.${actor.level} / ${effectiveLevelCap(actor, data)} · ${inTeam ? 'อยู่ในทีม' : 'พักอยู่ในค่าย'}${actor.unspent_status_points ? ` · แต้มเหลือ ${actor.unspent_status_points}` : ''}`} onBack={() => go('home')} />
    <section className="showcase">
      <div className="gear-col">{leftSlots.map(tile)}</div>
      <div className="hero-stage"><ActorCanvas pack={pack} look={lookOf(actor, state)} width={220} height={250} scale={2.7} footY={226} animate className="hero-canvas" /><span className="hero-plinth" /></div>
      <div className="gear-col">{rightSlots.map(tile)}</div>
    </section>
    <div className="action-row">
      <button className="action-btn" onClick={() => go('stats', actor.character_id)}>{statsIcon ? <img src={statsIcon} alt="" /> : <Icon name="chart" />}<span>Stats</span>{actor.unspent_status_points > 0 && <i className="dot" />}</button>
      <button className="action-btn" onClick={() => go('skills', actor.character_id)}>{skillIcon ? <img src={skillIcon} alt="" /> : <Icon name="book" />}<span>Skill</span></button>
      <button className="action-btn" onClick={() => setSheet('character')}><img className="upgrade-icon" src={upgradeIcon ?? undefined} alt="" /><span>Upgrade</span></button>
    </div>
    <RosterStrip context={context} />
    {sheet === 'slot' && slot && <SlotSheet context={context} actor={actor} slot={slot} close={() => setSheet(null)} open={s => setSheet(s)} />}
    {sheet === 'upgrade' && slot && <UpgradeSheet context={context} actor={actor} slot={slot} close={() => setSheet(null)} />}
    {sheet === 'change' && slot && <ChangeSheet context={context} actor={actor} slot={slot} upgradeId={upgrades[slot]} close={() => setSheet(null)} />}
    {sheet === 'character' && <CharacterUpgradeSheet context={context} actor={actor} close={() => setSheet(null)} />}
  </div>;
}
