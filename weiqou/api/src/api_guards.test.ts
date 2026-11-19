// Agent-only routes, E-stop clearing and error shapes, with the internal key configured as under `make dev`.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';

process.env.SOLARDA_RUNTIME_DIR = mkdtempSync(join(tmpdir(), 'solarda-guard-'));
process.env.SOLARDA_INTERNAL_KEY = 'guard-key';
let api: Server;
let base = '';
before(async () => {
  const { app } = await import('./app.js');
  api = app.listen(0);
  await new Promise<void>((ok) => api.on('listening', ok));
  base = `http://127.0.0.1:${(api.address() as any).port}/api`;
});
after(() => api.close());

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const agent = { 'X-Solarda-Internal': 'guard-key' };

test('a browser cannot dispatch actions or write the audit log directly', async () => {
  const forged = { run_id: 'r', sim_time: '2020-03-05T10:00:00Z', approval: { proposal_id: 'p', decision: 'approve', decided_by: 'me', ts: '2020-03-05T10:00:00Z' },
    action: { id: 'p', kind: 'treat_disease', zone: 'bed-1', params: {}, rationale: 'x', evidence: [], expected_effect: 'x', confidence: 1 } };
  const r = await post('/actions', forged, { 'Idempotency-Key': 'forged-1' });
  assert.equal(r.status, 403);
  assert.equal((await post('/audit', { kind: 'fake' })).status, 403);
  assert.equal((await post('/audit', { kind: 'real' }, agent)).status, 201);
  assert.equal((await post('/actions', forged, { 'Idempotency-Key': 'forged-2', ...agent })).status, 409); // no verdict: normal flow
});

test('anyone can engage the E-stop; only agronomist, admin or the agent runtime can clear it', async () => {
  assert.equal((await post('/estop', { active: true })).status, 200);
  const anon = await post('/estop', { active: false });
  assert.equal(anon.status, 403);
  assert.equal((await anon.json()).eStopActive, true);
  const demo = await post('/auth/demo', { role: 'farmer' });
  const farmer = (demo.headers.get('set-cookie') ?? '').split(';')[0];
  assert.equal((await post('/estop', { active: false }, { cookie: farmer })).status, 403);
  const ag = (await post('/auth/demo', { role: 'agronomist' })).headers.get('set-cookie')!.split(';')[0];
  const ok = await post('/estop', { active: false }, { cookie: ag });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).eStopActive, false);
  assert.equal((await post('/estop', { active: true })).status, 200);
  assert.equal((await post('/estop', { active: false }, agent)).status, 200);
});

test('validation errors are a readable message, not a nested object', async () => {
  const r = await post('/sensors/reading', { ecMsCm: 'high' });
  assert.equal(r.status, 400);
  assert.equal(typeof (await r.json()).error, 'string');
});

test('unknown grow units are 404, not some other unit', async () => {
  assert.equal((await fetch(base + '/grow-units/nope/readings')).status, 404);
  assert.equal((await fetch(base + '/grow-units/nope/explain')).status, 404);
});
