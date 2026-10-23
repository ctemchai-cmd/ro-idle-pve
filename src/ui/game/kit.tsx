import { statNames } from '../../client/status-labels.ts';
import { SaveNotice } from './save-notice.tsx';
import { cardStatUnits, statHigherIsBetter } from '../../client/slots.ts';
import { Icon } from '../icon.tsx';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { AccountState, CombatStats } from '../../contracts/index.ts';
import type { AssetPack } from '../../renderer/pack.ts';
import type { ActorParts } from '../../renderer/native.mjs';
import { drawActor } from '../../renderer/native.mjs';
import { shellIconUrl, wardrobeRefs } from '../../renderer/shell.ts';
import { wardrobeTiers } from '../../client/equipment.ts';

export type Wallet = AccountState['wallet'];
export type Submit = (type: string, params: unknown, requestId?: string) => Promise<boolean>;
export const friendNames: Record<string, string> = { main: 'คุณ', npc_swordsman: 'ไคล์', npc_acolyte: 'ลูเมน', npc_archer: 'อารี', npc_mage: 'เรน', npc_thief: 'นิกซ์', npc_merchant: 'มิโล' };
export const jobNames: Record<string, string> = { swordsman: 'Swordsman', acolyte: 'Acolyte', archer: 'Archer', mage: 'Mage', thief: 'Thief', merchant: 'Merchant', knight: 'Knight', crusader: 'Crusader', priest: 'Priest', monk: 'Monk', hunter: 'Hunter', bard: 'Bard', dancer: 'Dancer', wizard: 'Wizard', sage: 'Sage', assassin: 'Assassin', rogue: 'Rogue', blacksmith: 'Blacksmith', alchemist: 'Alchemist' };
export const jobRoles: Record<string, string> = { swordsman: 'แนวหน้า ทนทาน ป้องกันเพื่อน', acolyte: 'ฮีลและบัฟทีม', archer: 'ยิงระยะไกล ดาเมจต่อเนื่อง', mage: 'เวทธาตุ ดาเมจหมู่', thief: 'โจมตีเร็ว คริและพิษ', merchant: 'ทุบหนัก สนับสนุนด้วยของ' };
export const resourceNames: Record<keyof Wallet, string> = { gold: 'ทอง', hero_exp: 'EXP', skill_manual: 'คู่มือสกิล', refine_ore: 'แร่ Refine', breakthrough_essence: 'Essence', enchant_dust: 'ผง Enchant', card_dust: 'ผงการ์ด', crystal: 'Crystal' };
export const mapNames: Record<string, string> = { prt_fild08: 'ทุ่งปรอนเทรา', pay_fild01: 'ป่าเพยอน', moc_fild01: 'ทะเลทรายมอร็อค', gef_dun00: 'ใต้ดินเกฟเฟน', iz_dun01: 'ถ้ำไบอาลาน', prontera: 'เมืองปรอนเทรา' };
export const reasonText: Record<string, string> = {
  CONSUMABLE_EMPTY: 'ไม่มีใบธาตุนี้ในคลัง', INVALID_CONSUMABLE: 'ไม่พบใบธาตุนี้', CONSUMABLE_ALREADY_PREPARED: 'เตรียมใบนี้ไว้แล้ว',
  DAILY_CLOCK_ALREADY_REFUNDED: 'คืนสิทธิ์รอบที่ค้างให้แล้ว', DAILY_CLOCK_NOT_AFFECTED: 'ไม่พบรอบที่ค้างซึ่งยังคืนสิทธิ์ได้',
  INSUFFICIENT_RESOURCES: 'ทรัพยากรยังไม่พอ', INSUFFICIENT_STATUS_POINTS: 'แต้ม Status ยังไม่พอ', LEVEL_CAP_REACHED: 'ต้อง Breakthrough ก่อนอัปเลเวลต่อ', INVALID_TEAM: 'เลือกเพื่อนสามคนจากคนละสาย Class 1 และต้องมีตัวหลัก', BUILD_LOCKED_DURING_BATTLE: 'จบหรือออกจากไฟต์ก่อนปรับตัวละคร', INVENTORY_FULL: 'กระเป๋าเต็ม กรุณาจัดของก่อน', NPC_ROOT_IMMUTABLE: 'เพื่อนเปลี่ยนได้ภายในสายเดิม', CLASS_LEVEL_REQUIRED: 'Class 2 เปิดที่เลเวล 20', WRITER_NOT_READY: 'รอเซฟพร้อมก่อนลองอีกครั้ง', NETWORK_UNAVAILABLE: 'ขาดการเชื่อมต่อ กรุณาเชื่อมต่อใหม่', SKILL_CAP_REACHED: 'อัปเลเวลตัวละครก่อนเพิ่มระดับสกิล', SKILL_LOCKED: 'เลเวลยังไม่ถึงจุดปลดสกิล', SKILL_UNAVAILABLE: 'สกิลนี้ไม่ตรงอาชีพปัจจุบัน', DUPLICATE_SKILL_SLOT: 'สกิลเดียวกันใส่ได้ช่องเดียว', SKILL_NOT_LEARNED_ACTIVE: 'เลือก Active ที่เรียนแล้วเท่านั้น', EXCLUSIVE_SKILL_GROUP: 'สกิลกลุ่มคัดลอกใส่ได้ครั้งละหนึ่งท่า', ITEM_LOCKED: 'ปลดล็อกของก่อน', ITEM_EQUIPPED: 'ถอดของออกจากตัวละครก่อน', WEAPON_INCOMPATIBLE: 'อาชีพนี้ใช้อาวุธชนิดนี้ไม่ได้', ITEM_LEVEL_REQUIRED: 'เลเวลยังไม่ถึงสำหรับของชิ้นนี้', ITEM_NOT_FOUND: 'ไม่พบของชิ้นนี้ กรุณาโหลดเซฟอีกครั้ง', ITEM_ALREADY_EQUIPPED: 'สวมของชิ้นนี้อยู่แล้ว', UPGRADE_CAP_REACHED: 'ถึงเพดานการพัฒนาแล้ว', UPGRADE_LEVEL_UNCHANGED: 'ระดับนี้พัฒนาไปแล้ว กรุณาโหลดค่าปัจจุบัน', ENCHANT_LINE_CONFLICT: 'เปลี่ยนสาย Enchant ก่อนพัฒนาสายใหม่', CARD_SLOT_LOCKED: 'Refine เพิ่มเพื่อปลดช่องการ์ดนี้', CARD_SLOT_MISMATCH: 'การ์ดนี้ใช้กับช่องอุปกรณ์ชนิดอื่น', FUSION_MISMATCH: 'ของผสมต้องมีชนิด Tier และ rarity ตรงกัน', RARITY_MAX_REACHED: 'Supreme เป็น rarity สูงสุดแล้ว', TIER_UPGRADE_DISABLED: 'อุปกรณ์ระดับสูงหาได้จากดรอปหรือกาชา', TRAINING_WEAPON_RESTRICTED: 'อาวุธฝึกหัดผสมไม่ได้',
  STAGE_LOCKED: 'ผ่านด่านก่อนหน้าเพื่อท้าบอสนี้', TOWER_FLOOR_LOCKED: 'ผ่านชั้นก่อนหน้า (และด่าน 2-10) เพื่อท้าชั้นนี้', TOWER_FLOOR_OVERFLOW: 'ชั้นนี้สูงเกินกว่าที่ระบบรองรับ', DAILY_LOCKED: 'ผ่านด่าน 1-10 เพื่อเปิดดันเจี้ยนรายวัน', DAILY_NO_ATTEMPTS: 'ใช้สิทธิ์บอสนี้ครบแล้ววันนี้ รีเซ็ต 00:00', DAILY_RECORD_MISSING: 'ไม่พบข้อมูลรอบของวันนั้น', PENDING_REWARDS_FULL: 'รับรางวัลที่ค้างไว้ก่อน', FARM_NOT_SELECTED: 'ผ่านด่านแรกเพื่อเริ่มฟาร์ม', BATTLE_BUILD_UNAVAILABLE: 'ยังเริ่มไฟต์ด้วยทีมนี้ไม่ได้ กรุณาตรวจทีมและสกิล', BATTLE_LEASE_EXPIRED: 'ไฟต์หยุดไปแล้ว เชื่อมต่อเซฟเพื่อเตรียมทีมใหม่', BATTLE_TICKET_EXPIRED: 'ไฟต์หยุดไปแล้ว เชื่อมต่อเซฟเพื่อลองใหม่', NO_FARM_ELAPSED: 'ยังไม่มีช่วงฟาร์มใหม่ให้รับ',
};
export const statLabels: Partial<Record<keyof CombatStats, string>> = { max_hp: 'HP', max_sp: 'SP', physical_attack: 'ATK', magical_attack: 'MATK', physical_defense: 'DEF', magical_defense: 'MDEF', attack_speed: 'ASPD', cast_speed: 'CSPD', hit_bonus: 'ความแม่นยำ', evasion_bonus: 'การหลบ', crit_chance_bonus: 'โอกาสคริ', crit_damage_bonus: 'ดาเมจคริ', crit_resistance: 'ต้านคริ', control_accuracy: 'โอกาสติดสถานะ', control_resistance: 'ต้านสถานะ / สตั้น', outgoing_physical_bonus: 'ดาเมจกายภาพ', outgoing_magical_bonus: 'ดาเมจเวท', outgoing_true_bonus: 'ดาเมจจริง', damage_taken_bonus: 'ดาเมจที่ได้รับ', guard_percent: 'ลดดาเมจ', armor_break_percent: 'ทำลายเกราะ', penetration_percent: 'เจาะเกราะ (Ignore DEF)', flat_penetration: 'เจาะเกราะคงที่', flat_damage_reduction: 'ลดดาเมจคงที่', outgoing_healing_bonus: 'พลังฮีล', healing_received_bonus: 'การรับฮีล', hp_regen_percent: 'ฟื้น HP %', sp_regen_percent: 'ฟื้น SP %', flat_hp_regen: 'ฟื้น HP', flat_sp_regen: 'ฟื้น SP', str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK' };
Object.assign(statLabels, Object.fromEntries(Object.entries(statNames).filter(([key]) => !(key in statLabels))));
export const ratioStats = new Set<string>(Object.entries(cardStatUnits).filter(([, unit]) => unit === 'ratio').map(([id]) => id));
export const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'immortal', 'supreme'];

export const full = (n: number) => Math.round(n).toLocaleString('th-TH');
export function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(abs >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(abs >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e4) return (n / 1e3).toFixed(abs >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return full(n);
}
export function statValue(key: string, n: number): string {
  if (ratioStats.has(key)) return (n * 100).toLocaleString('th-TH', { maximumFractionDigits: 1 }) + '%';
  return n.toLocaleString('th-TH', { maximumFractionDigits: 1 });
}
export const seconds = (ms: number) => (ms / 1000).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + 's';
export function duration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(total / 3600), m = Math.floor(total % 3600 / 60), s = total % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
export function canPay(wallet: Wallet, cost: Partial<Wallet> | null | undefined): boolean {
  return !!cost && Object.entries(cost).every(([k, n]) => wallet[k as keyof Wallet] >= (n ?? 0));
}

export function iconUrl(pack: AssetPack | null, group: 'ui_icons' | 'resource_icons' | 'feature_icons', key: string): string | null {
  if (!pack) return null;
  try { return shellIconUrl(pack.index, group, key); } catch { return null; }
}
export function ResIcon({ pack, k }: { pack: AssetPack | null; k: string }) {
  const url = iconUrl(pack, 'resource_icons', k);
  return url ? <img className="res-icon" src={url} alt="" /> : <span className={`res-icon res-glyph res-${k}`} aria-hidden="true">{k === 'hero_exp' ? 'EXP' : '◆'}</span>;
}
/** Cost row with the player's current stock; missing amounts are highlighted, not hidden. */
export function CostChips({ cost, wallet, pack }: { cost: Partial<Wallet>; wallet: Wallet; pack: AssetPack | null }) {
  const rows = Object.entries(cost).filter(([, n]) => n) as [keyof Wallet, number][];
  if (!rows.length) return <span className="cost-free">ฟรี</span>;
  return <span className="cost-chips">{rows.map(([k, n]) => <span key={k} className={`cost-chip ${wallet[k] < n ? 'short' : ''}`} title={`${resourceNames[k]} ${full(n)} · มี ${full(wallet[k])}`}><ResIcon pack={pack} k={k} /><b>{compact(n)}</b><small>/{compact(wallet[k])}</small></span>)}</span>;
}

export function ItemIcon({ id, pack, className = '' }: { id: string | null; pack: AssetPack | null; className?: string }) {
  const [loaded, setLoaded] = useState<{id:string;pack:AssetPack;url:string}|null>(null);
  const url = id && pack ? pack.peekAsset(id)?.image.src ?? (loaded?.id === id && loaded.pack === pack ? loaded.url : null) : null;
  useEffect(() => { let active = true; if (id && pack && !pack.peekAsset(id)) void pack.asset(id).then(a => { if (active) setLoaded({id,pack,url:a.image.src}); }).catch(() => {}); return () => { active = false; }; }, [id, pack]);
  return url ? <img className={`item-icon ${className}`} src={url} alt="" /> : <span className={`item-icon item-placeholder ${className}`} aria-hidden="true">◇</span>;
}

interface ActorLook { job_id: string; gender: string; weapon: boolean; head_tier?: number | null; garment_tier?: number | null }
async function actorParts(pack: AssetPack, look: ActorLook): Promise<ActorParts | null> {
  const preset = pack.index.actor_jobs.find(j => j.job_id === look.job_id)?.presets.find(p => p.gender === look.gender);
  if (!preset) return null;
  const worn = wardrobeRefs(pack.index, look.job_id, look.gender, look);
  const [body, head, weapon, headgear, garment] = await Promise.all([pack.asset(preset.body.meta), preset.head ? pack.asset(preset.head.meta) : null, look.weapon && preset.weapon ? pack.asset(preset.weapon.meta) : null, worn.headgear ? pack.asset(worn.headgear) : null, worn.garment ? pack.asset(worn.garment) : null]);
  return { body, ...(head ? { head } : {}), ...(weapon ? { weapon } : {}), ...(headgear ? { headgear } : {}), ...(garment ? { garment } : {}), attackIndex: preset.attack_source_action_index };
}
/** Native sprite drawn into a DOM canvas; `animate` loops the idle clip for showcase screens. */
export function ActorCanvas({ pack, look, width, height, scale, footY, animate = false, className }: { pack: AssetPack | null; look: ActorLook; width: number; height: number; scale: number; footY: number; animate?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true, raf = 0; const ctx = ref.current?.getContext('2d'); if (!ctx || !pack) return;
    void actorParts(pack, look).then(parts => {
      if (!active || !parts) return; const start = performance.now();
      const draw = (now: number) => { if (!active) return; ctx.clearRect(0, 0, width, height); ctx.imageSmoothingEnabled = false; drawActor(ctx, parts, 'idle', animate ? now - start : 0, width / 2, footY, 'right', scale); if (animate) raf = requestAnimationFrame(draw); };
      draw(start);
    }).catch(() => {});
    return () => { active = false; cancelAnimationFrame(raf); };
  }, [pack, look.job_id, look.gender, look.weapon, look.head_tier, look.garment_tier, width, height, scale, footY, animate]);
  return <canvas ref={ref} className={className} width={width} height={height} aria-hidden="true" />;
}
export const lookOf = (a: AccountState['roster'][number], state?: AccountState): ActorLook => ({ job_id: a.job_id, gender: a.gender, weapon: !!a.equipment.weapon, ...(state ? wardrobeTiers(state, a.character_id) : {}) });

/** Modal bottom sheet with native dialog focus handling; returns focus to its opener. */
export function Sheet({ title, onClose, children, className = '' }: { title: ReactNode; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null), titleId = useId();
  useEffect(() => { const node = ref.current!, opener = document.activeElement; if (!node.open) node.showModal(); return () => { if (node.open) node.close(); if (opener instanceof HTMLElement && opener.isConnected) opener.focus(); }; }, []);
  return <dialog ref={ref} aria-labelledby={titleId} className={`sheet ${className}`} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet-body"><header className="sheet-head"><h2 id={titleId}>{title}</h2><button className="icon-btn" autoFocus aria-label="ปิด" onClick={onClose}><Icon name="close" /></button></header><SaveNotice />{children}</div>
  </dialog>;
}
export function PageHeader({ title, sub, onBack, right }: { title: ReactNode; sub?: ReactNode; onBack: () => void; right?: ReactNode }) {
  return <header className="page-head"><button className="back-btn" aria-label="ย้อนกลับ" onClick={onBack}>‹</button><div className="page-title"><h1>{title}</h1>{sub && <small>{sub}</small>}</div>{right && <div className="page-head-right">{right}</div>}</header>;
}
export function Diff({ before, after, keyName }: { before: number; after: number; keyName: string }) {
  if (before === after) return <span className="diff-same">{statValue(keyName, after)}</span>;
  const better = statHigherIsBetter(keyName) ? after > before : after < before;
  return <span className="diff"><s>{statValue(keyName, before)}</s> → <b className={better ? 'up' : 'down'}>{statValue(keyName, after)}</b></span>;
}
