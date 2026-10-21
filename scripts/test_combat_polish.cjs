// TASK-020 round5: actual frame motion, RO bitmap numbers, focused damage, missiles, solo boss.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_PREVIEW_URL || 'http://127.0.0.1:5173';
const checks = [], errors = [], external = [];
const assert = (value, message) => { if (!value) throw new Error(message); };
async function check(id, fn) { const result = await fn(); checks.push({ case_id: id, passed: true, result }); console.log(JSON.stringify({ check: id, passed: true })); }
(async () => {
 const browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
 try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP${response.status()}:${response.url()}`); });
  await page.route('**/*', route => { const url = route.request().url(); if (url.startsWith(base + '/') || url.startsWith('data:')) route.continue(); else { external.push(url); route.abort(); } });
  await page.goto(base); await page.waitForFunction(() => document.querySelectorAll('.timeline-skill').length > 5, { timeout: 60000 });
  await check('live_solo_boss_3s_and_frame_continuous_timeline', async () => {
   assert(await page.locator('.timeline-row').count() === 5, 'Boss must have four players + one enemy');
   assert(await page.locator('.enemy-status').count() === 1, 'Boss adds still present');
   for (const id of ['main', 'npc_mage', 'npc_archer', 'npc_acolyte']) assert(await page.locator(`.timeline-row[data-actor="${id}"] .timeline-entry`).first().getAttribute('data-start-ms') === '3000', 'First skill must wait3s:' + id);
   await page.waitForFunction(() => Number(document.querySelector('.timeline-clock b').textContent.slice(0, -1)) >= 7, { timeout: 15000 });
   const motion = await page.evaluate(async () => {
    const marker = document.querySelector('.timeline-row[data-actor="npc_mage"] .timeline-skill'), points = [], until = performance.now() + 2000;
    await new Promise(resolve => { function sample(at) { points.push({ at, x: marker.getBoundingClientRect().x }); if (at < until) requestAnimationFrame(sample); else resolve(); } requestAnimationFrame(sample); });
    const deltas = points.slice(1).map((row, i) => ({ dt: row.at - points[i].at, dx: row.x - points[i].x }));
    const moved = deltas.filter(row => Math.abs(row.dx) > .01).length, dt = deltas.map(row => row.dt).sort((a, b) => a - b);
    return { frames: deltas.length, moving_frames: moved, moving_fraction: moved / deltas.length, p95_frame_ms: dt[Math.floor(dt.length * .95)], max_frame_ms: dt.at(-1), max_marker_step_px: Math.max(...deltas.map(row => Math.abs(row.dx))), backwards: deltas.filter(row => row.dx > .1).length };
   });
   assert(motion.frames > 70 && motion.moving_fraction > .8 && motion.backwards === 0, 'Timeline still moves in100ms steps:' + JSON.stringify(motion));
   await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
   const before = await page.locator('.timeline-clock').innerText(), transform = await page.locator('.timeline-row .timeline-content').first().evaluate(node => getComputedStyle(node).transform);
   await page.waitForTimeout(300); assert(before === await page.locator('.timeline-clock').innerText(), 'Paused clock advances'); assert(transform === await page.locator('.timeline-row .timeline-content').first().evaluate(node => getComputedStyle(node).transform), 'Paused transform drifts');
   await page.locator('.skill-timeline').screenshot({ path: path.join(root, 'docs/screenshots/combat-polish-timeline.png') });
   return { ...motion, actor_rows: 5, enemies: 1, base_skill_interval_ms: 3000, pause_exact: true };
  });
  await check('native_RO_numbers_crit_and_source_target_projectiles', async () => {
   const result = await page.evaluate(async () => {
    const { AssetPack } = await import('/src/renderer/pack.ts'), { DemoSession } = await import('/src/client/demo.ts'), { BattleRenderer } = await import('/src/renderer/battle.ts'), { DamageNumbers } = await import('/src/renderer/damage-numbers.ts');
    const pack = await AssetPack.open(), session = new DemoSession(); await pack.prepare(session.scene, session.view().actors.flatMap(actor => actor.slots.filter(Boolean)));
    const canvas = document.createElement('canvas'); canvas.id = 'combat-polish-proof'; canvas.width = 1280; canvas.height = 720; document.body.append(canvas);
    const renderer = new BattleRenderer(canvas, pack, session.scene); renderer.selected = 'npc_archer'; renderer.accept(session.advanceTo(3400)); renderer.draw(session.view(), 3400);
    const arrowCanvas = document.createElement('canvas'); arrowCanvas.id = 'combat-polish-arrows-proof'; arrowCanvas.width = 1280; arrowCanvas.height = 720; arrowCanvas.getContext('2d').drawImage(canvas, 0, 0); document.body.append(arrowCanvas);
    const arrows = structuredClone(renderer.frameStats.projectiles); if (!arrows.some(shot => shot.source === 'npc_archer' && shot.target === 'enemy_front' && shot.shape === 'arrow')) throw new Error('Archer arrow does not connect to boss');
    let haveDamage = false, haveOrb = false, samples = 0;
    for (let ms = 3450; ms <= 6500; ms += 25) {
     renderer.accept(session.advanceTo(ms)); renderer.draw(session.view(), ms); samples++;
     if (renderer.frameStats.damage.length) { haveDamage = true; if (renderer.frameStats.damage.some(hit => hit.source !== 'npc_archer' || hit.target !== 'enemy_front')) throw new Error('Unfocused damage displayed'); }
     if (renderer.frameStats.projectiles.some(shot => shot.source === 'npc_mage' && shot.target === 'enemy_front' && shot.shape === 'orb')) haveOrb = true;
    }
    if (!haveDamage || !haveOrb) throw new Error('No focused damage/magic projectile sampled');
    renderer.selected = 'main'; renderer.draw(session.view(), session.state.game_time_ms); if (renderer.frameStats.damage.some(hit => hit.source !== 'main')) throw new Error('Focus switch retained other actor numbers');
    // A visual fixture for native glyph0–9 and critical background, not synthetic combat credit.
    const gallery = document.createElement('canvas'); gallery.width = 900; gallery.height = 240; gallery.id = 'native-numbers-proof'; document.body.append(gallery);
    const ctx = gallery.getContext('2d'); ctx.fillStyle = '#4e6442'; ctx.fillRect(0, 0, 900, 240); ctx.font = '16px ROThai'; ctx.fillStyle = '#fff4d7'; ctx.fillText('RO Classic bitmap digits', 28, 32); ctx.fillText('Native critical background', 500, 32);
    const numbers = new DamageNumbers(pack.numberFont, pack.index.combat_visuals.numbers.digit_frames, pack.criticalFont, pack.index.combat_visuals.numbers.critical_frame);
    numbers.draw(ctx, 1234567890, false, 230, 110, 200); numbers.draw(ctx, 12345, true, 650, 110, 200);
    const font = pack.numberFont.meta.id, critical = pack.criticalFont.meta.id;
    // Actual deterministic critical event, preserving seed and source attribution.
    let hit, criticalSeed;
    for (let seed = 1; seed <= 64 && !hit; seed++) { const full = new DemoSession('boss', seed); full.advanceTo(90000); hit = full.history.find(event => event.type === 'damage' && event.detail === 'critical' && event.actor_id === 'main'); if (hit) criticalSeed = seed; }
    if (!hit) throw new Error('No reproducible main critical in seed1..64');
    const criticalSession = new DemoSession('boss', criticalSeed), criticalRenderer = new BattleRenderer(canvas, pack, criticalSession.scene); criticalRenderer.selected = 'main'; criticalRenderer.accept(criticalSession.advanceTo(hit.at_ms + 180)); criticalRenderer.draw(criticalSession.view(), hit.at_ms + 180);
    if (!criticalRenderer.frameStats.damage.some(event => event.source === 'main' && event.critical)) throw new Error('Real crit not rendered');
    return { arrows, sampled_frames: samples, focused_damage_only: true, magic_orbs: haveOrb, native_font: font, native_critical_background: critical, actual_critical_seed: criticalSeed, actual_critical_ms: hit.at_ms, actual_critical_amount: hit.amount };
   });
   await page.locator('#combat-polish-arrows-proof').screenshot({ path: path.join(root, 'docs/screenshots/combat-polish-arrows.png') });
   await page.locator('#native-numbers-proof').screenshot({ path: path.join(root, 'docs/screenshots/combat-polish-numbers.png') }); await page.locator('#combat-polish-proof').screenshot({ path: path.join(root, 'docs/screenshots/combat-polish-critical.png') });
   await page.evaluate(() => { document.querySelector('#combat-polish-arrows-proof').remove(); document.querySelector('#native-numbers-proof').remove(); document.querySelector('#combat-polish-proof').remove(); });
   return result;
  });
  await check('all_media_in_new_pack_decode_locally', async () => page.evaluate(async () => {
   const { AssetPack } = await import('/src/renderer/pack.ts'), { DemoSession } = await import('/src/client/demo.ts'); const pack = await AssetPack.open(), s = new DemoSession(); await pack.prepare(s.scene, s.view().actors.flatMap(actor => actor.slots.filter(Boolean))); const result = await pack.validateMedia(); pack.dispose(); return { ...result, pack_hash: pack.index.pack_hash, selected_ids: Object.keys(pack.index.assets).length };
  }));
  await check('FPS_forecast_projectile_focus_do_not_change_combat', async () => page.evaluate(async () => {
   const { AssetPack } = await import('/src/renderer/pack.ts'), { DemoSession } = await import('/src/client/demo.ts'), { BattleRenderer } = await import('/src/renderer/battle.ts'), { canonical } = await import('/src/content/value.ts');
   const pack = await AssetPack.open(), canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720; const runs = [];
   for (const encounter of ['boss', 'warded', 'storm']) {
    const expected = new DemoSession(encounter, 2); expected.advanceTo(90000);
    for (const fps of [0, 30, 60]) {
     const s = new DemoSession(encounter, 2); await s.timeline(() => Promise.resolve()); await pack.prepare(s.scene, s.view().actors.flatMap(actor => actor.slots.filter(Boolean))); const renderer = new BattleRenderer(canvas, pack, s.scene); let frames = 0, projectiles = 0, damage = 0;
     const tick = fps ? 1000 / fps : 90000;
     for (let ms = tick; ms <= 90000 + tick && !s.state.terminal_result; ms += tick) { const until = Math.min(90000, Math.floor(ms / 50) * 50); if (until > s.state.game_time_ms) renderer.accept(s.advanceTo(until)); if (fps && !(ms > 8000 && ms < 10000)) { renderer.selected = Math.floor(ms / 4000) % 2 ? 'npc_mage' : 'npc_archer'; renderer.draw(s.view(), s.state.game_time_ms); frames++; projectiles += renderer.frameStats.projectiles.length; damage += renderer.frameStats.damage.length; } }
     if (canonical(s.state) !== canonical(expected.state) || canonical(s.history) !== canonical(expected.history)) throw new Error('Visuals or pacing change determinism:' + encounter + ':' + fps);
     runs.push({ encounter, fps, frames, projectiles, damage, end_ms: s.state.game_time_ms, rng_draws: s.state.rng.draw_count, exact_state_events_metrics: true });
    }
   }
   pack.dispose(); return runs;
  }));
  await check('focus_controls_rotation_projection_mobile_and_keyboard', async () => {
   await page.locator('.party-card').filter({ hasText: 'Archer' }).click(); assert((await page.locator('.skill-panel-heading').innerText()).includes('Archer'), 'Selected actor not visible');
   await page.getByLabel('ช่วงเวลา Timeline').selectOption('40000'); await page.waitForTimeout(80); await page.getByLabel('ช่วงเวลา Timeline').selectOption('20000');
   const rows = [];
   for (const width of [360, 390, 844, 1280]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 900 }); assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Page overflow:' + width);
    const scroller = page.locator('.timeline-viewport'); await scroller.scrollIntoViewIfNeeded(); await scroller.focus(); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(100); const scroll = await scroller.evaluate(node => ({ width: node.clientWidth, total: node.scrollWidth, left: node.scrollLeft }));
    if (width <= 390) assert(scroll.left > 0, 'Mobile timeline cannot scroll'); await scroller.evaluate(node => { node.scrollLeft = 0; }); rows.push({ viewport_width: width, ...scroll });
    if (width === 390) await page.screenshot({ path: path.join(root, 'docs/screenshots/combat-polish-mobile.png'), fullPage: true });
   }
   return { focus_selection: true, zoom: true, samples: rows };
  });
  assert(!errors.length && !external.length, JSON.stringify({ errors, external }));
 } catch (error) { errors.push(String(error)); console.error(String(error)); }
 finally {
  const inputs = ['src/ui/battle-app.tsx', 'src/ui/skill-timeline.tsx', 'src/ui/timeline.css', 'src/client/demo.ts', 'src/renderer/battle.ts', 'src/renderer/actor-animation.ts', 'src/renderer/projectiles.ts', 'src/renderer/damage-numbers.ts', 'src/renderer/combat-visuals.json', 'src/renderer/pack.ts', 'src/contracts/assets.ts', 'src/domain/math/index.ts', 'src/domain/combat/engine.ts', 'src/domain/combat/model.ts', 'src/simulation/index.ts', 'scripts/game/runtime-assets.ts', 'scripts/build_runtime_assets.py', 'plan/data/schemas/battle-checkpoint.json', 'runtime/ro/manifest.json', 'src/generated/runtime-manifest.json', 'scripts/test_combat_polish.cjs'];
  const report = { task_id: 'TASK-020', round: 5, date: '2026-10-20', passed: checks.length === 5 && !errors.length && !external.length, browser: browser.version(), checks, errors, external_requests: external, input_sha256: Object.fromEntries(inputs.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')])), limitations: ['Frame-motion sample on local Chrome headless; no real-device/Safari qualification.', 'Native pixel sprite pose cadence is retained; continuous complete-rig motion and compositor timeline do not invent missing artwork frames.', 'Pacing3s is an explicit reproducible demo encounter profile; release balance tables remain subject to gameplay measurement.', 'Projectile impact is a visual delay only; engine computes hit/damage at its authoritative event timestamp.'] };
  fs.writeFileSync(path.join(root, 'plan/evidence/task-020-combat-polish-browser.json'), JSON.stringify(report, null, 2)); await browser.close(); console.log(JSON.stringify({ passed: report.passed, checks: checks.length, errors })); if (!report.passed) process.exitCode = 1;
 }
})().catch(error => { console.error(error); process.exitCode = 1; });
