// TASK-030: Acolyte / Priest / Monk skills executed by the shared engine, runner and runtime.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import type { SkillDefinition } from '../../src/contracts/index.ts';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
import { locateSkillVisual } from '../../src/renderer/asset-locator.ts';
import { content, unwrap } from './combat-fixtures.ts';
import { advanceUntil, restoreBattle } from '../../src/domain/combat/index.ts';
import { castDurationMs } from '../../src/domain/math/index.ts';
import { buildAccount, buildActor as sharedBuildActor, checkDryTraces, checkGolden, goldens, probe, probeActive, probePassive, resolved, run, storyParity, treeData, type Build } from './class-skills.ts';

const tree = treeData('acolyte'), ids = tree.skills.map(skill => skill.id), build = (id: string) => tree.builds.find(row => row.id === id)!;
const actives = tree.skills.filter(skill => skill.kind === 'active'), passives = tree.skills.filter(skill => skill.kind === 'passive');
const buildActor = (row: Build, id: string, position: string) => sharedBuildActor('acolyte', row, id, position);
type Active = Extract<SkillDefinition, { kind: 'active' }>;
// RO_TREE_EVIDENCE=<path> records the measured values of this exact run for the task review.
const evidence: Record<string, unknown> = { task_id: 'TASK-030', content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version };
test.after(() => { if (process.env.RO_TREE_EVIDENCE) writeFileSync(process.env.RO_TREE_EVIDENCE, JSON.stringify(evidence, null, 1) + '\n'); });

test('T030 AC-01: all 19 tree skills match the 57 M0 golden cases (heal/shield/periodic ticks/revive/sphere costs/triggers)', () => {
  assert.equal(ids.length, 19); const rows = goldens(ids); assert.equal(rows.length, 57);
  for (const row of rows) checkGolden(row);
  evidence.golden_cases = rows.map(row => row.id);
});

test('T030 AC-01: every Active executes every effect at every level 1-10 (heal, buffs, HoT ticks, shield, revive, spheres, Asura)', () => {
  const casts: Record<string, number[]> = {};
  for (const skill of actives) for (let level = 1; level <= skill.max_level; level++) (casts[skill.id] ??= []).push(probeActive(skill.id, level, 1, 60000).resolves);
  evidence.active_probe = { seed: 1, game_ms: 60000, resolves_per_level: casts };
});

test('T030 AC-01: every Passive changes stats or procs at every level 1-10 (Spirit Combo grants spheres on normal hits)', () => {
  const procs: Record<string, number[]> = {};
  for (const skill of passives) for (let level = 1; level <= skill.max_level; level++) (procs[skill.id] ??= []).push(probePassive(skill.id, level).procs);
  assert.ok(procs.monk_spirit_combo!.every(count => count > 0), 'spirit combo procs');
  evidence.passive_probe = procs;
});

test('T030 AC-01: Priest/Monk skill pages offer only learnable root+branch skills, each with effect text and a pack visual', async () => {
  const { characterSkillOptions } = await import('../../src/client/skills.ts');
  const state = buildAccount('acolyte', [build('priest_healer'), build('monk_finisher')]);
  for (const [characterId, branch, other] of [['main', 'priest', 'monk'], ['npc_acolyte', 'monk', 'priest']] as const) {
    const options = characterSkillOptions(state.roster.find(actor => actor.character_id === characterId)!, state).skills;
    assert.deepEqual(options.map(option => option.id).sort(), ids.filter(id => id.startsWith('acolyte_') || id.startsWith(`${branch}_`)).sort());
    for (const option of options) assert.ok(!option.id.startsWith(`${other}_`) && option.effects.length > 0 && option.effects.every(text => text && !text.includes('กลไกเฉพาะอาชีพ')), `${characterId} ${option.id} ${option.effects}`);
  }
  const index = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetIndex;
  for (const id of ids) { const visual = locateSkillVisual(index, id); assert.ok(visual.recipe.ready && visual.sounds.length > 0, id); }
});

// --- AC-02 ------------------------------------------------------------------------------------------
test('T030 AC-02: Heal still casts on a full-HP party in queue order, spends SP and books everything as overheal', () => {
  const { events, state } = run([probe('p_priest', 'player', 'front_1', [resolved('acolyte_heal', 10)], false, 'priest'), probe('p_ally', 'player', 'back_1'), probe('e_idle', 'enemy', 'front_1')], 40000);
  const heals = events.filter(event => event.type === 'heal' && event.skill_id === 'acolyte_heal'), row = state.metrics.skills['p_priest:acolyte_heal']!;
  assert.ok(row.casts_resolved >= 5 && row.sp_spent === row.casts_started * 18, `casts ${row.casts_resolved} sp ${row.sp_spent}`);
  assert.ok(heals.length === row.casts_resolved && heals.every(event => event.amount === 0), 'every heal lands on a full target for 0');
  assert.equal(row.effective_heal, 0); assert.ok(row.overheal > 0, 'overheal booked');
  evidence.full_hp_heal = { casts: row.casts_resolved, sp_spent: row.sp_spent, effective_heal: row.effective_heal, overheal: row.overheal };
});

test('T030 AC-02: Monk spheres never exceed 5, Asura spends all current SP + 5 spheres, and an interrupted Asura refunds nothing', () => {
  const monk = () => buildActor(build('monk_finisher'), 'monk', 'front_1');
  const stunner = (castMs: number) => { const actor = probe('e_stunner', 'enemy', 'front_1', [{ level: 1, definition: { ...structuredClone(resolved('swordsman_bash', 1).definition as Active), id: 'probe_stun', class_id: 'enemy', cost: { sp: 0, spirit_spheres: 0 }, timing: { cast_ms: castMs, after_cast_ms: 60000, interruptible: false }, effects: [{ id: 'stun', type: 'apply_status', target: 'foes', status_id: 'stun', duration_ms: 2000, params: {}, chance: 1 }] } }]); actor.stat_blueprint.derived_offsets.max_hp = 2000000000; return actor; };
  // Uninterrupted run: spheres are capped and Asura empties SP.
  const free = run([monk(), probe('p_ally', 'player', 'back_1'), stunner(59000)], 40000);
  const asura = free.events.filter(event => event.type === 'cast_start' && event.skill_id === 'monk_asura');
  assert.ok(asura.length >= 1 && asura.every(event => (event.amount ?? 0) >= 30), 'asura spends at least its minimum');
  const sphereGains = free.events.filter(event => event.type === 'resource_change' && event.target_id === 'monk' && event.detail === 'spirit_spheres');
  assert.ok(sphereGains.length > 0 && free.state.metrics.actors.monk!.sphere_gained <= 5 * (sphereGains.length + 1), 'sphere gains recorded');
  // Walk the same fight: spheres stay within 0..5 at every sample and every Asura start leaves exactly 0 SP.
  const stops = [...new Set([...Array.from({ length: 80 }, (_, n) => (n + 1) * 500), ...asura.map(event => event.at_ms)])].sort((a, b) => a - b);
  let walk = unwrap(restoreBattle(free.initial, content));
  for (const time of stops) {
    walk = unwrap(advanceUntil(walk, time, content)).state; const actor = walk.actors.find(row => row.actor_id === 'monk')!;
    assert.ok(actor.spirit_spheres >= 0 && actor.spirit_spheres <= 5, `spheres at ${time}`);
    if (asura.some(event => event.at_ms === time)) { assert.equal(actor.sp, 0, `all current SP spent at Asura start ${time}`); assert.equal(actor.spirit_spheres, 0, `five spheres spent at ${time}`); }
  }
  // Interrupted run: a Stun resolving mid-cast ends Asura; SP and spheres stay spent and the stunner is credited.
  const first = asura[0]!, castMs = first.cast_duration_ms!, stunAt = first.at_ms + Math.floor(castMs / 2);
  const si = free.initial.actors.find(row => row.actor_id === 'e_stunner')!.phase_ready_at!;
  // Choose the stunner's authored CT so that its (speed-scaled) resolve lands inside the Asura cast window.
  const speed = free.initial.actors.find(row => row.actor_id === 'e_stunner')!.stats.cast_speed;
  const stunCast = (target: number) => { const guess = Math.round((target - si) * speed / 100); for (let base = Math.max(1, guess - 400); base <= guess + 400; base++) { const resolveAt = si + castDurationMs(base, speed); if (resolveAt > first.at_ms && resolveAt < first.at_ms + castMs) return base; } throw new Error('NO_STUN_TIMING'); };
  const cut = run([monk(), probe('p_ally', 'player', 'back_1'), stunner(stunCast(stunAt))], first.at_ms + castMs + 100);
  const interrupt = cut.events.find(event => event.type === 'cast_interrupt' && event.actor_id === 'monk' && event.skill_id === 'monk_asura');
  assert.ok(interrupt, 'Asura interrupted by the stun'); assert.equal(interrupt!.detail, 'e_stunner');
  const after = cut.state.actors.find(row => row.actor_id === 'monk')!, metric = cut.state.metrics.skills['monk:monk_asura']!;
  assert.equal(metric.casts_interrupted, 1); assert.equal(metric.casts_resolved, 0); assert.ok(metric.sp_spent >= 30, 'SP stays spent');
  assert.ok(after.sp < (cut.events.find(event => event.type === 'cast_start' && event.skill_id === 'monk_asura')!.amount ?? 0), 'no SP refund');
  assert.ok(!cut.events.some(event => event.type === 'damage' && event.skill_id === 'monk_asura'), 'interrupted Asura deals no damage');
  evidence.monk = { asura_casts_40s: asura.length, asura_sp_spent: asura.map(event => event.amount), sphere_gained: free.state.metrics.actors.monk!.sphere_gained, sphere_wasted: free.state.metrics.actors.monk!.sphere_wasted, interrupted_at_ms: interrupt!.at_ms, interrupted_sp_spent: metric.sp_spent, stun_resolves_ms: stunAt };
});

test('T030 AC-02: Steel Body Lv10 trades 30% attack speed for 70% guard (D-104) and pulls enemies onto the Monk', () => {
  const tank = buildActor(build('monk_steel_tank'), 'monk', 'back_1');
  // Explicit max-rank engine probe; the saved Lv50 example now correctly uses D165's lower legal cap.
  tank.resolved_skills.monk_steel_body = resolved('monk_steel_body', 10) as never;
  const { events } = run([tank, probe('p_front', 'player', 'front_1', [], true), probe('e_boss', 'enemy', 'front_1', [], true)], 30000, 1, checkpoint => { checkpoint.actors.find(row => row.actor_id === 'e_boss')!.stats.physical_attack = 120; });
  const resolve = events.find(event => event.type === 'cast_resolve' && event.actor_id === 'monk' && event.skill_id === 'monk_steel_body')!;
  const during = run([structuredClone(tank), probe('p_front', 'player', 'front_1', [], true), probe('e_boss', 'enemy', 'front_1', [], true)], resolve.at_ms + 1).state.actors.find(row => row.actor_id === 'monk')!;
  const before = run([structuredClone(tank), probe('p_front', 'player', 'front_1', [], true), probe('e_boss', 'enemy', 'front_1', [], true)], 1).state.actors.find(row => row.actor_id === 'monk')!;
  assert.ok(Math.abs(during.stats.guard_percent - before.stats.guard_percent - .4 * 1.75) < 1e-9, `guard ${during.stats.guard_percent}`);
  assert.ok(Math.abs(during.stats.attack_speed - before.stats.attack_speed * .7) < 1e-6, `aspd ${before.stats.attack_speed} -> ${during.stats.attack_speed}`);
  const normals = (from: number, to: number) => events.filter(event => event.type === 'normal_attack' && event.actor_id === 'e_boss' && event.at_ms >= from && event.at_ms < to);
  assert.ok(normals(resolve.at_ms, resolve.at_ms + 5000).every(event => event.target_id === 'monk') && normals(resolve.at_ms, resolve.at_ms + 5000).length > 0, 'provoked boss attacks the Monk');
  assert.ok(normals(0, resolve.at_ms).every(event => event.target_id === 'p_front'), 'before provoke the boss hits the front ally');
  evidence.steel_body = { resolve_ms: resolve.at_ms, guard: [before.stats.guard_percent, during.stats.guard_percent], attack_speed: [before.stats.attack_speed, during.stats.attack_speed] };
});

// --- AC-03 ------------------------------------------------------------------------------------------
test('T030 AC-03: dry catalog trace of all four builds reproduces the M0 queue estimate (permanent Passives only)', () => {
  evidence.dry_trace = checkDryTraces('acolyte', tree.builds);
});

test('T030 AC-03: the full fight uses real effects - Asura spends the live SP pool, Spirit Combo refills spheres, Steel Body slow stretches the dry rotation', () => {
  const real: Record<string, unknown> = {};
  for (const row of tree.builds) {
    const { events } = run([buildActor(row, 'hero', 'front_1'), probe('p_ally', 'player', 'back_1'), probe('e_boss', 'enemy', 'front_1')], 20000);
    const rows = events.filter(event => event.actor_id === 'hero' && ['cast_start', 'sp_skip', 'sphere_skip'].includes(event.type)).map(event => ({ type: event.type, skill_id: event.skill_id, at_ms: event.at_ms }));
    const dry = row.queue_estimate.starts.map(start => ({ skill_id: start.skill_id, start_ms: start.start_ms }));
    real[row.id] = { real: rows.slice(0, 5), dry };
    if (row.id === 'monk_finisher') {
      // Dry trace counts no SP for Asura; the real fight spends the live pool (full first, then only what regenerated) and Spirit Combo refills spheres.
      const spent = events.filter(event => event.actor_id === 'hero' && event.type === 'cast_start' && event.skill_id === 'monk_asura').map(event => event.amount ?? 0);
      assert.ok(spent.length >= 2 && spent[0]! > spent[1]! * 2, `Asura spends the live SP pool ${spent}`);
      assert.ok(events.some(event => event.type === 'resource_change' && event.skill_id === 'monk_spirit_combo' && event.target_id === 'hero'), 'Spirit Combo refills spheres');
      (real as Record<string, unknown>).monk_finisher_asura_sp = spent;
    }
    else if (row.id === 'monk_steel_tank') { assert.deepEqual(rows[0], { type: 'cast_start', skill_id: 'monk_steel_body', at_ms: dry[0]!.start_ms }); assert.ok(rows[1]!.at_ms > dry[1]!.start_ms, `slow delays the next start ${rows[1]!.at_ms} vs ${dry[1]!.start_ms}`); }
    else if(row.active_slots[0]==='acolyte_blessing'){assert.equal(rows[0]!.at_ms,dry[0]!.start_ms);assert.ok(rows[1]!.at_ms<dry[1]!.start_ms,'D168 Blessing haste+DEX speed up later slots');}
    else assert.deepEqual(rows.slice(0, 4).map(event => ({ skill_id: event.skill_id, start_ms: event.at_ms })), dry, row.id);
  }
  evidence.real_fight_first_starts = real;
});

// --- AC-04 ------------------------------------------------------------------------------------------
test('T030 AC-04: same seed/build gives identical state/events/heal-SP-sphere metrics in server, client session and runner; ticks keep their parent cast', async () => {
  // Parity fixture, not a balance check: 3-8 keeps this two-built-member team alive long enough for every tree skill to act
  // (6-20 became too hard for it after the 21 Oct 2026 calibration, so its late skills never cast).
  const { runner, clientEvents, code, confirmations, team, stage } = await storyParity('acolyte', [build('priest_healer'), build('monk_finisher')], '3-8', 30);
  const skills = runner.report.skills;
  for (const key of ['main:acolyte_heal', 'main:priest_sanctuary', 'main:priest_kyrie', 'npc_acolyte:monk_call_spirits']) assert.ok((skills[key]?.metrics.casts_resolved ?? 0) > 0, key);
  const ticks = clientEvents.filter(event => event.type === 'heal' && event.skill_id === 'priest_sanctuary');
  assert.ok(ticks.length > 0 && ticks.every(event => event.effect_id === 'heal_tick' && event.source_instance_id?.startsWith('cast_main_')), 'sanctuary ticks name their parent cast');
  assert.ok(clientEvents.filter(event => event.type === 'shield').every(event => event.skill_id === 'priest_kyrie' && event.source_instance_id?.startsWith('cast_main_')), 'kyrie shields attributed');
  const metric = (key: string) => { const row = skills[key]?.metrics; return row ? { effective_heal: row.effective_heal, overheal: row.overheal, shield_created: row.shield_created, sp_spent: row.sp_spent, sphere_gained: row.sphere_gained, sphere_wasted: row.sphere_wasted, casts_resolved: row.casts_resolved, hp_damage: row.hp_damage } : null; };
  evidence.parity = { stage, seed: 30, team, outcome: code, end_ms: runner.report.end_ms, events: clientEvents.length, server_confirmations: confirmations, event_digest: runner.report.event_digest, tree_skill_metrics: Object.fromEntries(Object.keys(skills).filter(key => /:(acolyte|priest|monk)_/.test(key)).map(key => [key, metric(key)])) };
});
