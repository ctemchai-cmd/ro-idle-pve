import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { locateAsset, locateSkillVisual } from '../../src/renderer/asset-locator.ts';
import { AssetPack } from '../../src/renderer/pack.ts';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
const index = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetIndex;
test('126player and6borrowed enemy skill IDs resolve icon/recipe/audio plus native StormGust', () => {
  assert.equal(Object.keys(index.skills).length, 132);
  for (const id of Object.keys(index.skills)) {
    const visual = locateSkillVisual(index, id);
    assert.ok(visual.icon.metaUrl.startsWith(index.base_url));
    assert.ok(visual.recipe.ready);
    assert.ok(visual.sounds.length > 0 && visual.sounds.every(sound => sound.mediaUrl.startsWith(index.base_url)), id);
  }
  assert.ok(locateSkillVisual(index, 'wizard_storm_gust').nativeEffect);
});
test('every selected asset resolves distinct metadata/media paths', () => {
  for (const id of Object.keys(index.assets)) {
    const asset = locateAsset(index, id);
    assert.ok(asset.metaUrl.endsWith('.meta.json'));
    assert.notEqual(asset.metaUrl, asset.mediaUrl);
  }
});
test('unknown IDs and traversal do not fall back to external or guessed files', () => {
  assert.throws(() => locateAsset(index, '../library/catalog.json'), /UNKNOWN/);
  assert.throws(() => locateAsset(index, 'missing'), /UNKNOWN/);
  assert.throws(() => locateSkillVisual(index, 'missing'), /UNKNOWN/);
});
test('a browser bundle cannot silently use an asset pack from another release', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json(index);
  try {
    await assert.rejects(AssetPack.open('0'.repeat(64)), /INCOMPATIBLE_RUNTIME_ASSET_PACK/);
    await assert.rejects(AssetPack.open(null), /INCOMPATIBLE_RUNTIME_ASSET_PACK/);
    assert.equal((await AssetPack.open(index.pack_hash)).index.pack_hash, index.pack_hash);
  } finally { globalThis.fetch = original; }
});
