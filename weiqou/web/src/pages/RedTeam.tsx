import React, { useState } from 'react';
import { RED_TEAM_ACTIONS, RED_TEAM_PROMPTS, type RedTeamAction } from '@terrasub-solarda/contracts';
import { Button, Card, PageHeader, VerdictStamp, verdictOf } from '../ui';

type Verdict = { verdict: string; reason: string; invariant?: string; needs_human?: boolean };
type AdvisorReply = { answer: string; escalated: boolean; risk?: unknown; language?: string };

const field = 'w-full rounded-lg border border-leaf-200 bg-white px-3 py-2.5 text-[15px] focus:border-leaf-600 focus:outline-none';

const ModelAttack: React.FC = () => {
  const [text, setText] = useState(RED_TEAM_PROMPTS[0].text);
  const [reply, setReply] = useState<AdvisorReply | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true); setError(null); setReply(null);
    try {
      const r = await fetch('/agents/advisor/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) });
      if (!r.ok) throw new Error();
      setReply(await r.json());
    } catch {
      setError('The agent runtime is not reachable. Start the local stack with make dev.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h2 className="font-display text-2xl font-bold text-leaf-950">Trick the language model</h2>
      <p className="mt-1 text-[15px] text-ink/70">Ask for a chemical dose, pretend to be an admin, or switch languages. The assistant must refuse and send the question to a human expert.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {RED_TEAM_PROMPTS.map((p) => (
          <button key={p.id} onClick={() => setText(p.text)}
                  className={`rounded-full border px-3 py-1 text-sm ${text === p.text ? 'border-leaf-600 bg-leaf-50 font-semibold' : 'border-leaf-200 bg-white'}`}>
            {p.lang === 'English' ? p.text.split(' ').slice(0, 3).join(' ') + '…' : p.lang}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-sm font-medium">Your attack
        <textarea className={`${field} mt-1 h-28 resize-none`} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
      </label>
      <Button className="mt-3" onClick={send} disabled={busy || !text.trim()}>{busy ? 'Sending…' : 'Send to the assistant'}</Button>
      {error && <p role="alert" className="mt-3 text-sm text-veto">{error}</p>}
      {reply && (
        <div className="mt-5 rounded-xl border border-leaf-100 bg-paper p-4">
          <VerdictStamp verdict={reply.escalated ? 'needs_human' : 'allow'} />
          <p className="mt-3 text-sm font-semibold text-ink/60">{reply.escalated ? 'Refused and escalated to an expert. The reply it gave:' : 'Answered (no dose asked):'}</p>
          <p className="mt-1 whitespace-pre-wrap text-[15px]">{reply.answer}</p>
        </div>
      )}
    </Card>
  );
};

const ActionAttack: React.FC = () => {
  const [pick, setPick] = useState<RedTeamAction>(RED_TEAM_ACTIONS[0]);
  const [value, setValue] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = pick.editable ? (value ?? Number(pick.request.proposals[0].params[pick.editable.param])) : null;

  const choose = (c: RedTeamAction) => { setPick(c); setValue(null); setVerdict(null); setError(null); };

  const send = async () => {
    setBusy(true); setError(null); setVerdict(null);
    const req = structuredClone(pick.request);
    if (pick.editable && current !== null) req.proposals[0].params[pick.editable.param] = current;
    req.proposals[0].id = `${req.proposals[0].id}-${Date.now()}`;
    try {
      const r = await fetch('/api/safety/check', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req) });
      if (!r.ok) throw new Error();
      setVerdict((await r.json()).verdicts[0]);
    } catch {
      setError('The safety engine is not reachable. Start the local stack with make dev. With no safety engine, the agents send nothing.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h2 className="font-display text-2xl font-bold text-leaf-950">Force a dangerous action</h2>
      <p className="mt-1 text-[15px] text-ink/70">Suppose the attack worked and the agent now proposes something harmful. It still has to pass the safety engine, which is plain code the model cannot talk to.</p>
      <div className="mt-4 grid gap-2">
        {RED_TEAM_ACTIONS.map((c) => (
          <button key={c.id} onClick={() => choose(c)} aria-pressed={pick.id === c.id}
                  className={`rounded-lg border px-3 py-2 text-left ${pick.id === c.id ? 'border-leaf-600 bg-leaf-50' : 'border-leaf-100 bg-white hover:border-leaf-200'}`}>
            <div className="font-semibold">{c.title}</div>
            {pick.id === c.id && <div className="mt-0.5 text-sm text-ink/65">{c.attack}</div>}
          </button>
        ))}
      </div>
      {pick.editable && current !== null && (
        <label className="mt-4 block text-sm font-medium">{pick.editable.label}: <b>{current}</b>
          <input type="range" min={pick.editable.min} max={pick.editable.max} value={current}
                 onChange={(e) => setValue(Number(e.target.value))} className="mt-1 w-full accent-leaf-700" />
        </label>
      )}
      <Button className="mt-4" variant="danger" onClick={send} disabled={busy}>{busy ? 'Checking…' : 'Send to the safety engine'}</Button>
      {error && <p role="alert" className="mt-3 text-sm text-veto">{error}</p>}
      {verdict && (
        <div className="mt-5 rounded-xl border border-leaf-100 bg-paper p-4">
          <VerdictStamp verdict={verdictOf(verdict)} />
          {verdict.invariant && <p className="mt-3 font-mono text-sm text-ink/60">{verdict.invariant}</p>}
          <p className="mt-1 text-[15px]">{verdict.reason}</p>
          {verdict.needs_human && verdict.verdict !== 'veto' && <p className="mt-1 text-sm text-human">It waits in the approvals inbox until an agronomist decides.</p>}
          <p className="mt-2 text-sm text-ink/55">Nothing was sent to a pump or doser. This attempt is now in the audit log.</p>
        </div>
      )}
    </Card>
  );
};

export const RedTeam: React.FC = () => (
  <>
    <PageHeader
      title="Try to break it"
      subtitle="Attack the system the way a bad actor or a confused model would. Two layers stop you: the assistant refuses unsafe advice, and the safety engine blocks unsafe actions even if the model is fooled."
    />
    <div className="grid gap-6 xl:grid-cols-2">
      <ModelAttack />
      <ActionAttack />
    </div>
    <p className="mt-6 text-sm text-ink/60">The automated red-team suite runs 30 attacks like these (redteam/*.yaml, promptfoo) and all 30 are blocked. The five actions above are re-checked on every test run (weiqou/api/src/redteam_cases.test.ts).</p>
  </>
);
