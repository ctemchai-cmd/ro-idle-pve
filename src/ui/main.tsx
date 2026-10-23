import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import './auth.css';
import './elements.css';
import './skill-information.css';
import './game/skill-catalog.css';
import { readPublicAuthConfig } from '../client/auth-config.ts';
import { startPwa } from '../client/pwa.ts';

startPwa(import.meta.env.PROD);

const BattleApp = lazy(() => import('./battle-app.tsx'));
const AuthPage = lazy(() => import('./auth-page.tsx'));
const GamePage = lazy(() => import('./game/shell.tsx'));
const RosterPage = lazy(() => import('./roster-page.tsx'));
const SkillPreviewPage = lazy(() => import('./skill-preview.tsx'));
const container = document.getElementById('root');
if (!container) throw new Error('Missing application root');
const route = window.location.pathname.replace(/\/$/, '');
const configured = readPublicAuthConfig(import.meta.env, window.location).kind === 'configured';
// Signed-in play lives in one game shell; the roster sandbox stays for unconfigured local builds.
if (route === '' || route === '/index.html') {
  // Keep recovery callbacks on /auth so their PKCE event is consumed there.
  const callback = new URLSearchParams(window.location.search).has('code') || new URLSearchParams(window.location.hash.slice(1)).has('access_token');
  window.location.replace(`${callback ? '/auth' : '/play'}${window.location.search}${window.location.hash}`);
} else if (route === '/roster' && configured) window.location.replace('/play?v=buddy');
else createRoot(container).render(<Suspense fallback={<p role="status" className="route-loading">กำลังเปิดการผจญภัย…</p>}>{route === '/auth' ? <AuthPage /> : route === '/skill-preview' ? <SkillPreviewPage /> : route === '/roster' ? <RosterPage /> : route === '/demo' ? <BattleApp /> : <GamePage />}</Suspense>);
