import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';

process.env.SOLARDA_RUNTIME_DIR = mkdtempSync(join(tmpdir(), 'solarda-'));
const { app } = await import('./app.js');
const { store } = await import('./store.js');

let server: Server;
let base = '';
before(() => new Promise<void>((ok) => { server = app.listen(0, () => { base = `http://127.0.0.1:${(server.address() as any).port}/api`; ok(); }); }));
after(() => server.close());

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

const ctx = { sim_time: '2020-03-01T12:00:00Z', autonomy: 'auto_in_envelope', zones: { tank1: { ph: 6.9, ec: 1.8, level_mm: 300 } } };
const phDose = (id: string, ml = 10) => ({ id, kind: 'dose_ph', zone: 'tank1', params: { ml, direction: 'down' }, rationale: 'pH high', evidence: [], expected_effect: 'ph -0.3 in 30m', confidence: 0.9 });

test('unsafe action is vetoed and cannot be dispatched', async () => {
  const unsafe = { ...phDose('u1'), zone: 'tank2' };
  const r = await (await post('/safety/check', { proposals: [unsafe], context: { ...ctx, zones: { tank2: { ph: 5.0, ec: 1.8, level_mm: 300 } } } })).json();
  assert.equal(r.verdicts[0].verdict, 'veto');
  assert.equal(r.verdicts[0].invariant, 'PH_WRONG_DIRECTION');
  const d = await post('/actions', { run_id: 'r', sim_time: ctx.sim_time, action: unsafe }, { 'Idempotency-Key': 'k-u1' });
  assert.equal(d.status, 422);
});

test('allowed action dispatches once per idempotency key and is audited', async () => {
  const a = phDose('a1');
  const r = await (await post('/safety/check', { proposals: [a], context: ctx })).json();
  assert.equal(r.verdicts[0].verdict, 'allow');
  const first = await post('/actions', { run_id: 'r1', sim_time: ctx.sim_time, action: a }, { 'Idempotency-Key': 'k-a1' });
  assert.equal(first.status, 201);
  const again = await (await post('/actions', { run_id: 'r1', sim_time: ctx.sim_time, action: a }, { 'Idempotency-Key': 'k-a1' })).json();
  assert.equal(again.replayed, true);
  const { actions } = await (await fetch(base + '/actions')).json();
  assert.equal(actions.filter((x: any) => x.idempotency_key === 'k-a1').length, 1);
  const { entries } = await (await fetch(base + '/audit?run_id=r1')).json();
  assert.ok(entries.some((e: any) => e.type === 'dispatched' && e.proposal_id === 'a1'));
});

test('action without a verdict is refused', async () => {
  const d = await post('/actions', { run_id: 'r', sim_time: ctx.sim_time, action: phDose('never-checked') }, { 'Idempotency-Key': 'k-n' });
  assert.equal(d.status, 409);
});

test('needs_human action requires an approval, E-STOP freezes dispatch', async () => {
  const t = { id: 't1', kind: 'treat_disease', zone: 'tower-a', params: { product: 'copper' }, rationale: 'blight', evidence: [], expected_effect: 'rescan', confidence: 0.8 };
  const r = await (await post('/safety/check', { proposals: [t], context: ctx })).json();
  assert.equal(r.verdicts[0].needs_human, true);
  assert.equal((await post('/actions', { run_id: 'r', sim_time: ctx.sim_time, action: t }, { 'Idempotency-Key': 'k-t1' })).status, 403);
  const approval = { proposal_id: 't1', decision: 'approve', decided_by: 'farmer', ts: ctx.sim_time };
  store.eStopActive = true;
  assert.equal((await post('/actions', { run_id: 'r', sim_time: ctx.sim_time, action: t, approval }, { 'Idempotency-Key': 'k-t1' })).status, 422);
  store.eStopActive = false;
  assert.equal((await post('/actions', { run_id: 'r', sim_time: ctx.sim_time, action: t, approval }, { 'Idempotency-Key': 'k-t1b' })).status, 201);
});

test('the seeded harvest passport verifies and a tampered block does not', async () => {
  const ok = await (await fetch(base + '/harvest-lots/LOT_2026_LETTUCE_01/passport')).json();
  assert.equal(ok.isPassportChainValid, true);
  const { store } = await import('./store.js');
  const chain = store.harvestLots[0].passportChain;
  const saved = chain[1].dosagesSummary;
  chain[1].dosagesSummary = ['Dose 999ml anything'];
  const bad = await (await fetch(base + '/harvest-lots/LOT_2026_LETTUCE_01/passport')).json();
  chain[1].dosagesSummary = saved;
  assert.equal(bad.isPassportChainValid, false);
});

test('marketplace listing is persisted to disk', async () => {
  const r = await (await post('/marketplace/listings', { harvestLotId: 'LOT_2026_LETTUCE_01', cropName: 'Methi', quantityKg: 5, pricePerKg: 60, location: 'Madurai' })).json();
  assert.equal(r.success, true);
  const { loadMarketplaceListings } = await import('./marketplace_store.js');
  assert.ok(loadMarketplaceListings().some((l) => l.id === r.listing.id));
});
