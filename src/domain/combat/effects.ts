import type { BattleActor, BattleCheckpoint, Effect, MetricRow, Selector, Trigger } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import type { ObjectValue } from '../../content/value.ts';
import { checked, clampProbability, critChance, damageForHit, hitChance, rawPower } from '../math/index.ts';
import { elementalResistance, statusResistance } from '../math/combat-modifiers.ts';
import type { BattleEvent } from './model.ts';
import { bindStatusParams, evaluatePredicate, resolvedNumber, selectTargets } from './program.ts';
import type { DamageEffect, ProgramContext } from './program.ts';
import { nextRandom } from './rng.ts';
import { compareId, schedule } from './scheduler.ts';
import { recomputeStats, sourceAlive, statusDefinition, weaponElement } from './status.ts';
import type { StatusInstance } from './status.ts';
import { allowsMagicalCritical, echoMultiplier, nextDamageCharge } from './action-bonuses.ts';
import { conditionalCombatBonuses } from './conditional-bonuses.ts';

export interface EffectPorts {
  emit(event: Omit<BattleEvent, 'at_ms' | 'phase' | 'sequence'>): void;
  metric(actor: BattleActor, skill: string, key: keyof MetricRow, amount: number): void;
  interrupt(actor: BattleActor, cause?: ProgramContext): void;
  revive(actor: BattleActor, hpRatio: number, spRatio: number, cause?: Pick<BattleEvent, 'action_id' | 'source_instance_id' | 'effect_id' | 'skill_id' | 'detail'>): void;
  summon?(effect: Extract<Effect, { type: 'summon' }>, context: ProgramContext): void;
}
interface Reaction { context: ProgramContext; trigger: Trigger; key: string }
export class EffectPipeline {
  private readonly queue: Reaction[] = [];
  private readonly rootCounts = new Map<string, number>();
  private readonly killingCauses = new Map<string, ProgramContext>();
  constructor(private readonly state: BattleCheckpoint, private readonly content: ValidatedContent, private readonly ports: EffectPorts) {}
  private actor(id: string) { return this.state.actors.find(actor => actor.actor_id === id); }
  private uid(prefix: string) { const id = `${prefix}_${this.state.event_sequence++}`; if (!Number.isSafeInteger(this.state.event_sequence)) throw new RangeError('EVENT_SEQUENCE_OVERFLOW'); return id; }
  private metric(context: ProgramContext, key: keyof MetricRow, amount: number) {
    this.ports.metric(this.actor(context.source.owner_actor_id) ?? context.self, context.skill_id, key, amount);
  }
  /** Parent action/source and effect of an emitted effect event (presentation, metrics and replay attribution). */
  private attribution(context: ProgramContext, effect: { id: string }) { return { action_id: context.action_id, source_instance_id: context.source.instance_id, effect_id: effect.id }; }
  context(self: BattleActor, skill: string, origin: ProgramContext['origin'], actionId: string): ProgramContext {
    return { self, skill_id: skill, origin, action_id: actionId, ancestry: [], selected: {}, outcomes: [], offense: self.stats, weapon_element: weaponElement(self, this.content), pre_cost_sp: self.sp,allow_magical_crit:allowsMagicalCritical(self,this.content,this.state.game_time_ms),
      source: { instance_id: actionId, owner_actor_id: self.root_owner_actor_id, definition_id: skill, origin_actor_id: self.actor_id, origin_life_epoch: self.life_epoch } };
  }
  bindings(context: ProgramContext, selectors: Record<string, Selector>, locked: Record<string, string[]> = {}): Record<string, BattleActor[]> {
    const origin = this.actor(context.source.origin_actor_id);
    const result: Record<string, BattleActor[]> = { self: [context.self], source_actor: origin ? [origin] : [], event_source: context.event_source ? [context.event_source] : [], event_target: context.event_target ? [context.event_target] : [] };
    for (const [id, selector] of Object.entries(selectors)) result[id] = selectTargets(context.self, selector, this.state.actors, () => nextRandom(this.state.rng), locked[id]);
    return result;
  }
  event(event: Trigger['event'], carrier: BattleActor, cause: ProgramContext, target?: BattleActor, hpDamage = 0, sourceOverride?: BattleActor | null): void {
    const sources = [...carrier.stat_blueprint.permanent_sources.map(value => ({ source: value.source, triggers: value.triggers })), ...carrier.statuses.map(instance => ({ source: { ...instance.source, instance_id: instance.instance_id }, triggers: bindStatusParams(statusDefinition(this.content, instance.status_id).triggers, instance.params) }))];
    sources.sort((a, b) => compareId(a.source.instance_id, b.source.instance_id));
    for (const source of sources) for (const trigger of source.triggers.slice().sort((a, b) => compareId(a.id, b.id))) {
      if (trigger.event !== event || !trigger.accepted_origins.includes(cause.origin)) continue;
      if (trigger.accepted_damage_types && (!cause.damage_type || !trigger.accepted_damage_types.includes(cause.damage_type))) continue;
      const key = JSON.stringify([source.source.instance_id, trigger.id]);
      const context: ProgramContext = { ...this.context(carrier, source.source.definition_id, 'proc', cause.action_id), source: source.source, ancestry: cause.ancestry, event_source: event === 'battle_start' ? undefined : sourceOverride === null ? undefined : sourceOverride ?? this.actor(cause.source.origin_actor_id), event_target: target, event_damage: hpDamage };
      this.queue.push({ context, trigger, key });
    }
  }
  drain(): void {
    let count = 0;
    while (this.queue.length) {
      if (++count > 1000000) throw new Error('PROC_EVENT_BUDGET_EXCEEDED');
      const { context, trigger, key } = this.queue.shift()!;
      if (context.self.action_phase === 'dead' && trigger.event !== 'actor_death') continue;
      if (context.ancestry.includes(key)) { this.ports.emit({ type: 'proc_rejected', actor_id: context.self.actor_id, detail: key }); continue; }
      if (context.ancestry.length >= 32) throw new Error('PROC_DEPTH_EXCEEDED');
      if (trigger.when && !evaluatePredicate(trigger.when, { ...context, target: context.event_target })) continue;
      const scopedKey = trigger.limit_scope === 'per_battle' ? key : JSON.stringify([context.action_id, key]);
      const previous = trigger.limit_scope === 'per_battle' ? this.state.trigger_activations[scopedKey] ?? 0 : this.rootCounts.get(scopedKey) ?? 0;
      if (trigger.limit_scope !== 'none' && previous >= trigger.limit_count) continue;
      context.selected = this.bindings(context, trigger.selectors);
      if (!trigger.effects.some(effect => (context.selected[effect.target] ?? []).some(actor => effect.type === 'revive' ? actor.hp <= 0 : actor.hp > 0))) continue;
      if (nextRandom(this.state.rng) >= clampProbability(resolvedNumber(trigger.chance))) continue;
      if (trigger.limit_scope === 'per_battle') this.state.trigger_activations[scopedKey] = checked(previous + 1);
      else if (trigger.limit_scope === 'per_root_action') this.rootCounts.set(scopedKey, previous + 1);
      context.ancestry = [...context.ancestry, key];
      this.ports.emit({ type: 'proc', actor_id: context.self.actor_id, skill_id: context.skill_id, detail: trigger.id });
      this.program(trigger.effects, context);
    }
    this.rootCounts.clear();
  }
  program(effects: readonly Effect[], context: ProgramContext): void {
    for (const effect of effects) for (const target of context.selected[effect.target] ?? []) {
      if (effect.type === 'revive' ? target.hp > 0 || !target.revivable : target.hp <= 0) continue;
      if (effect.when && !evaluatePredicate(effect.when, { ...context, target })) continue;
      switch (effect.type) {
        case 'damage': this.prepareAction(context);this.damage(effect, context, target); break;
        case 'sacrifice_damage': {
          this.prepareAction(context);
          const powers=context.sacrifice_power??={};
          if(powers[effect.id]===undefined){
            const before=context.self.hp,retained=Math.max(1,Math.floor(context.self.stats.max_hp*effect.retain_hp_ratio));
            context.self.hp=Math.min(before,retained);
            const lost=before-context.self.hp;
            powers[effect.id]=checked(this.power(effect.formula,context)*(1+lost/context.self.stats.max_hp*resolvedNumber(effect.hp_loss_scaling)));
            this.ports.emit({type:'resource_change',actor_id:context.self.actor_id,target_id:context.self.actor_id,skill_id:context.skill_id,amount:-lost,detail:'hp_sacrifice',...this.attribution(context,effect)});
          }
          this.damage({...effect,type:'damage',formula:{id:'flat_power',params:{amount:powers[effect.id]!}}},context,target);break;
        }
        case 'heal': {
          const amount = Math.floor(checked(this.power(effect.formula, context) * Math.max(0, 1 + context.offense.outgoing_healing_bonus) * Math.max(0, 1 + target.stats.healing_received_bonus)) + 1e-9);
          const effective = Math.min(target.stats.max_hp - target.hp, amount); target.hp += effective;
          this.metric(context, 'effective_heal', effective); this.metric(context, 'overheal', amount - effective);
          this.ports.emit({ type: 'heal', actor_id: context.self.actor_id, target_id: target.actor_id, skill_id: context.skill_id, amount: effective, detail: `overheal:${amount - effective}`, ...this.attribution(context, effect) }); break;
        }
        case 'apply_status': this.applyStatus(effect, context, target); break;
        case 'shield': {
          const amount = Math.floor(this.power(effect.formula, context));
          const duration = resolvedNumber(effect.duration_ms); if (!Number.isSafeInteger(duration) || duration < 1) throw new Error('INVALID_STATUS_DURATION');
          const shield = { instance_id: this.uid('shield'), source: structuredClone(context.source), carrier_actor_id: target.actor_id, expires_at: checked(this.state.game_time_ms + duration), remaining: amount, dispelable: effect.dispelable };
          target.shields.push(shield); schedule(this.state, target, 'shield_expiry', shield.expires_at, null, shield.instance_id);
          this.metric(context, 'shield_created', amount); this.ports.emit({ type: 'shield', actor_id: context.self.actor_id, target_id: target.actor_id, skill_id: context.skill_id, amount, detail: shield.instance_id, ...this.attribution(context, effect) }); break;
        }
        case 'resource_change': {
          const amount = resolvedNumber(effect.amount), before = target[effect.resource];
          target[effect.resource] = Math.floor(Math.max(0, Math.min(effect.resource === 'sp' ? target.stats.max_sp : 5, before + amount)));
          if (target[effect.resource] !== before) recomputeStats(target, this.content);
          if (amount > 0) { this.metric(context, effect.resource === 'sp' ? 'sp_restored' : 'sphere_gained', target[effect.resource] - before); this.metric(context, effect.resource === 'sp' ? 'sp_wasted' : 'sphere_wasted', amount - (target[effect.resource] - before)); }
          this.ports.emit({ type: 'resource_change', actor_id: context.self.actor_id, target_id: target.actor_id, skill_id: context.skill_id, amount: target[effect.resource] - before, detail: effect.resource, ...this.attribution(context, effect) }); break;
        }
        case 'remove_status': this.removeStatus(effect, context, target); break;
        case 'interrupt': {
          const token = target.cast?.token;
          const resistance = clampProbability(target.stats.interrupt_resistance);
          if (resistance <= 0 || nextRandom(this.state.rng) >= resistance) this.ports.interrupt(target, context);
          if (token && target.cast?.token !== token) (context.successes ??= []).push({ effect_id: effect.id, target_id: target.actor_id });
          break;
        }
        case 'revive': this.ports.revive(target, resolvedNumber(effect.hp_ratio), resolvedNumber(effect.sp_ratio), { ...this.attribution(context, effect), skill_id: context.skill_id, detail: context.source.origin_actor_id }); break;
        case 'summon': if (!this.ports.summon) throw new Error('MISSING_ACTOR_FACTORY:summon'); else this.ports.summon(effect, context); break;
        case 'handler': {
          if (effect.handler_id !== 'detonate_own_status') throw new Error('UNKNOWN_EFFECT_HANDLER');
          const matches = target.statuses.filter(instance => instance.status_id === effect.params.status_id && instance.source.origin_actor_id === context.self.actor_id).sort((a, b) => a.expires_at - b.expires_at || compareId(a.instance_id, b.instance_id)).slice(0, effect.params.max_consumed ?? undefined);
          const ids = new Set(matches.map(instance => instance.instance_id)); target.statuses = target.statuses.filter(instance => !ids.has(instance.instance_id)); recomputeStats(target, this.content);
          const perInstance = resolvedNumber(effect.params.power_per_instance) + (effect.params.attack_ratio_per_instance === undefined ? 0 : resolvedNumber(effect.params.attack_ratio_per_instance) * context.offense.physical_attack);
          this.damage({ id: effect.id, type: 'damage', target: effect.target, formula: { id: 'flat_power', params: { amount: checked(matches.length * perInstance) } }, damage_type: effect.params.damage_type, element: effect.params.element, hit_rule: 'always', can_crit: false, hits: 1, armor_rule: 'normal' }, context, target); break;
        }
        default: throw new Error(`UNKNOWN_EFFECT:${String((effect as { type: unknown }).type)}`);
      }
    }
  }
  private prepareAction(context:ProgramContext):void{
    if(context.action_prepared)return;context.action_prepared=true;
    if(context.origin!=='skill')return;
    context.echo_multiplier=echoMultiplier(context.self,context.skill_id,this.content,this.state.game_time_ms,()=>nextRandom(this.state.rng));
    const charge=nextDamageCharge(context.self,this.content,this.state.game_time_ms);
    if(charge){
      context.self.statuses=context.self.statuses.filter(s=>s.instance_id!==charge.instance.instance_id);recomputeStats(context.self,this.content);
      context.armor_override=charge.profile.armor_rule;
      context.offense={...context.offense,crit_damage_bonus:context.offense.crit_damage_bonus+resolvedNumber(charge.profile.crit_damage_bonus)};
      this.ports.emit({type:'status_removed',actor_id:context.self.actor_id,target_id:context.self.actor_id,skill_id:context.skill_id,detail:charge.instance.instance_id,action_id:context.action_id,source_instance_id:charge.instance.source.instance_id});
    }
  }
  private power(formula: { id: string; params: unknown }, context: ProgramContext) { return rawPower(formula as { id: string; params: ObjectValue }, context.offense, context.pre_cost_sp, context.event_damage); }
  private damage(effect: DamageEffect, context: ProgramContext, target: BattleActor): void {
    context = { ...context, damage_type: effect.damage_type };
    // Per-effect bonuses never mutate the actor, its cast snapshot or the next hit program.
    let offense = effect.crit_chance_bonus || effect.crit_damage_bonus || effect.penetration_bonus ? { ...context.offense,
      crit_chance_bonus: context.offense.crit_chance_bonus + (effect.crit_chance_bonus === undefined ? 0 : resolvedNumber(effect.crit_chance_bonus)),
      crit_damage_bonus: context.offense.crit_damage_bonus + (effect.crit_damage_bonus === undefined ? 0 : resolvedNumber(effect.crit_damage_bonus)),
      penetration_percent: context.offense.penetration_percent + (effect.penetration_bonus === undefined ? 0 : resolvedNumber(effect.penetration_bonus)) } : context.offense;
    const bonus=conditionalCombatBonuses(context.self.stat_blueprint.permanent_sources,effect.damage_type,context.origin,context.skill_id);
    if(bonus.damage||bonus.penetration){
      const lane=effect.damage_type==='magical'?'outgoing_magical_bonus':effect.damage_type==='physical'?'outgoing_physical_bonus':'outgoing_true_bonus';
      offense={...offense,[lane]:checked(offense[lane]+bonus.damage),penetration_percent:checked(offense.penetration_percent+bonus.penetration)};
    }
    const raw = this.power(effect.formula, context);
    const hits=checked(effect.hits*(context.echo_multiplier??1));
    for (let hit = 0; hit < hits && target.hp > 0; hit++) {
      const landed = nextRandom(this.state.rng) < (effect.hit_rule === 'always' ? 1 : hitChance(context.offense, target.stats));
      context.outcomes.push({ effect_id: effect.id, target_id: target.actor_id, hit_index: hit, landed });
      if (!landed) { this.ports.emit({ type: 'miss', actor_id: context.self.actor_id, target_id: target.actor_id, skill_id: context.skill_id }); continue; }
      const critical = (effect.can_crit||effect.damage_type==='magical'&&context.allow_magical_crit===true) && (effect.critical_rule === 'always' || nextRandom(this.state.rng) < critChance(offense, target.stats));
      const element = effect.element === 'weapon' ? context.weapon_element : effect.element;
      const defense = target.stat_blueprint.permanent_sources.filter(source => source.defense_element).at(-1)?.defense_element ?? target.tags.find(tag => tag.startsWith('element:'))?.slice(8) ?? 'neutral';
      const chart = this.content.documents['combat-rules.json']!.element_chart as unknown as { values?: Record<string, Record<string, number>>; matrix?: Record<string, Record<string, number>> };
      const multiplier = (chart.values ?? chart.matrix ?? chart as Record<string, Record<string, number>>)[element]?.[defense];
      if (typeof multiplier !== 'number') throw new Error(`UNKNOWN_ELEMENT:${element}:${defense}`);
      const resistance = effect.damage_type === 'true' ? 1 : Math.max(0, 1 - elementalResistance(element, target.stats)) * (effect.damage_type === 'magical' ? Math.max(0, 1 - target.stats.magical_guard_percent) : 1);
      // A skill keeps its definition id through passives/DoT/summons. Item/card procs have item ids.
      const action = context.origin === 'normal' ? 'normal' : Object.hasOwn(this.content.skills, context.skill_id) ? 'skill' : 'other';
      const mitigated = damageForHit(context.armor_override?{...effect,armor_rule:context.armor_override}:effect, raw, offense, target.stats, multiplier * resistance, critical, action);
      this.metric(context, 'raw_damage', raw);
      const links = target.statuses.map(instance => ({ instance, ratio: statusDefinition(this.content, instance.status_id).damage_redirect ? resolvedNumber(bindStatusParams(statusDefinition(this.content, instance.status_id).damage_redirect!.ratio, instance.params)) : 0, recipient: this.actor(instance.source.origin_actor_id) }))
        .filter(link => link.ratio > 0 && link.recipient && link.recipient !== target && link.recipient.team === target.team && sourceAlive(link.instance.source, this.state.actors))
        .sort((a, b) => compareId(a.instance.instance_id, b.instance.instance_id));
      const sum = links.reduce((value, link) => checked(value + link.ratio), 0);
      const redirected = Math.min(mitigated, Math.floor(checked(mitigated * sum)));
      const shares = links.map(link => Math.floor(redirected * link.ratio / sum));
      let remainder = redirected - shares.reduce((total, value) => total + value, 0);
      for (let index = 0; remainder > 0; index++, remainder--) shares[index % shares.length]!++;
      for (let index = 0; index < links.length; index++) if (shares[index]! > 0) {
        const link = links[index]!;
        this.payDamage(link.recipient!, shares[index]!, raw, effect, { ...context, origin: 'transfer' }, hit, critical, link.instance.instance_id);
      }
      const cause = effect.as_reflect ? { ...context, origin: 'reflect' as const } : context;
      const loss = this.payDamage(target, mitigated - redirected, raw, effect, cause, hit, critical);
      if (context.origin === 'normal') this.event('normal_attack_hit', context.self, cause, target, loss);
    }
  }
  private payDamage(target: BattleActor, amount: number, raw: number, effect: DamageEffect, context: ProgramContext, hitIndex: number, critical: boolean, redirectSource?: string): number {
    let remaining = amount, absorbed = 0;
    target.shields.sort((a, b) => a.expires_at - b.expires_at || compareId(a.instance_id, b.instance_id));
    for (const shield of target.shields) if (shield.expires_at > this.state.game_time_ms) {
      const spent = Math.min(remaining, shield.remaining); shield.remaining -= spent; remaining -= spent; absorbed += spent;
      const owner = this.actor(shield.source.owner_actor_id); if (owner) this.ports.metric(owner, shield.source.definition_id, 'shield_absorbed', spent);
    }
    target.shields = target.shields.filter(shield => shield.remaining > 0);
    const loss = Math.min(target.hp, remaining); target.hp -= loss;
    // Incoming damage belongs to the recipient, independently of the shield's provider.
    for (const row of [this.state.metrics.actors[target.actor_id]!, this.state.metrics.team[target.team]]) {
      row.damage_received = checked((row.damage_received ?? 0) + loss);
      row.shield_damage_received = checked((row.shield_damage_received ?? 0) + absorbed);
    }
    if (target.hp <= 0) this.killingCauses.set(target.actor_id, context);
    this.metric(context, 'hp_damage', loss); this.metric(context, 'absorbed', absorbed); this.metric(context, 'overkill', remaining - loss);
    this.ports.emit({ type: 'damage', actor_id: context.source.origin_actor_id, target_id: target.actor_id, skill_id: context.skill_id, amount: loss, detail: critical ? 'critical' : 'normal', action_id: context.action_id, source_instance_id: context.source.instance_id, effect_id: effect.id, hit_index: hitIndex, raw, mitigated: amount, absorbed, origin: context.origin, ...(redirectSource ? { redirect_source_instance_id: redirectSource } : {}) });
    if (loss > 0) {
      const count = target.statuses.length; target.statuses = target.statuses.filter(instance => !statusDefinition(this.content, instance.status_id).remove_on_hp_damage); if (target.statuses.length !== count) recomputeStats(target, this.content);
      this.event('damage_dealt', this.actor(context.source.origin_actor_id) ?? context.self, context, target, loss); this.event('damage_received', target, context, target, loss);
    }
    return loss;
  }

  private applyStatus(effect: Extract<Effect, { type: 'apply_status' }>, context: ProgramContext, target: BattleActor): void {
    const definition = statusDefinition(this.content, effect.status_id), control = definition.tags.includes('hard_cc');
    const controlRoll = definition.restrictions.length > 0;
    const duration = resolvedNumber(effect.duration_ms); if (!Number.isSafeInteger(duration) || duration < 1) throw new Error('INVALID_STATUS_DURATION');
    const chance = clampProbability(resolvedNumber(effect.chance) + (controlRoll ? context.offense.control_accuracy - target.stats.control_resistance : 0) - statusResistance(effect.status_id, target.stats));
    if (nextRandom(this.state.rng) >= chance) {
      if (control) this.metric(context, 'cc_resisted', 1);
      this.ports.emit({ type: 'status_resisted', actor_id: context.self.actor_id, target_id: target.actor_id, skill_id: context.skill_id, detail: effect.status_id, ...this.attribution(context, effect) }); return;
    }
    const params = Object.fromEntries(Object.entries(effect.params).map(([key, value]) => [key, resolvedNumber(value)]));
    for(const [key,formula]of Object.entries(effect.parameter_formulas??{})){
      if(!Object.hasOwn(params,key))throw new Error('INVALID_STATUS_PARAMETER_FORMULA');
      params[key]=this.power(formula,context);
    }
    if (Object.keys(params).some(key => !Object.hasOwn(definition.parameter_schema.properties, key)) || definition.parameter_schema.required.some(key => !Object.hasOwn(params, key))) throw new Error('INVALID_STATUS_PARAMS');
    for (const [key, value] of Object.entries(params)) { const rule = definition.parameter_schema.properties[key]!; if (rule.minimum !== undefined && value < rule.minimum || rule.maximum !== undefined && value > rule.maximum) throw new Error('INVALID_STATUS_PARAMS'); }
    const instance: StatusInstance = { instance_id: this.uid('status'), status_id: effect.status_id, source: structuredClone(context.source), carrier_actor_id: target.actor_id, applied_at: this.state.game_time_ms, expires_at: checked(this.state.game_time_ms + duration), params,
      offense_snapshot: structuredClone(context.offense), weapon_element_snapshot: context.weapon_element, next_tick_at: definition.periodic ? this.state.game_time_ms + definition.periodic.interval_ms : null };
    if(context.allow_magical_crit)instance.allow_magical_crit=true;
    target.statuses.push(instance); recomputeStats(target, this.content);
    schedule(this.state, target, 'status_expiry', instance.expires_at, null, instance.instance_id);
    if (instance.next_tick_at !== null && instance.next_tick_at < instance.expires_at) schedule(this.state, target, 'status_tick', instance.next_tick_at, null, instance.instance_id);
    this.ports.emit({ type: 'status_applied', actor_id: context.self.actor_id, target_id: target.actor_id, skill_id: context.skill_id, detail: `${effect.status_id}:${instance.instance_id}`, ...this.attribution(context, effect), status_change: { instance_id: instance.instance_id, status_id: instance.status_id, params: { ...instance.params }, applied_at: instance.applied_at, expires_at: instance.expires_at, control_resistance_after: target.stats.control_resistance, active_instances_after: target.statuses.filter(value => value.status_id === instance.status_id).length } });
    this.event('status_applied', target, context, target);
    if (control) { this.metric(context, 'cc_applied', 1); this.event('control_applied', target, context, target); }
    if (definition.restrictions.includes('interrupt_interruptible_cast')) this.ports.interrupt(target, context);
    if (definition.periodic?.tick_on_apply) this.tick(target, instance, false);
  }
  private removeStatus(effect: Extract<Effect, { type: 'remove_status' }>, context: ProgramContext, target: BattleActor): void {
    const candidates = target.statuses.filter(instance => {
      const definition = statusDefinition(this.content, instance.status_id);
      return (effect.polarity === 'any' || effect.polarity === definition.polarity) && (!effect.tags.length || effect.tags.some(tag => definition.tags.includes(tag))) && (effect.permission === 'consume_own' ? instance.source.origin_actor_id === context.self.actor_id : effect.permission === 'cleanse' ? definition.cleanseable : definition.dispelable);
    }).map(instance => ({ ...instance, shield: false }));
    const shields = effect.permission === 'dispel' && effect.polarity !== 'debuff' && (!effect.tags.length || effect.tags.includes('shield')) ? target.shields.filter(shield => shield.dispelable).map(shield => ({ ...shield, shield: true })) : [];
    const selected = [...candidates, ...shields].sort((a, b) => a.expires_at - b.expires_at || compareId(a.instance_id, b.instance_id)).slice(0, effect.max_instances === null ? undefined : resolvedNumber(effect.max_instances));
    const ids = new Set(selected.map(instance => instance.instance_id)); target.statuses = target.statuses.filter(instance => !ids.has(instance.instance_id)); target.shields = target.shields.filter(instance => !ids.has(instance.instance_id)); recomputeStats(target, this.content);
    this.ports.emit({ type: 'status_removed', actor_id: context.self.actor_id, target_id: target.actor_id, skill_id: context.skill_id, detail: selected.map(instance => instance.instance_id).join(','), ...this.attribution(context, effect) });
  }
  expire(): void {
    for (const actor of this.state.actors) {
      const expired = actor.statuses.filter(instance => instance.expires_at <= this.state.game_time_ms);
      actor.statuses = actor.statuses.filter(instance => instance.expires_at > this.state.game_time_ms); actor.shields = actor.shields.filter(instance => instance.expires_at > this.state.game_time_ms && instance.remaining > 0);
      if (expired.length) recomputeStats(actor, this.content);
      for (const instance of expired) {
        this.ports.emit({ type: 'status_expired', actor_id: actor.actor_id, target_id: actor.actor_id, detail: instance.instance_id, source_instance_id: instance.source.instance_id, status_change: { instance_id: instance.instance_id, status_id: instance.status_id, params: { ...instance.params }, applied_at: instance.applied_at, expires_at: instance.expires_at, control_resistance_after: actor.stats.control_resistance, active_instances_after: actor.statuses.filter(value => value.status_id === instance.status_id).length } });
        const source = this.actor(instance.source.origin_actor_id) ?? actor;
        this.event('status_expired', actor, { ...this.context(source, instance.source.definition_id, 'system', instance.instance_id), source: instance.source }, actor);
      }
    }
  }
  tick(carrier: BattleActor, instance: StatusInstance, scheduleNext = true): void {
    const periodic = statusDefinition(this.content, instance.status_id).periodic;
    if (!periodic || carrier.hp <= 0 || instance.expires_at <= this.state.game_time_ms) return;
    const source = this.actor(instance.source.origin_actor_id);
    if (periodic.offense === 'live_source' && (!source || !sourceAlive(instance.source, this.state.actors))) return;
    const context: ProgramContext = { ...this.context(carrier, instance.source.definition_id, 'periodic', this.uid('tick')), source: instance.source, offense: periodic.offense === 'application_snapshot' ? instance.offense_snapshot : source!.stats, weapon_element: instance.weapon_element_snapshot,allow_magical_crit:periodic.offense==='application_snapshot'?instance.allow_magical_crit===true:allowsMagicalCritical(source!,this.content,this.state.game_time_ms) };
    context.selected = this.bindings(context, {}); this.program(bindStatusParams(periodic.effects, instance.params), context);
    if (scheduleNext) { instance.next_tick_at = this.state.game_time_ms + periodic.interval_ms; if (instance.next_tick_at < instance.expires_at) schedule(this.state, carrier, 'status_tick', instance.next_tick_at, null, instance.instance_id); }
  }
  cleanupSources(): void {
    for (const actor of this.state.actors) {
      const count = actor.statuses.length;
      actor.statuses = actor.statuses.filter(instance => statusDefinition(this.content, instance.status_id).source_death === 'persist' || sourceAlive(instance.source, this.state.actors));
      if (count !== actor.statuses.length) recomputeStats(actor, this.content);
    }
  }
  death(actor: BattleActor): void {
    const cause = this.killingCauses.get(actor.actor_id);
    const context = cause ?? this.context(actor, 'system_death', 'system', this.uid('death'));
    this.event('actor_death', actor, context, actor, 0, cause ? this.actor(cause.source.origin_actor_id) ?? null : null);
    for (const ally of this.state.actors) if (ally !== actor && ally.team === actor.team && ally.hp > 0) this.event('ally_death', ally, context, actor, 0, cause ? this.actor(cause.source.origin_actor_id) ?? null : null);
  }
}
