import { useSyncExternalStore } from 'react';
import { installApp, installState, subscribeInstall } from '../client/pwa.ts';
import { Icon } from './icon.tsx';
import './pwa.css';

export function InstallApp() {
  const state = useSyncExternalStore(subscribeInstall, installState);
  if (state.installed) return null;
  if (state.available || state.busy) return <div className="pwa-install"><button className="btn pwa-install-button" disabled={state.busy} onClick={() => void installApp()}><Icon name="download" />{state.busy ? 'กำลังติดตั้ง…' : 'ติดตั้งแอป'}</button></div>;
  return <details className="pwa-install pwa-install-guide" open={state.failed || undefined}>
    <summary className="btn pwa-install-button"><Icon name="download" />ติดตั้งแอป</summary>
    <p>{state.ios ? <>เปิดด้วย Safari กด<Icon name="share" /> <b>แชร์</b> แล้วเลือก <b>เพิ่มไปยังหน้าจอโฮม</b> และกด <b>เพิ่ม</b></> : <>เปิดเมนูเบราว์เซอร์ แล้วเลือก <b>ติดตั้งแอป</b> หรือ <b>เพิ่มไปยังหน้าจอหลัก</b></>}</p>
    {state.failed && <p role="status">ยังติดตั้งไม่สำเร็จ ลองติดตั้งผ่านเมนูเบราว์เซอร์ได้ครับ</p>}
  </details>;
}
