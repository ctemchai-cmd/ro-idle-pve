// TASK-054 browser regression: real renderer + pack in Chrome. Skill shouts on every cast (instant Bash included),
// sky-falling bolts with native hit effects, native Lightning Bolt strikes, bow release on frame 7, RO-style arcing
// numbers, red incoming numbers on party members, monk fist pose cycle. Screenshots + evidence JSON only.
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), base = process.env.RO_PREVIEW_URL || 'http://127.0.0.1:5173', checks = [], errors = [];
const shots = path.join(root, 'docs/screenshots'), evidence = path.join(root, 'plan/evidence/task-054-presentation.json');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const page = await browser.newPage({ viewport: { width: 760, height: 1000 } });
  page.on('pageerror', error => errors.push(String(error))); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  const check = async (name, run) => { try { checks.push({ name, passed: true, detail: await run() }); } catch (error) { checks.push({ name, passed: false, error: String(error) }); } };
  await check('shouts_bolts_impacts_numbers_incoming', async () => {
    const result = await page.evaluate(async () => {
      const { AssetPack } = await import('/src/renderer/pack.ts'), { DemoSession } = await import('/src/client/demo.ts'), { BattleRenderer } = await import('/src/renderer/battle.ts');
      const pack = await AssetPack.open(), session = new DemoSession('boss', 2); await pack.prepare(session.scene, session.view().actors.flatMap(actor => actor.slots.filter(Boolean)));
      const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 820; document.body.append(canvas);
      const renderer = new BattleRenderer(canvas, pack, session.scene); renderer.selected = 'npc_mage';
      const keep = (id, at) => { const copy = document.createElement('canvas'); copy.id = id; copy.width = 720; copy.height = 820; copy.getContext('2d').drawImage(canvas, 0, 0); copy.dataset.at = at; document.body.append(copy); };
      const shouts = new Map(), impacts = new Map(), saved = new Set(), seen = {}, casts = [], shapes = new Set(); let incoming = 0, outgoing = 0, spearAbove = false;
      for (let ms = 25; ms <= 24000 && !session.state.terminal_result; ms += 25) {
        const events = session.advanceTo(ms); renderer.accept(events); renderer.draw(session.view(), ms);
        for (const event of events) if (event.type === 'cast_start') casts.push({ actor: event.actor_id, skill: event.skill_id, at: event.at_ms, cast_ms: event.cast_duration_ms });
        for (const shout of renderer.frameStats.shouts) { const key = shout.actor + ':' + shout.skill; shouts.set(key, (shouts.get(key) ?? 0) + 1); }
        for (const hit of renderer.frameStats.impacts) impacts.set(hit.meta.split('/').pop(), (impacts.get(hit.meta.split('/').pop()) ?? 0) + 1);
        for (const shot of renderer.frameStats.projectiles) shapes.add(shot.shape);
        incoming += renderer.frameStats.incoming.length; outgoing += renderer.frameStats.damage.length;
        // Keep frames a little after first sighting: the spear mid-fall, the strike just after it lands.
        const spearFrames = renderer.frameStats.projectiles.filter(shot => shot.shape === 'spear').length, strike = impacts.get([...impacts.keys()].find(k => k.startsWith('lightning--'))) ?? 0;
        if (spearFrames >= 2 && !saved.has('spear')) { seen.spear = (seen.spear ?? 0) + 1; if (seen.spear === 5) { saved.add('spear'); keep('fx-spear', ms); } }
        if (renderer.frameStats.impacts.some(hit => hit.meta.includes('lightning--')) && !saved.has('lightning') && strike >= 15) { saved.add('lightning'); keep('fx-lightning', ms); }
        if (renderer.frameStats.shouts.some(s => s.skill === 'swordsman_bash') && !saved.has('bash')) { saved.add('bash'); keep('fx-bash', ms); }
        if (renderer.frameStats.incoming.length && renderer.frameStats.damage.length && !saved.has('numbers')) { saved.add('numbers'); keep('fx-numbers', ms); }
      }
      const shoutMs = Object.fromEntries([...shouts].map(([key, frames]) => [key, frames * 25]));
      return { casts: casts.length, cast_skills: [...new Set(casts.map(c => c.skill))], shouts_ms: shoutMs, impacts: Object.fromEntries(impacts), shapes: [...shapes], incoming_frames: incoming, outgoing_frames: outgoing, saved: [...saved], instant: casts.filter(c => !c.cast_ms).map(c => c.skill).filter((v, i, a) => a.indexOf(v) === i) };
    });
    const unshouted = result.cast_skills.filter(skill => !Object.keys(result.shouts_ms).some(key => key.endsWith(':' + skill)));
    if (unshouted.length) throw new Error('Skills cast without a name shout: ' + unshouted.join(','));
    if (!(result.shouts_ms['main:swordsman_bash'] >= 1400)) throw new Error('Instant Bash shout missing or too short: ' + JSON.stringify(result.shouts_ms));
    for (const name of ['firehit1--', 'lightning--', 'hit--']) if (!Object.keys(result.impacts).some(key => key.startsWith(name))) throw new Error('Native impact not drawn: ' + name + ' ' + JSON.stringify(result.impacts));
    if (!result.shapes.includes('spear')) throw new Error('No falling bolt spear drawn');
    if (!result.incoming_frames || !result.outgoing_frames) throw new Error('Missing outgoing or incoming numbers');
    for (const id of ['fx-spear', 'fx-lightning', 'fx-bash', 'fx-numbers']) await page.locator('#' + id).screenshot({ path: path.join(shots, `presentation-${id.slice(3)}.png`) });
    return result;
  });
  await check('bow_arrow_leaves_on_release_frame_not_draw', async () => page.evaluate(async () => {
    const { AssetPack } = await import('/src/renderer/pack.ts'), { DemoSession } = await import('/src/client/demo.ts'), { BattleRenderer } = await import('/src/renderer/battle.ts'), { projectilePoint } = await import('/src/renderer/projectiles.ts');
    const pack = await AssetPack.open(), session = new DemoSession('boss', 2); await pack.prepare(session.scene, session.view().actors.flatMap(actor => actor.slots.filter(Boolean)));
    const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 820;
    const renderer = new BattleRenderer(canvas, pack, session.scene); renderer.selected = 'npc_archer';
    const shots = [];
    for (let ms = 10; ms <= 12000; ms += 10) {
      const events = session.advanceTo(ms); renderer.accept(events);
      for (const event of events) if (event.type === 'normal_attack' && event.actor_id === 'npc_archer') shots.push({ at: event.at_ms, first: null, release: Math.round(700 * renderer.animation.swing(event).rate) });
      renderer.draw(session.view(), ms);
      // Attribute each arrow to its own swing: overlapping volleys at high ASPD cannot mask a late/early release.
      for (const shot of shots) if (shot.first === null && renderer.frameStats.projectiles.some(row => row.source === 'npc_archer' && row.shape === 'arrow') && renderer.projectiles.some(cue => cue.source_id === 'npc_archer' && cue.at_ms === shot.at && projectilePoint(cue.spec, [0, 0], [1, 1], ms - cue.at_ms, 0))) shot.first = ms - shot.at;
    }
    const measured = shots.filter(shot => shot.first !== null);
    // Release frame 7 (700 ms of the 900 ms clip), scaled with the swing when attacks come faster than the clip.
    if (!measured.length || measured.some(shot => shot.first < shot.release || shot.first > shot.release + 20)) throw new Error('Arrow left before/after release frame 7: ' + JSON.stringify(measured));
    return { normal_attacks: shots.length, first_visible_after_swing_ms: measured.map(shot => shot.first), expected_release_ms: measured.map(shot => shot.release) };
  }));
  await check('monk_fist_pose_cycle', async () => page.evaluate(async () => {
    const { AssetPack } = await import('/src/renderer/pack.ts'), { DemoSession } = await import('/src/client/demo.ts'), { BattleRenderer } = await import('/src/renderer/battle.ts');
    const pack = await AssetPack.open(), session = new DemoSession('boss', 2); session.scene.actors.find(actor => actor.actor_id === 'main').job_id = 'monk';
    await pack.prepare(session.scene, session.view().actors.flatMap(actor => actor.slots.filter(Boolean)));
    const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 820;
    const renderer = new BattleRenderer(canvas, pack, session.scene), poses = [];
    for (let ms = 25; ms <= 15000; ms += 25) {
      const events = session.advanceTo(ms); renderer.accept(events); renderer.draw(session.view(), ms);
      for (const event of events) if (event.type === 'normal_attack' && event.actor_id === 'main') poses.push(renderer.animation.attackState(event));
    }
    if (new Set(poses).size < 3) throw new Error('Monk attacks do not cycle poses: ' + poses.join(','));
    return { monk_normal_attacks: poses.length, poses: poses.slice(0, 6), weapon: pack.index.actor_jobs.find(job => job.job_id === 'monk').presets[0].weapon.meta };
  }));
  const passed = checks.every(row => row.passed) && !errors.length;
  fs.writeFileSync(evidence, JSON.stringify({ task: 'TASK-054', base, passed, checks, errors, generated_at: new Date().toISOString() }, null, 1) + '\n');
  console.log(JSON.stringify({ passed, checks: checks.map(row => [row.name, row.passed, row.error ?? '']), errors }, null, 1));
  await browser.close(); process.exit(passed ? 0 : 1);
})();
