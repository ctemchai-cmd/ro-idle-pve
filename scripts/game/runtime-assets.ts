import { readFileSync, createReadStream, statSync, cpSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export interface RuntimeAssetManifest {
  schema_version: number;
  pack_hash: string;
  asset_selection_hash: string;
  base_url: string;
  files: { path: string; bytes: number; sha256: string }[];
  sizes: { media_and_sidecar_bytes: number; manifest_bytes: number; initial_profile_raw_bytes: number };
}
export function readAssetManifest(): RuntimeAssetManifest {
  const manifest = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as RuntimeAssetManifest;
  if (manifest.schema_version !== 1 || !/^[a-f0-9]{64}$/.test(manifest.pack_hash) || manifest.base_url !== `/ro/${manifest.pack_hash}/`) throw new Error('Invalid runtime pack manifest');
  return manifest;
}
const types: Record<string, string> = { '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8' };

/** Expose selected files only; the original assets/ro library stays denied. */
export function runtimeAssetsPlugin(): Plugin {
  return { name: 'ro-runtime-assets', configureServer(server) {
    let manifest = readAssetManifest();
    let stamp = statSync('runtime/ro/manifest.json').mtimeMs;
    let files = new Map(manifest.files.map(file => [file.path, file]));
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (!url.pathname.startsWith('/ro/')) return next();
      // A rebuilt local pack gets a new immutable URL. Refresh its allowlist
      // together with the manifest, without requiring a manual Vite restart.
      const currentStamp = statSync('runtime/ro/manifest.json').mtimeMs;
      if (currentStamp !== stamp) { manifest = readAssetManifest(); files = new Map(manifest.files.map(file => [file.path, file])); stamp = currentStamp; }
      if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) { response.writeHead(405).end(); return; }
      let ref: string;
      try { ref = decodeURIComponent(url.pathname.slice(manifest.base_url.length)); } catch { response.writeHead(400).end(); return; }
      const isManifest = url.pathname === '/ro/manifest.json';
      if (!isManifest && (!url.pathname.startsWith(manifest.base_url) || !files.has(ref))) { response.writeHead(404).end(); return; }
      const file = isManifest ? path.resolve('runtime/ro/manifest.json') : path.resolve('runtime/ro/payload', ref);
      const root = path.resolve('runtime/ro/payload') + path.sep;
      if (!isManifest && !file.startsWith(root)) { response.writeHead(404).end(); return; }
      response.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream', 'content-length': statSync(file).size,
        'cache-control': isManifest ? 'no-cache' : 'public,max-age=31536000,immutable' });
      if (request.method === 'HEAD') response.end();
      else createReadStream(file).on('error', () => response.destroy()).pipe(response);
    });
  } };
}

export function copyRuntimeAssets(): RuntimeAssetManifest {
  const manifest = readAssetManifest();
  const output = path.resolve('dist/ro', manifest.pack_hash);
  mkdirSync(output, { recursive: true });
  cpSync('runtime/ro/payload', output, { recursive: true });
  copyFileSync('runtime/ro/manifest.json', 'dist/ro/manifest.json');
  return manifest;
}
