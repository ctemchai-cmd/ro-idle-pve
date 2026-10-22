// TASK-031: Archer / Hunter / Bard / Dancer skills executed by the shared engine, runner and runtime.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import type { SkillDefinition } from '../../src/contracts/index.ts';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
import { locateSkillVisual } from '../../src/renderer/asset-locator.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { content } from './combat-fixtures.ts';
import { buildAccount, buildActor as sharedBuildActor, checkDryTraces, checkGolden, goldens, probe, probeActive, probePassive, resolved, run, storyParity, treeData, type Build } from './class-skills.ts';

const tree = treeData('archer'), ids = tree.skills.map(skill => skill.id), build = (id: string) => tree.builds.find(row => row.id === id)!;
const actives = tree.skills.filter(skill => skill.kind === 'active'), passives = tree.skills.filter(skill => skill.kind === 'passive');
const buildActor = (row: Build, id: string, position: string) => sharedBuildActor('archer', row, id, position);
const index = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetIndex;
// RO_TREE_EVIDENCE=<path> records the measured values of this exact run for the task review.
const evidence: Record<string, unknown> = { task_id: 'TASK-031', content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version };
test.after(() => { if (process.env.RO_TREE_EVIDENCE) writeFileSync(process.env.RO_TREE_EVIDENCE, JSON.stringify(evidence, null, 1) + '\n'); });

test('T031 AC-01: all 26 tree skills (Bard and Dancer pairs included) match the 78 M0 golden cases', () => {
  assert.equal(ids.length, 26); const rows = goldens(ids); assert.equal(rows.length, 78);
  for (const row of rows) checkGolden(row);
  evidence.golden_cases = rows.length;
});

test('T031 AC-01: every Active executes every effect at every level 1-10 (arrows, traps, songs, Dissonance SP drain, Encore stun)', () => {
  const casts: Record<string, number[]> = {};
  for (const skill of actives) for (let level = 1; level <= skill.max_level; level++) (casts[skill.id] ??= []).push(probeActive(skill.id, level, 1, 60000).resolves);
  evidence.active_probe = { seed: 1, game_ms: 60000, resolves_per_level: casts };
});

test('T031 AC-01: every Passive changes stats or procs at every level 1-10; Falcon procs only from normal attacks', () => {
  const procs: Record<string, number[]> = {};
  for (const skill of passives) for (let level = 1; level <= skill.max_level; level++) (procs[skill.id] ??= []).push(probePassive(skill.id, level).procs);
  assert.ok(procs.hunter_falcon!.every(count => count > 0), 'falcon procs at every level');
  // Falcon on a Hunter who also casts Double Strafe: every falcon hit hangs off a normal attack action, never a skill cast.
  const { events } = run([probe('p_hunter', 'player', 'front_1', [resolved('archer_double_strafe', 10), resolved('hunter_falcon', 10)], true, 'hunter'), probe('p_ally', 'player', 'back_1'), probe('e_boss', 'enemy', 'front_1')], 40000);
  const falcon = events.filter(event => event.type === 'damage' && event.skill_id === 'hunter_falcon');
  assert.ok(falcon.length > 0 && falcon.every(event => event.action_id?.startsWith('normal_p_hunter_') && event.origin === 'proc'), 'falcon hits only from normal attacks');
  assert.ok(events.some(event => event.type === 'damage' && event.skill_id === 'archer_double_strafe'), 'skill hits happened too');
  evidence.passive_probe = procs; evidence.falcon_normal_only = { falcon_hits: falcon.length, skill_hits: events.filter(event => event.type === 'damage' && event.skill_id === 'archer_double_strafe').length };
});

test('T031 AC-01: Hunter/Bard/Dancer skill pages offer only learnable root+branch skills, each with effect text and a pack visual', async () => {
  const { characterSkillOptions } = await import('../../src/client/skills.ts');
  for (const [main, npc] of [['hunter_sniper', 'bard_support'], ['hunter_trapper', 'dancer_support']] as const) {
    const state = buildAccount('archer', [build(main), build(npc)]);
    for (const actor of state.roster.filter(row => row.character_id === 'main' || row.character_id === 'npc_archer')) {
      const options = characterSkillOptions(actor, state).skills, branch = actor.job_id;
      assert.deepEqual(options.map(option => option.id).sort(), ids.filter(id => id.startsWith('archer_') || id.startsWith(`${branch}_`)).sort(), `${actor.character_id} ${branch}`);
      for (const option of options) assert.ok(option.effects.length > 0 && option.effects.every(text => text && !text.includes('กลไกเฉพาะอาชีพ')), `${option.id} ${option.effects}`);
    }
  }
  for (const id of ids) { const visual = locateSkillVisual(index, id); assert.ok(visual.recipe.ready && visual.sounds.length > 0, id); }
});

// --- AC-02 ------------------------------------------------------------------------------------------
test('T031 AC-02: Bard or Dancer is the same Archer companion (no second NPC), with its own look/weapon and D138 distinct support values', () => {
  const rules = new AccountCommandRules(), seen: Record<string, unknown> = {};
  for (const [npc, gender, weapon] of [['bard_support', 'male', 'instrument'], ['dancer_support', 'female', 'whip']] as const) {
    const state = buildAccount('archer', [build('hunter_sniper'), build(npc)]); rules.validateAccount(state);
    const archer = state.roster.filter(row => row.root_job_id === 'archer' && row.kind === 'npc');
    assert.equal(state.roster.length, 7); assert.equal(archer.length, 1); assert.equal(archer[0]!.character_id, 'npc_archer'); assert.equal(archer[0]!.gender, gender);
    assert.equal((content.documents['equipment.json']!.weapon_compatibility as Record<string, string>)[archer[0]!.job_id], weapon);
    const preset = index.actor_jobs.find(row => row.job_id === archer[0]!.job_id)!.presets.find(row => row.gender === gender);
    assert.ok(preset?.body && preset.weapon, `${npc} ${gender} preset with weapon overlay`);
    seen[npc] = { job: archer[0]!.job_id, gender, weapon, body: preset!.body.id, weapon_overlay: preset!.weapon!.id };
  }
  const strip = (definition: SkillDefinition) => { const { id: _id, name_key: _n, class_id: _c, presentation_id: _p, tags: _t, ...rest } = definition as SkillDefinition & { presentation_id: string }; return rest; };
  let pairs = 0;
  for (const bard of tree.skills.filter(skill => skill.class_id === 'bard')) for (let level = 1; level <= bard.max_level; level++) {
    const a=strip(resolved(bard.id,level).definition),b=strip(resolved(bard.id.replace('bard_','dancer_'),level).definition);
    if(['bard_battle_song','bard_dissonance'].includes(bard.id))assert.notDeepEqual(a,b,`${bard.id} distinct support`);else assert.deepEqual(a,b,`${bard.id} Lv${level}`);pairs++;
  }
  evidence.bard_dancer = { appearance: seen, equal_resolved_pairs_checked: pairs };
});

test('T031 AC-02: a repeated song adds an independent stack per cast with its own expiry (no refresh), and each expires separately', () => {
  const { events, state } = run([probe('p_bard', 'player', 'front_1', [resolved('bard_battle_song', 10)], false, 'bard'), probe('p_ally', 'player', 'back_1'), probe('e_idle', 'enemy', 'front_1')], 12000);
  const applied = events.filter(event => event.type === 'status_applied' && event.skill_id === 'bard_battle_song' && event.target_id === 'p_ally' && event.status_change?.status_id === 'aspd_up');
  assert.ok(applied.length >= 2, 'song cast at least twice');
  const [first, second] = applied as [typeof applied[number], typeof applied[number]];
  assert.ok(second.at_ms < first.status_change!.expires_at, 'second cast lands while the first stack is active');
  assert.notEqual(first.status_change!.instance_id, second.status_change!.instance_id); assert.equal(second.status_change!.active_instances_after, 2);
  assert.equal(second.status_change!.expires_at - second.at_ms, 5500); assert.equal(first.status_change!.expires_at - first.at_ms, 5500);
  const expired = events.filter(event => event.type === 'status_expired' && event.target_id === 'p_ally' && event.status_change?.status_id === 'aspd_up');
  assert.deepEqual(expired.slice(0, 2).map(event => event.at_ms), [first.status_change!.expires_at, second.status_change!.expires_at]);
  void state;
  evidence.song_stacks = { applied_ms: applied.map(event => event.at_ms), expires_ms: applied.map(event => event.status_change!.expires_at), max_active: Math.max(...applied.map(event => event.status_change!.active_instances_after)) };
});

// --- AC-03 ------------------------------------------------------------------------------------------
test('T031 AC-03: dry catalog trace of all six builds reproduces the M0 queue estimate (permanent Passives only)', () => {
  evidence.dry_trace = checkDryTraces('archer', tree.builds);
});

test('T031 AC-03: the full fight uses real effects - Battle Song speeds up the singer and Concentration does not change timing', () => {
  const real: Record<string, unknown> = {};
  for (const row of tree.builds) {
    const { events } = run([buildActor(row, 'hero', 'front_1'), probe('p_ally', 'player', 'back_1'), probe('e_boss', 'enemy', 'front_1')], 20000);
    const starts = events.filter(event => event.actor_id === 'hero' && event.type === 'cast_start').map(event => ({ skill_id: event.skill_id, start_ms: event.at_ms }));
    const dry = row.queue_estimate.starts.map(start => ({ skill_id: start.skill_id, start_ms: start.start_ms }));
    real[row.id] = { real: starts.slice(0, 4), dry };
    if (row.active_slots[0] === 'bard_battle_song') { assert.deepEqual(starts[0], dry[0]); assert.ok(starts[1]!.start_ms < dry[1]!.start_ms, `${row.id} song haste ${starts[1]!.start_ms} vs ${dry[1]!.start_ms}`); }
    else assert.deepEqual(starts.slice(0, 4), dry, row.id);
  }
  evidence.real_fight_first_starts = real;
});

// --- AC-04 ------------------------------------------------------------------------------------------
test('T031 AC-04: same seed/build gives identical state/events/metrics in server, client session and runner with Falcon/song sources intact', async () => {
  // Parity fixture, not a balance check: 3-8 keeps this two-built-member team alive long enough for every tree skill to act
  // (6-20 became too hard for it after the 21 Oct 2026 calibration, so its late skills never cast).
  const { runner, clientEvents, code, confirmations, team, stage } = await storyParity('archer', [build('hunter_trapper'), build('bard_support')], '3-8', 31);
  const skills = runner.report.skills;
  for (const key of ['main:hunter_ankle_snare', 'main:hunter_claymore', 'npc_archer:bard_battle_song', 'npc_archer:bard_healing_song']) assert.ok((skills[key]?.metrics.casts_resolved ?? 0) > 0, key);
  assert.ok((skills['main:hunter_falcon']?.metrics.hp_damage ?? 0) > 0, 'falcon proc damage booked under the passive');
  assert.ok(clientEvents.filter(event => event.type === 'heal' && event.skill_id === 'bard_healing_song').every(event => event.source_instance_id?.startsWith('cast_npc_archer_')), 'song ticks keep the bard cast');
  evidence.parity = { stage, seed: 31, team, outcome: code, end_ms: runner.report.end_ms, events: clientEvents.length, server_confirmations: confirmations, event_digest: runner.report.event_digest, tree_skill_metrics: Object.fromEntries(Object.entries(skills).filter(([key]) => /:(archer|hunter|bard)_/.test(key)).map(([key, value]) => [key, { casts_resolved: value.metrics.casts_resolved, hp_damage: value.metrics.hp_damage, effective_heal: value.metrics.effective_heal }])) };
});
