// Disposable real local Auth/SQL/API/mobile Chrome. No owner account or balance runner.
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process'), { randomUUID, randomBytes } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { createClient } = require('@supabase/supabase-js'), { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_LIVE_URL, gateway = process.env.SUPABASE_URL;
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1' || ![base, gateway].every(u => u && new URL(u).hostname === '127.0.0.1')) throw new Error('ISOLATED_STACK_REQUIRED');
const check = (v, m) => { if (!v) throw new Error(m); }, runTs = (file, input) => JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', path.join(root, file)], { input: JSON.stringify(input), env: process.env, cwd: root }).toString());
const format = n => n.toLocaleString('th-TH', { maximumFractionDigits: 1 }); // Stats use the shared compact one-decimal formatter.
(async () => {
  const admin = createClient(gateway, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = 'impact-' + randomUUID() + '@example.invalid', password = randomBytes(24).toString('base64url'), user = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  check(!user.error && user.data.user, 'CREATE_USER'); const uid = user.data.user.id;
  let browser, page, error = null, stage = 'LOGIN'; const checks = [], commands = [], errors = [], measurements = {};
  const saved = async () => { const r = await admin.from('game_saves').select('*').eq('account_id', uid).single(); check(!r.error, 'READ_SAVE'); return r.data; };
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); page = await ctx.newPage(); page.setDefaultTimeout(20000);
    page.on('pageerror', e => errors.push(e.message)); page.on('request', r => { if (r.method() === 'POST' && new URL(r.url()).pathname === '/api/commands') commands.push(r.postDataJSON().type); });
    const ready = () => page.locator('.hud-save.ok').waitFor({ timeout: 25000 }), dialog = () => page.locator('dialog.sheet[open]').last();
    const shot = name => page.screenshot({ path: path.join(root, 'plan/evidence/task-077-' + name + '.png') });
    const fit = async () => check(await page.locator('.game-frame').evaluate(n => n.scrollWidth <= n.clientWidth), 'MOBILE_OVERFLOW');
    await page.goto(base + '/auth'); await page.getByLabel('อีเมล', { exact: true }).fill(email); await page.getByLabel('รหัสผ่าน', { exact: true }).fill(password); await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click(); await page.getByRole('heading', { name: 'เข้าสู่บัญชี', exact: true }).waitFor({ state: 'hidden' });
    await page.goto(base + '/play'); await page.getByRole('radio', { name: /^Swordsman/ }).click(); await page.getByRole('button', { name: 'เริ่มการเดินทาง', exact: true }).click(); await ready(); await page.goto('about:blank');
    const original = await saved(), fixture = runTs('scripts/game/build-impact-ui-fixture.ts', original.state), state = fixture.state, revision = original.revision + 1;
    const signed = runTs('scripts/game/sign-test-save.ts', { account_id: uid, revision, state });
    check(!(await admin.from('game_save_history').insert({ account_id: uid, revision, state, state_hash: signed.state_hash, signature: signed.signature, key_version: 1 })).error, 'FIXTURE_HISTORY');
    check(!(await admin.from('game_saves').update({ revision, state, state_hash: signed.state_hash }).eq('account_id', uid)).error, 'FIXTURE_SAVE');
    stage = 'SKILLS'; const beforeInspect = commands.length;
    await page.goto(base + '/play?v=skills&c=main'); await ready(); await page.locator('.skill-row').filter({ has: page.getByText('Bash', { exact: true }) }).click();
    check((await page.locator('.effect-block').first().innerText()).includes('245%'), 'SKILL_POWER_NOT_UPDATED');
    for (const width of [390, 320]) { await page.setViewportSize({ width, height: 844 }); await fit(); await shot('skill-' + width); }
    checks.push('Real Bash detail displays shared factor245% ATK instead of140%, at320/390px');
    stage = 'STATS'; await page.goto(base + '/play?v=stats&c=main'); await ready(); await page.locator('.extra-stats > summary').click();
    const skillRow = page.locator('.extra-stats .stat-grid > p').filter({ has: page.getByText('ดาเมจสกิล', { exact: true }) });
    check((await skillRow.innerText()).includes(format(fixture.skill.stats.skill_damage_bonus * 100) + '%'), 'SKILL_STAT_MISMATCH');
    measurements.skill_bonus = fixture.skill.stats.skill_damage_bonus; await skillRow.scrollIntoViewIfNeeded(); await fit(); await shot('stats-320');
    stage = 'GEAR'; await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + '/play?v=buddy&c=main'); await ready();
    await page.locator('.gear-tile').first().click(); await dialog().getByRole('button', { name: /เปลี่ยน/ }).click();
    const normal = dialog().locator('.list-item').filter({ hasText: 'มุรามาสะ Lv.40' }); await normal.locator('.list-row').click();
    check((await normal.locator('.option-lines').innerText()).includes('ดาเมจตีปกติ'), 'OPTION_MISSING');
    const changes = normal.locator('.stat-changes'); check((await changes.innerText()).includes('ดาเมจสกิล') && (await changes.innerText()).includes('ดาเมจตีปกติ'), 'ROLE_DIFF_MISSING');
    for (const width of [390, 320]) { await page.setViewportSize({ width, height: 844 }); await changes.scrollIntoViewIfNeeded(); await fit(); await shot('gear-preview-' + width); }
    check(commands.length === beforeInspect, 'INSPECTION_SAVED');
    await normal.getByRole('button', { name: 'สวมใส่', exact: true }).click(); await ready(); await page.reload(); await ready();
    const after = await saved(), main = after.state.roster.find(a => a.character_id === 'main');
    check(main.equipment.weapon === 'qa_normal_weapon' && main.slot_progress.weapon.cards[0] === 'qa_wolf', 'EQUIP_RELOAD_LOST_CARD');
    measurements.wallet_unchanged = isDeepStrictEqual(after.state.wallet, state.wallet); measurements.ledger_unchanged = isDeepStrictEqual(after.state.paid_ledger, state.paid_ledger);
    check(measurements.wallet_unchanged && measurements.ledger_unchanged, 'EQUIP_CHANGED_INVESTMENTS');
    await page.goto(base + '/play?v=stats&c=main'); await ready(); await page.locator('.extra-stats > summary').click();
    const normalRow = page.locator('.extra-stats .stat-grid > p').filter({ has: page.getByText('ดาเมจตีปกติ', { exact: true }) });
    check((await normalRow.innerText()).includes(format(fixture.normal.stats.normal_damage_bonus * 100) + '%'), 'NORMAL_STAT_MISMATCH');
    measurements.normal_bonus = fixture.normal.stats.normal_damage_bonus;
    checks.push('Shared role/option preview matches new bonus stats; actual equip persisted across reload, Wolf assignment/wallet/paid ledger retained, no inspection writes');
    stage = 'CARD'; await page.goto(base + '/play?v=buddy&c=main'); await ready(); await page.locator('.gear-tile').first().click(); await dialog().getByRole('button', { name: 'อัปเกรด', exact: true }).click(); await dialog().getByRole('tab', { name: /^การ์ด/ }).click();
    const cardText = await dialog().locator('.detail-box').innerText(); check(cardText.includes('ATK +24') && cardText.includes('ATK +42%'), 'CARD_SCALING_DESCRIPTION:' + cardText);
    await dialog().locator('.detail-box').scrollIntoViewIfNeeded(); await fit(); await shot('wolf-card-320');
    checks.push('Real GoldLv5 Wolf card displays retained24 flatATK plus42% scalableATK');
    check(commands.filter(c => c !== 'account.create' && c !== 'equipment.equip').length === 0 && commands.filter(c => c === 'equipment.equip').length === 1, 'EXTRA_WRITES');
  } catch (e) { error = stage + ':' + (e.stack || String(e)); if (page) await page.screenshot({ path: path.join(root, 'plan/evidence/task-077-ui-failure.png') }).catch(() => {}); }
  finally {
    if (browser) await browser.close(); await admin.auth.admin.deleteUser(uid);
    const report = { task_id: 'TASK-077', passed: !error && !errors.length && checks.length === 3, error, errors, checks, measurements, commands, owner_cloud_writes: false, personal_preview_restarted: false, balance_simulation: false, scope: 'Disposable signed Lv40 test roster, real Auth/API/SQL/mobile Chrome; not physical Android or owner account.' };
    fs.writeFileSync(path.join(root, 'plan/evidence/task-077-ui-live.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report)); if (!report.passed) process.exitCode = 1;
  }
})().catch(() => { console.error('IMPACT_UI_FIXTURE_FAILED'); process.exitCode = 1; });
