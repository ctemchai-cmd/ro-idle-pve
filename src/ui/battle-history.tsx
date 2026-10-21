import { useEffect, useMemo, useRef, useState } from 'react';
import type { SavedBattleSession } from '../client/story.ts';
import type { AssetPack } from '../renderer/pack.ts';
import type { SkillHistoryEvent } from '../client/battle-history.ts';
import { Icon } from './icon.tsx';
import { TimelineRow, describeTimelineEntry } from './skill-timeline.tsx';
import './battle-history.css';

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const precise = (ms: number) => `${(ms / 1000).toFixed(3)}s`;
const eventNames: Partial<Record<SkillHistoryEvent['type'], string>> = { cast_start: 'เริ่มร่าย', cast_resolve: 'ใช้สำเร็จ', cast_interrupt: 'ถูกขัดร่าย', sp_skip: 'ข้าม · SP ไม่พอ', sphere_skip: 'ข้าม · บอลไม่พอ' };

/** Current battle only. Reading this view never calls the forecast, engine or save API. */
export function BattleHistory({ session, pack }: { session: SavedBattleSession; pack: AssetPack }) {
  const recording = useMemo(() => ({ timeline: session.recordedTimeline(), events: session.recordedEvents(), view: session.view() }), [session]);
  const { timeline, events, view } = recording;
  const viewport = useRef<HTMLDivElement>(null), pendingScroll = useRef<number | null>(null);
  const [tab, setTab] = useState<'timeline' | 'log'>('timeline'), [scale, setScale] = useState(40), [width, setWidth] = useState(300), [startMs, setStartMs] = useState(0), [selected, setSelected] = useState<string | null>(null), [actorId, setActorId] = useState('all');
  const actors = useMemo(() => [...view.actors.filter(a => a.team === 'player' && !a.summon_of), ...view.actors.filter(a => a.team === 'enemy' && !a.summon_of)], [view]);
  const visibleWidth = Math.max(1, width - 90), spanMs = Math.max(1000, timeline.through_ms, visibleWidth / scale * 1000), maxStartMs = Math.max(0, spanMs - visibleWidth / scale * 1000);
  const ticks = useMemo(() => Array.from({ length: Math.floor(spanMs / 2000) + 1 }, (_, i) => i * 2000), [spanMs]);
  const chosen = timeline.entries.find(e => e.id === selected), actorName = (id: string) => actors.find(a => a.actor_id === id)?.name ?? id, skillName = (id: string) => session.scene.skill_labels[id] ?? id;
  useEffect(() => {
    const node = viewport.current; if (!node) return;
    const observer = new ResizeObserver(() => setWidth(node.clientWidth)); observer.observe(node); setWidth(node.clientWidth);
    return () => observer.disconnect();
  }, [tab]);
  useEffect(() => {
    const node = viewport.current; if (!node) return;
    const time = pendingScroll.current ?? startMs; pendingScroll.current = null;
    node.scrollLeft = Math.min(time, maxStartMs) / 1000 * scale; setStartMs(node.scrollLeft / scale * 1000);
    // Preserve the visible battle time when zoom/viewport changes, not on every scroll event.
  }, [scale, width, tab]);
  function seek(ms: number) { if (viewport.current) { viewport.current.scrollLeft = ms / 1000 * scale; setStartMs(viewport.current.scrollLeft / scale * 1000); } }
  return <section className="battle-history" aria-label="ประวัติสกิลไฟต์นี้" data-history-duration={timeline.through_ms}>
    <div className="history-tabs" role="tablist" aria-label="รูปแบบประวัติ">
      <button role="tab" aria-selected={tab === 'timeline'} onClick={() => setTab('timeline')}><Icon name="timeline" />Timeline</button>
      <button role="tab" aria-selected={tab === 'log'} onClick={() => setTab('log')}><Icon name="book" />Log สกิล</button>
    </div>
    <p className="history-summary">ไฟต์ {seconds(timeline.through_ms)} · เหตุการณ์ที่เกิดขึ้นแล้ว · เก็บไว้จนออกจากไฟต์หรือรีโหลด</p>
    {tab === 'timeline' ? <>
      <div className="history-controls"><button onClick={() => seek(0)}>ต้นไฟต์</button><button onClick={() => seek(maxStartMs)}>ท้ายไฟต์</button><label>ซูม <select aria-label="ซูม Timeline ย้อนหลัง" value={scale} onChange={e => { pendingScroll.current = startMs; setScale(Number(e.target.value)); }}><option value="24">ภาพรวม</option><option value="40">ปกติ</option><option value="64">ละเอียด</option></select></label></div>
      <div className="history-seek"><input type="range" aria-label="เลื่อนเวลา Timeline" min={0} max={maxStartMs} step={100} value={Math.min(startMs, maxStartMs)} onChange={e => seek(Number(e.target.value))} disabled={!maxStartMs} /><output>{seconds(startMs)}–{seconds(Math.min(timeline.through_ms, startMs + visibleWidth / scale * 1000))}</output></div>
      <div className="skill-timeline history-timeline">
        <div className="timeline-viewport" ref={viewport} tabIndex={0} aria-label="เลื่อนดู Timeline ตั้งแต่ต้นจนจบไฟต์" onScroll={e => setStartMs(e.currentTarget.scrollLeft / scale * 1000)}>
          <div className="timeline-chart recorded-chart" style={{ width: spanMs / 1000 * scale + 90 }}>
            <div className="timeline-axis"><div className="timeline-actor-label">ตัวละคร</div><div className="timeline-track"><div className="timeline-content">{ticks.map(ms => <time key={ms} style={{ left: `${ms / spanMs * 100}%` }}>{seconds(ms)}</time>)}</div></div></div>
            {actors.map((actor, index) => <TimelineRow key={actor.actor_id} actor={{ ...actor, dead: actor.hp <= 0 }} entries={timeline.entries} ticks={ticks} windowMs={spanMs} pack={pack} session={session} selected={selected} choose={setSelected} enemyStart={actor.team === 'enemy' && actors[index - 1]?.team !== 'enemy'} recorded />)}
          </div>
        </div>
      </div>
      <p className="history-detail" role="status">{chosen ? `${actorName(chosen.actor_id)} · ${describeTimelineEntry(chosen, skillName(chosen.skill_id), session.scene.skill_labels, true)}${chosen.interrupted_by ? ` · ผู้ขัด: ${actorName(timeline.entries.find(e => e.id === chosen.interrupted_by)?.actor_id ?? '')}` : ''}` : timeline.entries.length ? 'ปัดซ้าย–ขวาเพื่อย้อนดู · แตะไอคอนดูเวลาร่ายและผล · สายฟ้า = ขัดสำเร็จ / กากบาท = ถูกขัด' : 'ไฟต์นี้จบก่อนมีการใช้สกิล'}</p>
    </> : <>
      <label className="history-filter">แสดง <select aria-label="ตัวละครใน Log สกิล" value={actorId} onChange={e => setActorId(e.target.value)}><option value="all">ทุกตัวละคร</option>{actors.map(a => <option key={a.actor_id} value={a.actor_id}>{a.name}</option>)}</select></label>
      <div className="history-event-list" tabIndex={0} role="region" aria-label="Log สกิลเรียงตามเวลา" key={actorId}>
        {events.filter(e => actorId === 'all' || e.actor_id === actorId).map(e => <div className={`history-event ${e.type}`} key={e.sequence} data-event-sequence={e.sequence}>
          <time>{precise(e.at_ms)}</time><span className="history-event-icon">{pack.icons.get(e.skill_id) ? <img src={pack.icons.get(e.skill_id)} alt="" /> : <Icon name="sparkles" />}</span>
          <div><strong>{skillName(e.skill_id)}</strong><small>{actorName(e.actor_id)} · {eventNames[e.type]}{e.type === 'cast_start' && e.cast_duration_ms !== undefined ? ` · ร่าย ${precise(e.cast_duration_ms)}` : ''}{e.type === 'cast_interrupt' && e.detail ? ` · โดย ${actorName(e.detail)}` : ''}</small></div>
        </div>)}
        {!events.length && <p className="history-detail">ไฟต์นี้ไม่มีการใช้สกิล</p>}
      </div>
    </>}
  </section>;
}
