import { Icon } from '../icon.tsx';
import type { GameContext } from './shell.tsx';
import { PageHeader, iconUrl } from './kit.tsx';

/** Dungeon hub (user request): entry points for Infinity Tower (TASK-035) and daily bosses (TASK-036). */
const modes = [
  {id:'mvp',title:'MVP Hunt',note:'3 บอสประจำสัปดาห์ · 10 ระดับ',task:'TASK180',icon:'boss_active'},
  { id: 'tower', title: 'หอคอยไร้ขีดจำกัด', note: 'ไต่ชั้นไปเรื่อยๆ · ไม่รีเซ็ต', task: 'TASK-035', icon: 'boss' },
  { id: 'daily', title: 'ดันเจี้ยนรายวัน', note: 'บอส 3 ตัว · วันละ 3 ครั้ง · รีเซ็ต 00:00', task: 'TASK-036', icon: 'boss_active' },
];
export function DungeonPage({ context }: { context: GameContext }) {
  const { state, pack, go } = context;
  return <div className="page dungeon-page">
    <PageHeader title="ดันเจี้ยน" sub="โหมดท้าทายนอกเหนือจาก Story" onBack={() => go('home')} />
    <div className="dungeon-list">{modes.map(mode => { const url = iconUrl(pack, 'ui_icons', mode.icon), open = true; return <button key={mode.id} className={`dungeon-card ${open ? '' : 'locked'}`} onClick={() => go(mode.id as 'tower' | 'daily' | 'mvp')}>
      <span className="dungeon-art">{url ? <img src={url} alt="" /> : <Icon name="adventure" />}</span><span className="dungeon-text"><b>{mode.title}</b><small>{mode.id === 'tower' ? `ผ่านสูงสุดชั้น ${state.tower.highest_cleared_floor}` : mode.note}</small></span><em className="tag on">เข้า</em>
    </button>; })}</div>
  </div>;
}
