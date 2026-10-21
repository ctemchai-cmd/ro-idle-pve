import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import type { AuthProvider, ProviderSession, PublicAuthConfig } from '../contracts/auth.ts';
import { AuthController } from './auth-controller.ts';

function sessionView(session: Session | null): ProviderSession | null {
  return session ? { user: { id: session.user.id, email: session.user.email ?? null }, access_token: session.access_token, expires_at: session.expires_at ?? 0 } : null;
}
export function createBrowserAuth(config: PublicAuthConfig): AuthController {
  const client = createClient(config.url, config.publishable_key, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: `ro-idle:${config.environment}:${new URL(config.url).host}:auth` } });
  const provider: AuthProvider = {
    async getSession() { const { data, error } = await client.auth.getSession(); if (error) throw error; return sessionView(data.session); },
    subscribe(listener) { const { data } = client.auth.onAuthStateChange((event, session) => { listener(event === 'SIGNED_OUT' ? 'SIGNED_OUT' : event === 'PASSWORD_RECOVERY' ? 'PASSWORD_RECOVERY' : 'SESSION', sessionView(session)); }); return () => data.subscription.unsubscribe(); },
    async signIn(email, password) { const { data, error } = await client.auth.signInWithPassword({ email, password }); if (error || !data.session) throw error ?? new Error('NO_SESSION'); return sessionView(data.session)!; },
    async signOut() { const { error } = await client.auth.signOut({ scope: 'local' }); if (error) throw error; },
    async resetPassword(email, redirectUrl) { const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl }); if (error) throw error; },
    async updatePassword(password) { const { error } = await client.auth.updateUser({ password }); if (error) throw error; },
    dispose() { client.auth.stopAutoRefresh(); },
  };
  const auth = new AuthController(provider);
  // Subscribe synchronously: PKCE initialization can finish before React effects
  // run. Otherwise PASSWORD_RECOVERY is lost and INITIAL_SESSION looks signed in.
  void auth.start();
  return auth;
}
