/** Dev-only browser QA entry. Never imported by the app or included in dist. */
import { createRoot } from 'react-dom/client';
import { AuthExperience } from '../../src/ui/auth-page.tsx';
import { AuthController } from '../../src/client/auth-controller.ts';
import type { AuthProvider, ProviderEvent, ProviderSession } from '../../src/contracts/auth.ts';
import '../../src/ui/style.css';
import '../../src/ui/auth.css';
let active: ProviderSession | null = null, listener: ((event: ProviderEvent, session: ProviderSession | null) => void) | null = null;
let saveStatus = 404;
const calls: string[] = [];
const session = (): ProviderSession => ({ user: { id: '11111111-1111-4111-8111-111111111111', email: 'owner@example.invalid' }, access_token: 'browser-fixture-token-never-real', expires_at: Math.floor(Date.now() / 1000) + 3600 });
const provider: AuthProvider = {
  async getSession() { return active; }, subscribe(value) { listener = value; return () => { listener = null; }; },
  async signIn(email, password) { if (email !== 'owner@example.invalid' || password !== 'fixture-password') throw new Error('FIXTURE_SIGNIN_REJECTED'); calls.push('signin'); active = session(); listener?.('SESSION', active); return active; },
  async signOut() { active = null; calls.push('signout'); listener?.('SIGNED_OUT', null); },
  async resetPassword(email, url) { if (email !== 'owner@example.invalid' || url !== new URL('/auth', window.location.origin).href) throw new Error('FIXTURE_RESET_INVALID'); calls.push('reset'); },
  async updatePassword(password) { if (password !== 'new-fixture-password') throw new Error('FIXTURE_PASSWORD_INVALID'); calls.push('updated'); },
};
const auth = new AuthController(provider);
Object.assign(window, { __authFixture: { calls, expire() { active = null; listener?.('SIGNED_OUT', null); }, recover() { active = session(); listener?.('PASSWORD_RECOVERY', active); }, setSaveStatus(value: number) { saveStatus = value; } } });
createRoot(document.getElementById('root')!).render(<AuthExperience auth={auth} readAccount={async () => {
  if (saveStatus === 401) auth.markUnauthorized();
  return { ok: false, code: saveStatus === 404 ? 'ACCOUNT_NOT_INITIALIZED' : 'SAVE_UNAVAILABLE', status: saveStatus };
}} />);
