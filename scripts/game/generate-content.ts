import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'json-schema-to-typescript';
import type { JSONSchema4 } from 'json-schema';
import { canonical, isObject } from '../../src/content/value.ts';
import { localSchemaReference } from '../../src/content/schema-ref.ts';
import { engineProjection } from './content-projection.ts';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const m0 = JSON.parse(await readFile(path.join(root, 'plan/data/release-content-manifest.json'), 'utf8'));
const files = Object.keys(m0.input_sha256 as Record<string, string>).sort();
const schemas: Record<string, object> = {};
const documents: Record<string, object> = {};
for (const file of files) {
  const bytes = await readFile(path.join(root, file));
  if (hash(bytes) !== m0.input_sha256[file]) throw new Error(`M0 manifest stale at ${file}; re-review changed authored data first`);
  const value = JSON.parse(bytes.toString());
  if (file.includes('/schemas/')) schemas[path.basename(file, '.json')] = value;
  else documents[file.replace('plan/data/', '')] = value;
}
// Resolve only local refs; the type generator must never fetch remote schemas.
function localSchema(value: unknown, name: string): unknown {
  if (Array.isArray(value)) return value.map(child => localSchema(child, name));
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== '$id' && key !== '$schema').map(([key, child]) => {
    if (key === '$ref') {
      const ref = localSchemaReference(child, schemas, name);
      return [key, `#/$defs/${ref.schema}${ref.fragment}`];
    }
    return [key, localSchema(child, name)];
  }));
}
await mkdir(path.join(root, 'src/generated'), { recursive: true });
const typeSchema = {
  type: 'object', additionalProperties: false,
  properties: Object.fromEntries(Object.keys(schemas).map(key => [key.replaceAll('-', '_'), { $ref: `#/$defs/${key}` }])),
  required: Object.keys(schemas).map(key => key.replaceAll('-', '_')),
  $defs: Object.fromEntries(Object.entries(schemas).map(([key, value]) => [key, localSchema(value, key)])),
};
const types = await compile(typeSchema as JSONSchema4, 'GameContracts', { bannerComment: '/* Generated from plan/data/schemas. Do not edit. */', style: { singleQuote: true }, unknownAny: true });
await writeFile(path.join(root, 'src/generated/contracts.d.ts'), types);
const sourceFiles: string[] = [];
async function collect(dir: string) {
  let entries;
  try { entries = await readdir(path.join(root, dir), { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await collect(file);
    else if (/\.(ts|tsx)$/.test(file)) sourceFiles.push(file);
  }
}
for (const dir of ['src/content', 'src/contracts', 'src/domain', 'src/simulation']) await collect(dir);
sourceFiles.push('scripts/game/content-projection.ts', 'scripts/game/generate-content.ts', 'package-lock.json');
const implementation = await Promise.all(sourceFiles.sort().map(async file => [file, hash(await readFile(path.join(root, file)))]));
const implementation_hash = hash(canonical(implementation));
const engineEntries = files.filter(file => !file.includes('/schemas/') && !file.includes('/presentations/') && !['actor-presentations.json', 'strings.th.json'].includes(path.basename(file))).map(file => [file, engineProjection(documents[file.replace('plan/data/', '')])]);
const engine_data_hash = hash(canonical(engineEntries));
if (engine_data_hash !== m0.engine_data_hash) throw new Error('Engine projection differs from M0');
const content_hash = hash(canonical({ engine_data_hash, schema_hash: m0.schema_hash, implementation_hash }));
const manifest = {
  schema_version: 1, content_version: m0.content_version, rules_version: m0.rules_version,
  engine_data_hash, schema_hash: m0.schema_hash, implementation_hash, content_hash,
  presentation_selection_hash: m0.presentation_selection_hash, runtime_asset_pack_hash: await readFile(path.join(root, 'runtime/ro/manifest.json'), 'utf8').then(text => JSON.parse(text).pack_hash as string).catch(() => null),
  input_sha256: { ...m0.input_sha256, ...Object.fromEntries(implementation) },
  document_versions: Object.fromEntries(Object.entries(documents).map(([file, doc]) => {
    const value = doc as Record<string, unknown>;
    return [file, String(value.content_version ?? value.version ?? value.rules_version ?? 'schema1')];
  })),
};
// Strip review/example material without altering schema-validated definitions.
for (const [name, doc] of Object.entries(documents)) {
  if (!isObject(doc)) continue;
  for (const key of ['builds', 'reference_cases', 'reference_profiles', 'checkpoints', 'checkpoint_limits', 'reference_team', 'reference_teams', 'supreme_analysis', 'notes']) delete doc[key];
  documents[name] = doc;
}
await writeFile(path.join(root, 'src/generated/content.json'), JSON.stringify({ manifest, schemas, documents }));
await writeFile(path.join(root, 'src/generated/runtime-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ content_hash, documents: Object.keys(documents).length, schemas: Object.keys(schemas).length, asset_payloads: 0 }));
