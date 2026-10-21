// npm install --prefix /private/tmp/ro-vercel-node-tools --ignore-scripts @vercel/node@24.0.3
// RO_FUNCTION_SOURCE points to a disposable production-build tree with real node_modules.
const { createRequire } = require('node:module');
const fs = require('node:fs/promises');
const { createWriteStream } = require('node:fs');
const { pipeline } = require('node:stream/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = process.env.RO_FUNCTION_SOURCE;
if (!source || !path.isAbsolute(source) || source === root) throw new Error('RO_FUNCTION_SOURCE must be an isolated source directory');
const requireBuilder = createRequire(process.env.RO_VERCEL_TOOLS || '/private/tmp/ro-vercel-node-tools/package.json');

(async () => {
  const builder = requireBuilder('@vercel/node');
  const { FileFsRef } = requireBuilder('@vercel/build-utils');
  const version = requireBuilder('@vercel/node/package.json').version;
  const result = await builder.build({
    files: { 'api/index.ts': new FileFsRef({ fsPath: path.join(source, 'api/index.ts') }) },
    entrypoint: 'api/index.ts', workPath: source, repoRootPath: source,
    config: { zeroConfig: true },
    meta: { skipDownload: true, runNpmInstallSet: new Set([path.join(source, 'package.json')]) },
  });
  const output = await fs.mkdtemp('/private/tmp/ro-function-');
  const names = Object.keys(result.output.files);
  for (const [name, file] of Object.entries(result.output.files)) {
    const target = path.resolve(output, name);
    if (!target.startsWith(output + path.sep)) throw new Error('Function output escaped its root');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await pipeline(await file.toStream(), createWriteStream(target));
  }
  if (names.some(name => /\.tsx?$/.test(name))) throw new Error('Function unexpectedly depends on TypeScript at runtime');
  const native = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { pathToFileURL } from 'node:url';
    const module = await import(pathToFileURL(process.argv[1]));
    const api = module.default;
    const health = await api.fetch(new Request('https://fixture.invalid/api/health'));
    const status = await health.json();
    if (health.status !== 200 || !status.ok || status.persistence !== 'configured') throw new Error('PACKAGED_HEALTH_FAILED');
    const anonymous = await api.fetch(new Request('https://fixture.invalid/api/checkpoint'));
    if (anonymous.status !== 401) throw new Error('PACKAGED_AUTH_GATE_FAILED');
    console.log(JSON.stringify({health:health.status, anonymous_checkpoint:anonymous.status, content_hash:status.content_hash}));
  `, path.join(output, result.output.handler)], {
    cwd: output, encoding: 'utf8', env: {
      PATH: process.env.PATH, APP_ENV: 'production',
      SUPABASE_URL: 'https://build-fixture.supabase.co', SUPABASE_PRODUCTION_PROJECT_REF: 'build-fixture',
      SUPABASE_SECRET_KEY: 'sb_secret_' + 'native_fixture_server_0001', SAVE_SIGNING_KEY: 'native-fixture-signing-key-00000000000000',
    },
  });
  if (native.status !== 0) throw new Error('Native Node function smoke failed: ' + native.stderr);
  const report = {
    passed: true, builder: '@vercel/node@' + version, cli_equivalent: '64.5.0', runtime: result.output.runtime,
    function_files: names.length, source_directory: source, function_directory: output,
    native_node: process.version, loader: 'Native Node without tsx or a TypeScript loader',
    checks: JSON.parse(native.stdout),
    source_sha256: Object.fromEntries(await Promise.all(['tsconfig.json','src/content/index.ts','api/index.ts'].map(async ref => [ref, createHash('sha256').update(await fs.readFile(path.join(root,ref))).digest('hex')]))),
    scope: 'Official Vercel compile/file trace plus native Node execution of only materialized function files. No hosted Auth or cloud save writes.',
  };
  await fs.writeFile(path.join(root, 'plan/evidence/entry-function.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
})().catch(error => { console.error(error); process.exitCode = 1; });
