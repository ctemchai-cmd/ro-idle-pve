import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const base = process.env.RO_ASSET_QA_URL ?? 'http://127.0.0.1:5174';
const local = JSON.parse(readFileSync('runtime/ro/manifest.json', 'utf8')) as { pack_hash: string; base_url: string; files: { path: string; bytes: number; sha256: string }[] };
const remote = await fetch(base + '/ro/manifest.json');
if (!remote.ok || (await remote.json()).pack_hash !== local.pack_hash) throw new Error('HTTP manifest mismatch');
let checked = 0, bytes = 0;
const failed: string[] = [];
let cursor = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (cursor < local.files.length) {
    const row = local.files[cursor++]!;
    try {
      const url = base + local.base_url + row.path.split('/').map(encodeURIComponent).join('/');
      const response = await fetch(url);
      const body = Buffer.from(await response.arrayBuffer());
      if (!response.ok || body.length !== row.bytes || createHash('sha256').update(body).digest('hex') !== row.sha256) throw new Error(`HTTP bytes/hash ${response.status}`);
      checked++; bytes += body.length;
    } catch (error) { failed.push(`${row.path}: ${String(error)}`); }
  }
}));
const denialCases: { path: string; expected: number; actual: number }[] = [];
for (const [path, expected] of [['/assets/ro/catalog.json', 403], [local.base_url + 'library/catalog.json', 404], [local.base_url + '%2e%2e%2flibrary%2fcatalog.json', 404]] as const) {
  const response = await fetch(base + path);
  denialCases.push({ path, expected, actual: response.status });
}
const result = { pack_hash: local.pack_hash, checked, expected: local.files.length, bytes, failed, denial_cases: denialCases,
  passed: !failed.length && checked === local.files.length && denialCases.every(row => row.actual === row.expected),
  scope: 'HTTP byte/metadata integrity only; no image decode, animation or visual QA' };
writeFileSync('plan/evidence/task-019-http.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
if (!result.passed) process.exitCode = 1;
