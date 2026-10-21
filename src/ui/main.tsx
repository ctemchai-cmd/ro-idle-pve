import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import './auth.css';
import { readPublicAuthConfig } from '../client/auth-config.ts';

const BattleApp = lazy(() => import('./battle-app.tsx'));
const AuthPage = lazy(() => import('./auth-page.tsx'));
const GamePage = lazy(() => import('./game/shell.tsx'));
const RosterPage = lazy(() => import('./roster-page.tsx'));
const container = document.getElementById('root');
if (!container) throw new Error('Missing application root');
const route = window.location.pathname.replace(/\/$/, '');
// Signed-in play lives in one game shell; the roster sandbox stays for unconfigured local builds.
if (route === '/roster' && readPublicAuthConfig(import.meta.env, window.location).kind === 'configured') window.location.replace('/play?v=buddy');
createRoot(container).render(<Suspense fallback={<p role="status" className="route-loading">กำลังเปิดการผจญภัย…</p>}>{route === '/auth' ? <AuthPage /> : route === '/roster' ? <RosterPage /> : route === '/play' ? <GamePage /> : <BattleApp />}</Suspense>);
