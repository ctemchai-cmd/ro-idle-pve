import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadValidatedContent } from '../../src/content/index.ts';
import { ContentValidator } from '../../src/content/validation.ts';
import type { Json, ObjectValue } from '../../src/content/value.ts';
import { initializeAccount } from '../../src/domain/account/initialize.ts';
const result = loadValidatedContent(); if (!result.ok) throw new Error('Invalid fixture content');
const content = result.value;
const validator = new ContentValidator(structuredClone(content.schemas) as unknown as Record<string, ObjectValue>);
test('pure initial account matches the independent M0 mage fixture exactly', () => {
  const expected = JSON.parse(readFileSync('plan/data/account-initial-case.json', 'utf8')).account_state;
  const actual = initializeAccount(content, { root_job_id: 'mage', gender: 'male' }, '2026-10-19T00:00:00Z', '2026-10-19', 1);
  validator.shape('account-state', actual as unknown as Json, { source: 'initial account', path: '' });
  assert.deepEqual(actual, expected);
});
test('all six root choices and both genders create complete independent schema-valid starter states', () => {
  for (const root_job_id of ['swordsman', 'acolyte', 'archer', 'mage', 'thief', 'merchant'] as const) for (const gender of ['male', 'female'] as const) {
    const state = initializeAccount(content, { root_job_id, gender }, '2026-10-20T00:00:00Z', '2026-10-20', 42);
    validator.shape('account-state', state as unknown as Json, { source: root_job_id, path: '' });
    assert.equal(state.roster.length, 7); assert.equal(state.inventory.length, 0, 'D-059 starts with no equipment'); assert.ok(state.roster.every(actor => Object.values(actor.equipment).every(id => id === null)), 'every slot empty');
    assert.equal(state.roster[0].job_id, root_job_id); assert.equal(state.roster[0].gender, gender); assert.ok(!Object.hasOwn(state, 'account_id'));
    assert.equal(state.farm.reserved_through, '2026-10-20T00:00:00Z'); assert.equal(state.farm.loot_rng.state, 42);
    for (const actor of state.roster) { assert.equal(actor.level, 1); assert.equal(actor.primary_stats.agi, 1); assert.equal(actor.primary_stats.dex, 1); assert.equal(Object.keys(actor.skill_levels).length, 2); }
    state.roster[0].slot_progress.weapon.refine = 3; assert.equal(state.roster[1].slot_progress.weapon.refine, 0);
  }
});
