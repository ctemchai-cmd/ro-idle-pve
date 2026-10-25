import type { NativeAsset } from './native.mjs';

/** `incoming` is damage a party member takes (red, as RO shows it on your own characters). */
export type NumberKind = 'damage' | 'heal' | 'incoming' | 'total';
/** Pop upward, then drift upper-right. The same path serves every number kind;
 * neither hit order nor facing may reverse it. Presentation time only. */
export const NUMBER_FLIGHT_MS = 800;
export function numberFlight(elapsed: number): { dx: number; dy: number; size: number; alpha: number } {
  const time = Math.max(0, elapsed), p = Math.min(1, time / NUMBER_FLIGHT_MS);
  const lift = 1 - (1 - Math.min(1, time / 120)) ** 3, drift = Math.max(0, time - 80) / NUMBER_FLIGHT_MS;
  return { dx: 48 * drift, dy: -24 * lift - 36 * drift, size: 1.25 - .45 * p, alpha: p < .7 ? 1 : Math.max(0, 1 - (p - .7) / .3) };
}
export const NUMBER_CSS_HEIGHT = { damage:30, critical:38, total:38, heal:26, incoming:24 } as const;
export interface NumberDrawBounds {kind:NumberKind;critical:boolean;left:number;top:number;width:number;height:number}
/** Stable CSS size even when a portrait canvas squeezes a large world into320px. */
export function readableNumberScale(height:number,width:number,worldToCss:number,viewportWidth:number,kind:NumberKind,critical:boolean,size:number,pop:number):number {
  const desired=NUMBER_CSS_HEIGHT[critical?'critical':kind]*(1+pop*.18)*size;
  return Math.min(desired/height,viewportWidth*.70/width)/Math.max(.0001,worldToCss);
}
/** Native bitmap digits, cached as whole strings so a frame doesn't rebuild text. */
export class DamageNumbers {
  private readonly cache = new Map<string, HTMLCanvasElement>();
  constructor(private readonly font: NativeAsset, private readonly digitFrames: readonly number[], private readonly criticalFont: NativeAsset | null, private readonly criticalFrame: number) {}
  private text(amount: number, critical: boolean, kind: NumberKind): HTMLCanvasElement {
    const value = String(Math.max(0, Math.floor(amount))), key = `${value}:${critical}:${kind}`, heal = kind === 'heal';
    const cached = this.cache.get(key); if (cached) return cached;
    const rects = [...value].map(digit => this.font.meta.sprite_sheet!.frames[this.digitFrames[Number(digit)]!]!);
    const width = rects.reduce((sum, rect) => sum + rect[2]! - 1, 0) + 1;
    const canvas = document.createElement('canvas'); canvas.width = width + (heal ? 9 : 0); canvas.height = Math.max(...rects.map(rect => rect[3]!));
    const context = canvas.getContext('2d')!; context.imageSmoothingEnabled = false;
    let x = heal ? 9 : 0;
    if (heal) { const cy = Math.floor(canvas.height / 2); context.fillStyle = '#142a15'; context.fillRect(0, cy - 2, 8, 4); context.fillRect(2, cy - 4, 4, 8); context.fillStyle = '#8eff88'; context.fillRect(1, cy - 1, 6, 2); context.fillRect(3, cy - 3, 2, 6); }
    for (const rect of rects) { context.drawImage(this.font.image, rect[0]!, rect[1]!, rect[2]!, rect[3]!, x, 0, rect[2]!, rect[3]!); x += rect[2]! - 1; }
    if (critical) { const pixels = context.getImageData(0, 0, canvas.width, canvas.height); for (let i = 0; i < pixels.data.length; i += 4) { pixels.data[i + 1] = pixels.data[i + 1]! * .95; pixels.data[i + 2] = pixels.data[i + 2]! * .18; } context.putImageData(pixels, 0, 0); }
    if (heal) { const pixels = context.getImageData(0, 0, canvas.width, canvas.height); for (let i = 0; i < pixels.data.length; i += 4) { pixels.data[i] = pixels.data[i]! * .48; pixels.data[i + 2] = pixels.data[i + 2]! * .42; } context.putImageData(pixels, 0, 0); }
    if (kind === 'incoming') { const pixels = context.getImageData(0, 0, canvas.width, canvas.height); for (let i = 0; i < pixels.data.length; i += 4) { pixels.data[i + 1] = pixels.data[i + 1]! * .28; pixels.data[i + 2] = pixels.data[i + 2]! * .24; } context.putImageData(pixels, 0, 0); }
    if (kind === 'total') { const pixels = context.getImageData(0, 0, canvas.width, canvas.height); for (let i = 0; i < pixels.data.length; i += 4) { pixels.data[i + 1] = pixels.data[i + 1]! * .88; pixels.data[i + 2] = pixels.data[i + 2]! * .1; } context.putImageData(pixels, 0, 0); }
    this.cache.set(key, canvas); if (this.cache.size > 256) this.cache.delete(this.cache.keys().next().value!);
    return canvas;
  }
  /** `kind: true` is the older heal flag. `size` multiplies the base glyph scale (flight shrink). */
  draw(context: CanvasRenderingContext2D, amount: number, critical: boolean, x: number, y: number, elapsed: number, kind: NumberKind | boolean = 'damage', size = 1): NumberDrawBounds {
    const resolvedKind=kind===true?'heal':kind===false?'damage':kind;
    const image = this.text(amount, critical, resolvedKind), pop = Math.max(0, 1 - elapsed / 140);
    const matrix=context.getTransform(),cssWidth=context.canvas.clientWidth||context.canvas.width,ratio=cssWidth/context.canvas.width;
    const worldToCss=Math.hypot(matrix.a,matrix.b)*ratio;
    const scale=readableNumberScale(image.height,image.width,worldToCss,cssWidth,resolvedKind,critical,size,pop);
    const w = image.width * scale, h = image.height * scale;
    const canvasX=matrix.a*x+matrix.c*y+matrix.e,half=(w*worldToCss+(critical?25*worldToCss:0))/2;
    const shift=(Math.max(half+4,Math.min(cssWidth-half-4,canvasX*ratio))-canvasX*ratio)/ratio;
    const det=matrix.a*matrix.d-matrix.b*matrix.c;
    if(det){x+=matrix.d*shift/det;y-=matrix.b*shift/det;}
    context.save(); context.translate(x, y); context.imageSmoothingEnabled = false;
    if (critical && this.criticalFont) {
      const rect = this.criticalFont.meta.sprite_sheet!.frames[this.criticalFrame]!;
      const bw = Math.max(78, w + 25), bh = Math.max(58, h * 1.8);
      context.drawImage(this.criticalFont.image, rect[0]!, rect[1]!, rect[2]!, rect[3]!, -bw / 2, -bh / 2, bw, bh);
    }
    context.drawImage(image, -w / 2, -h / 2, w, h); context.restore();
    return{kind:resolvedKind,critical,left:(matrix.a*x+matrix.c*y+matrix.e)*ratio-w*worldToCss/2,top:(matrix.b*x+matrix.d*y+matrix.f)*ratio-h*worldToCss/2,width:w*worldToCss,height:h*worldToCss};
  }
}
