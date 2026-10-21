import { useState } from 'react';
import { rosterData as data, type RootJob } from '../../client/roster.ts';
import type { AssetPack } from '../../renderer/pack.ts';
import { ActorCanvas, jobNames, jobRoles } from './kit.tsx';
import { ClassIcon } from './class-icon.tsx';

const roots = Object.keys(data.class_tree) as RootJob[];
export function Onboarding({ pack, busy, create }: { pack: AssetPack | null; busy: boolean; create: (root: RootJob, gender: 'male' | 'female') => void }) {
  const [root, setRoot] = useState<RootJob>('swordsman'), [gender, setGender] = useState<'male' | 'female'>('male');
  return <div className="onboarding">
    <header><div className="splash-logo">RO <span>Idle</span></div><h1>สร้างนักผจญภัยของคุณ</h1><p>เลือกอาชีพเริ่มต้น · เพื่อนอีก 6 สายพร้อมให้เลือกลงทีม 3 คน</p></header>
    <div className="gender-toggle" role="radiogroup" aria-label="รูปลักษณ์">{(['male', 'female'] as const).map(g => <button key={g} role="radio" aria-checked={gender === g} className={gender === g ? 'on' : ''} onClick={() => setGender(g)}>{g === 'male' ? 'ชาย' : 'หญิง'}</button>)}</div>
    <div className="class-grid" role="radiogroup" aria-label="อาชีพเริ่มต้น">{roots.map(r => <button key={r} role="radio" aria-checked={root === r} className={`class-card ${root === r ? 'on' : ''}`} onClick={() => setRoot(r)}>
      <ActorCanvas pack={pack} look={{ job_id: r, gender, weapon: true }} width={96} height={120} scale={1.3} footY={114} /><b className="class-title"><ClassIcon job={r} size={20} />{jobNames[r]}</b><small>{jobRoles[r]}</small><em>Class 2: {data.class_tree[r].map(j => jobNames[j]).join(' / ')}</em>
    </button>)}</div>
    <button className="btn primary wide big" disabled={busy} onClick={() => create(root, gender)}>เริ่มการเดินทาง</button>
  </div>;
}
