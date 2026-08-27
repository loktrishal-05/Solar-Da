import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Allow any host header so the app works behind tunnels (Cloudflare,
    // ngrok, localtunnel) and on the LAN. Without this, Vite blocks
    // requests whose Host header doesn't match localhost.
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy) => {
          // Silently swallow ECONNREFUSED when the API server isn't running.
          // The disease detector is fully client-side; the API is only needed
          // for store data, proposals, and Gemini chat (which is itself mocked).
          proxy.on('error', (err: any, _req: any, _res: any) => {
            if (err?.code === 'ECONNREFUSED') {
              // no-op
              return;
            }
            console.warn('[api proxy]', err?.message || err);
          });
        },
      },
    },
  },
});
