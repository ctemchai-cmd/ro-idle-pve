import { useEffect,useState } from 'react';
import type { AssetPack } from '../renderer/pack.ts';
import { locateSkillVisual } from '../renderer/asset-locator.ts';
import { Icon } from './icon.tsx';
export function SkillIcon({id,pack}:{id:string;pack:AssetPack|null}){
 const [loaded,setLoaded]=useState<{id:string;pack:AssetPack;url:string}|null>(null);
 const url=pack?.icons.get(id)??(loaded?.id===id&&loaded.pack===pack?loaded.url:null);
 useEffect(()=>{let active=true;if(pack&&!pack.icons.has(id)){try{void pack.iconUrl(locateSkillVisual(pack.index,id).icon.id).then(url=>{pack.icons.set(id,url);if(active)setLoaded({id,pack,url});}).catch(()=>{});}catch{/* Nonvisual enemy programs keep a neutral fallback. */}}return()=>{active=false;};},[pack,id]);
 return url?<img className="skill-icon" src={url} alt=""/>:<span className="skill-icon skill-glyph" aria-hidden="true"><Icon name="sparkles"/></span>;
}
