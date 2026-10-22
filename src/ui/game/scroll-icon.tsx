import type { AssetPack } from '../../renderer/pack.ts';
import { iconUrl } from './kit.tsx';

/** Native RO Elemental Converter artwork, presentation only. */
export function ScrollIcon({ element, pack }: { element: string; pack: AssetPack | null }) {
  const url = iconUrl(pack, 'feature_icons', 'scroll_' + element);
  return <span className={`scroll-icon element-${element}`} aria-hidden="true" data-scroll-element={element}>{url && <img src={url} alt="" />}</span>;
}
