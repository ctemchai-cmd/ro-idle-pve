import { useEffect, useState } from 'react';
import type { DamageElement } from '../client/elements.ts';
import type { AssetPack } from '../renderer/pack.ts';
import { shellVisuals } from '../renderer/shell.ts';
/** Asset-backed elemental illustrations, independent of matchups. */
export function ElementGlyph({ element, pack }: { element: DamageElement; pack?: AssetPack | null }) {
 const id=pack?shellVisuals(pack.index).element_icons?.[element]?.asset_id:undefined;
 const [image,setImage]=useState<{id:string;url:string}|null>(null);
 useEffect(()=>{let active=true;if(id&&pack)void pack.iconUrl(id).then(url=>{if(active)setImage({id,url});}).catch(()=>{});return()=>{active=false;};},[id,pack]);
 return <span className={`element-symbol element-${element}`} aria-hidden="true" data-element-icon={element} data-asset-id={id}>{image?.id===id&&image&&<img src={image.url} alt="" />}</span>;
}
