// Supplemental TASK-020 regression: all idle frames, complete clips, live timeline.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_PREVIEW_URL || 'http://127.0.0.1:5173';
const checks = [], errors = [], external = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function check(id, fn) { const result = await fn(); checks.push({ case_id: id, passed: true, result }); console.log(JSON.stringify({ check: id, passed: true })); }
(async () => {
 const browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
 try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP${response.status()}:${response.url()}`); });
  await page.route('**/*', route => { const url = route.request().url(); if (url.startsWith(base + '/') || url.startsWith('data:')) route.continue(); else { external.push(url); route.abort(); } });
  await page.goto(base);
  await page.waitForFunction(() => document.querySelectorAll('.timeline-skill').length > 10, { timeout: 60000 });
  await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
  await check('live_timeline_axis_seconds_pause_zoom_selection_rotation', async () => {
   assert(await page.locator('.timeline-row').count() === 7, 'Expected four party and three enemy rows');
   assert(await page.locator('.enemy-start').count() === 1, 'Missing party/enemy separator');
   const rows = await page.locator('.timeline-row').evaluateAll(rows => rows.map(row => ({ actor: row.dataset.actor, skills: [...row.querySelectorAll('.timeline-entry')].map(entry => ({ skill: entry.dataset.skill, at: Number(entry.dataset.startMs), label: entry.querySelector('time')?.textContent })) })));
   for (const row of rows) { assert(row.skills.length > 0, 'Missing actor skill row: ' + row.actor); for (const entry of row.skills) if (entry.label) assert(entry.label === (entry.at / 1000).toFixed(1) + 's', 'Wrong skill timestamp'); }
   assert(rows.filter(row => row.actor.startsWith('npc') || row.actor === 'main').every(row => row.skills.some(entry => entry.at === 1500)), 'Initial1.5s not visible');
   const now = await page.locator('.timeline-clock').innerText(); await page.waitForTimeout(250); assert(now === await page.locator('.timeline-clock').innerText(), 'Timeline moves while paused');
   const selected = page.locator('.timeline-row[data-actor="npc_mage"] .timeline-skill').first(); await selected.click(); assert(await selected.getAttribute('aria-pressed') === 'true', 'Skill details cannot be selected'); assert((await page.locator('.timeline-detail').innerText()).includes('เริ่ม 1.5s'), 'Missing selected seconds');
   await page.getByLabel('ช่วงเวลา Timeline').selectOption('10000'); assert(await page.locator('.timeline-axis time').count() <= 6, 'Zoom did not change scale');
   await page.getByLabel('ช่วงเวลา Timeline').selectOption('20000');
   await page.locator('.skill-timeline').screenshot({ path: path.join(root, 'docs/screenshots/battle-timeline.png') });
   const first = await page.locator('.skill-slot strong').first().innerText(); await page.locator('.skill-slot').nth(0).click(); await page.locator('.skill-slot').nth(1).click();
   await page.waitForFunction(() => !document.querySelector('.loading') && document.querySelectorAll('.timeline-skill').length > 10);
   await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
   const after = await page.locator('.skill-slot strong').first().innerText(); assert(after !== first, 'Rotation did not swap');
   assert((await page.locator('.timeline-row[data-actor="main"] .timeline-skill').first().getAttribute('title')).startsWith(after), 'Timeline cache did not refresh with rotation');
   return { actor_rows: rows, pause: true, zoom: true, pointer_details: true, rotation_refresh: true };
  });
  await check('all_36_presets_idle_pixel_stability_and_every_attack_frame', async () => page.evaluate(async () => {
   const { AssetPack } = await import('/src/renderer/pack.ts'), { drawActor, actorDuration, actorFrame } = await import('/src/renderer/native.mjs');
   const pack = await AssetPack.open(), canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 384; const context = canvas.getContext('2d'); context.imageSmoothingEnabled = false;
   let idleComparisons = 0, attackFrames = 0, mirrorComparisons = 0;
   for (const job of pack.index.actor_jobs) for (const preset of job.presets) {
    const parts = { body: await pack.asset(preset.body.meta), head: await pack.asset(preset.head.meta), weapon: preset.weapon ? await pack.asset(preset.weapon.meta) : undefined, attackIndex: preset.attack_source_action_index };
    for (const facing of ['left', 'right']) {
     let baseline;
     for (const elapsed of [0, 50, 100, 150, 200, 250, 300, 550, 1100, 5000]) {
      context.clearRect(0, 0, 384, 384); drawActor(context, parts, 'idle', elapsed, 192, 270, facing, 2); const pixels = context.getImageData(0, 0, 384, 384).data;
      if (!baseline) baseline = pixels;
      else { if (pixels.some((value, index) => value !== baseline[index])) throw new Error('Idle pixels/head changed:' + preset.preset_id + ':' + facing + ':' + elapsed); idleComparisons++; }
     }
    }
    const duration = actorDuration(parts, 'attack'), delay = actorFrame(parts, 'attack', 0).action.frame_duration_ms;
    for (let elapsed = 0; elapsed < duration; elapsed += delay) {
     const pixels = [];
     for (const facing of ['right', 'left']) {
      context.clearRect(0, 0, 384, 384); if (!drawActor(context, parts, 'attack', elapsed, 192, 270, facing, 2)) throw new Error('Empty attack:' + preset.preset_id);
      pixels.push(context.getImageData(0, 0, 384, 384).data); attackFrames++;
     }
     let differences = 0, occupied = 0;
     for (let y = 0; y < 384; y++) for (let x = 0; x < 384; x++) { const a = (y * 384 + x) * 4, b = (y * 384 + 383 - x) * 4; if (pixels[0][a + 3] || pixels[1][b + 3]) occupied++; if ([0, 1, 2, 3].some(c => Math.abs(pixels[0][a + c] - pixels[1][b + c]) > 2)) differences++; }
     if (differences / Math.max(1, occupied) > .005) throw new Error('Complete actor flip failed:' + preset.preset_id + ':' + elapsed); mirrorComparisons++;
    }
   }
   pack.dispose(); return { presets: 36, idle_pixel_comparisons: idleComparisons, attack_frame_samples: attackFrames, attack_mirror_comparisons: mirrorComparisons, scope: 'All idle sample times and each native attack frame automated; no exhaustive manual cosmetic review.' };
  }));
  await check('actual_frame_gallery_and_reported_18s_scene', async () => {
   const result = await page.evaluate(async () => {
    const { AssetPack } = await import('/src/renderer/pack.ts'), { DemoSession } = await import('/src/client/demo.ts'), { BattleRenderer } = await import('/src/renderer/battle.ts'), { drawActor } = await import('/src/renderer/native.mjs');
    const session = new DemoSession('boss', 2), pack = await AssetPack.open(); await pack.prepare(session.scene, session.view().actors.flatMap(actor => actor.slots.filter(Boolean)));
    const gallery = document.createElement('canvas'); gallery.width = 1600; gallery.height = 1040; gallery.id = 'animation-gallery'; gallery.style.cssText = 'display:block;position:relative;width:1600px;z-index:9999'; document.body.append(gallery);
    const ctx = gallery.getContext('2d'); ctx.fillStyle = '#eff0df'; ctx.fillRect(0, 0, 1600, 1040); ctx.imageSmoothingEnabled = false; ctx.font = '14px ROThai';
    const cases = [['idle', 0], ['idle', 100], ['idle', 200], ['attack', 0], ['attack', 300], ['attack', 700], ['attack', 850], ['standby', 300], ['hurt', 200], ['dead', 800]];
    for (const [row, actor] of session.view().actors.filter(actor => actor.team === 'player').entries()) for (const [col, [state, ms]] of cases.entries()) { const x = col * 160 + 80, y = row * 260 + 225; drawActor(ctx, pack.actors.get(actor.actor_id), state, ms, x, y, 'right', 1.8); ctx.fillStyle = '#45553b'; ctx.fillText(state + ' ' + ms, col * 160 + 8, row * 260 + 250); }
    const battle = document.createElement('canvas'); battle.id = 'reported-battle-proof'; battle.width = 1280; battle.height = 720; document.body.append(battle);
    const renderer = new BattleRenderer(battle, pack, session.scene); renderer.accept(session.advanceTo(18000)); renderer.draw(session.view(), 18000);
    return { at_ms: session.state.game_time_ms, poses: cases, party: session.view().actors.filter(actor => actor.team === 'player').map(actor => actor.name) };
   });
   await page.locator('#animation-gallery').screenshot({ path: path.join(root, 'docs/screenshots/battle-animation-frames.png') });
   await page.locator('#reported-battle-proof').screenshot({ path: path.join(root, 'docs/screenshots/battle-heads-fixed-18s.png') });
   await page.evaluate(() => { document.querySelector('#animation-gallery').remove(); document.querySelector('#reported-battle-proof').remove(); });
   return result;
  });
  await check('forecast_render_rates_and_interruption_remain_engine_identical', async () => page.evaluate(async () => {
   const { DemoSession } = await import('/src/client/demo.ts'), { AssetPack } = await import('/src/renderer/pack.ts'), { BattleRenderer } = await import('/src/renderer/battle.ts'), { canonical } = await import('/src/content/value.ts');
   const pack = await AssetPack.open(), canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720; const runs = [];
   for (const encounter of ['boss', 'warded', 'storm']) {
    const expected = new DemoSession(encounter, 2); expected.advanceTo(90000);
    for (const fps of [0, 30, 60]) {
     const session = new DemoSession(encounter, 2); await session.timeline(() => Promise.resolve()); await pack.prepare(session.scene, session.view().actors.flatMap(actor => actor.slots.filter(Boolean))); const renderer = new BattleRenderer(canvas, pack, session.scene); let frames = 0;
     const tick = fps ? 1000 / fps : 90000;
     for (let ms = tick; ms <= 90000 + tick && !session.state.terminal_result; ms += tick) { const until = Math.min(90000, Math.floor(ms / 50) * 50); if (until > session.state.game_time_ms) renderer.accept(session.advanceTo(until)); if (fps && !(ms > 8000 && ms < 10000)) { renderer.draw(session.view(), session.state.game_time_ms); frames++; } }
     if (canonical(session.state) !== canonical(expected.state) || canonical(session.history) !== canonical(expected.history)) throw new Error('Timeline/render mutated combat:' + encounter + ':' + fps);
     runs.push({ encounter, fps, frames, end_ms: session.state.game_time_ms, rng_draws: session.state.rng.draw_count, exact_state_events_metrics: true });
    }
   }
   pack.dispose(); return runs;
  }));
  await check('mobile_scroll_keyboard_and_full_page_bounds', async () => {
   const samples = [];
   for (const width of [360, 390, 844, 1280]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Outer page overflows:' + width);
    const viewport = page.locator('.timeline-viewport'); await viewport.scrollIntoViewIfNeeded(); await viewport.focus(); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150);
    const scroll = await viewport.evaluate(node => ({ left: node.scrollLeft, width: node.clientWidth, total: node.scrollWidth }));
    if (width <= 390) assert(scroll.left > 0 && scroll.total > scroll.width, 'Timeline cannot scroll:' + width);
    assert(await page.evaluate(() => document.activeElement?.classList.contains('timeline-viewport')), 'Keyboard focus missing');
    await viewport.evaluate(node => { node.scrollLeft = 0; });
    if (width === 390) await page.screenshot({ path: path.join(root, 'docs/screenshots/battle-timeline-mobile.png'), fullPage: true });
    samples.push({ viewport_width: width, outer_overflow: false, ...scroll });
   }
   return samples;
  });
  assert(!errors.length && !external.length, JSON.stringify({ errors, external }));
 } catch (error) { errors.push(String(error)); console.error(String(error)); }
 finally {
  const inputs = ['src/renderer/native.mjs', 'src/renderer/actor-animation.ts', 'src/renderer/battle.ts', 'src/client/battle-timeline.ts', 'src/client/demo.ts', 'src/contracts/presentation.ts', 'src/ui/skill-timeline.tsx', 'src/ui/timeline.css', 'src/ui/battle-app.tsx', 'tests/game/animation.test.ts', 'tests/game/timeline.test.ts', 'tests/renderer.test.mjs', 'scripts/test_animation_timeline.cjs', 'runtime/ro/manifest.json', 'src/generated/runtime-manifest.json'];
  const report = { task_id: 'TASK-020', round: 4, passed: checks.length === 5 && !errors.length && !external.length, browser: browser.version(), checks, errors, external_requests: external, input_sha256: Object.fromEntries(inputs.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')])), limitations: ['Local Chrome headless; real device/Safari/performance budgets remain TASK-042.', 'Timeline forecasts this disposable deterministic scene; future stochastic/player-controlled inputs require fresh projections.', 'Automated all-preset frame checks and separately scoped manual gallery review, not exhaustive cosmetics.'] };
  fs.writeFileSync(path.join(root, 'plan/evidence/task-020-animation-timeline-browser.json'), JSON.stringify(report, null, 2));
  await browser.close(); console.log(JSON.stringify({ passed: report.passed, checks: checks.length, errors })); if (!report.passed) process.exitCode = 1;
 }
})().catch(error => { console.error(error); process.exitCode = 1; });
