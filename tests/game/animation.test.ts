import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ActorAnimation } from '../../src/renderer/actor-animation.ts';
import { DemoSession } from '../../src/client/demo.ts';
import type { BattlePresentationEvent } from '../../src/contracts/presentation.ts';
import { actorFrame, type ActorParts } from '../../src/renderer/native.mjs';

const pack = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8'));
const preset = pack.actor_jobs[0].presets[0];
const meta = JSON.parse(readFileSync(`assets/ro/${preset.body.meta}`, 'utf8'));
const parts: ActorParts = { body: { meta, image: null! }, attackIndex: preset.attack_source_action_index };
const event = (type: BattlePresentationEvent['type'], at_ms: number, extras = {}): BattlePresentationEvent => ({ type, actor_id: 'main', at_ms, phase: 0, sequence: 0, ...extras });

test('native attack plays all nine frames instead of truncating at650ms; hits cannot restart the swing', () => {
  const animation = new ActorAnimation(() => parts), actor = new DemoSession().view().actors.find(row => row.actor_id === 'main')!;
  animation.accept(event('normal_attack', 1000));
  animation.accept(event('damage', 1100, { target_id: 'main', amount: 5 }));
  animation.accept(event('damage', 1400, { target_id: 'main', amount: 5 }));
  const sampled = animation.sample(actor, 1850);
  assert.deepEqual(sampled, { state: 'attack', elapsed: 850 });
  assert.equal(actorFrame(parts, sampled.state, sampled.elapsed).index, 8);
  assert.equal(animation.sample(actor, 1900).state, 'idle');
});
test('multi-hit flinch finishes once; casting uses the phase clock and resets stale poses', () => {
  const animation = new ActorAnimation(() => parts), actor = new DemoSession().view().actors.find(row => row.actor_id === 'main')!;
  animation.accept(event('damage', 100, { target_id: 'main', amount: 5 }));
  animation.accept(event('damage', 200, { target_id: 'main', amount: 5 }));
  assert.deepEqual(animation.sample(actor, 350), { state: 'hurt', elapsed: 250 });
  assert.equal(animation.sample(actor, 400).state, 'idle');
  animation.accept(event('normal_attack', 500)); animation.accept(event('cast_start', 600));
  const casting = { ...actor, phase: 'casting' as const, phase_started_at: 600 };
  assert.deepEqual(animation.sample(casting, 650), { state: 'standby', elapsed: 50 });
  animation.accept(event('cast_interrupt', 700));
  assert.equal(animation.sample(actor, 700).state, 'idle');
  assert.deepEqual(animation.sample(casting, 900, false), { state: 'standby', elapsed: 0 });
});
test('death is not replaced by subsequent damage and revive clears its visual', () => {
  const animation = new ActorAnimation(() => parts), actor = new DemoSession().view().actors.find(row => row.actor_id === 'main')!;
  animation.accept(event('death', 100)); animation.accept(event('damage', 200, { target_id: 'main', amount: 5 }));
  assert.deepEqual(animation.sample({ ...actor, hp: 0 }, 2000), { state: 'dead', elapsed: 1900 });
  animation.accept(event('revive', 2100)); assert.equal(animation.sample(actor, 2150).state, 'idle');
});
test('complete actor motion advances between native frames and returns to rest without head-only movement', () => {
  const animation = new ActorAnimation(() => parts), points = [];
  for (let elapsed = 0; elapsed <= 900; elapsed += 1000 / 60) points.push(animation.offset('attack', elapsed, 'main', true));
  assert.ok(new Set(points.map(point => point.x.toFixed(3))).size > 25);
  for (let i = 1; i < points.length; i++) assert.ok(Math.abs(points[i]!.x - points[i - 1]!.x) < .6);
  assert.ok(Math.abs(animation.offset('attack', 900, 'main', true).x) < 1e-8);
  assert.deepEqual(animation.offset('attack', 450, 'main', false), { x: 0, y: 0 });
  assert.deepEqual(animation.offset('dead', 450, 'main', true), { x: 0, y: 0 });
});
