export type AppEnvironment = 'local' | 'test' | 'preview' | 'production';
export interface AuthUser { id: string; email: string | null }
export interface AuthSnapshot {
  status: 'loading' | 'signed_out' | 'signed_in' | 'recovery';
  user: AuthUser | null; expires_at: number | null; reason: 'expired' | 'request_failed' | null;
}
export interface PublicAuthConfig { url: string; publishable_key: string; environment: AppEnvironment }
export type AuthResult<T> = { ok: true; value: T } | { ok: false; code: string; status: number };
export interface ProviderSession { user: AuthUser; access_token: string; expires_at: number }
export type ProviderEvent = 'SESSION' | 'SIGNED_OUT' | 'PASSWORD_RECOVERY';
export interface AuthProvider {
  getSession(): Promise<ProviderSession | null>;
  subscribe(listener: (event: ProviderEvent, session: ProviderSession | null) => void): () => void;
  signIn(email: string, password: string): Promise<ProviderSession>;
  signOut(): Promise<void>;
  resetPassword(email: string, redirectUrl: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  dispose?(): void;
}
export interface AuthenticatedIdentity { account_id: string; email: string | null }
