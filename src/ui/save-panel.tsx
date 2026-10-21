import type { AuthController } from '../client/auth-controller.ts';
import { useAccountSave } from './account-session.ts';
import type { AccountState } from '../contracts/index.ts';
import { randomId } from '../client/secure-context.ts';

export function SavePanel({ auth, scope }: { auth: AuthController; scope: string }) {
  const { controller, save } = useAccountSave(auth, scope);
  const state = save.checkpoint?.save.state as AccountState | undefined;
  const labels = { idle: 'รอเชื่อมต่อ', loading: 'กำลังตรวจเซฟล่าสุด…', ready: 'เซฟพร้อมใช้งาน', saving: 'กำลังบันทึก…', offline: 'ขาดการเชื่อมต่อ · พักความคืบหน้า', read_only: 'เปิดดูเซฟ · มีอีกแท็บกำลังเล่น', signed_out: 'เข้าสู่บัญชีอีกครั้งเพื่อเล่นต่อ', incompatible: 'มีอัปเดต · กรุณาโหลดเกมใหม่', error: save.reason === 'ACCOUNT_NOT_INITIALIZED' ? 'ยังไม่ได้สร้างตัวละคร' : 'ยังเปิดเซฟไม่ได้ กรุณาลองอีกครั้ง' };
  return <section className="save-panel" aria-label="สถานะเซฟ"><p role="status">{labels[save.status]}</p>{save.checkpoint && <p>เซฟ #{save.checkpoint.save.revision} · ตัวละคร {state?.roster.length ?? 0} ตัว{save.status === 'offline' ? ' · สำรองล่าสุดในเครื่อง' : ''}</p>}
    {state?.pending_rewards.map(claim => <button key={claim.claim_id} className="auth-secondary" disabled={save.status !== 'ready'} onClick={() => { const s = save.checkpoint!.save; void controller.submit({ type: 'reward.claim', params: { claim_id: claim.claim_id }, request_id: randomId(), expected_revision: s.revision, schema_version: 1, content_version: s.content_version, content_hash: s.content_hash, rules_version: s.rules_version }); }}>รับรางวัลที่บันทึกไว้</button>)}
    <button className="auth-text" disabled={save.status === 'loading' || save.status === 'saving' || !navigator.onLine} onClick={() => void controller.reconnect()}>เชื่อมต่อเซฟอีกครั้ง</button>
  </section>;
}
