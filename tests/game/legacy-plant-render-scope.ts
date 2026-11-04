import { readFileSync } from 'node:fs';
import { bossProfileSourceBytes } from './legacy-boss-profile-scope.ts';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const directory = 'plan/evidence/plant-render-20261104/';
const before = JSON.parse(gunzipSync(readFileSync(directory + 'before.json.gz')).toString()) as Record<string, string>;
const after = JSON.parse(readFileSync(directory + 'source-after.json', 'utf8')) as Record<string, string>;
export function plantRenderSourceBytes(file: string) {
  const bytes = bossProfileSourceBytes(file);
  if (after[file] && before[file]) {
    assert.equal(createHash('sha256').update(bytes).digest('hex'), after[file], file + ' reviewed native plant presentation');
    return Buffer.from(before[file]);
  }
  return bytes;
}
export function withoutPlantRenderPack<T>(value: T): T {
  const file = 'runtime/ro/manifest.json';
  assert.deepEqual(value, JSON.parse(readFileSync(file, 'utf8')), 'exact native plant runtime pack');
  return JSON.parse(plantRenderSourceBytes(file).toString());
}
