import { createServer } from 'node:http';
import api from '../../api/index.ts';
const port = Number(process.env.RO_API_PORT ?? 8787);
const server = createServer(async (incoming, outgoing) => {
  try {
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of incoming) {
      size += chunk.length;
      if (size > 256 * 1024) { outgoing.writeHead(413).end('Command exceeds256KiB'); return; }
      chunks.push(chunk);
    }
    const request = new Request(`http://127.0.0.1:${port}${incoming.url}`, { method: incoming.method, headers: incoming.headers as Record<string, string>, ...(['GET', 'HEAD'].includes(incoming.method ?? 'GET') ? {} : { body: Buffer.concat(chunks) }) });
    const response = await api.fetch(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch { outgoing.writeHead(500).end('Local adapter error'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Local API: http://127.0.0.1:${port}/api/health`));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close());
