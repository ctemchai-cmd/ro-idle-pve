import type { NativeAsset } from './native.mjs';

/** `incoming` is damage a party member takes (red, as RO shows it on your own characters). */
export type NumberKind = 'damage' | 'heal' | 'incoming';
/** RO-style flight: the number pops large, arcs up and falls back to one side while it shrinks; presentation only. */
export const NUMBER_FLIGHT_MS = 800;
export function numberFlight(elapsed: number, side: number): { dx: number; dy: number; size: number; alpha: number } {
  const p = Math.min(1, Math.max(0, elapsed / NUMBER_FLIGHT_MS)), peak = .45, arc = (p / (2 * peak)) * (1 - p / (2 * peak));
  return { dx: side * 42 * p, dy: -4 * 56 * arc, size: 1.4 - .85 * p, alpha: p < .7 ? 1 : Math.max(0, 1 - (p - .7) / .3) };
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
    this.cache.set(key, canvas); if (this.cache.size > 256) this.cache.delete(this.cache.keys().next().value!);
    return canvas;
  }
  /** `kind: true` is the older heal flag. `size` multiplies the base glyph scale (flight shrink). */
  draw(context: CanvasRenderingContext2D, amount: number, critical: boolean, x: number, y: number, elapsed: number, kind: NumberKind | boolean = 'damage', size = 1): void {
    const image = this.text(amount, critical, kind === true ? 'heal' : kind === false ? 'damage' : kind), pop = Math.max(0, 1 - elapsed / 140), scale = (critical ? 3 : 2.4) * (1 + pop * .18) * size;
    const w = image.width * scale, h = image.height * scale;
    context.save(); context.translate(x, y); context.imageSmoothingEnabled = false;
    if (critical && this.criticalFont) {
      const rect = this.criticalFont.meta.sprite_sheet!.frames[this.criticalFrame]!;
      const bw = Math.max(78, w + 25), bh = Math.max(58, h * 1.8);
      context.drawImage(this.criticalFont.image, rect[0]!, rect[1]!, rect[2]!, rect[3]!, -bw / 2, -bh / 2, bw, bh);
    }
    context.drawImage(image, -w / 2, -h / 2, w, h); context.restore();
  }
}
