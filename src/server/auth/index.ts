import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthenticatedIdentity, AuthResult } from '../../contracts/auth.ts';
import type { ServerAuthConfig } from './config.ts';

export function createServerSupabase(config: ServerAuthConfig): SupabaseClient {
  return createClient(config.url, config.service_key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
/** The SDK verifies JWTs with cached project JWKS; symmetric tokens use its Auth-server fallback. */
export async function authenticateRequest(request: Request, client: Pick<SupabaseClient, 'auth'>, issuer?: string): Promise<AuthResult<AuthenticatedIdentity>> {
  const header = request.headers.get('authorization');
  if (!header || header.length > 8192 || !/^Bearer [A-Za-z0-9._~-]+$/i.test(header)) return { ok: false, code: 'UNAUTHORIZED', status: 401 };
  try {
    const { data, error } = await client.auth.getClaims(header.slice(7));
    if (error || !data?.claims) { const unavailable = !!error && (!error.status || error.status >= 500); return { ok: false, code: unavailable ? 'AUTH_UPSTREAM_UNAVAILABLE' : 'UNAUTHORIZED', status: unavailable ? 503 : 401 }; }
    const claims = data.claims, audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    // Legacy self-hosted HS tokens may use a different issuer; the SDK has already verified them with this project's Auth server.
    const upstreamVerified = data.header.alg.startsWith('HS');
    if (claims.role !== 'authenticated' || !audience.includes('authenticated') || (!upstreamVerified && issuer && claims.iss !== issuer)) return { ok: false, code: 'UNAUTHORIZED', status: 401 };
    if (typeof claims.sub !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(claims.sub)) return { ok: false, code: 'INVALID_AUTH_IDENTITY', status: 401 };
    return { ok: true, value: { account_id: claims.sub, email: typeof claims.email === 'string' ? claims.email : null } };
  } catch (error) {
    // The pinned SDK's malformed UTF-8 decoder throws a plain Error rather than AuthInvalidJwtError.
    const malformed = error instanceof SyntaxError || (error instanceof Error && error.message === 'Invalid UTF-8 sequence');
    return malformed ? { ok: false, code: 'UNAUTHORIZED', status: 401 } : { ok: false, code: 'AUTH_UPSTREAM_UNAVAILABLE', status: 503 };
  }
}
