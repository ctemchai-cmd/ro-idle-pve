const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_PRODUCTION_URL || 'http://127.0.0.1:5175';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const errors = [], external = [], requested = [], checks = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requested.push(request.url()));
    await page.route('**/*', route => { const url = route.request().url(); if (url.startsWith(base + '/') || url.startsWith('data:')) return route.continue(); external.push(url); return route.abort(); });
    await page.goto(base); await page.waitForFunction(() => document.querySelectorAll('.party-card').length === 4 && !document.querySelector('.loading'), { timeout: 60000 });
    if (requested.some(url => url.includes('/auth-page-'))) throw new Error('Battle bootstrap eagerly fetched Auth SDK chunk');
    await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
    checks.push('Production battle bootstrap shows real four-person demo without eagerly loading Auth chunk');
    await page.getByRole('link', { name: 'บัญชีส่วนตัว ↗' }).click(); await page.getByText('เดโมนี้ยังไม่ได้เชื่อมต่อระบบบัญชี').waitFor();
    await page.reload(); await page.getByText('เดโมนี้ยังไม่ได้เชื่อมต่อระบบบัญชี').waitFor();
    if (await page.locator('input').count()) throw new Error('Production missing config shows a fake form');
    await page.screenshot({ path: path.join(root, 'docs/screenshots/auth-production.png'), fullPage: true });
    await page.getByRole('link', { name: 'ไปเดโมต่อสู้' }).click(); await page.waitForFunction(() => document.querySelectorAll('.party-card').length === 4 && !document.querySelector('.loading'), { timeout: 60000 });
    await page.getByRole('button', { name: /พายุของ Wizard/ }).click(); await page.waitForFunction(() => !document.querySelector('.loading'));
    if (await page.getByRole('alert').count()) throw new Error('Production battle navigation failed');
    checks.push('Static /auth navigation and direct reload show missing config; return to native Storm Gust scene works');
    if (requested.some(url => url.startsWith(base + '/src/') || url.includes('/assets/ro/') || url.includes('/tests/'))) throw new Error('Production fetched authoring/test source');
    checks.push('Only selected runtime assets and compiled chunks requested; no original asset library, test harness, external requests or runtime errors');
  } catch (error) { errors.push(String(error)); }
  finally {
    const build = JSON.parse(fs.readFileSync(path.join(root, 'dist/content-version.json'), 'utf8'));
    const source_sha256 = Object.fromEntries(['scripts/test_auth_production.cjs', 'src/ui/main.tsx', 'src/ui/auth-page.tsx', 'src/ui/battle-app.tsx'].map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
    const report = { task_id: 'TASK-021', passed: checks.length === 3 && !errors.length && !external.length, browser: browser.version(), content_hash: build.content_hash, source_sha256, checks, errors, external_requests: external, actual_supabase_auth: false, scope: 'Local static production build, unconfigured Auth and battle navigation. No Vercel/Auth provider/cloud evidence.' };
    fs.writeFileSync(path.join(root, 'plan/evidence/task-021-production.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report)); await browser.close(); if (!report.passed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
