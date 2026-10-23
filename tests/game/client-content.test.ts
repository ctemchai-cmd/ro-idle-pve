import test from 'node:test';
import assert from 'node:assert/strict';
import { loadValidatedContent } from '../../src/client/content.ts';
import { loadValidatedContent as fullyValidatedContent, validateContent } from '../../src/content/index.ts';

test('browser definitions are deeply immutable and shared; separately supplied content is still validated independently', () => {
  const first = loadValidatedContent(), second = loadValidatedContent();
  assert.ok(first.ok && second.ok);
  assert.equal(first.value, second.value);
  const fullyChecked = fullyValidatedContent();
  assert.ok(fullyChecked.ok);
  assert.deepEqual(first.value, fullyChecked.value, 'Build-owned client indexing must exactly match the full schema/semantic validator');
  const id = Object.keys(first.value.skills)[0]!;
  const original = first.value.skills[id]!.id;
  assert.throws(() => { (first.value.skills[id] as { id: string }).id = 'changed'; }, TypeError);
  assert.equal(second.value.skills[id]!.id, original);
  const bad = { manifest: structuredClone(first.value.manifest), documents: structuredClone(first.value.documents), schemas: structuredClone(first.value.schemas) };
  delete (bad.documents as Record<string, unknown>)['skills/mage.json'];
  assert.equal(validateContent(bad).ok, false);
  assert.equal(loadValidatedContent().ok, true);
});
