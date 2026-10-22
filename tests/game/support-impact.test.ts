// Fixed effect/stat fixtures only. No balance runner, journeys or seed batches.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { AccountState, Effect, Modifier, SkillDefinition } from '../../src/contracts/index.ts';
import { EffectPipeline } from '../../src/domain/combat/effects.ts';
import { recomputeStats } from '../../src/domain/combat/status.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { resolveStats } from '../../src/domain/math/index.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { equipmentStats } from '../../src/client/equipment.ts';
import { resolvedCardModifiers } from '../../src/domain/build/equipment.ts';
import { actor, battle, checkpoint, content, step } from './combat-fixtures.ts';

function fixture() {
  const state = checkpoint(battle([actor('caster', 'player'), actor('foe', 'enemy')]));
  const events: { type: string; amount?: number; skill_id?: string }[] = [];
  const pipeline = new EffectPipeline(state, content, { emit: e => events.push(e), metric: () => {}, interrupt: () => {}, revive: () => {} });
  const caster = state.actors[0]!, target = state.actors[1]!;
  caster.stats.magical_attack = 1000; caster.stats.physical_attack = 1000;
  const apply = (id: string, level = 10, recipient = caster) => {
    const definition = structuredClone(resolveSkill(id, level, content).definition) as SkillDefinition; if (definition.kind !== 'active') throw new Error('ACTIVE_REQUIRED');
    const context = pipeline.context(caster, id, 'skill', `action_${state.event_sequence++}`);
    context.selected = { self: [recipient], friend: [recipient], friends: [recipient], foe: [target], foes: [target] };
    pipeline.program(definition.effects, context);
  };
  return { state, caster, target, pipeline, events, apply };
}
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
test('all support curves scale from their original values once and damage curves do not compound', () => {
  const spec = JSON.parse(readFileSync('plan/generators/build-impact-spec.json', 'utf8'));
  assert.equal(Object.keys(spec.baseline_support_power).length, 59);
  for (const family of ['baseline_support_power', 'baseline_skill_power']) for (const [id, curves] of Object.entries(spec[family]) as [string, Record<string, number[]>][]) for (const [key, values] of Object.entries(curves)) {
    const definition = content.skills[id] as unknown as SkillDefinition, actual = definition.level_parameters[id === 'assassin_detonate' ? 'detonate_ratio' : key]!;
    values.forEach((base, i) => assert.ok(Math.abs(actual[i]! - base * 1.75 / (id === 'assassin_detonate' ? 100 : 1)) <= .00000051, `${id}.${key}.${i} must match within authored six-decimal precision`));
  }
});
test('single heal and shield use the shared role increase including flat shield power', () => {
  const f = fixture(); f.caster.hp -= 10000;
  f.apply('acolyte_heal'); assert.equal(f.events.find(e => e.type === 'heal')!.amount, 3850);
  f.apply('priest_kyrie'); assert.equal(f.caster.shields[0]!.remaining, 1627); // 157.5% MATK +52.5, floor once.
  assert.equal(f.caster.shields[0]!.expires_at, 5000);
  assert.deepEqual(resolveSkill('rogue_copy_acolyte_heal', 10, content).definition.kind, 'active');
  const heal = resolveSkill('acolyte_heal', 10, content).definition, copy = resolveSkill('rogue_copy_acolyte_heal', 10, content).definition;
  assert.ok(heal.kind === 'active' && copy.kind === 'active'); if (heal.kind === 'active' && copy.kind === 'active') assert.deepEqual(copy.effects, heal.effects);
});
test('guard, DEF and HP skills gain power while independent stacking and expiry remain intact', () => {
  const f = fixture(), hp = f.caster.stats.max_hp;
  f.apply('swordsman_endure'); close(f.caster.stats.guard_percent, .28);
  f.state.game_time_ms = 1000; f.apply('swordsman_endure'); close(f.caster.stats.guard_percent, .56);
  const hit: Effect = { id: 'hit', type: 'damage', target: 'foe', formula: { id: 'flat_power', params: { amount: 1000 } }, damage_type: 'physical', element: 'neutral', hit_rule: 'always', can_crit: false, hits: 1, armor_rule: 'normal' };
  const context = f.pipeline.context(f.target, 'normal', 'normal', 'incoming'); context.selected = { foe: [f.caster] }; f.pipeline.program([hit], context);
  assert.equal(f.events.filter(e => e.type === 'damage').at(-1)!.amount, 440);
  f.state.game_time_ms = 5000; f.pipeline.expire(); close(f.caster.stats.guard_percent, .28);
  f.state.game_time_ms = 6000; f.pipeline.expire(); close(f.caster.stats.guard_percent, 0);
  assert.equal(f.caster.stats.max_hp, hp);
  const guard = resolveSkill('monk_steel_body', 10, content).definition; assert.equal(guard.kind, 'active'); if (guard.kind === 'active') assert.equal((guard.effects[0] as Extract<Effect, { type: 'apply_status' }>).params.ratio, .7);
  const input = actor('tank', 'player'), baseline = resolveStats(input.stat_blueprint, content);
  const veteran = resolveSkill('knight_veteran', 10, content).definition; assert.equal(veteran.kind, 'passive'); if (veteran.kind === 'passive') close(resolveStats(input.stat_blueprint, content, veteran.modifiers as Modifier[]).max_hp, Math.floor(baseline.max_hp * 1.2625));
});
test('offensive and defensive support buffs change only authored power, leaving their timing and speed values intact', () => {
  const f = fixture(), atk = f.caster.stats.physical_attack; recomputeStats(f.caster, content); const base = f.caster.stats.physical_attack;
  f.apply('acolyte_blessing'); close(f.caster.stats.physical_attack, base * 1.2625);
  const raw = resolveSkill('crusader_defender', 10, content).definition; assert.ok(raw.kind === 'active');
  if (raw.kind === 'active') { const effects = raw.effects as Extract<Effect, { type: 'apply_status' }>[]; close(Number(effects[0]!.params.ratio), .525); close(Number(effects[1]!.params.ratio), .525); }
  const song = resolveSkill('bard_battle_song', 10, content).definition; assert.ok(song.kind === 'active'); if (song.kind === 'active') close(Number((song.effects[0] as Extract<Effect, { type: 'apply_status' }>).params.ratio), .24);
  assert.equal(atk, 1000);
});
test('Healing Plant inherits shared heal power without changing lifetime, cadence or ownership', () => {
  const input = actor('a', 'player'), resolved = structuredClone(resolveSkill('alchemist_bio_cannibalize', 1, content)) as { level: number; definition: SkillDefinition };
  input.resolved_skills = { alchemist_bio_cannibalize: resolved }; input.active_slots = ['alchemist_bio_cannibalize', null, null, null]; input.stat_blueprint.derived_offsets.max_sp = 1000;
  const initial = checkpoint(battle([input, actor('b', 'enemy')])); initial.actors[0]!.hp -= 10000;
  const skill = resolved.definition; assert.ok(skill.kind === 'active'); if (skill.kind !== 'active') return;
  const spawnAt = 1500 + Number(skill.timing.cast_ms), spawned = step(initial, spawnAt), summon = spawned.state.actors.find(a => a.kind === 'summon')!;
  assert.ok(summon); assert.equal(summon.owner_actor_id, 'a'); assert.equal(summon.summon_expires_at, spawnAt + 6500);
  const owner = spawned.state.actors[0]!; assert.equal(summon.stats.magical_attack, Math.floor(owner.stats.magical_attack * .35 * 1.75));
  const result = step(spawned.state, spawnAt + 1000), heal = result.events.find(e => e.type === 'heal' && e.skill_id === 'alchemist_bio_cannibalize');
  assert.ok(heal); assert.equal(heal.at_ms, spawnAt + 1000); assert.ok(heal.amount! > 0);
});
test('primary stat cards keep their RO stat and add proportional late-game power without rerolling instances', () => {
  const card = (id: string) => ({ kind: 'card' as const, instance_id: 'qa_' + id, definition_id: id, rarity_id: 'bronze' as const, level: 1, locked: false });
  const elder = resolvedCardModifiers(card('card_head_2'), content);
  assert.equal(elder.find(m => m.stat === 'int')!.value, 2); close(Number(elder.find(m => m.stat === 'magical_attack')!.value), .105); close(Number(elder.find(m => m.stat === 'max_sp')!.value), .14);
  const picky = resolvedCardModifiers(card('card_armor_2'), content); close(Number(picky.find(m => m.stat === 'physical_attack' && m.op === 'add_percent')!.value), .1225);
});
test('all ten weapon families independently increase same-budget builds at tiers20/40/60 without card sources', () => {
  const roots = { sword: 'swordsman', bow: 'archer', staff: 'mage', book: 'mage', knuckle: 'acolyte', axe: 'merchant', mace: 'merchant', dagger: 'thief', instrument: 'archer', whip: 'archer' } as const;
  const compatibility = content.documents['equipment.json']!.weapon_compatibility as unknown as Record<string, string>;
  for (const [weapon, root] of Object.entries(roots)) for (const level of [20, 40, 60]) {
    const s = initializeAccount(content, { root_job_id: root, gender: 'male' }, '2026-10-22T00:00:00.000Z', '2026-10-22', 1), a = s.roster[0]!;
    a.level = level; a.job_id = Object.keys(compatibility).find(job => compatibility[job] === weapon)! as typeof a.job_id;
    a.equipment = Object.fromEntries(Object.keys(a.equipment).map(k => [k, null])) as typeof a.equipment;
    const before = equipmentStats(s, 'main').stats, item: Extract<AccountState['inventory'][number], { kind: 'equipment' }> = { instance_id: 'qa_weapon', definition_id: `equipment_${weapon}_${level}`, kind: 'equipment', rarity_id: 'common', locked: false, training: false, options: [] };
    s.inventory.push(item); a.equipment.weapon = item.instance_id;
    const after = equipmentStats(s, 'main').stats, stat = weapon === 'staff' || weapon === 'book' || weapon === 'mace' ? 'magical_attack' : 'physical_attack';
    assert.ok(after[stat] / before[stat] > 1.25, `${weapon}Lv${level} gain must exceed25% without cards`);
    assert.ok(Object.values(a.slot_progress).every(p => p.cards.every(c => c === null)));
  }
});
