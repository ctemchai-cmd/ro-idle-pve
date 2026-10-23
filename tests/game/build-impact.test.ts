import { migrateCardRarity } from '../../src/domain/build/card-rarity.ts';
// Focused D-103 formula/source checks, not a balance simulation or calibration run.
import test from 'node:test';
import assert from 'node:assert/strict';
import type { AccountState, Effect, Modifier, SkillDefinition, Trigger } from '../../src/contracts/index.ts';
import { EffectPipeline } from '../../src/domain/combat/effects.ts';
import { damageForHit, resolveStats, spRegen } from '../../src/domain/math/index.ts';
import { recomputeStats } from '../../src/domain/combat/status.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { resolvedEquipmentModifiers, resolvedCardModifiers, equippedSources } from '../../src/domain/build/equipment.ts';
import { characterBlueprint } from '../../src/domain/build/character.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { migrateAccountState } from '../../src/domain/account/migrate.ts';
import { storyFarmSnapshot, storyStage } from '../../src/domain/modes/story.ts';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { reserveFarm } from '../../src/domain/rewards/farm.ts';
import { checkGolden, goldens } from './class-skills.ts';
import { actor, battle, checkpoint, content, step } from './combat-fixtures.ts';

const hit: Extract<Effect, { type: 'damage' }> = { id: 'hit', type: 'damage', target: 'foe', formula: { id: 'flat_power', params: { amount: 1000 } }, damage_type: 'physical', element: 'neutral', hit_rule: 'always', can_crit: false, hits: 1, armor_rule: 'normal' };
function modifier(stat: Modifier['stat'], value: number): Modifier { return { id: stat, stat, value, op: 'add_flat', bucket: 'bonus' }; }
function fixture(modifiers: Modifier[] = [], triggers: Trigger[] = []) {
  const input = actor('a', 'player');
  input.stat_blueprint.permanent_sources.push({ source: { instance_id: 'card', definition_id: 'card_hydra', owner_actor_id: 'a', origin_actor_id: 'a', origin_life_epoch: 0 }, modifiers, triggers });
  const state = checkpoint(battle([input, actor('b', 'enemy')]));
  const events: { type: string; amount?: number; skill_id?: string }[] = [];
  const pipeline = new EffectPipeline(state, content, { emit: e => events.push(e), metric: () => {}, interrupt: () => {}, revive: () => {} });
  const a = state.actors[0]!, b = state.actors[1]!;
  function apply(effects: Effect[], id = 'swordsman_bash', origin: 'skill' | 'normal' | 'proc' | 'periodic' = 'skill', source = a) {
    const context = pipeline.context(source, id, origin, `action_${state.event_sequence++}`); context.selected = { self: [source], foe: [b] }; pipeline.program(effects, context); return context;
  }
  return { state, a, b, pipeline, events, apply };
}
test('action bonuses join the existing outgoing bucket; legacy defaults, mitigation, crit and element stay shared', () => {
  const f = fixture([modifier('outgoing_physical_bonus', .2), modifier('skill_damage_bonus', .15), modifier('skill_damage_bonus', .10), modifier('normal_damage_bonus', .05)]);
  assert.equal(damageForHit(hit, 1000, f.a.stats, f.b.stats, 1, false, 'skill'), 1450);
  assert.equal(damageForHit(hit, 1000, f.a.stats, f.b.stats, 1, false, 'normal'), 1250);
  assert.equal(damageForHit(hit, 1000, f.a.stats, f.b.stats, 1, false), 1200);
  const old = { ...f.a.stats }; delete old.skill_damage_bonus; delete old.normal_damage_bonus;
  const target = { ...f.b.stats, physical_defense: 400, guard_percent: .1 };
  for (const element of [.5, 1, 1.5]) for (const crit of [true, false]) for (const action of ['skill', 'normal', 'other'] as const)
    assert.equal(damageForHit(hit, 1000, old, target, element, crit, action), damageForHit(hit, 1000, old, target, element, crit));
});
test('skill identity follows active, passive and periodic programs; normal origin takes precedence', () => {
  const f = fixture([modifier('skill_damage_bonus', .5), modifier('normal_damage_bonus', .1)]);
  for (const [id, origin, expected] of [['swordsman_bash', 'skill', 1500], ['sage_auto_bolt', 'proc', 1500], ['thief_envenom', 'periodic', 1500], ['swordsman_bash', 'normal', 1100], ['card_hydra', 'proc', 1000]] as const) {
    f.apply([hit], id, origin); assert.equal(f.events.at(-1)!.amount, expected, id);
  }
});
test('event-damage card proc receives already boosted hit once, without a second skill multiplier', () => {
  const trigger: Trigger = { id: 'matched', event: 'damage_dealt', chance: 1, accepted_origins: ['skill'], selectors: {}, limit_scope: 'per_root_action', limit_count: 1, reentry: 'deny_same_source_trigger_in_ancestry', effects: [{ ...hit, target: 'event_target', formula: { id: 'event_damage_power', params: { ratio: .2 } } }] };
  const f = fixture([modifier('skill_damage_bonus', .5)], [trigger]);
  f.apply([hit]); f.pipeline.drain();
  assert.deepEqual(f.events.filter(e => e.type === 'damage').map(e => [e.skill_id, e.amount]), [['swordsman_bash', 1500], ['card_hydra', 300]]);
});
test('damage bonuses cannot multiply healing, shielding, CC duration or SP regeneration', () => {
  const f = fixture([modifier('skill_damage_bonus', 10), modifier('normal_damage_bonus', 10)]); f.a.hp -= 200;
  assert.equal(spRegen(f.a.stats), spRegen(fixture().a.stats));
  f.apply([{ id: 'heal', type: 'heal', target: 'self', formula: { id: 'flat_power', params: { amount: 100 } } }, { id: 'shield', type: 'shield', target: 'self', formula: { id: 'flat_power', params: { amount: 60 } }, duration_ms: 3000, dispelable: true }, { id: 'stun', type: 'apply_status', target: 'foe', status_id: 'stun', params: {}, duration_ms: 1200, chance: 1 }]);
  assert.equal(f.events.find(e => e.type === 'heal')!.amount, 100); assert.equal(f.a.shields[0]!.remaining, 60); assert.equal(f.b.statuses[0]!.expires_at, 1200);
});
test('ATK detonation consumes own poison only and shares outgoing math once', () => {
  const f = fixture([modifier('skill_damage_bonus', .5)]);
  const poison: Effect = { id: 'poison', type: 'apply_status', target: 'foe', status_id: 'poison', duration_ms: 5000, chance: 1, params: { power_ratio: .1 } };
  f.apply([poison, poison]); f.apply([poison], 'thief_envenom', 'skill', f.b);
  f.apply([{ id: 'detonate', type: 'handler', target: 'foe', handler_id: 'detonate_own_status', params: { status_id: 'poison', max_consumed: null, power_per_instance: 40, attack_ratio_per_instance: 2, damage_type: 'physical', element: 'neutral' } }], 'assassin_detonate');
  assert.equal(f.events.filter(e => e.type === 'damage').at(-1)!.amount, Math.floor(2 * (40 + f.a.stats.physical_attack * 2) * 1.5));
  assert.equal(f.b.statuses.length, 1); assert.equal(f.b.statuses[0]!.source.origin_actor_id, 'b');
});
test('summon snapshots bonus ratios once without duplicating primary milestones or inheriting later buffs', () => {
  const input = actor('a', 'player');
  const resolved = structuredClone(resolveSkill('alchemist_hell_plant', 1, content)) as { level: number; definition: SkillDefinition }; assert.equal(resolved.definition.kind, 'active');
  input.resolved_skills = { alchemist_hell_plant: resolved }; input.active_slots = ['alchemist_hell_plant', null, null, null];
  input.stat_blueprint.allocated_primary = { str: 20, int: 20, agi: 20, dex: 20, luk: 20, vit: 20 };
  input.stat_blueprint.derived_offsets.max_sp = 1000;
  input.stat_blueprint.permanent_sources.push({ source: { instance_id: 'item', definition_id: 'item', owner_actor_id: 'a', origin_actor_id: 'a', origin_life_epoch: 0 }, modifiers: [modifier('skill_damage_bonus', .25), modifier('outgoing_physical_bonus', .10)], triggers: [] });
  const initial = battle([input, actor('b', 'enemy')]);
  const cast = resolved.definition as Extract<typeof resolved.definition, { kind: 'active' }>;
  const result = step(initial, 1500 + Number(cast.timing.cast_ms));
  const state = checkpoint(result.state), summon = state.actors.find(a => a.kind === 'summon')!, owner = state.actors[0]!;
  assert.ok(summon); assert.equal(summon.stats.skill_damage_bonus, .25); assert.equal(summon.stats.outgoing_physical_bonus, .1);
  assert.equal(summon.stats.crit_chance_bonus, owner.stats.crit_chance_bonus); assert.equal(summon.stats.evasion_bonus, owner.stats.evasion_bonus);
  const source = summon.stat_blueprint.permanent_sources[0]!.source; assert.equal(source.owner_actor_id, owner.actor_id); assert.equal(source.definition_id, 'alchemist_hell_plant');
  owner.stat_blueprint.permanent_sources[0]!.modifiers.push(modifier('skill_damage_bonus', .5)); recomputeStats(owner, content); recomputeStats(summon, content);
  assert.equal(owner.stats.skill_damage_bonus, .75); assert.equal(summon.stats.skill_damage_bonus, .25);
  assert.deepEqual(resolveStats(summon.stat_blueprint, content), summon.stats);
});
test('all 126 skill definitions match 378 authored numeric goldens without running encounters', () => {
  const rows = goldens(Object.keys(content.skills)); assert.equal(rows.length, 378); rows.forEach(checkGolden);
});
const account = () => initializeAccount(content, { root_job_id: 'swordsman', gender: 'male' }, '2026-10-22T00:00:00.000Z', '2026-10-22', 1);
type Gear = Extract<AccountState['inventory'][number], { kind: 'equipment' }>;
const gear = (id: string, rarity: Gear['rarity_id'] = 'common', options: Gear['options'] = []): Gear => ({ instance_id: 'qa_' + id, definition_id: id, kind: 'equipment', rarity_id: rarity, locked: false, training: false, options });
test('fractional gear roles survive rarity rounding; options and cards stay separate from item rarity', () => {
  const low = resolvedEquipmentModifiers(gear('equipment_sword_1'), content), high = resolvedEquipmentModifiers(gear('equipment_sword_1', 'legendary'), content);
  assert.equal(low.find(m => m.stat === 'skill_damage_bonus')!.value, .025); assert.equal(high.find(m => m.stat === 'skill_damage_bonus')!.value, .045);
  const options: Gear['options'] = [{ id: 'opt_skill_damage', roll: 1000 }], common = resolvedEquipmentModifiers(gear('equipment_sword_1', 'common', options), content), legendary = resolvedEquipmentModifiers(gear('equipment_sword_1', 'legendary', options), content);
  assert.deepEqual(common.filter(m => m.id.startsWith('option_')), legendary.filter(m => m.id.startsWith('option_')));
  assert.equal(common.find(m => m.id.startsWith('option_'))!.value, .04);
  assert.ok(resolvedEquipmentModifiers(gear('equipment_sword_1_b'), content).some(m => m.stat === 'normal_damage_bonus' && Number(m.value) > 0));
  const s = account(), a = s.roster[0]!, item = gear('equipment_sword_1', 'legendary', options);
  s.inventory.push(item, { instance_id: 'qa_wolf', definition_id: 'card_weapon_1', kind: 'card', rarity_id: 'gold', level: 5, locked: false });
  a.equipment.weapon = item.instance_id; a.slot_progress.weapon.cards[0] = 'qa_wolf';
  const sources = equippedSources(a, s, content), card = s.inventory.find(i => i.instance_id === 'qa_wolf') as Extract<AccountState['inventory'][number], { kind: 'card' }>;
  assert.deepEqual(sources.find(v => v.source.instance_id === 'qa_wolf')!.modifiers, resolvedCardModifiers(card, content));
  const stats = resolveStats(characterBlueprint(a, content, sources), content); assert.ok(stats.skill_damage_bonus! > 0);
});
test('flat monster cards also provide proportional growth for late-game ATK, HP and SP', () => {
  for (const [id, stat] of [['card_weapon_1', 'physical_attack'], ['card_pupa', 'max_hp'], ['card_head_1', 'max_sp']] as const) {
    const mods = resolvedCardModifiers({ instance_id: 'qa', definition_id: id, kind: 'card', rarity_id: 'bronze', level: 1, locked: false }, content);
    const ratio = Number(mods.find(m => m.stat === stat && m.op === 'add_percent')!.value), flat = Number(mods.find(m => m.stat === stat && m.op === 'add_flat')!.value);
    assert.ok(ratio > 0 && flat > 0); assert.ok(10000 * ratio + flat > 100 * ratio + flat);
  }
});
test('content migration preserves investments, instances, old rolls, slot progress, cursor and pending rewards', () => {
  let s = account();
  s.wallet.hero_exp = 100000; s.wallet.gold = 100000; s.wallet.skill_manual = 10000;
  s = applySandboxRoster(s, 'character.level_up', { character_id: 'main', target_level: 10 });
  s = applySandboxRoster(s, 'skill.upgrade', { character_id: 'main', skill_id: 'swordsman_bash', target_level: 2 });
  const a = s.roster[0]!;
  s.wallet.gold = 12345; s.story.cleared_stage_ids = ['1-1']; s.story.selected_farm_stage = '1-1'; s.farm.rate_snapshot = storyFarmSnapshot(storyStage('1-1', content)!, s, content);
  const from = Date.parse(s.farm.reserved_through), end = from + 3600000;
  s = reserveFarm(s, from, end, new Date(end).toISOString(), 'qa_fixed_reward', content);
  s.farm.rate_snapshot!.content_version = 'before_077';
  const item = gear('equipment_sword_1', 'rare', [{ id: 'opt_skill_damage', roll: 432 }]);
  s.inventory.push(item, { instance_id: 'qa_card', definition_id: 'card_weapon_1', kind: 'card', level: 3, rarity_id: 'silver', locked: true });
  const equipped = s.roster.find(r => r.character_id === a.character_id)!; equipped.equipment.weapon = item.instance_id; equipped.slot_progress.weapon.refine=5; equipped.slot_progress.weapon.cards[0] = 'qa_card';
  assert.ok(s.paid_ledger.length > 0 && s.pending_rewards[0]!.items.length > 0);
  const before = structuredClone(s), migrated = migrateAccountState(s, content).state;
  for (const key of ['wallet', 'paid_ledger', 'inventory', 'roster', 'pending_rewards', 'gacha', 'daily_records'] as const) assert.deepEqual(migrated[key], key === 'inventory' ? before.inventory.map(item => item.kind === 'card' ? migrateCardRarity(item, content) : item) : before[key], key);
  assert.equal(migrated.farm.reserved_through, before.farm.reserved_through); assert.deepEqual(s, before, 'migration must not mutate input');
  for (const key of ['loot_rng', 'remainders', 'drop_carry_ms'] as const) assert.deepEqual(migrated.farm[key], before.farm[key], key);
  assert.doesNotThrow(() => new AccountCommandRules().validateAccount(migrated));
});
