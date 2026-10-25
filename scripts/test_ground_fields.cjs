// Native floor effects + real shared-engine statuses. No owner, Auth, or writes.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('/private/tmp/ro-idle-browser-check/node_modules/playwright-core');
const out = path.resolve(__dirname, '../plan/evidence/task-151'), base = process.env.RO_PREVIEW_URL;
assert(base && new URL(base).hostname === '127.0.0.1');
(async () => {
  let browser, page, failure; const checks = [], errors = [], writes = [];
  try {
    browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    page.on('pageerror', e => errors.push(e.message)); page.on('request', r => { if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) writes.push(new URL(r.url()).pathname); });
    await page.goto(base + '/demo'); await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
    const rows = await page.evaluate(async () => {
      const [{ AssetPack }, { SkillPreviewSession }, { BattleRenderer }, engine, { resolveSkill }, { content, unwrap }, { battleRenderView }, { GroundFieldRenderer }] = await Promise.all([
        import('/src/renderer/pack.ts'), import('/src/client/skill-preview.ts'), import('/src/renderer/battle.ts'), import('/src/domain/combat/index.ts'), import('/src/domain/build/resolve-skill.ts'), import('/tests/game/combat-fixtures.ts'), import('/src/client/story.ts'), import('/src/renderer/ground-fields.ts')
      ]);
      const pack = await AssetPack.open(); if (pack.groundFields.size || pack.performanceAura) throw Error('EAGER_GROUND_ASSETS');
      document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#14251e';
      const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 1440; canvas.style.cssText = 'width:100vw;height:auto;display:block'; document.body.append(canvas);
      function jobFor(id, aw) { const cls = content.skills[id].class_id; return aw ? content.jobs.order.find(j => content.jobs.byId[j].stage === 3 && content.jobs.byId[j].ancestors.includes(cls)) || cls : cls; }
      async function fixture(id, aw = false, song = false) {
        const s = new SkillPreviewSession({ job: jobFor(id, aw), skill: id, rank: 10 }); await pack.prepare(s.scene, s.preparedSkills);
        for (let seed = 1; seed <= 20; seed++) {
          const raw = engine.serializeBattle(s.initial); raw.rng.state = seed; raw.rng.draw_count = 0;
          if (aw) raw.actors.find(a => a.actor_id === 'caster').resolved_skills[id] = structuredClone(resolveSkill(id, 10, content, true));
          const initial = unwrap(engine.restoreBattle(raw, content)), all = unwrap(engine.advanceUntil(initial, 7000, content));
          const start = all.events.find(e => e.type === 'status_applied' && e.skill_id === id && (song || pack.groundFields.get(id).config.status_ids.includes(e.status_change?.status_id)));
          if (!start) continue; const time = start.at_ms + 350, n = unwrap(engine.advanceUntil(initial, time, content));
          return { id, s, initial, time, n, view: battleRenderView(n.state, s.names) };
        }
        throw Error('NO_REAL_FIELD_STATUS:' + id);
      }
      function renderer(f) { const r = new BattleRenderer(canvas, pack, f.s.scene); r.selected = 'caster'; r.showFinishers = false; r.accept(f.n.events); return r; }
      const ids = Object.keys(content.skills).filter(id => content.skills[id].class_id !== 'enemy' && pack.index.combat_visuals.ground_fields[content.skills[id].presentation_id]), rows = [];
      for (const id of ids) for (const awakened of [false, true]) {
        const f = await fixture(id, awakened), r = renderer(f), before = JSON.stringify(f.n.state); r.draw(f.view, f.time, f.time);
        const fields = r.frameStats.ground_fields; if (fields.length !== 1 || fields[0].native_draws < 1 || fields[0].source !== 'caster') throw Error('NO_SINGLE_NATIVE_FIELD:' + id + JSON.stringify(fields));
        if (r.frameStats.impacts.length) throw Error('DUPLICATE_FIELD_BURST:' + id);
        const original = fields[0], moved = structuredClone(f.view);
        const native = pack.groundFields.get(id);
        if (native.config.floor_black_key) {
          const image = native.floorImage, pixels = image.getContext('2d').getImageData(0, 0, image.width, image.height).data;
          for (const [x, y] of [[0, 0], [image.width - 1, 0], [0, image.height - 1], [image.width - 1, image.height - 1]]) if (pixels[(y * image.width + x) * 4 + 3] !== 0) throw Error('OPAQUE_BLACK_GROUND_CORNER');
          if (pixels[(Math.floor(image.height / 2) * image.width + Math.floor(image.width / 2)) * 4 + 3] < 250) throw Error('MUD_BODY_ERASED');
        }
        for (const actor of moved.actors.filter(a => original.targets.includes(a.actor_id))) { actor.spatial.x += 70; actor.spatial.previous_x += 70; }
        r.draw(moved, f.time, f.time); if (JSON.stringify(r.frameStats.ground_fields[0].origin) !== JSON.stringify(original.origin)) throw Error('GROUND_DRAGGED_BY_TARGET:' + id);
        for (const actor of moved.actors) for (const group of actor.statuses ?? []) if (group.icon_skill_id === id) for (const status of group.instances) if (pack.groundFields.get(id).config.status_ids.includes(status.status_id)) status.applied_at = f.time + 100;
        moved.game_time_ms = f.time + 150; r.draw(moved, moved.game_time_ms, moved.game_time_ms);
        if (!(r.frameStats.ground_fields[0].origin[0] > original.origin[0] + 60)) throw Error('RECAST_NOT_REPOSITIONED:' + id);
        // Compare the native floor layer itself; asynchronously appearing HUD/status icons
        // elsewhere on BattleRenderer's canvas are independent of reduced-motion fields.
        const layer = document.createElement('canvas'); layer.width = 720; layer.height = 1440;
        const ctx = layer.getContext('2d'), still = new GroundFieldRenderer();
        still.draw(ctx, f.view.actors, f.view.game_time_ms, f.time, false, pack.groundFields, a => r.point(a)); const pixels = layer.toDataURL();
        ctx.clearRect(0, 0, 720, 1440); const staticFields = still.draw(ctx, f.view.actors, f.view.game_time_ms, f.time + 200, false, pack.groundFields, a => r.point(a));
        if (layer.toDataURL() !== pixels || !staticFields[0]?.native_draws) throw Error('REDUCED_MOTION_NOT_STATIC_NATIVE:' + id);
        const expired = structuredClone(f.view); expired.game_time_ms = original.expires_at; r.draw(expired, expired.game_time_ms, expired.game_time_ms);
        if (r.frameStats.ground_fields.length) throw Error('GROUND_OUTLIVES_STATUS:' + id);
        if (JSON.stringify(f.n.state) !== before) throw Error('ENGINE_MUTATION');
        rows.push({ id, awakened, native_meta: original.meta, native_draws: original.native_draws, targets: original.targets, only_one_field: true, target_does_not_drag_ground: true, recast_repositions: true, static_native_reduced_motion: true, exact_expiry: true });
      }
      window.ground151 = { pack, canvas, fixture, renderer, BattleRenderer, engine, content, unwrap, battleRenderView, GroundFieldRenderer };
      return rows;
    });
    assert.equal(rows.length, 20); checks.push({ case: '20_actual_base_Awaken_native_fields_lifetime_position_recast_reduced_motion', rows });
    const songs = await page.evaluate(async () => {
      const p = window.ground151, captures = [], original = CanvasRenderingContext2D.prototype.drawImage; let wanted;
      CanvasRenderingContext2D.prototype.drawImage = function (...args) { original.apply(this, args); if (this.canvas === p.canvas && args[0] === wanted) captures.push({ filter: this.filter, width: args[3] }); };
      const rows = [];
      for (const id of Object.keys(p.pack.index.combat_visuals.performance_auras.skills)) {
        const f = await p.fixture(id, false, true), aura = p.pack.performanceAura, style = aura.config.styles[aura.config.skills[id]];
        wanted = aura.notes.get(style.note_meta).image; captures.length = 0; const r = p.renderer(f); r.draw(f.view, f.time, f.time);
        if (captures.length !== 3 || captures.some(c => c.filter !== 'none') || r.frameStats.performance_auras.length !== 1) throw Error('NOT_NATIVE_SONG_TEXTURE:' + id);
        rows.push({ id, native_symbol: style.note_meta, actual_draws: captures.length, original_colors: true });
      }
      return rows;
    }); checks.push({ case: 'eight_actual_song_native_textures_original_colors', rows: songs });
    const bursts = await page.evaluate(async () => {
      const p = window.ground151, { SkillPreviewSession } = await import('/src/client/skill-preview.ts'), rows = [];
      for (const id of ['swordsman_magnum_break', 'crusader_grand_cross', 'wizard_heavens_drive', 'wizard_meteor', 'blacksmith_hammer_fall', 'hunter_claymore']) {
        const s = new SkillPreviewSession({ job: p.content.skills[id].class_id, skill: id, rank: 10 }); await p.pack.prepare(s.scene, s.preparedSkills);
        const all = p.unwrap(p.engine.advanceUntil(s.initial, 8000, p.content)), resolve = all.events.find(e => e.type === 'cast_resolve' && e.skill_id === id);
        if (!resolve) throw Error('NO_NATIVE_BURST_CAST:' + id);
        const scheduled = new p.BattleRenderer(p.canvas, p.pack, s.scene); scheduled.showFinishers = false; scheduled.accept(all.events);
        const visualAt = Math.min(...scheduled.impacts.map(cue => cue.at)), profile = p.pack.impacts.get(id);
        const { nativeImpactDuration } = await import('/src/renderer/native-impact.ts');
        const time = visualAt + Math.min(350, nativeImpactDuration(profile.config, profile.asset) * .4);
        if (!Number.isFinite(time)) throw Error('NATIVE_BURST_NOT_QUEUED:' + id);
        const n = p.unwrap(p.engine.advanceUntil(s.initial, Math.ceil(time), p.content)), r = new p.BattleRenderer(p.canvas, p.pack, s.scene); r.showFinishers = false; r.accept(n.events); r.draw(p.battleRenderView(n.state, s.names), time, time);
        if (!r.frameStats.impacts.length || !p.pack.impacts.get(id).config.native_only || r.frameStats.ground_fields.length) throw Error('NOT_NATIVE_INSTANT_GROUND:' + id + JSON.stringify({time,resolve:resolve.at_ms,impacts:r.frameStats.impacts,fields:r.frameStats.ground_fields,profile:p.pack.impacts.get(id).config,native:p.pack.impacts.get(id).asset.meta.effect && {fps:p.pack.impacts.get(id).asset.meta.effect.fps,max_key:p.pack.impacts.get(id).asset.meta.effect.max_key}}));
        rows.push({ id, meta: p.pack.impacts.get(id).config.meta, native_impacts: r.frameStats.impacts.length, resolve_at: resolve.at_ms, visual_at: visualAt, no_invented_persistent_field: true });
        if (id === 'wizard_meteor') p.meteor = { s, n, time };
      }
      return rows;
    }); checks.push({ case: 'six_instant_ground_skills_keep_instant_native_bursts', rows: bursts });
    const captureIds = ['priest_sanctuary', 'wizard_storm_gust', 'wizard_quagmire', 'assassin_venom_dust', 'alchemist_demonstration', 'paladin_gospel', 'hunter_ankle_snare', 'professor_soul_change', 'gypsy_moonlit_water_mill', 'bard_healing_song', 'dancer_battle_song'];
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const id of captureIds) {
        await page.evaluate(async id => { const p = window.ground151, f = await p.fixture(id, false, id.startsWith('bard_') || id.startsWith('dancer_')); p.renderer(f).draw(f.view, f.time, f.time); }, id);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: path.join(out, `ground-${id}-${width}.png`) });
      }
    }
    await page.evaluate(() => { const p = window.ground151, f = p.meteor, r = new p.BattleRenderer(p.canvas, p.pack, f.s.scene); r.showFinishers = false; r.accept(f.n.events); r.draw(p.battleRenderView(f.n.state, f.s.names), f.time, f.time); });
    await page.screenshot({ path: path.join(out, 'native-meteor-390.png') });
    checks.push({ case: 'native_mobile320390_ground_gallery', screenshots: captureIds.length * 2 + 1 });
    const parity = await page.evaluate(async () => {
      const p = window.ground151, f = await p.fixture('wizard_storm_gust'), runs = [];
      for (const speed of [1, 2, 4]) {
        let state = f.initial; const events = [], r = p.renderer(f);
        for (let t = 50 * speed; t <= 10000; t += 50 * speed) { const n = p.unwrap(p.engine.advanceUntil(state, t, p.content)); state = n.state; events.push(...n.events); const before = JSON.stringify(state); r.accept(n.events); r.draw(p.battleRenderView(state, f.s.names), t, t / speed); if (JSON.stringify(state) !== before) throw Error('ENGINE_MUTATION'); }
        runs.push({ state: JSON.stringify(state), events: JSON.stringify(events) });
      }
      if (runs.some(r => r.state !== runs[0].state || r.events !== runs[0].events)) throw Error('SPEED_PARITY'); return { speeds: [1, 2, 4], identical_events_state_rng: true };
    }); checks.push({ case: 'real_engine1x2x4_parity', ...parity });
    const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const cost = await page.evaluate(async () => {
      const p = window.ground151, fixtures = await Promise.all(['wizard_storm_gust', 'wizard_quagmire', 'alchemist_demonstration', 'professor_soul_change'].map(id => p.fixture(id))), renderers = fixtures.map(() => new p.GroundFieldRenderer()), ctx = p.canvas.getContext('2d'), costs = []; let frame = 0;
      await new Promise(resolve => { function draw() { const before = performance.now(); ctx.clearRect(0, 0, 720, 1440); fixtures.forEach((f, i) => renderers[i].draw(ctx, f.view.actors, f.view.game_time_ms, f.time + frame * 16, true, p.pack.groundFields, a => [a.spatial.x, a.spatial.y])); if (frame >= 20) costs.push(performance.now() - before); if (++frame < 110) requestAnimationFrame(draw); else resolve(); } requestAnimationFrame(draw); });
      costs.sort((a, b) => a - b); return { fields: 4, frames: 90, cpu4x: true, p50_ms: costs[45], p95_ms: costs[85], scope: 'Bounded field renderer only, not physical-phone/full-UI FPS certification.' };
    }); assert(cost.p95_ms < 25, JSON.stringify(cost)); checks.push({ case: 'four_simultaneous_fields_bounded_cost', ...cost });
    assert(!errors.length && !writes.length); checks.push({ case: 'no_browser_errors_or_HTTP_writes', passed: true });
  } catch (e) { failure = String(e.stack || e); await page?.screenshot({ path: path.join(out, 'native-failed.png') }).catch(() => {}); }
  finally { await browser?.close(); const report = { passed: !failure && checks.length === 7, checks, errors, writes, failure }; fs.writeFileSync(path.join(out, 'native.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, groups: checks.length, errors, writes, failure })); if (!report.passed) process.exitCode = 1; }
})();
