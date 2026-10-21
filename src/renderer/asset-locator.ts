import type { AssetLocation, RuntimeAssetIndex } from '../contracts/assets.ts';

const normalize = (path: string) => path.replace(/^assets\/ro\//, '');
function url(index: RuntimeAssetIndex, path: string): string {
  if (path.startsWith('/') || path.split('/').includes('..') || !index.files.some(file => file.path === path)) throw new TypeError(`UNKNOWN_RUNTIME_PATH:${path}`);
  if (index.base_url !== `/ro/${index.pack_hash}/` || !/^[a-f0-9]{64}$/.test(index.pack_hash)) throw new TypeError('INVALID_ASSET_PACK_URL');
  return index.base_url + path.split('/').map(encodeURIComponent).join('/');
}
/** Resolve sidecar/media independently. Shared media never implies a sidecar name. */
export function locateAsset(index: RuntimeAssetIndex, idOrMeta: string): AssetLocation {
  const ref = normalize(idOrMeta);
  const asset = (Object.hasOwn(index.assets, ref) ? index.assets[ref] : undefined) ?? Object.values(index.assets).find(row => row.meta_path === ref);
  if (!asset) throw new TypeError(`UNKNOWN_RUNTIME_ASSET:${idOrMeta}`);
  const collection = asset.meta_path.startsWith('library/') ? 'library/' : asset.meta_path.startsWith('prepared/') ? 'prepared/' : '';
  return { id: asset.id, metaUrl: url(index, asset.meta_path), mediaUrl: url(index, asset.media_path), collectionBaseUrl: index.base_url + collection };
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
