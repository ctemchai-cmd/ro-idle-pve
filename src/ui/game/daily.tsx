import { MonsterSizeBadge } from '../monster-size-badge.tsx';
import { Icon } from '../icon.tsx';
import { dailyView } from '../../client/story.ts';
import type { GameContext } from './shell.tsx';
import { PageHeader, ResIcon, compact, full, iconUrl, type Wallet } from './kit.tsx';

const name = (id: string) => id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/** Daily dungeon (TASK-036): three multi-phase bosses, 3 attempts each per server Bangkok day; HP carries between attempts. */
export function DailyPage({ context }: { context: GameContext }) {
  const { state, pack, locked, go, challenge, submit } = context, view = dailyView(state, Date.now()), icon = iconUrl(pack, 'ui_icons', 'boss_active');
  return <div className="page daily-page">
    <PageHeader title="ดันเจี้ยนรายวัน" sub={`วันที่ ${view.day} (เวลาไทย) · รีเซ็ต 00:00`} onBack={() => go('dungeon')} />
    {!view.unlocked ? <div className="tower-locked"><b><Icon name="lock" /> ยังไม่เปิด</b><p>ผ่านบอสด่าน {view.unlock_after} ใน Story เพื่อเปิดดันเจี้ยนรายวัน</p></div>
      : <div className="daily-list">{view.bosses.map(boss => <article key={boss.id} className="daily-card">
        <header>{icon ? <img src={icon} alt="" /> : <Icon name="adventure" />}<div><b>{boss.name}</b><MonsterSizeBadge size={boss.size} /><small>{name(boss.enemy)} · บท {boss.chapter} · {boss.time_limit_ms / 1000} วินาที/ครั้ง</small></div><em className={`tag ${boss.attempts_left ? 'on' : ''}`}>เหลือ {boss.attempts_left}/{boss.attempts}</em></header>
        {(boss.phase > 1 || boss.hp < boss.max_hp) && <p className="daily-carry">↻ เลือดต่อจากรอบก่อนของวันนี้ · เริ่มใหม่ 00:00</p>}
        <div className="daily-phase"><span>หลอดที่ {boss.phase}</span><div className="bar hp"><i style={{ width: `${boss.hp / boss.max_hp * 100}%` }} /><span>{compact(boss.hp)} / {compact(boss.max_hp)}</span></div></div>
        <div className="daily-chest"><small>กล่องเมื่อทำลายหลอดนี้</small>{(Object.entries(boss.chest) as [keyof Wallet, number][]).filter(([, n]) => n > 0).map(([k, n]) => <span key={k}><ResIcon pack={pack} k={k} />{full(n)}</span>)}{boss.chapter>=8&&<span className="artifact-daily-reward">Essence 5{boss.phase%10===0?' · ตั๋ว Artifact 1':''}</span>}<small className="daily-got">วันนี้ได้แล้ว {boss.chests_today} กล่อง</small></div>
        {boss.pending_claim_ids.length > 0 ? <button className="btn primary wide" disabled={locked} onClick={() => void submit('reward.claim', {claim_ids:boss.pending_claim_ids})}><Icon name="gift" />รับรางวัล ({boss.pending_chests} กล่อง)</button> : <button className="btn primary wide" disabled={locked || boss.attempts_left <= 0} onClick={() => challenge({ kind: 'daily', boss: boss.id })}>{boss.attempts_left > 0 ? 'ท้าบอส' : 'หมดสิทธิ์วันนี้'}</button>}
      </article>)}</div>}
    <p className="hint">หักสิทธิ์เมื่อรับรางวัลสำเร็จ 1 ครั้งต่อรอบ · ความเสียหายที่ทำไว้สะสมข้ามครั้งในวันเดียวกัน · ทำลายหลอดแล้วหลอดใหม่ที่แข็งขึ้นมาทันที</p>
  </div>;
}
