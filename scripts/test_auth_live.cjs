/** Actual Auth UI + local GoTrue SMTP recovery; never sends external mail. */
const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomBytes, randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_LIVE_URL, gateway = process.env.SUPABASE_URL, mail = process.env.RO_MAILPIT_URL;
const evidencePrefix = process.env.RO_EVIDENCE_PREFIX || 'task-021';
if (!/^task-[0-9]{3}$/.test(evidencePrefix)) throw new Error('INVALID_EVIDENCE_PREFIX');
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1' || ![base, gateway, mail].every(url => url && new URL(url).hostname === '127.0.0.1')) throw new Error('LOCAL_LOOPBACK_STACK_REQUIRED');
(async () => {
  const admin = createClient(gateway, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `ro-idle-ui-${randomUUID()}@example.invalid`, password = randomBytes(28).toString('base64url'), nextPassword = randomBytes(28).toString('base64url');
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw new Error('LOCAL_UI_USER_CREATE_FAILED');
  const uid = created.data.user.id, checks = [], errors = [], external = [];
  let browser;
  let stage = 'START';
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', () => errors.push('BROWSER_RUNTIME_ERROR'));
    await page.route('**/*', route => { const url = route.request().url(); if ([base, gateway, mail].some(origin => url.startsWith(origin + '/')) || url.startsWith('data:')) return route.continue(); external.push(new URL(url).origin); return route.abort(); });
    await page.goto(base + '/auth');
    stage = 'SIGNIN';
    await page.getByLabel('อีเมล', { exact: true }).fill(email); await page.getByLabel('รหัสผ่าน', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click(); await page.getByRole('heading', { name: 'ยินดีต้อนรับกลับ' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'ตรวจเซฟของฉัน' }).click(); await page.getByText('บัญชีนี้ยังไม่มีเซฟเกม', { exact: false }).waitFor();
    await page.reload(); await page.getByRole('heading', { name: 'ยินดีต้อนรับกลับ' }).waitFor();
    checks.push('Actual SDK email/password login persists through reload; verified API returns no wallet for missing account');
    stage = 'RESET_REQUEST';
    await page.getByRole('button', { name: 'ออกจากบัญชี', exact: true }).click();
    await page.getByRole('button', { name: 'ลืมรหัสผ่าน' }).click(); await page.getByLabel('อีเมล', { exact: true }).fill(email);
    await page.getByRole('button', { name: 'ส่งลิงก์เปลี่ยนรหัสผ่าน' }).click(); await page.getByText('หากมีบัญชีนี้', { exact: false }).waitFor();
    let message;
    for (let attempt = 0; attempt < 50; attempt++) {
      const messages = await (await fetch(mail + '/api/v1/messages')).json();
      const summary = messages.messages?.find(item => item.To?.some(to => to.Address === email));
      if (summary) { message = await (await fetch(mail + '/api/v1/message/' + summary.ID)).json(); break; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!message) throw new Error('SMTP_RECOVERY_MESSAGE_NOT_CAPTURED');
    stage = 'MAIL_LINK';
    const href = /href="([^"]+)"/.exec(message.HTML ?? '')?.[1]?.replace(/&amp;/g, '&');
    if (!href || !href.startsWith(gateway + '/auth/v1/verify?')) throw new Error('RECOVERY_LINK_INVALID');
    stage = 'RECOVERY_REDIRECT';
    await page.goto(href); await page.getByRole('heading', { name: 'ตั้งรหัสผ่านใหม่' }).waitFor({ timeout: 15000 });
    if (new URL(page.url()).pathname !== '/auth') throw new Error('RECOVERY_REDIRECT_FAILED');
    stage = 'PASSWORD_UPDATE';
    await page.getByLabel('รหัสผ่านใหม่', { exact: true }).fill(nextPassword); await page.getByLabel('ยืนยันรหัสผ่านใหม่', { exact: true }).fill(nextPassword);
    await page.getByRole('button', { name: 'บันทึกรหัสผ่านใหม่' }).click(); await page.getByRole('heading', { name: 'ยินดีต้อนรับกลับ' }).waitFor();
    checks.push('Actual reset request arrives at loopback SMTP sink; one-use email verification redirects with PKCE into recovery form and password update succeeds');
    stage = 'NEW_PASSWORD_LOGIN';
    // Mask the generated address in a screenshot; no mail links or tokens stored.
    await page.getByText(email, { exact: true }).evaluate(el => { el.textContent = 'บัญชีทดสอบในเครื่อง'; });
    await page.screenshot({ path: path.join(root, evidencePrefix === 'task-021' ? 'docs/screenshots/auth-live-local.png' : `docs/screenshots/auth-live-${evidencePrefix}.png`), fullPage: true });
    await page.getByRole('button', { name: 'ออกจากบัญชี', exact: true }).click();
    await page.getByLabel('อีเมล', { exact: true }).fill(email); await page.getByLabel('รหัสผ่าน', { exact: true }).fill(password); await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click(); await page.getByRole('alert').waitFor();
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill(nextPassword); await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click(); await page.getByRole('heading', { name: 'ยินดีต้อนรับกลับ' }).waitFor();
    await page.getByRole('button', { name: 'ออกจากบัญชี', exact: true }).click(); await page.reload(); await page.getByRole('heading', { name: 'เข้าสู่บัญชี', exact: true }).waitFor();
    checks.push('Old password rejected; new password signs in; logout persists across reload');
  } catch (error) {
    errors.push(stage + ':' + (error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : 'LIVE_BROWSER_CHECK_FAILED_REDACTED'));
    const page = browser?.contexts()[0]?.pages()[0];
    if (page) {
      await page.locator('input[type=email]').evaluateAll(elements => elements.forEach(el => { el.value = 'qa@example.invalid'; }));
      await page.locator('.auth-email').evaluateAll(elements => elements.forEach(el => { el.textContent = 'บัญชีทดสอบ'; }));
      await page.screenshot({ path: path.join(root, `docs/screenshots/auth-live-finding-${evidencePrefix}.png`), fullPage: true });
      errors.push('VISIBLE_STATE:' + await page.locator('h2').allTextContents());
    }
  }
  finally {
    const removed = await admin.auth.admin.deleteUser(uid); if (removed.error) errors.push('LOCAL_UI_USER_CLEANUP_FAILED');
    const source_sha256 = Object.fromEntries(['scripts/test_auth_live.cjs', 'src/client/supabase-auth.ts', 'src/client/auth-controller.ts', 'src/ui/auth-page.tsx'].map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
    const report = { task_id: evidencePrefix.toUpperCase(), passed: checks.length === 3 && !errors.length && !external.length, actual_supabase_auth: true, self_hosted_local: true, smtp_sink_only: true, browser: browser?.version(), checks, errors, external_requests: external, source_sha256, scope: 'Real local Auth/PostgREST/PostgreSQL/SMTP + app UI, no hosted project/production credentials/external mail delivery or game command writes.' };
    fs.writeFileSync(path.join(root, `plan/evidence/${evidencePrefix}-live-browser.json`), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report)); await browser?.close(); if (!report.passed) process.exitCode = 1;
  }
})().catch(() => { console.error('LOCAL_LIVE_BROWSER_FAILED_REDACTED'); process.exitCode = 1; });
