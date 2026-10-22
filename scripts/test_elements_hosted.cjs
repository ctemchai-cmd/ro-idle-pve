// Public signed-out demo reuses the actual production element components. No login/save mutation.
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_LIVE_URL || 'https://ro-idle-pve.vercel.app';
if (!(base === 'https://ro-idle-pve.vercel.app' || new URL(base).hostname === '127.0.0.1')) throw new Error('UNEXPECTED_ORIGIN');
const check = (ok, message) => { if (!ok) throw new Error(message); };
(async () => {
  let browser, error = null; const errors = [], mutations = [], checks = [];
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    context.on('request', r => { if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) mutations.push(new URL(r.url()).pathname); });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message)); await page.goto(base + '/demo?theme-preview=1');
    await page.locator('.arena-enemy .armor-element').waitFor({ timeout: 40000 });
    check(await page.locator('.companion-strip canvas').count() === 4, 'SCENE_MISSING');
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      check(await page.locator('.arena-enemies').evaluate(n => n.scrollWidth <= n.clientWidth), 'ENEMY_LABEL_OVERFLOW');
      check(await page.locator('.armor-element').getAttribute('aria-label').then(s => s?.startsWith('เกราะธาตุ')), 'ARMOR_NOT_NAMED');
    }
    checks.push('Production native scene loads and compact target armor badge fits320/390px');
    await page.locator('.companion[data-actor="npc_mage"]').click(); await page.locator('.rotation-slot').first().click();
    check(await page.locator('.rotation-dock .skill-elements [data-element="fire"]').count() === 1, 'FIRE_BOLT_ELEMENT');
    await page.locator('.rotation-slot').nth(1).click();
    check(await page.locator('.rotation-dock .skill-elements [data-element="water"]').count() === 1, 'COLD_BOLT_ELEMENT');
    await page.locator('.companion[data-actor="main"]').click(); await page.locator('.rotation-slot').first().click();
    check(await page.locator('.rotation-dock .skill-elements [data-element="weapon"]').count() === 1, 'BASH_WEAPON_ELEMENT');
    // Resizing the viewport/dock clears the canvas until the next render frame. Wait for actual scene pixels.
    await page.waitForFunction(() => {
      const n = document.querySelector('.adventure-arena > canvas'), pixels = n.getContext('2d').getImageData(0, 0, n.width, n.height).data, colors = new Set();
      for (let i = 0; i < pixels.length; i += 128) if (pixels[i + 3]) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
      return colors.size > 128;
    });
    await page.screenshot({ path: path.join(root, 'plan/evidence/task-076-public-elements-320.png') });
    check(!errors.length && !mutations.length, 'PUBLIC_ERROR_OR_MUTATION');
    checks.push('Shared skill element component shows Fire Bolt/Cold Bolt/weapon element on real mobile demo without any mutating requests');
  } catch (e) { error = e.stack || String(e); }
  finally {
    if (browser) await browser.close(); const report = { task_id: 'TASK-076', passed: !error && checks.length === 2, error, errors, mutations, checks, origin: base, source_commit: process.env.RO_DEPLOY_COMMIT || null, scope: 'Signed-out shared demo only. Authenticated game/Angeling/endow/three modes separately verified on disposable local stack, not owner cloud.' };
    const suffix = new URL(base).hostname === '127.0.0.1' ? 'local-demo' : 'public-elements';
    fs.writeFileSync(path.join(root, `plan/evidence/task-076-${suffix}.json`), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report)); if (!report.passed) process.exitCode = 1;
  }
})();
