// TASK-048 game shell walkthrough on an isolated loopback stack: fresh account, no granted rewards.
const fs = require('node:fs'), path = require('node:path'), { randomBytes, randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js'), { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const prefix = process.env.RO_EVIDENCE_PREFIX || 'task-048'; if (!/^task-\d{3}$/.test(prefix)) throw new Error('INVALID_EVIDENCE_PREFIX');
const root = path.resolve(__dirname, '..'), base = process.env.RO_LIVE_URL, gateway = process.env.SUPABASE_URL;
if (process.env.RO_SUPABASE_LOCAL_STACK !== '1' || ![base, gateway].every(u => u && new URL(u).hostname === '127.0.0.1')) throw new Error('ISOLATED_LOOPBACK_REQUIRED');
function check(ok, code) { if (!ok) throw new Error(code); }
const shots = [];
(async () => {
  const admin = createClient(gateway, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `shell-${randomUUID()}@example.invalid`, password = randomBytes(24).toString('base64url'), created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  check(!created.error && created.data.user, 'USER_CREATE_FAILED'); const uid = created.data.user.id, checks = [], errors = []; let browser, stage = 'BOOT';
  async function row() { const r = await admin.from('game_saves').select('*').eq('account_id', uid).single(); check(!r.error, 'SAVE_READ_FAILED'); return r.data; }
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }), page = await context.newPage();
    page.on('pageerror', e => errors.push('BROWSER_RUNTIME_ERROR:' + String(e.message).slice(0, 160)));
    const api = new Map(); page.on('request', r => { if (r.url().includes('/api/')) api.set(r, `${r.method()} ${new URL(r.url()).pathname}`); }); page.on('requestfinished', r => api.delete(r)); page.on('requestfailed', r => { if (api.has(r)) errors.push('API_FAILED:' + api.get(r)); api.delete(r); });
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_ABORTED/.test(m.text())) errors.push('CONSOLE_ERROR:' + m.text().slice(0, 160)); });
    const shot = async name => { const file = `docs/screenshots/${prefix}-${name}.png`; await page.screenshot({ path: path.join(root, file) }); shots.push(file); };
    // On timeout, say which save state it was stuck in (aria-label/toasts/pending API), not just "not ok".
    const ready = () => page.locator('.hud-save.ok').waitFor({ timeout: 20000 }).catch(async error => { const label = await page.locator('.hud-save').getAttribute('aria-label').catch(() => '?'), ui = await page.locator('.field-toast, .field-error, .toast, [role=alert]').allInnerTexts().catch(() => []); throw new Error(`SAVE_NOT_READY ${label} ui=${ui.join('/')} pending_api=${[...api.values()].join(',')} :: ${String(error).slice(0, 120)}`); });
    const settle = async () => { await page.waitForTimeout(150); await ready(); };
    const sheetShot = async name => { await page.locator('dialog.sheet[open]').last().waitFor(); await page.waitForTimeout(350); await shot(name); };
    const closeSheet = async () => { await page.locator('dialog.sheet[open] .sheet-head button[aria-label="ปิด"]').last().click(); await page.waitForTimeout(150); };

    stage = 'LOGIN_ONBOARD';
    await page.goto(base + '/auth'); await page.getByLabel('อีเมล', { exact: true }).fill(email); await page.getByLabel('รหัสผ่าน', { exact: true }).fill(password); await page.getByRole('button', { name: 'เข้าสู่บัญชี', exact: true }).click();
    await page.waitForTimeout(800); await page.goto(base + '/play');
    await page.getByRole('radio', { name: /^Mage/ }).waitFor(); await page.getByRole('radio', { name: 'หญิง', exact: true }).click(); await page.getByRole('radio', { name: /^Mage/ }).click(); await page.waitForTimeout(500); await shot('onboarding-390');
    await page.getByRole('button', { name: 'เริ่มการเดินทาง', exact: true }).click(); await ready();
    let saved = await row(); check(saved.state.roster.find(a => a.character_id === 'main').job_id === 'mage', 'ONBOARD_SAVE_WRONG'); checks.push('Onboarding cards create Mage/female through the real account.create command');

    // RO_SHELL_ONLY_MODES=1 (debug only) jumps straight from onboarding to the seeded Tower/Daily/Store stages.
    if (!process.env.RO_SHELL_ONLY_MODES) {
    stage = 'HOME_FARM';
    await page.waitForFunction(() => ['fight', 'walk'].includes(document.querySelector('.field-arena')?.dataset.farmPhase ?? ''), null, { timeout: 20000 });
    check(await page.locator('.bottom-bar .nav-item').count() === 6, 'BOTTOM_BAR_ITEMS'); check(await page.locator('.bottom-bar .nav-item.locked').count() === 1, 'LOCKED_TABS'); // Store opened (D-063), Crafting still locked
    const hudBox = await page.locator('.hud').boundingBox(); check(hudBox && hudBox.height <= 80, 'HUD_TOO_TALL');
    const challenge = await page.locator('.challenge-btn').boundingBox(), bar = await page.locator('.bottom-bar').boundingBox(); check(challenge && bar && challenge.x > 390 / 2 && challenge.y + challenge.height <= bar.y + 2, 'CHALLENGE_NOT_BOTTOM_RIGHT_ABOVE_BAR');
    await page.waitForTimeout(1500); await shot('home-fight-390');
    await page.waitForFunction(() => document.querySelector('.field-arena')?.dataset.farmPhase === 'walk', null, { timeout: 30000 }); await page.waitForTimeout(500); await shot('home-walk-390');
    checks.push('Home shows compact HUD (<=80px), farm waves cycling fight→walk on the shared engine, challenge button bottom-right above the bottom bar (Store open, Crafting locked)');

    stage = 'BOSS_1_1';
    await page.locator('.challenge-btn').click(); await page.locator('.boss-intro .warn-text').waitFor({ timeout: 3000 }); await page.waitForTimeout(500); await shot('boss-intro-390');
    await page.waitForFunction(() => Number(document.querySelector('.field-arena.boss')?.dataset.gameMs ?? 0) > 300 && !document.querySelector('.boss-intro'), null, { timeout: 30000 }); await shot('boss-fight-390');
    let samples = 0, missing = 0; for (let i = 0; i < 12; i++) { const terminal = await page.locator('.field-arena.boss').getAttribute('data-terminal').catch(() => 'gone'); if (terminal !== '') break; samples++; if (!(await page.locator('.boss-tools .chip-btn.danger').count())) missing++; await page.waitForTimeout(120); }
    check(samples >= 3 && missing === 0, `RETREAT_FLICKER_${missing}_OF_${samples}`);
    checks.push(`Retreat button stayed visible in ${samples} samples across boss-clock commits; statistics sheet is styled`);
    await page.locator('.result-card').waitFor({ timeout: 95000 }); await page.waitForTimeout(600); await shot('boss-result-390');
    // TASK-039 AC-02: the result card carries a per-member debrief (damage/heal/overheal/fell/interrupted/SP), never a power score.
    check(await page.locator('.result-card .debrief').count() === 1, 'DEBRIEF_MISSING'); await page.locator('.result-card .debrief summary').click(); await page.waitForTimeout(300);
    check(await page.locator('.result-card .debrief > ul:not(.debrief-tips) > li').count() === 4 && /ดาเมจ/.test(await page.locator('.result-card .debrief').innerText()) && !/คะแนนพลัง|Power/.test(await page.locator('.result-card').innerText()), 'DEBRIEF_CONTENT'); await shot('boss-debrief-390');
    checks.push('Boss result card shows a per-member debrief (damage/heal/overheal/fall/interrupt/SP) without a power score (TASK-039 AC-02)');
    await page.locator('.result-card').getByRole('button', { name: /สถิติ/ }).click(); await sheetShot('boss-statistics-390');
    // Per-skill split (user, 21 Oct 2026): hidden by default, "แสดงสกิล" lists that member's skills incl. normal attacks.
    { const toggle = page.locator('.statistics-skill-toggle').first(); check(await page.locator('.statistics-skills li').count() === 0, 'SKILL_SPLIT_DEFAULT_HIDDEN'); await toggle.click(); await page.waitForTimeout(200);
      const rows = await page.locator('.statistics-skills li').count(); check(rows >= 1 && /ซ่อนสกิล/.test(await toggle.innerText()), 'SKILL_SPLIT_' + rows); await sheetShot('boss-statistics-skills-390');
      checks.push(`Statistics per-skill split: hidden by default, "แสดงสกิล" lists ${rows} skill row(s) for the top member`); }
    check(await page.evaluate(() => getComputedStyle(document.querySelector('.statistics-tabs')).display === 'grid' && getComputedStyle(document.querySelector('.statistics-tabs button')).borderTopWidth === '0px'), 'STATISTICS_UNSTYLED'); await closeSheet();
    const won = await page.locator('.result-card.win').count(); check(won === 1, 'FIRST_BOSS_NOT_WON');
    await page.getByRole('button', { name: 'รับรางวัล', exact: true }).click(); await settle(); saved = await row(); check(saved.state.story.cleared_stage_ids.includes('1-1') && !saved.state.pending_rewards.some(c => c.kind === 'story'), 'STORY_REWARD_NOT_CLAIMED');
    await page.getByRole('button', { name: 'กลับไปฟาร์ม', exact: true }).click(); await page.waitForFunction(() => !!document.querySelector('.field-arena[data-farm-stage]'), null, { timeout: 20000 });
    checks.push('Challenge button starts real Story 1-1; boss HUD/party strip render; result card claims the first-clear reward once and returns to farm');

    stage = 'AFK_STAGE';
    // User case: win the next boss but leave its rewards; the win also settles the farm window into a separate claim.
    await page.waitForTimeout(1500); await page.locator('.challenge-btn').click(); await page.locator('.result-card').waitFor({ timeout: 100000 }); await settle();
    await page.getByRole('button', { name: 'กลับไปฟาร์ม', exact: true }).click(); await page.waitForFunction(() => !!document.querySelector('.field-arena[data-farm-stage]'), null, { timeout: 20000 });
    const leftover = (await row()).state.pending_rewards.length; await page.waitForTimeout(2000);
    await page.locator('.afk-chest').click({ force: true }); await sheetShot('afk-sheet-390');
    const before = (await row()).state.wallet.gold; await page.getByRole('button', { name: 'รับทั้งหมด', exact: true }).click(); await page.waitForFunction(() => !document.querySelector('dialog.sheet[open] .waiting-box'), null, { timeout: 30000 }); await settle();
    saved = await row(); check(saved.state.pending_rewards.length === 0 && saved.state.wallet.gold > before, 'COLLECT_ALL_LEFT_CLAIMS');
    checks.push(`AFK "รับทั้งหมด" reserved the latest farm window and collected all ${leftover}+ waiting claims (boss-win settlement and story reward included)`);
    await closeSheet(); await page.getByRole('button', { name: 'ตั้งค่า', exact: true }).click(); await page.locator('.volume-row').first().waitFor();
    await page.getByLabel('ระดับเสียงเอฟเฟกต์', { exact: true }).fill('35'); await sheetShot('settings-volume-390');
    check(await page.evaluate(() => JSON.parse(localStorage.getItem('ro-idle.audio-levels.v1') ?? 'null')?.effects === 0.35), 'VOLUME_NOT_SAVED'); checks.push('Settings has music/effects sliders that apply and persist (effects 35%)'); await closeSheet();
    await page.locator('.stage-chip').click(); await page.locator('.stage-grid').waitFor(); await sheetShot('stage-sheet-390'); await closeSheet();

    stage = 'BUDDY';
    await page.locator('.bottom-bar').getByRole('button', { name: /ตัวละคร/ }).click(); await page.locator('.buddy-page').waitFor(); await page.waitForTimeout(700); await shot('buddy-390');
    check(await page.locator('.gear-col').first().locator('.gear-tile').count() === 3 && await page.locator('.gear-col').last().locator('.gear-tile').count() === 3, 'GEAR_LAYOUT');
    check(await page.locator('.roster-card').count() === 7, 'ROSTER_STRIP');
    // Team members come first in team order, each with the green in-team frame (user request, 21 Oct 2026).
    { const teamIds = (await row()).state.team.map(p => p.character_id), cards = await page.locator('.roster-card').evaluateAll(nodes => nodes.map(n => n.classList.contains('in-team')));
      check(cards.slice(0, teamIds.length).every(Boolean) && !cards.slice(teamIds.length).some(Boolean), 'ROSTER_TEAM_FIRST_' + cards.map(c => c ? 'T' : '.').join(''));
      checks.push(`Character strip lists the ${teamIds.length} team members first with a green frame`); }
    check(await page.evaluate(() => { const frame = document.querySelector('.game-frame').getBoundingClientRect(); return [...document.querySelectorAll('.roster-card')].every(card => { const r = card.getBoundingClientRect(); return r.width > 40 && r.left >= frame.left - 1 && r.right <= frame.right + 1; }); }), 'ROSTER_CARD_OVERFLOW'); checks.push('All seven roster cards fit inside the portrait frame (4+3 grid, no clipped side strip)');
    saved = await row(); check(saved.state.roster.every(a => Object.values(a.equipment).every(id => id === null)) && saved.state.inventory.every(i => !String(i.instance_id).startsWith('starter_')), 'D059_STARTER_GEAR_PRESENT');
    await page.locator('.gear-tile').first().click(); await page.locator('.slot-summary').waitFor(); await sheetShot('slot-sheet-390');
    await page.getByRole('button', { name: /อัปเกรด/ }).click(); await page.locator('.seg').waitFor(); await sheetShot('slot-upgrade-390');
    const refine = page.getByRole('button', { name: /^Refine \+1$/ }); if (await refine.isEnabled()) { await refine.click(); await settle(); saved = await row(); check(saved.state.roster.find(a => a.character_id === 'main').slot_progress.weapon.refine === 1, 'REFINE_FAILED'); checks.push('Gear slot › Upgrade › Refine +1 commits on the real save'); }
    await closeSheet(); await page.locator('.gear-tile').first().click(); await page.getByRole('button', { name: /เปลี่ยน/ }).click(); await page.locator('.item-list').waitFor(); await sheetShot('slot-change-390');
    await page.locator('.buy-box button').click(); await settle(); saved = await row(); const training = saved.state.inventory.find(i => i.training); check(!!training, 'TRAINING_WEAPON_PURCHASE');
    await page.locator('.item-list .list-row', { hasText: 'ฝึกหัด' }).first().click(); await page.locator('.list-detail .btn.primary').click(); await settle(); saved = await row();
    check(saved.state.roster.find(a => a.character_id === 'main').equipment.weapon === training.instance_id, 'TRAINING_WEAPON_EQUIP'); await page.waitForFunction(() => !document.querySelector('dialog.sheet[open]')); await page.waitForTimeout(400); await shot('buddy-equipped-390');
    checks.push('D-059: a new account starts with every slot empty, buys the 125-gold training weapon and equips it from the slot sheet');
    await page.getByRole('button', { name: /Upgrade/ }).click(); await page.locator('.level-jump').first().waitFor(); await sheetShot('character-upgrade-390');
    const levelUp = page.getByRole('button', { name: 'อัป +1', exact: true }); if (await levelUp.isEnabled()) { await levelUp.click(); await settle(); saved = await row(); check(saved.state.roster.find(a => a.character_id === 'main').level === 2, 'LEVEL_UP_FAILED'); checks.push('Character Upgrade sheet levels the main character with the shown cost'); }
    await closeSheet();

    stage = 'STATS';
    await page.getByRole('button', { name: /Stats/ }).click(); await page.locator('.stats-page').waitFor(); await page.waitForTimeout(300); await shot('stats-390');
    check(await page.evaluate(() => { const layer = document.querySelector('.page-layer'); return layer.scrollHeight <= layer.clientHeight + 4; }), 'STATS_NEEDS_SCROLL'); checks.push('Stats page fits 390×844 without scrolling (additional stats collapsed)');
    const plus = page.getByRole('button', { name: /^เพิ่ม INT/ }); if (await plus.isEnabled()) { const before = (await row()).state.roster.find(a => a.character_id === 'main').primary_stats.int; await plus.click(); await page.waitForTimeout(150); await shot('stats-draft-390'); await page.getByRole('button', { name: /^ยืนยัน/ }).click(); await settle(); saved = await row(); check(saved.state.roster.find(a => a.character_id === 'main').primary_stats.int === before + 1, 'STATUS_ALLOCATE_FAILED'); checks.push('Stats page previews base/additional stat changes and allocates INT'); }
    await page.locator('.page-head .back-btn').click(); await page.locator('.buddy-page').waitFor();

    stage = 'SKILLS';
    await page.getByRole('button', { name: /Skill/ }).click(); await page.locator('.skills-page').waitFor(); await page.waitForTimeout(500); await shot('skills-390');
    check(await page.locator('.loadout-slot').count() === 4, 'FOUR_SLOTS');
    await page.locator('.loadout-timeline').click(); await page.locator('dialog.skill-preview .timeline-row').first().waitFor({ timeout: 20000 }); await page.waitForTimeout(600); await shot('skills-timeline-390');
    check(await page.locator('dialog.skill-preview .timeline-row').count() >= 4, 'SKILL_TIMELINE_ROWS');
    const interrupter = page.locator('dialog.skill-preview .timeline-entry.did-interrupt').first();
    if (await interrupter.count()) { await interrupter.locator('button').evaluate(node => node.scrollIntoView({ block: 'center', inline: 'center' })); await page.waitForTimeout(300); await shot('skills-timeline-interrupt-390'); checks.push('Timeline marks a successful interrupt with ⚡ (screenshot, D-060)'); } checks.push('Skills page opens the draft-rotation Timeline for the whole team in a sheet');
    await closeSheet();
    await page.locator('.page-head .back-btn').click();

    stage = 'BACKPACK_TEAM';
    await page.locator('.bottom-bar').getByRole('button', { name: /กระเป๋า/ }).click(); await page.locator('.backpack-page').waitFor(); await page.waitForTimeout(500); await shot('backpack-390');
    check(await page.locator('.bag-cell .e-badge').count() >= 1, 'EQUIPPED_BADGE_MISSING');
    await page.locator('.bag-cell:not(.empty)').first().click(); await page.locator('dialog.sheet[open] .action-grid').waitFor(); await sheetShot('item-sheet-390'); await closeSheet();
    await page.locator('.bottom-bar').getByRole('button', { name: /^ทีม/ }).click(); await page.locator('.team-page').waitFor(); await page.waitForTimeout(500); await shot('team-390');
    check(await page.locator('.formation-pad').count() === 4, 'FORMATION');
    await page.locator('.bottom-bar').getByRole('button', { name: /^ทีม/ }).click(); await page.waitForFunction(() => !document.querySelector('.page-layer'));
    await page.locator('.bottom-bar').getByRole('button', { name: /ดันเจี้ยน/ }).click(); await page.locator('.dungeon-page').waitFor(); await page.waitForTimeout(300); await shot('dungeon-390'); check(await page.locator('.dungeon-card').count() === 2, 'DUNGEON_HUB'); await page.locator('.page-head .back-btn').click();
    checks.push('Backpack grid marks worn gear with [E]; item sheet, team formation and tab-toggle back to home work');

    }
    stage = 'MODES';
    // Seed Story progress through 2-10 as a new server-signed revision (isolated stack only), then play Tower and Daily through the UI.
    { const saved = await row(), state = structuredClone(saved.state), next = saved.revision + 1, stages = require(path.join(root, 'plan/data/stages.json')).stages;
      // Through 3-4, so the next boss is the D-067 heavy-cast stage 3-5.
      state.story.cleared_stage_ids = stages.slice(0, 24).map(s => s.id); state.wallet.gold += 50000; state.wallet.crystal += 1600; state.wallet.skill_manual += 100;
      const signed = JSON.parse(require('node:child_process').execFileSync(process.execPath, ['--import', 'tsx', path.join(root, 'scripts/game/sign-test-save.ts')], { input: JSON.stringify({ account_id: uid, revision: next, state }), cwd: root, env: process.env }).toString());
      const history = await admin.from('game_save_history').insert({ account_id: uid, revision: next, state, state_hash: signed.state_hash, signature: signed.signature, key_version: 1 }); check(!history.error, 'SEED_HISTORY_FAILED:' + history.error?.message);
      const update = await admin.from('game_saves').update({ revision: next, state, state_hash: signed.state_hash }).eq('account_id', uid).eq('revision', saved.revision); check(!update.error, 'SEED_SAVE_FAILED:' + update.error?.message); }
    await page.goto(base + '/play?v=dungeon'); await ready(); await page.locator('.dungeon-page').waitFor(); await page.locator('.dungeon-card').first().click(); await page.locator('.tower-page .tower-hero').waitFor(); await page.waitForTimeout(400); await shot('tower-390');
    await page.locator('.tower-go').click(); await page.locator('.boss-intro').waitFor(); await shot('tower-intro-390'); await page.locator('.field-arena.boss').waitFor({ timeout: 20000 });
    check((await page.locator('.boss-name span').innerText()).includes('ชั้น 1'), 'TOWER_TAG'); await page.waitForTimeout(1500); await shot('tower-fight-390');
    await page.locator('.result-card').waitFor({ timeout: 120000 }); await shot('tower-result-390'); saved = await row();
    check(saved.state.tower.highest_cleared_floor === 1 && saved.state.pending_rewards.some(c => c.claim_id === 'tower_1'), 'TOWER_FIRST_CLEAR');
    await page.locator('.result-card').getByRole('button', { name: 'รับรางวัล' }).click(); await settle(); saved = await row(); check(!saved.state.pending_rewards.some(c => c.claim_id === 'tower_1'), 'TOWER_CLAIM');
    checks.push('Tower (TASK-035): seeded 2-10 progress unlocks the Tower page; floor 1 is fought through the real API/DB, pays its first clear once and the reward is claimed');
    await page.locator('.result-card').getByRole('button', { name: /กลับหอคอย/ }).click(); await page.locator('.tower-page').waitFor(); await page.goto(base + '/play?v=daily'); await ready(); await page.locator('.daily-card').first().waitFor(); await page.waitForTimeout(400); await shot('daily-390');
    check(await page.locator('.daily-card').count() === 3, 'DAILY_CARDS');
    await page.locator('.daily-card').first().getByRole('button', { name: 'ท้าบอส' }).click(); await page.locator('.field-arena.boss').waitFor({ timeout: 20000 }); await page.waitForTimeout(2000); await shot('daily-fight-390');
    check((await page.locator('.boss-name span').innerText()).includes('หลอดที่'), 'DAILY_PHASE_TAG');
    // Diagnostics: follow the server-side battle until it settles (or report where it stopped).
    { const trail = []; for (let i = 0; i < 40; i++) { const r = await row(), cp = await admin.from('game_battle_checkpoints').select('payload').eq('account_id', uid).maybeSingle(), receipt = await admin.from('game_command_receipts').select('receipt').eq('account_id', uid).order('created_at', { ascending: false }).limit(1).maybeSingle();
        trail.push(`${r.revision}:${r.state.active_battle ? 'active' : 'none'}:${cp.data?.payload?.game_time_ms ?? '-'}:${receipt.data?.receipt?.result?.code ?? '-'}`); if (!r.state.active_battle) break; await page.waitForTimeout(3000); }
      if (!(await page.locator('.result-card').count())) { await page.waitForTimeout(3000); }
      if (!(await page.locator('.result-card').count())) { await shot('daily-stuck-390'); throw new Error('DAILY_RESULT_MISSING ' + trail.slice(-3).join(' | ') + ' pending_api=' + [...api.values()].join(',') + ' save=' + (await page.locator('.hud-save').getAttribute('class')) + ' ui=' + (await page.locator('.field-toast, .field-error, [role=alert]').allInnerTexts()).join('/')); } }
    await shot('daily-result-390'); saved = await row();
    const daily = saved.state.daily_records.find(r => r.boss_id === 'treasury'); check(daily && daily.attempts_used === 1, 'DAILY_ATTEMPT_RESERVED');
    checks.push(`Daily (TASK-036): three boss cards; a 60s treasury attempt through the real API/DB reserves 1 attempt, keeps phase ${daily.phase} HP ${daily.current_hp} and ${daily.rewarded_phases.length} chest(s)`);
    await page.locator('.result-card').getByRole('button', { name: /กลับดันเจี้ยน/ }).click(); await page.locator('.daily-page').waitFor(); await page.waitForTimeout(300); await shot('daily-after-390');
    await page.goto(base + '/play'); await ready();

    stage = 'STORE';
    await page.locator('.bottom-bar').getByRole('button', { name: /ร้านค้า/ }).click(); await page.locator('.store-page').waitFor(); await page.waitForTimeout(400); await shot('store-shop-390');
    let shopBefore = await row(); await page.locator('.shop-offer').first().locator('button').click(); await settle(); saved = await row();
    const offer = require(path.join(root, 'plan/data/economy.json')).shop.offers[0];
    check(saved.state.wallet.hero_exp === shopBefore.state.wallet.hero_exp + offer.grant.hero_exp && saved.state.wallet.gold === shopBefore.state.wallet.gold - offer.price.gold && saved.state.shop.purchases[offer.id] === 1, 'SHOP_BUY');
    await page.getByRole('tab', { name: 'สุ่มการ์ด' }).click(); await page.locator('.gacha-banner.cards').waitFor(); shopBefore = await row();
    await page.getByRole('button', { name: /^สุ่ม 1 / }).click(); await page.locator('.gacha-card').first().waitFor(); await page.waitForTimeout(600); await shot('store-cards-390'); saved = await row();
    check(saved.state.wallet.crystal === shopBefore.state.wallet.crystal - 100 && saved.state.inventory.filter(i => i.kind === 'card').length === shopBefore.state.inventory.filter(i => i.kind === 'card').length + 1, 'CARD_PULL');
    await page.getByRole('tab', { name: 'สุ่มอุปกรณ์' }).click(); await page.locator('.gacha-banner.gear').waitFor(); shopBefore = await row();
    await page.getByRole('button', { name: /^สุ่ม 10 / }).click(); await page.locator('.gacha-card').nth(9).waitFor(); await page.waitForTimeout(1200); await shot('store-gear-390'); saved = await row();
    const pulled = saved.state.inventory.filter(i => i.kind === 'equipment' && !shopBefore.state.inventory.some(b => b.instance_id === i.instance_id));
    const lines = require(path.join(root, 'plan/data/equipment.json')).random_options.lines_by_rarity;
    check(pulled.length === 10 && pulled.every(i => i.options.length === lines[i.rarity_id]) && saved.state.wallet.crystal === shopBefore.state.wallet.crystal - 1500, 'GEAR_PULL');
    checks.push(`Store (TASK-051/037): the unlocked Store tab buys a daily offer, pulls 1 card and 10 gear through the real API/DB (${pulled.map(i => i.rarity_id[0]).join('')}) with D-062 option lines per rarity`);
    await page.locator('.bottom-bar').getByRole('button', { name: /กระเป๋า/ }).click(); await page.locator('.backpack-page').waitFor();
    const optioned = pulled.find(i => i.options.length >= 2) ?? pulled[0]; await page.locator(`.bag-cell[data-id="${optioned.instance_id}"]`).first().click({ timeout: 3000 });
    await page.locator('dialog.sheet[open]').waitFor(); await page.waitForTimeout(400); await sheetShot('gear-options-390'); check(await page.locator('dialog.sheet[open] .option-lines span').count() >= 1, 'OPTION_LINES_SHOWN'); await closeSheet();
    checks.push('Backpack item sheet shows the rolled ✦ option lines (D-062)');
    // D-071: Rarity/Level filters narrow the grid and "select" for bulk salvage picks only the filtered, unworn, unlocked gear.
    { const chip = page.locator('.filter-row.sub .rarity-chip').first(), rarity = (await chip.getAttribute('class')).split(' ').find(c => c.startsWith('rarity-') && c !== 'rarity-chip').slice(7);
      await chip.click(); await page.waitForTimeout(200);
      const cells = await page.locator('.bag-cell:not(.empty):not(.card)').evaluateAll(nodes => nodes.map(n => n.className));
      check(cells.length > 0 && cells.every(c => c.includes('rarity-' + rarity)) && !(await page.locator('.bag-cell.card').count()), 'BAG_RARITY_FILTER_' + rarity);
      await page.getByRole('button', { name: 'ย่อยหลายชิ้น' }).click(); const pick = page.getByRole('button', { name: /^เลือกที่กรอง/ }); const now = (await row()).state, worn = new Set(now.roster.flatMap(a => Object.values(a.equipment))), expected = now.inventory.filter(i => i.kind === 'equipment' && i.rarity_id === rarity && !i.locked && !worn.has(i.instance_id)).length;
      check(new RegExp(`\\(${expected}\\)`).test(await pick.innerText()), 'BAG_FILTER_SELECT_COUNT'); await page.getByRole('button', { name: 'เสร็จ' }).click(); await shot('backpack-filter-390');
      checks.push(`Backpack Rarity filter (${rarity}) shows only that rarity, hides cards, and bulk "เลือกที่กรอง" counts ${expected} salvageable items`); }
    await page.goto(base + '/play'); await ready();

    stage = 'FLOW_039';
    // TASK-039 AC-01: upgrade a skill and re-order the queue from the Skills page; swap a teammate from the Team page.
    await page.goto(base + '/play?v=buddy'); await ready(); await page.getByRole('button', { name: /Upgrade/ }).click(); await page.locator('.level-jump').first().waitFor();
    const hi = page.locator('dialog.sheet[open] .hi-class'); check(await hi.count() === 1 && await hi.isDisabled() && /เร็วๆ นี้/.test(await hi.innerText()), 'HI_CLASS_NOT_MARKED'); await hi.scrollIntoViewIfNeeded(); await sheetShot('flow-hiclass-390');
    await page.getByRole('button', { name: /^อัปถึง Lv\./ }).click(); await settle(); saved = await row(); const flowLevel = saved.state.roster.find(a => a.character_id === 'main').level; check(flowLevel >= 6, 'BULK_LEVEL_UI_' + flowLevel); await closeSheet();
    await page.goto(base + '/play?v=skills'); await ready(); await page.locator('.skills-page').waitFor(); let flowBefore = await row(); const mainBefore = flowBefore.state.roster.find(a => a.character_id === 'main');
    await page.getByRole('button', { name: 'อัปเกรด', exact: true }).click(); await settle(); saved = await row(); const firstSkill = mainBefore.active_slots[0];
    check(saved.state.roster.find(a => a.character_id === 'main').skill_levels[firstSkill] === mainBefore.skill_levels[firstSkill] + 1, 'SKILL_UPGRADE_UI');
    // Skill-first flow (user, 21 Oct 2026): tap the skill → ย้ายช่อง/สวมใส่ → tap the slot; it saves immediately.
    await page.locator('.skill-row').nth(1).click(); await page.getByRole('button', { name: /^ย้ายช่อง|^สวมใส่/ }).click(); await page.locator('.loadout.picking .loadout-slot.target').first().waitFor(); await shot('flow-skill-pick-390'); await page.getByRole('button', { name: 'ช่องสกิล 3', exact: true }).click(); await settle(); saved = await row();
    check(JSON.stringify(saved.state.roster.find(a => a.character_id === 'main').active_slots) === JSON.stringify([mainBefore.active_slots[0], null, mainBefore.active_slots[1], null]), 'LOADOUT_UI:' + JSON.stringify(saved.state.roster.find(a => a.character_id === 'main').active_slots)); await shot('flow-skills-390');
    await page.goto(base + '/play?v=team'); await ready(); await page.locator('.team-page').waitFor(); await page.locator('.formation-pad', { hasText: 'ไคล์' }).click(); await page.locator('dialog.sheet[open] .pick-list').waitFor();
    await page.locator('dialog.sheet[open] .list-row', { hasText: 'นิกซ์' }).click(); await page.getByRole('button', { name: 'บันทึกทีม', exact: true }).click(); await settle(); saved = await row();
    check(saved.state.team.some(p => p.character_id === 'npc_thief') && !saved.state.team.some(p => p.character_id === 'npc_swordsman'), 'TEAM_SWAP_UI'); await shot('flow-team-390');
    checks.push(`Flow (TASK-039 AC-01): Upgrade sheet bulk-levels the main to Lv.${flowLevel}; Skills page upgrades a skill and saves a re-ordered queue; Team page swaps Kyle out for Nix — each through the real API/DB`);
    // AC-04: Hi-class is visibly not open yet; keyboard focus is visible on game buttons.
    await page.goto(base + '/play'); await ready(); await page.locator('body').click({ position: { x: 5, y: 400 } }); let focused = null;
    for (let i = 0; i < 12 && !focused; i++) { await page.keyboard.press('Tab'); focused = await page.evaluate(() => { const el = document.activeElement; if (!el || el.tagName !== 'BUTTON' || !el.matches(':focus-visible')) return null; const st = getComputedStyle(el); return st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) >= 2 ? el.className || el.tagName : null; }); }
    check(focused, 'KEYBOARD_FOCUS_NOT_VISIBLE'); await shot('flow-focus-390');
    checks.push(`Hi-class shows "เร็วๆ นี้" disabled in the Upgrade sheet; Tab reaches a game button with a visible 3px focus ring (${focused}) (TASK-039 AC-04)`);
    // AC-03: disconnected → cloud status turns red, spending actions are disabled and nothing reaches the save; reconnect restores ready.
    await page.goto(base + '/play?v=store'); await ready(); await page.locator('.store-page').waitFor(); const offlineBefore = await row();
    await context.setOffline(true); await page.locator('.hud-alert').waitFor({ timeout: 5000 }); check(await page.locator('.hud-save.bad').count() === 1, 'OFFLINE_STATUS');
    const buys = page.locator('.shop-offer button'); let enabled = 0; for (let i = 0; i < await buys.count(); i++) if (await buys.nth(i).isEnabled()) enabled++; check(enabled === 0, 'OFFLINE_BUY_ENABLED_' + enabled);
    await buys.first().click({ force: true }).catch(() => {}); await page.waitForTimeout(1200); await shot('flow-offline-390');
    check((await row()).revision === offlineBefore.revision, 'OFFLINE_WROTE_SAVE');
    await context.setOffline(false); await ready(); check(!(await page.locator('.hud-alert').count()), 'RECONNECT_ALERT_STUCK');
    checks.push('Offline (TASK-039 AC-03): the HUD shows the disconnected state, every shop button is disabled, a forced click writes nothing, and going online restores the ready save');
    await page.goto(base + '/play'); await ready();

    stage = 'HEAVY_067';
    // D-067: the next boss (3-5) opens with the interruptible Cataclysm — the intro warns, the boss bar shows a heavy cast track.
    await page.goto(base + '/play'); await ready(); check((await page.locator('.challenge-btn small').innerText()).trim() === '3-5', 'HEAVY_NEXT_STAGE');
    await page.locator('.challenge-btn').click(); await page.locator('.boss-intro .intro-hint').waitFor({ timeout: 5000 }); const heavyHint = await page.locator('.boss-intro .intro-hint').innerText(); check(/สตั้น|ขัด/.test(heavyHint), 'HEAVY_INTRO_HINT'); await shot('heavy-intro-390');
    await page.locator('.boss-cast.heavy').waitFor({ timeout: 25000 }); await page.waitForTimeout(500); await shot('heavy-cast-390');
    check(/ขัดร่ายได้/.test(await page.locator('.boss-cast.heavy').innerText()) && await page.locator('.boss-cast.heavy .cast-track i').count() === 1, 'HEAVY_CAST_BAR');
    // D-071 fast-forward: 1× → 2× → 4×; the saved fight (server-credited) runs well over twice the wall clock, then back to 1×.
    // D-071 fast-forward at 2×: sample the saved (server-credited) fight clock until it ends or 3 s pass; the low-level team
    // may fall to Cataclysm quickly, so require ≥0.8 s of live samples rather than a fixed window. Then restore 1× by reload.
    { const speed = page.locator('.boss-tools .chip-btn.speed'); await speed.click(); check((await speed.innerText()).includes('2×'), 'SPEED_LABEL');
      const sample = () => page.evaluate(() => { const n = document.querySelector('.field-arena.boss'); return n ? { ms: Number(n.dataset.gameMs), live: n.dataset.terminal === '', at: performance.now() } : null; });
      const first = await sample(); let last = first; for (let i = 0; i < 30; i++) { await page.waitForTimeout(100); const s = await sample(); if (!s || !s.live) break; last = s; }
      const span = last.at - first.at, ratio = (last.ms - first.ms) / Math.max(1, span); await shot('speed-2x-390');
      check(span >= 800 && ratio >= 1.6, `SPEED_RATIO_${ratio.toFixed(2)}_OVER_${Math.round(span)}MS`);
      await page.evaluate(() => localStorage.setItem('ro.battleSpeed', '1'));
      checks.push(`Speed button (D-071): 2× ran the server-credited 3-5 fight at ${ratio.toFixed(2)}× wall time over ${Math.round(span)} ms`); }
    await page.locator('.boss-tools .chip-btn.danger').click({ timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => !!document.querySelector('.field-arena[data-farm-stage]') || !!document.querySelector('.result-card'), null, { timeout: 30000 });
    if (await page.locator('.result-card').count()) { const back = page.locator('.result-card').getByRole('button', { name: /กลับไปฟาร์ม/ }); if (await back.count()) await back.click(); }
    await ready(); checks.push(`Heavy cast (D-067/D-074): stage 3-5 intro names the boss's heavy cast ("${heavyHint.slice(0, 40)}") and the boss bar shows its red interruptible cast track`);

    stage = 'RESET_SHORTCUT';
    // D-071: Settings has a direct "รีเซ็ตเซฟ" button that opens the start-over form (backup-first flow unchanged; not submitted here).
    await page.locator('.hud-actions').getByRole('button', { name: 'ตั้งค่า' }).click(); await page.getByRole('button', { name: /รีเซ็ตเซฟ/ }).click();
    await page.locator('.danger-zone[open] .reset-form').waitFor({ timeout: 5000 }); await sheetShot('reset-shortcut-390'); await closeSheet();
    checks.push('Settings → "รีเซ็ตเซฟ · เริ่มเกมใหม่" opens the typed-RESET start-over form directly');

    stage = 'BACKUP_040';
    // TASK-040: export the signed tip, preview it, reset (backed up first) and undo it, then recover a quarantined
    // save and migrate an older-content save — every write through the real API/DB, nothing uploaded from the file.
    { const signTest = input => JSON.parse(require('node:child_process').execFileSync(process.execPath, ['--import', 'tsx', path.join(root, 'scripts/game/sign-test-save.ts')], { input: JSON.stringify(input), cwd: root, env: process.env }).toString());
      const backups = async () => { const r = await admin.from('game_save_backups').select('reason,revision,content_hash,signature').eq('account_id', uid).order('created_at', { ascending: true }); check(!r.error, 'BACKUP_READ_FAILED'); return r.data; };
      const openBackup = async () => { await page.getByRole('button', { name: 'ตั้งค่า' }).click(); await page.getByRole('button', { name: /สำรอง \/ กู้คืนเซฟ/ }).click(); await page.locator('.backup-sheet').waitFor(); await page.waitForTimeout(300); };
      await page.goto(base + '/play'); await ready(); await openBackup(); const original = await row();
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'ดาวน์โหลดไฟล์สำรอง', exact: true }).click()]);
      const folder = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'ro-backup-')), file = path.join(folder, download.suggestedFilename()); await download.saveAs(file);
      const exported = JSON.parse(fs.readFileSync(file, 'utf8')), raw = fs.readFileSync(file, 'utf8');
      check(exported.format === 'ro-idle-classic-backup' && exported.save.revision === original.revision && exported.save.state_hash === original.state_hash && exported.save.signature && !/access_token|refresh_token|password|@example/.test(raw), 'EXPORT_FILE');
      await page.locator('.backup-sheet input[type=file]').setInputFiles(file); await page.locator('.backup-inspect.ok').waitFor(); check(/ตรงกับเซฟบนคลาวด์ตอนนี้/.test(await page.locator('.backup-inspect').innerText()), 'IMPORT_PREVIEW'); await shot('backup-sheet-390');
      check((await row()).revision === original.revision, 'IMPORT_WROTE');
      await page.locator('.danger-zone summary').click(); await page.getByRole('button', { name: 'เริ่มเกมใหม่…' }).click(); await page.getByRole('radio', { name: /Archer/ }).click();
      check(await page.getByRole('button', { name: 'ลบและเริ่มใหม่' }).isDisabled(), 'RESET_NOT_GUARDED'); await page.getByLabel('พิมพ์ RESET เพื่อยืนยัน').fill('RESET'); await page.locator('.danger-zone').scrollIntoViewIfNeeded(); await shot('backup-reset-390');
      await page.getByRole('button', { name: 'ลบและเริ่มใหม่' }).click(); await settle(); saved = await row(); let stored = await backups();
      check(saved.revision === original.revision + 1 && saved.state.roster.find(a => a.character_id === 'main').job_id === 'archer' && saved.state.story.cleared_stage_ids.length === 0 && stored.length === 1 && stored[0].reason === 'reset' && stored[0].revision === original.revision && stored[0].signature, 'RESET_BACKED_UP');
      await page.locator('.backup-list li.restorable').getByRole('button', { name: 'กู้คืน', exact: true }).click(); await page.locator('.backup-sheet .summary-table').waitFor(); await page.waitForTimeout(300); await shot('backup-restore-confirm-390');
      await page.getByRole('button', { name: 'ยืนยันกู้คืน' }).click(); await settle(); saved = await row(); stored = await backups();
      check(saved.revision === original.revision + 2 && JSON.stringify(saved.state.roster) === JSON.stringify(original.state.roster) && JSON.stringify(saved.state.inventory) === JSON.stringify(original.state.inventory) && JSON.stringify(saved.state.wallet) === JSON.stringify(original.state.wallet) && stored.map(b => b.reason).join() === 'reset,restore', 'UNDO_RESET');
      await page.waitForFunction(() => document.querySelectorAll('.backup-list li').length === 2, null, { timeout: 10000 }).catch(() => {});
      check(!(await page.locator('.backup-list li.restorable').count()) && await page.locator('.backup-list li').count() === 2, 'RESET_BACKUP_REUSABLE'); await shot('backup-after-restore-390'); await closeSheet();
      checks.push(`Backup (TASK-040): exported signed tip #${original.revision} previews as "same as cloud" without writing; RESET (typed) backs up #${original.revision} then starts Archer Lv.1; undo restores roster/items/wallet exactly as #${original.revision + 2} and the reset backup cannot be reused`);
      // Quarantine: tamper the cloud row without re-signing → the client offers only the signed tip.
      // Leave the game first so no automatic command races the direct DB edits below.
      await page.goto('about:blank'); await page.waitForTimeout(800);
      const healthy = await row(), tampered = structuredClone(healthy.state); tampered.wallet.gold += 777777;
      check(!(await admin.from('game_saves').update({ state: tampered }).eq('account_id', uid).eq('revision', healthy.revision)).error, 'TAMPER_FAILED');
      await page.goto(base + '/play'); await page.locator('.maintenance-panel', { hasText: 'ตรวจสอบไม่ผ่าน' }).waitFor({ timeout: 20000 }); await page.waitForTimeout(300); await shot('backup-quarantine-390');
      await page.getByRole('button', { name: new RegExp(`^กู้คืนเซฟ #${healthy.revision}$`) }).click(); await ready(); saved = await row(); stored = await backups();
      check(saved.revision === healthy.revision + 1 && saved.state.wallet.gold === healthy.state.wallet.gold && stored.at(-1).reason === 'quarantine' && !stored.at(-1).signature, 'QUARANTINE_RECOVERY');
      checks.push('Recovery (TASK-040): a tampered cloud row fails integrity; the panel offers only the signed tip, the corrupt row is kept unsigned and the +777,777 gold edit is discarded');
      // Migration: an older-content save (no shop/options fields) is previewed and migrated after a backup.
      await page.goto('about:blank'); await page.waitForTimeout(800);
      const current = await row(), legacy = structuredClone(current.state), OLD = 'c'.repeat(64), next = current.revision + 1; delete legacy.shop; delete legacy.gacha.equipment_v1; for (const item of legacy.inventory) if (item.kind === 'equipment') delete item.options;
      const signedLegacy = signTest({ account_id: uid, revision: next, state: legacy, content_hash: OLD, legacy: true });
      { const inserted = await admin.from('game_save_history').insert({ account_id: uid, revision: next, state: legacy, state_hash: signedLegacy.state_hash, signature: signedLegacy.signature, key_version: 1 }); check(!inserted.error, 'LEGACY_HISTORY:' + inserted.error?.message); }
      check(!(await admin.from('game_saves').update({ revision: next, state: legacy, state_hash: signedLegacy.state_hash, content_hash: OLD }).eq('account_id', uid).eq('revision', current.revision)).error, 'LEGACY_SAVE');
      await page.goto(base + '/play'); await page.locator('.maintenance-panel', { hasText: 'อัปเดตเซฟเป็นรุ่นใหม่' }).waitFor({ timeout: 20000 }); await page.waitForTimeout(300); await shot('backup-migrate-390');
      await page.getByRole('button', { name: 'สำรองแล้วอัปเดตเซฟ' }).click(); await ready(); saved = await row(); stored = await backups();
      check(saved.revision === next + 1 && saved.content_hash !== OLD && saved.state.shop && saved.state.inventory.every(i => i.kind !== 'equipment' || Array.isArray(i.options)) && stored.at(-1).reason === 'migration' && stored.at(-1).content_hash === OLD && stored.at(-1).signature === signedLegacy.signature, 'MIGRATION_BACKED_UP');
      checks.push(`Migration (TASK-040): an older-content save #${next} shows a before/after preview, keeps its signed copy as a "migration" backup and becomes #${next + 1} on the current content`);
      fs.rmSync(folder, { recursive: true, force: true }); }
    await page.goto(base + '/play'); await ready();

    stage = 'VIEWPORTS';
    await page.locator('.bottom-bar').getByRole('button', { name: /คราฟต์/ }).click({ force: true }); await page.locator('.toast').waitFor(); check(!(await page.locator('.page-layer').count()), 'LOCKED_TAB_OPENED');
    for (const [w, h] of [[360, 740], [1280, 800]]) { await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(700); const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); check(!overflow, 'HORIZONTAL_OVERFLOW_' + w); await shot(`home-${w}`); }
    await page.goto(base + '/play?v=team'); await ready(); await page.locator('.formation-grid').waitFor(); await page.waitForTimeout(800); await shot('team-1280'); check(await page.locator('.formation-pad .class-icon').count() === 4, 'TEAM_CLASS_ICONS');
    await page.setViewportSize({ width: 360, height: 740 }); await page.goto(base + '/play?v=buddy'); await ready(); await page.waitForTimeout(800); await shot('buddy-360');
    for (const [name, options] of [['phone-landscape', { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ['phone-portrait', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
      const mobile = await browser.newContext(options), probe = await mobile.newPage(); await probe.goto(base + '/play'); await probe.locator('.game-root').waitFor({ state: 'attached' }); await probe.waitForTimeout(500);
      const shown = await probe.evaluate(() => getComputedStyle(document.querySelector('.rotate-lock')).display !== 'none' && getComputedStyle(document.querySelector('.game-root')).visibility === 'hidden');
      check(shown === (name === 'phone-landscape'), 'ROTATE_PROMPT_' + name); if (name === 'phone-landscape') { await probe.screenshot({ path: path.join(root, `docs/screenshots/${prefix}-rotate-844x390.png`) }); shots.push(`docs/screenshots/${prefix}-rotate-844x390.png`); } await mobile.close();
    }
    checks.push('Portrait only (D-052): a 844×390 touch phone sees the rotate prompt with the game hidden; 390×844 touch phone and desktop do not');
    checks.push('360×740 and 1280×800 render without horizontal overflow; locked Crafting shows a toast; deep link ?v=buddy opens the character page');
    stage = 'UI_AUDIT';
    // User report (21 Oct 2026): button labels breaking onto two lines and skill icons off-centre. Per page and width,
    // list every button whose single text node wraps, and measure slot-icon offset from the slot centre (evidence file).
    { const audit = [];
      for (const [w, h] of [[360, 740], [390, 844], [1280, 800]]) { await page.setViewportSize({ width: w, height: h });
        for (const view of ['home', 'skills', 'buddy', 'backpack', 'team', 'store', 'dungeon', 'daily', 'stats']) {
          await page.goto(base + '/play?v=' + view); await ready(); await page.waitForTimeout(600);
          const found = await page.evaluate(() => {
            const wrapped = [];
            for (const button of document.querySelectorAll('button, a.btn')) { const box = button.getBoundingClientRect(); if (!box.width || getComputedStyle(button).visibility === 'hidden') continue;
              const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT); let node;
              while ((node = walker.nextNode())) { if (!node.textContent.trim()) continue; const range = document.createRange(); range.selectNodeContents(node);
                const tops = new Set([...range.getClientRects()].filter(r => r.width > 1).map(r => Math.round(r.top / 4)));
                if (tops.size > 1) { wrapped.push({ text: button.innerText.replace(/\s+/g, ' ').trim().slice(0, 40), lines: tops.size, width: Math.round(box.width), cls: button.className.slice(0, 40) }); break; } } }
            const icons = [...document.querySelectorAll('.loadout-slot')].map(slot => { const img = slot.querySelector('.skill-icon'); if (!img) return null; const a = slot.getBoundingClientRect(), b = img.getBoundingClientRect();
              return { dx: Math.round((b.left + b.width / 2) - (a.left + a.width / 2)), dy: Math.round((b.top + b.height / 2) - (a.top + a.height / 2)), fill: Math.round(b.width / a.width * 100), natural: [img.naturalWidth, img.naturalHeight] }; }).filter(Boolean);
            return { wrapped, icons };
          });
          if (view === 'skills') await shot(`audit-skills-${w}`);
          audit.push({ width: w, view, ...found });
        } }
      fs.writeFileSync(path.join(root, `plan/evidence/${prefix}-ui-audit.json`), JSON.stringify(audit, null, 1) + '\n');
      const wraps = audit.flatMap(row => row.wrapped.map(b => `${row.width}/${row.view}: ${b.text}`)), offCentre = audit.flatMap(row => row.icons.filter(i => Math.abs(i.dx) > 2 || Math.abs(i.dy) > 2 || i.natural[0] !== i.natural[1]).map(i => `${row.width}/${row.view} ${i.dx},${i.dy} ${i.natural.join('x')}`));
      checks.push(`UI audit (360/390/1280 × 9 pages): ${wraps.length} wrapped button labels${wraps.length ? ' — ' + wraps.slice(0, 12).join(' | ') : ''}; ${offCentre.length} off-centre slot icons${offCentre.length ? ' — ' + offCentre.slice(0, 6).join(' | ') : ''}`);
      // Skill icons are cropped to their 24×24 sprite frame (atlas border/spare columns made them sit left of centre).
      check(!wraps.length && !offCentre.length, 'UI_AUDIT ' + [...wraps, ...offCentre].slice(0, 6).join(' | '));
      await page.setViewportSize({ width: 390, height: 844 }); }
    check(!errors.length, 'BROWSER_ERRORS:' + errors.slice(0, 3).join(' | '));
    const result = { passed: true, prefix, checks, screenshots: shots, browser_errors: errors.length, credentials_logged: false };
    fs.writeFileSync(path.join(root, `plan/evidence/${prefix}-shell-live.json`), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const result = { passed: false, prefix, stage, error: String(error.message).slice(0, 400), checks, screenshots: shots, browser_errors: errors.slice(0, 5) };
    fs.writeFileSync(path.join(root, `plan/evidence/${prefix}-shell-live.json`), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result, null, 2)); process.exitCode = 1;
  } finally { await browser?.close(); await admin.auth.admin.deleteUser(uid).catch(() => {}); }
})();
