import type { AssetLocation, RuntimeAsset, RuntimeAssetIndex } from '../contracts/assets.ts';

type Lookup = { paths: Set<string>; meta: Map<string, RuntimeAsset>; locations: Map<string, AssetLocation> };
const lookups = new WeakMap<RuntimeAssetIndex, Lookup>();
/** A runtime pack is immutable. Index it once instead of scanning hundreds of files per UI icon. */
export function prepareAssetLookup(index: RuntimeAssetIndex): void {
  if (lookups.has(index)) return;
  for (const asset of Object.values(index.assets)) Object.freeze(asset);
  for (const file of index.files) Object.freeze(file);
  Object.freeze(index.assets); Object.freeze(index.files); Object.freeze(index);
  lookups.set(index, { paths: new Set(index.files.map(file => file.path)), meta: new Map(Object.values(index.assets).map(asset => [asset.meta_path, asset])), locations: new Map() });
}

const normalize = (path: string) => path.replace(/^assets\/ro\//, '');
function url(index: RuntimeAssetIndex, path: string): string {
  if (path.startsWith('/') || path.split('/').includes('..') || !(lookups.get(index)?.paths.has(path) ?? index.files.some(file => file.path === path))) throw new TypeError(`UNKNOWN_RUNTIME_PATH:${path}`);
  if (index.base_url !== `/ro/${index.pack_hash}/` || !/^[a-f0-9]{64}$/.test(index.pack_hash)) throw new TypeError('INVALID_ASSET_PACK_URL');
  return index.base_url + path.split('/').map(encodeURIComponent).join('/');
}
/** Resolve sidecar/media independently. Shared media never implies a sidecar name. */
export function locateAsset(index: RuntimeAssetIndex, idOrMeta: string): AssetLocation {
  const ref = normalize(idOrMeta);
  const lookup = lookups.get(index), previous = lookup?.locations.get(ref);
  if (previous) return previous;
  const asset = (Object.hasOwn(index.assets, ref) ? index.assets[ref] : undefined) ?? (lookup ? lookup.meta.get(ref) : Object.values(index.assets).find(row => row.meta_path === ref));
  if (!asset) throw new TypeError(`UNKNOWN_RUNTIME_ASSET:${idOrMeta}`);
  const collection = asset.meta_path.startsWith('library/') ? 'library/' : asset.meta_path.startsWith('prepared/') ? 'prepared/' : '';
  const location = Object.freeze({ id: asset.id, metaUrl: url(index, asset.meta_path), mediaUrl: url(index, asset.media_path), collectionBaseUrl: index.base_url + collection });
  lookup?.locations.set(ref, location);
  return location;
}
export function locateSkillVisual(index: RuntimeAssetIndex, skillId: string) {
  const reference = Object.hasOwn(index.skills, skillId) ? index.skills[skillId] : undefined;
  const presentation = reference && index.presentations[reference.presentation_id];
  if (!presentation) throw new TypeError(`UNKNOWN_SKILL_PRESENTATION:${skillId}`);
  const sourceSkillId = presentation.visual.reference_skill_id;
  const recipe = index.recipes.find(row => row.skill_id === sourceSkillId);
  if (!recipe?.ready) throw new TypeError(`UNAVAILABLE_SKILL_RECIPE:${skillId}`);
  return { icon: locateAsset(index, presentation.icon_meta_path), recipe,
    nativeEffect: recipe.native_effect ? locateAsset(index, recipe.native_effect.meta) : null,
    sounds: presentation.sound_meta_paths.map(meta => locateAsset(index, meta)) };
}
