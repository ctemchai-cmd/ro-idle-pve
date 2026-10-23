// Focused rule/presentation checks only; no balance simulation or calibration batches.
import test from 'node:test';
import assert from 'node:assert/strict';
import { recomputeStats } from '../../src/domain/combat/status.ts';
import { battleStatusViews } from '../../src/client/combat-status.ts';
import { spiritSpherePoints } from '../../src/renderer/spirit-spheres.ts';
import { actor, battle, checkpoint, content, skill, step, type Active } from './combat-fixtures.ts';
import { resolved } from './class-skills.ts';

function gain() {
  const s = skill('probe_gain_spheres', 0, 0, 0);
  s.effects = [{ id: 'spheres', type: 'resource_change', target: 'self', resource: 'spirit_spheres', amount: 5 }]; return s;
}
function monk(skills: Active[]) { const a = actor('monk', 'player', skills); a.stat_blueprint.derived_offsets.physical_attack = 1000; return a; }

test('held spheres add0–5% in the existing ATK bucket, without changing speed or magic', () => {
  const a = checkpoint(battle([monk([]), actor('boss', 'enemy')])).actors.find(a => a.actor_id === 'monk')!, base = a.stats.physical_attack, speed = a.stats.attack_speed, magic = a.stats.magical_attack;
  for (let count = 0; count <= 5; count++) { a.spirit_spheres = count; recomputeStats(a, content); assert.equal(a.stats.physical_attack, base * (1 + count * .01)); assert.equal(a.stats.attack_speed, speed); assert.equal(a.stats.magical_attack, magic); }
  const buff = gain(); buff.effects.push({ id: 'attack', type: 'apply_status', target: 'self', status_id: 'attack_up', duration_ms: 5000, params: { ratio: .5 }, chance: 1 });
  const mixed = step(battle([monk([buff]), actor('boss', 'enemy')]), 1500).state.actors.find(a => a.actor_id === 'monk')!;
  assert.equal(mixed.stats.physical_attack, base * 1.55); assert.notEqual(mixed.stats.physical_attack, base * 1.5 * 1.05);
});

test('gain and cast costs recompute ATK before the snapshot; interruption never refunds spent spheres', () => {
  for (const cost of [1, 5]) {
    const spend = skill('sphere_spend', 1000, 0, 0); spend.cost.spirit_spheres = cost;
    const stun = skill('stun_probe', 1600, 5000, 0); stun.effects = [{ id: 'stun', type: 'apply_status', target: 'foe', status_id: 'stun', duration_ms: 1000, params: {}, chance: 1 }];
    const initial = battle([monk([gain(), spend]), actor('boss', 'enemy', [stun])]), base = initial.actors.find(a => a.actor_id === 'monk')!.stats.physical_attack;
    const holding = step(initial, 1500).state.actors.find(a => a.actor_id === 'monk')!; assert.equal(holding.spirit_spheres, 5); assert.equal(holding.stats.physical_attack, base * 1.05);
    const casting = step(initial, 3000).state.actors.find(a => a.actor_id === 'monk')!; assert.equal(casting.spirit_spheres, 5 - cost); assert.equal(casting.cast!.offense_snapshot.physical_attack, base * (1 + (5 - cost) * .01));
    const cut = step(initial, 3100); assert.ok(cut.events.some(e => e.type === 'cast_interrupt' && e.actor_id === 'monk')); assert.equal(cut.state.actors.find(a => a.actor_id === 'monk')!.spirit_spheres, 5 - cost);
  }
});

test('live status view groups Blessing effects without hiding independent sources, stacks, expiry or shields', () => {
  const blessing = resolved('acolyte_blessing', 1).definition as Active, kyrie = resolved('priest_kyrie', 1).definition as Active;
  const initial = battle([actor('a', 'player', [blessing]), actor('b', 'player', [blessing]), actor('c', 'player', [kyrie]), actor('boss', 'enemy')]);
  const state = step(initial, 2500).state, projection = battleStatusViews(state), a = projection.a!;
  const bless = a.statuses!.find(g => g.id === 'acolyte_blessing:buff')!; assert.equal(bless.stacks, 2); assert.equal(bless.instances.length, 4); assert.deepEqual(new Set(bless.instances.map(i => i.source_actor_id)), new Set(['a', 'b']));
  assert.equal(bless.next_expiry_at, Math.min(...bless.instances.map(i => i.expires_at))); assert.ok(a.statuses!.some(g => g.instances.some(i => i.status_id === 'shield' && i.description.includes('HP'))));
  const changed = checkpoint(state); changed.actors.find(a => a.actor_id === 'a')!.statuses = changed.actors.find(a => a.actor_id === 'a')!.statuses.filter(i => i.source.owner_actor_id !== 'a'); changed.actors.find(a => a.actor_id === 'a')!.shields = [];
  const updated = battleStatusViews(changed).a!; assert.equal(updated.statuses!.find(g => g.id === bless.id)!.stacks, 1); assert.ok(!updated.statuses!.some(g => g.instances.some(i => i.status_id === 'shield')));
  changed.game_time_ms = Math.max(...changed.actors.find(a => a.actor_id === 'a')!.statuses.map(i => i.expires_at)); assert.equal(battleStatusViews(structuredClone(changed)).a!.statuses!.length, 0);
  assert.equal(battleStatusViews(state), projection); assert.ok(Object.isFrozen(state));
});

test('sphere projection and orbit geometry show the exact resource count, using only game time', () => {
  const state = checkpoint(step(battle([monk([gain()]), actor('boss', 'enemy')]), 1500).state); const view = battleStatusViews(state).monk!;
  assert.equal(view.spirit_spheres, 5); assert.equal(view.spirit_attack_bonus, .05); assert.equal(view.spirit_attack_per_sphere, .01);
  for (let count = 0; count <= 5; count++) { assert.equal(spiritSpherePoints(count, 1000).length, count); assert.deepEqual(spiritSpherePoints(count, 1000), spiritSpherePoints(count, 1000)); }
  assert.notDeepEqual(spiritSpherePoints(5, 1000), spiritSpherePoints(5, 1100));
});

test('revive clears the old sphere bonus before rebuilding the revived actor stats', () => {
  const revive=skill('probe_revive',1600,1300,60);revive.selectors={dead:{team:'allies',life:'dead',select:'front_first',count:null,phase:'cast_resolve',missing:'skip'}};revive.effects=[{id:'revive',type:'revive',target:'dead',hp_ratio:.35,sp_ratio:0}];
  const healer = actor('healer', 'player', [revive]);
  const state = checkpoint(battle([monk([]), healer, actor('boss', 'enemy')])), a = state.actors.find(a => a.actor_id === 'monk')!, base = a.stats.physical_attack;
  a.spirit_spheres = 5; recomputeStats(a, content); a.hp = 0; a.action_phase = 'dead'; a.phase_ready_at = null;
  const revived = step(state, 4000).state.actors.find(a => a.actor_id === 'monk')!; assert.ok(revived.hp > 0); assert.equal(revived.spirit_spheres, 0); assert.equal(revived.stats.physical_attack, base);
});
