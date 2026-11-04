import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { plantRenderSourceBytes } from './legacy-plant-render-scope.ts';

const directory = 'plan/evidence/plant-descriptions-20261104/';
const before = JSON.parse(readFileSync(directory + 'before.json', 'utf8')) as Record<string, string>;
const after = JSON.parse(readFileSync(directory + 'source-after.json', 'utf8')) as Record<string, string>;
/** Only this reviewed description change is projected out of older source-scope proofs. */
export function plantDescriptionSourceBytes(file: string) {
  const bytes = plantRenderSourceBytes(file);
  if (after[file] && before[file]) {
    assert.equal(createHash('sha256').update(bytes).digest('hex'), after[file], file + ' reviewed plant descriptions');
    return Buffer.from(before[file]);
  }
  return bytes;
}
