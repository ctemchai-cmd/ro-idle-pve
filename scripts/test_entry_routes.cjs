// Run against a production build with synthetic public Auth configuration.
// Auth and every game API request are intercepted: this never writes a real save.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const base = (process.env.RO_ENTRY_URL || 'http://127.0.0.1:5187').replace(/\/$/, '');
const reportPath = path.join(root, 'plan/evidence/entry-routes-browser.json');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const checks = [], errors = [], mutations = [], external = [];
  const user = { id: '11111111-2222-4333-8444-555555555555', aud: 'authenticated', role: 'authenticated', email: 'entry@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const jwt = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, role: 'authenticated', exp: expires })).toString('base64url'), 'fixture'].join('.');
  const session = { access_token: jwt, refresh_token: 'entry-fixture-refresh', token_type: 'bearer', expires_in: 3600, expires_at: expires, user };
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname.startsWith('/auth/v1/')) {
      const endpoint = url.pathname.slice('/auth/v1/'.length);
      if (endpoint === 'token') {
        const input = request.postDataJSON();
        return route.fulfill(input?.password === 'entry-fixture-password'
          ? { json: session }
          : { status: 400, json: { error: 'invalid_grant', error_description: 'Invalid login credentials' } });
      }
      if (endpoint === 'logout') return route.fulfill({ status: 204, body: '' });
      if (endpoint === 'user') return route.fulfill({ json: user });
      throw new Error('Unexpected Auth request: ' + endpoint);
    }
    if (url.origin === new URL(base).origin && url.pathname.startsWith('/api/')) {
      if (request.method() !== 'GET') mutations.push(url.pathname);
      return route.fulfill({ status: 404, json: { code: 'ACCOUNT_NOT_INITIALIZED' } });
    }
    if (url.origin === new URL(base).origin || url.protocol === 'data:') return route.continue();
    external.push(url.origin + url.pathname);
    return route.abort();
  });
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  async function loginReady() {
    await page.waitForURL(url => url.pathname === '/auth');
    await page.getByRole('heading', { name: 'เข้าสู่บัญชี', exact: true }).waitFor();
  }
  try {
    await page.goto(base + '/'); await loginReady();
    assert(new URL(page.url()).searchParams.get('next') === '/play', 'Root lost the game destination');
    assert(await page.locator('.adventure-app').count() === 0, 'Root showed the combat demo');
    assert(await page.getByRole('link', { name: /เดโม/ }).count() === 0, 'Login still promotes the demo');
    checks.push('Signed-out root opens login for /play without rendering the demo');

    await page.goto(base + '/?v=skills&c=npc_mage'); await loginReady();
    assert(new URL(page.url()).searchParams.get('next') === '/play?v=skills&c=npc_mage', 'Lost game query on login');
    await page.getByLabel('อีเมล', { exact: true }).fill(user.email);
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert(new URL(page.url()).pathname === '/auth', 'Failed login entered the game');
    checks.push('Failed login stays on the form and preserves the requested game page');

    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('entry-fixture-password');
    await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/play' && url.search === '?v=skills&c=npc_mage');
    await page.getByRole('heading', { name: 'สร้างนักผจญภัยของคุณ' }).waitFor();
    await page.reload(); await page.getByRole('heading', { name: 'สร้างนักผจญภัยของคุณ' }).waitFor();
    checks.push('Successful login returns to the requested /play page; reload restores the session');

    await page.goto(base + '/'); await page.waitForURL(url => url.pathname === '/play');
    await page.getByRole('heading', { name: 'สร้างนักผจญภัยของคุณ' }).waitFor();
    checks.push('Signed-in root enters /play directly; an absent save does not auto-create a character');

    for (const next of [null, 'https://example.invalid/play', '//example.invalid/play', '/play\\@example.invalid']) {
      await page.goto(base + '/auth' + (next ? '?next=' + encodeURIComponent(next) : ''));
      await page.getByRole('heading', { name: 'ยินดีต้อนรับกลับ' }).waitFor();
      await page.waitForTimeout(200);
      assert(new URL(page.url()).pathname === '/auth', 'Account page followed an unsafe return URL');
    }
    checks.push('Account management stays accessible; external and malformed return URLs are rejected');

    await page.getByRole('button', { name: 'ออกจากบัญชี', exact: true }).click();
    await page.getByRole('heading', { name: 'เข้าสู่บัญชี', exact: true }).waitFor();
    await page.goto(base + '/play'); await loginReady();
    await page.screenshot({ path: path.join(root, 'docs/screenshots/entry-login-390.png'), fullPage: true });
    checks.push('Logout clears the session; a direct /play request returns to login');

    await page.goto(base + '/demo');
    await page.waitForFunction(() => document.querySelectorAll('.companion-strip .companion').length === 4 && !document.querySelector('.loading-rune'), null, { timeout: 60000 });
    checks.push('The explicit /demo route still opens the four-person combat sandbox');
    assert(!mutations.length, 'Navigation sent a durable game mutation');
    assert(!external.length, 'Navigation followed an external destination');
  } catch (error) { errors.push(String(error)); }
  finally {
    const sources = ['src/ui/main.tsx', 'src/ui/auth-page.tsx', 'src/ui/game/shell.tsx', 'vercel.json', 'scripts/test_entry_routes.cjs'];
    const source_sha256 = Object.fromEntries(sources.map(ref => [ref, createHash('sha256').update(fs.readFileSync(path.join(root, ref))).digest('hex')]));
    const report = { passed: checks.length === 7 && !errors.length && !mutations.length && !external.length, browser: browser.version(), base_url: base, checks, errors, game_mutations: mutations, external_requests: external, source_sha256, scope: 'Actual production browser bundle with intercepted Auth/API fixtures. Not hosted Auth, Supabase state or RLS proof.' };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report)); await browser.close(); if (!report.passed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
