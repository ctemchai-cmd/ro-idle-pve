import { useEffect, useMemo, useState } from 'react';
import type { CombatStats, PrimaryStats } from '../../contracts/index.ts';
import { allocationQuote, characterJobBonus, rosterData as data } from '../../client/roster.ts';
import { equipmentStats } from '../../client/equipment.ts';
import type { GameContext } from './shell.tsx';
import { Diff, PageHeader, friendNames, jobNames, seconds, statLabels } from './kit.tsx';
import { cardStatUnits } from '../../client/slots.ts';
import { CharacterNav } from './character-nav.tsx';

const primaries: (keyof PrimaryStats)[] = ['str', 'agi', 'vit', 'int', 'dex', 'luk'];
const base: (keyof CombatStats)[] = ['max_hp', 'max_sp', 'physical_attack', 'magical_attack', 'physical_defense', 'magical_defense', 'attack_speed', 'cast_speed'];
const mainStats = new Set<string>([...primaries, ...base]);
const extra = (Object.keys(cardStatUnits) as (keyof CombatStats)[]).filter(key => !mainStats.has(key));

/** Hexagon in the classic STR/AGI/VIT/INT/DEX/LUK order; draft values draw as a second layer. */
function Radar({ value, draft, max }: { value: PrimaryStats; draft: PrimaryStats; max: number }) {
  const point = (i: number, r: number) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [60 + Math.cos(a) * r, 62 + Math.sin(a) * r] as const; };
  const shape = (s: PrimaryStats) => primaries.map((k, i) => point(i, 8 + 42 * Math.min(1, s[k] / max)).join(',')).join(' ');
  return <svg className="radar" viewBox="0 0 120 124" role="img" aria-label="กราฟค่า Status">
    {[1, .66, .33].map(r => <polygon key={r} className="radar-grid" points={primaries.map((_, i) => point(i, 50 * r).join(',')).join(' ')} />)}
    {primaries.map((_, i) => <line key={i} className="radar-axis" x1={60} y1={62} x2={point(i, 50)[0]} y2={point(i, 50)[1]} />)}
    <polygon className="radar-draft" points={shape(draft)} /><polygon className="radar-value" points={shape(value)} />
    {primaries.map((k, i) => { const [x, y] = point(i, 59); return <text key={k} x={x} y={y + 3} textAnchor="middle">{k.toUpperCase()}</text>; })}
  </svg>;
}

export function StatsPage({ context }: { context: GameContext }) {
  const { state, submit, locked, characterId, go } = context, actor = state.roster.find(a => a.character_id === characterId)!;
  const [draft, setDraft] = useState<PrimaryStats>(actor.primary_stats), [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => { setDraft({ ...actor.primary_stats }); setConfirmReset(false); }, [actor.character_id, JSON.stringify(actor.primary_stats)]);
  let points = 0; try { points = allocationQuote(actor.primary_stats, draft, data); } catch { /* Unchanged preview. */ }
  const current = useMemo(() => equipmentStats(state, actor.character_id), [state, actor.character_id]);
  const preview = useMemo(() => { if (!points) return current; const clone = structuredClone(state); clone.roster.find(a => a.character_id === actor.character_id)!.primary_stats = { ...draft }; return equipmentStats(clone, actor.character_id); }, [state, actor.character_id, draft, points, current]);
  const bonus = characterJobBonus(actor), total = (s: PrimaryStats) => Object.fromEntries(primaries.map(k => [k, s[k] + bonus[k]])) as PrimaryStats;
  const left = actor.unspent_status_points - points, max = Math.max(10, ...primaries.map(k => draft[k] + bonus[k])) * 1.15;
  const stepCost = (k: keyof PrimaryStats) => data.status_allocation.cost_by_new_value.find(r => r.new_value === draft[k] + 1)?.point_cost ?? Infinity;
  return <div className="page stats-page">
    <PageHeader title={`Stats · ${friendNames[actor.character_id]}`} sub={`${jobNames[actor.job_id]} · Lv.${actor.level}`} onBack={() => go('buddy', actor.character_id)} right={<CharacterNav context={context} />} />
    <section className="stat-panel"><h2>Base Stats</h2><div className="stat-cells">
      {base.map(k => <p key={k}><span>{statLabels[k]}</span><Diff before={(current.stats[k] ?? 0)} after={(preview.stats[k] ?? 0)} keyName={k} /></p>)}
      <p><span>รอคิวสกิล</span>{current.intervalMs === preview.intervalMs ? <span className="diff-same">{seconds(current.intervalMs)}</span> : <span className="diff"><b className={preview.intervalMs < current.intervalMs ? 'up' : 'down'}>{seconds(preview.intervalMs)}</b></span>}</p>
    </div></section>
    <details className="stat-panel extra-stats"><summary><span>Additional Stats</span><small>{extra.filter(k => (current.stats[k] ?? 0) || (preview.stats[k] ?? 0)).length} ค่าที่มีผล · แตะเพื่อดู</small></summary><div className="stat-grid small">
      {extra.map(k => <p key={k} className={!(current.stats[k] ?? 0) && !(preview.stats[k] ?? 0) ? 'zero' : ''}><span>{statLabels[k]}</span><Diff before={(current.stats[k] ?? 0)} after={(preview.stats[k] ?? 0)} keyName={k} /></p>)}
    </div><details className="stat-bonus-notes"><summary>โบนัสทุก 10 แต้ม</summary><p>STR ATK+5 · AGI หลบ+1% · VIT HP+50 · INT MATK+8 · DEX แม่น+1% · LUK คริ+1%</p><p>เลขบนปุ่ม + คือจำนวนแต้มที่ใช้ในขั้นถัดไป</p></details></details>
    <section className="alloc">
      <Radar value={total(actor.primary_stats)} draft={total(draft)} max={max} />
      <div className="alloc-rows">{primaries.map(k => <div key={k} className="alloc-row">
        <b>{k.toUpperCase()}</b><output aria-label={`ค่า ${k.toUpperCase()}`} title={bonus[k] ? `ลงแต้ม ${actor.primary_stats[k]} + โบนัสอาชีพ ${bonus[k]}` : undefined}>{actor.primary_stats[k]}{bonus[k] > 0 && <small className="job-bonus">+{bonus[k]}</small>}{draft[k] !== actor.primary_stats[k] && <em> +{draft[k] - actor.primary_stats[k]}</em>}</output>
        <button className="step" aria-label={`ลด ${k.toUpperCase()}`} disabled={locked || draft[k] <= actor.primary_stats[k]} onClick={() => setDraft({ ...draft, [k]: draft[k] - 1 })}>−</button>
        <button className="step plus" aria-label={`เพิ่ม ${k.toUpperCase()} ใช้ ${stepCost(k)} แต้ม`} title={`ขั้นถัดไปใช้ ${stepCost(k)} แต้ม`} disabled={locked || draft[k] >= data.status_allocation.manual_value_max || points + stepCost(k) > actor.unspent_status_points} onClick={() => setDraft({ ...draft, [k]: draft[k] + 1 })}>+{Number.isFinite(stepCost(k)) && <i>{stepCost(k)}</i>}</button>
      </div>)}</div>
    </section>
    <footer className="alloc-foot">
      <span className="points">แต้มเหลือ <b data-testid="unspent-points">{left}</b></span>
      {points > 0 ? <><button className="btn ghost" onClick={() => setDraft({ ...actor.primary_stats })}>ยกเลิก</button><button className="btn primary" disabled={locked || left < 0} onClick={() => void submit('character.allocate_status', { character_id: actor.character_id, allocation: draft })}>ยืนยัน ({points} แต้ม)</button></>
        : confirmReset ? <><button className="btn ghost" onClick={() => setConfirmReset(false)}>ยกเลิก</button><button className="btn danger" disabled={locked} onClick={() => void submit('character.reset_build', { character_id: actor.character_id, features: ['stats'] }).then(() => setConfirmReset(false))}>ยืนยันรีเซ็ต Status</button></>
        : <button className="btn ghost" disabled={locked} onClick={() => setConfirmReset(true)}>↺ รีเซ็ต Status ฟรี</button>}
    </footer>
  </div>;
}
