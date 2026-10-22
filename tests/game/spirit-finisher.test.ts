// Small rule checks only: no simulation/calibration batch or balance verdict.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { recomputeStats } from '../../src/domain/combat/status.ts';
import { rawPower } from '../../src/domain/math/index.ts';
import { characterSkillOptions } from '../../src/client/skills.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { actor, battle, checkpoint, content, step, skill, type Active } from './combat-fixtures.ts';
import { checkGolden, goldens } from './class-skills.ts';

const resolve = (id: string, level = 10) => structuredClone(resolveSkill(id, level, content).definition) as Active;
const ids = ['monk_triple_attack', 'monk_finger_offensive', 'monk_asura'];
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test('the nine raw-intent reference cases at levels1/4/10 match the shipped spenders', () => {
  const rows = goldens(ids); assert.equal(rows.length, 9); for (const row of rows) checkGolden(row);
});

test('D-093 highest-level spenders compensate preparation through their own power, without changing costs or hit rules', () => {
  for (const [id, ratio, hits, spheres, ct, acd] of [
    ['monk_triple_attack', 1.0625, 3, 1, 150, 750],
    ['monk_finger_offensive', 1.4625, 5, 5, 1000, 1000],
    ['monk_asura', 5.625, 1, 5, 1300, 1600],
  ] as const) {
    const s = resolve(id), hit = s.effects[0]!; assert.equal(hit.type, 'damage'); if (hit.type !== 'damage') throw new Error('DAMAGE_REQUIRED');
    if (hit.formula.id !== 'physical_power' && hit.formula.id !== 'sp_burst_power') throw new Error('PHYSICAL_FORMULA_REQUIRED');
    close(Number(hit.formula.params.attack_ratio), ratio * 1.75); assert.equal(hit.hits, hits); assert.equal(s.cost.spirit_spheres, spheres);
    assert.deepEqual(s.timing, { cast_ms: ct, after_cast_ms: acd, interruptible: true });
    assert.equal(hit.hit_rule, 'physical_roll'); assert.equal(hit.can_crit, true); assert.equal(hit.armor_rule, 'normal'); assert.equal(s.effects.length, 1);
  }
  const asura = resolve('monk_asura'); assert.deepEqual(asura.cost.sp, { mode: 'all_current', minimum_sp: 30 });
  const hit = asura.effects[0]!; if (hit.type !== 'damage' || hit.formula.id !== 'sp_burst_power') throw new Error('SP_BURST_REQUIRED'); close(Number(hit.formula.params.sp_ratio), 2.925 * 1.75);
});

test('D-093 actual cast snapshots use only remaining spheres and pre-cost SP; power enters the shared pipeline exactly once', () => {
  for (const id of ids) {
    const s = resolve(id), source = actor('monk', 'player', [s]); source.stat_blueprint.derived_offsets.physical_attack = 1000;
    const initial = checkpoint(battle([source, actor('boss', 'enemy')])), monk = initial.actors.find(a => a.actor_id === 'monk')!, base = monk.stats.physical_attack;
    monk.spirit_spheres = 5; recomputeStats(monk, content);
    const started = step(initial, 1500).state.actors.find(a => a.actor_id === 'monk')!, cast = started.cast!;
    assert.ok(cast); assert.equal(started.spirit_spheres, 5 - Number(s.cost.spirit_spheres)); close(cast.offense_snapshot.physical_attack, base * (1 + started.spirit_spheres * .01));
    if (id === 'monk_asura') assert.equal(started.sp, 0);
    const hit = s.effects[0]!; if (hit.type !== 'damage') throw new Error('DAMAGE_REQUIRED');
    const expected = rawPower(hit.formula, cast.offense_snapshot, cast.pre_cost.sp), landed = step(initial, 1500 + Number(s.timing.cast_ms)).events.filter(e => e.actor_id === 'monk' && e.skill_id === id && e.type === 'damage');
    assert.ok(landed.length > 0); for (const event of landed) close(event.raw!, expected);
  }
});

test('stronger finishers still skip without spheres and never deal their damage or refund costs after interruption', () => {
  for (const id of ids) {
    const s = resolve(id), missing = step(battle([actor('monk', 'player', [s]), actor('boss', 'enemy')]), 1500);
    assert.ok(missing.events.some(e => e.type === 'sphere_skip' && e.actor_id === 'monk')); assert.ok(!missing.events.some(e => e.type === 'damage' && e.skill_id === id));
    const stun = skill('cut_probe', Math.floor(Number(s.timing.cast_ms) / 2), 60000, 0); stun.effects = [{ id: 'stun', type: 'apply_status', target: 'foe', status_id: 'stun', duration_ms: 3000, params: {}, chance: 1 }];
    const initial = checkpoint(battle([actor('monk', 'player', [s]), actor('boss', 'enemy', [stun])])), monk = initial.actors.find(a => a.actor_id === 'monk')!;
    monk.spirit_spheres = 5; recomputeStats(monk, content); const cut = step(initial, 1500 + Number(s.timing.cast_ms));
    assert.ok(cut.events.some(e => e.type === 'cast_interrupt' && e.actor_id === 'monk')); assert.ok(!cut.events.some(e => e.type === 'damage' && e.skill_id === id));
    assert.equal(cut.state.actors.find(a => a.actor_id === 'monk')!.spirit_spheres, 5 - Number(s.cost.spirit_spheres));
  }
});

test('the skill page reads new power and multi-hit counts from the same definitions', () => {
  const state = initializeAccount(content, { root_job_id: 'acolyte', gender: 'male' }, '2026-10-21T00:00:00.000Z', '2026-10-21', 1), monk = state.roster[0]!;
  monk.job_id = 'monk'; monk.level = 70; monk.skill_levels = { ...monk.skill_levels, ...Object.fromEntries(ids.map(id => [id, 10])) };
  const options = characterSkillOptions(monk, state).skills;
  for (const [id, count] of [['monk_triple_attack', 3], ['monk_finger_offensive', 5]] as const) assert.ok(options.find(s => s.id === id)!.effects.some(text => text.includes(`× ${count} ครั้ง`)));
  assert.ok(options.find(s => s.id === 'monk_asura')!.effects.some(text => text.includes('984.38% ATK') && text.includes('511.88% SP')));
});
