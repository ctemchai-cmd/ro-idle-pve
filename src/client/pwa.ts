/** Presentation adapter only: installation never starts a save write or reloads a running game. */
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export interface InstallState { available: boolean; installed: boolean; busy: boolean; ios: boolean; failed: boolean }
let prompt: InstallPrompt | null = null, started = false;
const listeners = new Set<() => void>();
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || !!(navigator as Navigator & { standalone?: boolean }).standalone;
let state: InstallState = { available: false, installed: false, busy: false, ios: false, failed: false };
const publish = (change: Partial<InstallState>) => { state = { ...state, ...change }; for (const listener of listeners) listener(); };
export const installState = () => state;
export const subscribeInstall = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

export function startPwa(production: boolean) {
  if (started) return; started = true;
  publish({ installed: standalone(), ios: /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); prompt = event as InstallPrompt; publish({ available: true, failed: false });
  });
  window.addEventListener('appinstalled', () => { prompt = null; publish({ installed: true, available: false, busy: false }); });
  const displayMode = window.matchMedia('(display-mode: standalone)'), onDisplayMode = () => { publish({ installed: standalone() }); };
  if (displayMode.addEventListener) displayMode.addEventListener('change', onDisplayMode);
  else displayMode.addListener(onDisplayMode);
  if (production && window.isSecureContext && 'serviceWorker' in navigator) {
    // Optional enhancement. Registration failure never blocks Auth or the game.
    void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
  }
}

/** Called directly by a click, before awaiting anything: preserves the native user gesture. */
export async function installApp(): Promise<void> {
  const pending = prompt; if (!pending || state.busy || state.installed) return;
  prompt = null; publish({ busy: true, available: false, failed: false });
  try { await pending.prompt(); const choice = await pending.userChoice; if (choice.outcome === 'accepted') publish({ installed: true }); }
  catch { publish({ failed: true }); }
  finally { publish({ busy: false }); }
}
