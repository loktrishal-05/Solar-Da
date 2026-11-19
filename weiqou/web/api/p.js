// Vercel edge proxy: forwards /agents, /vision and /api to the laptop server behind ngrok.
// Adds ngrok-skip-browser-warning, otherwise ngrok's free interstitial replaces every browser-style response.
// Only the app's own backend paths are reachable: the target is resolved first (so `..` cannot escape) and then checked.
// BACKEND_URL is used as an origin only (any path in it is ignored).
export const config = { runtime: 'edge' };
const BACKEND = process.env.BACKEND_URL || 'https://playpen-utensil-defender.ngrok-free.dev';
const ALLOWED = /^\/(api|agents|vision)\//;

export default function handler(req) {
  const u = new URL(req.url);
  const path = u.searchParams.get('p') ?? '';
  u.searchParams.delete('p');
  const backend = new URL(BACKEND);
  const target = new URL(path.replace(/^\/+/, ''), backend.origin + '/');
  // Encoded slashes and backslashes are refused too: a server behind the proxy may decode them into `../`.
  if (target.origin !== backend.origin || !ALLOWED.test(target.pathname) || /%2f|%5c/i.test(target.pathname)) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  target.search = u.search;
  const h = new Headers(req.headers);
  h.set('ngrok-skip-browser-warning', '1');
  h.delete('host');
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  return fetch(target, { method: req.method, headers: h, body: hasBody ? req.body : undefined, duplex: 'half', redirect: 'manual' });
}
