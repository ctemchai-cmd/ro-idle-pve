/** Local protocol test adapter only; never selected by the production API. */
export function createMemoryRepository<T>(initial: T) {
  let revision = 1;
  let state = structuredClone(initial);
  const receipts = new Map<string, { hash: string; revision: number; state: T }>();
  return {
    read() { return { revision, state: structuredClone(state) }; },
    commit(requestId: string, hash: string, expectedRevision: number, proposed: T) {
      const existing = receipts.get(requestId);
      if (existing) return existing.hash === hash ? { ok: true as const, replayed: true, receipt: structuredClone(existing) } : { ok: false as const, code: 'IDEMPOTENCY_KEY_REUSE' };
      if (expectedRevision !== revision) return { ok: false as const, code: 'REVISION_CONFLICT' };
      revision++; state = structuredClone(proposed);
      const receipt = { hash, revision, state: structuredClone(state) };
      receipts.set(requestId, receipt);
      return { ok: true as const, replayed: false, receipt: structuredClone(receipt) };
    },
  };
}
