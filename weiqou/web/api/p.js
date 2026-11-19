// Vercel edge proxy: forwards /agents, /vision and /api to the laptop server behind ngrok.
// Adds ngrok-skip-browser-warning, otherwise ngrok's free interstitial replaces every browser-style response.
export const config = { runtime: 'edge' };
const BACKEND = process.env.BACKEND_URL || 'https://playpen-utensil-defender.ngrok-free.dev';

export default function handler(req) {
  const u = new URL(req.url);
  const path = u.searchParams.get('p');
  u.searchParams.delete('p');
  const h = new Headers(req.headers);
  h.set('ngrok-skip-browser-warning', '1');
  h.delete('host');
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  return fetch(`${BACKEND}/${path}${u.search}`, { method: req.method, headers: h, body: hasBody ? req.body : undefined, duplex: 'half', redirect: 'manual' });
}
