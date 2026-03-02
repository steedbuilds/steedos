import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'steedos-db.json');

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function getContentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.ico')) return 'image/x-icon';
  return 'application/octet-stream';
}

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify({ state: null, plans: {} }, null, 2), 'utf8');
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return {
      state: parsed?.state ?? null,
      plans: parsed?.plans ?? {},
    };
  } catch {
    return { state: null, plans: {} };
  }
}

async function writeDb(next) {
  await ensureDb();
  await fs.writeFile(DB_FILE, JSON.stringify(next, null, 2), 'utf8');
}

function safeLocalPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const clean = decoded === '/' ? '/index.html' : decoded;
  const resolved = path.normalize(path.join(__dirname, clean));
  if (!resolved.startsWith(__dirname)) return null;
  return resolved;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) {
      return json(res, 400, { ok: false, error: 'Bad request' });
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname, searchParams } = url;

    if (pathname === '/api/health' && req.method === 'GET') {
      return json(res, 200, { ok: true, service: 'steedos-backend' });
    }

    if (pathname === '/api/state' && req.method === 'GET') {
      const db = await readDb();
      return json(res, 200, { ok: true, data: db.state });
    }

    if (pathname === '/api/state' && req.method === 'PUT') {
      const body = await readBody(req);
      if (!body || typeof body !== 'object' || typeof body.data !== 'object') {
        return json(res, 400, { ok: false, error: 'Invalid payload' });
      }
      const db = await readDb();
      db.state = body.data;
      await writeDb(db);
      return json(res, 200, { ok: true });
    }

    if (pathname === '/api/plan' && req.method === 'GET') {
      const key = String(searchParams.get('key') || '').trim();
      if (!key) return json(res, 400, { ok: false, error: 'Missing plan key' });
      const db = await readDb();
      return json(res, 200, { ok: true, data: db.plans[key] || null });
    }

    if (pathname === '/api/plan' && req.method === 'PUT') {
      const body = await readBody(req);
      const key = String(body?.key || '').trim();
      if (!key || typeof body?.data !== 'object') {
        return json(res, 400, { ok: false, error: 'Invalid payload' });
      }
      const db = await readDb();
      db.plans[key] = body.data;
      await writeDb(db);
      return json(res, 200, { ok: true });
    }

    const filePath = safeLocalPath(pathname);
    if (!filePath) return json(res, 403, { ok: false, error: 'Forbidden' });

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) throw new Error('Not file');
      const body = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      return res.end(body);
    } catch {
      const fallback = path.join(__dirname, 'index.html');
      try {
        const html = await fs.readFile(fallback);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(html);
      } catch {
        return json(res, 404, { ok: false, error: 'Not found' });
      }
    }
  } catch (err) {
    return json(res, 500, { ok: false, error: 'Server error', detail: String(err?.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`SteedOS backend running at http://localhost:${PORT}`);
});
