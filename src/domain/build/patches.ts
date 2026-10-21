import { ContentValidator, demand, InvalidContent } from '../../content/validation.ts';
import { objectAt, arrayAt } from '../../content/value.ts';
import type { Json, ObjectValue } from '../../content/value.ts';
import type { RawContent, Result } from '../../content/model.ts';

/** Build variants never mutate the shared base, including on a failed patch. */
export function applySkillPatches(base: ObjectValue, patches: ObjectValue[], catalogs: RawContent): Result<ObjectValue> {
  const location = { source: 'skill patches', definition_id: String(base.id), path: '' };
  try {
    const validator = new ContentValidator(catalogs.schemas);
    for (const file of ['status-effects.json', 'class-status-effects.json']) for (const row of arrayAt(catalogs.documents[file]?.statuses, file)) { const d = objectAt(row, file); validator.statuses[String(d.id)] = d; }
    for (const row of arrayAt(catalogs.documents['stat-definitions.json']?.stats, 'stats')) { const d = objectAt(row, 'stats'); validator.stats[String(d.id)] = d; }
    for (const row of arrayAt(catalogs.documents['summon-actors.json']?.actors, 'actors')) validator.actorIds.add(String(objectAt(row, 'actors').id));
    const result = structuredClone(base), seen = new Set<string>(), ids = new Set<string>();
    const stages: Record<string, number> = { awaken: 0, artifact: 1, scenario: 2 };
    for (const patch of patches) validator.shape('patch', patch, { ...location, path: `/patches/${String(patch.id)}` });
    const ordered = patches.slice().sort((a, b) => stages[String(a.stage)]! - stages[String(b.stage)]! || Number(a.priority) - Number(b.priority) || (String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0));
    for (const patch of ordered) {
      const at = { ...location, effect_id: String(patch.effect_id), path: `/patches/${String(patch.id)}` };
      demand(!ids.has(String(patch.id)), 'duplicate_id', at); ids.add(String(patch.id));
      demand(patch.skill_id === base.id, 'patch_skill', at);
      const effects = arrayAt(result.effects, 'effects'), effect = effects.map(row => objectAt(row, 'effect')).find(row => row.id === patch.effect_id);
      if (patch.operation === 'append_effect') {
        demand(patch.effect && patch.param === undefined && patch.value === undefined, 'patch_shape', at);
        demand(!effect && objectAt(patch.effect, 'effect').id === patch.effect_id, 'patch_anchor', at);
        effects.push(structuredClone(patch.effect));
      } else {
        demand(typeof patch.param === 'string' && patch.value !== undefined && patch.effect === undefined, 'patch_shape', at);
        demand(effect, 'patch_anchor', at);
        const parts = patch.param.split('.');
        demand(parts.length === 3 && parts[0] === 'formula' && parts[1] === 'params', 'patch_path', at);
        const params = objectAt(objectAt(effect.formula, 'formula').params, 'params'), key = parts[2]!;
        demand(key in params, 'patch_anchor', at);
        const conflict = [patch.stage, patch.priority, patch.effect_id, patch.param].join(':');
        demand(!seen.has(conflict), 'patch_conflict', at); seen.add(conflict);
        if (patch.operation === 'set_param') params[key] = structuredClone(patch.value as Json);
        else { demand(typeof params[key] === 'number' && typeof patch.value === 'number', 'patch_numeric', at); params[key] += patch.value; }
      }
    }
    validator.definition('skill', result, location);
    return { ok: true, value: result };
  } catch (error) { return { ok: false, errors: [error instanceof InvalidContent ? error.issue : { ...location, code: 'patch', message: String(error) }] }; }
}
