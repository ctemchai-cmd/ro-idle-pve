import { Icon } from './icon.tsx';
import { InstallApp } from './pwa-install.tsx';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { AuthController } from '../client/auth-controller.ts';
import { readPublicAuthConfig } from '../client/auth-config.ts';
import { createBrowserAuth } from '../client/supabase-auth.ts';
import { createAccountReader } from '../client/account.ts';
import type { AccountSummary } from '../client/account.ts';
import type { AuthResult } from '../contracts/auth.ts';
import { SavePanel } from './save-panel.tsx';

function AuthShell({ children }: { children: ReactNode }) {
  return <div className="app-shell"><header className="topbar"><a className="brand" href="/play"><span className="brand-mark"><Icon name="sparkles" /></span><span><strong>RO<span>Idle Classic</span></strong><small>YOUR LITTLE ADVENTURE</small></span></a><a className="sound-button" href="/play">กลับเกม</a></header><main className="auth-layout"><div className="auth-intro"><p className="eyebrow">A PLACE FOR YOUR ADVENTURE</p><h1>การเดินทางของคุณ</h1><p>เข้าสู่บัญชีส่วนตัวเพื่อเชื่อมต่อเซฟของคุณ</p></div>{children}<InstallApp /><p className="auth-footnote">เซฟการผจญภัยผูกกับบัญชีของคุณ</p></main></div>;
}

export function AuthExperience({ auth, readAccount, savePanel, returnToPlay }: { auth: AuthController; readAccount: (signal?: AbortSignal) => Promise<AuthResult<AccountSummary>>; savePanel?: ReactNode; returnToPlay?: string }) {
  const [state, setState] = useState(auth.snapshot), [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState('');
  const [save, setSave] = useState<AccountSummary | null>(null);
  const operation = useRef(0), abort = useRef<AbortController | null>(null);
  useEffect(() => {
    const unsubscribe = auth.subscribe(setState); void auth.start();
    return () => { operation.current++; abort.current?.abort(); unsubscribe(); auth.dispose(); };
  }, [auth]);
  useEffect(() => { setPassword(''); setConfirmation(''); setSave(null); setMessage(''); setError(''); if (state.status === 'signed_in') setMode('signin'); abort.current?.abort(); operation.current++; setBusy(false); }, [state.status, state.user?.id]);
  useEffect(() => { if (returnToPlay && state.status === 'signed_in') window.location.replace(returnToPlay); }, [returnToPlay, state.status]);
  const recovery = state.status === 'recovery';
  function changeMode(next: 'signin' | 'reset') { setMode(next); setPassword(''); setConfirmation(''); setMessage(''); setError(''); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setError(''); setMessage('');
    if (recovery && password !== confirmation) { setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return; }
    setBusy(true);
    try {
      const result = recovery ? await auth.updatePassword(password) : mode === 'reset' ? await auth.resetPassword(email, new URL('/auth', window.location.origin).href) : await auth.signIn(email, password);
      if (!result.ok) setError(recovery ? 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาขอลิงก์ใหม่แล้วลองอีกครั้ง' : mode === 'reset' ? 'ส่งคำขอไม่สำเร็จ กรุณาลองอีกครั้ง' : 'เข้าใช้ไม่สำเร็จ กรุณาตรวจอีเมล รหัสผ่าน และการเชื่อมต่อ');
      else if (mode === 'reset' && !recovery) setMessage('หากมีบัญชีนี้ ระบบจะส่งลิงก์เปลี่ยนรหัสผ่านไปทางอีเมล กรุณาเปิดลิงก์ในเบราว์เซอร์นี้');
      else if (recovery) setMessage('เปลี่ยนรหัสผ่านแล้ว');
    } finally { setPassword(''); setConfirmation(''); setBusy(false); }
  }
  async function inspectSave() {
    setBusy(true); setError(''); setMessage(''); abort.current?.abort(); abort.current = new AbortController();
    const current = ++operation.current;
    const result = await readAccount(abort.current.signal);
    if (current !== operation.current) return;
    setBusy(false);
    if (result.ok) setSave(result.value);
    else if (result.code === 'ACCOUNT_NOT_INITIALIZED') setMessage('บัญชีนี้ยังไม่มีเซฟเกม เลือกผจญภัยต่อเพื่อสร้างตัวละคร');
    else if (result.status !== 401) setError('ยังอ่านเซฟไม่ได้ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง');
  }
  return <AuthShell><section className="auth-card" aria-label="บัญชีส่วนตัว">
    {state.status === 'loading' ? <p role="status">กำลังตรวจบัญชี…</p> : state.status === 'signed_in' ? <>
      <span className="auth-emblem" aria-hidden="true"><Icon name="sparkles" /></span><h2>ยินดีต้อนรับกลับ</h2><p className="auth-email">{state.user?.email ?? 'บัญชีส่วนตัว'}</p>
      {save && <p role="status">พบเซฟล่าสุด · {new Date(save.updated_at).toLocaleString('th-TH')}</p>}
      <button className="auth-primary" disabled={busy} onClick={() => void inspectSave()}>{busy ? 'กำลังตรวจ…' : 'ตรวจเซฟของฉัน'}</button>
      <a className="auth-secondary" href="/play">ผจญภัยต่อ</a><a className="auth-text" href="/roster">เปิดทีมและตัวละคร</a><button className="auth-text" disabled={busy} onClick={() => { setBusy(true); void auth.signOut().then(result => { if (!result.ok) setError('ออกจากบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง'); }).finally(() => setBusy(false)); }}>ออกจากบัญชี</button>
      {savePanel}
    </> : <>
      <span className="auth-emblem" aria-hidden="true"><Icon name="sparkles" /></span><h2>{recovery ? 'ตั้งรหัสผ่านใหม่' : mode === 'reset' ? 'กู้รหัสผ่าน' : 'เข้าสู่บัญชี'}</h2>
      {state.reason === 'expired' && <p className="auth-notice" role="status">เซสชันหมดอายุ กรุณาเข้าสู่บัญชีอีกครั้ง</p>}
      {state.reason === 'request_failed' && <p className="auth-notice" role="status">ตรวจบัญชีไม่สำเร็จ กรุณาตรวจการเชื่อมต่อ</p>}
      <form onSubmit={event => void submit(event)}>
        {!recovery && <label>อีเมล<input name="email" type="email" autoComplete="username" required value={email} disabled={busy} onChange={event => setEmail(event.target.value)} /></label>}
        {(recovery || mode === 'signin') && <label>{recovery ? 'รหัสผ่านใหม่' : 'รหัสผ่าน'}<input name="password" type="password" autoComplete={recovery ? 'new-password' : 'current-password'} required minLength={recovery ? 8 : 1} maxLength={256} value={password} disabled={busy} onChange={event => setPassword(event.target.value)} /></label>}
        {recovery && <label>ยืนยันรหัสผ่านใหม่<input name="confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={256} value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} /></label>}
        <button className="auth-primary" disabled={busy} type="submit">{busy ? 'กำลังดำเนินการ…' : recovery ? 'บันทึกรหัสผ่านใหม่' : mode === 'reset' ? 'ส่งลิงก์เปลี่ยนรหัสผ่าน' : 'เข้าสู่บัญชี'}</button>
      </form>
      {!recovery && <button className="auth-text" disabled={busy} onClick={() => changeMode(mode === 'reset' ? 'signin' : 'reset')}>{mode === 'reset' ? 'กลับเข้าสู่บัญชี' : 'ลืมรหัสผ่าน'}</button>}
    </>}
    {message && <p className="auth-notice" role="status">{message}</p>}{error && <p className="auth-error" role="alert">{error}</p>}
  </section></AuthShell>;
}

function ConfiguredAuth({ config }: { config: Extract<ReturnType<typeof readPublicAuthConfig>, { kind: 'configured' }>['config'] }) {
  const [auth] = useState(() => createBrowserAuth(config));
  const [readAccount] = useState(() => createAccountReader(auth));
  const requested = new URLSearchParams(window.location.search).get('next');
  // Only a relative game URL can be restored after login; never follow an external return URL.
  const returnToPlay = requested && /^\/play(?:\?|$)/.test(requested) ? requested : undefined;
  return <AuthExperience auth={auth} readAccount={readAccount} returnToPlay={returnToPlay} savePanel={returnToPlay ? undefined : <SavePanel auth={auth} scope={`${config.environment}:${new URL(config.url).host}`} />} />;
}
export default function AuthPage() {
  const config = readPublicAuthConfig(import.meta.env, window.location);
  if (config.kind !== 'configured') return <AuthShell><section className="auth-card"><span className="auth-emblem" aria-hidden="true"><Icon name="sparkles" /></span><h2>บัญชีส่วนตัว</h2><p role="status">{config.kind === 'invalid' ? 'การเชื่อมต่อบัญชียังไม่พร้อม กรุณาเล่นเดโมระหว่างรอ' : 'เดโมนี้ยังไม่ได้เชื่อมต่อระบบบัญชี'}</p><a className="auth-secondary" href="/demo">ไปเดโมต่อสู้</a></section></AuthShell>;
  return <ConfiguredAuth config={config.config} />;
}
