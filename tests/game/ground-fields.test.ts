import{assertD179File}from'./legacy-magic-card-scope.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import visuals from '../../src/renderer/combat-visuals.json';
import { groundFieldProfiles, groundFields } from '../../src/renderer/ground-fields.ts';
import { battleRenderView } from '../../src/client/story.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { actor, battle, step, skill, content, type Active } from './combat-fixtures.ts';

const profiles = groundFieldProfiles(visuals);
const profileFor = (id: string) => profiles[String(content.skills[id]?.presentation_id)];
const ids = Object.keys(content.skills).filter(id => content.skills[id]!.class_id !== 'enemy' && profileFor(id));
function actual(id: string, awakened = false) {
  const definition = resolveSkill(id, 10, content, awakened).definition as Active;
  for (let seed = 1; seed <= 20; seed++) {
    const caster = actor('caster', 'player', [definition]), target = actor('boss', 'enemy');
    caster.stat_blueprint.derived_offsets.max_sp = 10000; target.stat_blueprint.derived_offsets.max_hp = 1000000;
    const initial = battle([caster, actor('friend', 'player'), target], seed);
    const events = step(initial, 7000).events, first = events.find(e => e.type === 'status_applied' && e.skill_id === id && profileFor(id)!.status_ids.includes(e.detail?.split(':')[0] ?? ''));
    if (!first) continue;
    const state = step(initial, first.at_ms + 50).state, view = battleRenderView(state, {});
    if (groundFields(view.actors, view.game_time_ms, profileFor).length) return { initial, state, view };
  }
  throw Error('No actual field status ' + id);
}
test('all ten real ground skills and their Awaken variants project one field from the actual application and lifetime', () => {
  assert.equal(ids.length, 10);
  for (const id of ids) for (const aw of [false, true]) {
    const { initial, view } = actual(id, aw), before = JSON.stringify(view), fields = groundFields(view.actors, view.game_time_ms, profileFor);
    assert.equal(fields.length, 1, id); assert.equal(fields[0]!.source, 'caster'); assert.equal(fields[0]!.skill, id);
    const actualInstances = view.actors.flatMap(a => a.statuses?.filter(g => g.icon_skill_id === id).flatMap(g => g.instances.filter(s => profileFor(id)!.status_ids.includes(s.status_id))) ?? []);
    assert.equal(fields[0]!.expires_at, Math.max(...actualInstances.map(s => s.expires_at)));
    assert.equal(fields[0]!.applied_at, Math.max(...actualInstances.map(s => s.applied_at!)));
    assert.deepEqual(groundFields(battleRenderView(initial, {}).actors, 0, profileFor), []);
    assert.deepEqual(groundFields(view.actors, fields[0]!.expires_at, profileFor), []);
    assert.equal(JSON.stringify(view), before);
  }
});
test('target copies and independent recasts merge visually, retain later expiry and identify a new application; sources remain separate', () => {
  const { view } = actual('priest_sanctuary'), actors = structuredClone([...view.actors]);
  const target = actors.find(a => a.statuses?.some(g => g.icon_skill_id === 'priest_sanctuary'))!, group = target.statuses!.find(g => g.icon_skill_id === 'priest_sanctuary')!, first = group.instances[0]!;
  target.statuses = [...target.statuses!, { ...group, id: 'recast', instances: [{ ...first, instance_id: 'recast', applied_at: view.game_time_ms, expires_at: first.expires_at + 2000 }] }];
  let fields = groundFields(actors, view.game_time_ms, profileFor); assert.equal(fields.length, 1); assert.equal(fields[0]!.applied_at, view.game_time_ms); assert.equal(fields[0]!.expires_at, first.expires_at + 2000);
  target.statuses = [...target.statuses!, { ...group, id: 'other', instances: [{ ...first, instance_id: 'other', source_actor_id: 'friend' }] }];
  fields = groundFields(actors, view.game_time_ms, profileFor); assert.deepEqual(fields.map(f => f.source).sort(), ['caster', 'friend']);
  assert.deepEqual(groundFields(actors.map(a => ({ ...a, hp: 0 })), view.game_time_ms, profileFor), []);
});
test('unrelated Awaken boons cannot extend a field, and future/removed statuses cannot invent one', () => {
  const { view } = actual('wizard_storm_gust'), actors = structuredClone([...view.actors]), target = actors.find(a => a.actor_id === 'boss')!, group = target.statuses![0]!;
  const end = groundFields(actors, view.game_time_ms, profileFor)[0]!.expires_at;
  target.statuses = [...target.statuses!, { ...group, id: 'long-boon', instances: group.instances.map(s => ({ ...s, status_id: 'attack_up', expires_at: end + 20000 })) }];
  assert.equal(groundFields(actors, view.game_time_ms, profileFor)[0]!.expires_at, end);
  assert.deepEqual(groundFields(actors, end, profileFor), []);
  assert.deepEqual(groundFields(actors.map(a => ({ ...a, statuses: a.statuses?.map(g => ({ ...g, instances: g.instances.map(s => ({ ...s, applied_at: view.game_time_ms + 500 })) })) })), view.game_time_ms, profileFor), []);
  assert.deepEqual(groundFields(actors.map(a => ({ ...a, statuses: [] })), view.game_time_ms, profileFor), []);
});
test('a real interrupted Storm Gust has neither a periodic status nor a ground field', () => {
  const gust = resolveSkill('wizard_storm_gust', 10, content).definition as Active, cancel = skill('ground_cancel', 50, 10000, 0);
  cancel.effects = [{ id: 'stop', type: 'interrupt', target: 'foe' }];
  const caster = actor('caster', 'player', [gust]); caster.stat_blueprint.derived_offsets.max_sp = 10000;
  const result = step(battle([caster, actor('boss', 'enemy', [cancel])]), 6000);
  assert(result.events.some(e => e.type === 'cast_interrupt' && e.actor_id === 'caster'));
  assert.deepEqual(groundFields(battleRenderView(result.state, {}).actors, 6000, profileFor), []);
});
test('borrowed enemy fields use their real presentation and retain the enemy as their source', () => {
  const borrowed = Object.keys(content.skills).filter(id => content.skills[id]!.class_id === 'enemy' && profileFor(id)); assert(borrowed.length);
  for (const id of borrowed) {
    const definition = content.skills[id] as unknown as Active;
    const caster = actor('caster', 'enemy', [definition]), target = actor('target', 'player'); caster.stat_blueprint.derived_offsets.max_sp = 10000; target.stat_blueprint.derived_offsets.max_hp = 1000000;
    const result = step(battle([caster, target]), 6500), fields = groundFields(battleRenderView(result.state, {}).actors, 6500, profileFor);
    assert(fields.some(f => f.source === 'caster' && f.skill === id), id);
  }
});
test('invalid ground references, unknown presentations, status filters and shape parameters fail before rendering', () => {
  for (const edit of [(p: any) => { p.meta = 'bad.png'; }, (p: any) => { p.status_ids = []; }, (p: any) => { p.scale = NaN; }, (p: any) => { p.anchor = 'random'; }, (p: any) => { p.native_only = false; }]) {
    const copy = structuredClone(visuals); edit(copy.ground_fields.visual_priest_sanctuary); assert.throws(() => groundFieldProfiles(copy), /INVALID_GROUND/);
  }
  assert.throws(() => groundFieldProfiles(visuals, []), /INVALID_GROUND/); assert.deepEqual(groundFieldProfiles({}), {});
  for (const p of Object.values(profiles)) for (const id of p.status_ids) assert(Object.hasOwn(content.statuses, id), id);
});
test('catalog covers every authored skill; all deployed sidecars parse exactly like source, unchanged media hashes and gameplay, within original size budgets', () => {
  const catalog = JSON.parse(readFileSync('plan/evidence/task-151/ground-catalog.json', 'utf8'));
  assert.deepEqual(catalog.skills.map((s: any) => s.skill_id).sort(), Object.keys(content.skills).sort());
  const before = JSON.parse(readFileSync('plan/evidence/task-151/gameplay-before.json', 'utf8'));
  for (const [file, sha] of Object.entries(before)) assertD179File(file,sha);
  const pack = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')); assert.equal(pack.sidecar_encoding, 'compact-json-safe-integers-v1');
  for (const row of pack.files) {
    const bytes = readFileSync('runtime/ro/payload/' + row.path), source = readFileSync('assets/ro/' + row.path);
    if (row.path.endsWith('.meta.json')) assert.deepEqual(JSON.parse(bytes.toString()), JSON.parse(source.toString()), row.path);
    else assert.equal(createHash('sha256').update(bytes).digest('hex'), createHash('sha256').update(source).digest('hex'), row.path);
  }
  assert(pack.sizes.initial_profile_raw_bytes < 1621492); assert(pack.sizes.media_and_sidecar_bytes + pack.sizes.manifest_bytes < 33554432);
});
