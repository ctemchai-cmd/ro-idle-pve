// Request-specific rule checks, not a team balance/calibration run.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { resolveStats } from '../../src/domain/math/index.ts';
import { battleStatusViews } from '../../src/client/combat-status.ts';
import { previewSkillDetails } from '../../src/client/skills.ts';
import { actor, battle, checkpoint, content, skill, step, type Active } from './combat-fixtures.ts';
import { checkGolden, goldens } from './class-skills.ts';
import before from './fixtures/sanctuary-before-127.json';

function healer(id = 'healer', rank = 10) {
  const definition = structuredClone(resolveSkill('priest_sanctuary', rank, content).definition) as Active;
  definition.timing.after_cast_ms = 60000; // One application; leave actual CT untouched.
  const input = actor(id, 'player', [definition]), stats = resolveStats(input.stat_blueprint, content);
  input.stat_blueprint.derived_offsets.magical_attack += 1000 - stats.magical_attack;
  return input;
}
function setup(healers = [healer()], enemy = actor('boss', 'enemy')) {
  const state = checkpoint(battle([...healers, actor('recipient', 'player'), enemy], 17));
  state.actors.find(a => a.actor_id === 'recipient')!.hp -= 100000;
  return state;
}
const ticks = (events: ReturnType<typeof step>['events']) => events.filter(e => e.type === 'heal' && e.skill_id === 'priest_sanctuary' && e.target_id === 'recipient');

test('all Sanctuary ranks are pure HoT with twice the song tick coefficient and independently authored goldens', () => {
  const authored = structuredClone(content.skills.priest_sanctuary) as unknown as typeof before;
  authored.level_parameters.power = before.level_parameters.power;
  authored.effects[0]!.status_id = 'regeneration';
  assert.deepEqual(authored, before, 'only power curve and dedicated status changed; cost/CT/ACD/targets/ranks unchanged');
  for (let rank = 1; rank <= 10; rank++) {
    const definition = resolveSkill('priest_sanctuary', rank, content).definition as Active;
    assert.equal(definition.start_effects.length, 0); assert.equal(definition.effects.length, 1);
    const effect = definition.effects[0]!; assert.equal(effect.type, 'apply_status');
    if (effect.type !== 'apply_status') throw Error('HOT_REQUIRED');
    assert.equal(effect.status_id, 'sanctuary_regeneration'); assert.equal(effect.duration_ms, 6000);
    for (const song of ['bard_healing_song', 'dancer_healing_song']) {
      const music = resolveSkill(song, rank, content).definition as Active;
      assert.equal(music.effects[0]!.type, 'heal');
      const hot = music.effects[1]!; if (hot.type !== 'apply_status') throw Error('SONG_HOT_REQUIRED');
      assert.ok(Math.abs(Number(effect.params.power_ratio) - Number(hot.params.power_ratio) * 2) < .000003, '2x within authored six-decimal rounding');
    }
    const details = previewSkillDetails('priest_sanctuary', rank);
    assert.equal(details.effects.length, 1); assert.match(details.effects[0]!, /MATK ทุก 1s · 6s · เริ่มทันที/);
  }
  const status = content.statuses.sanctuary_regeneration!;
  assert.equal((status.periodic as { tick_on_apply: boolean }).tick_on_apply, true);
  assert.equal((content.statuses.regeneration!.periodic as { tick_on_apply: boolean }).tick_on_apply, false);
  assert.equal((content.statuses.physical_regeneration!.periodic as { tick_on_apply: boolean }).tick_on_apply, false);
  for (const row of goldens(['priest_sanctuary'])) checkGolden(row);
});

test('six equal MATK ticks begin exactly at cast resolve, then each second, with no expiry or burst heal', () => {
  const initial = setup(), before = step(initial, 2399);
  assert.equal(ticks(before.events).length, 0);
  const result = step(initial, 8400), events = ticks(result.events);
  assert.deepEqual(events.map(e => e.at_ms), [2400, 3400, 4400, 5400, 6400, 7400]);
  assert.deepEqual(events.map(e => e.amount), Array(6).fill(1750));
  assert.ok(events.every(e => e.effect_id === 'heal_tick' && e.source_instance_id?.startsWith('cast_healer_')));
  assert.equal(result.events.filter(e => e.skill_id === 'priest_sanctuary' && e.effect_id === 'opening_heal').length, 0);
  assert.equal(events.reduce((n, e) => n + e.amount!, 0), 10500);
  assert.equal(battleStatusViews(step(initial, 2400).state).recipient!.healing_aura, true);
  assert.equal(battleStatusViews(result.state).recipient!.healing_aura, false);
});

test('incoming/outgoing heal bonuses and independent caster stacks apply equally to the immediate and later ticks', () => {
  const a = healer('a'), b = healer('b');
  a.stat_blueprint.permanent_sources.push({ source: { instance_id: 'healing_bonus', definition_id: 'test', owner_actor_id: 'a', origin_actor_id: 'a', origin_life_epoch: 0 }, triggers: [], modifiers: [{ id: 'bonus', stat: 'outgoing_healing_bonus', op: 'add_flat', bucket: 'bonus', value: .2 }] });
  // Apply through the blueprint before constructing the battle, not by changing derived stats.
  const input = actor('recipient', 'player');
  input.stat_blueprint.permanent_sources.push({ source: { instance_id: 'received_bonus', definition_id: 'test', owner_actor_id: 'recipient', origin_actor_id: 'recipient', origin_life_epoch: 0 }, triggers: [], modifiers: [{ id: 'bonus', stat: 'healing_received_bonus', op: 'add_flat', bucket: 'bonus', value: .1 }] });
  const state = checkpoint(battle([a, b, input, actor('boss', 'enemy')], 17));
  state.actors.find(a => a.actor_id === 'recipient')!.hp -= 100000;
  const result = step(state, 3400), events = ticks(result.events);
  assert.deepEqual(events.map(e => e.amount), [2310, 1925, 2310, 1925]);
  assert.equal(result.state.actors.find(a => a.actor_id === 'recipient')!.statuses.filter(s => s.status_id === 'sanctuary_regeneration').length, 2);
});

test('interrupting Sanctuary spends SP but creates no HoT or immediate heal', () => {
  const interrupt = skill('interrupt', 400, 60000, 0, 1);
  interrupt.effects = [{ id: 'stop', type: 'interrupt', target: 'foe' }];
  const initial = setup([healer()], actor('boss', 'enemy', [interrupt])), result = step(initial, 8400);
  assert.ok(result.events.some(e => e.type === 'cast_interrupt' && e.actor_id === 'healer'));
  assert.equal(ticks(result.events).length, 0);
  const atStart = step(initial, 1500).state.actors.find(a => a.actor_id === 'healer')!;
  const afterInterrupt = step(initial, 1900).state.actors.find(a => a.actor_id === 'healer')!;
  assert.equal(atStart.sp, initial.actors.find(a => a.actor_id === 'healer')!.sp - 40); // Before spending, regen meets a full SP bar.
  assert.equal(afterInterrupt.sp, atStart.sp);
  assert.equal(battleStatusViews(result.state).recipient!.healing_aura, false);
});

test('1x/2x/4x chunks and a serialized mid-HoT checkpoint produce identical events, RNG and state', () => {
  const initial = setup(), expected = step(initial, 9000);
  for (const speed of [1, 2, 4]) {
    let state = checkpoint(initial); const events: ReturnType<typeof step>['events'] = [];
    for (let to = 300 * speed; to < 9000; to += 300 * speed) {
      const part = step(state, to); state = JSON.parse(JSON.stringify(part.state)); events.push(...part.events);
    }
    const final = step(state, 9000); events.push(...final.events);
    assert.deepEqual(events, expected.events); assert.deepEqual(final.state, expected.state);
  }
});
