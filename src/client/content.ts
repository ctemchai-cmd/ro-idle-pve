import raw from '../generated/content.json' with { type: 'json' };
import type { RawContent, Result, ValidatedContent } from '../content/model.ts';
import { freeze, type ObjectValue } from '../content/value.ts';

// One immutable definition bundle per browser build. This never stores saves, Auth or actor state.
// npm build validates this exact generated bundle before Vite runs. Index that build-owned data
// instead of recompiling all definition schemas on a phone. Network saves/commands/checkpoints
// still receive their existing runtime schema/hash checks. HMR/build replacement resets this module.
let validated: Result<ValidatedContent> | undefined;
export function loadValidatedContent(): Result<ValidatedContent> {
  if (validated) return validated;
  const bundle = raw as unknown as RawContent;
  if (bundle.manifest.schema_version !== 1 || !/^[a-f0-9]{64}$/.test(bundle.manifest.content_hash))
    return { ok: false, errors: [{ code: 'bundle_shape', source: 'generated client bundle', path: '/manifest', message: 'Rebuild the validated content bundle' }] };
  const registry = (sources: readonly [string, string][]) => {
    const rows: Record<string, ObjectValue> = Object.create(null);
    for (const [file, key] of sources) for (const row of bundle.documents[file]![key] as ObjectValue[]) rows[String(row.id)] = row;
    return rows;
  };
  const roots = ['swordsman', 'acolyte', 'archer', 'mage', 'thief', 'merchant'];
  validated = Object.freeze({ ok: true, value: freeze({ ...bundle,
    skills: registry([...roots.map(root => [`skills/${root}.json`, 'skills'] as [string, string]), ['enemies.json', 'skills']]),
    items: registry([['equipment.json', 'definitions'], ['cards.json', 'definitions']]),
    statuses: registry([['status-effects.json', 'statuses'], ['class-status-effects.json', 'statuses']]),
    actors: registry([['summon-actors.json', 'actors'], ['enemies.json', 'actors']]),
  }) });
  return validated;
}
