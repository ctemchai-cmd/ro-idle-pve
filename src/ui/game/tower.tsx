import { Icon } from '../icon.tsx';
import { sceneLabels, towerView } from '../../client/story.ts';
import type { GameContext } from './shell.tsx';
import { PageHeader, ResIcon, compact, full, iconUrl } from './kit.tsx';

const labels = sceneLabels().skill_labels;
const name = (id: string) => id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/** Infinity Tower (TASK-035): climb from the frontier, first clear pays once, cleared floors replay without rewards. */
export function TowerPage({ context }: { context: GameContext }) {
  const { state, pack, locked, go, challenge } = context, highest = state.tower.highest_cleared_floor;
  const view = towerView(state, Math.max(1, highest - 3), 9), next = view.floors.find(f => f.floor === highest + 1)!;
  const bossIcon = iconUrl(pack, 'ui_icons', 'boss');
  if (!view.unlocked) return <div className="page tower-page">
    <PageHeader title="หอคอยไร้ขีดจำกัด" sub="Infinity Tower" onBack={() => go('dungeon')} />
    <div className="tower-locked"><b><Icon name="lock" /> ยังไม่เปิด</b><p>ผ่านบอสด่าน {view.unlock_after} ใน Story เพื่อเปิดหอคอย</p></div>
  </div>;
  return <div className="page tower-page">
    <PageHeader title="หอคอยไร้ขีดจำกัด" sub={`ผ่านสูงสุดชั้น ${highest} · ไม่รีเซ็ต`} onBack={() => go('dungeon')} />
    <section className="tower-hero">
      <div className="tower-floor-badge"><small>ชั้น</small><b>{next.floor}</b></div>
      <div className="tower-boss">
        <b>{name(next.boss)}{next.adaptive && <em className="tag warn" title="ต้านสถานะเพิ่มทุกครั้งที่โดน CC">ปรับตัว</em>}</b>
        <ul className="tower-stats"><li><span>HP</span>{compact(next.row.hp)}</li><li><span>ATK</span>{full(next.row.attack)}</li><li><span>DEF</span>{full(next.row.defense)}</li></ul>
        <small className="tower-skills">{next.skills.map(id => labels[id] ?? id).join(' · ')}</small>
      </div>
      <div className="tower-reward" aria-label="รางวัลผ่านครั้งแรก">
        <small>รางวัลครั้งแรก</small>
        <span><ResIcon pack={pack} k="gold" />{full(next.row.gold)}</span>
        {next.row.crystal > 0 && <span><ResIcon pack={pack} k="crystal" />{next.row.crystal}</span>}
        {next.row.bronze_card_count > 0 && <span><Icon name="card" /> การ์ด ×{next.row.bronze_card_count}</span>}
      </div>
      <button className="btn primary wide tower-go" disabled={locked} onClick={() => challenge({ kind: 'tower', floor: next.floor })}>{bossIcon ? <img src={bossIcon} alt="" /> : <Icon name="adventure" />} ท้าชั้น {next.floor}</button>
    </section>
    <ol className="tower-list" aria-label="ชั้นของหอคอย">{view.floors.slice().reverse().map(floor => <li key={floor.floor} className={floor.cleared ? 'cleared' : floor.available ? 'current' : 'locked'}>
      <span className="tower-num">{floor.floor}</span><span className="tower-name">{name(floor.boss)}<small>HP {compact(floor.row.hp)} · ATK {full(floor.row.attack)}</small></span>
      {floor.cleared ? <button className="btn small ghost" disabled={locked} onClick={() => challenge({ kind: 'tower', floor: floor.floor })}>ท้าซ้ำ</button> : floor.available ? <em className="tag on">ชั้นถัดไป</em> : <em className="tag"><Icon name="lock" /></em>}
    </li>)}</ol>
    <p className="hint">ชนะชั้นใหม่ได้รางวัลครั้งเดียว ท้าซ้ำชั้นที่ผ่านแล้วไม่ได้ของ · แพ้หรือหมดเวลาไม่เสียอะไร</p>
  </div>;
}
