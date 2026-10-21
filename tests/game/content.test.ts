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
  assert.equal(Object.keys(result.value.skills).length, 137); // + enemy_cataclysm (D-067), enemy_doom, enemy_twin_hex (D-074)
  assert.equal(Object.keys(result.value.items).length, 204); // D-068: 144 equipment + 60 cards
  assert.equal(Object.keys(result.value.statuses).length, 27);
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
