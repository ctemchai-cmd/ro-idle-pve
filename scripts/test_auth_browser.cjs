const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_DEMO_URL || 'http://127.0.0.1:5174';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const checks = [], errors = [], external = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => { const url = route.request().url(); if (url.startsWith(base + '/') || url.startsWith('data:')) return route.continue(); external.push(url); return route.abort(); });
    await page.goto(base + '/auth'); await page.getByText('เดโมนี้ยังไม่ได้เชื่อมต่อระบบบัญชี').waitFor();
    if (await page.locator('input').count()) throw new Error('Unconfigured auth exposes a misleading form');
    await page.screenshot({ path: path.join(root, 'docs/screenshots/auth-unconfigured.png'), fullPage: true });
    checks.push('Actual app /auth safely reports missing configuration without fake login');
    await page.goto(base + '/tests/browser/auth.html');
    await page.getByLabel('อีเมล', { exact: true }).fill('owner@example.invalid'); await page.getByLabel('รหัสผ่าน', { exact: true }).fill('wrong');
    await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click(); await page.getByRole('alert').waitFor();
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('fixture-password'); await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click();
    await page.getByRole('heading', { name: 'ยินดีต้อนรับกลับ' }).waitFor();
    await page.getByRole('button', { name: 'ตรวจเซฟของฉัน' }).click(); await page.getByText('บัญชีนี้ยังไม่มีเซฟเกม', { exact: false }).waitFor();
    await page.evaluate(() => window.__authFixture.setSaveStatus(503)); await page.getByRole('button', { name: 'ตรวจเซฟของฉัน' }).click(); await page.getByRole('alert').waitFor();
    if (await page.getByRole('heading', { name: 'ยินดีต้อนรับกลับ' }).count() !== 1) throw new Error('503 incorrectly expired auth');
    await page.evaluate(() => window.__authFixture.setSaveStatus(401)); await page.getByRole('button', { name: 'ตรวจเซฟของฉัน' }).click();
    await page.getByText('เซสชันหมดอายุ', { exact: false }).waitFor();
    checks.push('Fixture UI: signin error/success, missing save does not create wallet,503 preserves session,401 returns signin');
    await page.getByRole('button', { name: 'ลืมรหัสผ่าน' }).click(); await page.getByLabel('อีเมล', { exact: true }).fill('owner@example.invalid');
    await page.getByRole('button', { name: 'ส่งลิงก์เปลี่ยนรหัสผ่าน' }).click(); await page.getByText('หากมีบัญชีนี้', { exact: false }).waitFor();
    await page.evaluate(() => window.__authFixture.recover()); await page.getByRole('heading', { name: 'ตั้งรหัสผ่านใหม่' }).waitFor();
    await page.getByLabel('รหัสผ่านใหม่', { exact: true }).fill('new-fixture-password'); await page.getByLabel('ยืนยันรหัสผ่านใหม่', { exact: true }).fill('mismatch-password');
    await page.getByRole('button', { name: 'บันทึกรหัสผ่านใหม่' }).click(); await page.getByText('รหัสผ่านทั้งสองช่องไม่ตรงกัน').waitFor();
    await page.getByLabel('ยืนยันรหัสผ่านใหม่', { exact: true }).fill('new-fixture-password'); await page.getByRole('button', { name: 'บันทึกรหัสผ่านใหม่' }).click();
    await page.getByRole('heading', { name: 'ยินดีต้อนรับกลับ' }).waitFor(); await page.getByRole('button', { name: 'ออกจากบัญชี', exact: true }).click();
    await page.getByRole('heading', { name: 'เข้าสู่บัญชี', exact: true }).waitFor();
    if ((await page.locator('body').innerText()).includes('browser-fixture-token')) throw new Error('UI exposed session token');
    if (await page.locator('input[type=password]').inputValue() !== '') throw new Error('Password retained after logout');
    const calls = await page.evaluate(() => window.__authFixture.calls);
    if (JSON.stringify(calls) !== JSON.stringify(['signin', 'reset', 'updated', 'signout'])) throw new Error('Unexpected fixture sequence: ' + JSON.stringify(calls));
    checks.push('Fixture recovery form checks confirmation, calls password update, logout clears credentials; UI never renders token');
    for (const viewport of [{ width: 360, height: 780 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      await page.setViewportSize(viewport);
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Auth layout overflow');
      await page.getByLabel('อีเมล', { exact: true }).focus(); await page.keyboard.press('Tab');
      if (await page.locator('input[name=password]').evaluate(el => el !== document.activeElement)) throw new Error('Password keyboard order broken');
      await page.screenshot({ path: path.join(root, `docs/screenshots/auth-${viewport.width}.png`), fullPage: true });
    }
    checks.push('360/390/1280 layouts have no horizontal overflow and preserve keyboard form order');
    await page.goto(base + '/'); await page.waitForFunction(() => document.querySelectorAll('.party-card').length === 4 && !document.querySelector('.loading'), { timeout: 60000 });
    await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
    await page.getByRole('button', { name: /พายุของ Wizard/ }).click(); await page.waitForFunction(() => !document.querySelector('.loading'));
    if (await page.getByRole('alert').count()) throw new Error('Battle route regression');
    checks.push('Lazy route split preserves four-person battle and native Storm Gust encounter');
  } catch (error) { errors.push(String(error)); }
  finally {
    const sources = ['scripts/test_auth_browser.cjs', 'tests/browser/auth-harness.tsx', 'src/ui/main.tsx', 'src/ui/auth-page.tsx', 'src/ui/auth.css', 'src/client/auth-controller.ts', 'src/client/account.ts'];
    const source_sha256 = Object.fromEntries(sources.map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
    const report = { passed: checks.length === 5 && !errors.length && !external.length, browser: browser.version(), actual_supabase_auth: false, checks, errors, external_requests: external, source_sha256, scope: 'Real Chrome UI with explicitly fake Auth provider; actual unconfigured app and battle route regression. Not hosted Auth/email/JWT/RLS proof.' };
    fs.writeFileSync(path.join(root, 'plan/evidence/task-021-browser.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report)); await browser.close(); if (!report.passed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
