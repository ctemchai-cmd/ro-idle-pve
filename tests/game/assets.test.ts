import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { locateAsset, locateSkillVisual, prepareAssetLookup } from '../../src/renderer/asset-locator.ts';
import { AssetPack } from '../../src/renderer/pack.ts';
import type { RuntimeAssetIndex } from '../../src/contracts/assets.ts';
const index = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetIndex;
test('152prepared player and8borrowed enemy skill IDs resolve icon/recipe/audio plus native StormGust', () => {
  assert.equal(Object.keys(index.skills).length, 160);
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
test('immutable pack lookup agrees with the uncached resolver for every ID and metadata path', () => {
  const prepared = structuredClone(index);
  const refs = Object.values(index.assets).flatMap(asset => [asset.id, asset.meta_path, 'assets/ro/' + asset.meta_path]);
  const expected = refs.map(ref => locateAsset(index, ref));
  prepareAssetLookup(prepared);
  refs.forEach((ref, i) => {
    assert.deepEqual(locateAsset(prepared, ref), expected[i]);
    assert.equal(locateAsset(prepared, ref), locateAsset(prepared, ref));
  });
  assert.throws(() => locateAsset(prepared, '../library/catalog.json'), /UNKNOWN/);
  assert.throws(() => locateAsset(prepared, 'missing'), /UNKNOWN/);
  assert.ok(Object.isFrozen(prepared.files) && Object.isFrozen(prepared.assets));
  const alias = Object.values(index.assets)[0]!;
  const collision = structuredClone(index);
  Object.assign(collision.assets, { [alias.meta_path]: { ...alias, id: alias.meta_path } });
  prepareAssetLookup(collision);
  locateAsset(collision, alias.id);
  assert.equal(locateAsset(collision, alias.meta_path).id, alias.meta_path, 'ID precedence is retained even when another asset has that metadata path');
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
