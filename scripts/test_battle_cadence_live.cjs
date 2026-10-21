// Real Auth/API/Postgres on the fresh loopback stack only; no personal/cloud save access.
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { randomBytes, randomUUID, createHash } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), prefix = process.env.RO_EVIDENCE_PREFIX || 'task-059';
const base = process.env.RO_LIVE_URL, gateway = process.env.SUPABASE_URL;
if (!/^task-\d{3}$/.test(prefix) || process.env.RO_SUPABASE_LOCAL_STACK !== '1' || ![base, gateway].every(u => u && new URL(u).hostname === '127.0.0.1')) throw new Error('ISOLATED_LOOPBACK_REQUIRED');
const checks = [], errors = [], commands = [], intervals = [], samples = [];
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
    // Delay each actual command response by 400ms to detect response-relative timer drift.
    await page.route('**/api/commands', async route => {
      const input = route.request().postDataJSON();
      commands.push({ type: input.type, speed: input.params.speed, battle: input.params.battle_id, at: Date.now() });
      inFlight++; peak = Math.max(peak, inFlight);
      try { const response = await route.fetch(); if (input.type === 'battle.advance') await new Promise(resolve => setTimeout(resolve, 400)); await route.fulfill({ response }); }
      finally { inFlight--; }
    });
    const ready = () => page.locator('.hud-save.ok').waitFor({ timeout: 25000 });
    const challenge = async () => { await ready(); await page.locator('.challenge-btn').click(); await page.locator('.field-arena.boss').waitFor({ timeout: 25000 }); };
    const ms = () => page.locator('.field-arena.boss').getAttribute('data-game-ms').then(Number);
    await page.goto(base + '/auth'); await page.getByLabel('อีเมล', { exact: true }).fill(email); await page.getByLabel('รหัสผ่าน', { exact: true }).fill(password); await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click();
    await page.getByRole('heading', { name: 'ยินดีต้อนรับกลับ', exact: true }).waitFor(); await page.goto(base + '/play');
    await page.getByRole('radio', { name: /^Mage/ }).click(); await page.getByRole('button', { name: 'เริ่มการเดินทาง', exact: true }).click(); await ready();
    await page.goto('about:blank'); await page.waitForTimeout(200);
    const initial = await row(), state = runTs('scripts/game/battle-cadence-fixture.ts', initial.state), revision = initial.revision + 1;
    const signed = runTs('scripts/game/sign-test-save.ts', { account_id: uid, revision, state });
    check(!(await admin.from('game_save_history').insert({ account_id: uid, revision, state, state_hash: signed.state_hash, signature: signed.signature, key_version: 1 })).error, 'FIXTURE_HISTORY_FAILED');
    check(!(await admin.from('game_saves').update({ revision, state, state_hash: signed.state_hash }).eq('account_id', uid).eq('revision', initial.revision)).error, 'FIXTURE_SAVE_FAILED');
    await page.goto(base + '/play'); await ready();

    stage = 'CADENCE'; await challenge(); const battle = (await row()).state.active_battle.battle_id;
    const advances = () => commands.filter(c => c.type === 'battle.advance' && c.battle === battle);
    const deadline = Date.now() + 17000;
    while (advances().length < 3 && Date.now() < deadline) { samples.push({ ms: await ms(), requests: advances().length }); await page.waitForTimeout(200); }
    check(advances().length >= 3, 'THREE_ACKS_NOT_SEEN');
    const first = advances().slice(0, 3); for (let i = 1; i < first.length; i++) { const gap = first[i].at - first[i - 1].at; intervals.push(gap); check(gap >= 3800 && gap < 4350, 'CADENCE_DRIFT_' + gap); }
    const firstAt = commands.find(c => c.type === 'battle.start_story').at;
    check(first[0].at - firstAt >= 3800, 'FIRST_ACK_TOO_SOON');
    check(samples.some((s, i) => i > 0 && s.requests === samples[i - 1].requests && s.ms - samples[i - 1].ms >= 50), 'PREDICTION_WAITED_FOR_NETWORK');
    check(peak === 1, 'OVERLAPPING_WRITES');
    checks.push('Three periodic acknowledgements ~4s apart despite 400ms response delay; game_ms advances between requests; one write at a time');

    stage = 'SPEED'; await ready(); const speedMark = commands.length;
    await page.getByRole('button', { name: 'ความเร็วต่อสู้ 1 เท่า กดเพื่อเปลี่ยน' }).click();
    await page.getByRole('button', { name: 'ความเร็วต่อสู้ 2 เท่า กดเพื่อเปลี่ยน' }).waitFor();
    check(commands.slice(speedMark).some(c => c.type === 'battle.advance' && c.speed === 1), 'SPEED_NOT_CONFIRMED_AT_OLD_RATE');
    await ready(); await page.getByRole('button', { name: 'ความเร็วต่อสู้ 2 เท่า กดเพื่อเปลี่ยน' }).click();
    await page.getByRole('button', { name: 'ความเร็วต่อสู้ 4 เท่า กดเพื่อเปลี่ยน' }).waitFor();
    check(commands.slice(speedMark).some(c => c.type === 'battle.advance' && c.speed === 2), 'SECOND_SPEED_NOT_CONFIRMED');
    await page.locator('.result-card.win').waitFor({ timeout: 30000 }); await ready();
    check(advances().some(c => c.speed === 4), 'FOUR_SPEED_NOT_ACKNOWLEDGED');
    check(!(await row()).state.active_battle, 'TERMINAL_NOT_SETTLED');
    check(!(await page.locator('.field-toast.danger').count()), 'PREDICTION_MISMATCH');
    const mark = Date.now(); await page.getByRole('button', { name: 'รับรางวัล', exact: true }).click(); await ready();
    const paid = await row(); check(!paid.state.pending_rewards.some(c => c.kind === 'story'), 'CLAIM_NOT_COMMITTED');
    check(commands.some(c => c.type === 'reward.claim' && c.at >= mark && c.at - mark < 1500), 'PLAYER_COMMAND_DELAYED_BY_CADENCE');
    checks.push('Speed changes flush 1×/2× before switching; 4× settles the real server battle, shows no prediction mismatch and claims once immediately');
    await page.getByRole('button', { name: 'กลับไปฟาร์ม', exact: true }).click(); await page.locator('.challenge-btn').waitFor();
    await page.reload(); await ready(); check(JSON.stringify((await row()).state.wallet) === JSON.stringify(paid.state.wallet), 'RELOAD_PAID_TWICE');

    stage = 'OFFLINE'; await challenge(); await ready();
    await context.setOffline(true); await page.waitForTimeout(200); const offlineMark = commands.length; await page.waitForTimeout(4400);
    check(commands.length === offlineMark, 'OFFLINE_SENT_COMMAND');
    await context.setOffline(false); await ready();
    check(!(await row()).state.active_battle, 'RECONNECT_DID_NOT_RETREAT');
    checks.push('Offline >4s sends no new command; reconnect reconciles then retreats without offline combat');
    await page.reload(); await ready(); await challenge(); await ready();
    const beforeReload = (await row()).state.wallet; await page.reload(); await ready();
    check(!(await row()).state.active_battle && JSON.stringify((await row()).state.wallet) === JSON.stringify(beforeReload), 'REFRESH_REPLAYED_COMBAT_OR_PAYMENT');
    checks.push('Refreshing an active fight retreats it; earlier claimed rewards remain unchanged without duplicate payout');
  } catch (error) { errors.push(stage + ':' + String(error)); }
  finally {
    if (browser) await browser.close();
    const refs = ['src/client/battle-ack.ts', 'src/ui/game/shell.tsx', 'src/ui/game/field.tsx', 'scripts/test_battle_cadence_live.cjs'];
    const report = { passed: checks.length === 4 && !errors.length, checks, errors, periodic_request_gaps_ms: intervals, peak_command_requests: peak, prediction_samples: samples, source_sha256: Object.fromEntries(refs.map(ref => [ref, createHash('sha256').update(fs.readFileSync(path.join(root, ref))).digest('hex')])), scope: 'Actual loopback Auth/API/PostgreSQL and Chrome. Synthetic Lv20/VIT20 save; no personal or cloud writes.' };
    fs.writeFileSync(path.join(root, `plan/evidence/${prefix}-cadence-live.json`), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report)); if (!report.passed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
