import rawJson from '../../src/generated/content.json';
import { validateContent } from '../../src/content/loader.ts';
import { unwrap } from './combat-fixtures.ts';
/** Test-only release activation. No owner state, app setting or server back door. */
export function hiContent(awakening = false) {
  const raw = structuredClone(rawJson), progression = raw.documents['progression.json'];
  progression.promotion.hi_class_enabled = true;
  progression.release.level_cap = 90;
  progression.release.enabled_job_stages = [1, 2, 3];
  if(awakening)progression.release.excluded_features=progression.release.excluded_features.filter(feature=>feature!=='awakening');
  else if(!progression.release.excluded_features.includes('awakening'))progression.release.excluded_features.push('awakening');
  return unwrap(validateContent(raw));
}
