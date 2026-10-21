/** Test-only loopback gateway: Auth + PostgREST + the actual game API. */
import { createServer, request as proxyRequest } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import api from '../../api/index.ts';
const port = Number(process.env.RO_GATEWAY_PORT), auth = Number(process.env.RO_AUTH_PORT), rest = Number(process.env.RO_REST_PORT);
const origin = process.env.RO_LIVE_URL!;
// Loopback by default; the personal preview's --lan mode (D-075) sets 0.0.0.0 so a phone on the home Wi-Fi can open it.
// Auth, PostgREST, Postgres and mail stay on 127.0.0.1 and are reachable only through the paths proxied below.
const host = process.env.RO_GATEWAY_HOST === '0.0.0.0' ? '0.0.0.0' : '127.0.0.1';
const webRoot = process.env.RO_STATIC_WEB_ROOT ? await realpath(process.env.RO_STATIC_WEB_ROOT) : null;
createServer(async (incoming, outgoing) => {
  outgoing.setHeader('access-control-allow-origin', origin);
  outgoing.setHeader('access-control-allow-headers', 'authorization,apikey,content-type,x-client-info,x-supabase-api-version');
  outgoing.setHeader('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (incoming.method === 'OPTIONS') { outgoing.writeHead(204); outgoing.end(); return; }
  if (incoming.url?.startsWith('/api/')) {
    try {
      const headers = new Headers(); for (const [name, value] of Object.entries(incoming.headers)) if (value) headers.set(name, Array.isArray(value) ? value.join(',') : value);
      const chunks: Buffer[] = []; let size = 0;
      for await (const chunk of incoming) { const bytes = Buffer.from(chunk); size += bytes.length; if (size > 16384) { outgoing.writeHead(413); outgoing.end(); return; } chunks.push(bytes); }
      const body = ['GET', 'HEAD'].includes(incoming.method ?? 'GET') ? undefined : Buffer.concat(chunks);
      const response = await api.fetch(new Request(`http://127.0.0.1:${port}${incoming.url}`, { method: incoming.method, headers, body }));
      outgoing.writeHead(response.status, Object.fromEntries(response.headers)); outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch { outgoing.writeHead(503); outgoing.end('{"code":"LOCAL_GATEWAY_FAILED"}'); } return;
  }
  const prefix = incoming.url?.startsWith('/auth/v1/') ? '/auth/v1' : incoming.url?.startsWith('/rest/v1/') ? '/rest/v1' : null;
  if (!prefix) {
    if (webRoot && ['GET', 'HEAD'].includes(incoming.method ?? '')) {
      try {
        const route = decodeURIComponent(new URL(incoming.url!, origin).pathname);
        const html = ['/', '/auth', '/roster', '/play'].includes(route);
        if (!html && !route.startsWith('/assets/') && !route.startsWith('/ro/')) throw new Error('NOT_PUBLIC');
        const file = await realpath(path.join(webRoot, html ? 'index.html' : route.slice(1)));
        if (!file.startsWith(webRoot + path.sep) || !(await stat(file)).isFile()) throw new Error('NOT_PUBLIC');
        const types: Record<string,string> = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.webp':'image/webp', '.wav':'audio/wav', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.woff2':'font/woff2', '.woff':'font/woff', '.ttf':'font/ttf' };
        const bytes = await readFile(file);
        outgoing.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream', 'content-length': bytes.length, 'cache-control': html || route === '/ro/manifest.json' ? 'no-store' : 'public, max-age=31536000, immutable', 'x-content-type-options':'nosniff' });
        outgoing.end(incoming.method === 'HEAD' ? undefined : bytes); return;
      } catch { /* Only the frozen public build is readable. */ }
    }
    outgoing.writeHead(404); outgoing.end(); return;
  }
  const target = proxyRequest({ hostname: '127.0.0.1', port: prefix === '/auth/v1' ? auth : rest, path: incoming.url!.slice(prefix.length), method: incoming.method, headers: incoming.headers }, response => { outgoing.writeHead(response.statusCode ?? 502, { ...response.headers, 'access-control-allow-origin': origin }); response.pipe(outgoing); });
  target.on('error', () => { outgoing.writeHead(502); outgoing.end(); }); incoming.pipe(target);
}).listen(port, host, () => console.log('Isolated Auth test gateway ready'));
