import test from 'node:test';
import assert from 'node:assert/strict';
import { actor, content, unwrap, skill, type Active } from './combat-fixtures.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { createBattle, advanceUntil, type BattleState } from '../../src/domain/combat/index.ts';
import { effectDescriptions } from '../../src/client/skills.ts';
import { resolveStats } from '../../src/domain/math/index.ts';
import { hiContent } from './hi-content-fixtures.ts';
import before from './fixtures/hunter-before-128.json';
const specs = { hunter_blitz_beat: [1.4, 2.5, 3], hunter_claymore: [4.5, 7.5, 1], hunter_rapid_fire: [1.575, 2.625, 4] } as const;
const awakened = hiContent(true);
test('D158 three Hunter curves are explicit at every rank; queue, prices, and non-damage fields stay unchanged', () => {
  for (const [id, [low, high, hits]] of Object.entries(specs)) for (let rank = 1; rank <= 10; rank++) {
    const s = resolveSkill(id, rank, content).definition as Active, e = s.effects[0]!;
    assert.equal(e.type, 'damage'); if (e.type !== 'damage') continue;
    assert.equal(e.hits, hits); assert.equal(e.element, id === 'hunter_claymore' ? 'fire' : 'weapon');
    assert.ok('attack_ratio' in e.formula.params);
    assert.equal(e.formula.params.attack_ratio, Number((low + (high - low) * (rank - 1) / 9).toFixed(6)));
    const old = before.find(s => s.id === id)!;
    assert.deepEqual(s.cost, old.cost); assert.deepEqual(s.timing, old.timing);
    assert.deepEqual(s.selectors, old.selectors);
    const a = resolveSkill(id, 1, awakened, true).definition as Active;
    const aw = a.effects[0]!;
    assert.ok(aw.type === 'damage' && 'attack_ratio' in aw.formula.params && Number(aw.formula.params.attack_ratio) >= high);
    const descriptions = effectDescriptions(s.effects).join(' ');
    assert.ok(descriptions.includes(id === 'hunter_claymore' ? 'ไฟ' : 'ตามธาตุอาวุธ'), descriptions);
  }
});
test('D158 actual hits apply full per-target power to one boss or three targets, with speed/checkpoint/interrupt parity', () => {
  for (const id of Object.keys(specs)) for (const count of [1, 3]) {
    const s = structuredClone(resolveSkill(id, 10, content).definition) as Active;
    s.timing.after_cast_ms = 60000;
    const p = actor('caster', 'player', [s]); p.stat_blueprint.derived_offsets.max_sp = 1000;
    p.stat_blueprint.derived_offsets.physical_attack += 1000 - resolveStats(p.stat_blueprint, content).physical_attack;
    // Fix hit/crit only in this numerical oracle; product hit/crit rules remain unchanged.
    for (const e of s.effects) if (e.type === 'damage') { e.hit_rule = 'always'; e.can_crit = false; }
    const foes = Array.from({ length: count }, (_, n) => actor('foe_' + n, 'enemy'));
    const initial = unwrap(createBattle({ actors: [p, ...foes], mode: { kind: 'story', ref: 'hunter-rule-check', time_limit_ms: 90000, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] } }, content, 17));
    const expected = unwrap(advanceUntil(initial, 6000, content));
    const damage = expected.events.filter(e => e.type === 'damage' && e.skill_id === id), [,, hits] = specs[id as keyof typeof specs];
    assert.equal(damage.length, hits * (id === 'hunter_rapid_fire' ? 1 : count));
    for (const e of damage) assert.equal(e.raw, specs[id as keyof typeof specs][1] * 1000);
    for (const speed of [1, 2, 4]) {
      let state: BattleState = structuredClone(initial); const events = [];
      for (let to = 250 * speed; to <= 6000; to += 250 * speed) { const r = unwrap(advanceUntil(state, to, content)); state = JSON.parse(JSON.stringify(r.state)); events.push(...r.events); }
      assert.deepEqual(events, expected.events); assert.deepEqual(state, expected.state);
    }
  }
});
test('Hunter cast interrupted after SP spending produces no skill hit or refund at any speed', () => {
  for (const id of Object.keys(specs)) {
    const shot = structuredClone(resolveSkill(id, 10, content).definition) as Active;
    const stun = skill('interrupt_hunter', 100, 60000, 0);
    stun.effects = [{ id: 'stun', type: 'apply_status', target: 'foe', status_id: 'stun', duration_ms: 3000, params: {}, chance: 1 }];
    const p = actor('caster', 'player', [shot]); p.stat_blueprint.derived_offsets.max_sp = 1000;
    const input = { actors: [p, actor('boss', 'enemy', [stun])], mode: { kind: 'story' as const, ref: 'hunter-interrupt', time_limit_ms: 90000, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] } };
    const initial = unwrap(createBattle(input, content, 17)), expected = unwrap(advanceUntil(initial, 6000, content));
    assert.equal(expected.events.filter(e => e.type === 'cast_interrupt' && e.actor_id === 'caster').length, 1, id);
    assert.equal(expected.events.filter(e => e.type === 'damage' && e.skill_id === id).length, 0, id);
    assert.equal(expected.state.metrics.actors.caster!.sp_spent, shot.cost.sp);
    for (const speed of [1, 2, 4]) {
      let state: BattleState = initial; const events = [];
      for (let to = 250 * speed; to <= 6000; to += 250 * speed) { const r = unwrap(advanceUntil(state, to, content)); state = JSON.parse(JSON.stringify(r.state)); events.push(...r.events); }
      assert.deepEqual(events, expected.events); assert.deepEqual(state, expected.state);
    }
  }
});
