import type { SaveSelection } from '../../client/save-slots.ts';
import { SaveSlotChooser } from './save-slots.tsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AccountState, Command } from '../../contracts/index.ts';
import type { AuthController } from '../../client/auth-controller.ts';
import { readPublicAuthConfig } from '../../client/auth-config.ts';
import { createBrowserAuth } from '../../client/supabase-auth.ts';
import { storyVersions, STORY_PACK_HASH } from '../../client/story.ts';
import { useAccountSave } from '../account-session.ts';
import { AssetPack } from '../../renderer/pack.ts';
import { readAudioLevels } from '../../renderer/audio-preferences.ts';
import { reasonText, type Submit } from './kit.tsx';
import { TopHud } from './hud.tsx';
import { MaintenancePanel } from './backup.tsx';
import { BottomBar, type Tab } from './nav.tsx';
import { Field } from './field.tsx';
import { BuddyPage } from './buddy.tsx';
import { SkillsPage } from './skills.tsx';
import { StatsPage } from './stats.tsx';
import { BackpackPage } from './backpack.tsx';
import { TeamPage } from './team.tsx';
import { Onboarding } from './onboarding.tsx';
import { DungeonPage } from './dungeon.tsx';
import { TowerPage } from './tower.tsx';
import { DailyPage } from './daily.tsx';
import { StorePage } from './store.tsx';
import './game.css';
import { SaveRecoveryProvider } from './save-notice.tsx';
import { randomId } from '../../client/secure-context.ts';
import { characterSkillIconIds } from '../../client/skills.ts';
import { inventoryView } from '../../client/equipment.ts';

export type View = 'home' | 'backpack' | 'team' | 'buddy' | 'skills' | 'stats' | 'dungeon' | 'tower' | 'daily' | 'store';
export type { ChallengeTarget } from '../../client/auto-battle.ts';
import type { ChallengeTarget } from '../../client/auto-battle.ts';
export interface GameContext {
  state: AccountState; pack: AssetPack | null; locked: boolean; busy: boolean; submit: Submit; latest: () => AccountState | undefined;
  /** Waits for the current writer, then submits one intent. */
  submitWhenReady: Submit;
  /** Result code of the most recent receipt (e.g. a Refine outcome). */
  lastCode: () => string | null;
  /** Instance ids created by the most recent receipt (gacha reveals). */
  lastCreated: () => string[];
  toast: (text: string) => void; go: (view: View, characterId?: string) => void; characterId: string; selectCharacter: (id: string) => void;
  /** Starts a boss challenge from any page: returns home, plays the intro and opens the fight. */
  challenge: (target: ChallengeTarget, automatic?: boolean) => void;
}
const views: readonly View[] = ['home', 'backpack', 'team', 'buddy', 'skills', 'stats', 'dungeon', 'tower', 'daily', 'store'];
/** Portrait-only product (D-052): a phone held sideways sees a rotate prompt, never a landscape layout. */
export const ROTATE_QUERY = '(orientation: landscape) and (max-height: 520px) and (pointer: coarse)';
function useRotated() {
  const [rotated, setRotated] = useState(() => window.matchMedia(ROTATE_QUERY).matches);
  useEffect(() => { const query = window.matchMedia(ROTATE_QUERY), change = () => setRotated(query.matches); query.addEventListener('change', change); return () => query.removeEventListener('change', change); }, []);
  return rotated;
}
function RotateLock() {
  return <div className="rotate-lock" role="alert"><span className="rotate-phone" aria-hidden="true" /><b>หมุนเครื่องเป็นแนวตั้ง</b><small>RO Idle เล่นได้เฉพาะจอแนวตั้ง</small></div>;
}
function readRoute(): { view: View; character: string } {
  const params = new URLSearchParams(window.location.search), view = params.get('v') as View | null;
  return { view: view && views.includes(view) ? view : 'home', character: params.get('c') ?? 'main' };
}

function ConnectedGame({ auth, scope, selection, chooseSave }: { auth: AuthController; scope: string; selection:SaveSelection;chooseSave:()=>void }) {
  const { controller, save } = useAccountSave(auth, scope, selection);
  const [pack, setPack] = useState<AssetPack | null>(null), [route, setRoute] = useState(readRoute), [toasts, setToasts] = useState<{ id: number; text: string }[]>([]), [sound, setSound] = useState(false);
  const toastId = useRef(0), rotated = useRotated();
  const state = save.preview ?? save.checkpoint?.save.state as AccountState | undefined, ready = save.status === 'ready', busy = save.status === 'saving' || !!save.pending;
  const toast = useCallback((text: string) => { const id = ++toastId.current; setToasts(list => [...list.slice(-2), { id, text }]); setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 2800); }, []);
  useEffect(() => { let disposed = false; void AssetPack.open(STORY_PACK_HASH).then(p => { if (disposed) { p.dispose(); return; } try { p.setAudioLevels(readAudioLevels(localStorage)); } catch { /* Defaults remain. */ } setPack(p); }).catch(() => toast('ยังเตรียมภาพไม่ได้ กรุณาโหลดหน้าใหม่')); return () => { disposed = true; }; }, [toast]);
  useEffect(() => () => pack?.dispose(), [pack]);
  // Warm only the selected class and a bounded set of bag art, never the whole library.
  const selectedJob = state?.roster.find(a => a.character_id === route.character)?.job_id;
  useEffect(() => {
    const actor = state?.roster.find(a => a.character_id === route.character);
    if (!pack || !state || !actor) return;
    void pack.prepareIcons(characterSkillIconIds(actor));
    const icons = [...new Set(inventoryView(state, actor.character_id).map(row => row.iconId).filter((id):id is string => !!id))].slice(0,24);
    for (const id of icons) void pack.asset(id).catch(() => {});
  }, [pack, selectedJob]);
  useEffect(() => { const pop = () => setRoute(readRoute()); window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop); }, []);
  useEffect(() => { const hidden = () => { void pack?.setAudioHidden(document.hidden).catch(() => setSound(false)); }; document.addEventListener('visibilitychange', hidden); return () => document.removeEventListener('visibilitychange', hidden); }, [pack]);
  const go = useCallback((view: View, character?: string) => {
    const next = { view, character: character ?? readRoute().character }, params = new URLSearchParams();
    if (view !== 'home') params.set('v', view); if (next.character !== 'main') params.set('c', next.character);
    const url = window.location.pathname + (params.size ? `?${params}` : '');
    if (url !== window.location.pathname + window.location.search) window.history.pushState(null, '', url);
    setRoute(next);
  }, []);
  const submit: Submit = useCallback(async (type, params, requestId) => {
    const snapshot = controller.snapshot.checkpoint?.save, request = requestId ?? randomId();
    try {
      await controller.submit({ type, params, request_id: request, expected_revision: snapshot?.revision ?? 0, ...storyVersions } as Command);
      const receipt = controller.snapshot.lastReceipt;
      if (receipt?.request_id === request && receipt.outcome === 'rejected') { toast(reasonText[receipt.result.code] ?? 'ยังทำรายการนี้ไม่ได้'); return false; }
      if (controller.snapshot.status !== 'ready' || receipt?.request_id !== request) { toast('ยังบันทึกไม่สำเร็จ · เชื่อมต่อใหม่เพื่อตรวจรายการเดิม'); return false; }
      return true;
    } catch (error) { toast(reasonText[error instanceof Error ? error.message : ''] ?? 'ยังเชื่อมต่อเซฟไม่ได้ กรุณาลองอีกครั้ง'); return false; }
  }, [controller, toast]);
  const submitWhenReady: Submit = useCallback(async (type, params, requestId) => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const latest = controller.snapshot;
      if (latest.status === 'ready' && !latest.pending) return submit(type, params, requestId);
      if (!['saving', 'loading'].includes(latest.status)) break;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    toast(reasonText.WRITER_NOT_READY!); return false;
  }, [controller, submit, toast]);
  const active = state?.active_battle;
  const [request, setRequest] = useState<(ChallengeTarget & { at: number; automatic?: boolean }) | null>(null);
  async function toggleSound() {
    if (!pack) return;
    try { if (!pack.currentScene) throw new Error('SCENE_NOT_READY'); await pack.enableAudio(!sound, pack.currentScene); setSound(pack.soundEnabled); } catch { toast('เปิดเสียงไม่สำเร็จ ลองกดอีกครั้ง'); }
  }

  const maintenance = save.reason === 'SAVE_MIGRATION_REQUIRED' || save.reason === 'SAVE_INTEGRITY_FAILED';
  const returnToSlots=()=>{if(save.status==='saving'||save.status==='loading'||(active&&!maintenance))return;window.history.replaceState(null,'','/play');chooseSave();};
  const slotReturn=<button className="btn ghost save-slot-return" disabled={save.status==='saving'||save.status==='loading'} onClick={returnToSlots}>เซฟ {selection.slot} · เลือกเซฟอื่น</button>;

  // TASK-040: an older save (migration preview) or a quarantined save (signed-tip recovery) blocks play until resolved.
  if (!state) {
    if (maintenance) return <div className="game-root">{slotReturn}<div className="game-splash"><div className="splash-logo">RO <span>Idle</span></div><MaintenancePanel save={save} controller={controller} /></div></div>;
    if (save.reason === 'ACCOUNT_NOT_INITIALIZED') return <div className="game-root slot-onboarding">{slotReturn}<Onboarding pack={pack} busy={!!save.pending || save.status !== 'error'} create={(root, gender) => void controller.submit({ type: 'account.create', params: { root_job_id: root, gender }, request_id: randomId(), expected_revision: 0, ...storyVersions } as Command).catch(e => toast(reasonText[e instanceof Error ? e.message : ''] ?? 'สร้างตัวละครไม่สำเร็จ'))} /></div>;
    return <div className="game-root">{slotReturn}<div className="game-splash" role="status"><div className="splash-logo">RO <span>Idle</span></div><p>{save.status === 'incompatible' ? 'มีเกมรุ่นใหม่ กรุณาโหลดหน้าใหม่' : save.status === 'offline' ? 'ขาดการเชื่อมต่อ · รอเชื่อมต่อเพื่อโหลดเซฟ' : 'กำลังโหลดเซฟ…'}</p>{(save.status === 'offline' || save.status === 'error') && <button className="btn primary" onClick={() => void controller.reconnect()}>เชื่อมต่อใหม่</button>}</div></div>;
  }
  const characterId = state.roster.some(a => a.character_id === route.character) ? route.character : 'main';
  const context: GameContext = { state, pack, locked: !ready || busy || !!active, busy: !ready || busy, submit, submitWhenReady, lastCode: () => controller.snapshot.lastReceipt?.result.code ?? null, lastCreated: () => [...(controller.snapshot.lastReceipt?.result.created_instance_ids ?? [])], latest: () => controller.snapshot.checkpoint?.save.state as AccountState | undefined, toast, go, characterId, selectCharacter: id => go(route.view, id) , challenge: (target, automatic) => { setRequest({ ...target, automatic, at: Date.now() }); go('home'); } };
  const tab: Tab | null = route.view === 'home' ? null : route.view === 'skills' || route.view === 'stats' ? 'buddy' : route.view === 'tower' || route.view === 'daily' ? 'dungeon' : route.view;
  return <SaveRecoveryProvider value={{status:save.status,pending:!!save.pending,retry:()=>void controller.reconnect()}}><div className="game-root">
    <div className="game-frame">
      <Field context={context} covered={route.view !== 'home' || rotated} save={save} request={request} consumeRequest={() => setRequest(null)} />
      <TopHud slotNumber={selection.slot} switchSave={returnToSlots} context={context} save={save} controller={controller} sound={sound} toggleSound={() => void toggleSound()} reconnect={() => void controller.reconnect()} />
      {route.view !== 'home' && <main key={`${route.view}:${characterId}`} className="page-layer" aria-live="polite">
        {active && <p className="page-banner">กำลังสู้บอส · ดูข้อมูลได้ แต่ปรับตัวละครได้หลังจบไฟต์</p>}
        {route.view === 'buddy' && <BuddyPage context={context} />}
        {route.view === 'skills' && <SkillsPage key={characterId} context={context} />}
        {route.view === 'stats' && <StatsPage key={characterId} context={context} />}
        {route.view === 'backpack' && <BackpackPage context={context} />}
        {route.view === 'team' && <TeamPage context={context} />}
        {route.view === 'dungeon' && <DungeonPage context={context} />}
        {route.view === 'tower' && <TowerPage context={context} />}
        {route.view === 'daily' && <DailyPage context={context} />}
        {route.view === 'store' && <StorePage context={context} />}
      </main>}
      <BottomBar pack={pack} active={tab} open={t => go(tab === t ? 'home' : t, characterId)} locked={() => toast('ยังไม่เปิดในรุ่นนี้ · กำลังพัฒนา')} />
      {maintenance && <div className="maintenance-layer">{slotReturn}<MaintenancePanel save={save} controller={controller} /></div>}
      <div className="toasts" role="status">{toasts.map(t => <p key={t.id} className="toast">{t.text}</p>)}</div>
    </div>
  </div></SaveRecoveryProvider>;
}

function SelectedGame({auth,scope}:{auth:AuthController;scope:string}){
 const[selection,setSelection]=useState<SaveSelection|null>(null);
 return selection?<ConnectedGame key={selection.save_id} auth={auth} scope={scope} selection={selection} chooseSave={()=>setSelection(null)}/>:<SaveSlotChooser auth={auth} select={setSelection}/>;
}

function ConfiguredGame({ config }: { config: Extract<ReturnType<typeof readPublicAuthConfig>, { kind: 'configured' }>['config'] }) {
  const [auth] = useState(() => createBrowserAuth(config)), [session, setSession] = useState(auth.snapshot);
  useEffect(() => { const stop = auth.subscribe(setSession); void auth.start(); return () => { stop(); auth.dispose(); }; }, [auth]);
  const signInUrl = `/auth?next=${encodeURIComponent('/play' + window.location.search)}`;
  useEffect(() => { if (session.status === 'signed_out') window.location.replace(signInUrl); }, [session.status, signInUrl]);
  if (session.status === 'signed_in') return <SelectedGame key={session.user!.id} auth={auth} scope={`${config.environment}:${new URL(config.url).host}`} />;
  return <div className="game-root"><div className="game-splash"><div className="splash-logo">RO <span>Idle</span></div><p>{session.status === 'loading' ? 'กำลังตรวจบัญชี…' : 'เข้าสู่บัญชีเพื่อเล่นต่อจากเซฟ'}</p>{session.status !== 'loading' && <a className="btn primary" href={signInUrl}>เข้าสู่บัญชี</a>}</div></div>;
}
export default function GamePage() {
  return <><RotateLock /><GameRoute /></>;
}
function GameRoute() {
  const config = readPublicAuthConfig(import.meta.env, window.location);
  return config.kind === 'configured' ? <ConfiguredGame config={config.config} /> : <div className="game-root"><div className="game-splash"><div className="splash-logo">RO <span>Idle</span></div><p>เครื่องนี้ยังไม่ได้เชื่อมต่อบัญชีเกม</p><a className="btn" href="/roster">ทดลองทีมและสกิล</a><a className="btn" href="/demo">สนามทดลอง</a></div></div>;
}
