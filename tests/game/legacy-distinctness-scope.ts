import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import spec from '../../plan/generators/skill-distinctness.json';
import { withoutD169Hi } from './legacy-hi-v2-scope.ts';
const frozen = JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-142/authored-before.json.gz', import.meta.url))).toString()) as Record<string, string>;
const originals = Object.entries(frozen).filter(([path]) => /^plan\/data\/skills\/.+\.json$/.test(path)).flatMap(([, text]) => {
  const d = JSON.parse(text); return [...d.skills, ...d.hi_class_skills, ...Object.values(d.awakened_variants)];
});
/** Historical guards restore only D168's declared fields. The new scope test independently
 * checks all authored documents against this frozen input; extra edits are never hidden. */
export function withoutD168Roles<T>(value: T): T {
  const copy = withoutD169Hi(value);
  function visit(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    const row = node as Record<string, unknown>, id = String(row.id);
    const patch = spec.updates[id as keyof typeof spec.updates];
    if (patch && row.level_parameters) {
      const aw = Array.isArray(row.tags) && row.tags.includes('awakened');
      const old = originals.find(s => s.id === id && !!s.tags.includes('awakened') === aw);
      for (const key of Object.keys(aw ? patch.awakened : patch.base)) {
        if (key in old) row[key] = structuredClone(old[key]); else delete row[key];
      }
    }
    Object.values(row).forEach(visit);
  }
  visit(copy); return copy;
}
