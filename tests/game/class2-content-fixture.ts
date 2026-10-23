import rawJson from '../../src/generated/content.json';
import { validateContent } from '../../src/content/loader.ts';
/** Explicit former release configuration, solely for historical gate/compatibility tests. */
export function class2Content() {
  const raw = structuredClone(rawJson), p = raw.documents['progression.json'];
  p.promotion.hi_class_enabled = false; p.release.level_cap = 70; p.release.enabled_job_stages = [1, 2];
  p.release.future_job_stages[0]!.enabled = false;
  if (!p.release.excluded_features.includes('awakening')) p.release.excluded_features.push('awakening');
  const result = validateContent(raw); if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.value;
}
