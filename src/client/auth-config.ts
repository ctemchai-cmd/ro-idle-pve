import type { AppEnvironment, PublicAuthConfig } from '../contracts/auth.ts';
export type PublicConfigResult = { kind: 'unconfigured' } | { kind: 'configured'; config: PublicAuthConfig } | { kind: 'invalid'; code: string };
/** RFC 1918 / link-local / mDNS host: a page served on the home network, never the public internet. */
export function isPrivateLanHost(hostname: string): boolean {
  return /^(10\.\d+|192\.168|172\.(1[6-9]|2\d|3[01])|169\.254)\.\d+\.\d+$/.test(hostname) || /^[a-z0-9-]+\.local$/i.test(hostname);
}
/**
 * Reject privileged keys before bundling; the build script calls this too. `here` is the page location in the browser:
 * a `local` build that points at loopback follows the page when it is opened from a private LAN address (D-075, phone
 * on the home Wi-Fi via the personal preview's single same-origin gateway). Production and public hosts are unchanged.
 */
export function readPublicAuthConfig(env: Record<string, string | undefined>, here?: { hostname: string; origin: string; protocol: string }): PublicConfigResult {
  const url = env.VITE_SUPABASE_URL, key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url && !key) return { kind: 'unconfigured' };
  if (!url || !key) return { kind: 'invalid', code: 'PUBLIC_AUTH_CONFIG_INCOMPLETE' };
  const environment = env.VITE_APP_ENV;
  if (!['local', 'test', 'preview', 'production'].includes(environment ?? '')) return { kind: 'invalid', code: 'PUBLIC_AUTH_ENV_INVALID' };
  try {
    const parsed = new URL(url), loopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/' || !(parsed.protocol === 'https:' || parsed.protocol === 'http:' && loopback && ['local', 'test'].includes(environment!))) return { kind: 'invalid', code: 'PUBLIC_AUTH_URL_INVALID' };
    let publicKey = key.startsWith('sb_publishable_') && key.length >= 24;
    if (key.startsWith('eyJ')) {
      const encoded = key.split('.')[1];
      publicKey = !!encoded && JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon';
    }
    if (!publicKey || key.startsWith('sb_secret_')) return { kind: 'invalid', code: 'PRIVILEGED_OR_INVALID_BROWSER_KEY' };
    const follow = environment === 'local' && loopback && !!here && isPrivateLanHost(here.hostname) && ['http:', 'https:'].includes(here.protocol);
    return { kind: 'configured', config: { url: follow ? here!.origin : parsed.origin, publishable_key: key, environment: environment as AppEnvironment } };
  } catch { return { kind: 'invalid', code: 'PUBLIC_AUTH_CONFIG_INVALID' }; }
}
