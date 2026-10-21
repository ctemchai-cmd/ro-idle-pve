import type { AuthResult } from '../contracts/auth.ts';
import type { AuthController } from './auth-controller.ts';

export interface AccountSummary { revision: number; updated_at: string }
/** Identity comes from the verified bearer; callers cannot choose an account ID. */
export function createAccountReader(auth: AuthController, request: typeof fetch = fetch) {
  return async (signal?: AbortSignal): Promise<AuthResult<AccountSummary>> => {
    const token = await auth.getAccessToken();
    if (!token) return { ok: false, code: 'SIGN_IN_REQUIRED', status: 401 };
    try {
      const response = await request('/api/account', { headers: { authorization: `Bearer ${token}` }, cache: 'no-store', signal });
      if (response.status === 401) { auth.markUnauthorized(); return { ok: false, code: 'SIGN_IN_REQUIRED', status: 401 }; }
      if (response.status === 404) return { ok: false, code: 'ACCOUNT_NOT_INITIALIZED', status: 404 };
      if (!response.ok) return { ok: false, code: 'SAVE_UNAVAILABLE', status: response.status };
      const body = await response.json() as { save?: { account_id?: unknown; revision?: unknown; updated_at?: unknown } };
      const save = body.save;
      if (!save || save.account_id !== auth.snapshot.user?.id || typeof save.revision !== 'number' || !Number.isSafeInteger(save.revision) || save.revision < 1 || typeof save.updated_at !== 'string' || !Number.isFinite(Date.parse(save.updated_at))) return { ok: false, code: 'INVALID_SAVE_RESPONSE', status: 502 };
      return { ok: true, value: { revision: save.revision, updated_at: save.updated_at } };
    } catch { return { ok: false, code: 'SAVE_UNAVAILABLE', status: 503 }; }
  };
}
