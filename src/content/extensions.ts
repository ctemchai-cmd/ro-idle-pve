import type { ObjectValue } from './value.ts';

/** One release projection shared by validated server content and the browser index.
 * Authored extensions remain available to validation fixtures while the release is closed.
 * Definitions and their stable IDs are never duplicated or changed by the projection.
 */
export function projectContentDocuments(input: Record<string, ObjectValue>): Record<string, ObjectValue> {
  const promotion = input['progression.json']?.promotion as ObjectValue | undefined;
  if (!promotion?.hi_class_enabled) return input;
  return Object.fromEntries(Object.entries(input).map(([file, source]) => {
    const doc = { ...source };
    if (file.startsWith('skills/')) {
      doc.skills = [...source.skills as ObjectValue[], ...source.hi_class_skills as ObjectValue[] ?? []];
      doc.upgrades = { ...source.upgrades as ObjectValue, ...source.hi_class_upgrades as ObjectValue ?? {} };
    }
    if (file.startsWith('presentations/')) doc.presentations = [...source.presentations as ObjectValue[], ...source.hi_class_presentations as ObjectValue[] ?? []];
    if (file === 'actor-presentations.json') doc.jobs = [...source.jobs as ObjectValue[], ...source.hi_class_jobs as ObjectValue[] ?? []];
    if(file==='daily-bosses.json')doc.bosses=(source.bosses as ObjectValue[]).map(boss=>boss.hi_class_awakening_reward?{...boss,awakening_reward:boss.hi_class_awakening_reward}:boss);
    return [file, doc];
  }));
}
