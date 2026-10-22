// TASK-029: Swordsman / Knight / Crusader skills executed by the shared engine, runner and runtime.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import type { BattleCheckpoint, Effect, Scenario, SkillDefinition } from '../../src/contracts/index.ts';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
import type { ActorInput, BattleEvent } from '../../src/domain/combat/index.ts';
import { createBattle } from '../../src/domain/combat/index.ts';
import { captureReplay, runScenario } from '../../src/simulation/index.ts';
import { locateSkillVisual } from '../../src/renderer/asset-locator.ts';
import { content, unwrap } from './combat-fixtures.ts';
import { buildAccount, buildActor as sharedBuildActor, checkDryTraces, checkGolden, goldens, probe, probeActive, probePassive, resolved, run, storyParity, treeData, type Build } from './class-skills.ts';

const tree = treeData('swordsman'), ids = tree.skills.map(skill => skill.id), build = (id: string) => tree.builds.find(row => row.id === id)!;
const actives = tree.skills.filter(skill => skill.kind === 'active'), passives = tree.skills.filter(skill => skill.kind === 'passive');
// RO_TREE_EVIDENCE=<path> records the measured values of this exact run for the task review.
const evidence: Record<string, unknown> = { task_id: 'TASK-029', content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version };
test.after(() => { if (process.env.RO_TREE_EVIDENCE) writeFileSync(process.env.RO_TREE_EVIDENCE, JSON.stringify(evidence, null, 1) + '\n'); });

test('T029 AC-01: all 19 tree skills match the 57 M0 golden cases (cost, order, raw power, status params/modifiers, predicates)', () => {
  assert.equal(ids.length, 19); const rows = goldens(ids); assert.equal(rows.length, 57);
  for (const row of rows) checkGolden(row);
  evidence.golden_cases = rows.map(row => row.id);
});

test('T029 AC-01: every Active executes every effect at every level 1-10, on allowed targets, in program order', () => {
  const casts: Record<string, number[]> = {};
  for (const skill of actives) for (let level = 1; level <= skill.max_level; level++) (casts[skill.id] ??= []).push(probeActive(skill.id, level, 1, 60000).resolves);
  evidence.active_probe = { seed: 1, game_ms: 60000, resolves_per_level: casts };
});

test('T029 AC-01: every Passive changes stats or procs at every level 1-10 (Reflect returns damage to the attacker)', () => {
  for (const skill of passives) for (let level = 1; level <= skill.max_level; level++) {
    const result = probePassive(skill.id, level);
    if (skill.id === 'crusader_reflect') assert.ok(result.procs > 0, `reflect Lv${level} procs`);
    ((evidence.passive_probe ??= {}) as Record<string, number[]>)[skill.id] = [...((evidence.passive_probe as Record<string, number[]>)[skill.id] ?? []), result.procs];
  }
});

test('T029 AC-01: Knight/Crusader skill pages offer only learnable root+branch skills, each with effect text and a pack visual', async () => {
  const { characterSkillOptions } = await import('../../src/client/skills.ts');
  const state = buildAccount('swordsman', [build('knight_striker'), build('crusader_guardian')]);
  for (const [characterId, branch, other] of [['main', 'knight', 'crusader'], ['npc_swordsman', 'crusader', 'knight']] as const) {
    const options = characterSkillOptions(state.roster.find(actor => actor.character_id === characterId)!, state).skills;
    assert.deepEqual(options.map(option => option.id).sort(), ids.filter(id => id.startsWith('swordsman_') || id.startsWith(`${branch}_`)).sort());
    for (const option of options) assert.ok(!option.id.startsWith(`${other}_`) && option.effects.length > 0 && option.effects.every(text => text && !text.includes('กลไกเฉพาะอาชีพ')), `${characterId} ${option.id} ${option.effects}`);
  }
  const index = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetIndex;
  for (const id of ids) { const visual = locateSkillVisual(index, id); assert.ok(visual.recipe.ready && visual.sounds.length > 0, id); }
});

// --- Builds -----------------------------------------------------------------------------------------
const buildActor = (row: Build, id: string, position: string) => sharedBuildActor('swordsman', row, id, position);

test('T029 AC-03: dry catalog trace of all four builds reproduces the M0 queue estimate with permanent Passives and no temporary buffs', () => {
  evidence.dry_trace = checkDryTraces('swordsman', tree.builds);
});

test('T029 AC-03: the full fight uses real effects - Two-Hand Quicken shortens the next interval, other builds keep the dry first cycle', () => {
  for (const row of tree.builds) {
    const { events } = run([buildActor(row, 'hero', 'front_1'), probe('p_ally', 'player', 'back_1'), probe('e_boss', 'enemy', 'front_1')], 12000);
    const starts = events.filter(event => event.type === 'cast_start' && event.actor_id === 'hero').map(event => ({ skill_id: event.skill_id, start_ms: event.at_ms }));
    const dry = row.queue_estimate.starts.map(start => ({ skill_id: start.skill_id, start_ms: start.start_ms }));
    ((evidence.real_fight_first_starts ??= {}) as Record<string, unknown>)[row.id] = { real: starts.slice(0, 4).map(start => start.start_ms), dry: dry.map(start => start.start_ms) };
    if (row.id === 'knight_striker') {
      assert.deepEqual(starts[0], dry[0]); assert.equal(starts[1]!.skill_id, 'knight_pierce');
      assert.ok(starts[1]!.start_ms < dry[1]!.start_ms, `Quicken aspd_up must shorten the next interval: ${starts[1]!.start_ms} vs ${dry[1]!.start_ms}`);
    } else assert.deepEqual(starts.slice(0, 4), dry, row.id);
  }
});

// --- Roles ------------------------------------------------------------------------------------------
const boss = (): ActorInput => {
  const cleave: SkillDefinition = { ...structuredClone(resolved('swordsman_magnum_break', 1).definition as Extract<SkillDefinition, { kind: 'active' }>), id: 'probe_cleave', class_id: 'enemy', cost: { sp: 0, spirit_spheres: 0 }, timing: { cast_ms: 800, after_cast_ms: 400, interruptible: false } };
  (cleave as Extract<SkillDefinition, { kind: 'active' }>).effects = [{ id: 'hit', type: 'damage', target: 'foes', formula: { id: 'flat_power', params: { amount: 120 } }, damage_type: 'physical', element: 'neutral', hit_rule: 'always', can_crit: false, hits: 1, armor_rule: 'normal' }];
  const actor = probe('e_boss', 'enemy', 'front_1', [{ level: 1, definition: cleave }], true); actor.stat_blueprint.derived_offsets.max_hp = 2000000000; actor.stat_blueprint.derived_offsets.physical_attack = 60; return actor;
};
function roleRun(row: Build, seed: number) {
  const party = [buildActor(row, 'hero', 'back_1'), probe('p_front', 'player', 'front_1', [], true), probe('p_mid', 'player', 'front_2', [], true), probe('p_back', 'player', 'back_2', [], true)];
  for (const ally of party.slice(1)) ally.stat_blueprint.derived_offsets.physical_attack = 0;
  const mode: BattleCheckpoint['mode'] = { kind: 'story', ref: 't029-roles', time_limit_ms: 60000, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] };
  const initial = unwrap(createBattle({ actors: [...party, boss()], mode }, content, seed));
  const scenario: Scenario = { id: 't029_roles', schema_version: 1, content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version, seed, mode: { kind: 'story', ref: mode.ref }, budget_policy: 'explicit_single_scenario', log_level: 'trace', team: party.map(actor => ({ actor_id: actor.actor_id, build_id: actor.build_hash, position: actor.position as Scenario['team'][number]['position'], equipment_profile: 'no_gear_build_snapshot' })) as Scenario['team'] };
  return unwrap(runScenario(captureReplay(scenario, initial, row.id, {}), content)).report;
}
function roleMetrics(row: Build, seeds = [1, 2, 3, 4, 5]) {
  const rows = seeds.map(seed => {
    const report = roleRun(row, seed), events = report.events!, damage = (filter: (event: BattleEvent) => boolean) => events.filter(event => event.type === 'damage' && filter(event)).reduce((sum, event) => sum + (event.amount ?? 0), 0);
    return { dps: report.actors.hero!.dps, heroTaken: report.actors.hero!.metrics.damage_received ?? 0, alliesTaken: ['p_front', 'p_mid', 'p_back'].reduce((sum, id) => sum + (report.actors[id]!.metrics.damage_received ?? 0), 0),
      bossNormalsOnHero: events.filter(event => event.type === 'normal_attack' && event.actor_id === 'e_boss' && event.target_id === 'hero').length,
      counter: damage(event => event.skill_id === 'knight_counter_stance' && event.origin === 'proc'), reflect: damage(event => event.skill_id === 'crusader_reflect' && event.origin === 'reflect'),
      transfer: damage(event => event.origin === 'transfer' && event.target_id === 'hero'), holy: damage(event => ['crusader_holy_cross', 'crusader_grand_cross'].includes(event.skill_id!) && event.actor_id === 'hero'),
      teamDefense: new Set(report.status_timeline.filter(event => event.type === 'status_applied' && event.status_change!.status_id === 'defense_up').map(event => event.target_id)).size };
  });
  const mean = (key: keyof typeof rows[number]) => rows.reduce((sum, value) => sum + value[key], 0) / rows.length;
  return Object.fromEntries(Object.keys(rows[0]!).map(key => [key, mean(key as keyof typeof rows[number])])) as Record<keyof typeof rows[number], number>;
}

test('T029 AC-02: Knight striker/counter-tank and Crusader guardian/holy-striker show their distinct roles in one matched encounter', () => {
  const striker = roleMetrics(build('knight_striker')), tank = roleMetrics(build('knight_counter_tank')), guardian = roleMetrics(build('crusader_guardian')), holy = roleMetrics(build('crusader_holy_striker'));
  evidence.roles = { seeds: [1, 2, 3, 4, 5], encounter: 'hero back_1 + 3 probe allies vs probe boss (normal attack + 120 flat cleave), 60s, no gear; role evidence, not a balance verdict', mean: { knight_striker: striker, knight_counter_tank: tank, crusader_guardian: guardian, crusader_holy_striker: holy } };
  // Knight: attack build out-damages the counter tank; the tank pulls the boss onto itself and punishes it.
  assert.ok(striker.dps > tank.dps * 1.3, `striker ${striker.dps} vs tank ${tank.dps}`);
  assert.equal(striker.bossNormalsOnHero, 0); assert.ok(tank.bossNormalsOnHero > 5 && tank.counter > 0 && striker.counter === 0 && tank.alliesTaken < striker.alliesTaken, `tank ${JSON.stringify(tank)}`);
  // Crusader: guardian redirects allies' damage and raises team defense; holy striker deals holy burst damage.
  assert.ok(guardian.transfer > 0 && holy.transfer === 0 && guardian.alliesTaken < holy.alliesTaken, `guardian allies ${guardian.alliesTaken} vs holy ${holy.alliesTaken}`);
  assert.equal(guardian.teamDefense, 4); assert.equal(holy.teamDefense, 0);
  assert.ok(holy.holy > 0 && holy.dps > guardian.dps * 1.3, `holy ${holy.dps} vs guardian ${guardian.dps}`);
  assert.ok(guardian.reflect > 0 && holy.reflect > 0, `reflect ${guardian.reflect}/${holy.reflect}`);
});

test('T029 AC-02: Devotion routes P100 as 52/48 (Lv10) and 0.6+0.6 as 50/50/0 once, without re-mitigating or chaining', () => {
  const hit = (amount: number): Effect => ({ id: 'hit', type: 'damage', target: 'foe', formula: { id: 'flat_power', params: { amount } }, damage_type: 'true', element: 'neutral', hit_rule: 'always', can_crit: false, hits: 1, armor_rule: 'ignore' });
  const devotion = resolved('crusader_devotion', 10);
  const enemySkill = (amount: number) => ({ level: 1, definition: { ...structuredClone(resolved('swordsman_bash', 1).definition), id: 'probe_hit', class_id: 'enemy', cost: { sp: 0, spirit_spheres: 0 }, timing: { cast_ms: 3000, after_cast_ms: 0, interruptible: false }, effects: [hit(amount)] } as SkillDefinition });
  // D-104 raised Lv10's .3 redirect ratio to .525; P100 floors the transfer to 52.
  // The crusader's own hits never route. The explicit .6+.6 fixture below remains unchanged.
  const single = run([probe('p_ally', 'player', 'front_1'), probe('p_crusader', 'player', 'back_1', [devotion], false, 'crusader'), probe('e_hitter', 'enemy', 'front_1', [enemySkill(100)])], 9000);
  const first = single.events.filter(event => event.type === 'damage' && event.skill_id === 'probe_hit').slice(0, 2);
  assert.deepEqual(first.map(event => [event.target_id, event.amount, event.origin]), [['p_crusader', 52, 'transfer'], ['p_ally', 48, 'skill']]);
  assert.equal(first[0]!.mitigated, 52); assert.equal(first[1]!.mitigated, 48);
  // Two crusaders each linking .6 to one ally: 50/50/0, one routing pass even though the crusaders link each other.
  const status = (ratio: number) => ({ level: 1, definition: { ...structuredClone(devotion.definition), id: `devotion_link_${ratio * 10}`, cost: { sp: 0, spirit_spheres: 0 }, effects: [{ id: 'devotion', type: 'apply_status', target: 'friends', status_id: 'devotion', duration_ms: 60000, params: { ratio }, chance: 1 }] } as SkillDefinition });
  const pair = run([probe('p_ally', 'player', 'front_1'), probe('p_cru_a', 'player', 'back_1', [status(.6)]), probe('p_cru_b', 'player', 'back_2', [status(.6)]), probe('e_hitter', 'enemy', 'front_1', [enemySkill(100)])], 9000);
  const routed = pair.events.filter(event => event.type === 'damage' && event.skill_id === 'probe_hit').slice(0, 3);
  assert.deepEqual(routed.map(event => [event.target_id, event.amount]), [['p_cru_a', 50], ['p_cru_b', 50], ['p_ally', 0]]);
  assert.equal(routed.filter(event => event.origin === 'transfer').length, 2);
  evidence.devotion = { lv10_p100: first.map(event => [event.target_id, event.amount, event.origin]), pair_06_06_p100: routed.map(event => [event.target_id, event.amount, event.origin]) };
});

// --- Runtime vs runner --------------------------------------------------------------------------------
test('T029 AC-04: same seed/build gives identical state, events and metrics in server commands, client session (with render views) and runner', async () => {
  // Parity fixture, not a balance check: 3-8 keeps this two-built-member team alive long enough for every tree skill to act
  // (6-20 became too hard for it after the 21 Oct 2026 calibration, so its late skills never cast).
  const { runner, clientEvents, code, confirmations, team, stage } = await storyParity('swordsman', [build('knight_counter_tank'), build('crusader_guardian')], '3-8', 29);
  // Metrics carry actor/skill/proc attribution for the tree skills that acted.
  for (const key of ['main:swordsman_provoke', 'main:knight_counter_stance', 'npc_swordsman:crusader_devotion', 'npc_swordsman:crusader_defender']) assert.ok((runner.report.skills[key]?.metrics.casts_resolved ?? 0) > 0, key);
  assert.ok(Object.keys(runner.report.damage_breakdown).some(key => { const [, skill, , origin] = JSON.parse(key) as string[]; return skill === 'knight_counter_stance' && origin === 'proc'; }), 'counter proc attribution');
  evidence.parity = { stage, seed: 29, team, outcome: code, end_ms: runner.report.end_ms, events: clientEvents.length, server_confirmations: confirmations, event_digest: runner.report.event_digest, tree_skill_metrics: Object.fromEntries(Object.entries(runner.report.skills).filter(([key]) => /:(swordsman|knight|crusader)_/.test(key)).map(([key, value]) => [key, { casts_resolved: value.metrics.casts_resolved, hp_damage: value.metrics.hp_damage }])) };
});
