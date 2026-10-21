import { readPublicAuthConfig } from '../../src/client/auth-config.ts';
import { readServerAuthConfig } from '../../src/server/auth/config.ts';
import { containsPrivilegedValue, privilegedPublicNames } from './secret-guard.ts';

export function validateBuildEnvironment(env: Record<string, string | undefined>): string | null {
  if (privilegedPublicNames(env).length || Object.entries(env).some(([name, value]) => name.startsWith('VITE_') && value && containsPrivilegedValue(value, env))) return 'PRIVILEGED_BROWSER_ENV_FORBIDDEN';
  const browser = readPublicAuthConfig(env), server = readServerAuthConfig(env);
  if (browser.kind === 'invalid') return browser.code;
  if (server.kind === 'invalid') return server.code;
  if (browser.kind === 'configured') {
    if (server.kind === 'configured' && (browser.config.url !== server.config.url || browser.config.environment !== server.config.environment)) return 'BROWSER_SERVER_AUTH_ENVIRONMENT_MISMATCH';
    const ref = new URL(browser.config.url).hostname.split('.')[0];
    if (browser.config.environment !== 'production' && env.SUPABASE_PRODUCTION_PROJECT_REF && ref === env.SUPABASE_PRODUCTION_PROJECT_REF) return 'PRODUCTION_PROJECT_FORBIDDEN';
  }
  return null;
}
