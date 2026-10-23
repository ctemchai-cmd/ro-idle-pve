// Focused HoT/cosmetic invariants, not a balance simulation.
import test from 'node:test';
import assert from 'node:assert/strict';
import type { Modifier } from '../../src/contracts/index.ts';
import type { ActorInput } from '../../src/domain/combat/index.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { resolveStats } from '../../src/domain/math/index.ts';
import { battleStatusViews } from '../../src/client/combat-status.ts';
import { characterSkillOptions } from '../../src/client/skills.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { healingAuraGeometry } from '../../src/renderer/healing-aura.ts';
import { actor, battle, checkpoint, content, skill, step, type Active } from './combat-fixtures.ts';
import { checkGolden, goldens } from './class-skills.ts';

const resolve = (id: string, level = 10) => structuredClone(resolveSkill(id, level, content).definition) as Active;
function mods(input: ActorInput, modifiers: Modifier[]) {
  input.stat_blueprint.permanent_sources.push({ source: { instance_id: input.actor_id + '_mods', definition_id: 'test', owner_actor_id: input.actor_id, origin_actor_id: input.actor_id, origin_life_epoch: 0 }, modifiers, triggers: [] });
}
function caster(id: string, song: string, patk = 1000, matk = 100) {
  const definition = resolve(song); definition.timing.after_cast_ms = 60000; // Isolate one application, not its next rotation.
  const input = actor(id, 'player', [definition]), base = resolveStats(input.stat_blueprint, content);
  input.stat_blueprint.derived_offsets.physical_attack += patk - base.physical_attack;
  input.stat_blueprint.derived_offsets.magical_attack += matk - base.magical_attack; return input;
}
function scenario(healers: ActorInput[], enemy = actor('boss', 'enemy'), receive = 0) {
  const target = actor('recipient', 'player'); target.stat_blueprint.derived_offsets.physical_defense = 1000000;
  if (receive) mods(target, [{ id: 'receive', stat: 'healing_received_bonus', op: 'add_flat', bucket: 'bonus', value: receive }]);
  const initial = checkpoint(battle([...healers, target, enemy])); initial.actors.find(a => a.actor_id === 'recipient')!.hp -= 100000; return initial;
}
const heals = (result: ReturnType<typeof step>, id: string) => result.events.filter(e => e.type === 'heal' && e.skill_id === id && e.effect_id === 'heal_tick' && e.target_id === 'recipient');

test('Bard/Dancer have identical physical Healing Song at all levels and six golden references still match', () => {
  for (let level = 1; level <= 10; level++) {
    const a = resolve('bard_healing_song', level), b = resolve('dancer_healing_song', level); assert.deepEqual(a.effects, b.effects);
    assert.deepEqual(a.timing, { cast_ms: 800, after_cast_ms: 1200, interruptible: true }); assert.deepEqual(a.cost, { sp: 38, spirit_spheres: 0 });
    const opening = a.effects[0]!; assert.equal(opening.type, 'heal'); if (opening.type !== 'heal') throw new Error('OPENING_REQUIRED'); assert.equal(opening.target, 'friends'); assert.equal(opening.formula.id, 'physical_power'); assert.equal(opening.formula.params.attack_ratio, Number((Number((.6 + .4 * (level - 1) / 9).toFixed(6)) * 1.75).toFixed(6)));
    const effect = a.effects[1]!; assert.equal(effect.type, 'apply_status'); if (effect.type !== 'apply_status') throw new Error('HOT_REQUIRED'); assert.equal(effect.status_id, 'physical_regeneration'); assert.equal(effect.duration_ms, 6000); assert.equal(effect.params.power_ratio, Number((Number((.3 + .2 * (level - 1) / 9).toFixed(6)) * 1.75).toFixed(6)));
  }
  for (const row of goldens(['bard_healing_song', 'dancer_healing_song'])) checkGolden(row);
});

test('Healing Song uses P.ATK independent of MATK/armor/crit/damage bonuses; Sanctuary remains MATK', () => {
  for (const id of ['bard_healing_song', 'dancer_healing_song']) for (const matk of [100, 10000]) {
    const input = caster('healer', id, 1000, matk); mods(input, [{ id: 'damage', stat: 'outgoing_physical_bonus', op: 'add_flat', bucket: 'bonus', value: 2 }, { id: 'crit', stat: 'crit_chance_bonus', op: 'add_flat', bucket: 'bonus', value: 1 }]);
    const result = step(scenario([input]), 8300), ticks = heals(result, id); assert.equal(ticks.length, 5); assert.ok(ticks.every(e => e.amount === 875));
    assert.deepEqual(ticks.map(e => e.at_ms), [3300, 4300, 5300, 6300, 7300]);
  }
  const result = step(scenario([caster('healer', 'priest_sanctuary', 10000, 100)]), 8400); assert.equal(heals(result, 'priest_sanctuary').length, 6); assert.ok(heals(result, 'priest_sanctuary').every(e => e.amount === 175));
});

test('existing outgoing/received-heal bonuses and two independent song sources still apply', () => {
  const a = caster('a', 'bard_healing_song'), b = caster('b', 'dancer_healing_song');
  const music = resolveSkill('bard_music_lesson', 10, content).definition; if (music.kind !== 'passive') throw new Error('PASSIVE_REQUIRED'); mods(a, structuredClone(music.modifiers) as Modifier[]);
  const result = step(scenario([a, b], actor('boss', 'enemy'), .2), 3300);
  assert.equal(heals(result, 'bard_healing_song')[0]!.amount, 1233); assert.equal(heals(result, 'dancer_healing_song')[0]!.amount, 1050);
  const target = result.state.actors.find(a => a.actor_id === 'recipient')!; assert.equal(target.statuses.filter(s => s.status_id === 'physical_regeneration').length, 2); assert.equal(battleStatusViews(result.state).recipient!.healing_aura, true);
});

test('song heals the whole party at resolve before five later ticks; interrupted casts do neither', () => {
  for (const id of ['bard_healing_song', 'dancer_healing_song']) {
    const initial = scenario([caster('healer', id)]), resolved = step(initial, 2300);
    const opening = resolved.events.filter(e => e.type === 'heal' && e.skill_id === id && e.effect_id === 'opening_heal');
    assert.deepEqual(opening.map(e => e.target_id).sort(), ['healer', 'recipient']);
    assert.ok(opening.every(e => e.at_ms === 2300));
    assert.equal(opening.find(e => e.target_id === 'recipient')!.amount, 1750);
    assert.equal(opening.find(e => e.target_id === 'healer')!.amount, 0);
    assert.equal(opening.find(e => e.target_id === 'healer')!.detail, 'overheal:1750');
    const ticks = heals(step(initial, 8300), id); assert.equal(ticks.length, 5);
    assert.equal(ticks.reduce((sum, e) => sum + e.amount!, 1750), 6125);
    const interrupt = skill('interrupt', 400, 60000, 0, 1);
    interrupt.effects = [{ id: 'stop', type: 'interrupt', target: 'foe' }];
    const afterInterrupt = step(scenario([caster('healer', id)], actor('boss', 'enemy', [interrupt])), 1900);
    const paidSp = afterInterrupt.state.actors.find(a => a.actor_id === 'healer')!.sp;
    const blocked = step(afterInterrupt.state, 8300);
    assert.ok(afterInterrupt.events.some(e => e.type === 'cast_interrupt' && e.actor_id === 'healer'));
    assert.equal(blocked.events.filter(e => e.type === 'heal' && e.skill_id === id).length, 0);
    assert.equal(battleStatusViews(blocked.state).recipient!.healing_aura, false);
    assert.ok(paidSp < initial.actors.find(a => a.actor_id === 'healer')!.sp);
  }
});

test('aura follows live status expiry/dispel and recipient death; caster death preserves the existing HoT policy', () => {
  const initial = scenario([caster('healer', 'bard_healing_song')]);
  assert.equal(battleStatusViews(step(initial, 2200).state).recipient!.healing_aura, false);
  const applied = step(initial, 2300).state; assert.equal(battleStatusViews(applied).recipient!.healing_aura, true); assert.ok(battleStatusViews(applied).recipient!.statuses![0]!.instances[0]!.description.includes('P.ATK'));
  assert.equal(battleStatusViews(step(initial, 8300).state).recipient!.healing_aura, false);
  const dispel = resolve('sage_dispel', 1); dispel.timing = { cast_ms: 2500, after_cast_ms: 60000, interruptible: true }; dispel.selectors.foe!.select = 'all';
  const cleansed = step(scenario([caster('healer', 'bard_healing_song')], actor('boss', 'enemy', [dispel])), 4500); assert.equal(battleStatusViews(cleansed.state).recipient!.healing_aura, false);
  const kill = skill('kill', 1500, 60000, 0, 1000000000);
  const deadCaster = scenario([caster('healer', 'bard_healing_song')], actor('boss', 'enemy', [kill]));
  const afterDeath = step(deadCaster, 3300); assert.equal(afterDeath.state.actors.find(a => a.actor_id === 'healer')!.hp, 0); assert.equal(battleStatusViews(afterDeath.state).healer!.healing_aura, false); assert.equal(battleStatusViews(afterDeath.state).recipient!.healing_aura, true); assert.equal(heals(step(deadCaster, 8300), 'bard_healing_song').length, 5);
  kill.selectors.foe!.select = 'lowest_hp_percent'; const deadRecipient = step(scenario([caster('healer', 'bard_healing_song')], actor('boss', 'enemy', [kill])), 3300);
  assert.equal(deadRecipient.state.actors.find(a => a.actor_id === 'recipient')!.hp, 0); assert.equal(battleStatusViews(deadRecipient.state).recipient!.healing_aura, false);
});

test('skill descriptions name P.ATK and aura geometry is deterministic/game-time-only', () => {
  const state = initializeAccount(content, { root_job_id: 'archer', gender: 'male' }, '2026-10-22T00:00:00.000Z', '2026-10-22', 1), bard = state.roster[0]!;
  bard.job_id = 'bard'; bard.level = 70; bard.skill_levels.bard_healing_song = 10;
  const option = characterSkillOptions(bard, state).skills.find(s => s.id === 'bard_healing_song')!; assert.ok(option.effects.some(text => text.includes('87.5% P.ATK') && text.includes('ทุก 1s')));
  assert.ok(option.effects.some(text => text.includes('175% P.ATK') && text.includes('ฟื้น HP')));
  assert.deepEqual(healingAuraGeometry(0), healingAuraGeometry(0)); assert.notDeepEqual(healingAuraGeometry(0), healingAuraGeometry(300));
  assert.ok(healingAuraGeometry(2000).particles.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.alpha >= 0 && p.alpha <= 1));
});
