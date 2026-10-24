import test from 'node:test';
import assert from 'node:assert/strict';
import rawJson from '../../src/generated/content.json';
import invalidJson from './fixtures/composition-invalid.json';
import composition from '../../plan/data/composition-cases.json';
import { validateContent } from '../../src/content/loader.ts';
import { loadValidatedContent } from '../../src/content/index.ts';
import { ContentValidator, InvalidContent } from '../../src/content/validation.ts';
import { applySkillPatches } from '../../src/domain/build/patches.ts';
import type { RawContent } from '../../src/content/model.ts';
import type { ObjectValue } from '../../src/content/value.ts';
const raw = rawJson as unknown as RawContent;
const validator = new ContentValidator(raw.schemas);
for (const file of ['status-effects.json', 'class-status-effects.json']) for (const row of raw.documents[file]!.statuses as unknown as ObjectValue[]) validator.statuses[String(row.id)] = row;
for (const row of raw.documents['stat-definitions.json']!.stats as unknown as ObjectValue[]) validator.stats[String(row.id)] = row;
// Reviewed negative cases intentionally use no fixture actor registry.
const location = { source: 'negative fixture', definition_id: 'fixture_bash', path: '' };

test('all release catalogs load, are immutable, and expose gameplay counts', () => {
  const result = loadValidatedContent(); assert.ok(result.ok);
  assert.equal(Object.keys(result.value.skills).length, 171); //152 player +19 enemy programs
  assert.equal(Object.keys(result.value.items).length, 217); // D-122: 144 equipment + 73 cards
  assert.equal(Object.keys(result.value.statuses).length, 41);
  for(const id of ['awaken_skill_power','awaken_penetration','awaken_healing_received'])assert.ok(result.value.statuses[id]);
  assert.throws(() => { (result.value.skills['swordsman_bash'] as unknown as ObjectValue).id = 'corrupted'; }, TypeError);
  assert.equal((raw.documents['skills/swordsman.json']!.skills as unknown as ObjectValue[])[0]!.id, 'swordsman_bash');
});

for (const fixture of invalidJson) test(`reject reviewed input: ${fixture.id}`, () => {
  const definition = structuredClone(fixture.definition) as unknown as ObjectValue;
  if (fixture.kind === 'patches') {
    const result = applySkillPatches(definition, fixture.patches as unknown as ObjectValue[], raw);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.errors[0]!.code, fixture.expected_error);
  } else {
    assert.throws(() => validator.definition(fixture.kind as 'skill' | 'status' | 'item', definition, location), (error: unknown) => {
      assert.ok(error instanceof InvalidContent);
      assert.equal(error.issue.code, fixture.expected_error === 'unsafe_number' ? 'unsafe_json' : fixture.expected_error);
      assert.equal(error.issue.source, location.source);
      assert.equal(error.issue.definition_id, location.definition_id);
      return true;
    });
  }
});

test('reject NaN before schema or formula evaluation', () => {
  const skill = structuredClone(composition.fixtures.skills[0]) as unknown as ObjectValue;
  skill.max_level = NaN;
  assert.throws(() => validator.definition('skill', skill, location), (error: unknown) => error instanceof InvalidContent && error.issue.code === 'unsafe_json');
});
test('prototype properties cannot masquerade as target bindings', () => {
  const skill = structuredClone(composition.fixtures.skills[0]) as unknown as ObjectValue;
  (skill.effects as ObjectValue[])[0]!.target = 'constructor';
  assert.throws(() => validator.definition('skill', skill, location), (error: unknown) => error instanceof InvalidContent && error.issue.code === 'unknown_binding');
});
test('field errors identify originating definition/effect and JSON pointer', () => {
  const skill = structuredClone(composition.fixtures.skills[0]) as unknown as ObjectValue;
  const effect = (skill.effects as unknown as ObjectValue[])[0]!;
  (effect.formula as unknown as ObjectValue).id = 'unknown';
  assert.throws(() => validator.definition('skill', skill, location), (error: unknown) => {
    assert.ok(error instanceof InvalidContent);
    assert.equal(error.issue.effect_id, 'hit'); assert.match(error.issue.path, /effects\/0/); return true;
  });
});
test('loader reports duplicate definitions and invalid document versions', () => {
  const duplicate = structuredClone(raw);
  const skills = duplicate.documents['skills/swordsman.json']!.skills as unknown as ObjectValue[];
  skills.push(structuredClone(skills[0]!));
  let result = validateContent(duplicate); assert.ok(!result.ok); assert.ok(result.errors.some(issue => issue.code === 'duplicate_id'));
  duplicate.documents['skills/swordsman.json']!.content_version = 'unreviewed';
  result = validateContent(duplicate); assert.ok(!result.ok); assert.ok(result.errors.some(issue => issue.code === 'content_version'));
});
test('variants use stable IDs and preserve other actors/shared base', () => {
  const base = validator.resolve(composition.fixtures.skills[0] as unknown as ObjectValue, { power: 2 }) as unknown as ObjectValue;
  const before = JSON.stringify(base);
  const result = applySkillPatches(base, composition.variant_cases.patches as unknown as ObjectValue[], raw); assert.ok(result.ok);
  assert.equal(JSON.stringify(base), before);
  const effects = result.value.effects as unknown as ObjectValue[];
  assert.equal(((effects[0]!.formula as unknown as ObjectValue).params as unknown as ObjectValue).attack_ratio, 2.6);
  assert.equal(effects.length, 3);
});

test('slot catalogs reject missing presets and invalid modifier units/buckets before gameplay builds',()=>{
 for(const kind of ['missing','bucket','unit']as const){const changed=structuredClone(raw),slots=changed.documents['slot-progress.json'] as unknown as{enchant:{slot_lines:Record<string,Record<string,{modifiers:{bucket:string;op:string}[]}>>}};
  if(kind==='missing')delete slots.enchant.slot_lines.weapon!.offense;
  else if(kind==='bucket')slots.enchant.slot_lines.weapon!.precision!.modifiers[1]!.bucket='derived';
  else slots.enchant.slot_lines.weapon!.precision!.modifiers[1]!.op='add_percent';
  const result=validateContent(changed);assert.equal(result.ok,false);if(!result.ok)assert.ok(result.errors.some(e=>e.source==='slot-progress.json'&&e.code==={missing:'enchant_lines',bucket:'modifier_bucket',unit:'modifier_unit'}[kind]));
 }
});

// D138 reusable composition: success refers to an earlier interrupt on this same binding.
test('D138 rejects invalid success references and contradictory guaranteed-crit policy', () => {
 const source=structuredClone((raw.documents['skills/mage.json']!.skills as unknown as ObjectValue[]).find(s=>s.id==='sage_spell_breaker')!);
 const effect=(source.effects as ObjectValue[])[1]!;
 for(const [id,target]of [['missing','foe'],['interrupt','foes']]){
  const broken=structuredClone(source),e=(broken.effects as ObjectValue[])[1]!;e.when={type:'effect_succeeded',effect_id:id!,scope:'same_target'};e.target=target!;
  assert.throws(()=>validator.definition('skill',broken,location),InvalidContent);
 }
 assert.equal((effect.when as ObjectValue).type,'effect_succeeded');
 const broken=structuredClone(source),e=(broken.effects as ObjectValue[])[1]!;e.critical_rule='always';e.can_crit=false;
 assert.throws(()=>validator.definition('skill',broken,location),InvalidContent);
});


test('D141 rejects missing ranks/prices, invalid pity targets and malformed socket gates before gameplay',()=>{
 for(const kind of ['rank','price','pity_target','pity_bonus','socket_zero','socket_order','socket_count']as const){
  const changed=structuredClone(raw),slots=changed.documents['slot-progress.json'] as unknown as {refine:{success_chance_by_target:Record<string,number>;upgrade_rows:unknown[];pity:{bonus_per_failure_by_target:Record<string,number>}};cards:{capacity_by_refine:{minimum_refine:number;slots:number}[]}};
  if(kind==='rank')delete slots.refine.success_chance_by_target['15'];
  if(kind==='price')slots.refine.upgrade_rows.pop();
  if(kind==='pity_target')slots.refine.pity.bonus_per_failure_by_target['16']=.005;
  if(kind==='pity_bonus')slots.refine.pity.bonus_per_failure_by_target['15']=-.1;
  if(kind==='socket_zero')slots.cards.capacity_by_refine[0]!.minimum_refine=1;
  if(kind==='socket_order')slots.cards.capacity_by_refine[2]!.minimum_refine=5;
  if(kind==='socket_count')slots.cards.capacity_by_refine[3]!.slots=4;
  const result=validateContent(changed);assert.equal(result.ok,false,kind);if(!result.ok)assert.ok(result.errors.some(e=>e.source==='slot-progress.json'),kind);
 }
});
