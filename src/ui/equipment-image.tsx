import { useEffect, useState } from 'react';
import type { AssetPack } from '../renderer/pack.ts';
export function ItemImage({id,pack}:{id:string|null;pack:AssetPack|null}){
 const[url,setUrl]=useState<string|null>(null);
 useEffect(()=>{let active=true;setUrl(null);if(id&&pack)void pack.asset(id).then(a=>{if(active)setUrl(a.image.src);}).catch(()=>{});return()=>{active=false;};},[id,pack]);
 return url?<img src={url} alt=""/>:<span className="equipment-placeholder" aria-hidden="true">◇</span>;
}
