import { attachLearnedPassives } from '../build/character.ts';
import type { BattleActor, BattleCheckpoint, CastState, CombatStats, Effect, MetricRow, Selector, SkillDefinition } from '../../contracts/index.ts';
import { fixedEnemyBlueprint } from '../build/story.ts';
import type { Result, ValidatedContent } from '../../content/model.ts';
import { freeze } from '../../content/value.ts';
import { castDurationMs, checked, hpRegen, resolveStats, skillIntervalMs, spRegen } from '../math/index.ts';
import { fixedSpCost } from '../math/combat-modifiers.ts';
import { emptyMetrics } from './model.ts';
import type { BattleEvent, BattleInput, BattleState, BattleStep, ModeRespawn, PureModePolicy, RunLimits } from './model.ts';
import { EffectPipeline } from './effects.ts';
import type { ProgramContext } from './program.ts';
import { recomputeStats, statusDefinition, statusRestriction, weaponElement } from './status.ts';
import { compareId, compareTimer, schedule } from './scheduler.ts';
import { cloneWorkingState } from './state.ts';
import { inNormalRange, MOTION_STEP_MS, moveActors, normalTarget, validateSpatialInput } from './spatial.ts';

type ActiveSkill = Extract<SkillDefinition, { kind: 'active' }>;
type SummonEffect = Extract<Effect, { type: 'summon' }>;
type PeriodicPolicy = Extract<BattleActor['action_policy'], { kind: 'periodic' }>;
/** Catalog summon actor (summon-actors.json): owner-bound, untargetable, periodic action, never counts for terminal. */
interface SummonDefinition { id: string; targetable: boolean; derived_scale: number; action: { interval_ms: number; tick_on_spawn: boolean; effects: [Effect, ...Effect[]]; selectors: Record<string, Selector> }; source_death: 'remove' }
const SCALED: readonly (keyof CombatStats)[] = ['physical_attack', 'magical_attack', 'max_hp', 'max_sp', 'physical_defense', 'magical_defense'];
function numeric(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) throw new TypeError('UNRESOLVED_OR_UNSAFE_NUMBER');
  return value;
}
function occupied(actor: BattleActor): boolean {
  for (let index = 0; index < 4; index++) {
    const slot = (actor.rotation_cursor + index) % 4;
    if (actor.active_slots[slot]) { actor.rotation_cursor = slot; return true; }
  }
  return false;
}
function activeDefinition(actor: BattleActor): ActiveSkill {
  const id = actor.active_slots[actor.rotation_cursor];
  const skill = id ? actor.resolved_skills[id]?.definition : undefined;
  if (skill?.kind !== 'active') throw new TypeError('UNUSABLE_SKILL_REFERENCE');
  return skill;
}
function enterPhase(state: BattleCheckpoint, actor: BattleActor, phase: 'skill_interval' | 'after_cast', base = 0) {
  if (!occupied(actor)) { actor.action_phase = 'normal_only'; actor.phase_ready_at = null; return; }
  const speed = phase === 'skill_interval' ? actor.stats.attack_speed : actor.stats.cast_speed;
  const duration = phase === 'skill_interval' ? skillIntervalMs(speed, state.timing?.skill_interval_base_ms) : castDurationMs(base, speed);
  if (phase === 'after_cast' && duration === 0) { enterPhase(state, actor, 'skill_interval'); return; }
  actor.action_phase = phase; actor.phase_started_at = state.game_time_ms; actor.phase_duration_ms = duration; actor.phase_speed_snapshot = speed;
  actor.phase_ready_at = state.game_time_ms + duration;
  schedule(state, actor, 'phase_ready', actor.phase_ready_at);
}
function sortActors(state: BattleCheckpoint) { return state.actors.slice().sort((a, b) => compareId(a.actor_id, b.actor_id)); }
function failure(code: string): Result<never> { return { ok: false, errors: [{ code, source: 'combat', path: '', message: code }] }; }

export function createBattle(input: BattleInput, content: ValidatedContent, seed: number): Result<BattleState> {
  try {
    validateSpatialInput(input);
    if (input.timing) {
      if (Object.keys(input.timing).length !== 2 || typeof input.timing.skill_interval_base_ms !== 'number' || typeof input.timing.normal_attack_base_ms !== 'number') throw new TypeError('INVALID_TIMING_PROFILE');
      skillIntervalMs(100, input.timing.skill_interval_base_ms); skillIntervalMs(100, input.timing.normal_attack_base_ms);
    }
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new TypeError('INVALID_SEED');
    if (new Set(input.actors.map(actor => actor.actor_id)).size !== input.actors.length) throw new TypeError('DUPLICATE_ACTOR_ID');
    if (!input.actors.some(actor => actor.team === 'player') || !input.actors.some(actor => actor.team === 'enemy')) throw new TypeError('BOTH_TEAMS_REQUIRED');
    if (!Number.isSafeInteger(input.mode.time_limit_ms) || input.mode.time_limit_ms < 1) throw new TypeError('INVALID_BATTLE_LIMIT');
    const state: BattleCheckpoint = {
      ...(input.timing ? { timing: structuredClone(input.timing) } : {}),
      ...(input.arena ? { arena: structuredClone(input.arena) } : {}),
      schema_version: 1, content_hash: content.manifest.content_hash, rules_version: content.manifest.rules_version, rng_version: 'lcg32-v1', initial_seed: seed,
      rng: { state: seed, draw_count: 0 }, game_time_ms: 0, phase: 7, checkpoint_barrier: true, event_sequence: 0,
      trigger_activations: {}, mode: structuredClone(input.mode), actors: [] as unknown as BattleCheckpoint['actors'], pending_events: [], metrics: { team: { player: emptyMetrics(), enemy: emptyMetrics() }, actors: {}, skills: {} }, terminal_result: null,
    };
    for (const source of input.actors.slice().sort((a, b) => compareId(a.actor_id, b.actor_id))) {
      if (!source.actor_id || source.active_slots.length !== 4) throw new TypeError('INVALID_ACTOR_INPUT');
      const assigned = source.active_slots.filter(Boolean);
      if (new Set(assigned).size !== assigned.length) throw new TypeError('DUPLICATE_SKILL_SLOT');
      for (const id of assigned) if (!source.resolved_skills[id!]?.definition || source.resolved_skills[id!]!.definition.kind !== 'active') throw new TypeError('UNUSABLE_SKILL_REFERENCE');
      for (const id of assigned) {
        const definition = source.resolved_skills[id!]!.definition;
        if (definition.kind === 'active') for (const effect of [...definition.start_effects, ...definition.effects]) {
          if (!['damage', 'heal', 'shield', 'apply_status', 'remove_status', 'resource_change', 'interrupt', 'revive', 'handler', 'summon'].includes(effect.type)) throw new Error('UNKNOWN_EFFECT_TYPE');
        }
      }
      const blueprint = attachLearnedPassives(source.stat_blueprint, source.actor_id, source.resolved_skills);
      const stats = resolveStats({ ...blueprint, permanent_sources: blueprint.permanent_sources.map(row => ({ ...row, modifiers: row.modifiers.filter(modifier => !modifier.when) })) }, content);
      const actor: BattleActor = {
        actor_id: source.actor_id, team: source.team, kind: source.kind, position: source.position,
        ...(source.spatial ? { spatial: { ...source.spatial, previous_x: source.spatial.x, previous_y: source.spatial.y, updated_at: 0, moving: false, target_id: null } } : {}),
        owner_actor_id: null, root_owner_actor_id: source.actor_id, life_epoch: 0, build_hash: source.build_hash,
        targetable: source.targetable ?? true, counts_for_terminal: source.counts_for_terminal ?? true, revivable: source.kind === 'party',
        stat_blueprint: blueprint, stats, hp: stats.max_hp, sp: stats.max_sp, spirit_spheres: 0,
        tags: source.tags.slice(), active_slots: structuredClone(source.active_slots), resolved_skills: structuredClone(source.resolved_skills), rotation_cursor: 0,
        action_phase: 'normal_only', phase_ready_at: null, phase_started_at: 0, phase_duration_ms: 0, phase_speed_snapshot: stats.attack_speed,
        normal_clock: { due_at: null, remaining_ms: skillIntervalMs(stats.attack_speed, state.timing?.normal_attack_base_ms), paused_for_cast: false },
        cast: null, statuses: [], shields: [], summon_expires_at: null, action_policy: { kind: 'rotation', normal_attack_enabled: source.normal_attack_enabled },
      };
      recomputeStats(actor, content); actor.hp = actor.stats.max_hp; actor.sp = actor.stats.max_sp;
      state.actors.push(actor); state.metrics.actors[actor.actor_id] = emptyMetrics();
      if (blueprint.permanent_sources.some(row => row.triggers.some(trigger => trigger.event === 'battle_start'))) schedule(state, actor, 'battle_start', 0);
      if (occupied(actor)) enterPhase(state, actor, 'skill_interval');
      if (source.normal_attack_enabled) { actor.normal_clock.due_at = skillIntervalMs(stats.attack_speed, state.timing?.normal_attack_base_ms); schedule(state, actor, 'normal_attack', actor.normal_clock.due_at); }
      schedule(state, actor, 'resource_regen', 1000);
      if (actor.spatial) schedule(state, actor, 'motion_tick', MOTION_STEP_MS);
    }
    state.pending_events.sort(compareTimer);
    return { ok: true, value: freeze(state) };
  } catch (error) { return failure(String(error)); }
}

export function advanceUntil(input: BattleState, toGameMs: number, content: ValidatedContent, policy: PureModePolicy = {}, limits: RunLimits = { max_events: 100000 }): Result<BattleStep> {
  if (!Number.isSafeInteger(toGameMs) || toGameMs < input.game_time_ms) return failure('INVALID_ADVANCE_TIME');
  if (input.content_hash !== content.manifest.content_hash || input.rules_version !== content.manifest.rules_version) return failure('INCOMPATIBLE_CONTENT');
  if (!Number.isSafeInteger(limits.max_events) || limits.max_events < 1) return failure('INVALID_RUN_LIMIT');
  if (input.pending_events.some(event => event.due_ms < input.game_time_ms)) return failure('PAST_CHECKPOINT_EVENT');
  // No partial timestamp is returned after any diagnostic, including budget errors.
  const state = cloneWorkingState(input);
  const events: BattleEvent[] = [];
  let phase = 7, processed = 0;
  const lockedTokens = new Set<string>();
  const emit = (event: Omit<BattleEvent, 'at_ms' | 'phase' | 'sequence'>) => {
    if (++processed > limits.max_events) throw new Error('EVENT_BUDGET_EXCEEDED');
    const source = state.actors.find(actor => actor.actor_id === event.actor_id)?.spatial;
    const target = state.actors.find(actor => actor.actor_id === event.target_id)?.spatial;
    events.push({ ...event, ...(source ? { world_source: [source.x, source.y] as const } : {}), ...(target ? { world_target: [target.x, target.y] as const } : {}), at_ms: state.game_time_ms, phase, sequence: state.event_sequence++ });
    if (!Number.isSafeInteger(state.event_sequence)) throw new RangeError('EVENT_SEQUENCE_OVERFLOW');
  };
  function metric(actor: BattleActor, skill: string, key: keyof MetricRow, amount: number) {
    const skillKey = `${actor.root_owner_actor_id}:${skill}`;
    const skillRow = state.metrics.skills[skillKey] ??= emptyMetrics();
    state.metrics.team[actor.team][key] = checked((state.metrics.team[actor.team][key] ?? 0) + amount);
    state.metrics.actors[actor.actor_id]![key] = checked((state.metrics.actors[actor.actor_id]![key] ?? 0) + amount);
    skillRow[key] = checked((skillRow[key] ?? 0) + amount);
  }
  function finish(kind: NonNullable<BattleCheckpoint['terminal_result']>['kind'], reason: string) {
    state.terminal_result = { kind, reason_key: reason, at_game_ms: state.game_time_ms };
    emit({ type: 'terminal', actor_id: '', detail: reason });
    state.pending_events = [];
    for (const actor of state.actors) if (actor.kind === 'summon') despawn(actor, 'battle_end');
    sweepSummons();
    for (const actor of state.actors) { actor.cast = null; actor.statuses = []; actor.shields = []; actor.normal_clock.due_at = null; actor.phase_ready_at = null; if (actor.spatial) actor.spatial.moving = false; recomputeStats(actor, content); }
  }
  /** Summons leave the battle (expiry, replacement, owner death, battle end); no death triggers or revive. */
  function despawn(actor: BattleActor, reason: string) {
    if (actor.kind !== 'summon' || actor.action_phase === 'dead') return;
    actor.hp = 0; actor.action_phase = 'dead'; actor.statuses = []; actor.shields = []; actor.summon_expires_at = null;
    state.pending_events = state.pending_events.filter(event => event.actor_id !== actor.actor_id);
    emit({ type: 'despawn', actor_id: actor.actor_id, ...(actor.owner_actor_id ? { target_id: actor.owner_actor_id } : {}), detail: reason });
  }
  function sweepSummons() { if (state.actors.some(actor => actor.kind === 'summon' && actor.action_phase === 'dead')) state.actors = state.actors.filter(actor => actor.kind !== 'summon' || actor.action_phase !== 'dead') as BattleCheckpoint['actors']; }
  function summon(effect: SummonEffect, context: ProgramContext) {
    const owner = state.actors.find(actor => actor.actor_id === context.source.origin_actor_id && actor.hp > 0 && actor.kind !== 'summon'); if (!owner) return;
    const definition = (content.documents['summon-actors.json']!.actors as unknown as SummonDefinition[]).find(row => row.id === effect.actor_definition_id);
    if (!definition) throw new Error(`UNKNOWN_SUMMON:${effect.actor_definition_id}`);
    const duration = numeric(effect.duration_ms), tag = `summon:${definition.id}`;
    if (!Number.isSafeInteger(duration) || duration < 1) throw new Error('INVALID_SUMMON_DURATION');
    const owned = state.actors.filter(actor => actor.kind === 'summon' && actor.action_phase !== 'dead' && actor.owner_actor_id === owner.actor_id && actor.tags.includes(tag)).sort((a, b) => (a.summon_expires_at ?? 0) - (b.summon_expires_at ?? 0) || compareId(a.actor_id, b.actor_id));
    if (owned.length >= effect.max_owned) {
      if (effect.at_limit === 'skip') { emit({ type: 'despawn', actor_id: owner.actor_id, skill_id: context.skill_id, detail: 'summon_limit_skip', action_id: context.action_id }); return; }
      for (const old of owned.slice(0, owned.length - effect.max_owned + 1)) despawn(old, 'replaced');
    }
    // Primary stats snapshot the owner's cast-time offense; the listed derived stats scale by derived_scale.
    const snapshot = context.offense, base = { ...snapshot } as CombatStats;
    for (const key of SCALED) base[key] = Math.max(key === 'max_hp' ? 1 : 0, Math.floor(snapshot[key] * definition.derived_scale));
    const id = `summon_${owner.actor_id}_${state.event_sequence}`, blueprint = fixedEnemyBlueprint(owner.stat_blueprint.level, base, 'neutral', content);
    const next = state.game_time_ms + (definition.action.tick_on_spawn ? 0 : definition.action.interval_ms), expires = state.game_time_ms + duration;
    // In arena fights a summon is a fixed point beside its owner (speed 0); it never moves or collides.
    const spatial = owner.spatial && state.arena ? (() => { const index = owned.length % 3, r = 8, x = Math.min(state.arena!.width - r, Math.max(r, owner.spatial!.x + (owner.team === 'player' ? 34 : -34))), y = Math.min(state.arena!.height - r, Math.max(r, owner.spatial!.y + 18 - index * 14));
      return { x, y, previous_x: x, previous_y: y, move_speed: 0, radius: r, normal_range: r, updated_at: state.game_time_ms, moving: false, target_id: null }; })() : undefined;
    const actor: BattleActor = {
      actor_id: id, team: owner.team, kind: 'summon', position: owner.position, ...(spatial ? { spatial } : {}), owner_actor_id: owner.actor_id, root_owner_actor_id: owner.root_owner_actor_id, life_epoch: 0, build_hash: `summon_${definition.id}`,
      targetable: definition.targetable, counts_for_terminal: false, revivable: false, stat_blueprint: blueprint, stats: resolveStats(blueprint, content), hp: 1, sp: 0, spirit_spheres: 0,
      tags: [tag], active_slots: [null, null, null, null], resolved_skills: {}, rotation_cursor: 0, action_phase: 'normal_only', phase_ready_at: null, phase_started_at: state.game_time_ms, phase_duration_ms: 0, phase_speed_snapshot: 100,
      normal_clock: { due_at: null, remaining_ms: definition.action.interval_ms, paused_for_cast: false }, cast: null, statuses: [], shields: [], summon_expires_at: expires,
      action_policy: { kind: 'periodic', interval_ms: definition.action.interval_ms, next_tick_at: next, source: { instance_id: id, owner_actor_id: owner.root_owner_actor_id, definition_id: context.skill_id, origin_actor_id: id, origin_life_epoch: 0 }, selectors: structuredClone(definition.action.selectors), effects: structuredClone(definition.action.effects) },
    };
    recomputeStats(actor, content); actor.hp = actor.stats.max_hp; actor.sp = actor.stats.max_sp;
    state.actors.push(actor); state.metrics.actors[id] = emptyMetrics();
    schedule(state, actor, 'summon_expiry', expires);
    if (next < expires) schedule(state, actor, 'summon_tick', next);
    emit({ type: 'summon', actor_id: id, target_id: owner.actor_id, skill_id: context.skill_id, detail: definition.id, action_id: context.action_id, source_instance_id: context.source.instance_id, effect_id: effect.id });
  }
  function summonTick(actor: BattleActor, at: number) {
    const policy = actor.action_policy as PeriodicPolicy;
    if (policy.next_tick_at !== at) return;
    const context: ProgramContext = { ...pipeline.context(actor, policy.source.definition_id, 'periodic', `tick_${actor.actor_id}_${state.event_sequence++}`), source: structuredClone(policy.source) };
    context.selected = pipeline.bindings(context, policy.selectors); pipeline.program(policy.effects, context);
    policy.next_tick_at = at + policy.interval_ms;
    if (actor.summon_expires_at !== null && policy.next_tick_at < actor.summon_expires_at) schedule(state, actor, 'summon_tick', policy.next_tick_at);
  }
  function terminal() {
    if (state.terminal_result) return;
    const alive = (team: BattleActor['team']) => state.actors.some(actor => actor.team === team && actor.counts_for_terminal && actor.hp > 0);
    if (!alive('player')) finish('defeat', 'player_team_wiped');
    else if (!alive('enemy')) {
      const answer = policy.onEnemyWipe?.(state);
      if (answer && typeof answer === 'object') respawn(answer); else if (answer !== 'continue') finish('victory', 'enemy_team_wiped');
    }
  }
  function commitDeaths() {
    let count = 0;
    for (const actor of sortActors(state)) if (actor.hp <= 0 && actor.action_phase !== 'dead') {
      count++; pipeline.death(actor);
      actor.hp = 0; actor.action_phase = 'dead'; actor.cast = null; actor.phase_ready_at = null; actor.normal_clock.due_at = null;
      if (actor.spatial) actor.spatial.moving = false;
      actor.statuses = []; actor.shields = [];
      emit({ type: 'death', actor_id: actor.actor_id });
      for (const owned of state.actors) if (owned.kind === 'summon' && owned.owner_actor_id === actor.actor_id) despawn(owned, 'owner_dead');
    }
    state.pending_events = state.pending_events.filter(event => { const actor = state.actors.find(row => row.actor_id === event.actor_id); return actor && actor.hp > 0 && actor.life_epoch === event.life_epoch; });
    return count;
  }
  function settleDeaths() { while (commitDeaths()) pipeline.drain(); pipeline.cleanupSources(); }
  const pipeline = new EffectPipeline(state, content, { emit, metric, interrupt, revive, summon });
  function blocked(actor: BattleActor, action: 'skill' | 'normal') {
    return statusRestriction(actor, action === 'skill' ? 'no_new_skill' : 'no_normal_attack', content, state.game_time_ms);
  }
  function targets(actor: BattleActor, skill: ActiveSkill, bindings: CastState['target_bindings'] = {}) {
    return pipeline.bindings(pipeline.context(actor, skill.id, 'skill', 'target_binding'), skill.selectors, bindings);
  }
  function resume(actor: BattleActor, baseAcd: number) {
    actor.cast = null; actor.normal_clock.paused_for_cast = false;
    if (actor.action_policy.kind === 'rotation' && actor.action_policy.normal_attack_enabled) {
      actor.normal_clock.due_at = state.game_time_ms + Math.max(1, actor.normal_clock.remaining_ms);
      schedule(state, actor, 'normal_attack', actor.normal_clock.due_at);
    }
    enterPhase(state, actor, 'after_cast', baseAcd);
  }
  function interrupt(actor: BattleActor, cause?: ProgramContext) {
    const cast = actor.cast;
    if (!cast || !cast.interruptible || lockedTokens.has(cast.token)) return;
    // action_id names the interrupter's root action (its cast token for skills) so presentation can credit it.
    emit({ type: 'cast_interrupt', actor_id: actor.actor_id, skill_id: cast.skill_id, ...(cause ? { action_id: cause.action_id, source_instance_id: cause.source.instance_id, detail: cause.source.origin_actor_id } : {}) }); metric(actor, cast.skill_id, 'casts_interrupted', 1);
    state.pending_events = state.pending_events.filter(event => event.cast_token !== cast.token);
    const skill = cast.resolved_skill; if (skill.kind !== 'active') throw new Error('INVALID_CAST_PROGRAM');
    resume(actor, numeric(skill.timing.after_cast_ms));
  }
  /** Mode continuation (e.g. next daily phase): the same actor returns at full HP with new resolved stats; battle clock, seed and party keep running. */
  function respawn(answer: ModeRespawn) {
    const actor = state.actors.find(row => row.actor_id === answer.actor_id && row.kind !== 'summon'); if (!actor || actor.hp > 0) throw new Error('INVALID_MODE_RESPAWN');
    actor.life_epoch++; actor.cast = null; actor.statuses = []; actor.shields = []; actor.rotation_cursor = 0;
    actor.stat_blueprint = fixedEnemyBlueprint(answer.level, answer.resolved_base, answer.element, content); actor.stats = resolveStats(actor.stat_blueprint, content); recomputeStats(actor, content);
    actor.hp = actor.stats.max_hp; actor.sp = actor.stats.max_sp; actor.action_phase = 'normal_only';
    actor.normal_clock = { due_at: null, remaining_ms: skillIntervalMs(actor.stats.attack_speed, state.timing?.normal_attack_base_ms), paused_for_cast: false };
    state.mode = { ...state.mode, ...structuredClone(answer.mode) };
    enterPhase(state, actor, 'skill_interval');
    if (actor.action_policy.kind === 'rotation' && actor.action_policy.normal_attack_enabled) { actor.normal_clock.due_at = state.game_time_ms + actor.normal_clock.remaining_ms; schedule(state, actor, 'normal_attack', actor.normal_clock.due_at); }
    schedule(state, actor, 'resource_regen', state.game_time_ms + 1000);
    if (actor.spatial) { actor.spatial.moving = false; schedule(state, actor, 'motion_tick', state.game_time_ms + MOTION_STEP_MS); }
    emit({ type: 'revive', actor_id: actor.actor_id, amount: actor.hp, detail: `phase:${state.mode.daily_phase ?? ''}` });
  }
  function revive(actor: BattleActor, hpRatio: number, spRatio: number, cause: Pick<BattleEvent, 'action_id' | 'source_instance_id' | 'effect_id' | 'skill_id' | 'detail'> = {}) {
    if (actor.hp > 0 || !actor.revivable) return;
    actor.life_epoch++; actor.cast = null; actor.statuses = []; actor.shields = []; actor.spirit_spheres = 0; recomputeStats(actor, content);
    actor.hp = Math.max(1, Math.min(actor.stats.max_hp, Math.floor(actor.stats.max_hp * Math.max(0, hpRatio + actor.stats.revive_hp_bonus)))); actor.sp = Math.min(actor.stats.max_sp, Math.floor(actor.stats.max_sp * Math.max(0, spRatio + actor.stats.revive_sp_bonus)));
    actor.normal_clock = { due_at: null, remaining_ms: skillIntervalMs(actor.stats.attack_speed, state.timing?.normal_attack_base_ms), paused_for_cast: false };
    actor.action_phase = 'normal_only'; enterPhase(state, actor, 'skill_interval');
    if (actor.action_policy.kind === 'rotation' && actor.action_policy.normal_attack_enabled) { actor.normal_clock.due_at = state.game_time_ms + actor.normal_clock.remaining_ms; schedule(state, actor, 'normal_attack', actor.normal_clock.due_at); }
    schedule(state, actor, 'resource_regen', state.game_time_ms + 1000);
    if (actor.spatial) { actor.spatial.moving = false; schedule(state, actor, 'motion_tick', state.game_time_ms + MOTION_STEP_MS); }
    emit({ type: 'revive', actor_id: actor.actor_id, amount: actor.hp, ...cause });
  }
  function resolve(actor: BattleActor, cast: CastState, originEpoch = actor.life_epoch) {
    const skill = cast.resolved_skill;
    if (skill.kind !== 'active') throw new Error('INVALID_CAST_PROGRAM');
    const selected = targets(actor, skill, cast.target_bindings);
    emit({ type: 'cast_resolve', actor_id: actor.actor_id, skill_id: skill.id }); metric(actor, skill.id, 'casts_resolved', 1);
    const context = { ...pipeline.context(actor, skill.id, 'skill', cast.token), offense: cast.offense_snapshot, pre_cost_sp: cast.pre_cost.sp, weapon_element: cast.weapon_element_snapshot, selected };
    context.source.origin_life_epoch = originEpoch;
    pipeline.program(skill.effects, context); pipeline.event('cast_resolve', actor, context);
    if (actor.hp > 0 && actor.cast === cast) resume(actor, numeric(skill.timing.after_cast_ms));
  }

  function start(actor: BattleActor) {
    const skill = activeDefinition(actor), cost = skill.cost;
    const requiredSp = typeof cost.sp === 'number' ? fixedSpCost(cost.sp, actor.stats) : 'mode' in cost.sp ? numeric(cost.sp.minimum_sp) : NaN;
    const spheres = numeric(cost.spirit_spheres);
    actor.rotation_cursor = (actor.rotation_cursor + 1) % 4;
    if (actor.sp < requiredSp || actor.spirit_spheres < spheres) {
      const kind = actor.sp < requiredSp ? 'sp_skip' : 'sphere_skip'; emit({ type: kind, actor_id: actor.actor_id, skill_id: skill.id }); metric(actor, skill.id, kind === 'sp_skip' ? 'sp_skips' : 'sphere_skips', 1);
      enterPhase(state, actor, 'skill_interval'); return;
    }
    if (!Number.isFinite(requiredSp)) throw new Error('UNRESOLVED_SKILL_COST');
    const index = actor.active_slots.indexOf(skill.id), pre = { sp: actor.sp, spirit_spheres: actor.spirit_spheres };
    const spent = typeof cost.sp === 'number' ? requiredSp : pre.sp;
    actor.sp -= spent; actor.spirit_spheres -= spheres;
    // D-092: the offensive snapshot sees only spheres still held after paying the cast cost.
    if (spheres) recomputeStats(actor, content);
    metric(actor, skill.id, 'sp_spent', spent); metric(actor, skill.id, 'casts_started', 1);
    const duration = castDurationMs(numeric(skill.timing.cast_ms), actor.stats.cast_speed);
    actor.normal_clock.remaining_ms = actor.normal_clock.due_at === null ? skillIntervalMs(actor.stats.attack_speed, state.timing?.normal_attack_base_ms) : Math.max(0, actor.normal_clock.due_at - state.game_time_ms);
    actor.normal_clock.due_at = null; actor.normal_clock.paused_for_cast = true;
    const cast: CastState = { token: `cast_${actor.actor_id}_${actor.life_epoch}_${state.event_sequence}`, skill_id: skill.id, skill_level: actor.resolved_skills[skill.id]!.level, used_slot_index: index,
      started_at: state.game_time_ms, ends_at: state.game_time_ms + duration, interruptible: skill.timing.interruptible, pre_cost: pre, offense_snapshot: structuredClone(actor.stats), resolved_skill: skill,
      target_bindings: {}, weapon_element_snapshot: weaponElement(actor, content) };
    // Resolve only cast-start bindings now; other selectors must not consume RNG early.
    const initial = targets(actor, { ...skill, selectors: Object.fromEntries(Object.entries(skill.selectors).filter(([, selector]) => selector.phase === 'cast_start')) });
    for (const [key, selector] of Object.entries(skill.selectors)) if (selector.phase === 'cast_start') cast.target_bindings[key] = (initial[key] ?? []).map(row => row.actor_id);
    actor.cast = cast; actor.action_phase = 'casting'; actor.phase_started_at = state.game_time_ms; actor.phase_duration_ms = duration; actor.phase_speed_snapshot = actor.stats.cast_speed; actor.phase_ready_at = cast.ends_at;
    if (actor.spatial) actor.spatial.moving = false;
    emit({ type: 'cast_start', actor_id: actor.actor_id, skill_id: skill.id, amount: spent, cast_duration_ms: duration, action_id: cast.token });
    const context = { ...pipeline.context(actor, skill.id, 'skill', cast.token), offense: cast.offense_snapshot, pre_cost_sp: cast.pre_cost.sp, weapon_element: cast.weapon_element_snapshot, selected: initial };
    pipeline.program(skill.start_effects, context); pipeline.event('cast_start', actor, context);
    if (actor.cast === cast) { if (duration === 0) resolve(actor, cast); else schedule(state, actor, 'cast_complete', cast.ends_at, cast.token); }
  }
  function accrue(to: number) {
    const delta = to - state.game_time_ms;
    for (const actor of state.actors) if (actor.hp > 0) {
      const row = state.metrics.actors[actor.actor_id]!, team = state.metrics.team[actor.team];
      row.alive_time_ms += delta; team.alive_time_ms += delta;
      let key: keyof MetricRow | null = actor.action_phase === 'casting' ? 'cast_time_ms' : actor.action_phase === 'skill_interval' ? 'skill_interval_ms' : actor.action_phase === 'after_cast' ? 'after_cast_time_ms' : null;
      if (actor.phase_ready_at !== null && actor.phase_ready_at <= state.game_time_ms && blocked(actor, 'skill')) key = 'control_wait_ms';
      if (key) { row[key] += delta; team[key] += delta; }
      const cc = actor.statuses.filter(instance => statusDefinition(content, instance.status_id).tags.includes('hard_cc'));
      if (cc.length) { row.cc_blocked_actor_ms += delta; team.cc_blocked_actor_ms += delta; }
      for (const instance of cc) { const origin = state.actors.find(value => value.actor_id === instance.source.owner_actor_id); if (origin) metric(origin, instance.source.definition_id, 'cc_instance_ms', delta); }
    }
    state.game_time_ms = to;
  }
  try {
    while (!state.terminal_result && (state.game_time_ms < toGameMs || state.pending_events.some(event => event.due_ms === state.game_time_ms))) {
      state.pending_events.sort(compareTimer);
      const nextTime = Math.min(toGameMs, state.mode.time_limit_ms, state.pending_events[0]?.due_ms ?? toGameMs);
      accrue(nextTime);
      if (nextTime >= state.mode.time_limit_ms) { finish('time_limit', 'battle_time_limit'); break; }
      const due = state.pending_events.filter(event => event.due_ms === nextTime);
      processed += due.length + 1;
      if (processed > limits.max_events) throw new Error('EVENT_BUDGET_EXCEEDED');
      processed += due.length;
      if (processed > limits.max_events) throw new Error('EVENT_BUDGET_EXCEEDED');
      state.pending_events = state.pending_events.filter(event => event.due_ms !== nextTime);
      phase = 0;
      pipeline.expire();
      phase = 1;
      for (const event of due) if (event.kind === 'resource_regen') {
        const actor = state.actors.find(row => row.actor_id === event.actor_id);
        if (!actor || actor.hp <= 0 || actor.life_epoch !== event.life_epoch) continue;
        const gain = spRegen(actor.stats), restored = Math.min(gain, actor.stats.max_sp - actor.sp);
        actor.sp += restored; actor.hp = Math.min(actor.stats.max_hp, actor.hp + hpRegen(actor.stats));
        metric(actor, 'resource_regen', 'sp_restored', restored); metric(actor, 'resource_regen', 'sp_wasted', gain - restored);
        schedule(state, actor, 'resource_regen', nextTime + 1000);
      }
      for (const event of due) {
        const actor = state.actors.find(row => row.actor_id === event.actor_id);
        if (!actor || actor.hp <= 0 || actor.life_epoch !== event.life_epoch) continue;
        if (event.kind === 'battle_start') pipeline.event('battle_start', actor, pipeline.context(actor, 'battle_start', 'system', event.event_id));
        if (event.kind === 'summon_expiry') { despawn(actor, 'expired'); continue; }
        if (event.kind === 'summon_tick' && actor.kind === 'summon') summonTick(actor, nextTime);
        if (event.kind === 'status_tick') { const instance = actor.statuses.find(value => value.instance_id === event.source_instance_id && value.next_tick_at === nextTime); if (instance) pipeline.tick(actor, instance); }
      }
      pipeline.drain(); settleDeaths();
      phase = 2;
      const locked = sortActors(state).filter(actor => actor.hp > 0 && actor.cast?.ends_at === nextTime && due.some(event => event.kind === 'cast_complete' && event.actor_id === actor.actor_id && event.cast_token === actor.cast?.token && event.life_epoch === actor.life_epoch)).map(actor => ({ actor, cast: actor.cast!, epoch: actor.life_epoch }));
      lockedTokens.clear(); for (const { cast } of locked) lockedTokens.add(cast.token);
      phase = 3;
      for (const { actor, cast, epoch } of locked) resolve(actor, cast, epoch);
      lockedTokens.clear();
      phase = 4; pipeline.drain(); settleDeaths(); terminal(); if (state.terminal_result) break;
      const movementDue = due.filter(event => event.kind === 'motion_tick' && state.actors.some(actor => actor.actor_id === event.actor_id && actor.hp > 0 && actor.life_epoch === event.life_epoch));
      if (movementDue.length) {
        moveActors(state, content, new Set(movementDue.map(event => event.actor_id)));
        for (const event of movementDue) { const actor = state.actors.find(row => row.actor_id === event.actor_id)!; schedule(state, actor, 'motion_tick', nextTime + MOTION_STEP_MS); }
      }
      phase = 5;
      for (const actor of sortActors(state)) {
        if (actor.hp <= 0) continue;
        if (actor.action_phase === 'after_cast' && actor.phase_ready_at !== null && actor.phase_ready_at <= nextTime) enterPhase(state, actor, 'skill_interval');
        if (actor.action_phase === 'skill_interval' && actor.phase_ready_at !== null && actor.phase_ready_at <= nextTime && !blocked(actor, 'skill')) start(actor);
      }
      phase = 6;
      for (const actor of sortActors(state)) if (actor.hp > 0 && actor.action_phase !== 'casting' && actor.action_phase !== 'dead' && actor.normal_clock.due_at !== null && actor.normal_clock.due_at <= nextTime && !blocked(actor, 'normal')) {
        const normalHit: Extract<Effect, { type: 'damage' }> = { id: 'hit', type: 'damage', target: 'foe', damage_type: 'physical', formula: { id: 'physical_power', params: { attack_ratio: 1, flat_power: 0 } }, element: 'weapon', hit_rule: 'physical_roll', can_crit: true, hits: 1, armor_rule: 'normal' };
        const target = normalTarget(actor, state.actors);
        // Readiness is retained while approaching. Arrival allows one hit, never a catch-up burst.
        if (target && !inNormalRange(actor, target)) continue;
        if (target) { emit({ type: 'normal_attack', actor_id: actor.actor_id, target_id: target.actor_id }); metric(actor, 'normal_attack', 'normal_attacks', 1); const context = pipeline.context(actor, 'normal_attack', 'normal', `normal_${actor.actor_id}_${state.event_sequence}`); context.selected = { foe: [target] }; pipeline.program([normalHit], context); }
        actor.normal_clock.remaining_ms = skillIntervalMs(actor.stats.attack_speed, state.timing?.normal_attack_base_ms); actor.normal_clock.due_at = nextTime + actor.normal_clock.remaining_ms; schedule(state, actor, 'normal_attack', actor.normal_clock.due_at);
      }
      phase = 7; pipeline.drain(); settleDeaths(); terminal(); sweepSummons();
      if (nextTime === toGameMs) break;
    }
    state.phase = 7; state.checkpoint_barrier = true; state.pending_events.sort(compareTimer);
    return { ok: true, value: { state: freeze(state), events } };
  } catch (error) { return failure(String(error)); }
}
