import { useEffect, useMemo, useRef, useState } from 'react';
import { SkillPreviewSession, previewJobs, previewSelection, previewSkills, previewSkillName, previewPackHash, previewSkillCount, type PreviewSelection } from '../client/skill-preview.ts';
import { previewSkillDetails } from '../client/skills.ts';
import { AssetPack } from '../renderer/pack.ts';
import { BattleRenderer } from '../renderer/battle.ts';
import { ClassIcon } from './game/class-icon.tsx';
import { Icon } from './icon.tsx';
import { SkillElements } from './element-badge.tsx';
import './modern-theme.css';
import './skill-preview.css';

interface Application { session: SkillPreviewSession; renderer: BattleRenderer }
function readSelection(): PreviewSelection {
  const query = new URLSearchParams(window.location.search);
  return previewSelection({ job: query.get('job') ?? undefined, skill: query.get('skill') ?? undefined, rank: Number(query.get('rank') ?? 1), gender: query.get('gender') ?? undefined });
}
const eventNames: Record<string, string> = { cast_start: 'ร่าย', cast_resolve: 'ใช้สกิล', cast_interrupt: 'ขัดร่าย', damage: 'ดาเมจ', heal: 'ฟื้น HP', shield: 'โล่', resource_change: 'บอล / SP', status_applied: 'ติดสถานะ', summon: 'เรียกผู้ช่วย', proc: 'Passive' };
export default function SkillPreviewPage() {
  const [selection, setSelection] = useState(readSelection), [pack, setPack] = useState<AssetPack | null>(null);
  const [app, setApp] = useState<Application | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [replay, setReplay] = useState(0), [paused, setPaused] = useState(false), [speed, setSpeed] = useState(1), [sound, setSound] = useState(false), [clock, setClock] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null), pausedRef = useRef(paused), speedRef = useRef(speed), queue = useRef(Promise.resolve());
  const skills = useMemo(() => previewSkills(selection.job), [selection.job]);
  const details = useMemo(() => previewSkillDetails(selection.skill, selection.rank), [selection.skill, selection.rank]);
  const job = previewJobs.find(j => j.id === selection.job)!;
  pausedRef.current = paused; speedRef.current = speed;
  useEffect(() => {
    let disposed = false, opened: AssetPack | null = null;
    void AssetPack.open(previewPackHash).then(p => {
      opened = p; if (disposed) { p.dispose(); return; }
      p.setAudioLevels({ music: 0, effects: .2 }); setPack(p);
    }).catch(() => { if (!disposed) { setError('โหลดภาพไม่สำเร็จ'); setLoading(false); } });
    return () => { disposed = true; opened?.dispose(); };
  }, []);
  useEffect(() => {
    const q = new URLSearchParams({ job: selection.job, skill: selection.skill, rank: String(selection.rank), gender: selection.gender });
    window.history.replaceState(null, '', '/skill-preview?' + q);
  }, [selection]);
  useEffect(() => {
    if (!pack) return;
    let current = true;
    for(const actor of pack.currentScene?.actors ?? []) pack.stopSound(`cast:${actor.actor_id}`);
    setLoading(true); setError(''); setApp(null); setClock(0); setPaused(false);
    // AssetPack owns a scene. Serialize preparations and discard stale selections before rendering.
    queue.current = queue.current.catch(() => {}).then(async () => {
      if (!current) return;
      const session = new SkillPreviewSession(selection);
      await Promise.all([pack.prepare(session.scene, session.preparedSkills), pack.prepareIcons(skills.map(s => s.id))]);
      if (!current || !canvas.current) return;
      const renderer = new BattleRenderer(canvas.current, pack, session.scene);
      renderer.selected = 'caster'; renderer.showStatuses = true;
      renderer.motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setApp({ session, renderer }); setLoading(false);
    }).catch(() => { if (current) { setError('เตรียมสกิลไม่สำเร็จ ลองอีกครั้ง'); setLoading(false); } });
    return () => { current = false; };
  }, [pack, selection, replay, skills]);
  useEffect(() => {
    if (!app || !pack) return;
    let raf = 0, stopped = false, last = performance.now(), logical = 0, notify = 0, tail = 0;
    const visible = () => { last = performance.now(); void pack.setAudioHidden(document.hidden || pausedRef.current).catch(() => setSound(false)); };
    document.addEventListener('visibilitychange', visible);
    function frame(now: number) {
      if (stopped) return;
      const delta = Math.min(100, Math.max(0, now - last)); last = now;
      try {
        if (!pausedRef.current && !document.hidden) {
          if (!app!.session.state.terminal_result) {
            logical = Math.min(20000, logical + delta * speedRef.current);
            if (logical - app!.session.state.game_time_ms >= 50 || logical === 20000) app!.renderer.accept(app!.session.advanceTo(logical));
          } else tail = Math.min(2000, tail + delta);
        }
        app!.renderer.draw(app!.session.view(), app!.session.state.terminal_result ? app!.session.state.game_time_ms + tail : Math.min(logical, app!.session.state.game_time_ms + 49));
        if (now - notify >= 100) { setClock(app!.session.state.game_time_ms); notify = now; }
      } catch { setError('เล่นตัวอย่างไม่สำเร็จ ลองอีกครั้ง'); stopped = true; }
      if (!stopped) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { stopped = true; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', visible); };
  }, [app, pack]);
  useEffect(() => { void pack?.setAudioHidden(document.hidden || paused).catch(() => setSound(false)); }, [pack, paused]);
  useEffect(() => {
    const node = canvas.current!;
    const resize = () => { const box = node.getBoundingClientRect(); if (box.width && box.height) { node.width = 720; node.height = Math.round(720 * box.height / box.width); } };
    const observer = new ResizeObserver(resize); observer.observe(node); resize(); return () => observer.disconnect();
  }, []);
  function choose(next: Partial<PreviewSelection>) { setSelection(previewSelection({ ...selection, ...next })); }
  async function toggleSound() {
    if (!pack || !app) return;
    try { await pack.enableAudio(!sound, app.session.scene); setSound(pack.soundEnabled); } catch { setError('เปิดเสียงไม่สำเร็จ ลองอีกครั้ง'); }
  }
  const active = details.definition.kind === 'active' ? details.definition : null;
  const events = app?.session.history.filter(e => eventNames[e.type] && (e.actor_id === 'caster' || e.type === 'cast_interrupt')).slice(-8) ?? [];
  const ready=!!app&&!loading&&app.session.selection.job===selection.job&&app.session.selection.skill===selection.skill&&app.session.selection.rank===selection.rank&&app.session.selection.gender===selection.gender;
  return <main className="skill-preview" data-theme="ro" data-ready={ready} data-job={selection.job} data-skill={selection.skill} data-rank={selection.rank}>
    <div className="sp-rotate" role="alert">หมุนเครื่องเป็นแนวตั้ง</div>
    <header className="sp-header"><a href="/play" aria-label="กลับเกม"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></a><div><h1>Skill Preview</h1><small>{previewJobs.length} อาชีพ · {previewSkillCount} สกิล</small></div><button onClick={() => void toggleSound()} disabled={!app || loading} aria-label={sound ? 'ปิดเสียง' : 'เปิดเสียง'} aria-pressed={sound}><Icon name={sound ? 'sound' : 'mute'} /></button></header>
    <div className="sp-picker"><ClassIcon job={selection.job} pack={pack} size={28} /><label><span className="sr-only">อาชีพ</span><select aria-label="อาชีพ" value={selection.job} onChange={e => choose({ job: e.target.value, skill: '' })}>{previewJobs.map(j => <option key={j.id} value={j.id}>{j.id.charAt(0).toUpperCase() + j.id.slice(1)}</option>)}</select></label><select aria-label="เพศ" value={selection.gender} onChange={e => choose({ gender: e.target.value })}>{job.genders.map(g => <option key={g} value={g}>{g === 'male' ? 'ชาย' : 'หญิง'}</option>)}</select></div>
    <div className="sp-skills" aria-label="เลือกสกิล">{skills.map(s => <button key={s.id} title={previewSkillName(s.id)} className={s.id === selection.skill ? 'selected' : ''} aria-pressed={s.id === selection.skill} aria-label={previewSkillName(s.id)} onClick={() => choose({ skill: s.id, rank: 1 })}>{pack?.icons.get(s.id) ? <img src={pack.icons.get(s.id)} alt="" /> : <span className="sp-icon-placeholder" />}<span>{previewSkillName(s.id)}</span>{s.kind === 'passive' && <i>P</i>}</button>)}</div>
    <section className="sp-scene" aria-label="สนามแสดงสกิล"><canvas ref={canvas} aria-label="ภาพเคลื่อนไหวสกิล" />{(loading || error) && <div className="sp-overlay" role={error ? 'alert' : 'status'}>{error || 'กำลังเตรียมภาพ…'}{error && <button onClick={() => window.location.reload()}>ลองอีกครั้ง</button>}</div>}<span className="sp-clock" aria-label="เวลาตัวอย่าง">{(clock / 1000).toFixed(1)}s</span></section>
    <div className="sp-controls"><button disabled={!app || loading} onClick={() => setPaused(p => !p)} aria-label={paused ? 'เล่นต่อ' : 'หยุดชั่วคราว'}><Icon name={paused ? 'play' : 'pause'} /></button><button disabled={!app || loading} onClick={() => setReplay(n => n + 1)}><Icon name="reset" />เล่นใหม่</button><button disabled={!app || loading} onClick={() => setSpeed(s => s === 4 ? 1 : s * 2)} aria-label="ความเร็ว">×{speed}</button><label>Lv.<select aria-label="เลเวลสกิล" value={selection.rank} onChange={e => choose({ rank: Number(e.target.value) })}>{Array.from({ length: details.definition.max_level }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label></div>
    <section className="sp-details"><h2>{previewSkillName(selection.skill)}<small>{active ? 'Active' : 'Passive'}</small></h2><SkillElements definition={details.definition} pack={pack} />{active && <p className="sp-timing">SP {typeof active.cost.sp === 'number' ? active.cost.sp : 'ทั้งหมด'} <span>ร่าย {Number(active.timing.cast_ms) / 1000}s</span><span>ACD {Number(active.timing.after_cast_ms) / 1000}s</span></p>}<ul>{details.effects.map((text, i) => <li key={i}>{text}</li>)}</ul><small>ตัวอย่าง Lv.70 · ATK / MATK ฐาน 300 · SP 1,000{active && Number(active.cost.spirit_spheres) > 0 ? ' · เริ่มด้วยบอล 5 ลูก' : ''}</small></section>
    <details className="sp-log"><summary>เหตุการณ์ล่าสุด</summary><ol>{events.map(e => <li key={e.sequence}><time>{(e.at_ms / 1000).toFixed(2)}s</time><span>{eventNames[e.type]}{e.amount !== undefined ? ` ${e.amount.toLocaleString()}` : ''}</span></li>)}</ol></details>
  </main>;
}
