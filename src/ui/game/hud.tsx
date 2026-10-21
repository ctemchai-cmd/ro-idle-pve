import { useState } from 'react';
import type { SaveController, SaveSnapshot } from '../../client/save-controller.ts';
import { BackupSheet } from './backup.tsx';
import type { GameContext } from './shell.tsx';
import { Icon } from '../icon.tsx';
import { readAudioLevels, saveAudioLevels } from '../../renderer/audio-preferences.ts';
import { ClassIcon } from './class-icon.tsx';
import { ActorCanvas, ResIcon, Sheet, compact, friendNames, full, jobNames, lookOf, resourceNames, type Wallet } from './kit.tsx';

const statusText: Record<string, string> = { ready: 'บันทึกแล้ว', saving: 'กำลังบันทึก…', offline: 'ขาดการเชื่อมต่อ · พักความคืบหน้า', read_only: 'เปิดดู · อีกแท็บกำลังเล่น', incompatible: 'มีเกมรุ่นใหม่ · โหลดหน้าใหม่', loading: 'กำลังตรวจเซฟ…', error: 'เซฟมีปัญหา · เชื่อมต่อใหม่', signed_out: 'ออกจากระบบแล้ว', idle: 'กำลังเตรียม…' };
const walletOrder: (keyof Wallet)[] = ['gold', 'hero_exp', 'crystal', 'skill_manual', 'breakthrough_essence', 'refine_ore', 'enchant_dust', 'card_dust'];

export function TopHud({ context, save, controller, sound, toggleSound, reconnect }: { context: GameContext; save: SaveSnapshot; controller: SaveController; sound: boolean; toggleSound: () => void; reconnect: () => void }) {
  const { state, pack } = context, main = state.roster.find(a => a.character_id === 'main')!, [sheet, setSheet] = useState<'wallet' | 'settings' | 'backup' | 'reset' | null>(null);
  const tone = save.status === 'ready' ? 'ok' : save.status === 'saving' || save.status === 'loading' ? 'busy' : 'bad';
  // TASK-040: the maintenance panel explains a save that needs migration/recovery; the generic alert would mislead.
  const maintenance = save.reason === 'SAVE_MIGRATION_REQUIRED' || save.reason === 'SAVE_INTEGRITY_FAILED';
  const [levels, setLevels] = useState(() => { try { return readAudioLevels(window.localStorage); } catch { return { music: .12, effects: .2 }; } });
  // Volume applies immediately and is remembered on this device only.
  function changeLevel(kind: 'music' | 'effects', percent: number) { const next = { ...levels, [kind]: percent / 100 }; setLevels(next); pack?.setAudioLevels(next); try { saveAudioLevels(window.localStorage, next); } catch { /* Session-only fallback. */ } }
  return <>
    <header className="hud">
      <button className="hud-avatar" aria-label="ดูตัวละครหลัก" onClick={() => context.go('buddy', 'main')}>
        <ActorCanvas pack={pack} look={lookOf(main, state)} width={96} height={96} scale={2} footY={162} className="avatar-canvas" />
        <span className="avatar-level">{main.level}</span>
      </button>
      <div className="hud-main">
        <div className="hud-name"><strong>{friendNames.main}</strong><ClassIcon job={main.job_id} size={16} /><span>{jobNames[main.job_id]}</span><button className={`hud-save ${tone}`} aria-label={`สถานะเซฟ: ${statusText[save.status] ?? save.status}`} title={statusText[save.status]} onClick={() => setSheet('settings')}><i /></button></div>
        <button className="hud-wallet" aria-label="ดูทรัพยากรทั้งหมด" onClick={() => setSheet('wallet')}>
          {(['gold', 'hero_exp', 'crystal'] as const).map(k => <span key={k} className="hud-chip"><ResIcon pack={pack} k={k} /><b data-testid={k === 'gold' ? 'story-gold' : undefined}>{compact(state.wallet[k])}</b></span>)}
        </button>
      </div>
      <div className="hud-actions">
        <button className="icon-btn hud-icon" aria-label={sound ? 'ปิดเสียง' : 'เปิดเสียง'} aria-pressed={sound} onClick={toggleSound}><Icon name={sound ? 'sound' : 'mute'} /></button>
        <button className="icon-btn hud-icon" aria-label="ตั้งค่า" onClick={() => setSheet('settings')}><Icon name="settings" /></button>
      </div>
    </header>
    {(save.status === 'offline' || save.status === 'error' || save.status === 'read_only' || save.status === 'incompatible') && !maintenance && <div className="hud-alert" role="alert"><span>{statusText[save.status]}</span>{save.status === 'incompatible' ? <button onClick={() => window.location.reload()}>โหลดใหม่</button> : <button disabled={!navigator.onLine} onClick={reconnect}>เชื่อมต่อใหม่</button>}</div>}
    {sheet === 'wallet' && <Sheet title="ทรัพยากร" onClose={() => setSheet(null)}>
      <ul className="wallet-list">{walletOrder.map(k => <li key={k}><ResIcon pack={pack} k={k} /><span>{resourceNames[k]}</span><b>{full(state.wallet[k])}</b></li>)}</ul>
      <p className="hint">ได้จากฟาร์มอัตโนมัติ รางวัลผ่านด่าน และการย่อยของ</p>
    </Sheet>}
    {sheet === 'settings' && <Sheet title="ตั้งค่าและเซฟ" onClose={() => setSheet(null)}>
      <div className="settings-list">
        <div className="settings-row"><span>สถานะเซฟ</span><b className={`save-text ${tone}`}>{statusText[save.status] ?? save.status}{save.checkpoint ? ` · #${save.checkpoint.save.revision}` : ''}</b></div>
        <button className="btn" disabled={save.status === 'loading' || save.status === 'saving' || !navigator.onLine} onClick={reconnect}>เชื่อมต่อเซฟใหม่</button>
        <div className="settings-row"><span>เสียงและเพลง</span><button className="btn small" onClick={toggleSound}>{sound ? 'ปิดเสียง' : 'เปิดเสียง'}</button></div>
        {(['music', 'effects'] as const).map(kind => <label key={kind} className="volume-row"><span><Icon name={kind === 'music' ? 'music' : 'sound'} /> {kind === 'music' ? 'เพลง' : 'เอฟเฟกต์'}</span><input type="range" min={0} max={100} step={5} value={Math.round(levels[kind] * 100)} aria-label={kind === 'music' ? 'ระดับเสียงเพลง' : 'ระดับเสียงเอฟเฟกต์'} onChange={e => changeLevel(kind, Number(e.target.value))} /><output>{Math.round(levels[kind] * 100)}%</output></label>)}
        <button className="btn" onClick={() => setSheet('backup')}><Icon name="save" />สำรอง / กู้คืนเซฟ</button>
        <button className="btn danger-outline" onClick={() => setSheet('reset')}><Icon name="reset" />รีเซ็ตเซฟ · เริ่มเกมใหม่</button>
        <a className="btn" href="/auth">บัญชี / ออกจากระบบ</a>
        <a className="btn ghost" href="/">สนามทดลองการต่อสู้</a>
      </div>
      <p className="hint">เซฟหลักอยู่บนเซิร์ฟเวอร์ และสำรองล่าสุดไว้ในเครื่องนี้</p>
    </Sheet>}
    {(sheet === 'backup' || sheet === 'reset') && <BackupSheet context={context} save={save} controller={controller} close={() => setSheet(null)} focusReset={sheet === 'reset'} />}
  </>;
}
