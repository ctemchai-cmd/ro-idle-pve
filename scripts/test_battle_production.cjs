const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_PRODUCTION_URL || 'http://127.0.0.1:5175';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const errors = [], external = [], requests = []; let recovered = false;
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(error.message)); page.on('request', request => requests.push(request.url()));
    await page.route('**/*', route => { const url = route.request().url(); if (url.startsWith(base + '/') || url.startsWith('data:')) route.continue(); else { external.push(url); route.abort(); } });
    const faultRoute = '**/ro/manifest.json'; await page.route(faultRoute, route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
    await page.goto(base); await page.getByRole('alert').waitFor({ timeout: 20000 });
    await page.unroute(faultRoute); await page.getByRole('button', { name: 'โหลดใหม่', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.party-card').length === 4 && !document.querySelector('.loading'), { timeout: 60000 }); recovered = true;
    await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
    await page.screenshot({ path: path.join(root, 'docs/screenshots/battle-demo-production.png'), fullPage: true });
    await page.getByRole('button', { name: /พายุของ Wizard/ }).click(); await page.waitForFunction(() => !document.querySelector('.loading'));
    if (await page.getByRole('alert').count()) throw new Error('Production scene load failed');
    if (requests.some(url => url.startsWith(base + '/src/') || url.includes('/assets/ro/'))) throw new Error('Production requested authoring source');
    if (external.length || errors.length) throw new Error(JSON.stringify({ external, errors }));
  } catch (error) { errors.push(String(error)); }
  finally {
    const build = JSON.parse(fs.readFileSync(path.join(root, 'dist/content-version.json'), 'utf8'));
    const report = { passed: recovered && !errors.length && !external.length, browser: browser.version(), content_hash: build.content_hash, asset_pack_hash: build.runtime_asset_pack_hash ?? build.asset_pack_hash, error_recovery_from_expected_503: recovered, errors, external_requests: external, source_requests: requests.filter(url => url.startsWith(base + '/src/') || url.includes('/assets/ro/')), scope: 'Local static production build startup/recovery/scene smoke; no Vercel/CDN/Auth/cloud/performance claim.' };
    fs.writeFileSync(path.join(root, 'plan/evidence/task-020-production.json'), JSON.stringify(report, null, 2)); await browser.close(); console.log(JSON.stringify(report)); if (!report.passed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
