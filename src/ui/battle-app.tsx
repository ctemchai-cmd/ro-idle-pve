import { useEffect, useRef, useState } from 'react';
import { DemoSession, DEMO_ENCOUNTERS } from '../client/demo.ts';
import type { DemoEncounterId } from '../client/demo.ts';
import type { ActorRenderView, BattleRenderView, BattlePresentationEvent } from '../contracts/presentation.ts';
import { AssetPack } from '../renderer/pack.ts';
import { BattleRenderer } from '../renderer/battle.ts';
import { drawActor } from '../renderer/native.mjs';
import { Icon } from './icon.tsx';
import { BattleStatistics } from './battle-statistics.tsx';
import { readAudioLevels, saveAudioLevels } from '../renderer/audio-preferences.ts';
import { DEFAULT_AUDIO_LEVELS, type AudioLevels } from '../renderer/audio.ts';
import { SkillTimeline } from './skill-timeline.tsx';
import './adventure.css';
import './modern-theme.css';

interface Application { session: DemoSession; pack: AssetPack; renderer: BattleRenderer }
const phaseNames: Record<ActorRenderView['phase'], string> = { skill_interval: 'รอคิว', casting: 'กำลังร่าย', after_cast: 'พักหลังร่าย', normal_only: 'โจมตีปกติ', dead: 'หมดสภาพ' };
const time = (ms: number) => `${Math.floor(ms / 60000).toString().padStart(2, '0')}:${Math.floor(ms / 1000 % 60).toString().padStart(2, '0')}`;
function phaseProgress(actor: ActorRenderView, now: number) { return Math.min(100, Math.max(0, (now - actor.phase_started_at) / Math.max(1, actor.phase_duration_ms) * 100)); }
function Portrait({ actor, pack }: { actor: ActorRenderView; pack: AssetPack }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const context = canvas.current?.getContext('2d'), parts = pack.actors.get(actor.actor_id); if (context && parts) { context.clearRect(0, 0, 64, 76); context.imageSmoothingEnabled = false; drawActor(context, parts, 'idle', 0, 32, 144, 'right', 1.7); } }, [actor.actor_id, pack]);
  return <canvas ref={canvas} width="64" height="76" className="portrait" aria-hidden="true" />;
}
function Sheet({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current!, opener = document.activeElement; node.showModal(); return () => { node.close(); if (opener instanceof HTMLElement && opener.isConnected) opener.focus(); }; }, []);
  return <dialog ref={dialog} className="adventure-sheet" onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]')].filter(node => node.getClientRects().length > 0);
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }} onClose={close} onClick={event => { if (event.target === event.currentTarget) close(); }} aria-label={title}>
    <div className="sheet-content"><header><h2>{title}</h2><button autoFocus className="round-control" aria-label="ปิดหน้าต่าง" onClick={close}><Icon name="close" /></button></header>{children}</div>
  </dialog>;
}
export default function BattleApp() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [application, setApplication] = useState<Application | null>(null), [view, setView] = useState<BattleRenderView | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [encounter, setEncounter] = useState<DemoEncounterId>('boss');
  const [selected, setSelected] = useState('main'), [slotSelection, setSlotSelection] = useState<number | null>(null);
  const preview = new URLSearchParams(window.location.search);
  const requestedTheme = preview.get('theme'), theme = requestedTheme === 'dark' ? 'dark' : requestedTheme === 'light' ? 'light' : 'ro';
  const [paused, setPaused] = useState(preview.has('theme-preview')), pauseRef = useRef(paused);
  const [speed, setSpeed] = useState(1), speedRef = useRef(1);
  const [sound, setSound] = useState(false), [soundBusy, setSoundBusy] = useState(false), [audioError, setAudioError] = useState('');
  const [audioLevels, setAudioLevels] = useState<AudioLevels>(() => { try { return readAudioLevels(window.localStorage); } catch { return { ...DEFAULT_AUDIO_LEVELS }; } });
  const [drawing, setDrawing] = useState(true), drawRef = useRef(true);
  const [fps, setFps] = useState(60), fpsRef = useRef(60);
  const [motion, setMotion] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches), [seed, setSeed] = useState(2);
  const [panel, setPanel] = useState<'team' | 'timeline' | 'settings' | 'statistics' | null>(null), [editing, setEditing] = useState(false), [inspected, setInspected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [log, setLog] = useState<BattlePresentationEvent[]>([]);
  const lastWall = useRef(0), logicalTime = useRef(0), presentationClock = useRef(0);
  useEffect(() => {
    let disposed = false, pack: AssetPack | null = null;
    void (async () => { try {
      const session = new DemoSession('boss', 2); pack = await AssetPack.open(session.content.manifest.runtime_asset_pack_hash);
      if (disposed) { pack.dispose(); return; }
      await pack.prepare(session.scene, session.view().actors.flatMap(actor => actor.slots.filter((id): id is string => !!id)));
      if (disposed || !canvas.current) { pack.dispose(); return; }
      const renderer = new BattleRenderer(canvas.current, pack, session.scene); setApplication({ session, pack, renderer }); setView(session.view()); setLoading(false);
    } catch (cause) { if (!disposed) { setError(String(cause)); setLoading(false); } } })();
    return () => { disposed = true; pack?.dispose(); };
  }, []);
  useEffect(() => {
    if (!application) return; const { session, renderer } = application;
    let raf = 0, stopped = false, lastNotify = 0, lastDraw = -Infinity, visualTail = 0;
    lastWall.current = performance.now(); logicalTime.current = session.state.game_time_ms;
    const onVisibility = () => { lastWall.current = performance.now(); }; document.addEventListener('visibilitychange', onVisibility);
    function frame(now: number) {
      if (stopped) return; const delta = Math.max(0, now - lastWall.current); lastWall.current = now;
      try {
        if (!pauseRef.current && !document.hidden && !session.state.terminal_result) {
          logicalTime.current = Math.min(session.state.mode.time_limit_ms, logicalTime.current + delta * speedRef.current);
          if (logicalTime.current - session.state.game_time_ms >= 50 || logicalTime.current >= session.state.mode.time_limit_ms) {
            const events = session.advanceTo(Math.floor(logicalTime.current)); renderer.accept(events);
            if (events.length) setLog(previous => [...previous, ...events.filter(event => ['cast_start', 'cast_interrupt', 'sp_skip', 'death'].includes(event.type))].slice(-12));
          }
        }
        if (session.state.terminal_result && !pauseRef.current && !document.hidden) visualTail = Math.min(2500, visualTail + delta);
        presentationClock.current = session.state.terminal_result ? session.state.game_time_ms : Math.min(logicalTime.current, session.state.game_time_ms + 49);
        if (drawRef.current && now - lastDraw >= 1000 / fpsRef.current - .5) { renderer.draw(session.view(), session.state.terminal_result ? session.state.game_time_ms + visualTail : Math.min(logicalTime.current, session.state.game_time_ms + 49)); lastDraw = now; }
        if (now - lastNotify >= 100) { setView(session.view()); lastNotify = now; }
      } catch (cause) { setError(String(cause)); pauseRef.current = true; setPaused(true); }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { stopped = true; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVisibility); };
  }, [application]);
  useEffect(() => {
    const node = canvas.current; if (!node) return;
    const resize = () => { const box = node.getBoundingClientRect(); if (box.width && box.height) { node.width = 720; node.height = Math.round(720 * box.height / box.width); } };
    const observer = new ResizeObserver(resize); observer.observe(node); resize(); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    application?.pack.setAudioLevels(audioLevels);
    try { saveAudioLevels(window.localStorage, audioLevels); } catch { /* Preferences do not block play. */ }
  }, [application, audioLevels]);
  useEffect(() => {
    if (!application) return;
    const visibility = () => { void application.pack.setAudioHidden(document.hidden).catch(() => setAudioError('เล่นเพลงต่อไม่สำเร็จ ลองปิดและเปิดเสียงอีกครั้ง')); };
    visibility(); document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [application]);
  useEffect(() => { if (application) application.renderer.selected = selected; }, [application, selected]);
  useEffect(() => { if (application) application.renderer.motion = motion; }, [application, motion]);
  useEffect(() => { setShowResult(false); if (!view?.terminal) return; const timer = setTimeout(() => setShowResult(true), 1200); return () => clearTimeout(timer); }, [application, view?.terminal?.kind]);
  async function restart(nextEncounter = encounter, rotations?: Record<string, readonly (string | null)[]>) {
    if (!application || !canvas.current) return; pauseRef.current = true; setLoading(true); setError(''); setSlotSelection(null); setEditing(false); setInspected(null);
    try {
      const session = new DemoSession(nextEncounter, seed, rotations); await application.pack.prepare(session.scene, session.view().actors.flatMap(actor => actor.slots.filter((id): id is string => !!id)));
      if (sound) { try { await application.pack.enableAudio(true, session.scene); setAudioError(''); } catch { setSound(false); setAudioError('เปิดเพลงประจำฉากไม่สำเร็จ ลองเปิดเสียงอีกครั้ง'); } }
      const renderer = new BattleRenderer(canvas.current, application.pack, session.scene); renderer.selected = selected; renderer.motion = motion;
      setApplication({ session, pack: application.pack, renderer }); setView(session.view()); setEncounter(nextEncounter); setLog([]); setPaused(false); pauseRef.current = false;
    } catch (cause) { setError(String(cause)); setPaused(true); } finally { setLoading(false); }
  }
  function swapSlot(index: number) {
    if (!application || slotSelection === null) { setSlotSelection(index); return; }
    if (slotSelection === index) { setSlotSelection(null); return; }
    const rotations = Object.fromEntries(application.session.view().actors.filter(actor => actor.team === 'player' && !actor.summon_of).map(actor => [actor.actor_id, [...actor.slots]]));
    const slots = rotations[selected]!; [slots[slotSelection], slots[index]] = [slots[index]!, slots[slotSelection]!]; void restart(encounter, rotations);
  }
  const party = view?.actors.filter(actor => actor.team === 'player' && !actor.summon_of) ?? [], enemies = view?.actors.filter(actor => actor.team === 'enemy' && !actor.summon_of) ?? [];
  const actor = party.find(actor => actor.actor_id === selected) ?? party[0], terminal = view?.terminal?.kind;
  const playerMetrics = application?.session.state.metrics.team.player;
  const label = (id: string | null) => id ? application?.session.scene.skill_labels[id] ?? id : 'ช่องว่าง';
  const preset = DEMO_ENCOUNTERS.find(row => row.id === encounter)!;
  const chosenId = actor?.slots[inspected ?? actor.next_slot], chosenSkill = chosenId ? application?.session.state.actors.find(row => row.actor_id === actor?.actor_id)?.resolved_skills[chosenId]?.definition : undefined;
  const selectActor = (id: string) => { setSelected(id); setSlotSelection(null); setInspected(null); setEditing(false); };
  const togglePause = () => { pauseRef.current = !pauseRef.current; setPaused(pauseRef.current); };
  const toggleSound = () => {
    if (!application) return; setSoundBusy(true); setAudioError('');
    void application.pack.enableAudio(!sound, application.session.scene).then(() => setSound(application.pack.soundEnabled)).catch(() => { setSound(false); setAudioError('เปิดเสียงไม่สำเร็จ ลองกดเปิดเสียงอีกครั้ง'); }).finally(() => setSoundBusy(false));
  };
  const openPanel = (next: typeof panel) => {
    setPanel(next);
    const cue = application?.pack.index.audio_events.ui_confirm;
    if (cue) void application!.pack.sound(cue.id).catch(() => {});
  };
  return <main className="adventure-app" data-theme={theme}>
    <header className="adventure-header"><div className="chapter-badge">{preset.stage}</div><div className="location-title"><small>RO IDLE CLASSIC</small><h1>{preset.name}</h1></div><button className="round-control audio-toggle" disabled={loading || soundBusy} aria-label={sound ? 'ปิดเสียง' : 'เปิดเสียง'} aria-pressed={sound} onClick={toggleSound}><Icon name={sound ? 'sound' : 'mute'} />{!sound && <span>เปิดเสียง</span>}</button></header>
    <section className="adventure-arena" aria-label="สนามต่อสู้"><canvas ref={canvas} width="720" height="820" aria-label="ตัวละครเดินเข้าระยะโจมตี สกิลใช้ได้ทุกระยะ" />
      <div className="arena-hud"><div className="arena-enemies" aria-label="สถานะศัตรู">{enemies.map(enemy => <div className="arena-enemy" key={enemy.actor_id}><div><strong>{enemy.name}</strong><small>{Math.ceil(enemy.hp).toLocaleString()} / {enemy.max_hp.toLocaleString()}</small></div><div className="slim-bar enemy"><i style={{ width: `${enemy.hp / enemy.max_hp * 100}%` }} /></div>{enemy.cast && <span className={enemy.cast.interruptible ? 'interruptible' : 'warded'}>{label(enemy.cast.skill_id)} · {enemy.cast.interruptible ? 'ขัดร่ายได้' : 'ขัดร่ายไม่ได้'}</span>}</div>)}</div><time className="arena-clock">{time(view?.game_time_ms ?? 0)}<small> / {time(view?.time_limit_ms ?? 90000)}</small></time></div>
      <div className="arena-controls"><button className="arena-control" disabled={loading || !!terminal} aria-label={paused ? 'เล่นต่อ' : 'หยุดชั่วคราว'} onClick={togglePause}><Icon name={paused ? 'play' : 'pause'} /></button><span>{paused ? 'หยุดชั่วคราว' : terminal ? 'จบการต่อสู้' : 'ต่อสู้อัตโนมัติ'}</span><button className="arena-control stats-control" aria-label="ดูสถิติการต่อสู้" disabled={loading} onClick={() => openPanel('statistics')}><Icon name="chart" /><span>สถิติ</span></button><button className="arena-control speed-control" aria-label="เปลี่ยนความเร็วต่อสู้" onClick={() => { const value = speed === 1 ? 2 : speed === 2 ? 4 : 1; setSpeed(value); speedRef.current = value; }}>{speed}×</button></div>
      {loading && <div className="arena-overlay" role="status"><span className="loading-rune"><Icon name="sparkles" /></span><strong>กำลังเตรียมสนาม…</strong></div>}
      {!drawing && !loading && <div className="drawing-paused">พักการวาดภาพ · การต่อสู้ยังเดินต่อ</div>}
      {terminal && showResult && !loading && <div className="arena-overlay result"><span><Icon name="sparkles" /></span><h2>{terminal === 'victory' ? 'ชนะแล้ว!' : terminal === 'time_limit' ? 'หมดเวลาการต่อสู้' : 'ลองจัดทีมใหม่อีกครั้ง'}</h2><button className="primary-button" onClick={() => void restart()}>สู้ใหม่</button><button className="result-stats" onClick={() => openPanel('statistics')}>ดูสถิติการต่อสู้</button></div>}
      {error && <div className="arena-error" role="alert">{error}<button onClick={() => window.location.reload()}>โหลดใหม่</button></div>}
    </section>
    <section className="companion-strip" aria-label="เลือกตัวโฟกัส">{party.map((member, index) => <button key={member.actor_id} data-actor={member.actor_id} className={`companion ${selected === member.actor_id ? 'focused' : ''} ${member.hp <= 0 ? 'fallen' : ''}`} aria-pressed={selected === member.actor_id} aria-label={`โฟกัส ${member.name}`} onClick={() => selectActor(member.actor_id)}>{application && <Portrait actor={member} pack={application.pack} />}<span className="companion-name">{index === 0 ? 'คุณ' : member.name.split(' · ')[0]} <small>Lv.{member.level}</small></span><div className="slim-bar hp"><i style={{ width: `${member.hp / member.max_hp * 100}%` }} /></div><div className="slim-bar sp"><i style={{ width: `${member.sp / Math.max(1, member.max_sp) * 100}%` }} /></div></button>)}</section>
    <section className={`rotation-dock ${editing ? 'editing' : ''}`} aria-label="คิวสกิลสี่ช่อง"><div className="rotation-title"><span>{actor?.name ?? 'กำลังเตรียมทีม'}</span><button disabled={loading} aria-pressed={editing} onClick={() => { setEditing(!editing); setSlotSelection(null); setInspected(null); }}>{editing ? 'ยกเลิก' : 'จัดคิว'}</button></div><div className="rotation-slots">{(actor?.slots ?? [null, null, null, null]).map((id, index) => <button key={index} className={`rotation-slot ${actor?.next_slot === index ? 'next' : ''} ${slotSelection === index ? 'picked' : ''}`} aria-label={`ช่อง ${index + 1}: ${label(id)}${editing ? ' เลือกเพื่อสลับ' : ''}`} aria-pressed={editing ? slotSelection === index : inspected === index} disabled={loading} onClick={() => editing ? swapSlot(index) : setInspected(inspected === index ? null : index)}><b>{index + 1}</b>{id && application?.pack.icons.get(id) ? <img src={application.pack.icons.get(id)} alt="" /> : <span><Icon name="sparkles" /></span>}<span>{label(id)}</span></button>)}</div>
      <div className="rotation-caption" role="status">{editing ? <span>{slotSelection === null ? 'แตะสองช่องเพื่อสลับลำดับ' : `เลือกช่อง ${slotSelection + 1} แล้ว · แตะช่องที่จะสลับ`} · เริ่มไฟต์ใหม่เมื่อเปลี่ยน</span> : inspected !== null && chosenSkill?.kind === 'active' ? <span>{label(chosenId ?? null)} · {typeof chosenSkill.cost.sp === 'number' ? chosenSkill.cost.sp : 'ทั้งหมด'} SP · ร่าย {(Number(chosenSkill.timing.cast_ms) / 1000).toFixed(1)}s · พัก {(Number(chosenSkill.timing.after_cast_ms) / 1000).toFixed(1)}s</span> : <><span>{actor ? phaseNames[actor.phase] : 'เตรียมพร้อม'}</span><div className="rotation-meter"><i style={{ width: `${actor && view ? phaseProgress(actor, view.game_time_ms) : 0}%` }} /></div><time>{actor?.phase_ready_at != null && view ? `${Math.max(0, (actor.phase_ready_at - view.game_time_ms) / 1000).toFixed(1)}s` : '—'}</time></>}</div>
    </section>
    <nav className="adventure-nav" aria-label="เมนูหลัก">{([{ id: null, icon: 'adventure', name: 'ผจญภัย' }, { id: 'team', icon: 'team', name: 'ทีม' }, { id: 'timeline', icon: 'timeline', name: 'Timeline' }, { id: 'settings', icon: 'settings', name: 'ตั้งค่า' }] as const).map(tab => <button key={tab.name} className={panel === tab.id ? 'active' : ''} aria-current={panel === tab.id ? 'page' : undefined} aria-label={tab.name} onClick={() => openPanel(tab.id)}><span><Icon name={tab.id === null ? 'adventure' : tab.id} /></span>{tab.name}</button>)}</nav>
    {panel && <Sheet title={panel === 'team' ? 'สหายร่วมทาง' : panel === 'timeline' ? 'Timeline สกิล' : panel === 'statistics' ? 'สถิติการต่อสู้' : 'ตั้งค่า'} close={() => setPanel(null)}>
      {panel === 'statistics' && application && view && <BattleStatistics report={application.session.statistics()} actors={view.actors} labels={application.session.scene.skill_labels} />}
      {panel === 'timeline' && application && view && <><div className="sheet-timeline-tools"><button onClick={togglePause} aria-label={paused ? 'เล่น Timeline ต่อ' : 'หยุด Timeline'}>{paused ? '▶ เล่นต่อ' : 'Ⅱ หยุดเวลา'}</button><span>คิวปัจจุบัน · {speed}×</span></div><SkillTimeline session={application.session} pack={application.pack} view={view} clock={presentationClock} /></>}
      {panel === 'team' && <div className="team-sheet"><p>เลือกตัวโฟกัสเพื่อดูคิวสกิล และดาเมจที่ตัวนั้นทำ</p>{party.map(member => <button key={member.actor_id} className={`team-member ${selected === member.actor_id ? 'focused' : ''}`} aria-pressed={selected === member.actor_id} onClick={() => selectActor(member.actor_id)}>{application && <Portrait actor={member} pack={application.pack} />}<div><strong>{member.name} <small>Lv.{member.level}</small></strong><span>HP {Math.ceil(member.hp)} / {member.max_hp}</span><div className="slim-bar hp"><i style={{ width: `${member.hp / member.max_hp * 100}%` }} /></div><span>SP {member.sp} / {member.max_sp} · {phaseNames[member.phase]}</span><div className="slim-bar sp"><i style={{ width: `${member.sp / Math.max(1, member.max_sp) * 100}%` }} /></div></div><span>{selected === member.actor_id ? '✓' : ''}</span></button>)}<div className="team-totals"><span>ดาเมจทีม <b>{Math.floor(playerMetrics?.hp_damage ?? 0).toLocaleString()}</b></span><span>ฮีลที่ได้ผล <b>{Math.floor(playerMetrics?.effective_heal ?? 0).toLocaleString()}</b></span></div><a className="account-link" href="/roster">จัดทีมและพัฒนาตัวละคร ↗</a><button className="sheet-primary" onClick={() => setPanel(null)}>กลับไปจัดคิวสกิล</button></div>}
      {panel === 'settings' && <div className="settings-sheet"><fieldset><legend>สนามทดลอง</legend><div className="encounter-choices">{DEMO_ENCOUNTERS.map(row => <button key={row.id} disabled={loading} aria-pressed={encounter === row.id} onClick={() => { void restart(row.id); setPanel(null); }}><strong>{row.name}</strong><small>{row.note}</small></button>)}</div></fieldset><fieldset><legend>การต่อสู้</legend><label>ความเร็ว <select aria-label="ความเร็วต่อสู้" value={speed} onChange={event => { const value = Number(event.target.value); setSpeed(value); speedRef.current = value; }}><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label><label>Seed <input type="number" min="0" max="4294967295" aria-label="Seed ของไฟต์" value={seed} onChange={event => setSeed(Number(event.target.value))} /></label><button className="sheet-primary" disabled={loading} onClick={() => { void restart(); setPanel(null); }}>เริ่มไฟต์ใหม่</button></fieldset><fieldset><legend>ภาพและเสียง</legend><label><span>เสียงเกม</span><input type="checkbox" checked={sound} disabled={soundBusy || loading} onChange={toggleSound} /></label><label className="audio-level"><span>เพลงพื้นหลัง BGM <output>{Math.round(audioLevels.music * 100)}%</output></span><input aria-label="ระดับเพลงพื้นหลัง BGM" type="range" min="0" max="100" value={Math.round(audioLevels.music * 100)} onChange={event => setAudioLevels({ ...audioLevels, music: Number(event.target.value) / 100 })} /></label><label className="audio-level"><span>เสียงเอฟเฟกต์ <output>{Math.round(audioLevels.effects * 100)}%</output></span><input aria-label="ระดับเสียงเอฟเฟกต์" type="range" min="0" max="100" value={Math.round(audioLevels.effects * 100)} onChange={event => setAudioLevels({ ...audioLevels, effects: Number(event.target.value) / 100 })} /></label>{audioError && <p className="audio-error" role="status">{audioError}</p>}<label><span>แอนิเมชันและเอฟเฟกต์</span><input type="checkbox" checked={motion} onChange={event => setMotion(event.target.checked)} /></label><label><span>วาดสนาม</span><input type="checkbox" checked={drawing} onChange={event => { setDrawing(event.target.checked); drawRef.current = event.target.checked; }} /></label><label>ภาพต่อวินาที <select aria-label="ภาพต่อวินาที" value={fps} onChange={event => { const value = Number(event.target.value); setFps(value); fpsRef.current = value; }}><option value="60">60</option><option value="30">30</option></select></label></fieldset><details><summary>บันทึกการต่อสู้</summary><ol className="combat-log">{log.map(event => <li key={event.sequence}><time>{time(event.at_ms)}</time><span>{view?.actors.find(actor => actor.actor_id === event.actor_id)?.name ?? event.actor_id} · {event.type === 'cast_interrupt' ? 'ถูกขัดร่าย' : event.type === 'sp_skip' ? 'SP ไม่พอ' : event.type === 'death' ? 'หมดสภาพ' : 'ใช้ ' + label(event.skill_id ?? null)}</span></li>)}</ol></details><a className="account-link" href="/auth">บัญชีส่วนตัว ↗</a><a className="account-link" href="/roster">ทีมและพัฒนาตัวละคร ↗</a><p className="prototype-note">สนามทดลอง · ยังไม่บันทึกความก้าวหน้า</p></div>}
    </Sheet>}
  </main>;
}
