// Shared runtime harness for the per-tree skill tasks (TASK-029–034). Uses only the shipped content/engine.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { AccountState, BattleCheckpoint, Command, Effect, Modifier, Scenario, SkillDefinition, Trigger } from '../../src/contracts/index.ts';
import type { StoredBattle } from '../../src/contracts/save.ts';
import { AccountCommandRules, type CommandTime } from '../../src/domain/account/commands.ts';
import { characterBlueprint } from '../../src/domain/build/character.ts';
import { catalogQueueTrace } from '../../src/domain/build/queue-trace.ts';
import { compileCharacterSkills } from '../../src/domain/progression/skills.ts';
import { storyStages } from '../../src/domain/modes/story.ts';
import { captureReplay, runScenario } from '../../src/simulation/index.ts';
import { canonical } from '../../src/content/value.ts';
import type { ActorInput, BattleEvent } from '../../src/domain/combat/index.ts';
import { createBattle, advanceUntil, serializeBattle, restoreBattle } from '../../src/domain/combat/index.ts';
import { resolveSkill } from '../../src/domain/build/resolve-skill.ts';
import { attachLearnedPassives } from '../../src/domain/build/character.ts';
import { bindStatusParams } from '../../src/domain/combat/program.ts';
import { statusDefinition } from '../../src/domain/combat/status.ts';
import { rawPower, resolveStats } from '../../src/domain/math/index.ts';
import { initializeAccount } from '../../src/domain/progression/initialize.ts';
import { progressionData } from '../../src/domain/progression/characters.ts';
import { content, unwrap } from './combat-fixtures.ts';

export type Resolved = { level: number; definition: SkillDefinition };
type Active = Extract<SkillDefinition, { kind: 'active' }>;
type Passive = Extract<SkillDefinition, { kind: 'passive' }>;
export interface Build { id: string; job_id: string; level: number; role: string; primary_stats: AccountState['roster'][number]['primary_stats']; spent_status_points: number; unspent_status_points: number; active_slots: string[]; skill_levels: Record<string, number>; automatic_passives: string[]; queue_estimate: { si_ms: number; cycle_ms: number; fixed_sp_per_cycle: number; starts: { skill_id: string; start_ms: number; resolve_ms: number; acd_end_ms: number }[] } }
interface Golden { id: string; skill_id: string; skill_level: number; input: { source_physical_attack: number; source_magical_attack: number; pre_cost_sp: number; event_hp_damage: number; revive_target_max_hp: number; revive_target_max_sp: number; handler_target_statuses: { own_source: number; other_source: number } }; expected_cost: unknown; expected_modifiers: unknown[]; programs: { phase: string; trigger_id?: string; chance?: number; expected_intents: Record<string, unknown>[] }[] }

/** Shipped skills come from the content bundle; example builds are M0 design references (not shipped), read from plan data. */
export const treeData = (root: string) => ({ skills: (content.documents[`skills/${root}.json`]!.skills as unknown as SkillDefinition[]), builds: (JSON.parse(readFileSync(`plan/data/skills/${root}.json`, 'utf8')) as { builds: Build[] }).builds });
export const resolved = (id: string, level: number) => structuredClone(resolveSkill(id, level, content)) as Resolved;
const resolve = resolved;
export const goldens = (ids: readonly string[]) => (JSON.parse(readFileSync('plan/data/skill-program-cases.json', 'utf8')) as { cases: Golden[] }).cases.filter(row => ids.includes(row.skill_id));
const close = (a: number, b: number, label: string) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${label}: ${a} != ${b}`);
const plain = (modifier: Modifier) => ({ id: modifier.id, stat: modifier.stat, op: modifier.op, bucket: modifier.bucket, value: modifier.value });

/** Compares one shipped resolved definition against an M0 golden case; unknown golden keys fail loudly. */
export function checkGolden(row: Golden): void {
  const definition = resolved(row.skill_id, row.skill_level).definition, label = row.id;
  const offense = { ...resolveStats(attachLearnedPassives({ kind: 'fixed', level: 1, job_id: null, allocated_primary: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 }, derived_offsets: { physical_attack: 0, magical_attack: 0, max_hp: 0, max_sp: 0, physical_defense: 0, magical_defense: 0, attack_speed: 0, cast_speed: 0 }, permanent_sources: [], weapon_element: 'neutral' }, 'golden', {}), content), physical_attack: row.input.source_physical_attack, magical_attack: row.input.source_magical_attack };
  if (definition.kind === 'active') {
    // 'all_current' SP costs are golden as the amount actually spent from the case's pre-cost SP.
    const sp = definition.cost.sp, spent = typeof sp === 'object' && 'mode' in sp && sp.mode === 'all_current' ? { ...definition.cost, sp: row.input.pre_cost_sp } : definition.cost;
    if (spent !== definition.cost) assert.ok(row.input.pre_cost_sp >= Number((sp as { minimum_sp: number }).minimum_sp), `${label} minimum SP`);
    assert.deepEqual(spent, row.expected_cost, `${label} cost`);
  }
  else { assert.deepEqual(row.expected_cost, { sp: 0, spirit_spheres: 0 }, label); assert.deepEqual(definition.modifiers.map(plain), row.expected_modifiers, `${label} passive modifiers`); }
  // One expected intent against one resolved effect; periodic tick intents recurse with the status params bound.
  const checkIntent = (resolvedEffect: Effect, intent: Record<string, unknown>, path: string): void => {
    const effect = resolvedEffect as Effect & Record<string, unknown>, at = `${path}.${effect.id}`;
    for (const [key, expected] of Object.entries(intent)) {
      if (key === 'effect_id') assert.equal(effect.id, expected, at);
      else if (['type', 'target', 'status_id', 'duration_ms', 'chance', 'params', 'actor_definition_id', 'max_owned', 'power_scale', 'max_instances', 'critical_rule', 'crit_chance_bonus', 'crit_damage_bonus', 'damage_type', 'element', 'hit_rule', 'can_crit', 'hits', 'armor_rule'].includes(key)) assert.deepEqual(effect[key], expected, `${at}.${key}`);
      else if (key === 'predicate') assert.deepEqual(effect.when, expected, `${at}.when`);
      else if (key === 'expected_raw_power' && effect.type === 'handler') close(row.input.handler_target_statuses.own_source * (Number(effect.params.power_per_instance) + Number(effect.params.attack_ratio_per_instance ?? 0) * row.input.source_physical_attack), Number(expected), at);
      else if (key === 'expected_raw_power') close(rawPower((effect as Extract<Effect, { type: 'damage' }>).formula as never, offense, row.input.pre_cost_sp, row.input.event_hp_damage), Number(expected), at);
      else if (key === 'expected_modifiers' && effect.type === 'apply_status') assert.deepEqual(bindStatusParams(statusDefinition(content, effect.status_id).modifiers, effect.params as Record<string, number>).map(plain), expected, at);
      else if (key === 'requested_delta' && effect.type === 'resource_change') assert.equal(effect.amount, expected, at);
      else if (key === 'tick_times_ms' && effect.type === 'apply_status') {
        const periodic = statusDefinition(content, effect.status_id).periodic!, ticks: number[] = [];
        for (let time = periodic.tick_on_apply ? 0 : periodic.interval_ms; time < Number(effect.duration_ms); time += periodic.interval_ms) ticks.push(time);
        assert.deepEqual(ticks, expected, `${at}.ticks`);
      } else if (key === 'periodic_raw_intents' && effect.type === 'apply_status') {
        const ticks = bindStatusParams(statusDefinition(content, effect.status_id).periodic!.effects, effect.params as Record<string, number>), rows = expected as Record<string, unknown>[];
        assert.deepEqual(ticks.map(tick => tick.id), rows.map(row => row.effect_id), `${at}.periodic order`);
        ticks.forEach((tick, n) => checkIntent(tick, rows[n]!, `${at}.periodic`));
      }
      else if (key === 'own_statuses_consumed' && effect.type === 'handler') assert.equal(Math.min(row.input.handler_target_statuses.own_source, effect.params.max_consumed ?? Infinity), expected, at);
      else if (key === 'other_source_statuses_remaining' && effect.type === 'handler') assert.equal(row.input.handler_target_statuses.other_source, expected, at);
      else if (key === 'expected_hp_after' && effect.type === 'revive') assert.equal(Math.max(1, Math.floor(row.input.revive_target_max_hp * Number(effect.hp_ratio))), expected, at);
      else if (key === 'expected_sp_after' && effect.type === 'revive') assert.equal(Math.floor(row.input.revive_target_max_sp * Number(effect.sp_ratio)), expected, at);
      else assert.fail(`UNCHECKED_GOLDEN_KEY ${at}.${key}`);
    }
  };
  for (const program of row.programs) {
    let effects: readonly Effect[];
    if (program.phase === 'cast_start' || program.phase === 'cast_resolve') { assert.equal(definition.kind, 'active', label); effects = program.phase === 'cast_start' ? (definition as Active).start_effects : (definition as Active).effects; }
    else {
      assert.equal(definition.kind, 'passive', label); const trigger = (definition as Passive).triggers.find(value => value.id === program.trigger_id);
      assert.ok(trigger, `${label} trigger ${program.trigger_id}`); assert.equal(`trigger_${trigger.event}`, program.phase, label); assert.equal(trigger.chance, program.chance, label); effects = trigger.effects;
    }
    assert.deepEqual(effects.map(effect => effect.id), program.expected_intents.map(intent => intent.effect_id), `${label} ${program.phase} order`);
    program.expected_intents.forEach((intent, index) => checkIntent(effects[index]!, intent, `${label}.${program.phase}`));
  }
}

/** Fixed-stat probe actor; skills keep their shipped resolved definitions. */
export function probe(id: string, team: 'player' | 'enemy', position: string, skills: Resolved[] = [], normal = false, job: string | null = null): ActorInput {
  const actives = skills.filter(row => row.definition.kind === 'active').map(row => row.definition.id);
  return { actor_id: id, team, kind: team === 'player' ? 'party' : 'enemy', position, build_hash: `probe_${id}`, normal_attack_enabled: normal, tags: [],
    stat_blueprint: { kind: 'fixed', level: 50, job_id: job, allocated_primary: { str: 30, agi: 1, vit: 30, int: 30, dex: 30, luk: 1 },
      derived_offsets: { physical_attack: 300, magical_attack: 300, max_hp: 5000000, max_sp: 100000, physical_defense: 0, magical_defense: 0, attack_speed: 0, cast_speed: 0 }, permanent_sources: [], weapon_element: 'neutral' },
    active_slots: [actives[0] ?? null, actives[1] ?? null, actives[2] ?? null, actives[3] ?? null], resolved_skills: Object.fromEntries(skills.map(row => [row.definition.id, row])) };
}
export function story(ref: string, limit: number): BattleCheckpoint['mode'] { return { kind: 'story', ref, time_limit_ms: limit, ticket_day: null, daily_phase: null, daily_current_hp: null, reserved_phase_keys: [] }; }
export function run(actors: ActorInput[], until: number, seed = 1, edit?: (state: BattleCheckpoint) => void) {
  const initial = serializeBattle(unwrap(createBattle({ actors, mode: story('skill-probe', until + 1000) }, content, seed))); edit?.(initial);
  const result = unwrap(advanceUntil(unwrap(restoreBattle(initial, content)), until, content, {}, { max_events: 1000000 }));
  return { initial, state: result.state, events: result.events };
}

/**
 * Casts one Active at one level in a 2v2 probe (caster front, wounded ally back, two attacking foes) and
 * checks every effect really happened on an allowed target, in program order per cast.
 */
export function probeActive(id: string, level: number, seed = 1, until = 30000) {
  const skill = resolved(id, level), definition = skill.definition as Active;
  const effects = [...definition.start_effects, ...definition.effects], revives = effects.some(effect => effect.type === 'revive');
  // Interrupt/dispel need something to act on: foes then cast a long interruptible self-buff (dispelable attack_up).
  const kit = effects.some(effect => effect.type === 'interrupt' || effect.type === 'remove_status') ? [{ level: 1, definition: { ...structuredClone(resolve('swordsman_bash', 1).definition as Active), id: 'probe_enemy_buff', class_id: 'enemy', cost: { sp: 0, spirit_spheres: 0 }, timing: { cast_ms: 3000, after_cast_ms: 200, interruptible: true }, effects: [{ id: 'buff', type: 'apply_status', target: 'self', status_id: 'attack_up', duration_ms: 20000, params: { ratio: .1 }, chance: 1 }] } as SkillDefinition }] : [];
  const { initial, events, state } = run([probe('p_caster', 'player', 'front_1', [skill], false, definition.class_id), probe('p_ally', 'player', 'back_1'), probe('e_front', 'enemy', 'front_1', kit, true), probe('e_back', 'enemy', 'back_1', kit, true)], until, seed,
    checkpoint => {
      // Wounded ally for heals, dead ally for revives; sphere costs start from a full (5) sphere pool.
      checkpoint.actors.find(actor => actor.actor_id === 'p_ally')!.hp = revives ? 0 : 2500000;
      if (Number(definition.cost.spirit_spheres) > 0) checkpoint.actors.find(actor => actor.actor_id === 'p_caster')!.spirit_spheres = 5;
      for (const enemy of checkpoint.actors.filter(actor => actor.team === 'enemy')) enemy.stats.physical_attack = 200;
    });
  const resolves = events.filter(event => event.type === 'cast_resolve' && event.actor_id === 'p_caster' && event.skill_id === id);
  assert.ok(resolves.length > 0, `${id} Lv${level} never resolved`);
  const team = (selector: string) => selector === 'self' ? ['p_caster'] : definition.selectors[selector]!.team === 'allies' ? ['p_ally', 'p_caster'] : ['e_back', 'e_front'];
  // Every effect event carries its parent cast as source_instance_id and the effect id (D-060 attribution).
  const own = events.filter(event => event.source_instance_id?.startsWith('cast_p_caster_') && event.skill_id === id && event.type !== 'status_expired');
  const kinds: Record<string, BattleEvent['type']> = { damage: 'damage', handler: 'damage', heal: 'heal', shield: 'shield', apply_status: 'status_applied', resource_change: 'resource_change', remove_status: 'status_removed', revive: 'revive', interrupt: 'cast_interrupt', summon: 'summon' };
  const index = (event: BattleEvent) => effects.findIndex(effect => effect.id === event.effect_id && kinds[effect.type] === event.type);
  for (const effect of effects) {
    // cast_interrupt names the victim's skill; the interrupter is its action_id (D-060).
    const seen = effect.type === 'interrupt' ? events.filter(event => event.type === 'cast_interrupt' && event.action_id?.startsWith('cast_p_caster_')) : own.filter(event => index(event) >= 0 && effects[index(event)] === effect);
    assert.ok(seen.length > 0, `${id} Lv${level} effect ${effect.id} produced no event`);
    if (effect.type === 'remove_status') assert.ok(seen.some(event => event.detail), `${id} removed nothing`);
    for (const event of seen) { const target = event.type === 'revive' || event.type === 'cast_interrupt' ? event.actor_id : event.target_id; assert.ok(team(effect.target).includes(target!), `${id}.${effect.id} hit ${target}`); }
    if (definition.selectors[effect.target]?.select === 'all') assert.deepEqual([...new Set(seen.map(event => event.target_id))].sort(), team(effect.target), `${id}.${effect.id} must reach every living target`);
    if (effect.type === 'apply_status') for (const event of seen) {
      assert.equal(event.status_change!.expires_at - event.status_change!.applied_at, effect.duration_ms, `${id}.${effect.id} duration`);
      assert.deepEqual(event.status_change!.params, effect.params, `${id}.${effect.id} params`);
    }
    if (effect.type === 'apply_status' && statusDefinition(content, effect.status_id).periodic) for (const tick of statusDefinition(content, effect.status_id).periodic!.effects)
      assert.ok(events.some(event => event.effect_id === tick.id && event.skill_id === id && event.source_instance_id?.startsWith('cast_p_caster_')), `${id}.${effect.id} periodic ${tick.id} never ticked`);
    if (effect.type === 'summon') assert.ok(events.some(event => (event.type === 'damage' || event.type === 'heal') && event.skill_id === id && event.source_instance_id?.startsWith('summon_p_caster_')), `${id} summoned ${effect.actor_definition_id} never acted`);
    if (effect.type === 'heal' || effect.type === 'shield') for (const event of seen) assert.ok(event.type !== 'heal' || (event.amount ?? 0) >= 0, `${id}.${effect.id} amount`);
    if (effect.type === 'damage') for (const event of seen) assert.ok((event.raw ?? 0) > 0, `${id}.${effect.id} raw`);
  }
  for (const cast of new Set(own.map(event => event.source_instance_id!))) {
    const order = own.filter(event => event.source_instance_id === cast).map(index).filter(value => value >= 0); assert.deepEqual(order, order.slice().sort((a, b) => a - b), `${id} effect order`);
  }
  return { events, state, initial, resolves: resolves.length };
}

/** Passive: modifiers change resolved stats; triggers proc in a fight where the carrier attacks and is attacked. */
export function probePassive(id: string, level: number, seed = 1) {
  const skill = resolved(id, level), definition = skill.definition as Passive;
  assert.ok(definition.modifiers.length || definition.triggers.length, `${id} has no effect`);
  const carrier = (skills: Resolved[]) => probe('p_carrier', 'player', 'front_1', skills, true, definition.class_id);
  const without = resolveStats(attachLearnedPassives(carrier([]).stat_blueprint, 'p_carrier', {}), content), withPassive = resolveStats(attachLearnedPassives(carrier([skill]).stat_blueprint, 'p_carrier', { [id]: skill as never }), content);
  for (const modifier of definition.modifiers.filter(row => !row.when)) {
    const delta = (withPassive[modifier.stat] ?? 0) - (without[modifier.stat] ?? 0); assert.ok(Math.sign(delta) === Math.sign(Number(modifier.value)) && delta !== 0, `${id} Lv${level} ${modifier.stat} delta ${delta}`);
  }
  if (!definition.triggers.length) return { procs: 0, stats: { without, with: withPassive } };
  const { events } = run([carrier([skill]), probe('p_ally', 'player', 'back_1'), probe('e_front', 'enemy', 'front_1', [], true), probe('e_back', 'enemy', 'back_1', [], true)], 20000, seed,
    checkpoint => { for (const enemy of checkpoint.actors.filter(actor => actor.team === 'enemy')) enemy.stats.physical_attack = 200; });
  for (const trigger of definition.triggers as Trigger[]) {
    assert.ok(events.some(event => event.type === 'proc' && event.actor_id === 'p_carrier' && event.detail === trigger.id), `${id} trigger ${trigger.id} never fired`);
    for (const effect of trigger.effects) {
      const hits = events.filter(event => event.skill_id === id && event.effect_id === effect.id);
      assert.ok(hits.length > 0, `${id}.${effect.id} produced no ${effect.type} event`);
      if (effect.type === 'damage') for (const hit of hits) assert.equal(hit.origin, effect.as_reflect ? 'reflect' : 'proc', `${id}.${effect.id} origin`);
    }
  }
  return { procs: events.filter(event => event.type === 'proc' && event.actor_id === 'p_carrier').length, stats: { without, with: withPassive } };
}

/** Real account character for a data build (root tree main character), validated by the server rules. */
export function buildAccount(root: string, builds: readonly Build[]): AccountState {
  const state = initializeAccount(content, { root_job_id: root as AccountState['roster'][number]['root_job_id'], gender: 'male' }, '2026-10-20T00:00:00.000Z', '2026-10-20', 1);
  const gates = progressionData(content).progression.breakthrough_gates, zero = Object.fromEntries(Object.keys(state.wallet).map(key => [key, 0])) as AccountState['wallet'];
  builds.forEach((build, index) => {
    const actor = index === 0 ? state.roster.find(row => row.character_id === 'main')! : state.roster.find(row => row.character_id === `npc_${root}`)!, passed = gates.filter(gate => gate.at_level <= build.level);
    if (build.job_id === 'bard') actor.gender = 'male'; if (build.job_id === 'dancer') actor.gender = 'female'; // same rule as character.change_job
    Object.assign(actor, { job_id: build.job_id, level: build.level, completed_gate_ids: passed.map(gate => gate.at_level), local_cap: passed.at(-1)?.unlocks_local_cap ?? actor.local_cap, primary_stats: { ...build.primary_stats }, unspent_status_points: build.unspent_status_points, skill_levels: { ...build.skill_levels }, active_slots: [...build.active_slots] });
    state.paid_ledger.push({ entry_id: `status_${build.id}`, character_id: actor.character_id, feature_id: 'status', skill_id: null, quantity: build.spent_status_points, cost_version: 'build', cost_versions: ['build'], paid_resources: zero, refund_state: 'active', refund_command_id: null });
  });
  return state;
}

/** Main character of a one-build account for a tree, already validated by the server rules. */
export function buildCharacter(root: string, row: Build) { const account = buildAccount(root, [row]); new AccountCommandRules().validateAccount(account); return account.roster.find(actor => actor.character_id === 'main')!; }
export function buildActor(root: string, row: Build, id: string, position: string): ActorInput {
  const character = buildCharacter(root, row);
  return { actor_id: id, kind: 'party', team: 'player', position, stat_blueprint: characterBlueprint(character, content), ...compileCharacterSkills(character, content), build_hash: `build_${row.id}`, normal_attack_enabled: true, tags: [] };
}

/** Dry catalog trace of every build equals its M0 queue_estimate and includes learned Passive stat changes. */
export function checkDryTraces(root: string, builds: readonly Build[]) {
  const out: Record<string, unknown> = {};
  for (const row of builds) {
    const character = buildCharacter(root, row), skills = compileCharacterSkills(character, content), trace = catalogQueueTrace(character, skills, content);
    const { si_ms, cycle_ms, starts, fixed_sp_per_cycle } = row.queue_estimate, ratings = row.queue_estimate as { cast_speed_rating?: number; attack_speed_rating?: number };
    if (ratings.cast_speed_rating !== undefined) assert.ok(Math.abs(trace.stats.cast_speed - ratings.cast_speed_rating) < 1e-9, `${row.id} cast speed ${trace.stats.cast_speed}`);
    if (ratings.attack_speed_rating !== undefined) assert.ok(Math.abs(trace.stats.attack_speed - ratings.attack_speed_rating) < 1e-9, `${row.id} attack speed ${trace.stats.attack_speed}`);
    assert.deepEqual({ si_ms: trace.si_ms, cycle_ms: trace.cycle_ms, starts: trace.starts, fixed_sp_per_cycle: trace.fixed_sp_per_cycle }, { si_ms, cycle_ms, starts, fixed_sp_per_cycle }, row.id);
    const passives = row.automatic_passives, bare = catalogQueueTrace({ ...character, skill_levels: Object.fromEntries(Object.entries(character.skill_levels).filter(([id]) => !passives.includes(id))) }, { ...skills, resolved_skills: Object.fromEntries(Object.entries(skills.resolved_skills).filter(([id]) => !passives.includes(id))) }, content);
    const changed = (Object.keys(trace.stats) as (keyof typeof trace.stats)[]).filter(key => trace.stats[key] !== bare.stats[key]);
    assert.ok(!passives.length || changed.length > 0, `${row.id} learned passives must change the trace stats`);
    out[row.id] = { si_ms: trace.si_ms, cycle_ms: trace.cycle_ms, passive_changed_stats: changed };
  }
  return out;
}

/**
 * Runtime vs runner parity on a real Story stage: server battle.start_story/battle.advance commands (1s credit each),
 * the client SavedBattleSession predicting in uneven frames with a render view each frame and confirming every
 * server checkpoint, and runScenario on the captured initial checkpoint must agree on final state and every event.
 */
export async function storyParity(root: string, builds: readonly Build[], stageId: string, seed: number) {
  const { SavedBattleSession } = await import('../../src/client/story.ts');
  const rules = new AccountCommandRules(), at = Date.parse('2026-10-20T00:00:00.000Z'), account = '11111111-1111-4111-8111-111111111111';
  let save: AccountState = buildAccount(root, builds), stored: StoredBattle | null = null, revision = 1, serial = 0, elapsed = 0;
  const stages = storyStages(content), target = stages.find(stage => stage.id === stageId)!;
  save.story.cleared_stage_ids = stages.slice(0, stages.indexOf(target)).map(stage => stage.id);
  // The default team is main + Swordsman/Acolyte/Archer NPCs; trees outside it swap their NPC in for the Archer slot.
  if (builds.length > 1 && !save.team.some(member => member.character_id === `npc_${root}`)) save.team = save.team.map(member => member.character_id === 'npc_archer' ? { ...member, character_id: `npc_${root}` } : member) as AccountState['team'];
  rules.validateAccount(save);
  const hashes = Object.fromEntries(save.roster.map(actor => [actor.character_id, 'a'.repeat(64)]));
  function command(type: Command['type'], params: unknown) {
    elapsed += 1000; const now = at + elapsed, pointer = save.active_battle;
    const input = { type, params, request_id: `22222222-2222-4222-8222-${String(++serial).padStart(12, '0')}`, expected_revision: revision, schema_version: 1, ...rules.versions } as Command; rules.parse(input);
    const time: CommandTime = { account_id: account, battle_id: '33333333-3333-4333-8333-000000000029', battle_seed: seed, build_hashes: hashes, server_at: new Date(now).toISOString(), now_ms: now, new_lease_at: new Date(now + 15000).toISOString(),
      last_ack_ms: pointer ? Date.parse(pointer.last_ack_at) : 0, lease_expires_ms: pointer ? Date.parse(pointer.lease_expires_at) : 0, started_ms: pointer ? Date.parse(pointer.started_at) : 0, farm_from_ms: Date.parse(save.farm.reserved_through),
      stored_last_ack_ms: stored ? Date.parse(stored.last_ack_at) : 0, stored_lease_ms: stored ? Date.parse(stored.lease_expires_at) : 0 };
    const result = rules.decide(input, save, stored, time, 'b'.repeat(64));
    assert.equal(result.receipt.outcome, 'committed', JSON.stringify(result.receipt)); save = result.state; revision++;
    if (result.battle_write.kind === 'upsert') stored = result.battle_write.battle; if (result.battle_write.kind === 'delete') stored = null;
    return result.receipt.result.code;
  }
  assert.equal(command('battle.start_story', { stage_id: target.id }), 'STORY_STARTED');
  const initial = structuredClone(stored!.payload) as BattleCheckpoint, session = new SavedBattleSession(initial, save);
  const scenario: Scenario = { id: `${root}_parity`, schema_version: 1, content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version, seed, mode: { kind: 'story', ref: target.id }, budget_policy: 'explicit_single_scenario', log_level: 'trace', team: save.team.map(member => ({ actor_id: member.character_id, build_id: hashes[member.character_id]!, position: member.position, equipment_profile: 'saved_account' })) as Scenario['team'] };
  const runner = unwrap(runScenario(captureReplay(scenario, session.initial, `${root}_parity`, {}), content));
  const clientEvents: BattleEvent[] = []; let code = 'BATTLE_ADVANCED', confirmations = 0;
  while (code === 'BATTLE_ADVANCED') {
    for (const step of [137, 263, 412, 188]) { clientEvents.push(...session.advanceTo(Math.min(session.state.game_time_ms + step, initial.mode.time_limit_ms))); session.view(); }
    code = command('battle.advance', { battle_id: save.active_battle!.battle_id, requested_game_ms: initial.mode.time_limit_ms });
    if (stored) { session.confirm((stored as StoredBattle).payload); confirmations++; }
  }
  while (!session.state.terminal_result) { clientEvents.push(...session.advanceTo(Math.min(session.state.game_time_ms + 250, initial.mode.time_limit_ms))); session.view(); }
  assert.equal(canonical(serializeBattle(session.state)), canonical(serializeBattle(runner.final_state)));
  assert.deepEqual(clientEvents, runner.report.events);
  assert.equal(code, ({ victory: 'STORY_WON', defeat: 'STORY_DEFEATED', time_limit: 'STORY_TIME_LIMIT' } as Record<string, string>)[runner.report.result!.kind]); assert.ok(confirmations > 5, `confirmations ${confirmations}`);
  return { runner, clientEvents, code, confirmations, team: save.team, stage: target.id };
}
