import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoSession, DEMO_ENCOUNTERS } from '../../src/client/demo.ts';
import { advanceUntil } from '../../src/domain/combat/index.ts';
import { canonical } from '../../src/content/value.ts';

test('four demo scenes use actual class/enemy data and expose four distinct Active slots', () => {
  for (const encounter of DEMO_ENCOUNTERS) {
    const session = new DemoSession(encounter.id), party = session.view().actors.filter(actor => actor.team === 'player');
    assert.equal(party.length, 4); assert.equal(new Set(party.map(actor => actor.position)).size, 4);
    for (const actor of party) { assert.equal(actor.slots.length, 4); assert.equal(new Set(actor.slots).size, 4); }
    assert.ok(session.initial.actors.find(actor => actor.actor_id === 'main')!.stat_blueprint.permanent_sources.length > 0);
    session.advanceTo(90000); assert.ok(session.state.terminal_result); assert.ok(session.state.metrics.team.player.hp_damage > 0);
  }
});
test('manual45point demo builds have ASPD-specific first casts and preserve allocation across levels', async () => {
  const s = new DemoSession(), later = new DemoSession('storm'), timeline = await s.timeline();
  const expected = { main: 2728, npc_archer: 2449, npc_acolyte: 2963, npc_mage: 2858 };
  s.advanceTo(3000);
  for (const [id, at] of Object.entries(expected)) {
    const a = s.initial.actors.find(a => a.actor_id === id)!, b = later.initial.actors.find(a => a.actor_id === id)!;
    let spent = 0;
    for (const value of Object.values(a.stat_blueprint.allocated_primary)) for (let current = 1; current < value; current++) spent += 1 + Math.floor((current - 1) / 10);
    assert.equal(spent, 45); assert.equal(a.phase_ready_at, at);
    assert.equal(s.history.find(e => e.type === 'cast_start' && e.actor_id === id)!.at_ms, at);
    assert.equal(timeline.entries.find(e => e.actor_id === id)!.start_ms, at);
    assert.deepEqual(a.stat_blueprint.allocated_primary, b.stat_blueprint.allocated_primary); assert.equal(a.stats.attack_speed, b.stats.attack_speed);
  }
});
test('HUD reports the authoritative cursor, phase deadlines, SP and interruption flags', () => {
  const session = new DemoSession('boss', 2); session.advanceTo(3000); const view = session.view();
  for (const actor of view.actors) { const source = session.state.actors.find(value => value.actor_id === actor.actor_id)!; assert.equal(actor.sp, source.sp); assert.equal(actor.phase_ready_at, source.phase_ready_at); assert.equal(actor.next_slot, source.cast?.used_slot_index ?? source.rotation_cursor); assert.equal(actor.cast?.interruptible, source.cast?.interruptible); }
  assert.ok(view.actors.filter(actor => actor.cast).length >= 2);
});
test('warded demo changes only its own heavy snapshot, preserving base definitions and other runs', () => {
  const ordinary = new DemoSession('boss'), warded = new DemoSession('warded');
  const quake = (session: DemoSession) => Object.values(session.state.actors.find(actor => actor.actor_id === 'enemy_front')!.resolved_skills).find(s=>s.definition.tags.includes('heavy_cast'))!.definition;
  const a = quake(ordinary), b = quake(warded); assert.equal(a.kind, 'active'); assert.equal(b.kind, 'active');
  if (a.kind === 'active' && b.kind === 'active') { assert.equal(a.timing.interruptible, true); assert.equal(b.timing.interruptible, false); }
  assert.equal((warded.content.skills[a.id]!.timing as { interruptible: boolean }).interruptible, true);
});
test('reordering starts a fresh rotation without mutating another actor or base content', () => {
  const before = new DemoSession(), slots = [...before.view().actors.find(actor => actor.actor_id === 'main')!.slots]; [slots[0], slots[1]] = [slots[1]!, slots[0]!];
  const after = new DemoSession('boss', 2, { main: slots }); assert.equal(after.state.game_time_ms, 0); assert.deepEqual(after.view().actors.find(actor => actor.actor_id === 'main')!.slots, slots);
  assert.deepEqual(after.view().actors.find(actor => actor.actor_id === 'npc_mage')!.slots, before.view().actors.find(actor => actor.actor_id === 'npc_mage')!.slots);
  assert.throws(() => new DemoSession('boss', 2, { main: [slots[0]!, slots[0]!, slots[2]!, slots[3]!] }), /INVALID_DEMO_ROTATION/);
});
test('UI ticks and headless advance give identical full checkpoint, RNG, events and metrics', () => {
  const session = new DemoSession('storm', 2), original = canonical(session.initial);
  const expected = advanceUntil(session.initial, 90000, session.content); if (!expected.ok) throw new Error(JSON.stringify(expected.errors));
  for (let ms = 50; ms <= 90000 && !session.state.terminal_result; ms += 50) session.advanceTo(ms);
  assert.deepEqual(session.state, expected.value.state); assert.deepEqual(session.history, expected.value.events); assert.equal(canonical(session.initial), original);
});
