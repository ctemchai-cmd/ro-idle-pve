import { useEffect, useState } from 'react';
import type { AccountState } from '../../contracts/index.ts';
import type { GameContext } from './shell.tsx';
import { ActorCanvas, PageHeader, Sheet, friendNames, jobNames, lookOf } from './kit.tsx';
import { ClassIcon } from './class-icon.tsx';

type Placement = AccountState['team'][number];
const positionNames: Record<Placement['position'], string> = { front_1: 'หน้า 1', front_2: 'หน้า 2', back_1: 'หลัง 1', back_2: 'หลัง 2' };
export function TeamPage({ context }: { context: GameContext }) {
  const { state, pack, submit, locked, go } = context, [team, setTeam] = useState<AccountState['team']>(structuredClone(state.team)), [editing, setEditing] = useState<Placement['position'] | null>(null);
  useEffect(() => setTeam(structuredClone(state.team)), [state.team]);
  const changed = JSON.stringify(team) !== JSON.stringify(state.team), member = (p: Placement['position']) => state.roster.find(a => a.character_id === team.find(t => t.position === p)!.character_id)!;
  const npcRoots = team.filter(t => t.character_id !== 'main').map(t => state.roster.find(a => a.character_id === t.character_id)!.root_job_id), duplicate = npcRoots.length !== new Set(npcRoots).size;
  function choose(id: string) {
    if (!editing) return; const old = team.find(p => p.position === editing)!, existing = team.find(p => p.character_id === id);
    if (old.character_id === 'main' && !existing) return;
    setTeam(team.map(p => p.position === editing ? { ...p, character_id: id } : existing && p.position === existing.position ? { ...p, character_id: old.character_id } : p) as AccountState['team']); setEditing(null);
  }
  const pad = (p: Placement['position']) => { const a = member(p); return <button key={p} className={`formation-pad ${p.startsWith('front') ? 'front' : 'back'}`} aria-label={`ตำแหน่ง ${positionNames[p]} · ${friendNames[a.character_id]}`} disabled={locked} onClick={() => setEditing(p)}>
    <small className="pad-label">{positionNames[p]}</small><span className="pad-stage"><ActorCanvas pack={pack} look={lookOf(a, state)} width={96} height={112} scale={1.3} footY={104} /></span>
    <span className="pad-name"><ClassIcon pack={pack} job={a.job_id} size={18} /><b>{friendNames[a.character_id]}</b></span><span className="pad-meta">{jobNames[a.job_id]} · Lv.{a.level}</span>
  </button>; };
  const editingMember = editing ? team.find(p => p.position === editing)!.character_id : null;
  return <div className="page team-page">
    <PageHeader title="จัดทีม" sub="4 คน · หน้า 2 หลัง 2 · ตัวหลักต้องอยู่ในทีม" onBack={() => go('home')} />
    <section className="formation" style={pack?.background ? { backgroundImage: `linear-gradient(180deg,rgba(255,255,255,.1),rgba(20,40,80,.35)),url(${pack.background.image.src})` } : undefined}>
      <div className="formation-head"><span>แนวหลัง</span><span>แนวหน้า <em>ศัตรูอยู่ทางขวา ›</em></span></div>
      <div className="formation-grid">{pad('back_1')}{pad('front_1')}{pad('back_2')}{pad('front_2')}</div>
    </section>
    {duplicate && <p className="hint warn">เพื่อนในทีมซ้ำสาย Class 1</p>}
    {changed && <div className="row sticky-actions"><button className="btn ghost" onClick={() => setTeam(structuredClone(state.team))}>คืนค่า</button><button className="btn primary" disabled={locked || duplicate} onClick={() => void submit('party.set', { placements: team })}>บันทึกทีม</button></div>}
    <section className="bench"><h2>ตัวละครทั้งหมด</h2><div className="bench-grid">{state.roster.map(a => { const at = team.find(p => p.character_id === a.character_id); return <button key={a.character_id} className={`bench-card ${at ? 'in' : ''}`} onClick={() => go('buddy', a.character_id)}>
      <ActorCanvas pack={pack} look={lookOf(a, state)} width={64} height={72} scale={1.4} footY={118} /><span><b className="pad-name"><ClassIcon pack={pack} job={a.job_id} size={16} />{friendNames[a.character_id]}</b><small>{jobNames[a.job_id]} · Lv.{a.level}</small><em>{at ? positionNames[at.position] : 'พักอยู่'}</em></span>
    </button>; })}</div></section>
    {editing && <Sheet title={`เลือกสมาชิก · ${positionNames[editing]}`} onClose={() => setEditing(null)}>
      <div className="pick-list">{state.roster.map(a => { const at = team.find(p => p.character_id === a.character_id), blocked = editingMember === 'main' && !at; return <button key={a.character_id} className={`list-row ${a.character_id === editingMember ? 'on' : ''}`} disabled={blocked} onClick={() => choose(a.character_id)}>
        <ActorCanvas pack={pack} look={lookOf(a, state)} width={48} height={52} scale={1.1} footY={94} /><ClassIcon pack={pack} job={a.job_id} size={24} /><span className="row-main"><b>{friendNames[a.character_id]} · {jobNames[a.job_id]}</b><small>Lv.{a.level} · สาย {jobNames[a.root_job_id]}{at ? ` · ${positionNames[at.position]}` : ''}</small></span>
      </button>; })}</div>
      {editingMember === 'main' && <p className="hint">ตัวหลักต้องอยู่ในทีม</p>}
    </Sheet>}
  </div>;
}
