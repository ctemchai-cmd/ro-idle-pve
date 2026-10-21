// Signed-out, read-only production proof. Never signs in or sends game commands.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = 'https://ro-idle-pve.vercel.app';
const checks = [], errors = [], mutations = [], digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const assert = (ok, reason) => { if (!ok) throw new Error(reason); };
async function read(file) { const response = await fetch(base + file, { cache: 'no-store', signal: AbortSignal.timeout(20000) }); assert(response.ok, `${file} HTTP ${response.status}`); return { response, bytes: Buffer.from(await response.arrayBuffer()) }; }
let browser, profile, failure;
(async () => {
  const artifacts = [];
  for (const file of ['/manifest.webmanifest', '/sw.js', '/offline.html', '/pwa/icon.svg', '/pwa/icon-192.png', '/pwa/icon-512.png', '/pwa/icon-maskable-512.png', '/pwa/apple-touch-icon.png']) {
    const { response, bytes } = await read(file), local = fs.readFileSync(path.join(root, 'pwa', file.slice(1)));
    if (file === '/sw.js') {
      assert(/ro-idle-pwa-/.test(bytes.toString()) && !bytes.toString().includes('__RO_PWA_VERSION__'), 'Worker version not built');
      assert(bytes.toString().replace(/(CACHE_PREFIX \+ ')[0-9a-f]{16}(';)/, '$1__RO_PWA_VERSION__$2') === local.toString(), 'Wrong deployed worker template');
      assert(response.headers.get('cache-control').includes('no-store') && response.headers.get('service-worker-allowed') === '/', 'Worker headers');
      assert(response.headers.get('content-type').includes('javascript'), 'Worker MIME');
    } else assert(digest(bytes) === digest(local), `Wrong deployed artifact ${file}`);
    if (file === '/manifest.webmanifest') assert(response.headers.get('content-type').includes('manifest+json') && response.headers.get('cache-control').includes('no-cache'), 'Manifest headers');
    artifacts.push({ path: file, status: response.status, bytes: bytes.length, sha256: digest(bytes), cache_control: response.headers.get('cache-control'), content_type: response.headers.get('content-type') });
  }
  const health = JSON.parse((await read('/api/health')).bytes.toString());
  assert(health.ok === true && health.content_hash === '768e12a49bf339711d44f501c3710374adbcd10d9eb74d6a2e6f9b8aa79330af', 'Health/content hash changed');
  checks.push({ case_id: 'hosted_public_artifacts_headers_and_health', passed: true, artifacts, health: { ok: health.ok, content_hash: health.content_hash } });
  profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ro-pwa-hosted-'));
  const context = await chromium.launchPersistentContext(profile, { headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', viewport: { width: 390, height: 844 } });
  browser = context.browser();
  context.on('request', req => { if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method())) mutations.push({ method: req.method(), path: new URL(req.url()).pathname }); });
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'เข้าสู่บัญชี', exact: true }).waitFor();
  assert(new URL(page.url()).pathname === '/auth', 'Home did not route to login');
  assert(await page.locator('.pwa-install').count() === 1 && await page.locator('input[type=email]').count() === 1, 'Login/install UI missing');
  const cdp = await context.newCDPSession(page); await cdp.send('Page.enable');
  const manifest = await cdp.send('Page.getAppManifest'), installability = await cdp.send('Page.getInstallabilityErrors');
  assert(!manifest.errors.length && !installability.installabilityErrors.length, 'Hosted installability errors');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const cache = await page.evaluate(async () => Object.fromEntries(await Promise.all((await caches.keys()).map(async name => [name, (await (await caches.open(name)).keys()).map(req => new URL(req.url()).pathname)]))));
  const entries = Object.values(cache).flat();
  assert(Object.keys(cache).length === 1 && entries.length === 5 && entries.every(file => file === '/offline.html' || file.startsWith('/pwa/')), 'Game/private data cached');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth); assert(!overflow, 'Hosted mobile overflow');
  await page.screenshot({ path: path.join(root, 'docs/screenshots/task-062-pwa-hosted-login.png'), fullPage: true });
  checks.push({ case_id: 'hosted_login_installability_and_worker', passed: true, route: '/auth', login_form: true, install_ui: true, installability_errors: installability.installabilityErrors, cache, mobile_overflow: overflow });
  await context.setOffline(true); await page.goto(base + '/play'); await page.getByRole('heading', { name: 'รอเชื่อมต่ออินเทอร์เน็ต' }).waitFor();
  assert(await page.locator('img').evaluate(im => im.complete && im.naturalWidth === 192), 'Hosted offline icon');
  await context.setOffline(false); await page.getByRole('link', { name: 'ลองเชื่อมต่ออีกครั้ง' }).click(); await page.getByRole('heading', { name: 'เข้าสู่บัญชี', exact: true }).waitFor();
  assert(!errors.length && !mutations.length, JSON.stringify({ errors, mutations }));
  checks.push({ case_id: 'hosted_offline_reconnect_read_only', passed: true, offline_fallback: true, reconnect_login: true, owner_login: false, mutating_requests: mutations });
})().catch(error => { failure = error.stack; console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close(); if (profile) fs.rmSync(profile, { recursive: true, force: true });
  const report = { task_id: 'TASK-062', date: '2026-10-21', origin: base, source_commit: process.env.RO_DEPLOY_COMMIT || null, passed: checks.length === 3 && !failure && !errors.length && !mutations.length, checks, errors, failure, owner_cloud_writes: false, personal_preview_restarted: false, scope: 'Signed-out public production artifacts/login/SW/offline. No real account, OS install or owner save access.' };
  fs.writeFileSync(path.join(root, 'plan/evidence/task-062-hosted.json'), JSON.stringify(report, null, 2) + '\n');
});
