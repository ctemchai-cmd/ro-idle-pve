// TASK-054 (user, 20 Oct 2026): real RO effects for bolts and other skills, sky-falling bolts, RO-style damage numbers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectilePoint, validateCombatVisuals } from '../../src/renderer/projectiles.ts';
import {nativeImpactProfile,nativeImpactDuration} from '../../src/renderer/native-impact.ts';
import { NUMBER_FLIGHT_MS, numberFlight } from '../../src/renderer/damage-numbers.ts';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
const index = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetIndex;
const presentations = Object.values(index.skills).map(skill => skill.presentation_id);

test('impacts are native STR effects shipped in the pack, keyed by presentation so copies share them', () => {
  validateCombatVisuals(index.combat_visuals, Object.keys(index.skills), presentations);
  const impacts = index.combat_visuals.impacts;
  for (const id of ['visual_mage_fire_bolt', 'visual_mage_cold_bolt', 'visual_mage_lightning_bolt', 'visual_acolyte_holy_light', 'visual_swordsman_bash', 'visual_archer_arrow_shower']) assert.ok(impacts[id], id);
  for (const [id, impact] of Object.entries(impacts)) {
    const meta = JSON.parse(readFileSync('assets/ro/' + impact.meta, 'utf8')) as { effect?: { max_key: number; fps: number }; missing_dependencies?: unknown[] };
    const native=nativeImpactProfile(impact);assert.ok((meta.effect||native.texture_layers?.length)&&!meta.missing_dependencies?.length, `${id}: complete native image program`);
    assert.ok(impact.start_ms<nativeImpactDuration(native,{meta,image:null} as never),`${id}: impact moment inside the effect`);
    for(const layer of native.texture_layers??[])assert.ok(index.files.some(file=>file.path===layer.meta),`${id}: actual texture dependency`);
    assert.ok(index.files.some(file => file.path === impact.meta), `${id}: sidecar in the runtime pack`);
  }
  assert.equal(index.skills.rogue_copy_mage_fire_bolt!.presentation_id, index.skills.mage_fire_bolt!.presentation_id);
  for (const mutate of [(v: typeof index.combat_visuals) => { (v.impacts as Record<string, unknown>).visual_unknown = v.impacts.visual_mage_fire_bolt; }, (v: typeof index.combat_visuals) => { (v.impacts.visual_mage_fire_bolt as { scale: number }).scale = 0; }, (v: typeof index.combat_visuals) => { (v.impacts.visual_mage_fire_bolt as { lead_ms: number }).lead_ms = 0.5; }]) {
    const value = structuredClone(index.combat_visuals); mutate(value); assert.throws(() => validateCombatVisuals(value, Object.keys(index.skills), presentations), /INVALID_COMBAT_VISUALS/);
  }
});

test('fire/cold bolts fall from the sky onto the target; Lightning Bolt and Arrow Shower use their native strike instead of fake projectiles', () => {
  const spear = index.combat_visuals.skills.mage_fire_bolt!.special_sfx[0]!, to = [900, 400];
  assert.equal(spear.path, 'sky'); assert.equal(spear.shape, 'spear');
  const launch = spear.release_ms + spear.stagger_ms, start = projectilePoint(spear, [100, 400], to, launch, 1)!, end = projectilePoint(spear, [100, 400], to, launch + spear.travel_ms, 1)!;
  assert.ok(start.y < to[1]! - 300 && Math.abs(start.x - to[0]!) < 120, 'starts high above the target, not at the caster');
  assert.ok(end.y > to[1]! && Math.abs(end.x - to[0]!) < 20, 'lands on the target');
  assert.equal(index.combat_visuals.skills.mage_cold_bolt!.special_sfx[0]!.path, 'sky');
  assert.deepEqual(index.combat_visuals.skills.mage_lightning_bolt!.special_sfx, []); assert.deepEqual(index.combat_visuals.skills.archer_arrow_shower!.special_sfx, []);
});

test('damage numbers arc up then fall to one side while shrinking, faster than the old 1.1 s rise', () => {
  assert.ok(NUMBER_FLIGHT_MS <= 900);
  const at = (ms: number, side = 1) => numberFlight(ms, side), peak = at(NUMBER_FLIGHT_MS * .45);
  assert.ok(peak.dy < -50, 'rises'); assert.ok(at(NUMBER_FLIGHT_MS).dy > peak.dy + 40, 'then falls back');
  assert.ok(at(0).size > at(NUMBER_FLIGHT_MS / 2).size && at(NUMBER_FLIGHT_MS / 2).size > at(NUMBER_FLIGHT_MS).size, 'shrinks');
  assert.ok(at(NUMBER_FLIGHT_MS, 1).dx > 30 && at(NUMBER_FLIGHT_MS, -1).dx < -30, 'drifts sideways');
  assert.equal(at(100).alpha, 1); assert.equal(at(NUMBER_FLIGHT_MS).alpha, 0);
});
