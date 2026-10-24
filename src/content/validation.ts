import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ValidateFunction } from 'ajv';
import type { ContentIssue, DefinitionLocation } from './model.ts';
import { arrayAt, canonical, isObject, objectAt } from './value.ts';
import type { Json, ObjectValue } from './value.ts';

export type SchemaKind = 'skill' | 'item' | 'status' | 'patch' | 'modifier' | 'selector' | 'trigger' | 'effect' | 'command' | 'account-state' | 'receipt' | 'battle-checkpoint' | 'simulation-scenario';
export class InvalidContent extends Error {
  constructor(readonly issue: ContentIssue) { super(issue.message); }
}
export function demand(condition: unknown, code: string, location: DefinitionLocation, message = code): asserts condition {
  if (!condition) throw new InvalidContent({ ...location, code, message });
}
const obj = (value: Json | undefined) => objectAt(value, 'definition');
const arr = (value: Json | undefined) => arrayAt(value, 'definition');
const text = (value: Json | undefined) => String(value);
const has = (value: Json | undefined) => isObject(value);
function* walk(value: Json): Generator<Json> {
  yield value;
  if (Array.isArray(value)) for (const child of value) yield* walk(child);
  else if (isObject(value)) for (const child of Object.values(value)) yield* walk(child);
}
function unique(rows: Json[], location: DefinitionLocation) {
  const ids = rows.map(row => text(obj(row).id));
  demand(new Set(ids).size === ids.length, 'duplicate_id', location, 'Duplicate definition/effect/trigger ID');
}

export class ContentValidator {
  private readonly ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  private readonly shapes = new Map<string, ValidateFunction>();
  readonly statuses: Record<string, ObjectValue> = Object.create(null);
  readonly stats: Record<string, ObjectValue> = Object.create(null);
  readonly actorIds = new Set<string>();
  readonly skillIds = new Set<string>();
  constructor(schemas: Record<string, ObjectValue>) {
    for (const [name, schema] of Object.entries(schemas)) {
      if (schema.$id !== `https://ro-idle.local/schemas/${name}.json`) throw new TypeError(`Invalid local schema ID: ${name}`);
      for (const node of walk(schema)) if (isObject(node) && '$ref' in node && !/^[a-z-]+\.json$/.test(text(node.$ref))) throw new TypeError(`Remote/unregistered schema ref: ${text(node.$ref)}`);
      this.ajv.addSchema(schema);
    }
  }
  shape(kind: string, value: Json, location: DefinitionLocation) {
    try { canonical(value); } catch (error) { throw new InvalidContent({ ...location, code: 'unsafe_json', message: String(error) }); }
    let validator = this.shapes.get(kind);
    if (!validator) {
      validator = this.ajv.getSchema(`https://ro-idle.local/schemas/${kind}.json`);
      if (validator) this.shapes.set(kind, validator);
    }
    demand(validator, 'unknown_schema', location, kind);
    if (!validator(value)) {
      const errors = validator.errors ?? [];
      // Prefer the most specific failing field over a parent oneOf error.
      const error = [...errors].sort((a, b) => b.instancePath.length - a.instancePath.length)[0];
      let effect_id = location.effect_id;
      if (error) {
        let parent: Json = value;
        for (const part of error.instancePath.split('/').slice(1)) {
          if (isObject(parent) && typeof parent.id === 'string' && typeof parent.type === 'string') effect_id = parent.id;
          parent = (parent as ObjectValue)[part] ?? null;
        }
      }
      throw new InvalidContent({ ...location, effect_id, path: location.path + (error?.instancePath ?? ''), code: 'schema', message: error ? `${error.message}; schema ${error.schemaPath}` : 'Invalid shape' });
    }
  }
  resolve(value: Json, levels?: ObjectValue, params?: ObjectValue, location: DefinitionLocation = { source: '', path: '' }): Json {
    if (Array.isArray(value)) return value.map((child, index) => this.resolve(child, levels, params, { ...location, path: `${location.path}/${index}` }));
    if (!isObject(value)) return value;
    if (Object.keys(value).length === 1 && 'level_param' in value) {
      const key = text(value.level_param);
      demand(levels && Object.hasOwn(levels, key), 'level_param', location, `Unbound level parameter ${key}`);
      return levels[key]!;
    }
    if (Object.keys(value).length === 1 && 'status_param' in value) {
      const key = text(value.status_param);
      demand(params && Object.hasOwn(params, key), 'status_param_scope', location, `Unbound status parameter ${key}`);
      return params[key]!;
    }
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, this.resolve(child, levels, params, { ...location, path: `${location.path}/${key}` })]));
  }
  private predicates(predicate: Json | undefined): ObjectValue[] {
    if (!predicate) return [];
    const row = obj(predicate);
    const children = row.conditions ? arr(row.conditions) : row.condition ? [row.condition] : [];
    return [row, ...children.flatMap(child => this.predicates(child))];
  }
  modifiers(rows: Json[], location: DefinitionLocation) {
    unique(rows, location);
    for (const [index, value] of rows.entries()) {
      const row = obj(value), stat = this.stats[text(row.stat)];
      const at = { ...location, path: `${location.path}/${index}` };
      demand(stat, 'unknown_stat', at, text(row.stat));
      demand(row.bucket === stat.group, 'modifier_bucket', at);
      demand(arr(stat.allowed_ops).includes(row.op!), 'modifier_unit', at);
      for (const predicate of this.predicates(row.when)) {
        demand(['all', 'any', 'not', 'has_status', 'has_tag'].includes(text(predicate.type)), 'modifier_predicate_cycle', at);
        if ('actor' in predicate) demand(predicate.actor === 'self', 'modifier_context', at);
        if (predicate.type === 'has_status') demand(text(predicate.status_id) in this.statuses, 'unknown_status', at);
      }
    }
  }
  resourceModifiers(rows: Json[], skills: Record<string, ObjectValue>, location: DefinitionLocation) {
    for (const [index, value] of rows.entries()) {
      const resource = obj(value), at = { ...location, path: `${location.path}/${index}/per_unit_modifiers` };
      demand(['sp', 'spirit_spheres'].includes(text(resource.id)), 'unknown_resource', at);
      const modifiers = arr(resource.per_unit_modifiers ?? []).map((value, index) => {
        const { value_from_skill, ...modifier } = obj(value), here = { ...at, path: `${at.path}/${index}` };
        this.shape('modifier', modifier, here);
        demand(typeof modifier.value === 'number' && !modifier.when, 'resource_modifier_value', here);
        if (value_from_skill !== undefined) {
          const ref = obj(value_from_skill);
          demand(Object.keys(ref).length === 2 && typeof ref.skill_id === 'string' && typeof ref.level_parameter === 'string', 'resource_skill_reference', here);
          const skill = skills[ref.skill_id];
          demand(skill, 'unknown_resource_skill', here);
          const curve = obj(skill.level_parameters)[ref.level_parameter];
          demand(Array.isArray(curve) && curve.length === Number(skill.max_level) && curve.every(n => typeof n === 'number' && Number.isFinite(n)), 'resource_skill_curve', here);
        }
        return modifier;
      });
      this.modifiers(modifiers, at);
    }
  }
  private eventBindings(event?: string) {
    return new Set(!event || event === 'battle_start' ? [] : ['cast_start', 'cast_resolve'].includes(event) ? ['event_source'] : ['event_source', 'event_target']);
  }
  program(effects: Json[], selectors: ObjectValue, location: DefinitionLocation, event?: string, phase = 'cast_resolve') {
    unique(effects, location);
    const previous = new Map<string, ObjectValue>();
    const bindings = this.eventBindings(event);
    const reserved = new Set(['self', 'source_actor', ...bindings]);
    for (const [key, value] of Object.entries(selectors)) {
      const selector = obj(value);
      demand(!['self', 'source_actor', 'event_source', 'event_target'].includes(key), 'reserved_binding', location, key);
      demand((selector.select === 'random_n') === (selector.count !== null), 'selector_count', location, key);
      demand(selector.phase === (event ? 'event' : phase) || (phase === 'cast_resolve' && selector.phase === 'cast_start'), 'selector_phase', location, key);
    }
    for (const [index, value] of effects.entries()) {
      const effect = obj(value), target = text(effect.target), type = text(effect.type);
      const at = { ...location, effect_id: text(effect.id), path: `${location.path}/${index}` };
      demand(reserved.has(target) || Object.hasOwn(selectors, target), 'unknown_binding', at, target);
      for (const predicate of this.predicates(effect.when)) {
        if (predicate.type === 'effect_succeeded') {
          const prior = previous.get(text(predicate.effect_id));
          demand(prior?.type === 'interrupt', 'outcome_reference', at);
          demand(prior.target === target, 'outcome_scope', at);
        }
        if (predicate.type === 'hit_landed') {
          const prior = previous.get(text(predicate.effect_id));
          demand(prior?.type === 'damage', 'outcome_reference', at);
          demand(prior.target === target, 'outcome_scope', at);
          demand(predicate.hit_index === 'any' || Number(predicate.hit_index) < Number(prior.hits), 'hit_index', at);
        }
        if (predicate.type === 'has_status') demand(text(predicate.status_id) in this.statuses, 'unknown_status', at);
        if (text(predicate.actor).startsWith('event_')) demand(bindings.has(text(predicate.actor)), 'event_context', at);
      }
      if (type === 'apply_status') {
        const status = this.statuses[text(effect.status_id)];
        demand(status, 'unknown_status', at, text(effect.status_id));
        const params = obj(effect.params);
        for(const [key,call]of Object.entries(obj(effect.parameter_formulas??{}))){
          demand(Object.hasOwn(params,key)&&Object.hasOwn(obj(obj(status.parameter_schema).properties),key),'status_parameter_formula',at,key);
          demand(['physical_power','magical_power','healing_power','flat_power'].includes(text(obj(call).id)),'status_parameter_formula',at,key);
        }
        demand(this.ajv.validate(obj(status.parameter_schema), params), 'status_params', { ...at, path: `${at.path}/params` }, JSON.stringify(this.ajv.errors));
        demand(Number(effect.chance) >= 0 && Number(effect.chance) <= 1, 'probability', at);
        const template = obj(this.resolve(status, undefined, params, at));
        this.modifiers(arr(template.modifiers), at);
        this.triggers(arr(template.triggers), at);
        if (template.damage_redirect) {
          const ratio = Number(obj(template.damage_redirect).ratio);
          demand(ratio >= 0 && ratio <= 1 && template.source_death === 'remove', 'redirect_ratio', at);
        }
        if (template.periodic) this.program(arr(obj(template.periodic).effects), {}, at);
      }
      if (['damage','sacrifice_damage', 'heal', 'shield'].includes(type)) {
        const formula = obj(effect.formula);
        if (formula.id === 'event_damage_power') demand(['damage_received', 'damage_dealt'].includes(event ?? ''), 'event_context', at);
        const allowed = ['damage','sacrifice_damage'].includes(type) ? ['physical_power', 'magical_power', 'flat_power', 'sp_burst_power', 'event_damage_power'] : ['healing_power', 'physical_power', 'flat_power'];
        demand(allowed.includes(text(formula.id)), 'formula_result_type', at);
      }
      if (Object.hasOwn(selectors, target)) {
        const selector = obj(selectors[target]);
        demand((type === 'revive') === (selector.life === 'dead'), 'target_life', at);
        if (type === 'revive') demand(selector.team === 'allies', 'target_life', at);
      } else demand(type !== 'revive', 'target_life', at);
      if (['apply_status', 'shield', 'summon'].includes(type)) demand(Number.isSafeInteger(effect.duration_ms) && Number(effect.duration_ms) >= 1, 'duration', at);
      if (type === 'resource_change' && ['self', 'source_actor'].includes(target) && Number(effect.amount) < 0 && phase !== 'event') demand(false, 'double_cost', at);
      if (type === 'damage' && effect.damage_type === 'true') demand(effect.armor_rule === 'ignore', 'true_damage_armor', at);
      if (type === 'damage' && effect.critical_rule === 'always') demand(effect.can_crit === true, 'critical_rule', at);
      if (effect.as_reflect) demand(['damage_received', 'damage_dealt'].includes(event ?? '') && obj(effect.formula).id === 'event_damage_power', 'reflection_context', at);
      if (type === 'handler') demand(text(obj(effect.params).status_id) in this.statuses, 'unknown_status', at);
      if (type === 'summon') demand(this.actorIds.has(text(effect.actor_definition_id)), 'unknown_actor', at, text(effect.actor_definition_id));
      previous.set(text(effect.id), effect);
    }
  }
  triggers(rows: Json[], location: DefinitionLocation) {
    unique(rows, location);
    for (const [index, value] of rows.entries()) {
      const row = obj(value), event = text(row.event), at = { ...location, path: `${location.path}/triggers/${index}` };
      demand(Number(row.chance) >= 0 && Number(row.chance) <= 1, 'probability', at);
      for (const predicate of this.predicates(row.when)) {
        demand(!['hit_landed', 'effect_succeeded'].includes(text(predicate.type)), 'outcome_scope', at);
        if (predicate.type === 'has_status') demand(text(predicate.status_id) in this.statuses, 'unknown_status', at);
        if (text(predicate.actor).startsWith('event_')) demand(this.eventBindings(event).has(text(predicate.actor)), 'event_context', at);
        if (predicate.actor === 'target') demand(this.eventBindings(event).has('event_target'), 'event_context', at);
      }
      this.program(arr(row.effects), obj(row.selectors), at, event, 'event');
    }
  }
  definition(kind: 'skill' | 'item' | 'status', value: ObjectValue, location: DefinitionLocation) {
    this.shape(kind, value, location);
    if (kind === 'skill') {
      const curves = obj(value.level_parameters), max = Number(value.max_level);
      if (value.rank_unlock_levels !== undefined) {
        const levels = arr(value.rank_unlock_levels);
        demand(levels.length === max && levels[0] === value.unlock_level && levels.every((level, i) => Number.isSafeInteger(level) && Number(level) >= 1 && (!i || Number(level) > Number(levels[i - 1]))), 'rank_unlock_levels', location);
      }
      for (const [key, curve] of Object.entries(curves)) demand(arr(curve).length === max, 'level_curve', { ...location, path: `${location.path}/level_parameters/${key}` });
      for (let index = 0; index < max; index++) {
        const values = Object.fromEntries(Object.entries(curves).map(([key, curve]) => [key, arr(curve)[index]!])) as ObjectValue;
        const resolved = obj(this.resolve(value, values, undefined, location));
        this.shape(kind, resolved, location);
        if (resolved.kind === 'active') {
          const selectors = obj(resolved.selectors);
          this.program(arr(resolved.start_effects), Object.fromEntries(Object.entries(selectors).filter(([, selector]) => obj(selector).phase === 'cast_start')), { ...location, path: `${location.path}/start_effects` }, undefined, 'cast_start');
          this.program(arr(resolved.effects), selectors, { ...location, path: `${location.path}/effects` });
          const timing = obj(resolved.timing), cost = obj(resolved.cost);
          demand(Number.isSafeInteger(timing.cast_ms) && Number.isSafeInteger(timing.after_cast_ms), 'duration', location);
          const sp = has(cost.sp) ? obj(cost.sp).minimum_sp : cost.sp;
          demand(Number.isSafeInteger(sp) && Number.isSafeInteger(cost.spirit_spheres) && Number(cost.spirit_spheres) <= 5, 'resource_integer', location);
        } else { this.modifiers(arr(resolved.modifiers), location); this.triggers(arr(resolved.triggers), location); }
      }
    } else if (kind === 'item') {
      demand((value.slot === 'weapon' && value.kind === 'equipment') === (value.weapon_type !== null), 'weapon_kind', location);
      this.modifiers(arr(value.modifiers), location); this.triggers(arr(value.triggers), location);
    } else {
      const schema = obj(value.parameter_schema), properties = obj(schema.properties);
      demand(schema.additionalProperties === false && canonical([...arr(schema.required)].sort()) === canonical(Object.keys(properties).sort()), 'status_params', location);
      for (const node of walk(schema)) if (isObject(node)) demand(!('$ref' in node), 'status_params', location, 'Status parameters cannot load other schemas');
      for (const node of walk(value)) if (isObject(node) && Object.keys(node).length === 1 && 'status_param' in node) demand(text(node.status_param) in properties, 'status_params', location);
      if (value.periodic && obj(value.periodic).offense === 'live_source') demand(value.source_death === 'remove', 'status_lifecycle', location);
      const params = Object.fromEntries(Object.entries(properties).map(([key, prop]) => [key, obj(prop).minimum ?? Math.min(0, Number(obj(prop).maximum ?? 0))])) as ObjectValue;
      const template = obj(this.resolve(value, undefined, params, location));
      if(value.skill_echo){
        const echo=obj(value.skill_echo),tiers=arr(echo.tiers).map(obj),ordered=tiers.map(t=>Number(t.multiplier));
        demand(ordered.every((m,i)=>i===0||m<ordered[i-1]!), 'echo_tier_order',location);
        if(this.skillIds.size)for(const id of arr(echo.skill_ids))demand(this.skillIds.has(text(id)),'unknown_echo_skill',location,text(id));
      }
      this.modifiers(arr(template.modifiers), location); this.triggers(arr(template.triggers), location);
      if (template.periodic) this.program(arr(obj(template.periodic).effects), {}, location);
    }
  }
}
