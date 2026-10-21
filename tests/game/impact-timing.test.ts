import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { attackContactMs, alignProjectiles, visualImpactMs } from '../../src/renderer/impact-timing.ts';
import { ActorAnimation, presetSwing } from '../../src/renderer/actor-animation.ts';
import type { BattlePresentationEvent } from '../../src/contracts/presentation.ts';
import type { ActorParts } from '../../src/renderer/native.mjs';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
const index = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetIndex;
function parts(job: string, gender = 'male'): ActorParts {
  const preset = index.actor_jobs.find(row => row.job_id === job)!.presets.find(p => p.gender === gender)!;
  return { body: { meta: JSON.parse(readFileSync('assets/ro/' + preset.body.meta, 'utf8')), image: null! }, ...presetSwing(preset) };
}
test('ACT attack event sets contact/release: sword500ms, bow700ms (release pose, not the draw sound), rod500ms, rod500ms', () => {
  for (const [job, expected] of [['swordsman', 500], ['archer', 700], ['mage', 500], ['acolyte', 500]] as const) assert.equal(attackContactMs(parts(job)), expected);
  // User reports (20 Oct 2026, twice): arrows left while the bow was still drawn. Every bow body holds the full draw on
  // frames 4–6 and the string snaps straight on frame 7 (rendered weapon-only contact sheet).
  for (const job of ['archer', 'hunter']) for (const gender of ['male', 'female']) assert.equal(attackContactMs(parts(job, gender)), 700, `${job} ${gender}`);
  const bare = parts('archer'); delete bare.releaseFrame; assert.equal(attackContactMs(bare), 100, 'without the preset release frame the ACT draw sound (frame 1) would be used');
  const unmarked = parts('swordsman'); for (const a of unmarked.body.meta.animation!.actions) for (const f of a.frames) delete f.event;
  assert.equal(attackContactMs(unmarked), 400); assert.equal(attackContactMs(undefined), 0);
});
test('projectiles wait for the native release pose, retain travel/stagger, and never mutate pack definitions', () => {
  const input = index.combat_visuals.normal_attacks.mage!.special_sfx, original = structuredClone(input), aligned = alignProjectiles(input, 500);
  assert.equal(aligned[0]!.release_ms, 500); assert.equal(visualImpactMs(aligned, 500), 860); assert.deepEqual(input, original);
  const multi = alignProjectiles(index.combat_visuals.skills.mage_fire_bolt!.special_sfx, 500);
  assert.equal(visualImpactMs(multi, 500, 0), 800); assert.equal(visualImpactMs(multi, 500, 2), 1060);
  assert.equal(visualImpactMs([], 500), 500);
  const strike = index.combat_visuals.impacts.visual_mage_lightning_bolt!;
  assert.equal(visualImpactMs([], 500, 0, strike), 800, 'sky strike lands lead_ms after the swing contact'); assert.equal(visualImpactMs([], 500, 2, strike), 1240, 'and staggers per hit');
});
test('fast attack speed plays the swing faster so the release still lands inside it; slow attacks keep the native clip', () => {
  const bow = parts('archer'), animation = new ActorAnimation(() => bow), shot = (at: number, sequence: number): BattlePresentationEvent => ({ type: 'normal_attack', actor_id: 'a', at_ms: at, phase: 0, sequence });
  assert.equal(animation.swing(shot(0, 1)).rate, 1, 'first swing has no interval yet');
  assert.equal(animation.swing(shot(1500, 2)).rate, 1, '1.5 s apart: the 900 ms clip fits');
  const quick = animation.swing(shot(2100, 3)); assert.ok(Math.abs(quick.rate - .6) < 1e-9, `600 ms apart → clip ×0.6, got ${quick.rate}`);
  assert.ok(attackContactMs(bow, quick.state) * quick.rate < 600, 'arrow leaves before the next swing begins');
  assert.equal(animation.swing(shot(2100, 3)), quick, 'memoised');
});
test('monk fists cycle 3 native poses; weapon jobs keep the one attack their overlay draws; skills keep the preset swing', () => {
  const monk = parts('monk'), sword = parts('swordsman'), event = (sequence: number, type: BattlePresentationEvent['type'] = 'normal_attack'): BattlePresentationEvent => ({ type, actor_id: 'p', at_ms: sequence * 1000, phase: 0, sequence, ...(type === 'cast_resolve' ? { skill_id: 'monk_triple_attack' } : {}) });
  const fists = new ActorAnimation(() => monk), blade = new ActorAnimation(() => sword);
  assert.deepEqual([1, 2, 3, 4].map(n => fists.attackState(event(n))), ['attack', 'attack2', 'attack3', 'attack']);
  assert.equal(fists.attackState(event(2)), 'attack2', 'memoised per event so contact timing and pose agree');
  assert.equal(fists.attackState(event(9, 'cast_resolve')), 'attack');
  assert.deepEqual([1, 2].map(n => blade.attackState(event(n))), ['attack', 'attack']);
  const used = ['attack', 'attack2', 'attack3'].map(state => attackContactMs(monk, state));
  assert.ok(used.every(ms => ms > 0), JSON.stringify(used));
  for (const job of index.actor_jobs) for (const preset of job.presets) {
    const weapon = JSON.parse(readFileSync('assets/ro/' + preset.weapon!.meta, 'utf8')) as { animation: { actions: { source_action_index: number; frames: { layers: unknown[] }[] }[] } };
    const drawn = (action: number) => weapon.animation.actions.find(a => a.source_action_index === action)!.frames.some(frame => frame.layers.length);
    // A listed swing must show the worn weapon, unless the weapon never draws at all (monk knuckles).
    const anyDrawn = [46, 86, 94].some(drawn);
    for (const action of preset.attack_variant_indices ?? [preset.attack_source_action_index]) assert.ok(!anyDrawn || drawn(action), `${job.job_id} ${preset.gender} swing ${action} hides its weapon`);
  }
});
