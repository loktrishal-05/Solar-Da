import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { RED_TEAM_ACTIONS } from '@terrasub-solarda/contracts';

process.env.SOLARDA_RUNTIME_DIR = mkdtempSync(join(tmpdir(), 'solarda-rt-'));
let api: Server;
let base = '';
before(async () => {
  const { app } = await import('./app.js');
  api = app.listen(0);
  await new Promise<void>((ok) => api.on('listening', ok));
  base = `http://127.0.0.1:${(api.address() as any).port}/api`;
});
after(() => api.close());

test('there are at least five live red-team action cases', () => {
  assert.ok(RED_TEAM_ACTIONS.length >= 5);
});

for (const c of RED_TEAM_ACTIONS) {
  test(`red team "${c.id}" is stopped by the safety engine (${c.expect})`, async () => {
    const r = await fetch(base + '/safety/check', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(c.request),
    });
    assert.equal(r.status, 200);
    const [v] = (await r.json()).verdicts;
    if (c.expect === 'veto') assert.equal(v.verdict, 'veto', `${c.id}: ${v.reason}`);
    else assert.equal(v.needs_human, true, `${c.id}: ${v.reason}`);
  });
}
