import { useEffect, useRef, useState } from 'react';
import type { Command } from '../../contracts/index.ts';
import type { BackupListing, SaveController, SaveSnapshot } from '../../client/save-controller.ts';
import { clientContentHash, exportBackup, inspectBackup, safeSummary, type BackupInspection, type SaveSummary } from '../../client/backup.ts';
import { storyVersions } from '../../client/story.ts';
import type { GameContext } from './shell.tsx';
import { ClassIcon } from './class-icon.tsx';
import { Sheet, full, jobNames, reasonText } from './kit.tsx';
import { randomId } from '../../client/secure-context.ts';

const roots = ['swordsman', 'acolyte', 'archer', 'mage', 'thief', 'merchant'] as const;
const reasonLabel: Record<BackupListing['reason'], string> = { migration: 'ก่อนอัปเดตเซฟ', reset: 'ก่อนเริ่มเกมใหม่', restore: 'ก่อนกู้คืน', quarantine: 'เซฟที่เสียหาย' };
const relationText: Record<string, string> = { same: 'ตรงกับเซฟบนคลาวด์ตอนนี้', older: 'เก่ากว่าเซฟบนคลาวด์ · ใช้ดู/เก็บไว้เท่านั้น', newer_than_cloud: 'เลข revision ใหม่กว่าคลาวด์ · ไฟล์ไม่ตรงกับเซฟจริง', diverged: 'revision เดียวกันแต่ข้อมูลต่างกัน · ไฟล์ถูกแก้', other_account: 'เป็นเซฟของบัญชีอื่น' };
const compatText: Record<string, string> = { current: 'รุ่นข้อมูลเดียวกับเกมนี้', migratable: 'รุ่นข้อมูลเก่ากว่า', unsupported: 'รุ่นที่เกมนี้ไม่รองรับ' };
const when = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

/** Read-only side-by-side summary: what a restore/reset would replace (never merged). */
export function SummaryTable({ left, right, leftLabel, rightLabel }: { left: SaveSummary | null; right: SaveSummary | null; leftLabel: string; rightLabel: string }) {
  const rows: [string, (s: SaveSummary) => string][] = [
    ['ตัวหลัก', s => `${jobNames[s.main_job] ?? s.main_job} Lv.${s.main_level}`], ['ทอง', s => full(s.gold)], ['Crystal', s => full(s.crystal)], ['EXP', s => full(s.hero_exp)],
    ['อุปกรณ์ / การ์ด', s => `${s.items} / ${s.cards}`], ['ด่านที่ผ่าน', s => `${s.cleared_stages}${s.last_stage ? ` (ถึง ${s.last_stage})` : ''}`], ['หอคอย', s => `ชั้น ${s.tower_floor}`],
  ];
  return <table className="summary-table"><thead><tr><th /><th>{leftLabel}</th><th>{rightLabel}</th></tr></thead>
    <tbody>{rows.map(([label, value]) => { const a = left ? value(left) : '—', b = right ? value(right) : '—'; return <tr key={label} className={a !== b ? 'changed' : ''}><th>{label}</th><td>{a}</td><td>{b}</td></tr>; })}</tbody></table>;
}

/** `focusReset` (Settings → รีเซ็ตเซฟ) opens straight at the start-over form; the backup-first flow is unchanged. */
export function BackupSheet({ context, save, controller, close, focusReset = false }: { context: GameContext; save: SaveSnapshot; controller: SaveController; close: () => void; focusReset?: boolean }) {
  const [list, setList] = useState<BackupListing[] | null>(null), [listError, setListError] = useState(false), [inspection, setInspection] = useState<BackupInspection | null>(null);
  const [confirm, setConfirm] = useState<BackupListing | null>(null), [reset, setReset] = useState({ open: focusReset, root: 'mage' as (typeof roots)[number], gender: 'female' as 'male' | 'female', typed: '' });
  const ready = save.status === 'ready' && !save.pending, checkpoint = save.checkpoint, cloud = checkpoint ? safeSummary(checkpoint.save.state) : null, fileInput = useRef<HTMLInputElement>(null);
  const refresh = () => { setListError(false); controller.listBackups().then(setList).catch(() => setListError(true)); };
  const danger = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (focusReset) danger.current?.scrollIntoView({ block: 'start' }); }, [focusReset]);
  useEffect(refresh, [controller, checkpoint?.save.revision]);
  function download(name: string, text: string) { const url = URL.createObjectURL(new Blob([text], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function exportNow() { if (!checkpoint) return; const out = exportBackup(checkpoint, new Date().toISOString()); download(out.name, out.text); context.toast(`ดาวน์โหลดไฟล์สำรอง #${checkpoint.save.revision} แล้ว`); }
  async function pickFile(file: File | undefined) { if (!file) return; setInspection(await inspectBackup(await file.text(), checkpoint)); if (fileInput.current) fileInput.current.value = ''; }
  async function downloadServer(row: BackupListing) { try { download(`ro-idle-backup-${row.reason}-r${row.revision}.json`, JSON.stringify(await controller.downloadBackup(row.backup_id), null, 1)); } catch { context.toast('ดาวน์โหลดจุดสำรองไม่สำเร็จ'); } }
  async function restore(row: BackupListing) { if (!row.signature) return; const ok = await context.submit('backup.restore_request', { checkpoint_id: `backup:${row.backup_id}`, signature: row.signature }); if (ok) { context.toast(`กู้คืนเซฟ #${row.revision} แล้ว · เซฟก่อนหน้าถูกสำรองไว้`); setConfirm(null); refresh(); } }
  async function resetNow() { const ok = await context.submit('account.reset', { root_job_id: reset.root, gender: reset.gender, confirm: 'RESET' }); if (ok) { context.toast('เริ่มเกมใหม่แล้ว · กู้คืนเซฟเดิมได้จากจุดสำรองบนคลาวด์'); setReset(r => ({ ...r, open: false, typed: '' })); refresh(); } }
  const matching = inspection?.file ? list?.find(row => row.restorable && row.revision === inspection.file!.save.revision && row.signature === inspection.file!.save.signature) : undefined;

  if (confirm) return <Sheet title="ยืนยันกู้คืนเซฟ" onClose={() => setConfirm(null)} className="tall backup-sheet">
    <p className="hint">จะแทนที่เซฟตอนนี้ด้วยจุดสำรอง #{confirm.revision} ({reasonLabel[confirm.reason]} · {when(confirm.created_at)}) ทั้งก้อน เงิน/ไอเทมไม่รวมกัน</p>
    <SummaryTable left={cloud} right={confirm.summary as SaveSummary | null} leftLabel={`ตอนนี้ #${checkpoint?.save.revision ?? '—'}`} rightLabel={`จุดสำรอง #${confirm.revision}`} />
    <ul className="backup-rules"><li>เซฟปัจจุบันจะถูกสำรองบนคลาวด์ก่อนเขียน</li><li>เวลาฟาร์ม AFK และสิทธิ์รายวันของวันนี้ไม่ย้อนกลับ</li><li>กู้คืนจุดก่อนรีเซ็ตได้ครั้งเดียว</li></ul>
    <div className="row two"><button className="btn ghost" onClick={() => setConfirm(null)}>ยกเลิก</button><button className="btn primary" disabled={!ready} onClick={() => void restore(confirm)}>{save.status === 'saving' ? 'กำลังกู้คืน…' : 'ยืนยันกู้คืน'}</button></div>
  </Sheet>;
  return <Sheet title="เซฟและสำรองข้อมูล" onClose={close} className="tall backup-sheet">
    <section className="backup-pane"><h3>ส่งออก</h3>
      <p className="hint">ไฟล์เป็นสำเนาเซฟล่าสุดบนคลาวด์ที่เซิร์ฟเวอร์ลงลายเซ็น (#{checkpoint?.save.revision ?? '—'}) ไม่มีรหัสผ่านหรือ token</p>
      <button className="btn wide" disabled={!checkpoint} onClick={exportNow}>ดาวน์โหลดไฟล์สำรอง</button>
    </section>
    <section className="backup-pane"><h3>ตรวจไฟล์สำรอง</h3>
      <p className="hint">ใช้ดูและเทียบเท่านั้น ไฟล์จะไม่ถูกเขียนทับเซฟบนคลาวด์</p>
      <label className="btn wide file-btn">เลือกไฟล์ .json<input ref={fileInput} type="file" accept="application/json,.json" aria-label="เลือกไฟล์สำรอง" onChange={e => void pickFile(e.target.files?.[0])} /></label>
      {inspection && <div className={`backup-inspect ${inspection.ok && inspection.relation !== 'other_account' ? 'ok' : 'bad'}`} role="status">
        {!inspection.file ? <p>อ่านไฟล์ไม่ได้: {inspection.code === 'NOT_A_BACKUP' || inspection.code === 'NOT_JSON' ? 'ไม่ใช่ไฟล์สำรองของเกมนี้' : inspection.code === 'UNSUPPORTED_BACKUP_FORMAT' ? 'รูปแบบไฟล์รุ่นที่ไม่รองรับ' : 'ข้อมูลในไฟล์ไม่ครบ/เสียหาย'}</p> : <>
          <p><b>ไฟล์ #{inspection.file.save.revision}</b> · {inspection.relation ? relationText[inspection.relation] : ''} · {inspection.compat ? compatText[inspection.compat] : ''}{inspection.hash_ok ? '' : ' · ค่าตรวจสอบไม่ตรง (ไฟล์ถูกแก้)'}</p>
          <SummaryTable left={inspection.cloud} right={inspection.summary} leftLabel="คลาวด์ตอนนี้" rightLabel="ในไฟล์" />
          {matching ? <button className="btn primary wide" onClick={() => setConfirm(matching)}>ไฟล์นี้ตรงกับจุดก่อนรีเซ็ต · กู้คืน</button> : <p className="hint">กู้คืนได้เฉพาะจุดก่อนรีเซ็ตที่เก็บบนคลาวด์ หรือเมื่อเซฟเสียหาย (ระบบจะเสนอเอง)</p>}
        </>}
      </div>}
    </section>
    <section className="backup-pane"><h3>จุดสำรองบนคลาวด์</h3>
      {listError ? <p className="hint warn">โหลดรายการไม่สำเร็จ <button className="btn small" onClick={refresh}>ลองใหม่</button></p> : !list ? <p className="hint">กำลังโหลด…</p> : !list.length ? <p className="hint">ยังไม่มีจุดสำรอง · ระบบสำรองให้อัตโนมัติก่อนอัปเดตเซฟ/เริ่มเกมใหม่/กู้คืน</p> :
        <ul className="backup-list">{list.map(row => { const s = row.summary as SaveSummary | null; return <li key={row.backup_id} className={row.restorable ? 'restorable' : ''}>
          <div><b>#{row.revision} · {reasonLabel[row.reason]}</b><small>{when(row.created_at)}{s ? ` · ${jobNames[s.main_job] ?? s.main_job} Lv.${s.main_level} · ทอง ${full(s.gold)} · ${s.cleared_stages} ด่าน` : ''}</small></div>
          <div className="row">{row.signed && <button className="btn small" onClick={() => void downloadServer(row)}>ดาวน์โหลด</button>}{row.restorable && <button className="btn small primary" disabled={!ready} onClick={() => setConfirm(row)}>กู้คืน</button>}</div>
        </li>; })}</ul>}
    </section>
    <details ref={danger} className="danger-zone" open={focusReset || undefined}><summary>โซนอันตราย · เริ่มเกมใหม่</summary>
      <p className="hint">ลบความคืบหน้าทั้งหมดและเริ่มที่ Lv.1 ใหม่ เซฟตอนนี้จะถูกสำรองบนคลาวด์ก่อน และกู้คืนได้ 1 ครั้งจากรายการด้านบน สิทธิ์รายวันของวันนี้ไม่รีเซ็ต</p>
      {!reset.open ? <button className="btn danger wide" disabled={!ready} onClick={() => setReset(r => ({ ...r, open: true }))}>เริ่มเกมใหม่…</button> : <div className="reset-form">
        <div className="chip-row" role="radiogroup" aria-label="สายเริ่มต้น">{roots.map(root => <button key={root} role="radio" aria-checked={reset.root === root} className={`chip ${reset.root === root ? 'on' : ''}`} onClick={() => setReset(r => ({ ...r, root }))}><ClassIcon job={root} size={16} />{jobNames[root]}</button>)}</div>
        <div className="chip-row" role="radiogroup" aria-label="เพศ">{(['female', 'male'] as const).map(g => <button key={g} role="radio" aria-checked={reset.gender === g} className={`chip ${reset.gender === g ? 'on' : ''}`} onClick={() => setReset(r => ({ ...r, gender: g }))}>{g === 'female' ? 'หญิง' : 'ชาย'}</button>)}</div>
        <label className="confirm-input"><span>พิมพ์ RESET เพื่อยืนยัน</span><input value={reset.typed} autoComplete="off" onChange={e => setReset(r => ({ ...r, typed: e.target.value }))} /></label>
        <div className="row two"><button className="btn ghost" onClick={() => setReset(r => ({ ...r, open: false, typed: '' }))}>ยกเลิก</button><button className="btn danger" disabled={!ready || reset.typed !== 'RESET'} onClick={() => void resetNow()}>ลบและเริ่มใหม่</button></div>
      </div>}
    </details>
  </Sheet>;
}

/** Blocking panel for the two states where the cloud save cannot be played as-is (TASK-040 AC-02/AC-04). */
export function MaintenancePanel({ save, controller }: { save: SaveSnapshot; controller: SaveController }) {
  const [busy, setBusy] = useState(false), [failed, setFailed] = useState<string | null>(null);
  const detail = save.detail as { migration?: { from_revision: number; from_content_hash: string; server_content_hash: string; changes: string[]; before: SaveSummary | null; after: SaveSummary }; recovery?: { checkpoint_id: string; signature: string; revision: number; summary: SaveSummary | null } | null } | null | undefined;
  async function run(command: Command) { setBusy(true); setFailed(null); try { await controller.maintain(command); const r = controller.snapshot.lastReceipt; if (r?.request_id !== command.request_id) setFailed(controller.snapshot.reason ?? 'ยังไม่ได้รับผลจากเซิร์ฟเวอร์'); } catch (error) { setFailed(error instanceof Error ? error.message : 'ERROR'); } finally { setBusy(false); } }
  if (save.reason === 'SAVE_MIGRATION_REQUIRED' && detail?.migration) {
    const m = detail.migration;
    if (m.server_content_hash !== clientContentHash) return <div className="maintenance-panel" role="alertdialog" aria-label="ต้องโหลดเกมใหม่"><h2>มีเกมรุ่นใหม่</h2><p>โหลดหน้าใหม่ก่อน แล้วระบบจะเสนออัปเดตเซฟให้</p><button className="btn primary" onClick={() => window.location.reload()}>โหลดใหม่</button></div>;
    return <div className="maintenance-panel" role="alertdialog" aria-label="อัปเดตเซฟ">
      <h2>อัปเดตเซฟเป็นรุ่นใหม่</h2>
      <p className="hint">เซฟ #{m.from_revision} สร้างจากเกมรุ่นก่อน ต้องปรับให้ตรงกับกติกาปัจจุบันก่อนเล่นต่อ ระบบจะสำรองเซฟเดิมไว้บนคลาวด์ก่อนเสมอ</p>
      <SummaryTable left={m.before} right={m.after} leftLabel={`เดิม #${m.from_revision}`} rightLabel="หลังอัปเดต" />
      <details className="change-list"><summary>รายการที่เปลี่ยน ({m.changes.length})</summary><ul>{m.changes.map(c => <li key={c}>{c}</li>)}</ul></details>
      {failed && <p className="hint warn">{reasonText[failed] ?? `อัปเดตไม่สำเร็จ (${failed}) · เซฟเดิมยังอยู่ครบ`}</p>}
      <button className="btn primary wide" disabled={busy} onClick={() => void run({ type: 'save.migrate', params: { from_revision: m.from_revision, from_content_hash: m.from_content_hash }, request_id: randomId(), expected_revision: m.from_revision, ...storyVersions } as Command)}>{busy ? 'กำลังสำรองและอัปเดต…' : 'สำรองแล้วอัปเดตเซฟ'}</button>
    </div>;
  }
  if (save.reason === 'SAVE_INTEGRITY_FAILED') {
    const source = detail?.recovery ?? null;
    return <div className="maintenance-panel" role="alertdialog" aria-label="กู้คืนเซฟ">
      <h2>เซฟบนคลาวด์ตรวจสอบไม่ผ่าน</h2>
      {source ? <>
        <p className="hint">ข้อมูลเซฟไม่ตรงกับลายเซ็นของเซิร์ฟเวอร์ พบจุดล่าสุดที่ลายเซ็นถูกต้อง #{source.revision} ข้อมูลที่เสียจะถูกเก็บไว้ก่อนกู้คืน</p>
        <SummaryTable left={null} right={source.summary} leftLabel="ข้อมูลที่เสีย" rightLabel={`จุดที่ถูกต้อง #${source.revision}`} />
        {failed && <p className="hint warn">{reasonText[failed] ?? `กู้คืนไม่สำเร็จ (${failed})`}</p>}
        <button className="btn primary wide" disabled={busy} onClick={() => void run({ type: 'backup.restore_request', params: { checkpoint_id: source.checkpoint_id, signature: source.signature }, request_id: randomId(), expected_revision: source.revision, ...storyVersions } as Command)}>{busy ? 'กำลังกู้คืน…' : `กู้คืนเซฟ #${source.revision}`}</button>
      </> : <p className="hint">ยังไม่พบจุดที่ลายเซ็นถูกต้อง · ระบบไม่ได้แก้ไขข้อมูลใด ๆ · ติดต่อผู้ดูแลเพื่อกู้จากสำรองบนเซิร์ฟเวอร์</p>}
    </div>;
  }
  return null;
}
