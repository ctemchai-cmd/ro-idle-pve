import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { copyRuntimeAssets } from './runtime-assets.ts';
const manifest = JSON.parse(await readFile('src/generated/runtime-manifest.json', 'utf8'));
if (!manifest.implementation_hash) throw new Error('Build must include implementation fingerprint');
const files: { path: string; bytes: number; gzip_bytes: number; sha256: string }[] = [];
const pack = copyRuntimeAssets();
async function collect(dir: string) {
  for (const name of await readdir(dir)) {
    const file = `${dir}/${name}`;
    if ((await stat(file)).isDirectory()) await collect(file);
    else { const bytes = await readFile(file); files.push({ path: file, bytes: bytes.length, gzip_bytes: gzipSync(bytes).length, sha256: createHash('sha256').update(bytes).digest('hex') }); }
  }
}
await collect('dist');
const expected = new Set(pack.files.map(file => `dist/ro/${pack.pack_hash}/${file.path}`));
expected.add('dist/ro/manifest.json');
if (files.some(file => !/\.(html|js|css)$/.test(file.path) && !expected.has(file.path))) throw new Error('Unexpected payload: only selected runtime assets are allowed');
if (manifest.runtime_asset_pack_hash !== pack.pack_hash) throw new Error('Content/asset manifest mismatch');
await writeFile('dist/content-version.json', JSON.stringify({ ...manifest, build_files: files }, null, 2) + '\n');
console.log(JSON.stringify({ content_hash: manifest.content_hash, files: files.length, gzip_bytes: files.filter(file => !file.path.startsWith('dist/ro/')).reduce((n, file) => n + file.gzip_bytes, 0), asset_pack_hash: pack.pack_hash, asset_pack_bytes: pack.sizes.media_and_sidecar_bytes + pack.sizes.manifest_bytes, publish_ready: false }));
