// Real isolated Auth/PostgREST/Postgres/mobile Chrome, never a player account.
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process'), { randomUUID, randomBytes } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js'), { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_LIVE_URL, gateway = process.env.SUPABASE_URL;
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1' || ![base, gateway].every(u => u && new URL(u).hostname === '127.0.0.1')) throw new Error('ISOLATED_STACK_REQUIRED');
const check = (ok, message) => { if (!ok) throw new Error(message); };
const runTs = (file, input) => JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', path.join(root, file)], { input: JSON.stringify(input), env: process.env, cwd: root }).toString());
(async () => {
  const admin = createClient(gateway, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = 'elements-' + randomUUID() + '@example.invalid', password = randomBytes(24).toString('base64url');
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true }); check(!created.error && created.data.user, 'CREATE_USER'); const uid = created.data.user.id;
  let browser, page, error = null, stage = 'LOGIN'; const checks = [], errors = [], commands = [], measurements = {};
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); page = await ctx.newPage(); page.setDefaultTimeout(20000);
    page.on('pageerror', e => errors.push(e.message)); page.on('request', r => { if (r.method() === 'POST' && new URL(r.url()).pathname === '/api/commands') commands.push(r.postDataJSON().type); });
    const ready = () => page.locator('.hud-save.ok').waitFor({ timeout: 25000 });
    const shot = name => page.screenshot({ path: path.join(root, 'plan/evidence/task-076-' + name + '.png') });
    const fit = async selector => check(await page.locator(selector).evaluate(n => {
      const r = n.getBoundingClientRect(); return n.scrollWidth <= n.clientWidth && r.left >= 0 && r.right <= innerWidth;
    }), 'OVERFLOW_' + selector);
    await page.goto(base + '/auth'); await page.getByLabel('อีเมล', { exact: true }).fill(email); await page.getByLabel('รหัสผ่าน', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click(); await page.getByRole('heading', { name: 'เข้าสู่บัญชี', exact: true }).waitFor({ state: 'hidden' });
    await page.goto(base + '/play'); await page.getByRole('radio', { name: /^Mage/ }).click(); await page.getByRole('button', { name: 'เริ่มการเดินทาง', exact: true }).click(); await ready(); await page.goto('about:blank');
    const saved = await admin.from('game_saves').select('*').eq('account_id', uid).single(); check(!saved.error, 'READ_FIXTURE');
    const state = runTs('scripts/game/element-ui-fixture.ts', saved.data.state), revision = saved.data.revision + 1, signed = runTs('scripts/game/sign-test-save.ts', { account_id: uid, revision, state });
    check(!(await admin.from('game_save_history').insert({ account_id: uid, revision, state, state_hash: signed.state_hash, signature: signed.signature, key_version: 1 })).error, 'HISTORY_FIXTURE');
    check(!(await admin.from('game_saves').update({ revision, state, state_hash: signed.state_hash }).eq('account_id', uid)).error, 'SAVE_FIXTURE');
    stage = 'SKILLS'; const beforeInspect = commands.length; measurements.skills = [];
    for (const [id, name, elements] of [
      ['main', 'Fire Bolt', ['fire']], ['main', 'Cold Bolt', ['water']], ['main', 'Auto Bolt', ['fire']],
      ['npc_mage', 'Storm Gust', ['water']], ['npc_thief', 'Envenom', ['weapon', 'poison']],
      ['npc_thief', 'Detonate', ['poison']], ['npc_merchant', 'Hell Plant', ['poison']],
      ['npc_archer', 'Falcon', ['neutral']], ['npc_acolyte', 'Heal', []],
    ]) {
      await page.goto(base + `/play?v=skills&c=${id}`); await ready();
      await page.locator('.skill-row').filter({ has: page.getByText(name, { exact: true }) }).click();
      const actual = await page.locator('.skill-detail .skill-elements [data-element]').evaluateAll(nodes => nodes.map(n => n.dataset.element));
      check(JSON.stringify(actual) === JSON.stringify(elements), 'SKILL_ELEMENT_' + name + ':' + actual);
      if (name === 'Envenom') {
        const detail = await page.locator('.effect-block').first().innerText(); check(detail.includes('ตามธาตุอาวุธ') && detail.includes('ดาเมจธาตุพิษ'), 'MIXED_DETAILS');
        for (const width of [390, 320]) { await page.setViewportSize({ width, height: 844 }); await fit('.skill-detail'); await shot('envenom-' + width); }
        await page.setViewportSize({ width: 390, height: 844 });
      }
      if (!elements.length) check((await page.locator('.skill-detail .skill-elements').innerText()).includes('ไม่มีธาตุโจมตี'), 'HEAL_FALSE_ELEMENT');
      measurements.skills.push({ name, elements: actual });
    }
    check(commands.length === beforeInspect, 'SKILL_INSPECTION_WRITE'); checks.push('Real skill detail shows fixed/weapon/mixed/DoT/passive/summon/handler elements, no Holy Heal; 320/390px fit and no inspection save');
    stage = 'BATTLE'; measurements.battles = [];
    for (const mode of ['daily', 'story', 'tower']) {
      await page.goto(base + '/play' + (mode === 'story' ? '' : '?v=' + mode)); await ready();
      await page.evaluate(async () => {
        const { SavedBattleSession } = await import('/src/client/story.ts'), original = SavedBattleSession.prototype.view;
        window.__battleElements = null;
        SavedBattleSession.prototype.view = function () { window.__battleElements = this.state.actors.map(a => ({ id: a.actor_id, team: a.team, tags: a.tags, sources: a.stat_blueprint.permanent_sources.map(s => s.defense_element).filter(Boolean) })); return original.call(this); };
      });
      if (mode === 'daily') await page.locator('.daily-card').filter({ hasText: 'โรงหลอม' }).getByRole('button', { name: 'ท้าบอส', exact: true }).click();
      else if (mode === 'tower') await page.locator('.tower-go').click();
      else await page.getByRole('button', { name: 'ท้าบอสด่าน 4-1', exact: true }).click();
      await page.locator('.field-arena.boss .boss-name .armor-element').waitFor(); await page.locator('.boss-intro').waitFor({ state: 'hidden' }); await ready();
      const expected = await page.evaluate(() => { const a = window.__battleElements.find(a => a.team === 'enemy'); return a.sources.at(-1) || a.tags.find(t => t.startsWith('element:'))?.slice(8) || 'neutral'; });
      check(await page.locator('.boss-name .armor-element').getAttribute('data-element') === expected, 'BOSS_ELEMENT_' + mode);
      check(await page.locator('.focus-elements .armor-element').getAttribute('data-element') === 'holy', 'CARD_ARMOR_NOT_SHOWN');
      if (mode === 'daily') {
        await page.locator('.focus-elements .weapon-element [data-element="fire"]').waitFor({ timeout: 12000 });
        check(await page.locator('.focus-elements .armor-element').getAttribute('data-element') === 'holy', 'ENDOW_CHANGED_ARMOR');
        for (const width of [390, 320]) { await page.setViewportSize({ width, height: 844 }); await fit('.boss-bar'); await fit('.boss-name'); await fit('.focus-elements'); await shot('battle-' + width); }
        await page.locator('.party-card').nth(1).click(); check(await page.locator('.focus-elements .armor-element').getAttribute('data-element') === 'neutral', 'FOCUS_ARMOR_STALE');
        await page.locator('.party-card').first().click(); check(await page.locator('.focus-elements .armor-element').getAttribute('data-element') === 'holy', 'FOCUS_CARD_STALE');
        checks.push('Actual live Fire Endow turns weapon Fire while Angeling armor stays Holy; changing focused character updates armor');
      }
      measurements.battles.push({ mode, armor: expected });
      await page.getByRole('button', { name: 'ถอยทัพ', exact: true }).click(); await ready(); await page.locator('.field-arena.boss').waitFor({ state: 'hidden' });
    }
    checks.push('Actual Story/Tower/Daily boss armor labels match checkpoint source/tag values, fit320/390px, and no battle.advance/render-driven saves');
    check(!commands.includes('battle.advance') && !errors.length, 'RUNTIME_ERROR_OR_ADVANCE_WRITE');
  } catch (e) { error = stage + ':' + (e.stack || String(e)); if (page) await shotFailure(page); }
  finally {
    if (browser) await browser.close(); await admin.auth.admin.deleteUser(uid);
    const report = { task_id: 'TASK-076', passed: !error && !errors.length && checks.length === 3, error, errors, checks, measurements, commands, owner_cloud_writes: false, balance_simulation: false, personal_preview_restarted: false, scope: 'Disposable signed Lv40 test roster and Angeling card, actual isolated Auth/API/SQL/mobile Chrome. Not owner account or physical Android.' };
    fs.writeFileSync(path.join(root, 'plan/evidence/task-076-ui-live.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report)); if (!report.passed) process.exitCode = 1;
  }
})().catch(() => { console.error('ELEMENT_UI_FIXTURE_FAILED'); process.exitCode = 1; });
async function shotFailure(page) { await page.screenshot({ path: path.join(root, 'plan/evidence/task-076-ui-failure.png') }).catch(() => {}); }
