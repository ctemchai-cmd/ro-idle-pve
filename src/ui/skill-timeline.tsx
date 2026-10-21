import { Icon } from './icon.tsx';
import { memo, useEffect, useRef, useState, type RefObject } from 'react';
import type { TimelineSession } from '../client/story.ts';
import type { ActorRenderView, BattleRenderView, BattleTimeline, SkillTimelineEntry } from '../contracts/presentation.ts';
import type { AssetPack } from '../renderer/pack.ts';
import './timeline.css';

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const outcomes: Record<SkillTimelineEntry['outcome'], string> = { resolved: 'ใช้สำเร็จ', interrupted: 'ถูกขัดร่าย', sp_skip: 'ข้าม: SP ไม่พอ', sphere_skip: 'ข้าม: ลูกแก้วไม่พอ', pending: 'ร่ายยังไม่จบ' };
export const describeTimelineEntry = (entry: SkillTimelineEntry, name: string, labels: Readonly<Record<string, string>> = {}, recorded = false) => {
  const time = recorded ? (ms: number) => `${(ms / 1000).toFixed(3)}s` : seconds;
  return `${name} · ช่อง ${entry.slot + 1} · เริ่ม ${time(entry.start_ms)} · ร่าย ${time(entry.end_ms - entry.start_ms)}${recorded ? ` · จบ ${time(entry.end_ms)}` : ` · พัก ${time(entry.recovery_end_ms - entry.end_ms)}`}${entry.interrupts?.length ? ` · ขัดร่ายสำเร็จ ${entry.interrupts.map(row => labels[row.skill_id] ?? row.skill_id).join(', ')}` : ''}${entry.outcome === 'interrupted' ? ' · ถูกขัดร่าย' : ''}${recorded ? ` · ${entry.outcome === 'pending' ? 'จบไฟต์ระหว่างร่าย' : outcomes[entry.outcome]}` : ''}`;
};
const describe = describeTimelineEntry;
export const TimelineRow = memo(function TimelineRow({ actor, entries, ticks, windowMs, pack, session, selected, choose, enemyStart, recorded = false }: {
  actor: Pick<ActorRenderView, 'actor_id' | 'name' | 'team'> & { dead: boolean }; entries: readonly SkillTimelineEntry[]; ticks: readonly number[]; windowMs: number; pack: AssetPack; session: TimelineSession; selected: string | null; choose: (id: string | null) => void; enemyStart: boolean; recorded?: boolean;
}) {
  const percent = (ms: number) => ms / windowMs * 100;
  const parts = actor.name.split(' · '), job = session.scene.actors.find(row => row.actor_id === actor.actor_id)?.job_id;
  const shortName = actor.team === 'enemy' ? parts.at(-1)! : actor.actor_id === 'main' ? 'คุณ' : parts[0]!;
  const caption = actor.dead ? 'หมดสภาพ' : actor.team === 'enemy' ? parts.length > 1 ? parts[0] : 'ศัตรู' : parts[1] ?? (job ? job.charAt(0).toUpperCase() + job.slice(1) : 'สหาย');
  return <div data-actor={actor.actor_id} className={`timeline-row ${actor.team === 'enemy' ? 'enemy-row' : ''} ${enemyStart ? 'enemy-start' : ''}`}>
    <div className={`timeline-actor-label ${actor.dead ? 'timeline-fallen' : ''}`} title={actor.name} aria-label={actor.name}><i className={actor.team} /><span>{shortName}<small>{caption}</small></span></div>
    <div className="timeline-track"><div className="timeline-content">
      {ticks.map(ms => <i key={ms} className="timeline-grid" style={{ left: `${percent(ms)}%` }} />)}
      {entries.filter(entry => entry.actor_id === actor.actor_id).map(entry => {
        const skip = entry.outcome === 'sp_skip' || entry.outcome === 'sphere_skip', name = session.scene.skill_labels[entry.skill_id] ?? entry.skill_id;
        const bar = (from: number, to: number) => ({ left: `${percent(from)}%`, width: `${percent(to - from)}%` });
        return <div key={entry.id} className={`timeline-entry slot-${entry.slot + 1} ${recorded ? 'elapsed' : 'future'} ${skip ? 'skipped' : ''} ${entry.outcome === 'interrupted' ? 'was-interrupted' : ''} ${entry.interrupts?.length ? 'did-interrupt' : ''}`} data-skill={entry.skill_id} data-start-ms={entry.start_ms} data-end-ms={entry.end_ms}>
          <span className="timeline-cast" style={bar(entry.start_ms, entry.end_ms)} />{!recorded && <span className="timeline-recovery" style={bar(entry.end_ms, entry.recovery_end_ms)} />}
          <button className={`timeline-skill ${selected === entry.id ? 'chosen' : ''}`} style={{ left: `${percent(entry.start_ms)}%` }} title={describe(entry, name, session.scene.skill_labels, recorded)} aria-label={describe(entry, name, session.scene.skill_labels, recorded)} aria-pressed={selected === entry.id} onClick={() => choose(selected === entry.id ? null : entry.id)}>
            <span className="timeline-icon">{pack.icons.get(entry.skill_id) ? <img src={pack.icons.get(entry.skill_id)} alt="" /> : <Icon name="sparkles" />}<b>{entry.slot + 1}</b>{entry.outcome === 'interrupted' && <em className="timeline-interrupted" aria-hidden="true"><Icon name="close" /></em>}{!!entry.interrupts?.length && <em className="timeline-interrupter" aria-hidden="true"><Icon name="lightning" />{entry.interrupts.length > 1 ? entry.interrupts.length : ''}</em>}{skip && <em>−</em>}</span><time>{seconds(entry.start_ms)}</time>
          </button>
        </div>;
      })}
    </div></div>
  </div>;
}, (a, b) => a.actor.actor_id === b.actor.actor_id && a.actor.dead === b.actor.dead && a.entries === b.entries && a.ticks === b.ticks && a.windowMs === b.windowMs && a.selected === b.selected && a.session === b.session && a.pack === b.pack && a.recorded === b.recorded);

const emptyEntries: readonly SkillTimelineEntry[] = [];
export function SkillTimeline({ session, pack, view, clock }: { session: TimelineSession; pack: AssetPack; view: BattleRenderView; clock: RefObject<number> }) {
  const root = useRef<HTMLElement>(null), clockLabel = useRef<HTMLElement>(null);
  const [projection, setProjection] = useState<BattleTimeline | null>(null), [error, setError] = useState('');
  const [windowMs, setWindowMs] = useState(20000), [selected, setSelected] = useState<string | null>(null);
  const [ticks, setTicks] = useState<readonly number[]>([]);
  useEffect(() => {
    let disposed = false; setProjection(null); setError(''); setSelected(null);
    void session.timeline(() => new Promise(resolve => setTimeout(resolve, 0))).then(value => { if (!disposed) setProjection(value); }, cause => { if (!disposed) setError(String(cause)); });
    return () => { disposed = true; };
  }, [session]);
  useEffect(() => { setTicks(Array.from({ length: Math.ceil((session.initial.mode.time_limit_ms + windowMs) / 2000) + 1 }, (_, i) => i * 2000)); }, [session, windowMs]);
  useEffect(() => {
    const node = root.current; if (!node) return;
    const region = node.querySelector<HTMLElement>('.timeline-now-region')!;
    let width = region.clientWidth, raf = 0, lastTime = -1, lastBucket = -1;
    const observer = new ResizeObserver(entries => { width = entries[0]!.contentRect.width; lastTime = -1; }); observer.observe(region);
    const markers = [...node.querySelectorAll<HTMLElement>('.timeline-entry')].map(element => ({ element, button: element.querySelector('button')!, start: Number(element.dataset.startMs), end: Number(element.dataset.endMs) }));
    function frame() {
      const now = clock.current;
      if (now !== lastTime) {
        const start = Math.max(0, now - windowMs / 4);
        // Static geometry is translated by the compositor each animation frame.
        // React/HUD updates never rebuild or move individual timeline markers.
        node!.style.setProperty('--timeline-shift', `${-start / windowMs * 100}%`);
        node!.style.setProperty('--timeline-now-x', `${(now - start) / windowMs * width}px`);
        const bucket = Math.floor(now / 100);
        if (bucket !== lastBucket) {
          if (clockLabel.current) clockLabel.current.textContent = seconds(now);
          for (const marker of markers) { marker.element.classList.toggle('future', marker.start > now); marker.element.classList.toggle('elapsed', marker.end <= now); marker.button.tabIndex = marker.start >= start && marker.start <= start + windowMs ? 0 : -1; }
          lastBucket = bucket;
        }
        lastTime = now;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); };
  }, [clock, windowMs, projection, session]);
  const now = view.game_time_ms, chosen = projection?.entries.find(entry => entry.id === selected);
  const actors = [...view.actors.filter(actor => actor.team === 'player' && !actor.summon_of), ...view.actors.filter(actor => actor.team === 'enemy' && !actor.summon_of)];
  return <section ref={root} className="skill-timeline" aria-label="Timeline สกิล">
    <div className="timeline-heading"><div><p className="eyebrow">SKILL TIMELINE</p><h2>จังหวะของทุกคน</h2></div><div className="timeline-options"><span className="timeline-clock">ตอนนี้ <b ref={clockLabel}>0.0s</b></span><label>ช่วงเวลา <select aria-label="ช่วงเวลา Timeline" value={windowMs} onChange={event => setWindowMs(Number(event.target.value))}><option value="10000">10 วินาที</option><option value="20000">20 วินาที</option><option value="40000">40 วินาที</option></select></label></div></div>
    <div className="timeline-legend"><span><i className="legend-cast" />กำลังร่าย</span><span><i className="legend-recovery" />พักหลังร่าย</span><span><i className="legend-future" />ล่วงหน้าจากการจำลองคิวนี้</span><span><b className="legend-interrupter"><Icon name="lightning" /></b>ขัดร่ายศัตรูสำเร็จ</span><span><b className="legend-interrupted"><Icon name="close" /></b>ถูกขัดร่าย</span></div>
    {!projection && <p className="timeline-message" role="status">{error ? `โหลด Timeline ไม่สำเร็จ: ${error}` : 'กำลังเตรียมจังหวะสกิล…'}</p>}
    <div className="timeline-viewport" tabIndex={0} aria-label="เลื่อนแนวนอนเพื่อดู Timeline ทุกตัวละคร"><div className="timeline-chart">
      <div className="timeline-axis"><div className="timeline-actor-label">ตัวละคร</div><div className="timeline-track"><div className="timeline-content">{ticks.map(ms => <time key={ms} style={{ left: `${ms / windowMs * 100}%` }}>{seconds(ms)}</time>)}</div></div></div>
      {actors.map((actor, index) => <TimelineRow key={actor.actor_id} actor={{ actor_id: actor.actor_id, name: actor.name, team: actor.team, dead: actor.hp <= 0 }} entries={projection?.entries ?? emptyEntries} ticks={ticks} windowMs={windowMs} pack={pack} session={session} selected={selected} choose={setSelected} enemyStart={actor.team === 'enemy' && actors[index - 1]?.team !== 'enemy'} />)}
      <div className="timeline-now-region" aria-hidden="true"><div className="timeline-now"><span>ตอนนี้</span></div></div>
    </div></div>
    <p className="timeline-detail" role="status">{chosen ? `${describe(chosen, session.scene.skill_labels[chosen.skill_id] ?? chosen.skill_id, session.scene.skill_labels)} · ${chosen.end_ms > now ? 'คาดการณ์' : outcomes[chosen.outcome]}` : 'ช่องว่างคือช่วงรอคิว · ตัวเลขใต้สกิลคือเวลาเริ่มนับจากต้นไฟต์ · ขัดร่ายสำเร็จ / ถูกขัดร่าย · แตะสกิลเพื่อดูรายละเอียด'}</p>
  </section>;
}
