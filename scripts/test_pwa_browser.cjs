// Production PWA protocol/UX proof. Own ephemeral HTTP server; never touches 6173 or a player account.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto'), os = require('node:os');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), dist = path.join(root, 'dist');
const checks = [], errors = [], assert = (ok, message) => { if (!ok) throw new Error(message); };
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
let worker = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8'), apiCalls = 0;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Cache-Control', 'no-store');
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/v1/')) {
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ fixture: true, call: ++apiCalls, method: req.method })); return;
  }
  if (url.searchParams.has('server-error')) { res.writeHead(503, { 'Content-Type': 'text/plain' }); res.end('Synthetic upstream maintenance'); return; }
  if (url.pathname === '/sw.js') { res.setHeader('Service-Worker-Allowed', '/'); res.setHeader('Content-Type', 'application/javascript'); res.end(worker); return; }
  const file = ['/', '/play', '/auth', '/demo', '/roster'].includes(url.pathname) ? 'index.html' : decodeURIComponent(url.pathname).slice(1);
  const target = path.resolve(dist, file);
  if (!target.startsWith(dist + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream'); fs.createReadStream(target).pipe(res);
});
async function check(id, run) { const result = await run(); checks.push({ case_id: id, passed: true, result }); console.log(JSON.stringify({ check: id, passed: true })); }
async function cacheInventory(page) {
  return page.evaluate(async () => Object.fromEntries(await Promise.all((await caches.keys()).map(async name => [name, (await (await caches.open(name)).keys()).map(r => new URL(r.url).pathname + new URL(r.url).search)]))));
}
let browser, failure, profile;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ro-pwa-chrome-'));
  // A fresh normal profile is required: Chrome deliberately forbids installing in incognito contexts.
  const context = await chromium.launchPersistentContext(profile, { headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', viewport: { width: 390, height: 844 } });
  browser = context.browser();
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/auth'); await page.locator('.pwa-install').waitFor();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; localStorage.setItem('__pwa_save_fixture', 'preserve-unrelated-state'); });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);

  await check('manifest_installability_icons_and_scope', async () => {
    const cdp = await context.newCDPSession(page); await cdp.send('Page.enable');
    const parsed = await cdp.send('Page.getAppManifest'), install = await cdp.send('Page.getInstallabilityErrors');
    assert(!parsed.errors?.length, JSON.stringify(parsed.errors)); assert(!install.installabilityErrors.length, JSON.stringify(install));
    const manifest = JSON.parse(parsed.data);
    assert(manifest.start_url === '/play' && manifest.display === 'standalone' && manifest.orientation === 'portrait', 'Wrong installed launch');
    const icons = await page.evaluate(async () => {
      const sources = ['/pwa/icon-192.png', '/pwa/icon-512.png', '/pwa/icon-maskable-512.png', '/pwa/apple-touch-icon.png'];
      return Promise.all(sources.map(async src => { const im = new Image(); im.src = src; await im.decode(); return { src, width: im.naturalWidth, height: im.naturalHeight }; }));
    });
    assert(icons.map(i => i.width).join(',') === '192,512,512,180' && icons.every(i => i.width === i.height), 'Icon decode/size');
    const registration = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: new URL(r.scope).pathname, active: r.active.state, updateViaCache: r.updateViaCache }; });
    assert(registration.scope === '/' && registration.active === 'activated' && registration.updateViaCache === 'none', 'Worker registration');
    return { manifest: { id: manifest.id, start_url: manifest.start_url, display: manifest.display, orientation: manifest.orientation }, installability_errors: install.installabilityErrors, icons, registration };
  });
  await check('private_requests_network_only_and_no_game_precache', async () => {
    const calls = await page.evaluate(async () => {
      const one = async (url, init) => (await fetch(url, init)).json();
      return [await one('/api/pwa-fixture'), await one('/api/pwa-fixture'), await one('/api/pwa-fixture', { method: 'POST', body: '{}' }), await one('/auth/v1/pwa-fixture', { headers: { Authorization: 'Bearer synthetic-fixture' } })];
    });
    assert(calls.every((row, index) => row.call === index + 1) && calls[2].method === 'POST', 'API request served from cache');
    await page.goto(base + '/auth?code=synthetic-pwa-callback'); await page.locator('.pwa-install').waitFor();
    await page.evaluate(async () => { await fetch('/content-version.json'); await fetch('/ro/manifest.json'); });
    const inventory = await cacheInventory(page), names = Object.keys(inventory), expected = ['/offline.html', '/pwa/apple-touch-icon.png', '/pwa/icon-192.png', '/pwa/icon-512.png', '/pwa/icon-maskable-512.png'].sort();
    assert(names.length === 1 && names[0].startsWith('ro-idle-pwa-'), 'Unexpected cache namespace');
    assert(JSON.stringify(inventory[names[0]].sort()) === JSON.stringify(expected), 'Private/game/callback data cached');
    return { calls, caches: inventory, game_content_cached: false, api_auth_callback_cached: false };
  });
  await check('offline_fallback_reconnect_and_http_error_passthrough', async () => {
    await context.setOffline(true); await page.goto(base + '/play'); await page.getByRole('heading', { name: 'รอเชื่อมต่ออินเทอร์เน็ต' }).waitFor();
    assert(await page.locator('img').evaluate(im => im.complete && im.naturalWidth === 192), 'Offline icon unavailable');
    const preserved = await page.evaluate(() => localStorage.getItem('__pwa_save_fixture') === 'preserve-unrelated-state'); assert(preserved, 'Offline changed local state');
    await page.screenshot({ path: path.join(root, 'docs/screenshots/task-062-pwa-offline.png') });
    await context.setOffline(false); await page.getByRole('link', { name: 'ลองเชื่อมต่ออีกครั้ง' }).click();
    await page.waitForFunction(() => !!document.querySelector('#root') && !document.querySelector('main>h1'));
    const maintenance = await page.goto(base + '/play?server-error=1');
    assert(maintenance.status() === 503 && (await page.locator('body').innerText()).includes('Synthetic upstream maintenance'), 'SW concealed a real HTTP error');
    await page.goto(base + '/auth'); await page.locator('.pwa-install').waitFor();
    return { offline_page: true, offline_icon: true, reconnect_navigation: true, local_state_preserved: preserved, http_503_passthrough: true };
  });
  await check('native_prompt_click_once_dismiss_accept_and_failure', async () => {
    const offer = async outcome => page.evaluate(outcome => {
      window.__installCalls = []; const e = new Event('beforeinstallprompt', { cancelable: true });
      e.prompt = () => { window.__installCalls.push({ active_gesture: navigator.userActivation.isActive }); return outcome === 'failed' ? Promise.reject(new Error('Synthetic cancellation')) : Promise.resolve(); };
      e.userChoice = Promise.resolve({ outcome }); window.dispatchEvent(e);
    }, outcome);
    await offer('dismissed'); await page.locator('button.pwa-install-button').click(); await page.locator('summary.pwa-install-button').waitFor();
    let calls = await page.evaluate(() => window.__installCalls); assert(calls.length === 1 && calls[0].active_gesture, 'Prompt not once during user click');
    await page.locator('summary.pwa-install-button').click(); assert((await page.locator('.pwa-install').innerText()).includes('เปิดเมนูเบราว์เซอร์'), 'Dismiss lacks fallback');
    await offer('failed'); await page.locator('button.pwa-install-button').click(); await page.getByRole('status').filter({ hasText: 'ยังติดตั้งไม่สำเร็จ' }).waitFor();
    await offer('accepted'); await page.locator('button.pwa-install-button').click(); await page.waitForFunction(() => !document.querySelector('.pwa-install'));
    calls = await page.evaluate(() => window.__installCalls); assert(calls.length === 1 && calls[0].active_gesture, 'Accepted prompt not user initiated');
    return { dismissed_once: true, failed_guide: true, accepted_hides_install: true, active_user_gesture: true, scope: 'Synthetic browser lifecycle event exercises actual production UI; CDP installability checked separately. Does not claim an OS app was installed.' };
  });
  await check('waiting_update_no_reload_cache_cleanup_keeps_unrelated_state', async () => {
    await page.evaluate(async () => { const c = await caches.open('other-app-fixture'); await c.put('/unrelated-fixture', new Response('unrelated')); });
    const original = (await cacheInventory(page)), oldName = Object.keys(original).find(n => n.startsWith('ro-idle-pwa-'));
    const beforeUrl = page.url(); let navigations = 0; page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
    worker = worker.replace(oldName.slice('ro-idle-pwa-'.length), 'fixture-next-version');
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
    await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration()).waiting?.state === 'installed');
    assert(navigations === 0 && page.url() === beforeUrl, 'Update reloaded a running page');
    const waitingCaches = await cacheInventory(page); assert(waitingCaches[oldName] && waitingCaches['ro-idle-pwa-fixture-next-version'], 'Old active cache removed before clients close');
    await page.close(); const next = await context.newPage(); next.on('pageerror', e => errors.push(e.message));
    await next.goto(base + '/auth'); await next.locator('.pwa-install').waitFor();
    await next.waitForFunction(async name => !(await caches.keys()).includes(name), oldName);
    const after = await cacheInventory(next); assert(after['other-app-fixture']?.includes('/unrelated-fixture') && after['ro-idle-pwa-fixture-next-version'], 'Activation cleanup removed another app cache');
    assert(await next.evaluate(() => localStorage.getItem('__pwa_save_fixture') === 'preserve-unrelated-state'), 'SW activation changed local state');
    await next.close(); return { no_reload: true, old_cache_retained_while_running: true, caches_after_activation: after, unrelated_storage_preserved: true };
  });
  await check('ios_install_guide_standalone_and_portrait_mobile_layouts', async () => {
    const ios = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
    await ios.addInitScript(() => { window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); e.stopImmediatePropagation(); }, true); });
    const phone = await ios.newPage(); phone.on('pageerror', e => errors.push(e.message));
    await phone.goto(base + '/auth'); await phone.locator('summary.pwa-install-button').click();
    const guide = await phone.locator('.pwa-install').innerText(); assert(guide.includes('Safari') && guide.includes('แชร์') && guide.includes('เพิ่มไปยังหน้าจอโฮม'), 'Missing iOS instructions');
    const layouts = [];
    for (const [width, height] of [[320, 568], [390, 844]]) {
      await phone.setViewportSize({ width, height }); const overflow = await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth); assert(!overflow, 'Mobile horizontal overflow');
      const emblem = await phone.locator('.auth-emblem>.ui-icon').boundingBox(); assert(emblem.width === 44 && emblem.height === 44, 'Auth emblem consumes mobile viewport'); layouts.push({ width, height, overflow, emblem_px: emblem.width });
    }
    await phone.screenshot({ path: path.join(root, 'docs/screenshots/task-062-pwa-install-mobile.png'), fullPage: true }); await ios.close();
    const standalone = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await standalone.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { value: true }); });
    const app = await standalone.newPage(); await app.goto(base + '/auth'); await app.locator('.auth-card').waitFor();
    assert(await app.locator('.pwa-install').count() === 0, 'Install shown inside standalone app');
    const viewport = await app.locator('meta[name="viewport"]').getAttribute('content'); assert(viewport.includes('viewport-fit=cover'), 'Safe-area viewport missing');
    await standalone.close(); return { ios_guide: true, standalone_hides_install: true, viewport_fit_cover: true, layouts, scope: 'Chrome mobile UA/layout emulation; not physical Safari/notch or actual iOS installation.' };
  });
  assert(!errors.length, JSON.stringify(errors));
})().catch(error => { failure = error.stack; console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close(); if (profile) fs.rmSync(profile, { recursive: true, force: true }); await new Promise(resolve => server.close(resolve));
  const inputs = ['pwa/sw.js', 'pwa/manifest.webmanifest', 'pwa/offline.html', 'src/client/pwa.ts', 'src/ui/pwa-install.tsx', 'src/ui/pwa.css', 'scripts/game/pwa-artifacts.ts', 'scripts/test_pwa_browser.cjs', 'dist/index.html', 'dist/sw.js', 'dist/manifest.webmanifest'];
  const report = { task_id: 'TASK-062', date: '2026-10-21', passed: checks.length === 6 && !failure && !errors.length, checks, errors, failure, owner_cloud_writes: false, personal_preview_restarted: false, inputs_sha256: Object.fromEntries(inputs.map(file => [file, hash(fs.readFileSync(path.join(root, file)))])), content_hash: JSON.parse(fs.readFileSync(path.join(dist, 'content-version.json'))).content_hash };
  const output = path.join(root, process.env.RO_PWA_EVIDENCE || 'plan/evidence/task-062-pwa-browser.json'); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
});
