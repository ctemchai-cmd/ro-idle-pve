import test from 'node:test';
import assert from 'node:assert/strict';
import cases from '../../plan/data/combat-cases.json';
import { calculateDamage, resolveStats, skillIntervalMs, castDurationMs, spRegen } from '../../src/domain/math/index.ts';
import { nextRandom } from '../../src/domain/combat/rng.ts';
import { actor, content } from './combat-fixtures.ts';

for (const fixture of cases.derived_cases) test(`M0 stat golden: ${fixture.id}`, () => {
  const blueprint = actor('a', 'player').stat_blueprint;
  blueprint.derived_offsets = Object.fromEntries(Object.keys(blueprint.derived_offsets).map(key => [key, 0])) as typeof blueprint.derived_offsets;
  blueprint.level = fixture.level; blueprint.allocated_primary = fixture.primary;
  const stats = resolveStats(blueprint, content);
  for (const [key, expected] of Object.entries(fixture.expected)) assert.equal(stats[key as keyof typeof stats], expected, key);
});
for (const fixture of cases.damage_cases) test(`M0 mitigation golden: ${fixture.id}`, () => {
  const input = fixture.input as unknown as Record<string, number | boolean>;
  const result = calculateDamage({ raw: Number(input.raw), defense: Number(input.defense ?? 0), armor_break: Number(input.armor_break ?? 0), penetration: Number(input.penetration_percent ?? 0), flat_penetration: Number(input.flat_penetration ?? 0), outgoing: Number(input.outgoing_bonus ?? 0), element: Number(input.element_multiplier ?? 1), crit: input.is_crit ? Number(input.crit_multiplier) : 1, flat_reduction: Number(input.flat_reduction ?? 0), guard: Number(input.guard ?? 0), vulnerability: Number(input.vulnerability ?? 0) });
  const expected = fixture.expected as unknown as Record<string, number>;
  assert.equal(result, expected.before_shield ?? expected.before_shield_per_hit);
  if (input.hits) assert.equal(result * Number(input.hits), expected.total_before_shield);
});
test('RNG matches independently calculated states, including seed0', () => {
  const rng = { state: 1, draw_count: 0 };
  for (const expected of cases.rng_case.expected_first_states) { nextRandom(rng); assert.equal(rng.state, expected); }
  assert.equal(rng.draw_count, 5);
  const zero = { state: 0, draw_count: 0 }; nextRandom(zero); assert.equal(zero.state, 1013904223);
});
test('timers have1ms natural minimum, with uncapped speed and zero CT', () => {
  assert.equal(skillIntervalMs(100), 1500); assert.equal(skillIntervalMs(125), 1200); assert.equal(skillIntervalMs(1000000), 1);
  assert.equal(castDurationMs(0, 1000000), 0); assert.equal(castDurationMs(1000, 125), 800);
});
test('negative bonuses remain negative and max resources floor after modifiers', () => {
  const blueprint = actor('a', 'player').stat_blueprint;
  const stats = resolveStats(blueprint, content, [{ id: 'reduced_regen', stat: 'sp_regen_percent', bucket: 'bonus', op: 'add_flat', value: -2 }, { id: 'fraction_hp', stat: 'max_hp', bucket: 'derived', op: 'add_flat', value: .7 }]);
  assert.equal(stats.sp_regen_percent, -2); assert.equal(spRegen(stats), 0); assert.equal(stats.max_hp, 100000220);
});
