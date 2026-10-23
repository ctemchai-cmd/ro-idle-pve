import { readFileSync } from 'node:fs';
import sanctuaryBefore127 from './fixtures/sanctuary-before-127.json';
import hunterBefore128 from './fixtures/hunter-before-128.json';
/** Frozen scope checks retain all historical bytes except separately tested D154/D157 changes. */
export function legacyClass2Source(file: string): Buffer {
  let bytes = readFileSync(new URL(`../../plan/data/${file}`, import.meta.url));
  if (file.startsWith('skills/')) {
    // TASK123 appends inactive High programs/prices; preserve the original Class2 bytes.
    const text = bytes.toString(), start = text.indexOf(',\n  \"hi_class_skills\"');
    if (start >= 0) bytes = Buffer.from(text.slice(0, start) + '\n}\n');
  }
  if (file === 'skills/archer.json') {
    for (const skill of hunterBefore128) {
      const oldSkill = JSON.stringify(skill, null, 2).split('\n').map(line => '    ' + line).join('\n');
      bytes = Buffer.from(bytes.toString().replace(new RegExp('^    \\{\\n      "id": "' + skill.id + '"[\\s\\S]*?\\n    \\}', 'm'), oldSkill));
    }
  }
  if (!['progression.json', 'equipment.json', 'daily-bosses.json', 'skills/acolyte.json'].includes(file)) return bytes;
  if (file === 'skills/acolyte.json') {
    // Keep unrelated source formatting (including 7.0 vs 7) byte-identical.
    const oldSkill = JSON.stringify(sanctuaryBefore127, null, 2).split('\n').map(line => '    ' + line).join('\n');
    return Buffer.from(bytes.toString().replace(/^    \{\n      "id": "priest_sanctuary"[\s\S]*?\n    \}/m, oldSkill));
  }
  const value = JSON.parse(bytes.toString('utf8'));
  if (file === 'progression.json') {
    delete value.hi_class;
    // The original Class2 contract remains explicitly frozen; live release has its own gate tests.
    value.release.id = 'class2-v1'; value.release.level_cap = 70; value.release.enabled_job_stages = [1, 2];
    value.release.future_job_stages[0].enabled = false;
    if (!value.release.excluded_features.includes('awakening')) value.release.excluded_features.unshift('awakening');
    value.promotion.hi_class_enabled = false;
    delete value.initial_state.wallet.awakening_shard;
    value.resources=value.resources.filter((r:{id:string})=>r.id!=='awakening_shard');
  }
  else if(file==='daily-bosses.json')for(const boss of value.bosses)delete boss.hi_class_awakening_reward;
  else {
    const progression = JSON.parse(readFileSync(new URL('../../plan/data/progression.json', import.meta.url), 'utf8'));
    for (const row of progression.hi_class.job_advancements) delete value.weapon_compatibility[row.job_id];
  }
  return Buffer.from(JSON.stringify(value, null, 2) + '\n');
}
