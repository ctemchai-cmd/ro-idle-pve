import {workshopBytes} from './legacy-workshop-scope.ts';
import {legacyTowerDocumentBytes} from './legacy-tower-rewards-scope.ts';
import { readFileSync } from 'node:fs';
import {createHash} from 'node:crypto';
import {assertD179File} from './legacy-magic-card-scope.ts';
import {gunzipSync} from 'node:zlib';
import roleSpec from '../../plan/generators/skill-distinctness.json';
import rankBefore136 from './fixtures/skill-rank-before-136.json';
import tuning131 from './fixtures/boss-focus-131.json';
import sanctuaryBefore127 from './fixtures/sanctuary-before-127.json';
import hunterBefore128 from './fixtures/hunter-before-128.json';
/** Frozen scope checks retain all historical bytes except separately tested D154/D157 changes. */
export function legacyClass2Source(file: string): Buffer {
  if(file==='tower.json')return legacyTowerDocumentBytes('plan/data/'+file);
  let bytes = workshopBytes('plan/data/'+file);
  if(['cards.json','gacha.json','strings.th.json'].includes(file)){
    const old=readFileSync(new URL(`../../plan/evidence/task-155/before-${file}`,import.meta.url));
    assertD179File('plan/data/'+file,createHash('sha256').update(old).digest('hex'));bytes=old;
  }
  if (file.startsWith('skills/')) {
    const roleBefore=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-142/authored-before.json.gz',import.meta.url))).toString())as Record<string,string>;
    for(const id of Object.keys(roleSpec.updates)){
      const pattern=new RegExp('^    \\{\\n      "id": "'+id+'"[\\s\\S]*?\\n    \\}','m'),old=roleBefore['plan/data/'+file]!.match(pattern)?.[0];
      if(old)bytes=Buffer.from(bytes.toString().replace(pattern,old));
    }
    // TASK123 appends inactive High programs/prices; preserve the original Class2 bytes.
    const text = bytes.toString(), start = text.indexOf(',\n  \"hi_class_skills\"');
    if (start >= 0) bytes = Buffer.from(text.slice(0, start) + '\n}\n');
    // D161's exact power/focus changes have their own frozen arithmetic and A/B
    // tests. Restore only those skill rows for historical asset-only scope checks.
    const baseline=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-131/authored-before.json.gz',import.meta.url))).toString())as Record<string,string>;
    // D165 only updates authored example ranks/budgets/traces; old asset scope retains the original example block.
    const buildPattern=/"builds": \[[\s\S]*?\n  \]/;
    const oldBuilds=baseline['plan/data/'+file]!.match(buildPattern)?.[0];
    if(oldBuilds)bytes=Buffer.from(bytes.toString().replace(buildPattern,oldBuilds));
    for(const s of [...tuning131.skills,...'assassin_enchant_poison knight_battle_cry priest_impositio merchant_loud_voice blacksmith_weapon_perfection bard_battle_song'.split(' ').map(id=>({id}))]){
      const pattern=new RegExp('^    \\{\\n      "id": "'+s.id+'"[\\s\\S]*?\\n    \\}','m'),original=baseline['plan/data/'+file]!.match(pattern)?.[0];
      if(original)bytes=Buffer.from(bytes.toString().replace(pattern,original));
    }
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
    value.skill_cap_contract=rankBefore136.skill_cap_contract;
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
    // D172 appends two tested equipment tiers. Normalize only these named additions
    // for older byte-scope oracles; high-gear.test.ts checks all144 old definitions.
    const original=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-148/before-authored.json.gz',import.meta.url))).toString()).equipment;
    value.definitions=value.definitions.filter((row:{tier_level:number})=>row.tier_level<=60);
    const ids=new Set(value.definitions.map((row:{presentation_id:string})=>row.presentation_id));
    value.presentations=value.presentations.filter((row:{id:string})=>ids.has(row.id));
    value.future_definitions=original.future_definitions;value.future_tiers=original.future_tiers;
    delete value.random_options.tier_scale['80'];delete value.random_options.tier_scale['100'];
    const progression = JSON.parse(readFileSync(new URL('../../plan/data/progression.json', import.meta.url), 'utf8'));
    for (const row of progression.hi_class.job_advancements) delete value.weapon_compatibility[row.job_id];
  }
  return Buffer.from(JSON.stringify(value, null, 2) + '\n');
}
