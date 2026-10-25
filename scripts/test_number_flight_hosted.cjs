// Verify the built public product and actual native number motion, without owner access.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const { chromium } = require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const evidenceTask = process.env.RO_EVIDENCE_TASK || 'task-150'; assert(/^task-\d{3}$/.test(evidenceTask));
const root = path.resolve(__dirname, '..'), out = path.join(root, 'plan/evidence', evidenceTask), base = 'https://ro-idle-pve.vercel.app';
(async () => {
  let browser, failure; const checks = [], errors = [], writes = [];
  try {
    const local = JSON.parse(fs.readFileSync(path.join(root, 'dist/content-version.json'))), pack = JSON.parse(fs.readFileSync(path.join(root, 'runtime/ro/manifest.json')));
    const healthRes = await fetch(base + '/api/health', { cache: 'no-store' }), health = await healthRes.json();
    assert(healthRes.ok && health.content_hash === local.content_hash && healthRes.headers.get('x-ro-api-region') === 'sin1');
    for (const route of ['/api/checkpoint', '/api/save-slots']) assert.equal((await fetch(base + route)).status, 401);
    const publicPack = await (await fetch(base + '/ro/manifest.json', { cache: 'no-store' })).json(); assert.equal(publicPack.pack_hash, pack.pack_hash);
    checks.push({ case: 'API_SIN1_content_pack_unchanged_anonymous401', content_hash: health.content_hash, pack_hash: publicPack.pack_hash });
    const version = await (await fetch(base + '/content-version.json', { cache: 'no-store' })).json();
    // Auth public configuration changes Vite chunk hashes between local and Vercel.
    // Verify every deployed file against its deployment manifest, then the new adapter markers.
    assert.equal(version.content_hash, local.content_hash);
    const files = version.build_files.filter(f => /^dist\/assets\/.*\.(js|css)$/.test(f.path)); assert(files.length > 10); const sources = [];
    for (const file of files) {
      const response = await fetch(base + '/' + file.path.replace(/^dist\//, '')); const bytes = Buffer.from(await response.arrayBuffer());
      assert(response.ok); assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256); sources.push(bytes.toString());
    }
    for (const marker of ['numberOrigin', 'started_at_ms', 'totalOrigins']) assert(sources.join('\n').includes(marker), marker);
    if (evidenceTask === 'task-152') assert(/damage:34,critical:43,total:43,heal:30,incoming:27/.test(sources.join('\n')), 'OLD_NUMBER_SIZE');
    checks.push({ case: 'all_public_bundle_SHA_and_new_number_flight_adapter', files: files.length });
    browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    const page = await browser.newPage({ viewport: { width: 320, height: 844 }, isMobile: true, hasTouch: true });
    page.on('pageerror', e => errors.push(e.message)); page.on('request', r => { if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) writes.push(new URL(r.url()).pathname); });
    await page.addInitScript(() => {
      window.numberFlight150 = []; const original = CanvasRenderingContext2D.prototype.drawImage, ids = new WeakMap(); let id = 0;
      CanvasRenderingContext2D.prototype.drawImage = function (...args) {
        original.apply(this, args); const image = args[0];
        if (args.length !== 5 || !(image instanceof HTMLCanvasElement) || image.width > 600 || image.height > 64) return;
        if (!ids.has(image)) {
          const data = image.getContext('2d').getImageData(0, 0, image.width, image.height).data; let green = 0;
          for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 128 && data[i + 1] > data[i] * 1.25 && data[i + 1] > data[i + 2] * 1.25) green++;
          ids.set(image, green > 5 ? ++id : 0);
        }
        const key = ids.get(image); if (!key) return;
        const t = this.getTransform(), ratio = this.canvas.clientWidth / this.canvas.width;
        window.numberFlight150.push({ id: key, at: performance.now(), x: t.e * ratio, y: t.f * ratio, height: Math.hypot(t.c, t.d) * Math.abs(args[4]) * ratio, alpha: this.globalAlpha });
        if (window.numberFlight150.length > 2000) window.numberFlight150.shift();
      };
    });
    const rows = [];
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 }); await page.goto(base + '/skill-preview?job=acolyte&skill=acolyte_heal&rank=10');
      await page.locator('.skill-preview[data-ready="true"]').waitFor({ timeout: 30000 });
      await page.waitForFunction(() => { const a = window.numberFlight150; return a.length && a.at(-1).at - a[0].at > 560; }, {}, { timeout: 20000 });
      const samples = await page.evaluate(() => {
        const all = window.numberFlight150, first = all[0], rows = all.filter(r => r.id === first.id && r.at - first.at < 750);
        return [0, 120, 280, 550].map(age => rows.reduce((a, b) => Math.abs(b.at - first.at - age) < Math.abs(a.at - first.at - age) ? b : a));
      });
      for (let i = 1; i < samples.length; i++) assert(samples[i].x > samples[i - 1].x, JSON.stringify(samples));
      assert(samples[1].y < samples[0].y && samples[2].y < samples[1].y && samples[3].y > samples[2].y + 10, 'NO_FALLING_ARC:' + JSON.stringify(samples));
      if (evidenceTask === 'task-152') assert(Math.max(...samples.map(s => s.height)) > 38.5, 'OLD_NATIVE_HEAL_SIZE');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      rows.push({ width, samples, native_green_digits_upper_right_falling_arc: true }); await page.screenshot({ path: path.join(out, 'hosted-heal-' + width + '.png') });
    }
    checks.push({ case: 'actual_public_native_green_digits_upper_right_falling_arc_mobile320390', rows });
    assert(!errors.length && !writes.length); checks.push({ case: 'no_browser_errors_or_HTTP_writes', passed: true });
  } catch (e) { failure = String(e.stack || e); }
  finally {
    await browser?.close(); const report = { passed: !failure && checks.length === 4, checks, errors, writes, failure };
    fs.writeFileSync(path.join(out, 'hosted.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report)); if (!report.passed) process.exitCode = 1;
  }
})();
