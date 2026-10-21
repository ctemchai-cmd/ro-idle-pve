import test from 'node:test';
import assert from 'node:assert/strict';
import type { Effect } from '../../src/contracts/index.ts';
import { actor, battle, checkpoint, content, unwrap } from './combat-fixtures.ts';
import { EffectPipeline } from '../../src/domain/combat/effects.ts';
import { emptyMetrics } from '../../src/domain/combat/model.ts';
import { combatStatistics } from '../../src/domain/combat/statistics.ts';
import { restoreBattle, serializeBattle, advanceUntil } from '../../src/domain/combat/index.ts';
import { DemoSession } from '../../src/client/demo.ts';

function fixture() {
  const state = checkpoint(battle([actor('healer', 'player'), actor('tank', 'player'), actor('enemy', 'enemy')]));
  const pipeline = new EffectPipeline(state, content, { emit: () => {}, interrupt: () => {}, revive: () => {}, metric: (actor, skill, key, amount) => {
    for (const row of [state.metrics.team[actor.team], state.metrics.actors[actor.actor_id]!, state.metrics.skills[`${actor.actor_id}:${skill}`] ??= emptyMetrics()]) row[key] = (row[key] ?? 0) + amount;
  } });
  function apply(sourceId: string, targetId: string, effect: Effect) {
    const source = state.actors.find(a => a.actor_id === sourceId)!, target = state.actors.find(a => a.actor_id === targetId)!;
    const context = pipeline.context(source, 'fixture', 'skill', 'fixture'); context.selected = { foe: [target] }; pipeline.program([effect], context);
  }
  return { state, apply };
}
test('Tank belongs to recipient:20HP+30shield=50; provider gets shield support;50overkill is excluded', () => {
  const { state, apply } = fixture(); state.actors.find(a => a.actor_id === 'tank')!.hp = 20;
  apply('healer', 'tank', { id: 'shield', type: 'shield', target: 'foe', formula: { id: 'flat_power', params: { amount: 30 } }, duration_ms: 10000, dispelable: true });
  apply('enemy', 'tank', { id: 'hit', type: 'damage', target: 'foe', formula: { id: 'flat_power', params: { amount: 100 } }, damage_type: 'true', element: 'neutral', hit_rule: 'always', can_crit: false, hits: 1, armor_rule: 'normal' });
  const report = combatStatistics(state), tank = report.actors.find(a => a.actor_id === 'tank')!, healer = report.actors.find(a => a.actor_id === 'healer')!;
  assert.deepEqual([tank.hp_received, tank.shield_received, tank.tank], [20, 30, 50]); assert.equal(healer.tank, 0);
  assert.equal(state.metrics.actors.healer!.shield_absorbed, 30); assert.equal(state.metrics.actors.enemy!.overkill, 50); assert.equal(state.metrics.team.player.damage_received, 20);
});
test('Healing counts4 restored HP instead of10 attempted; all rates are finite at zero time', () => {
  const { state, apply } = fixture(), target = state.actors.find(a => a.actor_id === 'tank')!; target.hp = target.stats.max_hp - 4;
  apply('healer', 'tank', { id: 'heal', type: 'heal', target: 'foe', formula: { id: 'flat_power', params: { amount: 10 } } });
  const healer = combatStatistics(state).actors.find(a => a.actor_id === 'healer')!;
  assert.equal(healer.healing, 4); assert.equal(healer.hps, 0); assert.equal(state.metrics.actors.healer!.overheal, 6);
});
test('actor incoming metrics equal authoritative event amounts and survive midfight restore without event history', () => {
  const session = new DemoSession('boss', 2); session.advanceTo(10000);
  for (const row of session.statistics().actors) {
    const incoming = session.history.filter(e => e.type === 'damage' && e.target_id === row.actor_id);
    assert.equal(row.hp_received, incoming.reduce((sum, event) => sum + event.amount!, 0));
    assert.equal(row.shield_received, incoming.reduce((sum, event) => sum + (event.absorbed ?? 0), 0));
    assert.equal(row.dps, row.damage / 10); assert.equal(row.hps, row.healing / 10);
  }
  const restored = unwrap(restoreBattle(serializeBattle(session.state), session.content)); assert.deepEqual(combatStatistics(restored), session.statistics());
  assert.deepEqual(unwrap(advanceUntil(restored, 90000, session.content)), unwrap(advanceUntil(session.state, 90000, session.content)));
});
test('same virtual time gives identical statistics after irregular ticks; fresh battle resets all totals', () => {
  const fast = new DemoSession('field', 2), ticks = new DemoSession('field', 2); fast.advanceTo(10000);
  for (const at of [111, 1500, 2317, 3654, 5001, 9999, 10000]) ticks.advanceTo(at);
  assert.deepEqual(ticks.statistics(), fast.statistics());
  assert.ok(fast.statistics().actors.some(a => a.tank > 0));
  for (const row of new DemoSession().statistics().actors) assert.deepEqual([row.damage, row.dps, row.healing, row.hps, row.tank], [0, 0, 0, 0, 0]);
});
test('per-skill split (user, 21 Oct 2026): each actor\'s skills add up to its damage/healing; normal attacks are their own row with hit counts', () => {
  const session = new DemoSession('boss', 2); session.advanceTo(20000);
  const report = session.statistics(); let sawSkill = false, sawNormal = false;
  for (const row of report.actors) {
    assert.equal(row.skills.reduce((sum, s) => sum + s.damage, 0), row.damage, `${row.actor_id} damage split`);
    assert.equal(row.skills.reduce((sum, s) => sum + s.healing, 0), row.healing, `${row.actor_id} healing split`);
    assert.ok(row.skills.every(s => s.skill_id !== 'resource_regen'));
    const normal = row.skills.find(s => s.skill_id === 'normal_attack'); if (normal) { sawNormal = true; assert.equal(normal.uses, session.history.filter(e => e.type === 'normal_attack' && e.actor_id === row.actor_id).length); }
    for (const s of row.skills.filter(s => s.skill_id !== 'normal_attack' && s.uses > 0)) { sawSkill = true; assert.equal(s.uses, session.history.filter(e => e.type === 'cast_resolve' && e.actor_id === row.actor_id && e.skill_id === s.skill_id).length, `${row.actor_id} ${s.skill_id} uses`); }
  }
  assert.ok(sawSkill && sawNormal);
});
