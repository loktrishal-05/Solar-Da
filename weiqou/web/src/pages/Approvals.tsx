import React, { useCallback, useEffect, useState } from 'react';
import { Link } from '../router';
import { useAuth, canApprove } from '../auth';
import { decideRun, pendingApprovals, type ApprovalRequest } from '../approvals';
import { Button, Card, EmptyState, PageHeader, SourceBadge, VerdictStamp } from '../ui';

type Decided = { run_id: string; by: string; ts: string; approvals: Array<{ proposal_id: string; decision: string }> };

const KIND: Record<string, string> = {
  treat_disease: 'Treat for disease', dose_ph: 'Adjust pH', dose_nutrient: 'Add nutrients', irrigate: 'Irrigate',
  ventilate: 'Ventilate', shade: 'Shade', alert: 'Send alert', no_op: 'No action',
};
const fmt = (k: string, v: unknown) =>
  k === 'confidence' && typeof v === 'number' ? `${Math.round(v * 100)}%` : String(v).replace(/_+/g, ' ');
const params = (p: Record<string, unknown>) =>
  Object.entries(p).filter(([k, v]) => typeof v !== 'object' && k !== 'note').map(([k, v]) => `${k.replace(/_/g, ' ')}: ${fmt(k, v)}`).join(' · ');

export const Approvals: React.FC = () => {
  const { user } = useAuth();
  const approver = canApprove(user);
  const [pending, setPending] = useState<ApprovalRequest[]>([]);
  const [history, setHistory] = useState<Decided[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pull = useCallback(async () => {
    try {
      setPending(await pendingApprovals());
      const audit = await fetch('/api/audit').then((r) => r.json());
      setHistory((audit.entries ?? []).filter((e: any) => e.type === 'approval').reverse());
    } catch { /* backend down: the shell shows the banner */ }
  }, []);

  useEffect(() => {
    pull();
    const t = setInterval(pull, 4000);
    return () => clearInterval(t);
  }, [pull]);

  const decide = async (req: ApprovalRequest, d: 'approve' | 'reject') => {
    setBusy(req.run_id); setError(null);
    const err = await decideRun(req, d);
    setBusy(null);
    if (err) setError(err);
    pull();
  };

  return (
    <>
      <PageHeader
        title="Approvals"
        subtitle={approver
          ? 'The safety engine sent these to a person. Approve to let the agent carry them out, or reject to stop them. Your name is recorded.'
          : 'Actions the safety engine sent to a person. Only an agronomist can approve or reject them.'}
        actions={<SourceBadge source="replay" />}
      />
      {error && <p role="alert" className="mb-4 rounded-lg border border-veto/30 bg-red-50 px-4 py-2 text-sm text-veto">{error}</p>}

      {!pending.length ? (
        <EmptyState title="Nothing is waiting" body="Treatments, large doses and every action at autonomy level L1 pause here. Run the disease scenario in the agent console to see one arrive."
                    action={<Link to="/app/console" className="font-semibold text-leaf-700 underline">Open the agent console</Link>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pending.map((req) => (
            <Card key={req.run_id} as="article" className="border-human/30">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm text-ink/70">Run {req.run_id} · farm time {req.sim_time.slice(5, 16).replace('T', ' ')}</div>
                <VerdictStamp verdict="needs_human" className="text-base shrink-0" />
              </div>
              <ul className="mt-3 space-y-4">
                {req.actions.map(({ action, verdict }) => (
                  <li key={action.id}>
                    <div className="font-display text-xl font-bold text-leaf-950">{KIND[action.kind] ?? action.kind} · {action.zone}</div>
                    <div className="text-[15px] text-ink/80">{params(verdict.modified_params ?? action.params)}</div>
                    <p className="mt-1 text-[15px]"><span className="text-ink/70">Why the agent wants it: </span>{action.rationale}</p>
                    <p className="text-[15px]"><span className="text-ink/70">Safety engine: </span>{verdict.reason}</p>
                    <p className="text-sm text-ink/70">Expected result: {action.expected_effect}</p>
                    {typeof action.params.note === 'string' && <p className="mt-1 text-sm italic text-ink/70">{action.params.note}</p>}
                  </li>
                ))}
              </ul>
              {approver ? (
                <div className="mt-5 flex gap-2">
                  <Button onClick={() => decide(req, 'approve')} disabled={busy === req.run_id}>Approve and carry out</Button>
                  <Button variant="secondary" onClick={() => decide(req, 'reject')} disabled={busy === req.run_id} className="text-veto">Reject</Button>
                </div>
              ) : (
                <p className="mt-5 text-sm font-semibold text-human">Waiting for an agronomist. Sign in with an agronomist account to decide.</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8">
        <h2 className="font-display text-xl font-bold">Decisions</h2>
        {!history.length ? <p className="mt-2 text-sm text-ink/70">No decisions yet.</p> : (
          <ul className="mt-3 divide-y divide-leaf-100">
            {history.slice(0, 15).map((h) => (
              <li key={h.run_id + h.ts} className="flex flex-wrap items-center gap-3 py-3 text-[15px]">
                {h.approvals.map((a) => (
                  <span key={a.proposal_id} className={`rounded-md border-2 px-2 py-0.5 text-sm font-bold ${a.decision === 'approve' ? 'border-allow text-allow' : 'border-veto text-veto'}`}>
                    {a.decision === 'approve' ? 'Approved' : 'Rejected'}
                  </span>
                ))}
                <span className="font-semibold">{h.by}</span>
                <span className="text-ink/70">run {h.run_id}</span>
                <span className="ml-auto text-sm text-ink/70">{new Date(h.ts).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
};
