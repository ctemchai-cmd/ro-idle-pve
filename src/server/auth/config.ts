import type { AppEnvironment } from '../../contracts/auth.ts';
export interface ServerAuthConfig { url: string; service_key: string; environment: AppEnvironment; project_ref: string }
export type ServerConfigResult = { kind: 'unconfigured' } | { kind: 'invalid'; code: string } | { kind: 'configured'; config: ServerAuthConfig };
export function readServerAuthConfig(env: Record<string, string | undefined>): ServerConfigResult {
  const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY, environment = env.APP_ENV;
  if (!url && !key) return { kind: 'unconfigured' };
  if (!url || !key || !['local', 'test', 'preview', 'production'].includes(environment ?? '')) return { kind: 'invalid', code: 'SERVER_AUTH_CONFIG_INCOMPLETE' };
  try {
    const parsed = new URL(url), loopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/' || !(parsed.protocol === 'https:' || parsed.protocol === 'http:' && loopback && ['local', 'test'].includes(environment!))) return { kind: 'invalid', code: 'SERVER_AUTH_URL_INVALID' };
    let serverKey = key.startsWith('sb_secret_') && key.length >= 24;
    if (key.startsWith('eyJ')) {
      const encoded = key.split('.')[1]; serverKey = !!encoded && JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role';
    }
    if (!serverKey) return { kind: 'invalid', code: 'SERVER_SERVICE_KEY_INVALID' };
    const projectRef = loopback ? 'local' : parsed.hostname.split('.')[0]!;
    const expected = environment === 'production' ? env.SUPABASE_PRODUCTION_PROJECT_REF : env.SUPABASE_TEST_PROJECT_REF;
    if (!loopback && (!expected || projectRef !== expected)) return { kind: 'invalid', code: 'SUPABASE_PROJECT_ENVIRONMENT_MISMATCH' };
    if (environment !== 'production' && env.SUPABASE_PRODUCTION_PROJECT_REF === projectRef) return { kind: 'invalid', code: 'PRODUCTION_PROJECT_FORBIDDEN' };
    return { kind: 'configured', config: { url: parsed.origin, service_key: key, environment: environment as AppEnvironment, project_ref: projectRef } };
  } catch { return { kind: 'invalid', code: 'SERVER_AUTH_CONFIG_INVALID' }; }
}
