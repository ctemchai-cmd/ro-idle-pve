import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectSource, checkWorkspace } from '../../scripts/game/check-boundaries.ts';
test('actual source respects ownership and dependency directions', () => assert.deepEqual(checkWorkspace(), []));
for (const [name, file, source, code] of [
  ['DOM', 'src/domain/combat/violation.ts', 'export const x = document.createElement("canvas")', 'pure_global'],
  ['clock alias', 'src/domain/math/violation.ts', 'const clock = Date; export const x = new clock()', 'pure_global'],
  ['random alias', 'src/domain/combat/violation.ts', 'const roll = Math.random; export const x = roll()', 'nondeterministic'],
  ['computed random', 'src/domain/combat/violation.ts', 'export const x = Math["random"]()', 'computed_math'],
  ['fetch', 'src/domain/rewards/violation.ts', 'export const x = fetch("/")', 'pure_global'],
  ['external side effect', 'src/domain/combat/violation.ts', 'import "@supabase/supabase-js"', 'pure_external'],
  ['transitive UI', 'src/domain/combat/violation.ts', 'export * from "../../ui/main.tsx"', 'module_import'],
  ['UI DB', 'src/ui/violation.ts', 'import { x } from "../server/persistence/x.ts"', 'module_import'],
  ['dynamic bypass', 'src/domain/combat/violation.ts', 'const x = "react"; export const y = import(x)', 'dynamic_import'],
  ['locale order', 'src/domain/combat/violation.ts', 'export const y = "x".localeCompare("y")', 'nondeterministic'],
] as const) test(`boundary rejects ${name}`, () => assert.ok(inspectSource(file, source).some(issue => issue.code === code)));
test('pure combat can be imported in Node without browser/DB', async () => {
  assert.equal('document' in globalThis, false);
  const combat = await import('../../src/domain/combat/index.ts');
  assert.equal(typeof combat.createBattle, 'function');
  assert.equal(typeof combat.advanceUntil, 'function');
});
