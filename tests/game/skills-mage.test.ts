// TASK-032: Mage / Wizard / Sage skills executed by the shared engine, runner and runtime.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
import { locateSkillVisual } from '../../src/renderer/asset-locator.ts';
import { content, unwrap } from './combat-fixtures.ts';
import { restoreBattle } from '../../src/domain/combat/index.ts';
import { skillIntervalMs } from '../../src/domain/math/index.ts';
import { buildAccount, buildActor as sharedBuildActor, checkDryTraces, checkGolden, goldens, probe, probeActive, probePassive, resolved, run, storyParity, treeData, type Build } from './class-skills.ts';

const tree = treeData('mage'), ids = tree.skills.map(skill => skill.id), build = (id: string) => tree.builds.find(row => row.id === id)!;
const actives = tree.skills.filter(skill => skill.kind === 'active'), passives = tree.skills.filter(skill => skill.kind === 'passive');
const buildActor = (row: Build, id: string, position: string) => sharedBuildActor('mage', row, id, position);
// RO_TREE_EVIDENCE=<path> records the measured values of this exact run for the task review.
const evidence: Record<string, unknown> = { task_id: 'TASK-032', content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version };
test.after(() => { if (process.env.RO_TREE_EVIDENCE) writeFileSync(process.env.RO_TREE_EVIDENCE, JSON.stringify(evidence, null, 1) + '\n'); });

test('T032 AC-01: all 19 tree skills match the 57 M0 golden cases (bolts, Storm Gust field ticks, Quagmire, Dispel, Spell Breaker, endow, Auto-bolt)', () => {
  assert.equal(ids.length, 19); const rows = goldens(ids); assert.equal(rows.length, 57);
  for (const row of rows) checkGolden(row);
  evidence.golden_cases = rows.length;
});

test('T032 AC-01: every Active executes every effect at every level 1-10 (Spell Breaker interrupts and drains, Dispel removes enemy buffs)', () => {
  const casts: Record<string, number[]> = {};
  for (const skill of actives) for (let level = 1; level <= skill.max_level; level++) (casts[skill.id] ??= []).push(probeActive(skill.id, level, 1, 60000).resolves);
  evidence.active_probe = { seed: 1, game_ms: 60000, resolves_per_level: casts };
});

test('T032 AC-01: every Passive changes stats or procs at every level 1-10', () => {
  const procs: Record<string, number[]> = {};
  for (const skill of passives) for (let level = 1; level <= skill.max_level; level++) (procs[skill.id] ??= []).push(probePassive(skill.id, level).procs);
  assert.ok(procs.sage_auto_bolt!.every(count => count > 0), 'auto-bolt procs at every level');
  evidence.passive_probe = procs;
});

test('T032 AC-01: Wizard/Sage skill pages offer only learnable root+branch skills, each with effect text and a pack visual', async () => {
  const { characterSkillOptions } = await import('../../src/client/skills.ts');
  const state = buildAccount('mage', [build('wizard_artillery'), build('sage_auto_bolt')]);
  for (const [characterId, branch, other] of [['main', 'wizard', 'sage'], ['npc_mage', 'sage', 'wizard']] as const) {
    const options = characterSkillOptions(state.roster.find(actor => actor.character_id === characterId)!, state).skills;
    assert.deepEqual(options.map(option => option.id).sort(), ids.filter(id => id.startsWith('mage_') || id.startsWith(`${branch}_`)).sort());
    for (const option of options) assert.ok(!option.id.startsWith(`${other}_`) && option.effects.length > 0 && option.effects.every(text => text && !text.includes('กลไกเฉพาะอาชีพ')), `${characterId} ${option.id} ${option.effects}`);
  }
  const index = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetIndex;
  for (const id of ids) { const visual = locateSkillVisual(index, id); assert.ok(visual.recipe.ready && visual.sounds.length > 0, id); }
});

// --- AC-02 ------------------------------------------------------------------------------------------
test('T032 AC-02: Sage normal attacks never happen during a cast; Auto-bolt procs only from normal hits and never chains', () => {
  const sage = probe('p_sage', 'player', 'front_1', [resolved('wizard_meteor', 10), resolved('sage_auto_bolt', 10)], true, 'sage');
  const { events } = run([sage, probe('p_ally', 'player', 'back_1'), probe('e_boss', 'enemy', 'front_1')], 40000);
  const casts: [number, number][] = []; let open: number | null = null;
  for (const event of events.filter(row => row.actor_id === 'p_sage')) {
    if (event.type === 'cast_start' && (event.cast_duration_ms ?? 0) > 0) open = event.at_ms;
    if ((event.type === 'cast_resolve' || event.type === 'cast_interrupt') && open !== null) { casts.push([open, event.at_ms]); open = null; }
  }
  const normals = events.filter(event => event.type === 'normal_attack' && event.actor_id === 'p_sage');
  assert.ok(casts.length >= 5 && normals.length >= 5, `casts ${casts.length} normals ${normals.length}`);
  for (const normal of normals) assert.ok(!casts.some(([from, to]) => normal.at_ms > from && normal.at_ms < to), `normal attack at ${normal.at_ms} inside a cast`);
  const bolts = events.filter(event => event.type === 'damage' && event.skill_id === 'sage_auto_bolt'), procs = events.filter(event => event.type === 'proc' && event.actor_id === 'p_sage');
  assert.ok(bolts.length > 0 && bolts.every(event => event.action_id?.startsWith('normal_p_sage_') && event.origin === 'proc'), 'auto-bolt only from normal actions');
  assert.equal(procs.length, new Set(bolts.map(event => event.action_id)).size, 'one proc per triggering normal hit, no recursion');
  evidence.auto_bolt = { casts: casts.length, normals: normals.length, bolts: bolts.length, procs: procs.length };
});

test('T032 AC-02: Storm Gust frost field ticks at +1000..+4000 ms (never at its 5000 ms expiry) and rolls Freeze per target per tick', () => {
  const { events } = run([probe('p_wizard', 'player', 'front_1', [resolved('wizard_storm_gust', 10)], false, 'wizard'), probe('p_ally', 'player', 'back_1'), probe('e_front', 'enemy', 'front_1'), probe('e_back', 'enemy', 'back_1')], 30000);
  const fields = events.filter(event => event.type === 'status_applied' && event.status_change?.status_id === 'frost_field');
  assert.ok(fields.length >= 4, 'field applied to both foes repeatedly');
  let groups = 0;
  for (const field of fields) {
    if (field.status_change!.expires_at > 30000) continue;
    const ticks = events.filter(event => event.type === 'damage' && event.effect_id === 'tick_hit' && event.target_id === field.target_id && event.source_instance_id === field.source_instance_id);
    assert.deepEqual(ticks.map(event => event.at_ms - field.at_ms), [1000, 2000, 3000, 4000], `${field.target_id} @${field.at_ms}`);
    for (const tick of ticks) {
      const rolls = events.filter(event => (event.type === 'status_applied' || event.type === 'status_resisted') && event.effect_id === 'freeze' && event.target_id === field.target_id && event.at_ms === tick.at_ms && event.source_instance_id === field.source_instance_id);
      assert.equal(rolls.length, 1, `one freeze roll for ${field.target_id} at ${tick.at_ms}`);
    }
    groups++;
  }
  const freezes = events.filter(event => event.type === 'status_applied' && event.status_change?.status_id === 'freeze');
  evidence.storm_gust = { fields: fields.length, checked_field_instances: groups, freezes_applied: freezes.length, freeze_targets: [...new Set(freezes.map(event => event.target_id))] };
});

// --- AC-03 ------------------------------------------------------------------------------------------
test('T032 AC-03: dry catalog trace of all four builds reproduces the M0 queue estimate (Sage Auto-bolt cast speed 179.2, current D165 legal-rank cycle)', () => {
  evidence.dry_trace = checkDryTraces('mage', tree.builds);
  assert.equal(build('sage_auto_bolt').queue_estimate.cycle_ms, 6866); // D-061 job bonus (was 7344)
});

test('T032 AC-03: the full fight follows the dry first cycle (no self-timing buffs in this tree) while Quagmire slows the enemy for real', () => {
  const real: Record<string, unknown> = {};
  for (const row of tree.builds) {
    const { events, initial } = run([buildActor(row, 'hero', 'front_1'), probe('p_ally', 'player', 'back_1'), probe('e_boss', 'enemy', 'front_1', [], true)], 20000, 1, checkpoint => { checkpoint.actors.find(actor => actor.actor_id === 'e_boss')!.stats.physical_attack = 1; });
    const starts = events.filter(event => event.actor_id === 'hero' && event.type === 'cast_start').map(event => ({ skill_id: event.skill_id, start_ms: event.at_ms }));
    const dry = row.queue_estimate.starts.map(start => ({ skill_id: start.skill_id, start_ms: start.start_ms }));
    assert.deepEqual(starts.slice(0, 4), dry, row.id); real[row.id] = { real: starts.slice(0, 4), dry };
    if (row.id === 'wizard_controller') {
      const slowAt = events.find(event => event.type === 'status_applied' && event.status_change?.status_id === 'slow' && event.target_id === 'e_boss')!.at_ms;
      const gaps = events.filter(event => event.type === 'normal_attack' && event.actor_id === 'e_boss').map(event => event.at_ms).map((at, n, all) => n ? [all[n - 1]!, at - all[n - 1]!] as const : null).filter(Boolean) as (readonly [number, number])[];
      // Unslowed swing interval comes from the enemy's own attack speed; while slowed every swing gap is longer.
      const base = skillIntervalMs(unwrap(restoreBattle(initial, content)).actors.find(actor => actor.actor_id === 'e_boss')!.stats.attack_speed), during = gaps.filter(([from]) => from >= slowAt && from < slowAt + 4000).map(([, gap]) => gap);
      assert.ok(during.length > 0 && Math.min(...during) > base, `slowed enemy swings ${during} vs base ${base}`);
      real.quagmire_enemy_normal_gap = { base, during };
    }
  }
  evidence.real_fight_first_starts = real;
});

// --- AC-04 ------------------------------------------------------------------------------------------
test('T032 AC-04: same seed/build gives identical HP/status/RNG/metrics in server, client session and runner; field ticks keep their parent cast', async () => {
  // Parity fixture, not a balance check: 3-8 keeps this two-built-member team alive long enough for every tree skill to act
  // (6-20 became too hard for it after the 21 Oct 2026 calibration, so its late skills never cast).
  const { runner, clientEvents, code, confirmations, team, stage } = await storyParity('mage', [build('wizard_controller'), build('sage_auto_bolt')], '3-8', 32);
  const skills = runner.report.skills;
  for (const key of ['main:wizard_storm_gust', 'main:wizard_quagmire', 'npc_mage:sage_fire_endow', 'npc_mage:sage_psychic_bolt']) assert.ok((skills[key]?.metrics.casts_resolved ?? 0) > 0, key);
  const ticks = clientEvents.filter(event => event.type === 'damage' && event.effect_id === 'tick_hit');
  assert.ok(ticks.length > 0 && ticks.every(event => event.skill_id === 'wizard_storm_gust' && event.source_instance_id?.startsWith('cast_main_')), 'frost field ticks name the Storm Gust cast');
  assert.ok(team.some(member => member.character_id === 'npc_mage'), 'mage companion in the team');
  evidence.parity = { stage, seed: 32, team, outcome: code, end_ms: runner.report.end_ms, events: clientEvents.length, server_confirmations: confirmations, event_digest: runner.report.event_digest, rng: runner.report.rng, tree_skill_metrics: Object.fromEntries(Object.entries(skills).filter(([key]) => /:(mage|wizard|sage)_/.test(key)).map(([key, value]) => [key, { casts_resolved: value.metrics.casts_resolved, hp_damage: value.metrics.hp_damage, casts_interrupted: value.metrics.casts_interrupted }])) };
});
