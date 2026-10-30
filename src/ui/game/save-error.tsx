/** Bounded public error identifier only; never render response bodies, keys or save data. */
export function SaveErrorCode({ reason }: { reason: string | null }) {
  if (!reason) return null;
  const code = /^[A-Z][A-Z0-9_]{0,79}$/.test(reason) ? reason : 'UNKNOWN_SAVE_ERROR';
  return <code className="save-error-code" aria-label={`รหัสปัญหาเซฟ ${code}`}>รหัส: {code}</code>;
}
