// Minimal static server for local development and the evaluation harness.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const root = join(new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'), 'app');
const port = Number(process.env.PORT || 5173);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.onnx': 'application/octet-stream',
  '.gz': 'application/gzip', '.md': 'text/markdown; charset=utf-8', '.ico': 'image/x-icon',
};

createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^[\/]+/, '');
    if (p.includes('..')) throw new Error('bad path');
    let file = join(root, p);
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}).listen(port, () => console.log(`serving app/ on http://localhost:${port}`));
