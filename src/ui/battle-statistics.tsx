import { Icon } from './icon.tsx';
import { useState } from 'react';
import type { ActorCombatStatistics, CombatStatistics } from '../contracts/combat-statistics.ts';
import type { ActorRenderView } from '../contracts/presentation.ts';

type Category = 'damage' | 'healing' | 'tank';
const categories = { damage: { name: 'DPS', total: 'ดาเมจรวม', note: 'DPS = ดาเมจที่ลด HP ได้จริง ÷ เวลาของไฟต์' }, healing: { name: 'Healing', total: 'ฟื้น HP รวม', note: 'นับ HP ที่ฟื้นได้จริง · HPS คือฮีลต่อวินาทีของไฟต์' }, tank: { name: 'Tank', total: 'รับดาเมจรวม', note: 'รวม HP ที่เสียจริงและดาเมจที่โล่รับไว้ให้ตัวนั้น' } } as const;
const number = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 1 });
/** `labels` names skills in the per-skill split (scene.skill_labels); each actor's split is shown/hidden on demand. */
export function BattleStatistics({ report, actors, labels = {} }: { report: CombatStatistics; actors: readonly ActorRenderView[]; labels?: Readonly<Record<string, string>> }) {
  const [category, setCategory] = useState<Category>('damage'), [team, setTeam] = useState<'player' | 'enemy'>('player'), [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) => setOpen(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const rows = report.actors.filter(actor => actor.team === team).slice().sort((a, b) => b[category] - a[category] || (a.actor_id < b.actor_id ? -1 : a.actor_id > b.actor_id ? 1 : 0));
  const total = rows.reduce((sum, actor) => sum + actor[category], 0);
  const rate = (row: ActorCombatStatistics) => category === 'damage' ? row.dps : category === 'healing' ? row.hps : null;
  return <section className={`combat-statistics ${category}`} aria-label="ผลงานรายตัว">
    <div className="statistics-tabs" role="group" aria-label="หมวดสถิติ">{(Object.keys(categories) as Category[]).map(key => <button key={key} aria-pressed={category === key} onClick={() => setCategory(key)}><Icon name={key === 'damage' ? 'adventure' : key === 'healing' ? 'heart' : 'shield'} />{categories[key].name}</button>)}</div>
    <div className="statistics-toolbar"><div role="group" aria-label="ทีมที่ดูสถิติ"><button aria-pressed={team === 'player'} onClick={() => setTeam('player')}>ทีมเรา</button><button aria-pressed={team === 'enemy'} onClick={() => setTeam('enemy')}>ศัตรู</button></div><time data-elapsed-ms={report.elapsed_ms}>เวลาไฟต์ {(report.elapsed_ms / 1000).toFixed(1)}s</time></div>
    <div className="statistics-total"><span>{categories[category].total}</span><strong>{number(total)}</strong></div>
    <div className="statistics-actors">{rows.map((row, index) => {
      const actor = actors.find(actor => actor.actor_id === row.actor_id), share = total > 0 ? row[category] / total * 100 : 0, perSecond = rate(row);
      return <article key={row.actor_id} className="statistics-actor" data-actor={row.actor_id} data-amount={row[category]} data-rate={perSecond ?? ''}>
        <div className="statistics-name"><span><i>{index + 1}</i>{actor?.name ?? row.actor_id}{actor && actor.hp <= 0 && <small>หมดสภาพ</small>}</span><strong>{number(row[category])}</strong></div>
        <div className="statistics-bar"><i style={{ width: `${share}%` }} /></div>
        <div className="statistics-detail"><span>{category === 'tank' ? `HP ${number(row.hp_received)} · โล่ ${number(row.shield_received)}` : `${category === 'damage' ? 'DPS' : 'HPS'} ${number(perSecond ?? 0)}`}</span><span>{share.toFixed(1)}%</span></div>
        {category !== 'tank' && <SkillSplit row={row} category={category} labels={labels} shown={open.has(row.actor_id)} toggle={() => toggle(row.actor_id)} />}
      </article>;
    })}</div>
    <p className="statistics-note">{categories[category].note}</p>
  </section>;
}
/** Per-skill split of one actor (damage or healing), collapsed by default. */
function SkillSplit({ row, category, labels, shown, toggle }: { row: ActorCombatStatistics; category: 'damage' | 'healing'; labels: Readonly<Record<string, string>>; shown: boolean; toggle: () => void }) {
  const skills = row.skills.filter(skill => skill[category] > 0).slice().sort((a, b) => b[category] - a[category] || (a.skill_id < b.skill_id ? -1 : 1)), total = row[category];
  if (!skills.length) return null;
  return <div className="statistics-skills">
    <button className="statistics-skill-toggle" aria-expanded={shown} onClick={toggle}>{shown ? '▾ ซ่อนสกิล' : `▸ แสดงสกิล (${skills.length})`}</button>
    {shown && <ul>{skills.map(skill => { const share = total > 0 ? skill[category] / total * 100 : 0, normal = skill.skill_id === 'normal_attack';
      return <li key={skill.skill_id} data-skill={skill.skill_id}><span className="skill-name">{normal ? 'ตีปกติ' : labels[skill.skill_id] ?? skill.skill_id}<small>{skill.uses ? `${normal ? 'ตี' : 'ใช้'} ${skill.uses} ครั้ง` : 'ติดตัว'}</small></span><b>{number(skill[category])}</b><em>{share.toFixed(1)}%</em><i className="skill-share" style={{ width: `${share}%` }} /></li>; })}</ul>}
  </div>;
}
