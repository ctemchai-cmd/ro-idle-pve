// Read-only public release checks. Never log in or access the owner's saves.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const { chromium } = require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const task = process.env.RO_EVIDENCE_TASK || 'task-151'; assert(/^task-\d{3}$/.test(task));
const root = path.resolve(__dirname, '..'), out = path.join(root, 'plan/evidence/' + task), base = 'https://ro-idle-pve.vercel.app';
(async () => {
  let browser, failure; const checks = [], errors = [], writes = [];
  try {
    const local = JSON.parse(fs.readFileSync(path.join(root, 'runtime/ro/manifest.json'))), content = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/runtime-manifest.json')));
    const h = await fetch(base + '/api/health', { cache: 'no-store' }), health = await h.json(); assert(h.ok && health.content_hash === content.content_hash && h.headers.get('x-ro-api-region') === 'sin1');
    for (const route of ['/api/checkpoint', '/api/save-slots']) assert.equal((await fetch(base + route)).status, 401);
    const pack = await (await fetch(base + '/ro/manifest.json', { cache: 'no-store' })).json();
    assert.equal(pack.pack_hash, local.pack_hash); assert.equal(pack.sidecar_encoding, 'compact-json-safe-integers-v1');
    assert.deepEqual(pack.combat_visuals.ground_fields, local.combat_visuals.ground_fields); assert.deepEqual(pack.combat_visuals.performance_auras, local.combat_visuals.performance_auras);
    assert.equal(Object.keys(pack.combat_visuals.ground_fields).length, 10); assert(pack.sizes.initial_profile_raw_bytes <= 1621492); assert(pack.sizes.media_and_sidecar_bytes + pack.sizes.manifest_bytes < 33554432);
    checks.push({ case: 'health_SIN1_auth401_unchanged_content_10fields_pack_budget_and_smaller_initial', content_hash: health.content_hash, pack_hash: pack.pack_hash, sizes: pack.sizes });
    const audit = JSON.parse(fs.readFileSync(path.join(out, 'native-bindings.json'))), verified = new Set();
    for (const row of audit.selected) {
      const asset = Object.values(pack.assets).find(a => a.meta_path === row.meta); assert(asset, row.meta);
      for (const ref of [asset.meta_path, asset.media_path]) {
        if (verified.has(ref)) continue; const r = await fetch(base + pack.base_url + ref), bytes = Buffer.from(await r.arrayBuffer()); assert(r.ok, ref);
        assert.equal(createHash('sha256').update(bytes).digest('hex'), pack.files.find(f => f.path === ref).sha256, ref); verified.add(ref);
      }
    }
    checks.push({ case: '20_selected_native_refs_all_public_sidecar_and_media_SHA', files: verified.size });
    const version = await (await fetch(base + '/content-version.json', { cache: 'no-store' })).json(), files = version.build_files.filter(f => /^dist\/assets\/.*\.(js|css)$/.test(f.path)), sources = [];
    for (const file of files) { const r = await fetch(base + '/' + file.path.replace(/^dist\//, '')), bytes = Buffer.from(await r.arrayBuffer()); assert(r.ok); assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256); sources.push(bytes.toString()); }
    for (const marker of ['INVALID_GROUND_FIELD', 'GROUND_FLOOR_NOT_PREPARED', 'floor_black_key', 'numberOrigin']) assert(sources.join('\n').includes(marker), marker);
    if (task === 'task-153') for (const marker of ['floor_tiles', 'ring_bounds', 'salvage-card-summary', 'summon-again', 'ยืนยันย่อยการ์ด', 'สุ่มอีก']) assert(sources.join('\n').includes(marker), marker);
    checks.push({ case: 'all_public_bundle_SHA_new_ground_adapter_and_curved_numbers', files: files.length });
    browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    page.on('pageerror', e => errors.push(e.message)); page.on('request', r => { if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) writes.push(new URL(r.url()).pathname); });
    await page.addInitScript(() => {
      const original = CanvasRenderingContext2D.prototype.drawImage, sources = new WeakMap(), inspected = new WeakSet(); window.ground151 = { draws: [], mattes: [] };
      CanvasRenderingContext2D.prototype.drawImage = function (...args) {
        original.apply(this, args); const image = args[0], src = image?.src || sources.get(image) || '';
        if (!['magic_ring_a_s', 'quagmire_out', 'meteor2', 'all_ground', 'idun_apple', 'heart_2'].some(s => src.includes(s))) return;
        if (!this.canvas.clientWidth) sources.set(this.canvas, src);
        else {
          window.ground151.draws.push({ src, filter: this.filter, blend: this.globalCompositeOperation, alpha: this.globalAlpha });
          if (src.includes('quagmire_out') && image instanceof HTMLCanvasElement && !inspected.has(image)) {
            const ctx = image.getContext('2d'), points = [[0, 0], [image.width - 1, 0], [0, image.height - 1], [image.width - 1, image.height - 1]];
            window.ground151.mattes.push(points.map(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3])); inspected.add(image);
          }
          if (window.ground151.draws.length > 10000) window.ground151.draws.shift();
        }
      };
    });
    const rows = [];
    for (const [width, job, id, needle] of [[320, 'priest', 'priest_sanctuary', 'magic_ring_a_s'], [390, 'wizard', 'wizard_quagmire', 'quagmire_out'], [390, 'wizard', 'wizard_meteor', 'meteor2'], [320, 'bard', 'bard_healing_song', 'idun_apple'], [390, 'dancer', 'dancer_battle_song', 'heart_2'], [390, 'professor', 'professor_soul_change', 'magic_ring_a_s']]) {
      await page.setViewportSize({ width, height: 844 }); await page.goto(base + `/skill-preview?job=${job}&skill=${id}&rank=10`);
      await page.locator('.skill-preview[data-ready="true"]').waitFor({ timeout: 30000 });
      await page.waitForFunction(needle => window.ground151.draws.some(d => d.src.includes(needle)), needle, { timeout: 20000 });
      const painted = await page.evaluate(() => window.ground151);
      if (id === 'wizard_quagmire') assert(painted.mattes.length && painted.mattes.every(a => a.every(alpha => alpha === 0)), 'BLACK_GROUND_BOX');
      if (job === 'bard' || job === 'dancer') { assert(painted.draws.some(d => d.src.includes('all_ground') && d.blend === 'lighter'), 'OPAQUE_SONG_BOX'); assert(painted.draws.filter(d => d.src.includes(needle)).every(d => d.filter === 'none'), 'SONG_SYMBOL_RECOLORED'); }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      rows.push({ width, job, id, real_native_draws: painted.draws.filter(d => d.src.includes(needle)).length, transparent_matte: painted.mattes });
      await page.screenshot({ path: path.join(out, `hosted-${id}-${width}.png`) });
    }
    assert(!errors.length && !writes.length); checks.push({ case: 'six_actual_public_native_scenes_mobile320390_transparent_ground_original_song_symbols', rows, errors: 0, writes: 0 });
  } catch (e) { failure = String(e.stack || e); }
  finally { await browser?.close(); const report = { passed: !failure && checks.length === 4, checks, errors, writes, failure }; fs.writeFileSync(path.join(out, 'hosted.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report)); if (!report.passed) process.exitCode = 1; }
})();
