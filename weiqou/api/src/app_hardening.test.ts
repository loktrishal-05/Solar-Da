import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';

process.env.SOLARDA_RUNTIME_DIR = mkdtempSync(join(tmpdir(), 'solarda-hard-'));
let api: Server;
let base = '';
before(async () => {
  const { app } = await import('./app.js');
  api = app.listen(0);
  await new Promise<void>((ok) => api.on('listening', ok));
  base = `http://127.0.0.1:${(api.address() as any).port}`;
});
after(() => api.close());

test('API responses carry security headers and no framework banner', async () => {
  const r = await fetch(base + '/api/health');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-powered-by'), null);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.equal(r.headers.get('referrer-policy'), 'same-origin');
  assert.equal(r.headers.get('cache-control'), 'no-store');
});

test('no wildcard CORS: other sites cannot read the API', async () => {
  const r = await fetch(base + '/api/health', { headers: { origin: 'https://evil.example' } });
  assert.equal(r.headers.get('access-control-allow-origin'), null);
});

test('unknown API routes answer 404 JSON', async () => {
  const r = await fetch(base + '/api/does-not-exist', { method: 'POST' });
  assert.equal(r.status, 404);
  assert.match(r.headers.get('content-type') ?? '', /application\/json/);
  assert.equal((await r.json()).error, 'Not found: POST /api/does-not-exist');
});

test('malformed JSON bodies answer 400 JSON, not an HTML stack page', async () => {
  const r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"email":' });
  assert.equal(r.status, 400);
  assert.match(r.headers.get('content-type') ?? '', /application\/json/);
  const b = await r.json();
  assert.equal(b.error, 'The request body is not valid JSON');
  assert.equal(JSON.stringify(b).includes('at '), false);
});
