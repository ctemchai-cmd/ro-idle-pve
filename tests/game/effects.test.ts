import test from 'node:test';
import assert from 'node:assert/strict';
import type { Effect, SkillDefinition, Trigger } from '../../src/contracts/index.ts';
import type { ActorInput, BattleEvent } from '../../src/domain/combat/model.ts';
import { emptyMetrics } from '../../src/domain/combat/model.ts';
import { EffectPipeline } from '../../src/domain/combat/effects.ts';
import { recomputeStats, weaponElement } from '../../src/domain/combat/status.ts';
import { restoreBattle, serializeBattle } from '../../src/domain/combat/index.ts';
import { canonical } from '../../src/content/value.ts';
import { advanceUntil } from '../../src/domain/combat/engine.ts';
import { actor, battle, checkpoint, content, skill, step, unwrap } from './combat-fixtures.ts';

function setup(inputs: ActorInput[] = [actor('a', 'player'), actor('b', 'enemy')]) {
  const state = checkpoint(battle(inputs)); const events: Omit<BattleEvent, 'at_ms' | 'phase' | 'sequence'>[] = [];
  const pipeline = new EffectPipeline(state, content, { emit: value => events.push(value), metric: (owner, id, key, amount) => {
    const row = state.metrics.skills[`${owner.actor_id}:${id}`] ??= emptyMetrics();
    row[key] += amount; state.metrics.actors[owner.actor_id]![key] += amount; state.metrics.team[owner.team][key] += amount;
  }, interrupt: () => {}, revive: () => {} });
  const a = state.actors[0]!, b = state.actors[1]!;
  function apply(effects: Effect[], source = a, target = b, id = 'fixture') {
    const context = pipeline.context(source, id, 'skill', `action_${state.event_sequence++}`); context.selected = { self: [source], foe: [target], target: [target] }; pipeline.program(effects, context); return context;
  }
  return { state, events, pipeline, a, b, apply };
}
function status(id: string, duration = 3000, params: Record<string, number> = {}, target = 'foe'): Extract<Effect, { type: 'apply_status' }> {
  return { id: 'status', type: 'apply_status', target, status_id: id, duration_ms: duration, params, chance: 1 };
}
function hit(amount = 40, target = 'foe'): Extract<Effect, { type: 'damage' }> {
  return { id: 'hit', type: 'damage', target, formula: { id: 'flat_power', params: { amount } }, damage_type: 'physical', element: 'neutral', hit_rule: 'always', can_crit: false, hits: 1, armor_rule: 'normal' };
}
function trigger(id: string, event: Trigger['event'], effects: Trigger['effects'], extra: Partial<Trigger> = {}): Trigger {
  return { id, event, effects, chance: 1, selectors: {}, accepted_origins: ['skill', 'normal', 'proc', 'reflect', 'system', 'periodic', 'transfer'], limit_scope: 'none', limit_count: 1, reentry: 'deny_same_source_trigger_in_ancestry', ...extra };
}
function trait(input: ActorInput, id: string, triggers: Trigger[]) {
  input.stat_blueprint.permanent_sources.push({ source: { instance_id: id, definition_id: id, owner_actor_id: input.actor_id, origin_actor_id: input.actor_id, origin_life_epoch: 0 }, modifiers: [], triggers });
}

test('independent same-caster and NPC buffs reproduce 156/288/252/216/120 without refresh', () => {
  const input = actor('a', 'player'); input.stat_blueprint.derived_offsets.physical_attack = 67;
  input.stat_blueprint.permanent_sources.push({ source: { instance_id: 'item', definition_id: 'item', owner_actor_id: 'a', origin_actor_id: 'a', origin_life_epoch: 0 }, modifiers: [{ id: 'flat', stat: 'physical_attack', bucket: 'derived', op: 'add_flat', value: 20 }], triggers: [] });
  const f = setup([input, actor('b', 'enemy')]); const values: number[] = [];
  f.apply([status('attack_up', 5000, { ratio: .3 })], f.a, f.a); values.push(f.a.stats.physical_attack);
  f.state.game_time_ms = 1000; f.apply([status('attack_up', 5000, { ratio: .3 })], f.a, f.a); f.apply([status('attack_up', 6000, { ratio: .8 })], f.b, f.a); values.push(f.a.stats.physical_attack);
  assert.equal(new Set(f.a.statuses.map(value => value.instance_id)).size, 3);
  for (const time of [5000, 6000, 7000]) { f.state.game_time_ms = time; f.pipeline.expire(); values.push(f.a.stats.physical_attack); }
  assert.deepEqual(values.map(value => Math.round(value * 1e6) / 1e6), [156, 288, 252, 216, 120]);
});
test('buff magnitude and repeated applications have no hidden cap', () => {
  const f = setup(); for (let i = 0; i < 100; i++) f.apply([status('attack_up', 3000, { ratio: .3 })], f.a, f.a);
  assert.equal(f.a.statuses.length, 100); assert.ok(Math.abs(f.a.stats.physical_attack - 33 * 31) < 1e-8);
});
test('removing one trait source and one status recomputes others instead of subtracting stats', () => {
  const f = setup(); f.apply([status('attack_up', 3000, { ratio: .3 }), status('attack_up', 5000, { ratio: .4 })], f.a, f.a);
  const blueprint = structuredClone(f.a.stat_blueprint); blueprint.derived_offsets.physical_attack = 67;
  blueprint.permanent_sources = ['item', 'passive'].map((id, index) => ({ source: { instance_id: id, definition_id: id, owner_actor_id: 'a', origin_actor_id: 'a', origin_life_epoch: 0 }, modifiers: [{ id: 'flat', stat: 'physical_attack', bucket: 'derived', op: 'add_flat', value: index === 0 ? 20 : 10 }], triggers: [] }));
  f.a.stat_blueprint = blueprint; recomputeStats(f.a, content); assert.equal(f.a.stats.physical_attack, 221);
  f.a.stat_blueprint.permanent_sources = f.a.stat_blueprint.permanent_sources.filter(source => source.source.instance_id !== 'item');
  f.apply([{ id: 'dispel', type: 'remove_status', target: 'self', polarity: 'buff', tags: [], permission: 'dispel', max_instances: 1 }], f.a, f.a);
  assert.equal(f.a.stats.physical_attack, 154); assert.equal(f.a.statuses.length, 1);
});
test('AoE outcomes isolate A-hit/B-miss; a completely shielded hit still permits Stun', () => {
  const f = setup([actor('a', 'player'), actor('x', 'enemy'), actor('y', 'enemy')]); const x = f.state.actors[1]!, y = f.state.actors[2]!;
  x.stats.evasion_bonus = -1; y.stats.evasion_bonus = 1;
  f.apply([{ id: 'shield', type: 'shield', target: 'foe', formula: { id: 'flat_power', params: { amount: 100 } }, duration_ms: 5000, dispelable: true }], f.a, x);
  const context = f.pipeline.context(f.a, 'bash', 'skill', 'aoe'); context.selected = { foes: [x, y] };
  f.pipeline.program([{ ...hit(40, 'foes'), hit_rule: 'physical_roll' }, { ...status('stun', 1000, {}, 'foes'), when: { type: 'hit_landed', effect_id: 'hit', scope: 'same_target', hit_index: 'any' } }], context);
  assert.equal(x.statuses[0]?.status_id, 'stun'); assert.equal(y.statuses.length, 0); assert.equal(f.state.metrics.actors.a!.hp_damage, 0); assert.equal(f.state.metrics.actors.a!.absorbed, 40);
  assert.deepEqual(context.outcomes.map(value => [value.target_id, value.landed]), [['x', true], ['y', false]]);
});
test('heal chooses lowest HP percent and still casts at full HP with all-overheal metrics', () => {
  const heal = skill('heal', 0, 0, 10); heal.selectors = { ally: { team: 'allies', life: 'living', select: 'lowest_hp_percent', count: null, phase: 'cast_resolve', missing: 'skip' } }; heal.effects = [{ id: 'heal', type: 'heal', target: 'ally', formula: { id: 'flat_power', params: { amount: 100 } } }];
  const initial = checkpoint(battle([actor('a', 'player', [heal]), actor('c', 'player'), actor('z', 'enemy')])); initial.actors[1]!.hp -= 60;
  const first = step(initial, 1500); assert.equal(first.events.find(value => value.type === 'heal')?.target_id, 'c'); assert.equal(first.state.metrics.actors.a!.effective_heal, 60); assert.equal(first.state.metrics.actors.a!.overheal, 40);
  const second = step(first.state, 3000); assert.equal(second.state.metrics.actors.a!.casts_started, 2); assert.equal(second.state.metrics.actors.a!.effective_heal, 60); assert.equal(second.state.metrics.actors.a!.overheal, 140); assert.equal(second.state.metrics.actors.a!.sp_spent, 20);
});
test('front ordering and latest living Provoke source; all/random selectors ignore it', () => {
  const c = actor('c', 'enemy'); c.position = 'back_1'; const f = setup([actor('a', 'player'), actor('b', 'enemy'), c]); const source = f.state.actors[2]!;
  f.apply([status('provoke')], source, f.a);
  const context = f.pipeline.context(f.a, 'select', 'skill', 'select'); const selector = { team: 'enemies', life: 'living', select: 'front_first', count: null, phase: 'cast_resolve', missing: 'skip' } as const;
  assert.equal(f.pipeline.bindings(context, { foe: selector }).foe![0]!.actor_id, 'c');
  assert.deepEqual(f.pipeline.bindings(context, { foe: { ...selector, select: 'all' } }).foe!.map(value => value.actor_id), ['b', 'c']);
  source.hp = 0; assert.equal(f.pipeline.bindings(context, { foe: selector }).foe![0]!.actor_id, 'b');
});
test('locked dead target skips or reselects once; no automatic replacement mid-program', () => {
  const f = setup([actor('a', 'player'), actor('b', 'enemy'), actor('c', 'enemy')]); f.b.hp = 0;
  const context = f.pipeline.context(f.a, 'target', 'skill', 'target'); const selector = { team: 'enemies', life: 'living', select: 'front_first', count: null, phase: 'cast_start', missing: 'skip' } as const;
  assert.deepEqual(f.pipeline.bindings(context, { foe: selector }, { foe: ['b'] }).foe, []);
  assert.equal(f.pipeline.bindings(context, { foe: { ...selector, missing: 'reselect_once' } }, { foe: ['b'] }).foe![0]!.actor_id, 'c');
});
test('Stun before start leaves slot unspent and starts at recovery without restarting SI', () => {
  const bash = skill('bash', 0, 0, 0); bash.effects = [status('stun', 2500)]; const a = actor('a', 'player', [bash]); a.stat_blueprint.derived_offsets.attack_speed = 200;
  const first = step(battle([a, actor('b', 'enemy', [skill('boss', 1000)])]), 500); assert.equal(first.state.metrics.actors.b!.casts_started, 0);
  // Stop further Bashes in the fixture so the existing CC's expiry is isolated.
  const saved = checkpoint(first.state); saved.actors[0]!.active_slots = [null, null, null, null]; saved.actors[0]!.action_phase = 'normal_only'; saved.actors[0]!.phase_ready_at = null;
  const blocked = step(saved, 2000); assert.equal(blocked.state.metrics.actors.b!.casts_started, 0);
  const result = step(blocked.state, 3000); assert.equal(result.events.find(value => value.type === 'cast_start' && value.actor_id === 'b')?.at_ms, 3000);
});
test('interrupting CT consumes SP/slot exactly once and removes the old resolve token', () => {
  const bash = skill('bash', 0, 500, 0); bash.effects = [status('stun', 1000)];
  const boss = actor('b', 'enemy', [skill('boss', 2000, 500, 15), skill('next', 0, 500, 0)]); boss.stat_blueprint.derived_offsets.attack_speed = 200;
  const at1500 = step(battle([actor('a', 'player', [bash]), boss]), 1500);
  assert.equal(at1500.state.metrics.actors.b!.sp_spent, 15); assert.equal(at1500.state.metrics.actors.b!.casts_interrupted, 1); assert.equal(at1500.state.actors[1]!.rotation_cursor, 1);
  assert.equal(at1500.state.actors[1]!.sp, 52); assert.equal(at1500.state.pending_events.some(value => value.kind === 'cast_complete' && value.actor_id === 'b'), false);
  assert.equal(step(at1500.state, 2500).events.some(value => value.type === 'cast_resolve' && value.skill_id === 'boss'), false);
});
test('same-time locked cast resolves even if another completion applies Stun', () => {
  const bash = skill('bash', 1000, 500, 0); bash.effects = [status('stun')];
  const result = step(battle([actor('a', 'player', [bash]), actor('b', 'enemy', [skill('boss', 1000)])]), 2500);
  assert.equal(result.events.filter(value => value.type === 'cast_resolve').length, 2); assert.equal(result.state.metrics.actors.b!.casts_interrupted, 0);
});
test('uninterruptible CT resolves under CC while Silence permits Normal Attack', () => {
  const bash = skill('bash', 0, 500, 0); bash.effects = [status('stun')]; const bossSkill = skill('boss', 2000); bossSkill.timing.interruptible = false;
  const boss = actor('b', 'enemy', [bossSkill]); boss.stat_blueprint.derived_offsets.attack_speed = 200;
  assert.ok(step(battle([actor('a', 'player', [bash]), boss]), 2500).events.some(value => value.type === 'cast_resolve' && value.skill_id === 'boss'));
  const silence = skill('silence', 0, 0, 0); silence.effects = [status('silence')]; const caster = actor('a', 'player', [silence]); caster.stat_blueprint.derived_offsets.attack_speed = 200;
  const result = step(battle([caster, actor('b', 'enemy', [skill()], true)]), 1500); assert.ok(result.events.some(value => value.type === 'normal_attack' && value.actor_id === 'b')); assert.equal(result.state.metrics.actors.b!.casts_started, 0);
});
test('ordinary chain CC has normal independent durations and union vs instance metrics', () => {
  const f = setup(); for (const time of [0, 900, 1800]) { f.state.game_time_ms = time; f.pipeline.expire(); f.apply([status('stun', 1000)]); }
  assert.deepEqual(f.b.statuses.map(value => value.expires_at), [1900, 2800]); assert.equal(f.b.stats.control_resistance, 0);
  // A real engine run accrues overlapping instances twice but blocked actor time once.
  const at0 = setup(); at0.apply([status('stun', 1000), status('stun', 1000)]); const result = step(at0.state, 1000);
  assert.equal(result.state.metrics.actors.b!.cc_blocked_actor_ms, 1000); assert.equal(result.state.metrics.actors.a!.cc_instance_ms, 2000);
});
test('optional reactive boss trait adds independent Resistance after successful CC only', () => {
  const boss = actor('b', 'enemy'); trait(boss, 'adaptive', [trigger('adapt', 'control_applied', [status('cc_resistance_up', 6000, { ratio: .1 }, 'self')])]); const f = setup([actor('a', 'player'), boss]);
  for (const time of [0, 900, 1800]) { f.state.game_time_ms = time; f.pipeline.expire(); f.apply([status('stun', 1000)]); f.pipeline.drain(); }
  assert.equal(f.b.statuses.filter(value => value.status_id === 'cc_resistance_up').length, 3);
  assert.ok(Math.abs(f.b.stats.control_resistance - .3) < 1e-9);
  for (const [time, expected] of [[6000, .2], [6900, .1], [7800, 0]]) { f.state.game_time_ms = time!; f.pipeline.expire(); assert.ok(Math.abs(f.b.stats.control_resistance - expected!) < 1e-9); }
});
test('periodic expiry is exclusive; shield absorbs60 then HP loses20 across two ticks', () => {
  const f = setup(); f.b.hp = 100; f.a.stats.magical_attack = 40;
  f.apply([{ id: 'shield', type: 'shield', target: 'foe', formula: { id: 'flat_power', params: { amount: 60 } }, duration_ms: 5000, dispelable: true }, status('poison', 3000, { power_ratio: 1 })]);
  const result = step(f.state, 3000); assert.deepEqual(result.events.filter(value => value.type === 'damage').map(value => value.at_ms), [1000, 2000]); assert.equal(result.state.actors[1]!.hp, 80); assert.equal(result.state.metrics.actors.a!.absorbed, 60); assert.equal(result.state.metrics.actors.a!.shield_absorbed, 60);
});
test('Freeze survives fully absorbed damage and breaks only on positive HP loss', () => {
  const f = setup(); f.apply([status('freeze'), { id: 'shield', type: 'shield', target: 'foe', duration_ms: 5000, dispelable: true, formula: { id: 'flat_power', params: { amount: 40 } } }]);
  f.apply([hit(40)]); assert.equal(f.b.statuses.length, 1); f.apply([hit(1)]); assert.equal(f.b.statuses.length, 0);
});
test('cleanse/dispel removes permitted individual instances in expiry then ID order', () => {
  const f = setup(); f.apply([status('poison', 5000, { power_ratio: .1 }), status('stun', 3000), status('cc_resistance_up', 1000, { ratio: .1 })]);
  f.apply([{ id: 'cleanse', type: 'remove_status', target: 'foe', polarity: 'any', tags: [], permission: 'cleanse', max_instances: 1 }]);
  assert.deepEqual(f.b.statuses.map(value => value.status_id), ['poison', 'cc_resistance_up']);
  f.apply([{ id: 'dispel', type: 'remove_status', target: 'foe', polarity: 'buff', tags: [], permission: 'dispel', max_instances: null }]); assert.equal(f.b.statuses.some(value => value.status_id === 'cc_resistance_up'), true);
});
test('own-status detonation consumes only the acting source and uses the common damage pipeline', () => {
  const f = setup(); f.apply([status('poison', 5000, { power_ratio: .1 }), status('poison', 3000, { power_ratio: .1 })]); f.apply([status('poison', 1000, { power_ratio: .1 })], f.b, f.b);
  f.apply([{ id: 'explode', type: 'handler', target: 'foe', handler_id: 'detonate_own_status', params: { status_id: 'poison', max_consumed: null, power_per_instance: 50, damage_type: 'physical', element: 'neutral' } }]);
  assert.equal(f.state.metrics.actors.a!.hp_damage, 100); assert.equal(f.b.statuses.length, 1); assert.equal(f.b.statuses[0]!.source.origin_actor_id, 'b');
});
test('learned Passive applies automatically with all four Active slots empty', () => {
  const input = actor('a', 'player'); const passive: SkillDefinition = { id: 'learned', kind: 'passive', name_key: 'learned', class_id: 'swordsman', max_level: 1, unlock_level: 1, tags: [], level_parameters: {}, modifiers: [{ id: 'attack', stat: 'physical_attack', bucket: 'derived', op: 'add_percent', value: .5 }], triggers: [] };
  input.resolved_skills.learned = { level: 1, definition: passive }; const state = battle([input, actor('b', 'enemy')]); assert.equal(state.actors[0]!.stats.physical_attack, 49.5); assert.deepEqual(state.actors[0]!.active_slots, [null, null, null, null]);
});
test('proc ancestry blocks A→B→A reentry while sibling hits and separate instances still proc', () => {
  const a = actor('a', 'player'), b = actor('b', 'enemy'); for (const input of [a, b]) trait(input, `${input.actor_id}_counter`, [trigger('counter', 'damage_received', [hit(1, 'event_source')])]);
  const f = setup([a, b]); f.apply([{ ...hit(10), hits: 2 }]); f.pipeline.drain();
  assert.equal(f.events.filter(value => value.type === 'proc_rejected').length, 2); assert.equal(f.events.filter(value => value.type === 'proc').length, 4); assert.equal(f.state.metrics.actors.b!.hp_damage, 2);
});
test('proc per-battle counter survives serialized restore and never resets on a later advance', () => {
  const a = actor('a', 'player', [], true); trait(a, 'card', [trigger('once', 'normal_attack_hit', [status('attack_up', 10000, { ratio: .1 }, 'self')], { limit_scope: 'per_battle', limit_count: 1 })]);
  const first = step(battle([a, actor('b', 'enemy')]), 1500); const restored = unwrap(restoreBattle(serializeBattle(first.state), content));
  const resumed = step(restored, 5000), uninterrupted = step(first.state, 5000); assert.deepEqual(resumed, uninterrupted);
  assert.equal(resumed.state.actors[0]!.statuses.length, 1); assert.deepEqual(Object.values(resumed.state.trigger_activations), [1]);
});
test('battle_start entry trigger fires once even when the initial checkpoint is restored', () => {
  const input = actor('a', 'player'); trait(input, 'opening', [trigger('open', 'battle_start', [status('attack_up', 10000, { ratio: .3 }, 'self')])]);
  const initial = unwrap(restoreBattle(serializeBattle(battle([input, actor('b', 'enemy')])), content)); const first = step(initial, 0); assert.equal(first.state.actors[0]!.statuses.length, 1); assert.equal(step(first.state, 1000).state.actors[0]!.statuses.length, 1);
});
test('weapon endow selection is latest active enum and reveals the previous value after expiry', () => {
  const f = setup(); f.apply([status('fire_endow', 1000)], f.a, f.a); assert.equal(weaponElement(f.a, content), 'fire'); f.state.game_time_ms = 1000; f.pipeline.expire(); assert.equal(weaponElement(f.a, content), 'neutral');
});
test('a status whose source died persists or removes exactly as its catalog requires', () => {
  const f = setup(); f.apply([status('attack_up', 3000, { ratio: .3 }), status('devotion', 3000, { ratio: .3 })]); f.a.hp = 0; f.pipeline.cleanupSources(); assert.deepEqual(f.b.statuses.map(value => value.status_id), ['attack_up']);
});
test('resource gains clamp SP/spheres and expose restored vs wasted without touching wallets', () => {
  const f = setup(); f.b.sp = 10; f.apply([{ id: 'sp', type: 'resource_change', target: 'foe', resource: 'sp', amount: 100 }, { id: 'spheres', type: 'resource_change', target: 'foe', resource: 'spirit_spheres', amount: 8 }]); assert.equal(f.b.sp, 64); assert.equal(f.b.spirit_spheres, 5); assert.equal(f.state.metrics.actors.a!.sp_restored, 54); assert.equal(f.state.metrics.actors.a!.sp_wasted, 46); assert.equal(f.state.metrics.actors.a!.sphere_wasted, 3);
});
test('all27 catalog statuses bind params, expire individually, and leave base stats unchanged', () => {
  for (const definition of Object.values(content.statuses)) {
    const shape = definition.parameter_schema as unknown as { properties: Record<string, { minimum?: number; maximum?: number }> };
    const params = Object.fromEntries(Object.entries(shape.properties).map(([key, rule]) => [key, Math.max(rule.minimum ?? -Infinity, Math.min(rule.maximum ?? Infinity, .1))]));
    const f = setup(), before = structuredClone(f.b.stats); f.apply([status(String(definition.id), 1000, params)]); assert.equal(f.b.statuses[0]?.status_id, definition.id);
    f.state.game_time_ms = 1000; f.pipeline.expire(); assert.equal(f.b.statuses.length, 0); assert.deepEqual(f.b.stats, before);
  }
});
test('positive duration CC is not shortened when a boss gains Resistance after it applies', () => {
  const boss = actor('b', 'enemy'); trait(boss, 'adaptive', [trigger('adapt', 'control_applied', [status('cc_resistance_up', 6000, { ratio: 2 }, 'self')])]); const f = setup([actor('a', 'player'), boss]);
  f.apply([status('stun', 3000)]); f.pipeline.drain(); assert.equal(f.b.statuses.find(value => value.status_id === 'stun')!.expires_at, 3000);
  f.apply([status('stun', 3000)]); assert.equal(f.b.statuses.filter(value => value.status_id === 'stun').length, 1); assert.equal(f.state.metrics.actors.a!.cc_resisted, 1);
});
test('simultaneous completion CC uses pre-reaction Resistance for the entire batch', () => {
  const bash = skill('bash', 1000, 500, 0); bash.effects = [status('stun', 1000)]; const boss = actor('z', 'enemy'); trait(boss, 'adaptive', [trigger('adapt', 'control_applied', [status('cc_resistance_up', 6000, { ratio: 1 }, 'self')])]);
  const result = step(battle([actor('a', 'player', [bash]), actor('b', 'player', [bash]), boss]), 2500);
  assert.equal(result.state.actors[2]!.statuses.filter(value => value.status_id === 'stun').length, 2); assert.equal(result.state.actors[2]!.stats.control_resistance, 2);
});
test('item/card/passive sources share the same proc path, with separate-instance and root limits', () => {
  const input = actor('a', 'player'); for (const id of ['card1', 'card2', 'passive']) trait(input, id, [trigger('gain', 'damage_dealt', [status('attack_up', 3000, { ratio: .1 }, 'self')], { limit_scope: 'per_root_action', limit_count: 1 })]);
  const f = setup([input, actor('b', 'enemy')]); f.apply([{ ...hit(), hits: 2 }]); f.pipeline.drain(); assert.equal(f.a.statuses.length, 3); assert.equal(f.events.filter(value => value.type === 'proc').length, 3);
});
test('default card reflect accepts normal/skill and does not react to another reflect', () => {
  const a = actor('a', 'player'), b = actor('b', 'enemy'); const reflected = { ...hit(10, 'event_source'), as_reflect: true };
  for (const input of [a, b]) trait(input, `${input.actor_id}_card`, [trigger('reflect', 'damage_received', [reflected], { accepted_origins: ['normal', 'skill'] })]);
  const f = setup([a, b]); f.apply([hit(100)]); f.pipeline.drain(); assert.equal(f.events.filter(value => value.type === 'proc').length, 1); assert.equal(f.events.filter(value => value.type === 'damage').length, 2);
});
test('Devotion conserves101 damage with proportional independent links and one routing pass', () => {
  const f = setup([actor('a', 'player'), actor('b', 'enemy'), actor('c', 'enemy'), actor('d', 'enemy')]); const c = f.state.actors[2]!, d = f.state.actors[3]!;
  f.apply([status('devotion', 3000, { ratio: .8 })], c, f.b); f.apply([status('devotion', 3000, { ratio: .8 })], d, f.b);
  // Recipient has its own link, which must not route a second time.
  f.apply([status('devotion', 3000, { ratio: 1 })], d, c);
  f.apply([hit(101)]); const damage = f.events.filter(value => value.type === 'damage'); assert.deepEqual(damage.map(value => [value.target_id, value.amount]), [['c', 51], ['d', 50], ['b', 0]]);
  assert.equal(f.state.metrics.actors.a!.hp_damage, 101); assert.equal(f.state.metrics.actors.a!.raw_damage, 101); assert.equal(damage.filter(value => value.origin === 'transfer').length, 2);
});
test('DoT retains original source attribution after caster dies and removes when carrier dies', () => {
  const f = setup([actor('a', 'player'), actor('b', 'enemy'), actor('c', 'player')]); f.a.stats.magical_attack = 40; f.apply([status('poison', 3000, { power_ratio: 1 })]); f.a.hp = 0;
  const first = step(f.state, 1000); assert.equal(first.events.find(value => value.type === 'damage')?.actor_id, 'a'); assert.equal(first.state.metrics.actors.a!.hp_damage, 40); assert.equal(first.state.actors[1]!.statuses.length, 1);
  const edited = checkpoint(first.state); edited.actors[1]!.hp = 0; const end = step(edited, 2000); assert.equal(end.state.actors[1]!.statuses.length, 0);
});
test('every emitted engine event is canonical JSON with source/effect/hit attribution', () => {
  const result = step(battle(), 2500); assert.doesNotThrow(() => canonical(result.events)); const damage = result.events.find(value => value.type === 'damage')!;
  assert.equal(damage.effect_id, 'hit'); assert.equal(damage.hit_index, 0); assert.ok(damage.action_id); assert.ok(damage.source_instance_id);
});
test('overflow diagnostics return no partially spent state or truncated buff stacks', () => {
  const overflow = skill('overflow', 0, 0, 10); overflow.effects = [status('attack_up', 3000, { ratio: Number.MAX_SAFE_INTEGER }, 'self')];
  const initial = battle([actor('a', 'player', [overflow]), actor('b', 'enemy')]); const before = canonical(initial); const result = advanceUntil(initial, 1500, content);
  assert.equal(result.ok, false); if (!result.ok) assert.match(result.errors[0]!.code, /UNSAFE_COMBAT_NUMBER/); assert.equal(canonical(initial), before);
});
test('conditional passive modifiers follow active statuses without changing the scheduled SI', () => {
  const input = actor('a', 'player', [skill()]); trait(input, 'conditional', []);
  input.stat_blueprint.permanent_sources[0]!.modifiers.push({ id: 'quick', stat: 'attack_speed', bucket: 'derived', op: 'add_percent', value: 1, when: { type: 'has_status', actor: 'self', status_id: 'attack_up' } });
  const f = setup([input, actor('b', 'enemy')]); assert.equal(f.a.stats.attack_speed, 100); f.apply([status('attack_up', 1000, { ratio: .3 }, 'self')], f.a, f.a); assert.equal(f.a.stats.attack_speed, 200); assert.equal(f.a.phase_ready_at, 1500);
  f.state.game_time_ms = 1000; f.pipeline.expire(); assert.equal(f.a.stats.attack_speed, 100); assert.equal(f.a.phase_ready_at, 1500);
});
test('raising MaxHP does not heal; removal clamps down without granting resources', () => {
  const input = actor('a', 'player'); trait(input, 'health', []); input.stat_blueprint.permanent_sources[0]!.modifiers.push({ id: 'health', stat: 'max_hp', bucket: 'derived', op: 'add_percent', value: 1, when: { type: 'has_status', actor: 'self', status_id: 'attack_up' } });
  const f = setup([input, actor('b', 'enemy')]); const before = f.a.hp; f.apply([status('attack_up', 1000, { ratio: .3 }, 'self')], f.a, f.a); assert.equal(f.a.stats.max_hp, 2 * before); assert.equal(f.a.hp, before); f.a.hp = before + 10;
  f.state.game_time_ms = 1000; f.pipeline.expire(); assert.equal(f.a.hp, before);
});
test('event budget also bounds timer-only battles and preserves input on failure', () => {
  const initial = battle([actor('a', 'player'), actor('b', 'enemy')]); const before = canonical(initial); const result = advanceUntil(initial, 90000, content, {}, { max_events: 5 });
  assert.equal(result.ok, false); assert.equal(canonical(initial), before);
});
test('Silence chance uses control resistance but never emits hard-CC reactions', () => {
  const f = setup(); f.b.stats.control_resistance = 1; f.apply([status('silence')]); assert.equal(f.b.statuses.length, 0); assert.equal(f.state.metrics.actors.a!.cc_applied, 0);
});
test('lethal damage reactions drain before death cleanup and can cause a mutual wipe', () => {
  const blast = skill('blast', 0, 0, 0); blast.effects = [hit(1000)]; const a = actor('a', 'player', [blast]), b = actor('b', 'enemy');
  trait(b, 'card', [trigger('reflect', 'damage_received', [{ ...hit(1000, 'event_source'), as_reflect: true }], { accepted_origins: ['skill'] })]);
  const initial = checkpoint(battle([a, b])); for (const actor of initial.actors) actor.hp = 100;
  const result = step(initial, 1500); assert.equal(result.state.terminal_result?.kind, 'defeat'); assert.equal(result.events.filter(value => value.type === 'death').length, 2); assert.ok(result.events.some(value => value.type === 'proc'));
});
test('Revive advances life epoch, restores ratios, starts next SI and never replays an old cast', () => {
  const revive = skill('revive', 1000, 0, 0); revive.selectors = { dead: { team: 'allies', life: 'dead', select: 'front_first', count: null, phase: 'cast_resolve', missing: 'skip' } }; revive.effects = [{ id: 'revive', type: 'revive', target: 'dead', hp_ratio: .3, sp_ratio: .5 }];
  const first = step(battle([actor('a', 'player', [revive]), actor('c', 'player', [skill('blast', 3000)]), actor('z', 'enemy')]), 1600);
  const killed = checkpoint(first.state); killed.actors[1]!.hp = 0;
  const raised = step(killed, 2500); const c = raised.state.actors[1]!; assert.equal(c.life_epoch, 1); assert.equal(c.hp, Math.floor(c.stats.max_hp * .3)); assert.equal(c.sp, 32); assert.equal(c.action_phase, 'skill_interval'); assert.equal(c.phase_ready_at, 4000);
  const later = step(raised.state, 4500); assert.equal(later.events.some(value => value.type === 'cast_resolve' && value.skill_id === 'blast'), false); assert.equal(later.state.actors[1]!.cast?.started_at, 4000);
});
