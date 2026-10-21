// Local TASK-020 QA. Browser dependencies stay outside the source asset library.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_PREVIEW_URL || 'http://127.0.0.1:5174';
const checks = [], errors = [], external = [], responses = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
async function check(id, acceptance, fn) { try { const result = await fn(); checks.push({ case_id: id, acceptance, passed: true, result }); console.log(JSON.stringify({ check: id, passed: true })); } catch (error) { checks.push({ case_id: id, acceptance, passed: false, error: String(error) }); throw error; } }
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  let page;
  try {
    page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { responses.push(response.url()); if (response.status() >= 400) errors.push(`HTTP${response.status()}:${response.url()}`); });
    await page.route('**/*', route => { const url = route.request().url(); if (url.startsWith(base + '/') || url.startsWith('data:')) route.continue(); else { external.push(url); route.abort(); } });
    await page.goto(base);
    await page.waitForFunction(() => document.querySelectorAll('.party-card').length === 4 && !document.querySelector('.loading'), { timeout: 60000 });
    await check('actual_UI_parallel_cast_and_controls', ['AC-02'], async () => {
      await page.waitForFunction(() => document.querySelectorAll('.casting-text').length >= 2, { timeout: 15000 });
      await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
      const before = await page.locator('.battle-clock').innerText(); await page.waitForTimeout(250); assert(await page.locator('.battle-clock').innerText() === before, 'Pause changed credited game time');
      await page.getByRole('button', { name: /เปิดเสียง/ }).click(); await page.waitForFunction(() => document.querySelector('.sound-button').getAttribute('aria-pressed') === 'true');
      await page.getByRole('button', { name: /เสียงเปิด/ }).click();
      await page.screenshot({ path: path.join(root, 'docs/screenshots/battle-demo.png'), fullPage: true });
      const names = await page.locator('.skill-slot strong').allTextContents(); await page.locator('.skill-slot').nth(0).click(); await page.locator('.skill-slot').nth(1).click();
      await page.waitForFunction(() => !document.querySelector('.loading')); assert(await page.locator('.skill-slot strong').first().textContent() === names[1], 'Reorder did not swap slots');
      return { parallel_casts: true, pause: true, user_audio_toggle: true, reorder: true };
    });
    await check('boss_interrupt_flag', ['AC-02'], async () => {
      await page.getByRole('button', { name: /บอสเกราะเวท/ }).click(); await page.waitForFunction(() => !document.querySelector('.loading'));
      await page.getByLabel('ความเร็วต่อสู้').selectOption('2');
      await page.locator('.enemy-status').filter({ hasText: 'ขัดร่ายไม่ได้' }).first().waitFor({ timeout: 15000 });
      await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
      await page.screenshot({ path: path.join(root, 'docs/screenshots/battle-demo-warded.png'), fullPage: true });
      return { warded_telegraph_visible: true };
    });
    await check('native_actor_poses_and_complete_flip', ['AC-01'], async () => page.evaluate(async () => {
      const { AssetPack } = await import('/src/renderer/pack.ts'); const { drawActor } = await import('/src/renderer/native.mjs');
      const pack = await AssetPack.open(), canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512; const context = canvas.getContext('2d'); context.imageSmoothingEnabled = false;
      let samples = 0, mirrorComparisons = 0, worstDifference = 0;
      const used = [];
      for (const job of pack.index.actor_jobs) for (const preset of job.presets) {
        const parts = { body: await pack.asset(preset.body.meta), head: preset.head ? await pack.asset(preset.head.meta) : undefined, weapon: preset.weapon ? await pack.asset(preset.weapon.meta) : undefined, attackIndex: preset.attack_source_action_index };
        if (!parts.body.meta.animation.actions.some(action => action.source_action_index === parts.attackIndex)) throw new Error('Body attack mapping missing:' + preset.preset_id);
        if (parts.weapon && !parts.weapon.meta.animation.actions.some(action => action.source_action_index === parts.attackIndex)) throw new Error('Weapon attack mapping missing:' + preset.preset_id);
        for (const state of ['idle', 'attack', 'standby', 'hurt', 'dead']) {
          const pixels = [];
          for (const facing of ['right', 'left']) {
            context.clearRect(0, 0, 512, 512); const layers = drawActor(context, parts, state, 350, 256, 320, facing, 2); if (!layers) throw new Error('No layers:' + preset.preset_id + state); samples++;
            pixels.push(context.getImageData(0, 0, 512, 512).data);
          }
          let different = 0, occupied = 0;
          for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { const i = (y * 512 + x) * 4, j = (y * 512 + 511 - x) * 4; if (pixels[0][i + 3] || pixels[1][j + 3]) occupied++; if ([0, 1, 2, 3].some(c => Math.abs(pixels[0][i + c] - pixels[1][j + c]) > 2)) different++; }
          const fraction = different / Math.max(1, occupied); worstDifference = Math.max(worstDifference, fraction); mirrorComparisons++;
          if (fraction > .005) throw new Error('Complete actor mirror mismatch:' + preset.preset_id + ':' + state + ':' + fraction);
        }
        used.push({ job: job.job_id, preset: preset.preset_id, attack_index: parts.attackIndex });
      }
      return { presets: used.length, samples, mirror_comparisons: mirrorComparisons, worst_pixel_difference_fraction: worstDifference, used, scope: 'Automated pose350ms plus exact complete-actor mirror; not exhaustive animation/cosmetic manual review. Casting uses standby plus ring/bar.' };
    }));
    await check('render_30_60_off_and_pause_matches_headless', ['AC-03'], async () => page.evaluate(async () => {
      const { DemoSession } = await import('/src/client/demo.ts'); const { AssetPack } = await import('/src/renderer/pack.ts'); const { BattleRenderer } = await import('/src/renderer/battle.ts'); const { canonical } = await import('/src/content/value.ts');
      const comparisons = [], pack = await AssetPack.open(), canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720;
      for (const id of ['boss', 'warded', 'storm']) {
        const expected = new DemoSession(id, 2); expected.advanceTo(90000); const expectedState = canonical(expected.state), expectedEvents = canonical(expected.history);
        for (const fps of [30, 60, 0]) {
          const session = new DemoSession(id, 2); await pack.prepare(session.scene, session.view().actors.flatMap(actor => actor.slots.filter(Boolean))); const renderer = new BattleRenderer(canvas, pack, session.scene);
          const tick = fps ? 1000 / fps : 90000; let frames = 0;
          for (let time = tick; time <= 90000 + tick && !session.state.terminal_result; time += tick) {
            const target = Math.min(90000, Math.floor(time / 50) * 50); if (target > session.state.game_time_ms) renderer.accept(session.advanceTo(target));
            // Simulate a draw-only pause between8–10s, without pausing combat.
            if (fps && !(time >= 8000 && time < 10000)) { renderer.draw(session.view(), session.state.game_time_ms); frames++; }
          }
          if (canonical(session.state) !== expectedState || canonical(session.history) !== expectedEvents) throw new Error('Render affected combat:' + id + ':' + fps);
          comparisons.push({ encounter: id, seed: 2, render_fps: fps, frames, end_ms: session.state.game_time_ms, rng_draws: session.state.rng.draw_count, exact_checkpoint_events_metrics: true });
        }
      }
      return comparisons;
    }));
    await check('native_StormGust_and_all_selected_media_decode', ['AC-04'], async () => {
      const result = await page.evaluate(async () => {
        const { AssetPack } = await import('/src/renderer/pack.ts'); const { DemoSession } = await import('/src/client/demo.ts'); const { BattleRenderer } = await import('/src/renderer/battle.ts');
        const pack = await AssetPack.open(), session = new DemoSession('storm', 2); await pack.prepare(session.scene, session.view().actors.flatMap(actor => actor.slots.filter(Boolean)));
        const full = new DemoSession('storm', 2); full.advanceTo(90000); const gust = full.history.find(event => event.type === 'cast_resolve' && event.skill_id === 'wizard_storm_gust'); if (!gust) throw new Error('StormGust never cast');
        const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720; canvas.id = 'native-gust-proof'; canvas.style.cssText = 'position:fixed;inset:0;width:1280px;height:720px;z-index:9999'; document.body.append(canvas);
        const renderer = new BattleRenderer(canvas, pack, session.scene); renderer.accept(session.advanceTo(gust.at_ms + 350)); renderer.draw(session.view(), gust.at_ms + 350);
        const result = await pack.validateMedia(); return { ...result, native_storm_gust: !!pack.visuals.get('wizard_storm_gust').native, at_ms: gust.at_ms + 350, pack_hash: pack.index.pack_hash, original_source_requests: performance.getEntriesByType('resource').filter(entry => entry.name.includes('/assets/ro/')).map(entry => entry.name) };
      });
      await page.locator('#native-gust-proof').screenshot({ path: path.join(root, 'docs/screenshots/battle-demo-storm.png') }); await page.evaluate(() => document.querySelector('#native-gust-proof').remove());
      assert(result.font && result.native_storm_gust && result.original_source_requests.length === 0, 'Media/native/font/source validation failed'); return result;
    });
    await check('responsive_UI_and_keyboard', ['AC-01', 'AC-02'], async () => {
      const samples = [];
      for (const width of [360, 390, 844, 1280]) {
        await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth); assert(!overflow, 'Horizontal page overflow:' + width); samples.push({ width, overflow });
        if (width === 390) await page.screenshot({ path: path.join(root, 'docs/screenshots/battle-demo-mobile.png'), fullPage: true });
      }
      await page.keyboard.press('Tab'); assert(await page.evaluate(() => document.activeElement !== document.body), 'No keyboard focus'); return samples;
    });
    assert(!errors.length && !external.length, JSON.stringify({ errors, external }));
  } catch (error) { errors.push(String(error)); console.error(String(error)); }
  finally {
    const inputs = ['src/client/demo.ts', 'src/contracts/presentation.ts', 'src/renderer/pack.ts', 'src/renderer/battle.ts', 'src/renderer/native.mjs', 'src/ui/main.tsx', 'src/ui/style.css', 'scripts/test_battle_browser.cjs', 'runtime/ro/manifest.json', 'src/generated/runtime-manifest.json'];
    const report = { task_id: 'TASK-020', browser: browser.version(), passed: checks.length === 6 && checks.every(row => row.passed) && errors.length === 0 && external.length === 0, checks, errors, external_requests: external, runtime_requests: responses.filter(url => url.includes('/ro/')).length, input_sha256: Object.fromEntries(inputs.map(file => [file, sha(file)])), limitations: ['Chrome headless local Vite; Safari/real mobile hardware/performance budgets remain TASK-042.', 'Pose/flip/decode checks are automated; screenshots have separate scoped visual review.', 'Disposable sandbox, no account/progression/save/reward/deployment verification.'] };
    fs.writeFileSync(path.join(root, 'plan/evidence/task-020-browser.json'), JSON.stringify(report, null, 2)); await browser.close(); console.log(JSON.stringify({ passed: report.passed, checks: checks.length, errors, external })); if (!report.passed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
