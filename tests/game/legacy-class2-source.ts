import { readFileSync } from 'node:fs';
/** Retain old byte checks for the Class2 section while allowing explicit inactive Hi additions. */
export function legacyClass2Source(file: string): Buffer {
  const bytes = readFileSync(new URL(`../../plan/data/${file}`, import.meta.url));
  if (!['progression.json', 'equipment.json'].includes(file)) return bytes;
  const value = JSON.parse(bytes.toString('utf8'));
  if (file === 'progression.json') delete value.hi_class;
  else {
    const progression = JSON.parse(readFileSync(new URL('../../plan/data/progression.json', import.meta.url), 'utf8'));
    for (const row of progression.hi_class.job_advancements) delete value.weapon_compatibility[row.job_id];
  }
  return Buffer.from(JSON.stringify(value, null, 2) + '\n');
}
