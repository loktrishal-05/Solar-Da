// Shared by the Agent console and the Approvals page. Goes through the API, which checks the signed-in role,
// records who decided (weiqou/api/src/approvals.ts) and forwards to the agent runtime.
export type PendingAction = { verdict: { verdict: string; reason: string; needs_human?: boolean; invariant?: string; modified_params?: Record<string, unknown> }; action: { id: string; kind: string; zone: string; params: Record<string, unknown>; rationale: string; expected_effect: string } };
export type ApprovalRequest = { type: string; run_id: string; sim_time: string; actions: PendingAction[] };

export async function decideRun(req: ApprovalRequest, decision: 'approve' | 'reject'): Promise<string | null> {
  const approvals = req.actions.map((a) => ({ proposal_id: a.action.id, decision, ts: req.sim_time }));
  try {
    const r = await fetch(`/api/runs/${encodeURIComponent(req.run_id)}/resume`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvals }),
    });
    if (r.ok) return null;
    const b = await r.json().catch(() => ({}));
    return b.detail ?? b.error ?? `Could not ${decision} (HTTP ${r.status})`;
  } catch {
    return 'Cannot reach the Solarda API. Nothing was approved.';
  }
}

export async function pendingApprovals(): Promise<ApprovalRequest[]> {
  const runs: Record<string, { status: string; approval_request: ApprovalRequest | null }> = await fetch('/agents/runs').then((r) => r.json());
  return Object.values(runs).filter((r) => r.status === 'awaiting_approval' && r.approval_request).map((r) => r.approval_request!);
}
