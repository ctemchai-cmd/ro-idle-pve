import { readFileSync } from 'node:fs';
import sanctuaryBefore127 from './fixtures/sanctuary-before-127.json';
/** Frozen scope checks retain all historical bytes except separately tested D154/D157 changes. */
export function legacyClass2Source(file: string): Buffer {
  const bytes = readFileSync(new URL(`../../plan/data/${file}`, import.meta.url));
  if (!['progression.json', 'equipment.json', 'skills/acolyte.json'].includes(file)) return bytes;
  if (file === 'skills/acolyte.json') {
    // Keep unrelated source formatting (including 7.0 vs 7) byte-identical.
    const oldSkill = JSON.stringify(sanctuaryBefore127, null, 2).split('\n').map(line => '    ' + line).join('\n');
    return Buffer.from(bytes.toString().replace(/^    \{\n      "id": "priest_sanctuary"[\s\S]*?\n    \}/m, oldSkill));
  }
  const value = JSON.parse(bytes.toString('utf8'));
  if (file === 'progression.json') delete value.hi_class;
  else {
    const progression = JSON.parse(readFileSync(new URL('../../plan/data/progression.json', import.meta.url), 'utf8'));
    for (const row of progression.hi_class.job_advancements) delete value.weapon_compatibility[row.job_id];
  }
  return Buffer.from(JSON.stringify(value, null, 2) + '\n');
}
