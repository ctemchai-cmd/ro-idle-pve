import { createContext, useContext, useEffect, useState } from 'react';
import type { SaveStatus } from '../../client/save-controller.ts';

interface RecoveryState { status: SaveStatus; pending: boolean; retry: () => void }
const RecoveryContext = createContext<RecoveryState | null>(null);
export const SaveRecoveryProvider = RecoveryContext.Provider;

/** Inside the active dialog, so a failed save never hides its retry behind an inert page. */
export function SaveNotice() {
  const save = useContext(RecoveryContext), [long, setLong] = useState(false);
  useEffect(() => {
    setLong(false);
    if (save?.status !== 'saving') return;
    const timer = setTimeout(() => setLong(true), 3000); return () => clearTimeout(timer);
  }, [save?.status]);
  if (!save) return null;
  const failed = save.status === 'offline' || save.status === 'error';
  if (!failed && !(save.pending && (save.status === 'loading' || (save.status === 'saving' && long)))) return null;
  return <div className={`save-notice${failed ? ' failed' : ''}`} role={failed ? 'alert' : 'status'}><span>{failed ? 'ยังยืนยันการบันทึกไม่ได้' : save.status === 'loading' ? 'กำลังตรวจผลรายการเดิม…' : 'กำลังบันทึก กรุณารอสักครู่…'}</span>{failed && <button type="button" onClick={save.retry}>ตรวจผลอีกครั้ง</button>}</div>;
}
