import { AsyncLocalStorage } from 'node:async_hooks';
const current = new AsyncLocalStorage<Map<string, { ms: number; calls: number }>>();
function add(name: string, at: number) { const store = current.getStore(); if (!store) return; const row = store.get(name) ?? { ms: 0, calls: 0 }; row.ms += performance.now() - at; row.calls++; store.set(name, row); }
/** Request-local numbers only: no account IDs, payloads, tokens or cross-request state. */
export function timedSync<T>(name: string, run: () => T): T { if (!current.getStore()) return run(); const at = performance.now(); try { return run(); } finally { add(name, at); } }
export async function timed<T>(name: string, run: () => PromiseLike<T>): Promise<T> { if (!current.getStore()) return run(); const at = performance.now(); try { return await run(); } finally { add(name, at); } }
export async function captureTiming<T>(run: () => Promise<T>) { const rows = new Map<string, { ms: number; calls: number }>(); const value = await current.run(rows, run); return { value, header: [...rows].map(([name, row]) => `${name};dur=${row.ms.toFixed(1)};desc="${row.calls} calls"`).join(', ') }; }
