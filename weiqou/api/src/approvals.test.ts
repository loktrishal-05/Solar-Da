import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server, type IncomingHttpHeaders } from 'node:http';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const seed = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../seed/users.json'), 'utf8'));
const login = (role: string) => seed.find((u: any) => u.role === role);

// Stand-in agent runtime: records what the API forwards, answers with a configurable status.
let calls: Array<{ url: string; headers: IncomingHttpHeaders; body: any }> = [];
let reply = 200;
let fake: Server;
let api: Server;
let base = '';
before(async () => {
  fake = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      calls.push({ url: req.url ?? '', headers: req.headers, body: JSON.parse(Buffer.concat(chunks).toString() || '{}') });
      res.statusCode = reply;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(reply === 200 ? { run_id: 'r', status: 'done', dispatched: [] } : { detail: 'run is not waiting' }));
    });
  });
  await new Promise<void>((ok) => fake.listen(0, ok));
  process.env.SOLARDA_AGENTS = `http://127.0.0.1:${(fake.address() as any).port}`;
  process.env.SOLARDA_INTERNAL_KEY = 'test-internal-key';
  process.env.SOLARDA_RUNTIME_DIR = mkdtempSync(join(tmpdir(), 'solarda-appr-'));
  const { app } = await import('./app.js');
  api = app.listen(0);
  await new Promise<void>((ok) => api.on('listening', ok));
  base = `http://127.0.0.1:${(api.address() as any).port}/api`;
});
after(() => { api.close(); fake.close(); });
beforeEach(() => { calls = []; reply = 200; });

async function cookieFor(role: string) {
  const u = login(role);
  const r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: u.email, password: u.password }) });
  return (r.headers.get('set-cookie') ?? '').split(';')[0];
}

const approvals = [{ proposal_id: 'p1', decision: 'approve', decided_by: 'hacker', ts: '2020-03-03T06:00:00Z' }];
const resume = (cookie?: string) => fetch(base + '/runs/disease%3A501/resume', {
  method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
  body: JSON.stringify({ approvals }),
});

test('signed-out approval is 401 and never reaches the agents', async () => {
  assert.equal((await resume()).status, 401);
  assert.equal(calls.length, 0);
});

test('a farmer cannot approve', async () => {
  assert.equal((await resume(await cookieFor('farmer'))).status, 403);
  assert.equal(calls.length, 0);
});

test('an agronomist approval is forwarded with their name stamped and the internal key', async () => {
  const r = await resume(await cookieFor('agronomist'));
  assert.equal(r.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/runs/disease%3A501/resume');
  assert.equal(calls[0].headers['x-solarda-internal'], 'test-internal-key');
  assert.equal(calls[0].body.approvals[0].decided_by, `${login('agronomist').name} (agronomist)`);
  const audit = await fetch(base + '/audit').then((x) => x.json());
  const entry = audit.entries.find((e: any) => e.type === 'approval');
  assert.equal(entry.by, `${login('agronomist').name} (agronomist)`);
  assert.equal(entry.run_id, 'disease:501');
});

test('an agent-side refusal is passed back to the browser', async () => {
  reply = 409;
  const r = await resume(await cookieFor('admin'));
  assert.equal(r.status, 409);
  assert.equal((await r.json()).detail, 'run is not waiting');
});

test('malformed approvals are rejected before forwarding', async () => {
  const r = await fetch(base + '/runs/x/resume', { method: 'POST',
    headers: { 'content-type': 'application/json', cookie: await cookieFor('agronomist') },
    body: JSON.stringify({ approvals: [{ decision: 'maybe' }] }) });
  assert.equal(r.status, 400);
  assert.equal(calls.length, 0);
});
