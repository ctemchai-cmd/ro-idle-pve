// Real Auth/API/Postgres on the fresh loopback stack only; no personal/cloud save access.
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { randomBytes, randomUUID, createHash } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), prefix = process.env.RO_EVIDENCE_PREFIX || 'task-061';
const base = process.env.RO_LIVE_URL, gateway = process.env.SUPABASE_URL;
if (!/^task-\d{3}$/.test(prefix) || process.env.RO_SUPABASE_LOCAL_STACK !== '1' || ![base, gateway].every(u => u && new URL(u).hostname === '127.0.0.1')) throw new Error('ISOLATED_LOOPBACK_REQUIRED');
const checks = [], errors = [], commands = [], samples = [];
const check = (ok, code) => { if (!ok) throw new Error(code); };
const runTs = (file, input) => JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', path.join(root, file)], { input: JSON.stringify(input), cwd: root, env: process.env }).toString());
(async () => {
  const admin = createClient(gateway, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = 'cadence-' + randomUUID() + '@example.invalid', password = randomBytes(24).toString('base64url');
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  check(!created.error && created.data.user, 'USER_CREATE_FAILED'); const uid = created.data.user.id;
  const row = async () => { const r = await admin.from('game_saves').select('*').eq('account_id', uid).single(); check(!r.error, 'SAVE_READ_FAILED'); return r.data; };
  let browser, page, stage = 'LOGIN', inFlight = 0, peak = 0;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); page = await context.newPage();
    page.on('pageerror', e => errors.push(String(e.message).slice(0, 180)));
    // Delay the actual finish response to exercise pending-intent UI without another finish request.
    await page.route('**/api/commands', async route => {
      const input = route.request().postDataJSON();
      commands.push({ type: input.type, speed: input.params.speed, battle: input.params.battle_id, at: Date.now() });
      inFlight++; peak = Math.max(peak, inFlight);
      try { const response = await route.fetch(); if (input.type === 'battle.finish') await new Promise(resolve => setTimeout(resolve, 400)); await route.fulfill({ response }); }
      finally { inFlight--; }
    });
    const ready = () => page.locator('.hud-save.ok').waitFor({ timeout: 25000 });
    const challenge = async () => { await ready(); await page.locator('.challenge-btn').click(); await page.locator('.field-arena.boss').waitFor({ timeout: 25000 }); };
    const ms = () => page.locator('.field-arena.boss').getAttribute('data-game-ms').then(Number);
    await page.goto(base + '/auth'); await page.getByLabel('อีเมล', { exact: true }).fill(email); await page.getByLabel('รหัสผ่าน', { exact: true }).fill(password); await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click();
    await page.getByRole('heading', { name: 'ยินดีต้อนรับกลับ', exact: true }).waitFor(); await page.goto(base + '/play');
    await page.getByRole('radio', { name: /^Mage/ }).click(); await page.getByRole('button', { name: 'เริ่มการเดินทาง', exact: true }).click(); await ready();
    await page.goto('about:blank'); await page.waitForTimeout(200);
    const initial = await row(), oldHash = 'c'.repeat(64), equivalent = require('node:util').isDeepStrictEqual;
    const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    const daily = { boss_id: 'treasury', ticket_day: day, attempts_used: 3, phase: 8, current_hp: 999, rewarded_phases: [1, 2, 3], chapter_snapshot: 2 };
    const seed = async (state, contentHash) => {
      const previous = await row(), revision = previous.revision + 1;
      const signed = runTs('scripts/game/sign-test-save.ts', { account_id: uid, revision, state, content_hash: contentHash });
      check(!(await admin.from('game_save_history').insert({ account_id: uid, revision, state, state_hash: signed.state_hash, signature: signed.signature, key_version: 1 })).error, 'FIXTURE_HISTORY_FAILED');
      check(!(await admin.from('game_saves').update({ revision, state, state_hash: signed.state_hash, content_hash: contentHash }).eq('account_id', uid).eq('revision', previous.revision)).error, 'FIXTURE_SAVE_FAILED');
      return revision;
    };
    const backups = async () => { const r = await admin.from('game_save_backups').select('*').eq('account_id', uid); check(!r.error, 'BACKUP_READ_FAILED'); return r.data; };
    const carried = structuredClone(initial.state); carried.daily_records = [daily]; await seed(carried, oldHash);
    stage = 'REPAIR_PREVIEW'; await page.goto(base + '/play');
    await page.getByRole('button', { name: 'สำรองแล้วอัปเดตเซฟ', exact: true }).waitFor({ timeout: 25000 });
    check((await row()).state.daily_records.length === 1 && (await backups()).length === 0, 'PREVIEW_MUTATED_SAVE');
    await page.getByRole('button', { name: 'สำรองแล้วอัปเดตเซฟ', exact: true }).click(); await ready();
    const repaired = await row(), repairBackups = await backups();
    check(repaired.state.daily_records.length === 0 && repairBackups.length === 1 && repairBackups[0].reason === 'migration' && equivalent(repairBackups[0].state, carried), 'REPAIR_OR_BACKUP_FAILED');
    const expected = structuredClone(carried); expected.daily_records = [];
    check(equivalent(repaired.state, expected), 'REPAIR_CHANGED_OTHER_PROGRESSION');
    checks.push('Actual owner migration preview writes nothing; confirmation backs up the signed legacy save and clears only daily carry-over with all other state preserved');

    stage = 'NEW_GAME_RESET'; await page.goto('about:blank'); await page.waitForTimeout(200);
    const progressed = runTs('scripts/game/battle-finish-fixture.ts', initial.state);
    progressed.story.cleared_stage_ids.push('1-10'); progressed.daily_records = [daily];
    await seed(progressed, initial.content_hash);
    await page.goto(base + '/play'); await ready();
    await page.getByRole('button', { name: 'ตั้งค่า', exact: true }).click();
    await page.getByRole('button', { name: /รีเซ็ตเซฟ/ }).click(); await page.locator('.reset-form').waitFor();
    check(await page.getByRole('button', { name: 'ลบและเริ่มใหม่', exact: true }).isDisabled(), 'RESET_NOT_CONFIRMED');
    await page.getByLabel('พิมพ์ RESET เพื่อยืนยัน', { exact: true }).fill('RESET');
    await page.getByRole('button', { name: 'ลบและเริ่มใหม่', exact: true }).click(); await ready();
    const fresh = await row(), resetBackup = (await backups()).find(b => b.reason === 'reset');
    check(fresh.state.roster.every(a => a.level === 1) && !fresh.state.story.cleared_stage_ids.length && !fresh.state.daily_records.length && !fresh.state.pending_rewards.length, 'NEW_GAME_RETAINED_DUNGEONS');
    check(resetBackup && equivalent(resetBackup.state, progressed), 'RESET_BACKUP_INCOMPLETE');
    checks.push('Settings typed RESET starts all characters at Lv1 with no old dungeon attempts/HP/phases/chests; the full previous state is backed up first');
    await page.reload(); await ready(); check(!(await row()).state.daily_records.length, 'RESET_NOT_DURABLE');
    checks.push('Reload keeps the fresh daily dungeon state without a second reset or extra grant');
  } catch (error) { errors.push(stage + ':' + String(error)); }
  finally {
    if (browser) await browser.close();
    const refs = ['src/domain/account/maintenance.ts', 'src/domain/account/migrate.ts', 'src/ui/game/backup.tsx', 'scripts/test_daily_reset_live.cjs'];
    const report = { passed: checks.length === 3 && !errors.length, checks, errors, observed_finish_count: commands.filter(c => c.type === 'battle.finish').length, periodic_advance_count: commands.filter(c => c.type === 'battle.advance').length, peak_command_requests: peak, prediction_samples: samples, source_sha256: Object.fromEntries(refs.map(ref => [ref, createHash('sha256').update(fs.readFileSync(path.join(root, ref))).digest('hex')])), scope: 'Actual loopback Auth/API/PostgreSQL and Chrome. Synthetic signed reset/migration fixtures; no personal or cloud writes.' };
    fs.writeFileSync(path.join(root, `plan/evidence/${prefix}-reset-live.json`), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report)); if (!report.passed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
