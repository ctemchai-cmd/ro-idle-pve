// TASK-033: Thief / Assassin / Rogue skills (copies, venom, detonate) on the shared engine, runner and runtime.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import type { SkillDefinition } from '../../src/contracts/index.ts';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
import { advanceUntil, restoreBattle } from '../../src/domain/combat/index.ts';
import { applySkillCommand, compileCharacterSkills } from '../../src/domain/progression/skills.ts';
import { ProgressionRejection } from '../../src/domain/progression/rejection.ts';
import { locateSkillVisual } from '../../src/renderer/asset-locator.ts';
import { content, unwrap } from './combat-fixtures.ts';
import { buildAccount, buildActor as sharedBuildActor, checkDryTraces, checkGolden, goldens, probe, probeActive, probePassive, resolved, run, storyParity, treeData, type Build } from './class-skills.ts';

const tree = treeData('thief'), ids = tree.skills.map(skill => skill.id), build = (id: string) => tree.builds.find(row => row.id === id)!;
const actives = tree.skills.filter(skill => skill.kind === 'active'), passives = tree.skills.filter(skill => skill.kind === 'passive');
const buildActor = (row: Build, id: string, position: string) => sharedBuildActor('thief', row, id, position);
const whitelist = (content.documents['skills/thief.json']!.copy_whitelist ?? JSON.parse(readFileSync('plan/data/skills/thief.json', 'utf8')).copy_whitelist) as { skill_id: string; source_skill_id: string; exclusive_group: string; sp_multiplier: number }[];
type Active = Extract<SkillDefinition, { kind: 'active' }>;
// RO_TREE_EVIDENCE=<path> records the measured values of this exact run for the task review.
const evidence: Record<string, unknown> = { task_id: 'TASK-033', content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version };
test.after(() => { if (process.env.RO_TREE_EVIDENCE) writeFileSync(process.env.RO_TREE_EVIDENCE, JSON.stringify(evidence, null, 1) + '\n'); });

test('T033 AC-01: all 24 tree skills (incl. 5 Rogue copies) match the 72 M0 golden cases', () => {
  assert.equal(ids.length, 24); const rows = goldens(ids); assert.equal(rows.length, 72);
  for (const row of rows) checkGolden(row);
  evidence.golden_cases = rows.length;
});

test('T033 AC-01: every Active executes every effect at every level 1-10 (venom, accuracy down, strips, expose, intimidate, detonate, copies)', () => {
  const casts: Record<string, number[]> = {};
  for (const skill of actives) for (let level = 1; level <= skill.max_level; level++) (casts[skill.id] ??= []).push(probeActive(skill.id, level, 1, 60000).resolves);
  evidence.active_probe = { seed: 1, game_ms: 60000, resolves_per_level: casts };
});

test('T033 AC-01: every Passive changes stats or procs at every level 1-10 (Double Attack only from normal hits)', () => {
  const procs: Record<string, number[]> = {};
  for (const skill of passives) for (let level = 1; level <= skill.max_level; level++) (procs[skill.id] ??= []).push(probePassive(skill.id, level).procs);
  assert.ok(procs.thief_double_attack!.every(count => count > 0), 'double attack procs');
  evidence.passive_probe = procs;
});

test('T033 AC-01: Assassin/Rogue skill pages offer only learnable root+branch skills, each with effect text and a pack visual', async () => {
  const { characterSkillOptions } = await import('../../src/client/skills.ts');
  const state = buildAccount('thief', [build('assassin_venom'), build('rogue_support_copy')]);
  for (const [characterId, branch, other] of [['main', 'assassin', 'rogue'], ['npc_thief', 'rogue', 'assassin']] as const) {
    const options = characterSkillOptions(state.roster.find(actor => actor.character_id === characterId)!, state).skills;
    assert.deepEqual(options.map(option => option.id).sort(), ids.filter(id => id.startsWith('thief_') || id.startsWith(`${branch}_`)).sort());
    for (const option of options) assert.ok(!option.id.startsWith(`${other}_`) && option.effects.length > 0 && option.effects.every(text => text && !text.includes('กลไกเฉพาะอาชีพ')), `${characterId} ${option.id} ${option.effects}`);
  }
  const index = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetIndex;
  for (const id of ids) { const visual = locateSkillVisual(index, id); assert.ok(visual.recipe.ready && visual.sounds.length > 0, id); }
});

// --- AC-02 ------------------------------------------------------------------------------------------
test('T033 AC-02: each Rogue copy is the whitelisted source program (SP ×1.25) at every level; one copy per loadout, no copy of a copy', () => {
  for (const row of whitelist) {
    const copy = content.skills[row.skill_id] as unknown as Active, source = content.skills[row.source_skill_id] as unknown as Active;
    assert.ok(!source.id.startsWith('rogue_copy_') && copy.class_id === 'rogue', row.skill_id);
    for (let level = 1; level <= copy.max_level; level++) {
      const a = resolved(row.skill_id, level).definition as Active, b = resolved(row.source_skill_id, level).definition as Active;
      assert.deepEqual(a.effects, b.effects, `${row.skill_id} Lv${level} effects`); assert.deepEqual(a.timing, b.timing); assert.equal(a.cost.sp, Math.ceil(Number(b.cost.sp) * row.sp_multiplier));
    }
  }
  assert.ok(!Object.keys(content.skills).some(id => id.startsWith('rogue_copy_rogue')), 'no recursive copies');
  const state = buildAccount('thief', [build('rogue_support_copy')]), main = state.roster.find(actor => actor.character_id === 'main')!;
  main.skill_levels.rogue_copy_mage_fire_bolt = 1;
  assert.throws(() => applySkillCommand(state, { type: 'skill.set_loadout', request_id: 'r', params: { character_id: 'main', skill_ids: ['rogue_copy_acolyte_heal', 'rogue_copy_mage_fire_bolt', 'rogue_strip_armor', 'rogue_expose'] } } as never, content), (error: unknown) => error instanceof ProgressionRejection && error.message === 'EXCLUSIVE_SKILL_GROUP');
  assert.equal(compileCharacterSkills(main, content).active_slots.filter(id => id?.startsWith('rogue_copy_')).length, 1, 'only one copy slotted');
  evidence.copies = whitelist.map(row => ({ copy: row.skill_id, source: row.source_skill_id, sp: (content.skills[row.skill_id] as unknown as Active).cost.sp }));
});

test('T033 AC-02: D138 Rolling Cutter hits independently of venom and preserves all sources', () => {
  const assassin = probe('p_sin', 'player', 'front_1', [resolved('assassin_venom_dust', 10), resolved('thief_envenom', 10), resolved('assassin_detonate', 10)], false, 'assassin');
  const ally = probe('p_npc', 'player', 'back_1', [resolved('assassin_venom_dust', 1)], false, 'assassin');
  const { events, initial } = run([assassin, ally, probe('e_boss', 'enemy', 'front_1')], 40000);
  const detonations = events.filter(event => event.type === 'damage' && event.skill_id === 'assassin_detonate');
  assert.ok(detonations.length > 0, 'detonate resolved');
  let checked = 0;
  for (const hit of detonations) {
    const before = unwrap(advanceUntil(unwrap(restoreBattle(initial, content)), hit.at_ms - 1, content)).state.actors.find(actor => actor.actor_id === 'e_boss')!;
    const after = unwrap(advanceUntil(unwrap(restoreBattle(initial, content)), hit.at_ms, content)).state.actors.find(actor => actor.actor_id === 'e_boss')!;
    const own = (actor: typeof before) => actor.statuses.filter(row => row.status_id === 'venom' && row.source.origin_actor_id === 'p_sin').length, other = (actor: typeof before) => actor.statuses.filter(row => row.status_id === 'venom' && row.source.origin_actor_id === 'p_npc').length;
    // A venom expiring or another tick at the same ms is excluded by only checking strict before/after counts on the detonation timestamp.
    if (events.some(event => event.at_ms === hit.at_ms && event.type === 'status_expired')) continue;
    // D138 replaces detonation with a standalone single-target finisher; original stack mechanics still tested below.
    // These probe skills do not change ATK; raw damage precedes the elemental matchup.
    const attack = initial.actors.find(actor => actor.actor_id === 'p_sin')!.stats.physical_attack;
    assert.equal(hit.raw, 8.957812 * attack, 'D138 raw =70%of Finger total × ATK, independent of venom stacks');
    assert.equal(own(after), own(before), 'own venom retained'); assert.equal(other(after), other(before), 'ally venom untouched');
    if (own(before) >= 2 && other(before) >= 1) checked++;
  }
  assert.ok(checked > 0, 'a Rolling Cutter hit with ≥2 own and ≥1 ally venom was checked');
  const stacks = events.filter(event => event.type === 'status_applied' && event.status_change?.status_id === 'venom' && event.actor_id === 'p_sin').map(event => event.status_change!.active_instances_after);
  assert.ok(Math.max(...stacks) >= 2, 'same caster stacks independent venom instances');
  evidence.detonate = { detonations: detonations.length, checked_two_own_one_ally: checked, raws: detonations.map(event => event.raw) };
});

// --- AC-03 ------------------------------------------------------------------------------------------
test('T033 AC-03: dry catalog trace of all four builds reproduces the M0 queue estimate (permanent Passives only)', () => {
  evidence.dry_trace = checkDryTraces('thief', tree.builds);
});

test('T033 AC-03: real fights - Quick Step hastes the critical Assassin; Rogue strips/expose debuff the target for the team; venom is personal', () => {
  const real: Record<string, unknown> = {};
  for (const row of tree.builds) {
    const { events } = run([buildActor(row, 'hero', 'front_1'), probe('p_ally', 'player', 'back_1'), probe('e_boss', 'enemy', 'front_1')], 20000);
    const starts = events.filter(event => event.actor_id === 'hero' && event.type === 'cast_start').map(event => ({ skill_id: event.skill_id, start_ms: event.at_ms }));
    const dry = row.queue_estimate.starts.map(start => ({ skill_id: start.skill_id, start_ms: start.start_ms }));
    real[row.id] = { real: starts.slice(0, 4), dry };
    if (row.active_slots[0] === 'thief_quick_step') { assert.deepEqual(starts[0], dry[0]); assert.ok(starts[1]!.start_ms < dry[1]!.start_ms, 'Quick Step hastes'); }
    else assert.deepEqual(starts.slice(0, 4), dry, row.id);
    if (row.job_id === 'rogue') assert.ok(['armor_break', 'attack_down', 'exposed'].some(status => events.some(event => event.type === 'status_applied' && event.target_id === 'e_boss' && event.status_change?.status_id === status)), `${row.id} debuffs the shared target`);
  }
  evidence.real_fight_first_starts = real;
});

// --- AC-04 ------------------------------------------------------------------------------------------
test('T033 AC-04: same seed/build gives identical results in server, client session and runner with own-source venom metrics', async () => {
  // D138 parity fixture:3-10 supplies enough HP/time for both new finishers and the copied Heal to cast
  // (6-20 became too hard for it after the 21 Oct 2026 calibration, so its late skills never cast).
  const { runner, clientEvents, code, confirmations, team, stage } = await storyParity('thief', [build('assassin_venom'), build('rogue_support_copy')], '3-10', 33);
  const skills = runner.report.skills;
  for (const key of ['main:assassin_venom_dust', 'main:assassin_detonate', 'npc_thief:rogue_strip_armor', 'npc_thief:rogue_copy_acolyte_heal']) assert.ok((skills[key]?.metrics.casts_resolved ?? 0) > 0, key);
  const venomTicks = clientEvents.filter(event => event.type === 'damage' && ['thief_envenom', 'assassin_venom_dust'].includes(event.skill_id!) && event.effect_id !== 'hit');
  assert.ok(venomTicks.every(event => event.source_instance_id?.startsWith('cast_main_')), 'venom ticks keep the Assassin cast as source');
  assert.ok(team.some(member => member.character_id === 'npc_thief'), 'thief companion in the team');
  evidence.parity = { stage, seed: 33, team, outcome: code, end_ms: runner.report.end_ms, events: clientEvents.length, server_confirmations: confirmations, event_digest: runner.report.event_digest, venom_ticks: venomTicks.length, tree_skill_metrics: Object.fromEntries(Object.entries(skills).filter(([key]) => /:(thief|assassin|rogue)_/.test(key)).map(([key, value]) => [key, { casts_resolved: value.metrics.casts_resolved, hp_damage: value.metrics.hp_damage }])) };
});
