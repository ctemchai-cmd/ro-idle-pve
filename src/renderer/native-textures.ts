/** Native black color-key for opaque ground bitmaps. Decode once at prepare;
 * source RGB/media/keyframes stay unchanged and no pixel work runs per frame. */
const blackKeyCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
export function blackKeyTexture(image: HTMLImageElement): HTMLCanvasElement {
  const cached = blackKeyCache.get(image); if (cached) return cached;
  const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
  const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // Original bitmap edges contain near-black RGB noise as well as exact black.
  // Feather that matte, retaining opaque terrain colors above the dark fringe.
  for (let i = 0; i < pixels.data.length; i += 4) {
    const value = Math.max(pixels.data[i]!, pixels.data[i + 1]!, pixels.data[i + 2]!);
    pixels.data[i + 3] = pixels.data[i + 3]! * Math.max(0, Math.min(1, (value - 12) / 20));
  }
  ctx.putImageData(pixels, 0, 0); blackKeyCache.set(image, canvas); return canvas;
}
