// TASK-056: use only the fresh ephemeral Auth/DB stack. Never read the personal preview or credentials.
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { randomBytes, randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), prefix = process.env.RO_COMPACT_ARTIFACT_TAG || process.env.RO_EVIDENCE_PREFIX || 'task-056';
const base = process.env.RO_LIVE_URL, gateway = process.env.SUPABASE_URL;
if (!/^task-\d{3}(?:-[a-z0-9-]+)?$/.test(prefix) || process.env.RO_SUPABASE_LOCAL_STACK !== '1' || ![base, gateway].every(u => u && new URL(u).hostname === '127.0.0.1')) throw new Error('ISOLATED_LOOPBACK_REQUIRED');
const checks = [], shots = [], audit = [], errors = [], commands = [];
const check = (ok, reason) => { if (!ok) throw new Error(reason); };
const runTs = (file, input) => JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', path.join(root, file)], { input: JSON.stringify(input), cwd: root, env: process.env }).toString());
(async () => {
  const admin = createClient(gateway, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = 'compact-' + randomUUID() + '@example.invalid', password = randomBytes(24).toString('base64url');
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  check(!created.error && created.data.user, 'USER_CREATE_FAILED');
  const uid = created.data.user.id;
  let browser, page, stage = 'LOGIN';
  const row = async () => { const r = await admin.from('game_saves').select('*').eq('account_id', uid).single(); check(!r.error, 'SAVE_READ_FAILED'); return r.data; };
  const shot = async name => { const file = 'docs/screenshots/' + prefix + '-compact-' + name + '.png'; await page.screenshot({ path: path.join(root, file) }); shots.push(file); };
  const ready = async () => { await page.locator('.hud-save.ok').waitFor({ timeout: 25000 }); };
  const settle = async () => { await page.waitForTimeout(250); await ready(); };
  const visit = async (view, id = 'main') => { await page.goto(base + '/play?v=' + view + '&c=' + id); await ready(); await page.waitForTimeout(400); await page.evaluate(() => document.fonts.ready); };
  const currentId = () => page.evaluate(() => new URLSearchParams(location.search).get('c') || 'main');
  const change = async direction => { await page.getByRole('button', { name: direction === 1 ? 'ตัวละครถัดไป' : 'ตัวละครก่อนหน้า', exact: true }).click(); await page.waitForTimeout(60); };
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    const context = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    page = await context.newPage();
    page.on('pageerror', e => errors.push(String(e.message).slice(0, 180)));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_ABORTED/.test(m.text())) errors.push(m.text().slice(0, 180)); });
    page.on('request', request => { if (request.method() !== 'POST' || !request.url().includes('/api/')) return; try { const data = request.postDataJSON(); if (data?.type) commands.push(data); } catch {} });
    await page.goto(base + '/auth');
    await page.getByLabel('อีเมล', { exact: true }).fill(email); await page.getByLabel('รหัสผ่าน', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click();
    await page.waitForTimeout(700); await page.goto(base + '/play');
    await page.getByRole('radio', { name: /^Mage/ }).click(); await page.getByRole('button', { name: 'เริ่มการเดินทาง', exact: true }).click(); await ready();

    stage = 'FIXTURE';
    await page.goto('about:blank'); await page.waitForTimeout(400);
    const initial = await row(), state = runTs('scripts/game/compact-ui-fixture.ts', initial.state), revision = initial.revision + 1;
    const signed = runTs('scripts/game/sign-test-save.ts', { account_id: uid, revision, state });
    const history = await admin.from('game_save_history').insert({ account_id: uid, revision, state, state_hash: signed.state_hash, signature: signed.signature, key_version: 1 });
    check(!history.error, 'FIXTURE_HISTORY_FAILED');
    const updated = await admin.from('game_saves').update({ revision, state, state_hash: signed.state_hash }).eq('account_id', uid).eq('revision', initial.revision);
    check(!updated.error, 'FIXTURE_SAVE_FAILED');
    const position = id => { const n = state.team.findIndex(p => p.character_id === id); return n < 0 ? state.team.length : n; };
    const order = state.roster.map((a, i) => ({ a, i })).sort((x, y) => position(x.a.character_id) - position(y.a.character_id) || x.i - y.i).map(x => x.a.character_id);

    stage = 'CHARACTER_NAVIGATION';
    for (const view of ['stats', 'skills']) {
      await visit(view, order[0]); const before = await row(), mark = commands.length;
      for (let i = 0; i < order.length; i++) {
        check(await currentId() === order[i], 'NAV_ORDER_' + view + '_' + i);
        check(await page.locator('.character-index').innerText() === (i + 1) + '/' + order.length, 'NAV_INDEX_' + view + '_' + i);
        const selected = state.roster.find(a => a.character_id === order[i]);
        check((await page.locator('.page-title small').innerText()).includes(selected.job_id.charAt(0).toUpperCase() + selected.job_id.slice(1)), 'NAV_JOB_' + selected.job_id);
        await change(1);
      }
      check(await currentId() === order[0], 'NAV_FORWARD_WRAP_' + view);
      await change(-1); check(await currentId() === order.at(-1), 'NAV_BACKWARD_WRAP_' + view);
      await change(1);
      check(commands.slice(mark).length === 0, 'NAV_SENT_COMMAND_' + view);
      check(JSON.stringify((await row()).state.roster) === JSON.stringify(before.state.roster), 'NAV_CHANGED_ROSTER_' + view);
    }
    checks.push('Stats and Skill arrows traverse all seven characters in team-first order, wrap both ways, retain the page, show the correct job/index and send no account command');

    stage = 'STATS_DRAFT_AND_SAVE';
    await visit('stats');
    const untouchedMain = structuredClone((await row()).state.roster.find(a => a.character_id === 'main').primary_stats);
    await page.getByRole('button', { name: /^เพิ่ม INT/ }).click();
    check(await page.locator('.alloc-row output em').count() === 1, 'STATUS_DRAFT_MISSING'); await shot('stats-draft-360');
    await change(1); check(await page.locator('.alloc-row output em').count() === 0, 'STATUS_DRAFT_LEAKED');
    const npcId = await currentId(), npcBefore = (await row()).state.roster.find(a => a.character_id === npcId);
    await page.getByRole('button', { name: /^เพิ่ม INT/ }).click();
    await page.getByRole('button', { name: /^ยืนยัน \(/ }).click(); await settle();
    const statsSaved = (await row()).state;
    check(statsSaved.roster.find(a => a.character_id === npcId).primary_stats.int === npcBefore.primary_stats.int + 1, 'STATUS_SAVED_WRONG_ACTOR');
    check(JSON.stringify(statsSaved.roster.find(a => a.character_id === 'main').primary_stats) === JSON.stringify(untouchedMain), 'UNSAVED_MAIN_CHANGED');
    await change(-1); check(await page.locator('.alloc-row output em').count() === 0, 'STATUS_DRAFT_RESTORED');
    await page.locator('.page-head .back-btn').click(); check(await page.locator('.buddy-page').count() === 1, 'NAV_BACK_TO_BUDDY');
    checks.push('Unconfirmed Status draft is discarded on switching; allocating INT after switching commits only to the selected NPC through real API/SQL; back returns to that character');

    stage = 'SKILL_PICK_AND_SAVE';
    await visit('skills');
    await page.locator('.skill-row').first().click(); await page.getByRole('button', { name: /^ย้ายช่อง|^สวมใส่/ }).click();
    check(await page.locator('.loadout.picking').count() === 1, 'SKILL_PICK_MISSING');
    await change(1); check(await page.locator('.loadout.picking').count() === 0, 'SKILL_PICK_LEAKED');
    const skillActor = await currentId(), beforeSkill = (await row()).state.roster.find(a => a.character_id === skillActor), skillId = beforeSkill.active_slots[0];
    await page.getByRole('button', { name: 'อัปเกรด', exact: true }).click(); await settle();
    check((await row()).state.roster.find(a => a.character_id === skillActor).skill_levels[skillId] === beforeSkill.skill_levels[skillId] + 1, 'SKILL_UPGRADE_WRONG_ACTOR');
    await page.getByRole('button', { name: /^ย้ายช่อง|^สวมใส่/ }).click();
    await page.getByRole('button', { name: 'ช่องสกิล 4', exact: true }).click(); await settle();
    const afterSlots = (await row()).state.roster.find(a => a.character_id === skillActor).active_slots;
    check(afterSlots[3] === skillId && afterSlots[0] === null, 'LOADOUT_WRONG_ACTOR_OR_SLOT');
    checks.push('Skill-picking mode is cleared on switching; skill upgrade and immediate slot placement target the selected NPC and persist in SQL');

    stage = 'TIMELINE';
    await visit('skills');
    await page.locator('.loadout-timeline').click(); await page.locator('dialog.skill-preview .timeline-row').first().waitFor({ timeout: 25000 });
    check(await page.locator('dialog.skill-preview .timeline-row').count() >= 4, 'TIMELINE_PARTY_MISSING');
    await page.waitForTimeout(300); await shot('timeline-360');
    await page.keyboard.press('Escape'); check(await page.locator('dialog.skill-preview').count() === 0, 'TIMELINE_NOT_CLOSED');
    checks.push('Draft Timeline opens in a closable sheet with all four party members; the compact skill page remains usable');

    stage = 'MOBILE_LAYOUT_AUDIT';
    for (const [width, height] of [[360, 640], [390, 844], [1280, 800]]) {
      await page.setViewportSize({ width, height });
      for (const view of ['home', 'buddy', 'stats', 'skills', 'backpack', 'team', 'store', 'dungeon', 'daily', 'tower']) {
        await visit(view);
        const measured = await page.evaluate(() => {
          const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right }; };
          const layer = document.querySelector('.page-layer'), frame = document.querySelector('.game-frame');
          const wrapped = [];
          for (const button of document.querySelectorAll('.btn, .character-nav button, .nav-item, .action-btn')) {
            const b = button.getBoundingClientRect(); if (!b.width || !b.height || getComputedStyle(button).visibility === 'hidden') continue;
            const walk = document.createTreeWalker(button, NodeFilter.SHOW_TEXT); let text;
            while ((text = walk.nextNode())) { if (!text.textContent.trim()) continue; const range = document.createRange(); range.selectNodeContents(text);
              if (new Set([...range.getClientRects()].filter(r => r.width > 1).map(r => Math.round(r.top / 4))).size > 1) wrapped.push(button.innerText.trim().replace(/\s+/g, ' ').slice(0, 60));
            }
          }
          const overflows = [...document.querySelectorAll('.page, .skill-list, .skill-detail, .stat-panel, .alloc, .alloc-foot, .showcase, .roster-strip, .bag-grid, .formation, .shop-grid, .daily-list')].filter(n => n.scrollWidth > n.clientWidth + 2).map(n => ({ selector: n.className, extra: n.scrollWidth - n.clientWidth }));
          const hudConflicts = [...document.querySelectorAll('.hud-chip')].flatMap(chip => [...document.querySelectorAll('.hud-actions button')].filter(button => { const a = chip.getBoundingClientRect(), b = button.getBoundingClientRect(); return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1; }).map(button => button.getAttribute('aria-label')));
          const split = document.querySelector('.skill-split'), timeline = document.querySelector('.loadout-timeline');
          const glyphs = [...document.querySelectorAll('.character-nav button')].map(button => { const svg = button.querySelector('svg'), b = rect(button); if (!svg) return null; const icon = rect(svg), path = svg.querySelector('path').getBBox(); return { dx: icon.x + icon.width / 2 - b.x - b.width / 2, dy: icon.y + icon.height / 2 - b.y - b.height / 2, pathX: path.x + path.width / 2, pathY: path.y + path.height / 2 }; });
          const selectable = [...document.querySelectorAll('.game-root h1, .game-root h2, .game-root p, .game-root button, .game-root summary, .game-root .hud-chip, .game-root .page-title small')].filter(node => getComputedStyle(node).userSelect !== 'none').map(node => node.className || node.tagName);
          const nav = [...document.querySelectorAll('.character-nav button')].map(rect), loadout = document.querySelector('.loadout'), foot = document.querySelector('.alloc-foot');
          return { frame: rect(frame), horizontal: document.documentElement.scrollWidth > innerWidth + 1 || !!layer && layer.scrollWidth > layer.clientWidth + 1, pageScroll: layer ? layer.scrollHeight - layer.clientHeight : 0, layer: layer && rect(layer), nav, split: split && rect(split), timeline: timeline && rect(timeline), loadout: loadout && rect(loadout), foot: foot && rect(foot), wrapped, overflows, hudConflicts, glyphs, selectable, hud: rect(document.querySelector('.hud')), bar: rect(document.querySelector('.bottom-bar')) };
        });
        audit.push({ width, height, view, ...measured });
        check(!measured.horizontal && !measured.overflows.length, 'OVERFLOW_' + width + '_' + view + ':' + JSON.stringify(measured.overflows));
        check(!measured.wrapped.length, 'WRAPPED_BUTTON_' + width + '_' + view + ':' + measured.wrapped.join('/'));
        check(!measured.hudConflicts.length, 'HUD_OVERLAP_' + width + ':' + measured.hudConflicts.join('/'));
        check(!measured.selectable.length, 'GAME_TEXT_SELECTABLE_' + width + ':' + measured.selectable.join('/'));
        check(!/[\p{Extended_Pictographic}\u23e9\u23f1]/u.test(await page.locator('.game-frame').innerText()), 'VISIBLE_EMOJI_' + view);
        if (view === 'home') {
          check(await page.locator('.team-dock, .team-mini').count() === 0, 'HOME_TEAM_SHORTCUTS_REMAIN');
          check(await page.locator('.quest-pill, .quest-pill.guide').count() === 0, 'HOME_GUIDE_REMAINS');
          check(await page.locator('.challenge-btn, .afk-chest').count() === 2 && await page.locator('.nav-item').count() === 6, 'HOME_CONTROLS_MISSING');
        }
        if (view === 'stats' || view === 'skills') {
          check(measured.nav.length === 2 && measured.nav.every(b => b.width >= 40 && b.height >= 40), 'NAV_HIT_AREA');
          check(measured.glyphs.length === 2 && measured.glyphs.every(g => g && Math.abs(g.dx) <= .5 && Math.abs(g.dy) <= .5 && Math.abs(g.pathX - 12) <= .01 && Math.abs(g.pathY - 12) <= .01), 'NAV_GLYPH_NOT_CENTERED');
          check(measured.pageScroll <= 2, 'PRIMARY_PAGE_SCROLL_' + width + '_' + view + ':' + measured.pageScroll);
          if (view === 'stats') { check(measured.foot.bottom <= measured.layer.bottom + 1, 'STATS_FOOT_NOT_VISIBLE'); check(await page.locator('.stat-cells').getByText('CSPD', { exact: true }).count() === 1 && !(await page.locator('.stat-cells').innerText()).includes('Cast Speed'), 'CSPD_LABEL'); }
          if (view === 'skills') {
            check(measured.loadout.bottom < measured.layer.bottom && await page.locator('.loadout-slot').count() === 4, 'SKILLS_LOADOUT_NOT_VISIBLE');
            check(measured.loadout.y >= measured.split.bottom - 1 && measured.loadout.bottom <= measured.timeline.y + 1, 'SKILLS_LOADOUT_NOT_BELOW_LIST');
          }
        }
        if (width !== 1280 || ['home', 'buddy', 'skills', 'stats'].includes(view)) await shot(view + '-' + width + 'x' + height);
      }
    }
    checks.push('360×640 / 390×844 / centered desktop across ten pages: no horizontal overflow or wrapped action labels; normal Stats and Skill need no page scroll; both arrows have 40×40px hit areas; four skill slots remain below the skill panels; SVG arrows centered within 0.5px, CSPD label, game text nonselectable and no home guide');

    stage = 'TEXT_SELECTION';
    await visit('stats');
    const title = page.locator('.page-title h1'); await title.dblclick();
    check(await page.evaluate(() => getSelection().toString()) === '', 'DOUBLE_TAP_SELECTED_GAME_TEXT');
    const box = await title.boundingBox(); await page.mouse.move(box.x + 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2, { steps: 8 }); await page.mouse.up();
    check(await page.evaluate(() => getSelection().toString()) === '', 'DRAG_SELECTED_GAME_TEXT');
    await page.locator('.hud-actions').getByRole('button', { name: 'ตั้งค่า' }).click(); await page.getByRole('button', { name: /รีเซ็ตเซฟ/ }).click();
    const input = page.locator('.reset-form .confirm-input input'); await input.waitFor(); await input.fill('RESET');
    check(await input.evaluate(node => getComputedStyle(node).userSelect) === 'text' && await input.inputValue() === 'RESET', 'EDITABLE_INPUT_BROKEN');
    await page.locator('dialog.sheet[open] .sheet-head button[aria-label="ปิด"]').last().click();
    checks.push('Repeated clicks and dragging do not select game text; read-only text is nonselectable across all ten pages');

    stage = 'SCROLL_REACHABILITY';
    await page.setViewportSize({ width: 360, height: 640 }); await visit('skills');
    const listScroll = await page.locator('.skill-list').evaluate(node => { node.scrollTop = node.scrollHeight; return { top: node.scrollTop, max: node.scrollHeight - node.clientHeight }; });
    check(listScroll.max > 0 && Math.abs(listScroll.top - listScroll.max) <= 1, 'SKILL_LIST_END_INACCESSIBLE');
    await page.locator('.skill-row').last().click(); await page.waitForTimeout(200);
    check(await page.locator('.skill-row').last().getAttribute('aria-pressed') === 'true', 'LAST_SKILL_NOT_SELECTABLE');
    await shot('skills-last-360');
    await visit('stats'); await page.locator('.extra-stats > summary').click();
    await page.locator('.page-layer').evaluate(node => { node.scrollTop = node.scrollHeight; });
    await shot('stats-expanded-360');
    const reachable = await page.locator('.alloc-row').last().evaluate(node => { const box = node.getBoundingClientRect(), layer = document.querySelector('.page-layer').getBoundingClientRect(); return box.bottom <= layer.bottom + 1; });
    check(reachable, 'EXPANDED_STATS_NOT_REACHABLE');
    checks.push('Long skill list scrolls to its last selectable skill; expanded Additional Stats remain scrollable without trapping the allocation rows');

    stage = 'NATIVE_HAIRSTYLES';
    const native = await require('./check_job_hairstyles.cjs')(page, root);
    checks.push('Native hairstyles: ' + native.presets + ' unique job/gender heads; ' + native.frame_samples + ' decoded frame/facing/hat samples on the actual renderer');

    stage = 'BATTLE_TOOLBAR';
    await page.setViewportSize({ width: 360, height: 640 }); await visit('daily');
    await page.locator('.daily-card').first().getByRole('button', { name: 'ท้าบอส', exact: true }).click();
    await page.locator('.field-arena.boss').waitFor({ timeout: 25000 });
    await page.waitForFunction(() => !document.querySelector('.boss-intro'), null, { timeout: 15000 });
    const tools = page.locator('.boss-tools'); await tools.waitFor();
    const toolbar = await tools.evaluate(node => { const box = node.getBoundingClientRect(), card = node.closest('.boss-bar').getBoundingClientRect(); return { inside_boss_card: true, bounds: { x: box.x, y: box.y, width: box.width, height: box.height }, buttons: [...node.querySelectorAll('button')].map(button => { const r = button.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height, icon: !!button.querySelector('.ui-icon') }; }), card: { x: card.x, y: card.y, right: card.right, bottom: card.bottom } }; });
    check(toolbar.buttons.length === 4 && toolbar.buttons.every(b => b.icon && b.x >= toolbar.card.x && b.right <= toolbar.card.right && Math.abs(b.y - toolbar.buttons[0].y) < 1), 'BATTLE_TOOLBAR_LAYOUT');
    await shot('battle-tools-360');
    await tools.getByRole('button', { name: 'สถิติ', exact: true }).click();
    await page.locator('dialog.sheet[open] .combat-statistics').waitFor();
    check(!/[\p{Extended_Pictographic}\u23e9\u23f1]/u.test(await page.locator('dialog.sheet[open]').innerText()), 'STATISTICS_EMOJI');
    await shot('battle-statistics-360');
    await page.locator('dialog.sheet[open] .sheet-head button[aria-label="ปิด"]').click();
    await tools.getByRole('button', { name: 'Timeline', exact: true }).click();
    await page.locator('dialog.sheet[open] .timeline-row').first().waitFor({ timeout: 20000 });
    check(!/[\p{Extended_Pictographic}\u23e9\u23f1]/u.test(await page.locator('dialog.sheet[open]').innerText()), 'TIMELINE_EMOJI');
    await shot('battle-timeline-360');
    await page.locator('dialog.sheet[open] .sheet-head button[aria-label="ปิด"]').click();
    for (const speed of [2, 4, 1]) { await tools.locator('.speed').click(); check((await tools.locator('.speed').getAttribute('aria-label')).includes(speed + ' เท่า'), 'SPEED_CONTROL'); }
    await tools.locator('.danger').click(); await settle();
    check((await row()).state.active_battle === null, 'RETREAT_NOT_SAVED');
    checks.push('Daily battle toolbar is one row inside the boss card with four SVG icons; Statistics, Timeline, 1→2→4→1 speed and real API/SQL retreat all work without emoji');
    fs.writeFileSync(path.join(root, 'plan/evidence/task-056-battle-toolbar.json'), JSON.stringify({ passed: true, toolbar, screenshots: shots.filter(s => s.includes('battle-')), scope: 'Actual isolated Daily battle, no personal save' }, null, 2) + '\n');

    check(!errors.length, 'BROWSER_ERRORS:' + errors.join('/'));
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/runtime-manifest.json')));
    fs.writeFileSync(path.join(root, 'plan/evidence/' + prefix + '-compact-ui.json'), JSON.stringify({ passed: true, checks, audit, screenshots: shots, browser_errors: errors, content_hash: manifest.content_hash, fixture: 'Isolated test-only Lv20 Class2 roster, worn gear, all affordable unlocked skills, funded wallet and Story 3-4; not earned progression', personal_save_accessed: false, credentials_logged: false }, null, 2) + '\n');
    console.log(JSON.stringify({ passed: true, checks, screenshots: shots.length, browser_errors: errors.length }));
  } catch (error) {
    if (page) await shot('failure-' + stage.toLowerCase()).catch(() => {});
    fs.writeFileSync(path.join(root, 'plan/evidence/' + prefix + '-compact-ui.json'), JSON.stringify({ passed: false, stage, error: String(error.message).slice(0, 700), checks, audit, screenshots: shots, browser_errors: errors, personal_save_accessed: false }, null, 2) + '\n');
    console.log(JSON.stringify({ passed: false, stage, error: String(error.message).slice(0, 700) })); process.exitCode = 1;
  } finally { await browser?.close(); await admin.auth.admin.deleteUser(uid).catch(() => {}); }
})();
