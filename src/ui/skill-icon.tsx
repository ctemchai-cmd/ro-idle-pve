import { useEffect,useState } from 'react';
import type { AssetPack } from '../renderer/pack.ts';
import { locateAsset,locateSkillVisual } from '../renderer/asset-locator.ts';
import { Icon } from './icon.tsx';
export function SkillIcon({id,pack,awakened=false,fallbackMeta}:{id:string;pack:AssetPack|null;awakened?:boolean;fallbackMeta?:string}){
 const [loaded,setLoaded]=useState<{id:string;pack:AssetPack;url:string}|null>(null);
 const url=pack?.icons.get(id)??(loaded?.id===id&&loaded.pack===pack?loaded.url:null);
 useEffect(()=>{let active=true;if(pack&&!pack.icons.has(id)){try{void pack.iconUrl(fallbackMeta?locateAsset(pack.index,fallbackMeta).id:locateSkillVisual(pack.index,id).icon.id).then(url=>{pack.icons.set(id,url);if(active)setLoaded({id,pack,url});}).catch(()=>{});}catch{/* Nonvisual enemy programs keep a neutral fallback. */}}return()=>{active=false;};},[pack,id,fallbackMeta]);
 if(url&&awakened)return <span className="skill-icon awakened" data-awakened="true"><img src={url} alt=""/></span>;
 return url?<img className="skill-icon" src={url} alt=""/>:<span className={`skill-icon skill-glyph ${awakened?'awakened':''}`} aria-hidden="true"><Icon name="sparkles"/></span>;
}
