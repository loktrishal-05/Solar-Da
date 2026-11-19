// The Vercel proxy may only reach the backend's /api, /agents and /vision paths. Run: node --test weiqou/web/api/
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_URL = 'https://backend.example';
const { default: handler } = await import('./p.js');
const calls = [];
globalThis.fetch = async (url) => { calls.push(String(url)); return new Response('ok'); };
const hit = (p) => handler(new Request(`https://solarda.vercel.app/api/p?p=${encodeURIComponent(p)}&x=1`));

test('allowed backend paths are forwarded with their query string', async () => {
  calls.length = 0;
  for (const p of ['api/health', 'agents/runs', 'vision/metrics']) assert.equal((await hit(p)).status, 200);
  assert.deepEqual(calls, ['https://backend.example/api/health?x=1', 'https://backend.example/agents/runs?x=1', 'https://backend.example/vision/metrics?x=1']);
});

test('anything else is refused without contacting the backend', async () => {
  calls.length = 0;
  for (const p of ['', 'admin', 'api/../admin', 'agents/%2e%2e/secret', 'api/..%2f..%2fadmin', 'api/%5c..%5cadmin', '//evil.example/x', 'https://evil.example/', 'api']) {
    assert.equal((await hit(p)).status, 400, p);
  }
  assert.equal(calls.length, 0);
});
