import type { AuthProvider, AuthResult, AuthSnapshot, ProviderSession } from '../contracts/auth.ts';

/** UI session metadata only; API authorization always verifies the JWT again. */
export class AuthController {
  snapshot: AuthSnapshot = { status: 'loading', user: null, expires_at: null, reason: null };
  private readonly listeners = new Set<(state: AuthSnapshot) => void>();
  private unsubscribe: (() => void) | null = null;
  private expiryTimer: ReturnType<typeof setInterval> | null = null;
  private epoch = 0;
  private disposed = false;
  private started = false;
  private explicitLogout = false;
  private providerRevision = 0;
  private currentSession: ProviderSession | null = null;
  constructor(private readonly provider: AuthProvider, private readonly nowSeconds = () => Math.floor(Date.now() / 1000)) {}
  private publish(state: AuthSnapshot) { if (this.disposed) return; this.snapshot = Object.freeze(state); for (const listener of this.listeners) listener(this.snapshot); }
  private session(session: ProviderSession | null, recovery = false) {
    if (!session) { this.currentSession = null; this.publish({ status: 'signed_out', user: null, expires_at: null, reason: this.explicitLogout ? null : this.snapshot.user ? 'expired' : this.snapshot.reason }); return; }
    if (!Number.isFinite(session.expires_at) || session.expires_at <= this.nowSeconds()) { this.expired(); return; }
    this.currentSession = { ...session, user: { ...session.user } };
    this.publish({ status: recovery ? 'recovery' : 'signed_in', user: { ...session.user }, expires_at: session.expires_at, reason: null });
  }
  private expired() { this.currentSession = null; this.publish({ status: 'signed_out', user: null, expires_at: null, reason: 'expired' }); }
  private cachedToken(userId: string | undefined, buffer = 0): string | null {
    const session = this.currentSession;
    return !this.explicitLogout && session && session.user.id === userId && session.expires_at > this.nowSeconds() + buffer ? session.access_token : null;
  }
  subscribe(listener: (state: AuthSnapshot) => void): () => void { this.listeners.add(listener); listener(this.snapshot); return () => { this.listeners.delete(listener); }; }
  async start(): Promise<void> {
    if (this.started || this.disposed) return; this.started = true;
    const epoch = this.epoch, revision = this.providerRevision;
    this.unsubscribe = this.provider.subscribe((event, session) => { this.providerRevision++; this.session(session, event === 'PASSWORD_RECOVERY' || this.snapshot.status === 'recovery'); });
    try { const session = await this.provider.getSession(); if (epoch === this.epoch && revision === this.providerRevision) this.session(session); }
    catch { if (epoch === this.epoch && revision === this.providerRevision) this.publish({ status: 'signed_out', user: null, expires_at: null, reason: 'request_failed' }); }
    if (!this.disposed) this.expiryTimer = setInterval(() => { if (this.snapshot.expires_at !== null && this.snapshot.expires_at <= this.nowSeconds()) this.expired(); }, 1000);
  }
  async signIn(email: string, password: string): Promise<AuthResult<null>> {
    const epoch = ++this.epoch; this.explicitLogout = false;
    try { const session = await this.provider.signIn(email.trim(), password); if (epoch === this.epoch) this.session(session); return { ok: true, value: null }; }
    catch { return { ok: false, code: 'SIGN_IN_FAILED', status: 401 }; }
  }
  async signOut(): Promise<AuthResult<null>> {
    const epoch = ++this.epoch; this.explicitLogout = true;
    try { await this.provider.signOut(); if (epoch === this.epoch) this.session(null); return { ok: true, value: null }; }
    catch { this.explicitLogout = false; return { ok: false, code: 'SIGN_OUT_FAILED', status: 503 }; }
  }
  async resetPassword(email: string, redirectUrl: string): Promise<AuthResult<null>> {
    try { await this.provider.resetPassword(email.trim(), redirectUrl); return { ok: true, value: null }; }
    catch { return { ok: false, code: 'PASSWORD_RESET_FAILED', status: 503 }; }
  }
  async updatePassword(password: string): Promise<AuthResult<null>> {
    if (this.snapshot.status !== 'recovery' || !await this.getAccessToken()) return { ok: false, code: 'RECOVERY_SESSION_REQUIRED', status: 401 };
    try { await this.provider.updatePassword(password); this.publish({ ...this.snapshot, status: 'signed_in' }); return { ok: true, value: null }; }
    catch { return { ok: false, code: 'PASSWORD_UPDATE_FAILED', status: 400 }; }
  }
  async getAccessToken(): Promise<string | null> {
    if (this.snapshot.status === 'signed_out' || this.disposed || this.explicitLogout) return null;
    const epoch = this.epoch, userId = this.snapshot.user?.id, revision = this.providerRevision;
    const cached = this.cachedToken(userId, 30); if (cached) return cached;
    try {
      const session = await this.provider.getSession();
      if (this.disposed || epoch !== this.epoch) return null;
      // A same-user refresh is newer than this SDK read; use its token, not a false sign-out.
      if (revision !== this.providerRevision) return this.cachedToken(userId);
      if (!session || session.expires_at <= this.nowSeconds()) { this.expired(); return null; }
      if (session.user.id !== userId) { this.expired(); return null; }
      this.currentSession = { ...session, user: { ...session.user } }; return session.access_token;
    } catch { if (this.disposed || epoch !== this.epoch) return null; if (revision !== this.providerRevision) return this.cachedToken(userId); this.expired(); return null; }
  }
  markUnauthorized(): void { this.expired(); }
  dispose(): void { this.disposed = true; this.currentSession = null; this.epoch++; this.unsubscribe?.(); this.provider.dispose?.(); if (this.expiryTimer) clearInterval(this.expiryTimer); this.listeners.clear(); }
}
