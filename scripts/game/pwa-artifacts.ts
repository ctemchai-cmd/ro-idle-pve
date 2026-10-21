import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const pwaFiles = ['manifest.webmanifest', 'offline.html', 'sw.js', 'pwa/icon.svg', 'pwa/icon-192.png', 'pwa/icon-512.png', 'pwa/icon-maskable-512.png', 'pwa/apple-touch-icon.png'] as const;
/** Exact deployment allowlist; these public assets never enter the game content fingerprint. */
export async function finalizePwa(directory: string) {
  const files = await Promise.all(pwaFiles.map(async file => ({ file, bytes: await readFile(path.join(directory, file)) })));
  const manifest = JSON.parse(files[0]!.bytes.toString()) as Record<string, unknown>;
  if (manifest.id !== '/' || manifest.start_url !== '/play' || manifest.scope !== '/' || manifest.display !== 'standalone' || manifest.orientation !== 'portrait') throw new Error('INVALID_PWA_MANIFEST');
  for (const [file, size] of [['pwa/icon-192.png', 192], ['pwa/icon-512.png', 512], ['pwa/icon-maskable-512.png', 512], ['pwa/apple-touch-icon.png', 180]] as const) {
    const bytes = files.find(row => row.file === file)!.bytes;
    if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.readUInt32BE(16) !== size || bytes.readUInt32BE(20) !== size) throw new Error('INVALID_PWA_ICON_SIZE');
  }
  const icons = manifest.icons as { src: string; sizes: string; purpose: string }[];
  if (icons.length !== 3 || icons.some(icon => !pwaFiles.includes(icon.src.slice(1) as typeof pwaFiles[number])) || !icons.some(icon => icon.sizes === '192x192' && icon.purpose === 'any') || !icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'maskable')) throw new Error('INVALID_PWA_ICONS');
  const precacheBytes = files.filter(row => row.file === 'offline.html' || row.file.endsWith('.png')).reduce((sum, row) => sum + row.bytes.length, 0);
  if (precacheBytes > 128 * 1024) throw new Error('PWA_FALLBACK_BUDGET_EXCEEDED');
  const hash = createHash('sha256').update(await readFile(path.join(directory, 'index.html')));
  for (const row of files) hash.update(row.file).update(row.bytes);
  const version = hash.digest('hex').slice(0, 16), template = files.find(row => row.file === 'sw.js')!.bytes.toString();
  if (!template.includes('__RO_PWA_VERSION__')) throw new Error('PWA_WORKER_TEMPLATE_MISSING');
  await writeFile(path.join(directory, 'sw.js'), template.replace('__RO_PWA_VERSION__', version));
  return { version, precache_bytes: precacheBytes };
}
