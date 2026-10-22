import type { ContentIssue, DefinitionLocation, RawContent, Result, ValidatedContent } from './model.ts';
import type { Json, ObjectValue } from './value.ts';
import { arrayAt, canonical, freeze, isObject, objectAt } from './value.ts';
import { ContentValidator, demand, InvalidContent } from './validation.ts';

const object = (value: Json | undefined) => objectAt(value, 'content');
const list = (value: Json | undefined) => arrayAt(value, 'content');
const CLASS_ROOTS = ['swordsman', 'acolyte', 'archer', 'mage', 'thief', 'merchant'];
const FIXED = ['progression', 'combat-rules', 'stat-definitions', 'status-effects', 'class-status-effects', 'effect-primitives', 'formula-registry', 'equipment', 'cards', 'slot-progress', 'economy', 'loot', 'gacha', 'stages', 'enemies', 'tower', 'daily-bosses', 'summon-actors', 'save-contracts', 'simulation-contracts'];
const SCHEMAS = ['account-state', 'battle-checkpoint', 'command', 'common', 'effect', 'formula-call', 'item', 'modifier', 'patch', 'predicate', 'receipt', 'selector', 'simulation-scenario', 'skill', 'status', 'trigger'];

export function validateContent(raw: unknown): Result<ValidatedContent> {
  const errors: ContentIssue[] = [];
  const attempt = (location: DefinitionLocation, fn: () => void) => {
    try { fn(); } catch (error) { errors.push(error instanceof InvalidContent ? error.issue : { ...location, code: 'invalid_content', message: String(error) }); }
  };
  const root = { source: 'content bundle', path: '' };
  let bundle: RawContent;
  try {
    canonical(raw);
    demand(isObject(raw) && isObject(raw.documents) && isObject(raw.schemas) && isObject(raw.manifest), 'bundle_shape', root);
    bundle = structuredClone(raw) as unknown as RawContent;
    demand(bundle.manifest.schema_version === 1 && bundle.manifest.content_version === 'class2-v1.0.0' && bundle.manifest.rules_version === 'combat-baseline-v1', 'version', root);
    for (const key of ['content_hash', 'engine_data_hash', 'schema_hash', 'implementation_hash'] as const) demand(/^[a-f0-9]{64}$/.test(bundle.manifest[key]), 'version_hash', { ...root, path: `/manifest/${key}` });
    demand(canonical(Object.keys(bundle.schemas).sort()) === canonical([...SCHEMAS].sort()), 'schema_catalog', root);
    for (const file of [...FIXED.map(name => `${name}.json`), ...CLASS_ROOTS.map(name => `skills/${name}.json`), 'strings.th.json', 'actor-presentations.json']) demand(isObject(bundle.documents[file]), 'missing_document', { source: file, path: '' });
  } catch (error) { return { ok: false, errors: [error instanceof InvalidContent ? error.issue : { ...root, code: 'bundle_shape', message: String(error) }] }; }
  let validator: ContentValidator;
  try { validator = new ContentValidator(bundle.schemas); } catch (error) { return { ok: false, errors: [{ ...root, code: 'schema_catalog', message: String(error) }] }; }
  const skills: Record<string, ObjectValue> = Object.create(null), items: Record<string, ObjectValue> = Object.create(null), actors: Record<string, ObjectValue> = Object.create(null);
  const rows: { kind: 'skill' | 'item' | 'status'; value: ObjectValue; location: DefinitionLocation }[] = [];
  function register(file: string, key: string, registry: Record<string, ObjectValue>, kind?: 'skill' | 'item' | 'status') {
    const sourceData = bundle.documents[file]!;
    attempt({ source: file, path: `/${key}` }, () => {
      for (const [index, value] of list(sourceData[key]).entries()) {
        const row = object(value), id = String(row.id), at = { source: file, definition_id: id, path: `/${key}/${index}` };
        attempt(at, () => {
          demand(typeof row.id === 'string' && row.id.length > 0, 'invalid_id', at);
          demand(!(id in registry), 'duplicate_id', at, `Duplicate ID ${id}`);
          registry[id] = row;
          if (kind) rows.push({ kind, value: row, location: at });
        });
      }
    });
  }
  for (const file of ['status-effects.json', 'class-status-effects.json']) register(file, 'statuses', validator.statuses, 'status');
  register('stat-definitions.json', 'stats', validator.stats);
  register('summon-actors.json', 'actors', actors);
  register('enemies.json', 'actors', actors);
  for (const id of Object.keys(actors)) validator.actorIds.add(id);
  for (const name of CLASS_ROOTS) register(`skills/${name}.json`, 'skills', skills, 'skill');
  register('enemies.json', 'skills', skills, 'skill');
  for (const file of ['equipment.json', 'cards.json']) register(file, 'definitions', items, 'item');
  for (const row of rows) attempt(row.location, () => validator.definition(row.kind, row.value, row.location));
  attempt({ source: 'stat-definitions.json', path: '/combat_resources' }, () => validator.resourceModifiers(list(bundle.documents['stat-definitions.json']!.combat_resources), skills, { source: 'stat-definitions.json', path: '/combat_resources' }));
  const docAt = (file: string) => ({ source: file, path: '' });
  for (const [file, doc] of Object.entries(bundle.documents)) attempt(docAt(file), () => {
    demand(file.endsWith('.json') && !file.includes('..') && !file.startsWith('/'), 'document_path', docAt(file));
    demand(FIXED.some(name => `${name}.json` === file) || CLASS_ROOTS.some(name => `skills/${name}.json` === file) || ['strings.th.json', 'actor-presentations.json'].includes(file) || /^presentations\/[a-z]+\.json$/.test(file), 'unknown_document', docAt(file));
    demand(doc.schema_version === 1, 'schema_version', docAt(file));
    demand(String(doc.content_version ?? doc.version ?? doc.rules_version ?? 'schema1') === bundle.manifest.document_versions[file], 'content_version', docAt(file));
  });
  attempt(docAt('registry'), () => {
    const formulas = list(bundle.documents['formula-registry.json']!.formulas).map(row => String(object(row).id));
    demand(canonical(formulas.slice().sort()) === canonical(['physical_power', 'magical_power', 'healing_power', 'flat_power', 'sp_burst_power', 'event_damage_power'].sort()), 'formula_registry', docAt('formula-registry.json'));
    const effects = list(bundle.documents['effect-primitives.json']!.effects).map(row => String(object(row).id));
    demand(canonical(effects.slice().sort()) === canonical(['damage', 'heal', 'apply_status', 'shield', 'resource_change', 'remove_status', 'interrupt', 'summon', 'revive', 'handler'].sort()), 'effect_registry', docAt('effect-primitives.json'));
    const handlers = list(bundle.documents['effect-primitives.json']!.handler_registry).map(row => String(object(row).id));
    demand(canonical(handlers) === canonical(['detonate_own_status']), 'handler_registry', docAt('effect-primitives.json'));
  });
  attempt(docAt('progression.json'), () => {
    const progression = bundle.documents['progression.json']!;
    const tree = object(progression.class_tree);
    const classes = new Set([...Object.keys(tree), ...Object.values(tree).flatMap(row => list(row).map(String))]);
    for (const row of Object.values(skills)) demand(classes.has(String(row.class_id)) || row.class_id === 'enemy', 'unknown_class', { source: 'skills', definition_id: String(row.id), path: '/class_id' });
    const strings = object(bundle.documents['strings.th.json']!.strings);
    for (const row of [...Object.values(skills), ...Object.values(items)]) demand(String(row.name_key) in strings || String(row.id).startsWith('enemy_'), 'unknown_name_key', { source: 'strings.th.json', definition_id: String(row.id), path: `/strings/${String(row.name_key)}` });
  });
  attempt(docAt('presentations'), () => {
    const presentations: Record<string, ObjectValue> = Object.create(null);
    for (const file of [...CLASS_ROOTS.map(name => `presentations/${name}.json`), 'equipment.json', 'cards.json']) {
      demand(bundle.documents[file], 'missing_document', docAt(file));
      for (const row of list(bundle.documents[file]!.presentations)) {
        const entry = object(row), id = String(entry.id);
        // Item/card presentation rows use definition_id rather than standalone IDs.
        const key = typeof entry.id === 'string' ? id : String(entry.definition_id);
        demand(!(key in presentations), 'duplicate_id', { source: file, path: '/presentations' }, key);
        presentations[key] = entry;
      }
    }
    for (const row of Object.values(skills)) if (row.presentation_id) demand(String(row.presentation_id) in presentations, 'unknown_presentation', { source: 'skills', definition_id: String(row.id), path: '/presentation_id' });
  });
  for (const [id, actor] of Object.entries(actors)) attempt({ source: 'actors', definition_id: id, path: '' }, () => {
    for (const skill of list(actor.active_slots ?? []).filter(Boolean)) demand(String(skill) in skills, 'unknown_skill', { source: 'actors', definition_id: id, path: '/active_slots' });
    for (const skill of list(actor.passives ?? [])) demand(skills[String(skill)]?.kind === 'passive', 'unknown_skill', { source: 'actors', definition_id: id, path: '/passives' });
    if (actor.action) { const action = object(actor.action); validator.program(list(action.effects), object(action.selectors), { source: 'summon-actors.json', definition_id: id, path: '/action' }, 'periodic', 'event'); }
  });
  attempt(docAt('stages.json'), () => {
    const seen = new Set<string>();
    for (const stageValue of list(bundle.documents['stages.json']!.stages)) {
      const stage = object(stageValue), id = String(stage.id), at = { source: 'stages.json', definition_id: id, path: '/stages' };
      demand(!seen.has(id), 'duplicate_id', at); seen.add(id);
      if (stage.unlock_after !== null) demand(seen.has(String(stage.unlock_after)), 'unknown_stage', at);
      for (const enemyValue of list(stage.encounter)) {
        const enemy = object(enemyValue);
        demand(String(enemy.definition_id) in actors, 'unknown_actor', at);
        for (const skill of list(enemy.active_slots).filter(Boolean)) demand(skills[String(skill)]?.kind === 'active', 'unknown_skill', at);
        for (const skill of list(enemy.passives)) demand(skills[String(skill)]?.kind === 'passive', 'unknown_skill', at);
      }
    }
  });
  attempt(docAt('loot.json'), () => {
    const gear = object(bundle.documents['loot.json']!.gear);
    const equipment = Object.values(items).filter(item => item.kind === 'equipment');
    for (const tier of Object.values(object(gear.tier_by_chapter))) demand(equipment.filter(item => item.tier_level === tier).length === 36, 'missing_loot_tier', docAt('loot.json')); // D-068: 20 weapons + 16 armor-slot kinds per tier
    for (const value of list(bundle.documents['gacha.json']!.definitions)) demand(items[String(value)]?.kind === 'card', 'unknown_item', docAt('gacha.json'));
  });
  attempt(docAt('tower.json'), () => {
    const generator = object(bundle.documents['tower.json']!.generator);
    for (const id of list(generator.template_cycle)) demand(String(id) in actors, 'unknown_actor', docAt('tower.json'));
    for (const queue of list(generator.skill_cycle)) for (const id of list(queue)) demand(skills[String(id)]?.kind === 'active', 'unknown_skill', docAt('tower.json'));
    for (const bossValue of list(bundle.documents['daily-bosses.json']!.bosses)) {
      const boss = object(bossValue), at = { source: 'daily-bosses.json', definition_id: String(boss.id), path: '/bosses' };
      demand(String(boss.enemy_definition_id) in actors, 'unknown_actor', at);
      for (const id of list(boss.active_slots).filter(Boolean)) demand(skills[String(id)]?.kind === 'active', 'unknown_skill', at);
    }
  });
  return errors.length ? { ok: false, errors } : { ok: true, value: freeze({ manifest: bundle.manifest, documents: bundle.documents, skills, items, statuses: validator.statuses, actors, schemas: bundle.schemas }) };
}
