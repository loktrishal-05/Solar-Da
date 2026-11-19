import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';

const dir = mkdtempSync(join(tmpdir(), 'solarda-auth-'));
process.env.SOLARDA_RUNTIME_DIR = dir;
delete process.env.SESSION_SECRET;
const seed = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../seed/users.json'), 'utf8'));
const seededAgronomist = seed.find((u: any) => u.role === 'agronomist');

let api: Server;
let base = '';
before(async () => {
  const { app } = await import('./app.js');
  api = app.listen(0);
  await new Promise<void>((ok) => api.on('listening', ok));
  base = `http://127.0.0.1:${(api.address() as any).port}/api/auth`;
});
after(() => api.close());

const post = (path: string, body: unknown) =>
  fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const cookieOf = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0];
const me = (cookie: string) => fetch(base + '/me', { headers: { cookie } });

test('signup creates a farmer and the session cookie identifies them', async () => {
  const r = await post('/signup', { name: 'Ravi', email: 'ravi@example.com', password: 'longenough1' });
  assert.equal(r.status, 201);
  const m = await me(cookieOf(r));
  assert.equal(m.status, 200);
  const { user } = await m.json();
  assert.equal(user.email, 'ravi@example.com');
  assert.equal(user.role, 'farmer');
  assert.equal(user.password, undefined);
});

test('signup with the same email in another case is a conflict', async () => {
  await post('/signup', { name: 'A', email: 'dup@example.com', password: 'longenough1' });
  const r = await post('/signup', { name: 'B', email: 'DUP@Example.com', password: 'longenough1' });
  assert.equal(r.status, 409);
});

test('signup always creates a farmer, whatever role is sent', async () => {
  for (const [i, role] of ['admin', 'agronomist'].entries()) {
    const r = await post('/signup', { name: 'X', email: `x${i}@example.com`, password: 'longenough1', role });
    assert.equal(r.status, 201);
    assert.equal((await r.json()).user.role, 'farmer');
  }
});

test('one-click demo sign-in returns each seeded role with a working session', async () => {
  for (const role of ['farmer', 'agronomist', 'admin']) {
    const r = await post('/demo', { role });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).user.role, role);
    const m = await me(cookieOf(r));
    assert.equal((await m.json()).user.role, role);
  }
});

test('demo sign-in rejects unknown roles', async () => {
  assert.equal((await post('/demo', { role: 'root' })).status, 400);
  assert.equal((await post('/demo', {})).status, 400);
});

test('demo sign-in can be switched off', async () => {
  process.env.SOLARDA_DEMO_LOGIN = '0';
  try {
    const r = await post('/demo', { role: 'farmer' });
    assert.equal(r.status, 404);
    assert.equal(r.headers.get('set-cookie'), null);
  } finally {
    delete process.env.SOLARDA_DEMO_LOGIN;
  }
});

test('short passwords are rejected', async () => {
  const r = await post('/signup', { name: 'S', email: 's@example.com', password: 'short' });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, 'Password must be at least 8 characters');
  const bad = await post('/signup', { name: 'S', email: 'not-an-email', password: 'longenough1' });
  assert.equal((await bad.json()).error, 'Enter a valid email address');
});

test('login: wrong password 401, seeded agronomist 200', async () => {
  assert.equal((await post('/login', { email: seededAgronomist.email, password: 'wrong-password' })).status, 401);
  const ok = await post('/login', { email: seededAgronomist.email, password: seededAgronomist.password });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).user.role, 'agronomist');
});

test('a tampered cookie is rejected', async () => {
  const r = await post('/login', { email: seededAgronomist.email, password: seededAgronomist.password });
  const c = cookieOf(r);
  const bad = c.slice(0, -1) + (c.endsWith('0') ? '1' : '0');
  assert.equal((await me(bad)).status, 401);
  assert.equal((await me('')).status, 401);
  assert.equal((await me('solarda_session=abc.' + 'z'.repeat(64))).status, 401);
});

test('logout clears the cookie', async () => {
  const r = await post('/logout', {});
  assert.equal(r.status, 204);
  assert.match(r.headers.get('set-cookie') ?? '', /Max-Age=0/);
});

test('passwords are never stored in plain text', () => {
  const raw = readFileSync(join(dir, 'users.json'), 'utf8');
  assert.ok(!raw.includes('longenough1'));
  assert.ok(!raw.includes(seededAgronomist.password));
  assert.match(raw, /scrypt\$/);
});

test('sessions survive an API restart (secret persisted in the runtime dir)', async () => {
  const r = await post('/login', { email: seededAgronomist.email, password: seededAgronomist.password });
  const cookie = cookieOf(r);
  const restarted = './auth.js?restart'; // a new module instance re-reads the secret, like a restarted process
  const fresh = await import(restarted);
  const user = fresh.currentUser({ headers: { cookie } } as any);
  assert.equal(user?.role, 'agronomist');
});

test('admin users API: only admins, role changes, never zero admins', async () => {
  const demo = async (role: string) => cookieOf(await post('/demo', { role }));
  const admin = await demo('admin');
  const farmer = await demo('farmer');
  const api = base.replace('/auth', '/admin');
  const req = (path: string, cookie: string, init: RequestInit = {}) =>
    fetch(api + path, { ...init, headers: { 'content-type': 'application/json', cookie, ...(init.headers ?? {}) } });

  assert.equal((await req('/users', '')).status, 401);
  assert.equal((await req('/users', farmer)).status, 403);
  const list = await req('/users', admin);
  assert.equal(list.status, 200);
  const { users } = await list.json();
  assert.ok(users.length >= 3);
  assert.ok(users.every((u: any) => u.password === undefined));

  const ravi = users.find((u: any) => u.email === 'ravi@example.com');
  const promote = await req(`/users/${ravi.id}`, admin, { method: 'PATCH', body: JSON.stringify({ role: 'agronomist' }) });
  assert.equal(promote.status, 200);
  assert.equal((await promote.json()).user.role, 'agronomist');

  assert.equal((await req(`/users/${ravi.id}`, admin, { method: 'PATCH', body: JSON.stringify({ role: 'king' }) })).status, 400);
  assert.equal((await req('/users/nope', admin, { method: 'PATCH', body: JSON.stringify({ role: 'farmer' }) })).status, 404);
  assert.equal((await req(`/users/${ravi.id}`, farmer, { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) })).status, 403);

  const me = users.find((u: any) => u.role === 'admin');
  const demote = await req(`/users/${me.id}`, admin, { method: 'PATCH', body: JSON.stringify({ role: 'farmer' }) });
  assert.equal(demote.status, 409);
});

test('the seeded demo accounts keep their roles, so the one-click buttons always work', async () => {
  const admin = cookieOf(await post('/demo', { role: 'admin' }));
  const api = base.replace('/auth', '/admin');
  const { users } = await (await fetch(api + '/users', { headers: { cookie: admin } })).json();
  const farmer = users.find((u: any) => u.email === 'farmer@solarda.demo');
  const r = await fetch(api + `/users/${farmer.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json', cookie: admin }, body: JSON.stringify({ role: 'agronomist' }) });
  assert.equal(r.status, 409);
  assert.equal((await post('/demo', { role: 'farmer' })).status, 200);
});

test('repeated wrong passwords lock that email for a while (429 with Retry-After)', async () => {
  await post('/signup', { name: 'Target', email: 'target@example.com', password: 'correct-horse-1' });
  for (let i = 0; i < 10; i++) assert.equal((await post('/login', { email: 'target@example.com', password: `wrong-${i}` })).status, 401);
  const locked = await post('/login', { email: 'TARGET@example.com', password: 'correct-horse-1' });
  assert.equal(locked.status, 429);
  assert.ok(Number(locked.headers.get('retry-after')) > 0);
  assert.match((await locked.json()).error, /Too many/);
  // Other accounts are unaffected.
  assert.equal((await post('/login', { email: seededAgronomist.email, password: seededAgronomist.password })).status, 200);
});

test('oversized emails are rejected before they are remembered (no memory growth, never 429)', async () => {
  const huge = 'x'.repeat(300) + '@example.com';
  for (let i = 0; i < 11; i++) assert.equal((await post('/login', { email: huge, password: 'whatever-1' })).status, 401);
});
