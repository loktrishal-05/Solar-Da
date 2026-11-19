// The audit log is hash-chained: editing any past entry is detected by /api/audit/verify.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';

const dir = mkdtempSync(join(tmpdir(), 'solarda-chain-'));
process.env.SOLARDA_RUNTIME_DIR = dir;
let api: Server;
let base = '';
before(async () => {
  const { app } = await import('./app.js');
  api = app.listen(0);
  await new Promise<void>((ok) => api.on('listening', ok));
  base = `http://127.0.0.1:${(api.address() as any).port}/api`;
});
after(() => api.close());

const audit = (kind: string) => fetch(base + '/audit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind }) });

test('each audit entry carries the hash of the previous one', async () => {
  for (const k of ['a', 'b', 'c']) assert.equal((await audit(k)).status, 201);
  const { entries } = await (await fetch(base + '/audit')).json();
  assert.equal(entries.length, 3);
  assert.equal(entries[0].prev, 'GENESIS');
  assert.equal(entries[1].prev, entries[0].hash);
  assert.equal(entries[2].prev, entries[1].hash);
  assert.match(entries[2].hash, /^[0-9a-f]{64}$/);
  const v = await (await fetch(base + '/audit/verify')).json();
  assert.deepEqual(v, { ok: true, entries: 3 });
});

test('editing a past entry breaks the chain at that entry', async () => {
  const f = join(dir, 'audit.jsonl');
  const lines = readFileSync(f, 'utf8').trim().split('\n');
  const e = JSON.parse(lines[1]);
  e.kind = 'edited';
  lines[1] = JSON.stringify(e);
  writeFileSync(f, lines.join('\n') + '\n');
  const v = await (await fetch(base + '/audit/verify')).json();
  assert.equal(v.ok, false);
  assert.equal(v.broken_at, 1);
});
