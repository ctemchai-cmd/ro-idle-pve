import type { ImpactEffect } from '../contracts/assets.ts';
import { drawEffect, drawParts, frameAt, type NativeAsset } from './native.mjs';

/** Presentation adapter only. Every layer references decoded local RO media. */
export interface NativeTextureLayer {
  meta: string;
  delay_ms: number; duration_ms: number; count: number;
  interval_ms: number; alpha: number; fade_in: boolean; fade_out: boolean;
  from: readonly [number, number]; to: readonly [number, number];
  size: readonly [number, number]; end_size: readonly [number, number];
  angle: number; spread: number; radial: boolean; additive: boolean;
}
export interface NativeImpactProfile extends ImpactEffect {
  native_only?: boolean;
  texture_layers?: readonly NativeTextureLayer[];
  once_per_action?: boolean;
  persistent?: boolean;
  link_texture_meta?: string;
  basis?: string;
}
export interface LoadedNativeImpact {
  config: NativeImpactProfile;
  asset: NativeAsset;
  textures: ReadonlyMap<string, NativeAsset>;
}
const pair = (v: readonly number[]) => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite);
export function nativeImpactProfile(value: ImpactEffect): NativeImpactProfile {
  const p = value as NativeImpactProfile;
  if (p.texture_layers !== undefined) {
    if (!Array.isArray(p.texture_layers) || !p.texture_layers.length || p.texture_layers.length > 32) throw Error('INVALID_NATIVE_TEXTURE_LAYERS');
    for (const l of p.texture_layers) {
      if (!l.meta?.endsWith('.meta.json') || ![l.delay_ms,l.duration_ms,l.count,l.interval_ms,l.alpha,l.angle,l.spread].every(Number.isFinite) ||
          l.delay_ms < 0 || l.duration_ms < 1 || l.duration_ms > 10000 || !Number.isInteger(l.count) || l.count < 1 || l.count > 64 ||
          l.interval_ms < 0 || l.alpha < 0 || l.alpha > 1 || l.spread < 0 || ![l.from,l.to,l.size,l.end_size].every(pair) ||
          [...l.size,...l.end_size].some(v=>v<0||v>2000) ||
          ![l.fade_in,l.fade_out,l.radial,l.additive].every(v=>typeof v==='boolean')) throw Error('INVALID_NATIVE_TEXTURE_LAYER');
    }
  }
  if (p.link_texture_meta !== undefined && !p.link_texture_meta.endsWith('.meta.json')) throw Error('INVALID_NATIVE_LINK_TEXTURE');
  return p;
}
export function nativeImpactDuration(p: NativeImpactProfile, asset: NativeAsset): number {
  const strLength=asset.meta.effect ? asset.meta.effect.max_key / Math.max(1,asset.meta.effect.fps) * 1000 : 0;
  const natural = p.texture_layers
    ? Math.max(strLength,...p.texture_layers.map(l=>l.delay_ms+l.duration_ms+(l.count-1)*l.interval_ms))
    : strLength;
  return Math.min(natural,p.duration_ms??Infinity);
}
/** No wall clock/global RNG, gameplay calls, particle shapes or replacement art. */
export function drawNativeImpact(ctx: CanvasRenderingContext2D, loaded: LoadedNativeImpact, elapsed: number, x: number, y: number): number {
  const p=loaded.config;
  if (!p.texture_layers) return drawEffect(ctx,loaded.asset,elapsed,x,y,p.scale);
  let draws=loaded.asset.meta.effect?drawEffect(ctx,loaded.asset,elapsed,x,y,p.scale):0;
  ctx.save(); ctx.translate(x,y); ctx.scale(p.scale,p.scale);
  for (const l of p.texture_layers) {
    const asset=loaded.textures.get(l.meta); if (!asset) throw Error('NATIVE_TEXTURE_NOT_PREPARED');
    for(let i=0;i<l.count;i++) {
      const time=elapsed-l.delay_ms-i*l.interval_ms; if(time<0||time>=l.duration_ms)continue;
      const t=time/l.duration_ms, alpha=l.alpha*(l.fade_in?Math.min(1,t*4):1)*(l.fade_out?Math.min(1,(1-t)*3):1);
      const angle=(l.angle+(l.radial?360*i/l.count:0))*Math.PI/180;
      const dx=l.from[0]+(l.to[0]-l.from[0])*t+Math.cos(i*2.399963)*l.spread;
      const dy=l.from[1]+(l.to[1]-l.from[1])*t+Math.sin(i*2.399963)*l.spread;
      const w=l.size[0]+(l.end_size[0]-l.size[0])*t,h=l.size[1]+(l.end_size[1]-l.size[1])*t;
      ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation=l.additive?'lighter':'source-over';ctx.translate(dx,dy);ctx.rotate(angle);
      const action=asset.meta.animation?.actions?.[0];
      if(action){const sample=frameAt(action,time),rects=asset.meta.sprite_sheet!.frames,nativeWidth=Math.max(...rects.map(r=>r[2]??1));ctx.scale(w/nativeWidth,w/nativeWidth);draws+=drawParts(ctx,asset,sample.frame);}
      else{ctx.drawImage(asset.image,-w/2,-h/2,w,h);draws++;}
      ctx.restore();
    }
  }
  ctx.restore();return draws;
}
