// The API must find the internal key in the runtime dir when it is restarted by hand without the env var
// (make dev puts the key in data/runtime/.internal_key and the agent runtime keeps checking it).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server, type IncomingHttpHeaders } from 'node:http';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const seed = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../seed/users.json'), 'utf8'));
const agronomist = seed.find((u: any) => u.role === 'agronomist');

let seen: IncomingHttpHeaders | null = null;
let fake: Server;
let api: Server;
let base = '';
before(async () => {
  fake = createServer((req, res) => { seen = req.headers; req.resume(); req.on('end', () => res.end('{}')); });
  await new Promise<void>((ok) => fake.listen(0, ok));
  const dir = mkdtempSync(join(tmpdir(), 'solarda-key-'));
  writeFileSync(join(dir, '.internal_key'), 'key-from-file\n');
  process.env.SOLARDA_RUNTIME_DIR = dir;
  process.env.SOLARDA_AGENTS = `http://127.0.0.1:${(fake.address() as any).port}`;
  delete process.env.SOLARDA_INTERNAL_KEY;
  const { app } = await import('./app.js');
  api = app.listen(0);
  await new Promise<void>((ok) => api.on('listening', ok));
  base = `http://127.0.0.1:${(api.address() as any).port}/api`;
});
after(() => { api.close(); fake.close(); });

test('without the env var, approvals carry the key from data/runtime/.internal_key', async () => {
  const login = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: agronomist.email, password: agronomist.password }) });
  const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0];
  const r = await fetch(base + '/runs/x%3A1/resume', { method: 'POST', headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ approvals: [{ proposal_id: 'p', decision: 'approve', ts: '2020-03-03T06:00:00Z' }] }) });
  assert.equal(r.status, 200);
  assert.equal(seen?.['x-solarda-internal'], 'key-from-file');
});
