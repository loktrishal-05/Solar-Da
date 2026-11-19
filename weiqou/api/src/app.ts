import express, { type NextFunction, type Request, type Response } from 'express';
import { router } from './routes.js';
import { agentRouter } from './agent_routes.js';
import { authRouter } from './auth.js';
import { approvalsRouter } from './approvals.js';

export const app = express();
app.disable('x-powered-by');

// The web app is served from the same origin (Vite proxy locally, nginx in Docker), so no CORS headers are sent:
// other sites cannot read API responses with the user's cookie.
app.use('/api', (_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Cache-Control': 'no-store',
  });
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use('/api', authRouter);
app.use('/api', approvalsRouter);
app.use('/api', router);
app.use('/api', agentRouter);

app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// Errors always answer JSON without stack traces.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request body is not valid JSON' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'The request body is too large (10 MB max)' });
  console.error('[api] unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on the server. Nothing was changed.' });
});
