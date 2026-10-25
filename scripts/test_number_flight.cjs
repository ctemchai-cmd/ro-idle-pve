// Actual native renderer/bitmap checks; disposable scenes, no Auth or save writes.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const out = path.resolve(__dirname, '../plan/evidence/task-150'), base = process.env.RO_PREVIEW_URL;
assert(base && new URL(base).hostname === '127.0.0.1');
(async () => {
  let browser, page, failure;
  const checks = [], errors = [], writes = [];
  try {
    browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    page = await browser.newPage({ viewport: { width: 320, height: 844 }, isMobile: true, hasTouch: true });
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) writes.push(new URL(r.url()).pathname); });
    await page.goto(base + '/demo');
    await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
    await page.evaluate(async () => {
      const [{ AssetPack }, { SkillPreviewSession }, { BattleRenderer }, { battleRenderView }, { DamageNumbers }, engine] = await Promise.all([
        import('/src/renderer/pack.ts'), import('/src/client/skill-preview.ts'), import('/src/renderer/battle.ts'), import('/src/client/story.ts'), import('/src/renderer/damage-numbers.ts'), import('/src/domain/combat/index.ts')
      ]);
      const pack = await AssetPack.open(), session = new SkillPreviewSession({ job: 'wizard', skill: 'mage_fire_bolt', rank: 10 });
      await pack.prepare(session.scene, session.preparedSkills);
      document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#14251e';
      const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 1440; canvas.style.cssText = 'width:100vw;height:auto;display:block'; document.body.append(canvas);
      const originalDraw = DamageNumbers.prototype.draw, painted = [];
      DamageNumbers.prototype.draw = function (...args) { painted.push({ amount: args[1], critical: args[2], kind: args[6], x: args[3], y: args[4] }); return originalDraw.apply(this, args); };
      function event(sequence, kind = 'damage') {
        return { type: kind === 'heal' ? 'heal' : 'damage', at_ms: 1000, phase: 3, sequence, actor_id: kind === 'incoming' ? 'target_0' : 'caster', target_id: kind === 'incoming' ? 'caster' : kind === 'heal' ? 'ally_1' : 'target_0', amount: 12345, detail: kind === 'critical' ? 'critical' : 'normal', origin: 'periodic' };
      }
      function view(target) {
        const v = structuredClone(battleRenderView(session.initial, session.names)), actor = v.actors.find(a => a.actor_id === target);
        Object.assign(actor.spatial, { x: 360, previous_x: 360, y: 650, previous_y: 650, updated_at: 0 }); return v;
      }
      function renderer() { const r = new BattleRenderer(canvas, pack, session.scene); r.selected = 'caster'; r.showFinishers = false; return r; }
      window.number150 = { pack, session, canvas, BattleRenderer, battleRenderView, engine, renderer, event, view, painted };
    });
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const rows = await page.evaluate(() => {
        const p = window.number150, rows = [], center = b => [b.left + b.width / 2, b.top + b.height / 2];
        for (const kind of ['damage', 'critical', 'heal', 'incoming']) {
          const variants = [];
          for (const sequence of [17, 18]) {
            const e = p.event(sequence, kind), r = p.renderer(), v = p.view(e.target_id), before = JSON.stringify(v), samples = [];
            r.accept([e]);
            for (const age of [0, 120, 300, 600]) {
              r.draw(v, 1000 + age, age); const b = r.frameStats.numberBounds[0]; if (!b) throw Error('MISSING_NUMBER:' + kind);
              samples.push({ age, center: center(b), bounds: b });
              if (b.left < 0 || b.left + b.width > innerWidth) throw Error('NUMBER_CLIPPED');
            }
            for (let i = 1; i < samples.length; i++) if (!(samples[i].center[0] > samples[i - 1].center[0])) throw Error('NOT_RIGHT_ARC:' + kind + JSON.stringify(samples));
            if (!(samples[1].center[1] < samples[0].center[1] && samples[2].center[1] < samples[1].center[1] && samples[3].center[1] > samples[2].center[1] + 10 && samples[3].bounds.height < samples[1].bounds.height)) throw Error('NO_FAST_FALLING_SHRINK_ARC:' + kind);
            if (JSON.stringify(v) !== before) throw Error('VIEW_MUTATION'); variants.push(samples);
          }
          if (JSON.stringify(variants[0]) !== JSON.stringify(variants[1])) throw Error('PARITY_DIRECTION:' + kind);
          // Moving or changing cast phase cannot drag an existing number away from its contact point.
          const e = p.event(22, kind), r = p.renderer(), v = p.view(e.target_id); r.accept([e]); r.draw(v, 1000, 0);
          const target = v.actors.find(a => a.actor_id === e.target_id); target.spatial.x += 180; target.spatial.previous_x += 180; target.phase = 'casting';
          r.draw(v, 1300, 300); const moved = center(r.frameStats.numberBounds[0]);
          if (moved.some((n, i) => Math.abs(n - variants[0][2].center[i]) > .001)) throw Error('TARGET_DRAGS_NUMBER:' + kind);
          const still = p.renderer(); still.motion = false; still.accept([e]); const sv = p.view(e.target_id), frames = [];
          for (const t of [1000, 1300, 1600]) { still.draw(sv, t, t); frames.push(still.frameStats.numberBounds[0]); }
          if (frames.some(b => JSON.stringify(b) !== JSON.stringify(frames[0]))) throw Error('REDUCED_MOTION_MOVES');
          rows.push({ kind, samples: variants[0], same_odd_even: true, moving_target_origin_fixed: true, reduced_motion_static: true });
        }
        const r = p.renderer(), v = p.view('target_0'), hits = [0, 1].map((hit_index) => ({ ...p.event(30 + hit_index), at_ms: 1000 + hit_index * 200, origin: 'skill', skill_id: 'mage_fire_bolt', action_id: 'flight-test', effect_id: 'bolt', hit_index }));
        r.accept(hits); const totals = [];
        for (const t of [1000, 1120, 1300, 1450, 1800, 2300]) {
          if (t === 1300) { const target = v.actors.find(a => a.actor_id === 'target_0'); target.spatial.x += 180; target.spatial.previous_x += 180; }
          r.draw(v, t, t); const b = r.frameStats.numberBounds.find(b => b.kind === 'total'); totals.push({ t, center: center(b), ...r.frameStats.totals[0] });
        }
        for (let i = 1; i < totals.length; i++) if (!(totals[i].center[0] >= totals[i - 1].center[0])) throw Error('TOTAL_RESTARTS_LEFT');
        if (totals[0].amount !== 12345 || totals[2].amount !== 24690 || totals.some(t => t.started_at_ms !== 1000)) throw Error('WRONG_TOTAL');
        const unfocused = p.renderer(); unfocused.selected = 'ally_2'; unfocused.accept(hits); unfocused.draw(v, 1400, 1400);
        if (unfocused.frameStats.numberBounds.length) throw Error('FOCUS_FILTER_LOST');
        if (p.painted.some(n => n.kind !== 'total' && n.amount !== 12345)) throw Error('AMOUNT_CHANGED');
        return { width: innerWidth, rows, totals, focus_preserved: true, actual_native_number_calls: p.painted.length };
      });
      checks.push({ case: 'native_all_number_kinds_and_total_' + width, ...rows });
      // Four native number kinds in one scene, captured at two ages for visual comparison.
      for (const age of [120, 300, 600]) {
        await page.evaluate(age => {
          const p = window.number150, r = p.renderer(), v = p.view('target_0');
          const ids = ['target_0', 'ally_1', 'caster', 'ally_2'];
          for (let i = 0; i < ids.length; i++) { const a = v.actors.find(a => a.actor_id === ids[i]); Object.assign(a.spatial, { x: i % 2 ? 520 : 200, previous_x: i % 2 ? 520 : 200, y: 410 + Math.floor(i / 2) * 350, previous_y: 410 + Math.floor(i / 2) * 350, updated_at: 0 }); }
          r.accept(['damage', 'heal', 'incoming', 'critical'].map((kind, i) => ({ ...p.event(60 + i, kind), target_id: ids[i] })));
          r.draw(v, 1000, 0); r.draw(v, 1000 + age, age);
        }, age);
        await page.screenshot({ path: path.join(out, `numbers-${width}-${age}ms.png`) });
      }
    }
    const parity = await page.evaluate(() => {
      const p = window.number150, runs = [];
      for (const speed of [1, 2, 4]) {
        let state = p.session.initial; const r = p.renderer(), events = [];
        for (let t = 50 * speed; t <= 10000; t += 50 * speed) {
          const next = p.engine.advanceUntil(state, t, p.session.rules); if (!next.ok) throw Error('ENGINE_ERROR'); state = next.value.state; events.push(...next.value.events);
          const before = JSON.stringify(state); r.accept(next.value.events); r.draw(p.battleRenderView(state, p.session.names), t, t / speed); if (JSON.stringify(state) !== before) throw Error('ENGINE_MUTATION');
        }
        runs.push({ speed, state: JSON.stringify(state), events: JSON.stringify(events) });
      }
      if (runs.some(r => r.state !== runs[0].state || r.events !== runs[0].events)) throw Error('SPEED_PARITY');
      return { speeds: [1, 2, 4], identical_engine_events_state_rng: true };
    });
    checks.push({ case: 'shared_engine_speed_parity_renderer_read_only', ...parity });
    const dir = fs.mkdtempSync('/private/tmp/ro150-arc-'); let clip;
    for (let age = 0; age <= 650; age += 50) {
      const bounds = await page.evaluate(age => {
        const p = window.number150;
        if (!age) { const v = p.view('target_0'); v.actors = v.actors.filter(a => a.actor_id === 'target_0'); const r = p.renderer(); r.accept([{ ...p.event(99), amount: 1234 }]); p.arc = { r, v }; }
        p.arc.r.draw(p.arc.v, 1000 + age, age); return p.arc.r.frameStats.numberBounds[0] ?? null;
      }, age);
      if (!clip) clip = { x: Math.max(0, Math.floor(bounds.left + bounds.width / 2 - 85)), y: Math.max(0, Math.floor(bounds.top + bounds.height / 2 - 80)), width: 200, height: 200 };
      await page.screenshot({ path: path.join(dir, String(age).padStart(3, '0') + '.png'), clip });
    }
    require('node:child_process').execFileSync('python3', ['-c', "from PIL import Image;from pathlib import Path;import sys;f=[Image.open(p).convert('RGB').quantize(colors=128) for p in sorted(Path(sys.argv[1]).glob('*.png'))];f[0].save(sys.argv[2],save_all=True,append_images=f[1:],duration=[50]*(len(f)-1)+[200],loop=0)", dir, path.join(out, 'arc-preview.gif')]);
    fs.rmSync(dir, { recursive: true });
    assert(!errors.length && !writes.length); checks.push({ case: 'no_browser_errors_or_HTTP_writes', passed: true });
  } catch (e) { failure = String(e.stack || e); await page?.screenshot({ path: path.join(out, 'native-failed.png') }).catch(() => {}); }
  finally {
    await browser?.close(); const report = { passed: !failure && checks.length === 4, checks, errors, writes, failure };
    fs.writeFileSync(path.join(out, 'native.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ passed: report.passed, groups: checks.length, errors, writes, failure })); if (!report.passed) process.exitCode = 1;
  }
})();
