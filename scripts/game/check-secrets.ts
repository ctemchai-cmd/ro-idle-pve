import { readFile, readdir, stat } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { containsPrivilegedValue } from './secret-guard.ts';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
let inspected = 0;
async function check(path: string) {
  const info = await stat(path);
  if (info.isDirectory()) {
    for (const file of await readdir(path)) await check(`${path}/${file}`);
  } else if (/\.(?:js|mjs|ts|tsx|json|html|css|sql)$/.test(path)) {
    // Media is copied byte-for-byte; check executable/text build output and source.
    const text = await readFile(path, 'utf8'); inspected++;
    if (containsPrivilegedValue(text, env)) throw new Error('PRIVILEGED_VALUE_FOUND_IN: ' + path);
  }
}
for (const path of ['dist/assets', 'dist/index.html', 'src', 'api', 'supabase/migrations']) await check(path);
console.log(JSON.stringify({ passed: true, text_files_scanned: inspected, values_logged: false, scope: 'Browser build and application/SQL source; known private environment values, private-key blocks, sb_secret keys and legacy service_role JWTs. Not a general secret detector.' }));
