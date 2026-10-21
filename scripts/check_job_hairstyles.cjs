// Native renderer QA on the isolated Vite stack; no game commands or personal account.
const fs = require('node:fs'), path = require('node:path');
module.exports = async function checkJobHairstyles(page, root) {
  const previous = page.viewportSize(), screenshots = [];
  await page.setViewportSize({ width: 1000, height: 1100 });
  const report = await page.evaluate(async () => {
    const { AssetPack } = await import('/src/renderer/pack.ts');
    const { drawActor, actorFrame, actorAction, attachmentFrame } = await import('/src/renderer/native.mjs');
    const pack = await AssetPack.open(), rows = [], seen = { male: new Set(), female: new Set() };
    let frameSamples = 0, totalAttachments = 0;
    const probe = document.createElement('canvas'); probe.width = 220; probe.height = 220; const ctx = probe.getContext('2d');
    const pane = document.createElement('div'); pane.id = 'job-hairstyle-probe'; pane.style.cssText = 'position:fixed;inset:0;background:#edf3ff;z-index:100000;padding:12px;overflow:auto';
    const sheet = document.createElement('canvas'); sheet.width = 960; sheet.height = 1060; pane.append(sheet); document.body.append(pane); const art = sheet.getContext('2d'); art.imageSmoothingEnabled = false;
    const prepared = [];
    for (const job of pack.index.actor_jobs) for (const preset of job.presets) {
      const look = { job_id: job.job_id, gender: preset.gender, show_weapon: true };
      const parts = await pack.actor(look);
      if (!parts.head || parts.head.meta.id !== preset.head.id || seen[preset.gender].has(parts.head.meta.id)) throw new Error('WRONG_OR_DUPLICATE_HEAD:' + job.job_id);
      seen[preset.gender].add(parts.head.meta.id); prepared.push({ job: job.job_id, gender: preset.gender, parts, look });
      rows.push({ job: job.job_id, gender: preset.gender, head: parts.head.meta.id });
      for (const head_tier of [null, 20]) {
        const dressed = head_tier ? await pack.actor({ ...look, head_tier }) : parts;
        if (head_tier && !dressed.headgear) throw new Error('HAT_MISSING:' + job.job_id);
        for (const state of ['idle', 'walk', 'attack', 'hurt', 'dead']) {
          const action = actorAction(dressed, state);
          for (let index = 0; index < action.frames.length; index++) for (const facing of ['left', 'right']) {
            const time = (index + .25) * action.frame_duration_ms, frame = actorFrame(dressed, state, time);
            if (state === 'idle' && frame.index !== 0) throw new Error('IDLE_HEAD_CLOCK_CHANGED');
            for (const asset of [dressed.head, dressed.headgear].filter(Boolean)) {
              const selected = attachmentFrame(asset, frame.action, frame.frame, frame.index, state);
              if (!selected || !selected.offset.every(Number.isFinite) || !selected.frame.layers.length) throw new Error('INVALID_HEAD_ATTACHMENT:' + job.job_id);
              totalAttachments++;
            }
            ctx.clearRect(0, 0, 220, 220);
            if (drawActor(ctx, dressed, state, time, 110, 180, facing, 1.7) < 2) throw new Error('ACT_PARTS_NOT_DRAWN');
            frameSamples++;
          }
        }
      }
    }
    function paint(hats) {
      art.fillStyle = '#edf3ff'; art.fillRect(0, 0, sheet.width, sheet.height); art.fillStyle = '#203454'; art.textAlign = 'left'; art.font = 'bold 18px system-ui'; art.fillText(hats ? '36 job/gender presets · native hair + Tier 20 hats' : '36 job/gender presets · native human hairstyles', 10, 24);
      prepared.forEach((row, index) => {
        const x = index % 6 * 160 + 80, y = Math.floor(index / 6) * 170 + 160;
        const parts = hats ? row.hatParts : row.parts;
        drawActor(art, parts, 'idle', 0, x, y, 'right', 1.7);
        art.fillStyle = '#203454'; art.font = '12px system-ui'; art.textAlign = 'center'; art.fillText(row.job + ' · ' + row.gender[0].toUpperCase(), x, y + 22);
      });
    }
    for (const row of prepared) row.hatParts = await pack.actor({ ...row.look, head_tier: 20 });
    window.__hairProbePaint = paint; paint(false);
    window.__hairProbeDispose = () => { pane.remove(); pack.dispose(); delete window.__hairProbePaint; delete window.__hairProbeDispose; };
    return { jobs: pack.index.actor_jobs.length, presets: rows.length, unique_heads: seen.male.size + seen.female.size, frame_samples: frameSamples, attachments: totalAttachments, rows, states: ['idle', 'walk', 'attack', 'hurt', 'dead'], facings: ['left', 'right'], hat_tiers: [null, 20] };
  });
  for (const hats of [false, true]) {
    await page.evaluate(hats => window.__hairProbePaint(hats), hats);
    const file = 'docs/screenshots/task-057-' + (hats ? 'heads-with-hats' : 'job-hairstyles') + '.png';
    await page.screenshot({ path: path.join(root, file) }); screenshots.push(file);
  }
  await page.evaluate(() => window.__hairProbeDispose());
  await page.setViewportSize(previous);
  const result = { task_id: 'TASK-057', passed: true, ...report, screenshots, scope: 'All decoded native body-clock frames in five states, both facings, bare and Tier20 hats; contact sheets show idle only. Manual visual acceptance remains separate.' };
  fs.writeFileSync(path.join(root, 'plan/evidence/task-057-native-renderer.json'), JSON.stringify(result, null, 2) + '\n');
  return result;
};
