import { actorSize,type MonsterSize } from '../../client/monster-size.ts';
import { MonsterSizeBadge } from '../monster-size-badge.tsx';
import { CardIcon } from './card-art.tsx';
import { Icon } from '../icon.tsx';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AUTO_LOSS_LIMIT, continueAuto, newAutoRun, nextAutoTarget, pendingProgressCollection, hasPendingProgressRewards, type AutoMode, type AutoRun } from '../../client/auto-battle.ts';
import type { ActorRenderView, BattleRenderView } from '../../contracts/presentation.ts';
import { SavedBattleSession, battleDebrief, bossCastInfo, dailyNames, dailyView, storyBossLabel, storyGearLevel, storyGearRanges, storyOptions, storyPresentationKey, storyStageInfo, towerView } from '../../client/story.ts';
import { FarmWaveSession, farmSceneStage } from '../../client/farm-scene.ts';
import type { SaveSnapshot } from '../../client/save-controller.ts';
import { BattleRenderer } from '../../renderer/battle.ts';
import { bossSkin, farmSkins, shellVisuals } from '../../renderer/shell.ts';
import type { AssetPack } from '../../renderer/pack.ts';
import { SkillTimeline } from '../skill-timeline.tsx';
import { battleSpeed, cycleBattleSpeed, subscribeBattleSpeed } from '../../client/battle-speed.ts';
import { shouldAdvanceBattleFrame } from '../../client/battle-frame.ts';
import { CombatStatusStrip, StatusSignals } from './combat-status.tsx';
import { BattleStatistics } from '../battle-statistics.tsx';
import { BattleHistory } from '../battle-history.tsx';
import type { ChallengeTarget, GameContext } from './shell.tsx';
import { ResIcon, Sheet, compact, duration, friendNames, full, iconUrl, mapNames, resourceNames, type Wallet } from './kit.tsx';
import { ClassIcon } from './class-icon.tsx';
import { cardOrigin, cardView, farmCardRarityOdds } from '../../client/slots.ts';
import { rarityLabels } from '../../client/equipment.ts';
import { CardGrade } from './card-grade.tsx';
import { CardSheet } from './card-sheet.tsx';
import { actorElements } from '../../client/elements.ts';
import { ElementBadge } from '../element-badge.tsx';

const FARM_CAP_MS = 12 * 3600 * 1000;
const GEAR_RANGES = storyGearRanges();
/** Boss look per stage (D-056): pooled mini-boss skins, except the chapter-final stage keeps its authored boss. */
function stageBossSkin(pack: AssetPack | null, stageId: string) {
  const info = storyStageInfo(stageId);
  return pack && info && !info.last && info.enemy_identity!=='definition' ? bossSkin(pack.index, info.chapter, info.index) : null;
}
type Outcome = { id: string; code: string; stage: string; kind: 'story' | 'tower' | 'daily'; resources?: Partial<Wallet>; itemCount?: number };
const OUTCOMES = ['STORY_WON', 'STORY_DEFEATED', 'STORY_TIME_LIMIT', 'TOWER_WON', 'TOWER_DEFEATED', 'TOWER_TIME_LIMIT', 'DAILY_FINISHED', 'DAILY_DEFEATED'];
/** Boss-bar tag per mode: story stage, tower floor, or the daily phase being fought (it changes mid-fight). */
const modeTag = (session: SavedBattleSession) => { const mode = session.state.mode; return mode.kind === 'tower' ? `ชั้น ${mode.ref}` : mode.kind === 'daily' ? `หลอดที่ ${mode.daily_phase}` : mode.ref; };
const bossName = (id: string) => id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
type Wave = { session: FarmWaveSession; renderer: BattleRenderer };
function useNow(interval: number) { const [now, setNow] = useState(Date.now()); useEffect(() => { const t = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(t); }, [interval]); return now; }

/** Main-screen ambient farm: the saved team walks and clears weak waves. Display only; rewards stay time-based. */
function FarmField({ context, covered }: { context: GameContext; covered: boolean }) {
  const { pack, state } = context, canvas = useRef<HTMLCanvasElement>(null), coveredRef = useRef(covered), [phase, setPhase] = useState<'load' | 'fight' | 'walk' | 'rest' | 'error'>('load');
  coveredRef.current = covered;
  const stage = farmSceneStage(state), key = `${stage.id}:${storyPresentationKey(state)}`;
  useEffect(() => {
    const node = canvas.current; if (!pack || !node) return;
    let disposed = false, raf = 0, last = performance.now(), clock = 0, phaseAt = 0, wave = 0, scroll = 0, current: Wave | null = null;
    let mode: 'load' | 'fight' | 'settle' | 'walk' | 'rest' = 'load', ready: Wave | null = null, endView: BattleRenderView | null = null, won = true;
    const tuning = shellVisuals(pack.index).farm, skins = farmSkins(pack.index, stage.chapter);
    const resize = () => { const r = node.getBoundingClientRect(); if (r.width && r.height) { node.width = 720; node.height = Math.round(720 * r.height / r.width); } };
    const observer = new ResizeObserver(resize); observer.observe(node); resize();
    const prepare = async (n: number): Promise<Wave> => {
      const session = new FarmWaveSession(state, stage, n, skins, tuning); await pack.prepare(session.scene, session.skillIds());
      if (pack.soundEnabled) await pack.enableAudio(true, session.scene).catch(() => {});
      const renderer = new BattleRenderer(node, pack, session.scene); renderer.zoom = 1.3; renderer.showStatuses = false; renderer.showFinisherTitles = false; return { session, renderer };
    };
    const set = (m: typeof mode) => { mode = m; phaseAt = clock; if (!disposed) setPhase(m === 'settle' ? 'fight' : m); };
    void prepare(0).then(value => { if (disposed) return; current = value; clock = 0; set('fight'); }).catch(() => { if (!disposed) setPhase('error'); });
    const partyPoints = (view: BattleRenderView) => new Map(view.actors.filter(a => a.team === 'player' && !a.summon_of).map(a => [a.actor_id, [a.spatial?.x ?? 0, a.spatial?.y ?? 0] as const]));
    function frame(now: number) {
      const delta = document.hidden || coveredRef.current ? 0 : Math.max(0, Math.min(120, now - last)); last = now;
      if (!delta || !current) { raf = requestAnimationFrame(frame); return; }
      try {
        clock += delta;
        if (mode === 'fight') {
          const target = current.session.state.game_time_ms + delta;
          current.renderer.accept(current.session.advanceTo(Math.floor(target)));
          const view = current.session.view(); current.renderer.scroll = scroll; current.renderer.draw(view, current.session.state.game_time_ms);
          if (current.session.state.terminal_result) { endView = view; won = current.session.state.terminal_result.kind === 'victory'; set(won ? 'settle' : 'rest'); void prepare(++wave).then(v => { ready = v; }).catch(() => { if (!disposed) setPhase('error'); }); }
        } else if (mode === 'settle' || mode === 'rest') {
          current.renderer.draw(endView!, endView!.game_time_ms + clock - phaseAt);
          if (ready && clock - phaseAt > (won ? 650 : tuning.rest_ms)) set('walk');
        } else if (mode === 'walk' && ready && endView) {
          const t = Math.min(1, (clock - phaseAt) / tuning.walk_ms), e = t * t * (3 - 2 * t), from = partyPoints(endView), to = partyPoints(ready.session.view());
          scroll += delta * 0.085; current.renderer.scroll = scroll;
          const at = endView.game_time_ms + clock - phaseAt;
          const party: ActorRenderView[] = endView.actors.filter(a => a.team === 'player' && !a.summon_of).map(a => { const [fx, fy] = from.get(a.actor_id)!, [tx, ty] = to.get(a.actor_id) ?? [fx, fy], x = fx + (tx - fx) * e, y = fy + (ty - fy) * e; return { ...a, hp: a.max_hp, phase: 'skill_interval', cast: null, status_ids: [], statuses: [], healing_aura: false, spatial: { x, y, previous_x: x, previous_y: y, updated_at: at, moving: true, target_id: null, normal_range: a.spatial?.normal_range ?? 80 } }; });
          current.renderer.draw({ ...endView, actors: party, terminal: null }, at);
          if (t >= 1) { current = ready; ready = null; current.renderer.scroll = scroll; set('fight'); }
        }
      } catch { if (!disposed) setPhase('error'); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); };
  }, [pack, key]);
  return <section className="field-arena" aria-label={`ฟาร์มอัตโนมัติ ด่าน ${stage.id}`} data-farm-phase={phase} data-farm-stage={stage.id}>
    <canvas ref={canvas} width={720} height={1100} aria-hidden="true" />
    {phase === 'rest' && <p className="field-toast">ทีมพักฟื้นแล้วออกเดินต่อ…</p>}
    {phase === 'error' && <p className="field-toast">ยังแสดงฉากฟาร์มไม่ได้ · ตรวจทีมและสกิล</p>}
  </section>;
}

const phaseNames: Record<string, string> = { skill_interval: 'รอคิว', casting: 'ร่าย', after_cast: 'พัก', normal_only: 'ตีปกติ', dead: 'หมดสภาพ' };
export function BossField({ context, app, running, checkpoint, outcome, retreat, statsRef, timelineRef, autoControl }: { context: GameContext; app: { session: SavedBattleSession; id: string }; running: boolean; checkpoint: unknown; outcome: string | null; retreat: (() => Promise<void>) | null; statsRef: { current: (() => void) | null }; timelineRef: { current: (() => void) | null }; autoControl?: ReactNode }) {
  const { pack } = context, canvas = useRef<HTMLCanvasElement>(null), renderer = useRef<BattleRenderer | null>(null), clock = useRef(0), logical = useRef(app.session.state.game_time_ms), runningRef = useRef(running);
  const [view, setView] = useState<BattleRenderView>(() => app.session.view()), [selected, setSelected] = useState('main'), [panel, setPanel] = useState<'timeline' | 'statistics' | 'history' | null>(null), [error, setError] = useState(''), [retreating, setRetreating] = useState(false);
  const finishSent = useRef(false);
  useEffect(() => {
    if (!view.terminal || !running || document.hidden || finishSent.current) return;
    finishSent.current = true;
    // Persisted UUID/receipt recovery belongs to SaveController; never submit a second finish intent on a rerender.
    void context.submitWhenReady('battle.finish', { battle_id: app.id, collect_rewards: true }).then(ok => { if (!ok) setError('ยังยืนยันผลไฟต์ไม่ได้ กรุณาเชื่อมต่อเซฟอีกครั้ง'); });
  }, [view.terminal, running, app.id, context.submitWhenReady]);
  // D-067: flash who cancelled a boss cast (stun/freeze/silence/interrupt) — read from the same engine events the renderer gets.
  const [cut, setCut] = useState<{ by: string; at: number } | null>(null);
  const feed = (events: readonly { type: string; actor_id?: string; detail?: string | null }[]) => { for (const e of events) if (e.type === 'cast_interrupt' && e.actor_id && e.actor_id.startsWith('enemy')) setCut({ by: friendNames[e.detail ?? ''] ?? '', at: Date.now() }); return events; };
  useEffect(() => { if (!cut) return; const id = setTimeout(() => setCut(null), 1600); return () => clearTimeout(id); }, [cut]);
  runningRef.current = running; statsRef.current = () => setPanel('statistics'); timelineRef.current = () => setPanel('history');
  useEffect(() => {
    if (!canvas.current || !pack) return; const node = canvas.current; renderer.current = new BattleRenderer(node, pack, app.session.scene); renderer.current.zoom = 1.12; renderer.current.selected = selected;
    const resize = () => { const r = node.getBoundingClientRect(); if (r.height && r.width) { node.width = 720; node.height = Math.round(720 * r.height / r.width); } };
    const observer = new ResizeObserver(resize); observer.observe(node); resize(); let raf = 0, last = performance.now(), notify = 0, tail = 0;
    function frame(now: number) {
      const delta = document.hidden ? 0 : Math.max(0, Math.min(250, now - last)); last = now;
      try {
        if (runningRef.current && !document.hidden && !app.session.state.terminal_result) { const speed = battleSpeed(); logical.current = Math.min(app.session.state.mode.time_limit_ms, Math.max(logical.current, app.session.state.game_time_ms) + delta * speed); if (shouldAdvanceBattleFrame(app.session.state.game_time_ms, logical.current, app.session.state.mode.time_limit_ms)) renderer.current!.accept(feed(app.session.advanceTo(Math.floor(logical.current))) as never); }
        if (app.session.state.terminal_result && !document.hidden) tail = Math.min(2500, tail + delta * battleSpeed());
        clock.current = app.session.state.terminal_result ? app.session.state.game_time_ms : Math.min(logical.current, app.session.state.game_time_ms + 49);
        renderer.current!.draw(app.session.view(), clock.current + tail); if (now - notify > 100) { setView(app.session.view()); notify = now; }
      } catch { runningRef.current = false; setError('กำลังตรวจการต่อสู้ กรุณาเชื่อมต่อเซฟอีกครั้ง'); }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); renderer.current = null; };
  }, [app, pack]);
  useEffect(() => { if (!checkpoint || !renderer.current) return; try { renderer.current.accept(app.session.confirm(checkpoint)); logical.current = Math.max(logical.current, app.session.state.game_time_ms); setView(app.session.view()); } catch { setError('ผลการต่อสู้ยังไม่ตรงกับเซฟ กรุณาเชื่อมต่อใหม่'); } }, [checkpoint, app]);
  useEffect(() => { if (!outcome || !renderer.current) return; try { renderer.current.accept(app.session.advanceTo(app.session.state.mode.time_limit_ms)); setView(app.session.view()); } catch { setError('ยังแสดงผลไฟต์ไม่ได้ กรุณาเชื่อมต่อใหม่'); } }, [outcome, app]);
  useEffect(() => { if (renderer.current) renderer.current.selected = selected; }, [selected]);
  const party = view.actors.filter(a => a.team === 'player' && !a.summon_of), boss = view.actors.find(a => a.team === 'enemy' && !a.summon_of), focused = party.find(a => a.actor_id === selected) ?? party[0], label = (id: string) => app.session.scene.skill_labels[id] ?? id;
  const bossActor = app.session.state.actors.find(a => a.actor_id === boss?.actor_id), focusActor = app.session.state.actors.find(a => a.actor_id === focused?.actor_id);
  return <section className="field-arena boss" aria-label="ไฟต์บอส" data-battle-id={app.id} data-game-ms={view.game_time_ms} data-terminal={view.terminal?.kind ?? ''}>
    <canvas ref={canvas} width={720} height={1100} aria-label="ทีมต่อสู้กับบอส" />
    <div className="boss-hud"><div className="boss-bar">
      <div className="boss-name"><strong title={boss?.name}>{boss?.name.replace('บอส · ', '')}</strong>{bossActor && <div className="boss-traits"><ElementBadge pack={pack} element={actorElements(bossActor).armor} armor compact /><MonsterSizeBadge size={actorSize(bossActor)} compact /></div>}<span>{modeTag(app.session)}</span><time>{(view.game_time_ms / 1000).toFixed(1)}<small>/{view.time_limit_ms / 1000}s</small></time></div>
      <div className="boss-health"><div className="bar hp"><i style={{ width: `${boss ? boss.hp / boss.max_hp * 100 : 0}%` }} /></div><span className="boss-hp-value" title={`${full(Math.max(0,boss?.hp??0))} / ${full(boss?.max_hp??0)}`} aria-label={`HP บอส ${full(Math.max(0,boss?.hp??0))} จาก ${full(boss?.max_hp??0)}`}>{compact(Math.max(0,boss?.hp??0))} / {compact(boss?.max_hp??0)}</span></div>
    </div>
      <div className="boss-status-panel">{boss && <CombatStatusStrip actor={boss} actors={view.actors} pack={pack} now={view.game_time_ms} />}</div>
      {boss?.cast && (() => { const info = bossCastInfo(boss.cast.skill_id), progress = Math.min(1, Math.max(0, (view.game_time_ms - boss.phase_started_at) / Math.max(1, boss.phase_duration_ms)));
        return <div className={`boss-cast${info.heavy ? ' heavy' : ''}`} role={info.heavy ? 'alert' : undefined}>
          <p><b>{info.heavy && <Icon name="warning" />}{label(boss.cast.skill_id)}</b> · {boss.cast.interruptible ? 'ขัดร่ายได้' : 'ขัดร่ายไม่ได้'}{info.heavy && info.telegraph ? <small>{info.telegraph}</small> : null}</p>
          <span className="cast-track"><i style={{ width: `${progress * 100}%` }} /></span>
        </div>; })()}
      {cut && <p className="boss-cut" role="status"><Icon name="lightning" /> ขัดสำเร็จ!{cut.by ? ` · ${cut.by}` : ''}</p>}
    </div>
    {view.terminal && !outcome && running && <p className="field-toast">กำลังยืนยันผลไฟต์…</p>}
    {error && <p className="field-toast danger" role="alert">{error}</p>}
    <div className="battle-dock">
    {focused && <div className="focus-status-panel">{focusActor && <div className="focus-elements" aria-label={`ธาตุของ ${focused.name}`}><ElementBadge pack={pack} element={actorElements(focusActor).armor} armor /><span className="weapon-element">อาวุธ · <ElementBadge pack={pack} element={actorElements(focusActor).weapon} /></span></div>}<CombatStatusStrip key={focused.actor_id} actor={focused} actors={view.actors} pack={pack} now={view.game_time_ms} focus /></div>}
    <div className="boss-tools" role="toolbar" aria-label="ควบคุมการต่อสู้">
      <button className="chip-btn" aria-label="สถิติการต่อสู้" title="สถิติ" onClick={() => setPanel('statistics')}><Icon name="chart" /><span>สถิติ</span></button>
      <button className="chip-btn" aria-label="Timeline สกิล" title="Timeline" onClick={() => setPanel(outcome ? 'history' : 'timeline')}><Icon name="timeline" /><span>Timeline</span></button>
      <SpeedButton />
      {retreat && !outcome && <button className="chip-btn danger" aria-label={retreating?'กำลังถอยทัพ':'ถอยทัพ'} title="ถอยทัพ" disabled={retreating} onClick={() => { setRetreating(true); void retreat().finally(() => setRetreating(false)); }}><Icon name="retreat" /><span>{retreating ? 'กำลังถอย…' : 'ถอยทัพ'}</span></button>}
      {autoControl && <div className="boss-auto-row">{autoControl}</div>}
    </div>

    <div className="party-strip" role="group" aria-label="ทีมในไฟต์">{party.map(a => <button key={a.actor_id} className={`party-card ${selected === a.actor_id ? 'on' : ''} ${a.hp <= 0 ? 'down' : ''}`} aria-pressed={selected === a.actor_id} onClick={() => setSelected(a.actor_id)}>
      <span className="party-name"><ClassIcon pack={pack} job={context.state.roster.find(r => r.character_id === a.actor_id)?.job_id ?? 'swordsman'} size={13} />{a.name.split(' · ')[0]}</span><small>{phaseNames[a.phase]}</small>
      <span className="bar hp thin"><i style={{ width: `${a.hp / a.max_hp * 100}%` }} /></span><span className="bar sp thin"><i style={{ width: `${a.sp / a.max_sp * 100}%` }} /></span>
      <StatusSignals actor={a} pack={pack} />
    </button>)}</div>
    </div>
    {panel && <Sheet title={panel === 'history' ? 'Timeline ย้อนหลัง' : panel === 'timeline' ? 'Timeline สกิล' : 'สถิติการต่อสู้'} onClose={() => setPanel(null)} className="tall">{panel === 'history' ? <BattleHistory session={app.session} pack={pack!} /> : panel === 'timeline' ? <SkillTimeline session={app.session} pack={pack!} view={view} clock={clock} /> : <BattleStatistics report={app.session.statistics()} actors={view.actors} labels={app.session.scene.skill_labels} />}</Sheet>}
  </section>;
}

/** Pre-fight warning shown before the start command; it never delays a running server battle clock. */
function introLabel(target: ChallengeTarget, pack: AssetPack | null, context: GameContext) {
  if (target.kind === 'tower') { const floor = towerView(context.state, target.floor, 1).floors[0]!; return { name: bossName(floor.boss), place: `หอคอย ชั้น ${target.floor}`, size:floor.size, level: target.floor }; }
  if (target.kind === 'daily') { const card = dailyView(context.state, Date.now()).bosses.find(b => b.id === target.boss); return { name: card ? bossName(card.enemy) : dailyNames[target.boss] ?? target.boss, place: `ดันเจี้ยนรายวัน · ${dailyNames[target.boss] ?? ''} หลอดที่ ${card?.phase ?? 1}`, size: card?.size??null, level: null }; }
  const authored = storyBossLabel(target.id), skin = stageBossSkin(pack, target.id), info = storyStageInfo(target.id), heavy = info?.heavy_skill ? bossCastInfo(info.heavy_skill) : null;
  return { name: skin?.label ?? authored?.name ?? '', place: `ด่าน ${target.id}`, size:authored?.size??null, level: authored?.level ?? null, hint: info?.heavy_cast ? `บอสร่าย "${heavy?.name ?? 'มหาวิบัติ'}"` : null };
}
function BossIntro({ label, autoControl }: { label: { name: string; place: string; level: number | null; size:MonsterSize|null; hint?: string | null }; autoControl?: ReactNode }) {
  return <div className="boss-intro" role="alert" aria-label={`คำเตือน บอส ${label.name} ${label.place}`}>
    <div className="hazard" /><div className="intro-core"><b className="warn-text">WARNING</b><span className="intro-sub">บอสปรากฏตัว!</span><strong className="intro-boss">{label.name}</strong><small>{label.place}{label.level ? ` · Lv.${label.level}` : ''}</small><MonsterSizeBadge size={label.size} />{label.hint && <em className="intro-hint"><Icon name="warning" /> {label.hint}</em>}</div>{autoControl && <div className="intro-auto">{autoControl}</div>}<div className="hazard bottom" />
  </div>;
}

function StageSheet({ context, close, challenge }: { context: GameContext; close: () => void; challenge: (id: string) => void }) {
  const { state, submit, locked } = context, options = storyOptions(state), farm = farmSceneStage(state).id;
  const chapters = [...new Set(options.map(o => o.chapter))], firstOpen = options.find(o => o.available && !o.cleared)?.chapter ?? options.filter(o=>o.available).at(-1)?.chapter;
  const [chapter, setChapter] = useState(firstOpen ?? 1), [picked, setPicked] = useState<string | null>(null), stage = options.find(o => o.id === picked);
  const gate=options.find(o=>o.chapter===chapter)?.release_locked;
  return <Sheet title="แผนที่การผจญภัย" onClose={close}>
    <div className="chapter-tabs" role="tablist">{chapters.map(c => { const open = options.some(o => o.chapter === c && (o.available||o.release_locked)); return <button key={c} role="tab" aria-selected={chapter === c} disabled={!open} onClick={() => { setChapter(c); setPicked(null); }}>บท {c}</button>; })}</div>
    <details className="farm-gear-guide">
      <summary><span>ดรอปอุปกรณ์ <b>{GEAR_RANGES.filter(r=>r.chapter===chapter).map(r=>r.level===null?'—':`Lv.${r.level}`).join(' / ')}</b></span><small>ดูทุกบท <Icon name="chevron-down" /></small></summary>
      <table aria-label="ระดับอุปกรณ์ที่ดรอปจากการฟาร์ม"><thead><tr><th scope="col">ฟาร์มด่าน</th><th scope="col">อุปกรณ์</th></tr></thead><tbody>{GEAR_RANGES.map(r=><tr key={r.first} data-selected-chapter={r.chapter===chapter}><td>{r.first}{r.last!==r.first?` – ${r.last}`:''}</td><td>{r.level===null?'—':`Lv.${r.level}`}</td></tr>)}</tbody></table>
    </details>
    {gate&&<p className="chapter-release-gate" role="status"><Icon name="lock" /><b>รอ {gate==='hi_class'?'Hi-class':'Awaken'}</b></p>}
    <div className="stage-grid">{options.filter(o => o.chapter === chapter).map(o => <button key={o.id} className={`stage-cell ${o.cleared ? 'cleared' : o.available ? 'open' : 'locked'} ${picked === o.id ? 'picked' : ''} ${farm === o.id ? 'farming' : ''}`} disabled={!o.available} onClick={() => setPicked(o.id)}>
      <b>{o.id}</b><small>{o.cleared ? (farm === o.id ? 'ฟาร์มอยู่' : 'ผ่านแล้ว') : o.available ? 'บอส' : <Icon name="lock" />}</small>
    </button>)}</div>
    {stage ? <div className="stage-actions">
      <p><b>ด่าน {stage.id}</b> · <MonsterSizeBadge size={storyBossLabel(stage.id)?.size??null} /> · {stage.cleared ? 'ผ่านแล้ว' : 'ยังไม่ผ่าน'}</p>
      <p className="farm-gear-label">ฟาร์มดรอปอุปกรณ์ <b>{storyGearLevel(stage.id)===null?'—':`Lv.${storyGearLevel(stage.id)}`}</b></p>
      <div className="row">{stage.cleared && <button className="btn" disabled={locked || farm === stage.id} onClick={() => void submit('farm.set_stage', { stage_id: stage.id }).then(ok => { if (ok) close(); })}>{farm === stage.id ? 'กำลังฟาร์มที่นี่' : 'ฟาร์มที่ด่านนี้'}</button>}
        <button className="btn primary" disabled={locked} onClick={() => challenge(stage.id)}><Icon name="adventure" />ท้าบอส {stage.id}</button></div>
    </div> : null}
  </Sheet>;
}

function FarmSheet({ context, close }: { context: GameContext; close: () => void }) {
  const { state, pack, submit, locked, toast } = context, now = useNow(1000), snapshot = state.farm.rate_snapshot, [claiming, setClaiming] = useState(false);
  const elapsed = snapshot ? Math.min(FARM_CAP_MS, Math.max(0, now - Date.parse(state.farm.reserved_through))) : 0;
  // Farm windows are also settled into claims by farm-stage changes and boss wins; "collect all" takes every one.
  const waiting = (Object.keys(state.wallet) as (keyof Wallet)[]).map(k => [k, state.pending_rewards.reduce((sum, c) => sum + c.resource_vector[k], 0)] as const).filter(([, n]) => n > 0);
  const items = state.pending_rewards.reduce((sum, c) => sum + c.items.length, 0);
  const [collectedCardIds,setCollectedCardIds]=useState<string[]>([]);
  const [openCardId,setOpenCardId]=useState<string|null>(null);
  const foundCards=[...state.pending_rewards.flatMap(c=>c.items).filter((i):i is Extract<typeof i,{kind:'card'}>=>i.kind==='card'),...state.inventory.filter((i):i is Extract<typeof i,{kind:'card'}>=>i.kind==='card'&&collectedCardIds.includes(i.instance_id))].map(item=>cardView(item,state));
  const openCard=foundCards.find(card=>card.item.instance_id===openCardId);
  async function collectAll() {
    if (claiming) return; setClaiming(true);
    try {
      const pending=context.latest()?.pending_rewards??[],cardIds=pending.flatMap(c=>c.items).filter(i=>i.kind==='card').map(i=>i.instance_id);
      const ok=snapshot&&elapsed>=1000
        ?await submit('farm.claim',{collect_rewards:true})
        :pending.length>0&&await submit('reward.claim',{claim_ids:pending.map(c=>c.claim_id)});
      if(ok){const taken=(context.latest()?.inventory??[]).filter(i=>i.kind==='card'&&(cardIds.includes(i.instance_id)||!state.inventory.some(old=>old.instance_id===i.instance_id))).map(i=>i.instance_id);setCollectedCardIds(ids=>[...new Set([...ids,...taken])]);toast(`รับรางวัลทั้งหมดแล้ว${taken.length?` · การ์ด ${taken.length} ใบ`:''}`);}
    } finally { setClaiming(false); }
  }
  const rates = snapshot ? (Object.entries(snapshot.per_hour) as [keyof Wallet, number][]).filter(([, n]) => n > 0) : [];
  const ready = (snapshot && elapsed >= 1000) || state.pending_rewards.length > 0;
  return <Sheet title="รางวัล AFK" onClose={close}>
    {snapshot ? <div className="afk-progress"><div className="afk-time"><b>{duration(elapsed)}</b><small>/ 12:00:00 · ฟาร์ม {snapshot.stage_id}</small></div><span className="bar gold"><i style={{ width: `${elapsed / FARM_CAP_MS * 100}%` }} /></span>
      <p className="farm-gear-label" data-farm-gear-level={snapshot.gear_tier}>ดรอปอุปกรณ์ <b>Lv.{snapshot.gear_tier}</b></p>
      <div className="rate-chips">{rates.map(([k, n]) => <span key={k} title={`${resourceNames[k]} ต่อชั่วโมง`}><ResIcon pack={pack} k={k} />{compact(n)}<small>/ชม.</small></span>)}</div></div>
      : <p className="hint">ผ่านด่าน 1-1 เพื่อเริ่มฟาร์มอัตโนมัติ</p>}
    {snapshot?.card_drops?<div className="farm-card-rates"><b>การ์ด {(snapshot.card_drops.chance_per_million/10000).toLocaleString('th-TH',{maximumFractionDigits:2})}% / รอบ 5 นาที</b>
      <span>{['normal','mini','mvp'].filter(grade=>snapshot.card_drops!.definition_pool.some(id=>cardOrigin(id)?.grade===grade&&!cardOrigin(id)?.variant)).map(grade=><CardGrade key={grade} grade={grade} />)}{snapshot.card_drops!.definition_pool.some(id=>cardOrigin(id)?.variant==='puppet')&&<CardGrade grade="mvp" variant="puppet" />}</span>
      <small>ระดับตามมอนสเตอร์: {farmCardRarityOdds(snapshot.card_drops).map(r=>`${rarityLabels[r.rarity]} ${r.percent.toLocaleString('th-TH',{maximumFractionDigits:2})}%`).join(' · ')}</small>
    </div>:snapshot?<p className="hint">ช่วงสะสมเดิมยังไม่มีดรอปการ์ด</p>:null}
    {(waiting.length > 0 || items > 0) && <div className="waiting-box"><small>รอรับ {state.pending_rewards.length} รายการ{snapshot && elapsed >= 1000 ? ' + ช่วงฟาร์มล่าสุด' : ''}</small>
      <p className="reward-line">{waiting.map(([k, n]) => <span key={k}><ResIcon pack={pack} k={k} />{compact(n)}</span>)}{items ? <span><Icon name="gift" /> {items} ชิ้น</span> : null}</p></div>}
    <button className="btn primary wide big" disabled={locked || claiming || !ready} onClick={() => void collectAll()}>{claiming ? 'กำลังรับ…' : 'รับทั้งหมด'}</button>
    {foundCards.length>0&&<section className="farm-card-finds" aria-label="การ์ดที่ได้รับ"><b>การ์ดที่พบ · {foundCards.length} ใบ</b><div>{foundCards.slice(0,12).map(c=><button key={c.item.instance_id} title={c.name} aria-label={`ดู${c.name}`} onClick={()=>setOpenCardId(c.item.instance_id)} data-card-definition={c.definition.id}><span className={`card-find-art rarity-${c.item.rarity_id}`} data-card-rarity={c.item.rarity_id}><CardIcon card={c} pack={pack} /></span><CardGrade grade={c.origin?.grade} rarity={c.item.rarity_id} variant={c.origin?.variant} /><small>{c.name}</small></button>)}</div>{foundCards.length>12&&<small>และอีก {foundCards.length-12} ใบในกระเป๋า</small>}</section>}
    {openCard&&<CardSheet context={context} card={openCard} close={()=>setOpenCardId(null)}/>}
  </Sheet>;
}

/** TASK-039: the actual causes from the shared metrics (who fell when, damage/heal/overheal, interrupts, SP skips) plus plain tips. */
function Debrief({ session }: { session: SavedBattleSession }) {
  const [debrief, setDebrief] = useState<ReturnType<typeof battleDebrief> | null>(null);
  useEffect(() => { const id = setTimeout(() => setDebrief(battleDebrief(session.state)), 60); return () => clearTimeout(id); }, [session]);
  if (!debrief) return null;
  const top = Math.max(1, ...debrief.members.map(m => m.damage));
  return <details className="debrief"><summary>สรุปการต่อสู้ · {(debrief.at_ms / 1000).toFixed(1)}s{debrief.kind === 'time_limit' ? ` · บอสเหลือ ${Math.round(debrief.boss_hp_ratio * 100)}%` : ''}</summary>
    <ul>{debrief.members.map(m => <li key={m.actor_id}><b>{friendNames[m.actor_id] ?? m.actor_id}</b><span className="debrief-bar"><i style={{ width: `${m.damage / top * 100}%` }} /></span><small>ดาเมจ {compact(m.damage)}{m.healing ? ` · ฮีล ${compact(m.healing)}` : ''}{m.overheal ? ` (เกิน ${compact(m.overheal)})` : ''}{m.fell_at_ms !== null ? ` · ล้มที่ ${(m.fell_at_ms / 1000).toFixed(0)}s` : ''}{m.interrupted ? ` · ถูกขัด ${m.interrupted}` : ''}{m.sp_skips ? ` · SP ไม่พอ ${m.sp_skips}` : ''}</small></li>)}</ul>
  </details>;
}
function DailyResult({ context, outcome, close, challenge, stats, timeline, session }: { context: GameContext; outcome: Outcome; close: () => void; challenge: (target: ChallengeTarget) => void; stats: () => void; timeline: () => void; session?: SavedBattleSession }) {
  const { state, pack, locked, go } = context, claims = state.pending_rewards.filter(c => c.kind === 'daily' && c.source_keys.includes(`battle:${outcome.id}`)), card = dailyView(state, Date.now()).bosses.find(b => b.id === outcome.stage);
  async function claimAll() { if(claims.length) await context.submitWhenReady('reward.claim', { claim_ids: claims.map(c=>c.claim_id) }); }
  const total: Partial<Record<keyof Wallet, number>> = {}; for (const claim of claims) for (const [k, n] of Object.entries(claim.resource_vector) as [keyof Wallet, number][]) total[k] = (total[k] ?? 0) + n;
  return <div className="result-layer" role="dialog" aria-label="ผลดันเจี้ยนรายวัน"><div className={`result-card ${claims.length ? 'win' : 'lose'}`}>
    <div className="result-body"><span className="result-mark" aria-hidden="true"><Icon name={claims.length?'check':'warning'}/></span>
      <h2>{claims.length ? `ทำลายได้ ${claims.length} หลอด!` : outcome.code === 'DAILY_DEFEATED' ? 'ทีมพ่ายแพ้' : 'หมดเวลา'}</h2>
      <p>{card ? `ตอนนี้หลอดที่ ${card.phase} เหลือ ${compact(card.hp)} HP · เหลือสิทธิ์วันนี้ ${card.attempts_left}/${card.attempts}` : ''}</p>
      {claims.length > 0 && <div className="result-reward">{(Object.entries(total) as [keyof Wallet, number][]).filter(([, n]) => n > 0).map(([k, n]) => <span key={k}><ResIcon pack={pack} k={k} />{full(n)}</span>)}</div>}
      {session && <Debrief session={session} />}
    </div>
    <div className="result-footer"><div className="result-primary-actions">
      {claims.length > 0 && <button className="btn primary" disabled={locked} onClick={() => void claimAll()}><Icon name="gift"/>รับกล่อง {claims.length}</button>}
      {!claims.length && card && card.attempts_left > 0 && <button className="btn primary" disabled={locked} onClick={() => { close(); challenge({ kind: 'daily', boss: outcome.stage }); }}><Icon name="play"/>ท้าอีกครั้ง ({card.attempts_left})</button>}
    </div><div className="result-secondary-actions">
      {session && <button className="btn ghost" onClick={timeline} aria-label="Timeline ย้อนหลัง"><Icon name="timeline" /><span>Timeline</span></button>}
      <button className="btn ghost" onClick={stats}><Icon name="chart" /><span>สถิติ</span></button>
      <button className="btn ghost" aria-label="กลับดันเจี้ยน" onClick={() => { close(); go('daily'); }}><Icon name="retreat"/><span>กลับดันเจี้ยน</span></button>
    </div></div>
  </div></div>;
}
export function ResultCard({ context, outcome, close, challenge, stats, timeline, session, autoControl, autoRunning, autoMessage }: { context: GameContext; outcome: Outcome; close: () => void; challenge: (target: ChallengeTarget) => void; stats: () => void; timeline: () => void; session?: SavedBattleSession; autoControl?: ReactNode; autoRunning: boolean; autoMessage: string }) {
  if (outcome.kind === 'daily') return <DailyResult context={context} outcome={outcome} close={close} challenge={challenge} stats={stats} timeline={timeline} session={session} />;
  const { state, pack, locked, go } = context, tower = outcome.kind === 'tower', won = outcome.code.endsWith('_WON');
  const pending = hasPendingProgressRewards(state), resources = outcome.resources ?? {}, itemCount = outcome.itemCount ?? 0;
  const story = storyOptions(state).find(s => s.available && !s.cleared), next: ChallengeTarget | null = tower ? { kind: 'tower', floor: state.tower.highest_cleared_floor + 1 } : story ? { kind: 'story', id: story.id } : null;
  const retry: ChallengeTarget = tower ? { kind: 'tower', floor: Number(outcome.stage) } : { kind: 'story', id: outcome.stage };
  return <div className="result-layer" role="dialog" aria-label="ผลการต่อสู้"><div className={`result-card ${won ? 'win' : 'lose'}`}>
    <div className="result-body"><span className="result-mark" aria-hidden="true"><Icon name={won?'check':'warning'}/></span>
      <h2>{won ? 'ชนะแล้ว!' : outcome.code.endsWith('_TIME_LIMIT') ? 'หมดเวลา' : 'ทีมพ่ายแพ้'}</h2>
      <p>{won ? tower ? `ผ่านหอคอยชั้น ${outcome.stage}` : `ผ่านด่าน ${outcome.stage}` : 'ทีมพ่ายแพ้หรือหมดเวลา'}</p>
      <div className="result-reward" aria-label="รางวัลที่ได้รับ">{(Object.entries(resources) as [keyof Wallet, number][]).filter(([, n]) => n > 0).map(([k, n]) => <span key={k}><ResIcon pack={pack} k={k} />{full(n)}</span>)}{itemCount ? <span><Icon name="gift" /> {itemCount}</span> : null}</div>
      {won && (Object.values(resources).some(n => Number(n) > 0) || itemCount > 0) && <small className="result-collected"><Icon name="check" /> รับรางวัลแล้ว</small>}
      {session && <Debrief session={session} />}
      {pending && <p className="result-pending" role="status">ยังรับรางวัลบางส่วนไม่ได้ · ตรวจพื้นที่กระเป๋า</p>}
      {autoMessage && <p className="auto-message" role="status">{autoMessage}</p>}
    </div>
    <div className="result-footer">{autoControl && <div className="result-auto">{autoControl}</div>}
      <div className="result-primary-actions">
        {!autoRunning && won && next && <button className="btn primary" aria-label={next.kind==='tower'?`ท้าชั้น ${next.floor}`:`ท้าด่าน ${next.kind==='story'?next.id:''}`} disabled={locked || pending} onClick={() => { close(); challenge(next); }}><Icon name="play"/><span>{tower?'ชั้นถัดไป':'ด่านถัดไป'}<small>{next.kind==='tower'?next.floor:next.kind==='story'?next.id:''}</small></span></button>}
        {pending && <button className="btn" onClick={() => { close(); go('backpack'); }}><Icon name="gift"/>จัดกระเป๋า</button>}
        {!autoRunning && !won && <button className="btn" onClick={() => { close(); go('skills'); }}><Icon name="team"/>ปรับทีม</button>}
        {!autoRunning && !won && <button className="btn primary" disabled={locked} onClick={() => { close(); challenge(retry); }}><Icon name="play"/>ลองใหม่</button>}
      </div>
      <div className="result-secondary-actions">
        {session && <button className="btn ghost" onClick={timeline} aria-label="Timeline ย้อนหลัง"><Icon name="timeline" /><span>Timeline</span></button>}
        <button className="btn ghost" onClick={stats}><Icon name="chart" /><span>สถิติ</span></button>
        {tower ? <button className="btn ghost" onClick={() => { close(); go('tower'); }}><Icon name="retreat"/><span>กลับหอคอย</span></button> : <button className="btn ghost" onClick={close}><Icon name="retreat"/><span>กลับไปฟาร์ม</span></button>}
      </div>
    </div>
  </div></div>;
}

export function Field({ context, covered, save, request, consumeRequest }: { context: GameContext; covered: boolean; save: SaveSnapshot; request: (ChallengeTarget & { at: number; automatic?: boolean }) | null; consumeRequest: () => void }) {
  const { state, pack, submit, locked } = context, active = state.active_battle, battle = save.checkpoint?.battle, online = !['offline', 'error', 'read_only', 'incompatible', 'signed_out'].includes(save.status);
  const [boss, setBoss] = useState<{ session: SavedBattleSession; id: string } | null>(null), [outcome, setOutcome] = useState<Outcome | null>(null), [sheet, setSheet] = useState<'stage' | 'farm' | null>(null), [starting, setStarting] = useState(false), [intro, setIntro] = useState<{ label: ReturnType<typeof introLabel>; at: number } | null>(null);
  const [auto, setAuto] = useState<AutoRun | null>(null), autoRef = useRef<AutoRun | null>(null), epoch = useRef(0), [autoMessage, setAutoMessage] = useState('');
  const [continuation, setContinuation] = useState<{ target: ChallengeTarget; at: number; epoch: number } | null>(null);
  const mounted = useRef(true), startingRef = useRef(false), coveredRef = useRef(covered), collectionInFlight = useRef(false), collectionAttempt = useRef(''); coveredRef.current = covered;
  const handled = useRef<string | null>(null), now = useNow(1000), statsRef = useRef<(() => void) | null>(null), timelineRef = useRef<(() => void) | null>(null);
  function updateAuto(value: AutoRun | null) { autoRef.current = value; setAuto(value); }
  function stopAuto(message = '') { if (startingRef.current) setIntro(null); epoch.current++; updateAuto(null); setContinuation(null); setAutoMessage(message); }
  async function challenge(target: ChallengeTarget, automatic = false) {
    if (startingRef.current || (automatic && !autoRef.current)) return;
    if (!automatic) stopAuto();
    // Retire the previous result before its boss can satisfy the new intro's readiness check.
    setOutcome(null);
    const token = epoch.current; startingRef.current = true; setSheet(null); setStarting(true); setIntro({ label: introLabel(target, pack, context), at: Date.now() });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (!mounted.current) return;
      if (automatic && (token !== epoch.current || !autoRef.current || coveredRef.current || document.hidden)) { setIntro(null); return; }
      const ok = target.kind === 'tower' ? await submit('battle.start_tower', { floor: target.floor }) : target.kind === 'daily' ? await submit('battle.start_daily', { boss_id: target.boss }) : await submit('battle.start_story', { stage_id: target.id });
      if (!ok) { setIntro(null); if (automatic) stopAuto('หยุด Auto · ยังเริ่มไฟต์ไม่ได้'); }
    } finally { startingRef.current = false; if (mounted.current) setStarting(false); }
  }
  function startAuto(mode: AutoMode, initial?: ChallengeTarget) {
    const current = context.latest() ?? state;
    if (hasPendingProgressRewards(current)) { setAutoMessage('รับรางวัลที่ค้างให้เรียบร้อยก่อน · ตรวจพื้นที่กระเป๋า'); return; }
    const target = initial ?? nextAutoTarget(current, mode);
    if (!target) { setAutoMessage('ผ่านด่านที่เปิดอยู่ครบแล้ว'); return; }
    epoch.current++; updateAuto({ ...newAutoRun(mode), lastBattleId: outcome?.id ?? null }); setAutoMessage('');
    if (!current.active_battle) void challenge(target, true);
  }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; epoch.current++; autoRef.current = null; }; }, []);
  useEffect(() => {
    if (!active || !battle || !pack || boss?.id === active.battle_id) return; let disposed = false;
    void (async () => { try { const session = new SavedBattleSession(battle.payload, state, id => stageBossSkin(pack, id)); await pack.prepare(session.scene, session.view().actors.flatMap(a => a.slots.filter((id): id is string => id !== null))); if (pack.soundEnabled) await pack.enableAudio(true, session.scene).catch(() => {}); if (!disposed) { setOutcome(null); setBoss({ session, id: active.battle_id }); } } catch { if (!disposed) { context.toast('ยังเตรียมไฟต์บอสไม่ได้ ลองเชื่อมต่อใหม่'); stopAuto('หยุด Auto · เตรียมภาพไม่สำเร็จ'); } } })();
    return () => { disposed = true; };
  }, [active?.battle_id, !!battle, pack]);
  useEffect(() => {
    const r = save.lastReceipt; if (!r || handled.current === r.request_id) return; handled.current = r.request_id;
    if (!OUTCOMES.includes(r.result.code) || !r.result.battle_id || boss?.id !== r.result.battle_id) return;
    const mode = boss.session.initial.mode, kind = mode.kind, stage = kind === 'daily' ? mode.ref.split('@')[0]! : mode.ref;
    setOutcome({ id: r.result.battle_id, code: r.result.code, stage, kind, resources: r.result.resource_delta, itemCount: r.result.created_instance_ids.length });
  }, [save.lastReceipt, boss]);
  useEffect(() => {
    if (!outcome || !auto || auto.lastBattleId === outcome.id) return;
    const current = context.latest() ?? state;
    if (hasPendingProgressRewards(current)) { stopAuto('หยุด Auto · รางวัลรอพื้นที่กระเป๋า'); return; }
    const decision = continueAuto(auto, outcome, nextAutoTarget(current, auto.mode)); updateAuto(decision.run);
    if (decision.target) { setContinuation({ target: decision.target, at: Date.now() + 1800, epoch: epoch.current }); setAutoMessage(outcome.code.endsWith('_WON') ? 'กำลังไปไฟต์ถัดไป…' : `ลองใหม่ · แพ้ ${decision.run!.failures}/${AUTO_LOSS_LIMIT}`); }
    else if (decision.reason) stopAuto(decision.reason === 'loss_limit' ? `หยุด Auto · แพ้ครบ ${AUTO_LOSS_LIMIT} ครั้ง` : decision.reason === 'complete' ? 'ผ่านด่านที่เปิดอยู่ครบแล้ว' : 'หยุด Auto');
  }, [outcome, auto?.lastBattleId, auto?.mode]);
  useEffect(() => {
    if (!continuation || !autoRef.current || covered || !online || document.hidden || save.status !== 'ready' || save.pending || active || startingRef.current) return;
    const timer = setTimeout(() => { if (epoch.current !== continuation.epoch || !autoRef.current) return; setContinuation(null); void challenge(continuation.target, true); }, Math.max(0, continuation.at - Date.now()));
    return () => clearTimeout(timer);
  }, [continuation, covered, online, save.status, !!save.pending, active?.battle_id, starting]);
  useEffect(() => { if (autoRef.current && (covered || !online)) stopAuto(covered ? 'หยุด Auto · เปลี่ยนหน้า' : 'หยุด Auto · ตรวจการเชื่อมต่อเซฟ'); }, [covered, online]);
  useEffect(() => { const hide = () => { if (document.hidden && autoRef.current) stopAuto('หยุด Auto · พักหน้าจอ'); }; document.addEventListener('visibilitychange', hide); return () => document.removeEventListener('visibilitychange', hide); }, []);
  // Recover deferred fixed claims once space is available. No AFK clock polling or repeated failed intents.
  useEffect(() => {
    if (covered || !online || document.hidden || save.status !== 'ready' || save.pending || active || collectionInFlight.current) return;
    const current = context.latest() ?? state, ids = pendingProgressCollection(current); if (!ids.length) return;
    const key = `${ids.join(',')}:${current.inventory.length}:${JSON.stringify(current.wallet)}`; if (collectionAttempt.current === key) return;
    collectionAttempt.current = key; collectionInFlight.current = true;
    void context.submitWhenReady('reward.claim', { claim_ids: ids }).then(ok => { if (!ok) stopAuto('หยุด Auto · ตรวจรางวัลค้าง'); }).finally(() => { collectionInFlight.current = false; });
  }, [state.pending_rewards, state.inventory.length, save.status, covered, online, active?.battle_id]);
  useEffect(() => { if (!request) return; consumeRequest(); const { at: _at, automatic, ...target } = request; if (automatic && target.kind !== 'daily') startAuto(target.kind, target); else void challenge(target as ChallengeTarget); }, [request?.at]);
  useEffect(() => {
    if (!intro) return; const ready = !!boss && (active?.battle_id === boss.id || outcome?.id === boss.id);
    const timer = setTimeout(() => setIntro(null), ready ? Math.max(0, 2100 - (Date.now() - intro.at)) : 9000);
    return () => clearTimeout(timer);
  }, [intro, boss?.id, active?.battle_id, outcome?.id]);
  const options = storyOptions(state), next = options.find(s => s.available && !s.cleared), waiting = options.find(s => !s.cleared && s.release_locked)?.release_locked, waitingName = waiting === 'hi_class' ? 'Hi-class' : waiting === 'awakening' ? 'Awaken' : null, farmStage = farmSceneStage(state), mapName = mapNames[(farmStage.background as { name?: string }).name ?? ''] ?? 'ทุ่งหญ้า';
  const snapshot = state.farm.rate_snapshot, elapsed = snapshot ? Math.min(FARM_CAP_MS, Math.max(0, now - Date.parse(state.farm.reserved_through))) : 0;
  const showBoss = boss && (active?.battle_id === boss.id || outcome?.id === boss.id), bossIcon = iconUrl(pack, 'ui_icons', 'boss'), chest = iconUrl(pack, 'feature_icons', 'afk_chest'), mapIcon = iconUrl(pack, 'ui_icons', 'stage');
  const mode = auto?.mode ?? boss?.session.initial.mode.kind;
  const autoControl = mode === 'daily' ? null : <div className="auto-battle-control" data-auto-running={!!auto}>
    <button className={`btn small ${auto ? 'auto-on' : 'ghost'}`} aria-label={auto ? 'หยุด Auto Battle' : 'เริ่ม Auto Battle'} disabled={!auto && (locked && !active || starting)} onClick={() => auto ? stopAuto('หยุด Auto โดยผู้เล่น') : startAuto(mode === 'tower' ? 'tower' : 'story')}><Icon name={auto ? 'pause' : 'play'} /><span className="auto-label">{auto ? 'หยุด Auto' : 'Auto Battle'}</span><span className="auto-short" aria-hidden="true">Auto</span></button>
    {auto && <small><span className="auto-failure-label">แพ้ </span>{auto.failures}/{AUTO_LOSS_LIMIT}</small>}
  </div>;
  return <div className={`field ${covered ? 'covered' : ''}`} data-auto-mode={auto?.mode ?? ''} data-auto-failures={auto?.failures ?? 0}>
    {showBoss ? <BossField key={boss.id} context={context} app={boss} running={online && active?.battle_id === boss.id} checkpoint={active?.battle_id === boss.id ? battle?.payload : null} outcome={outcome?.id === boss.id ? outcome.code : null} retreat={active?.battle_id === boss.id ? async () => { stopAuto('หยุด Auto · ถอยทัพ'); await context.submitWhenReady('battle.retreat', { battle_id: active.battle_id, requested_game_ms: boss.session.state.game_time_ms }); } : null} statsRef={statsRef} timelineRef={timelineRef} autoControl={autoControl} /> : <FarmField context={context} covered={covered} />}
    {!covered && !showBoss && <>
      <button className="stage-chip" onClick={() => { stopAuto(); setSheet('stage'); }} aria-label="เปิดแผนที่และเลือกด่าน">{mapIcon && <img src={mapIcon} alt="" />}<span><small>{mapName}</small><b>ฟาร์ม {farmStage.id}</b>{snapshot&&<small className="stage-gear-level">อุปกรณ์ Lv.{snapshot.gear_tier}</small>}</span></button>
      <div className="field-auto-start">{autoControl}{autoMessage && <small role="status">{autoMessage}</small>}</div>
      <button className={`afk-chest ${state.pending_rewards.length ? 'has-reward' : ''}`} aria-label="รางวัลฟาร์มอัตโนมัติ" onClick={() => { stopAuto(); setSheet('farm'); }}>{chest ? <img src={chest} alt="" /> : <Icon name="gift" />}<time>{snapshot ? duration(elapsed) : 'AFK'}</time>{!!state.pending_rewards.length && <i className="dot">{state.pending_rewards.length}</i>}</button>
      <button className="challenge-btn" disabled={locked || starting || !next} aria-label={next ? `ท้าบอสด่าน ${next.id}` : waitingName ? `รอ ${waitingName}` : 'ผ่านครบทุกด่านแล้ว'} onClick={() => next && void challenge({ kind: 'story', id: next.id })}><span className="challenge-ring">{bossIcon ? <img src={bossIcon} alt="" /> : <Icon name="adventure" />}</span><b>{starting ? 'กำลังเข้า…' : next ? 'ท้าบอส' : waitingName ?? 'ครบแล้ว'}</b>{next && <small>{next.id}</small>}</button>
    </>}
    {intro && !covered && <BossIntro label={intro.label} autoControl={auto ? autoControl : null} />}
    {outcome && showBoss && !covered && !intro && <ResultCard context={context} outcome={outcome} session={boss.session} close={() => { stopAuto(); setOutcome(null); setBoss(null); }} challenge={target => void challenge(target)} stats={() => { stopAuto('หยุด Auto · ดูสถิติ'); statsRef.current?.(); }} timeline={() => { stopAuto('หยุด Auto · ดู Timeline'); timelineRef.current?.(); }} autoControl={autoControl} autoRunning={!!auto} autoMessage={autoMessage} />}
    {sheet === 'stage' && <StageSheet context={context} close={() => setSheet(null)} challenge={id => void challenge({ kind: 'story', id })} />}
    {sheet === 'farm' && <FarmSheet context={context} close={() => setSheet(null)} />}
  </div>;
}
/** D-071: fast-forward 1×/2×/4× for boss fights; the server credits wall time × speed, so prediction and save stay in step. */
function SpeedButton() {
  const speed = useSyncExternalStore(subscribeBattleSpeed, battleSpeed);
  return <button className={`chip-btn speed ${speed > 1 ? 'on' : ''}`} aria-label={`ความเร็วต่อสู้ ${speed} เท่า กดเพื่อเปลี่ยน`} onClick={() => cycleBattleSpeed()}><Icon name="fast-forward" /><span>{speed}×</span></button>;
}
