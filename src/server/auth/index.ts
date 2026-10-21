import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthenticatedIdentity, AuthResult } from '../../contracts/auth.ts';
import type { ServerAuthConfig } from './config.ts';

export function createServerSupabase(config: ServerAuthConfig): SupabaseClient {
  return createClient(config.url, config.service_key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
/** getUser verifies the token with Supabase Auth; no client-provided UID is used. */
export async function authenticateRequest(request: Request, client: Pick<SupabaseClient, 'auth'>): Promise<AuthResult<AuthenticatedIdentity>> {
  const header = request.headers.get('authorization');
  if (!header || header.length > 8192 || !/^Bearer [A-Za-z0-9._~-]+$/i.test(header)) return { ok: false, code: 'UNAUTHORIZED', status: 401 };
  try {
    const { data, error } = await client.auth.getUser(header.slice(7));
    if (error || !data.user) { const unavailable = !!error && (!error.status || error.status >= 500); return { ok: false, code: unavailable ? 'AUTH_UPSTREAM_UNAVAILABLE' : 'UNAUTHORIZED', status: unavailable ? 503 : 401 }; }
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(data.user.id)) return { ok: false, code: 'INVALID_AUTH_IDENTITY', status: 401 };
    return { ok: true, value: { account_id: data.user.id, email: data.user.email ?? null } };
  } catch { return { ok: false, code: 'AUTH_UPSTREAM_UNAVAILABLE', status: 503 }; }
}
