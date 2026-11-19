// Approval gateway: only an agronomist or admin may approve or reject a paused agent run. The API stamps who decided
// (the browser's value is ignored), writes it to the audit log, and forwards to the agent runtime with the internal key.
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { internalKey, requireRole, type PublicUser } from './auth.js';
import { appendAudit } from './agent_routes.js';

const ResumeSchema = z.object({
  approvals: z.array(z.object({
    proposal_id: z.string(),
    decision: z.enum(['approve', 'reject']),
    ts: z.string().datetime(),
    note: z.string().max(500).optional(),
  })).min(1),
});

export const approvalsRouter = Router();

approvalsRouter.post('/runs/:id/resume', requireRole('agronomist', 'admin'), async (req: Request, res: Response) => {
  const p = ResumeSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message ?? 'invalid approvals' });
  const user = (req as Request & { user: PublicUser }).user;
  const by = `${user.name} (${user.role})`;
  const approvals = p.data.approvals.map((a) => ({ ...a, decided_by: by }));
  const agents = process.env.SOLARDA_AGENTS ?? 'http://127.0.0.1:8000';
  try {
    const r = await fetch(`${agents}/runs/${encodeURIComponent(req.params.id)}/resume`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Solarda-Internal': internalKey() },
      body: JSON.stringify({ approvals }),
    });
    const body = await r.json().catch(() => ({}));
    if (r.ok) appendAudit({ type: 'approval', run_id: req.params.id, by, approvals, ts: new Date().toISOString() });
    res.status(r.status).json(body);
  } catch {
    res.status(502).json({ detail: 'Agent runtime unreachable: nothing was approved' });
  }
});
