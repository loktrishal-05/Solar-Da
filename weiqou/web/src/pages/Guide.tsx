import React from 'react';
import { Link } from '../router';
import { useAuth } from '../auth';
import { Logo, SourceBadge, VerdictStamp } from '../ui';

const FLOW = [
  ['Something happens', 'A reading crosses a limit, a probe gives impossible values, a forecast changes, a leaf photo arrives, or someone presses Check now.'],
  ['Specialists propose', 'Irrigation, nutrient, climate and disease agents read the last 24 hours and suggest actions, each with a reason. The irrigation agent first tries the options in a crop simulation.'],
  ['The safety engine decides', 'Plain code with 13 rules checks every proposal: allow it, trim it, block it, or send it to a person. The AI cannot change these rules or talk its way past them.'],
  ['A person approves the risky ones', 'Treatments, large doses, and everything at autonomy level L1 wait for an agronomist. Their name goes into the record.'],
  ['Act, check, record', 'The action is sent exactly once, its effect is checked, and everything is written to a tamper-evident audit log. If any part is down, nothing is sent.'],
];

const ROLES = [
  ['Farmer', 'Sees the farm, runs scenarios, asks the assistant, checks leaf photos. Cannot approve treatments. Everyone starts here.'],
  ['Agronomist', 'Everything a farmer can do, plus approve or reject actions the safety engine sent to a person. Can clear the emergency stop.'],
  ['Admin', 'Everything an agronomist can do, plus manage users and give the agronomist role.'],
];

const LEVELS = [
  ['L0 Advise', 'The agent explains what it would do. Nothing is carried out.'],
  ['L1 Propose', 'Every action waits for a person to approve it.'],
  ['L2 Act in envelope', 'Safe actions inside the limits happen on their own; risky ones still wait for a person.'],
];

const SCENARIOS = [
  ['chennai_field_irrigation', 'A tomato bed near Chennai over ten days of March 2023 with real weather. The irrigation agent compares waiting, watering now and watering tonight in the crop simulation, and holds when rain is coming.'],
  ['diseased_leaf_rain', 'On 15 March a leaf photo shows late blight. The treatment waits for an agronomist; irrigation holds for the forecast rain.'],
  ['heatwave', 'One greenhouse day with a heat spike added. The climate agent proposes ventilation and shade.'],
  ['ph_excursion', 'The nutrient tank pH rises. The agent keeps asking to add pH-down; the safety engine enforces the mixing delay and the hourly dose cap, and ignores a broken backup probe.'],
  ['sensor_drift', 'A sensor slowly drifts. The data check flags it and the agent refuses to act on a reading it cannot trust.'],
];

const GLOSSARY = [
  ['Agent', 'A program that reads farm data and proposes what to do. Solarda has four specialists and an arbiter that merges their proposals.'],
  ['Safety engine', 'Fixed TypeScript code that decides whether a proposed action may happen. The only part of Solarda that can allow an action.'],
  ['Run', 'One time the agents wake up, look at the farm and propose actions, from trigger to audit.'],
  ['Trigger', 'The event that started a run: a limit crossed, a bad reading, a forecast, a photo, the weather, or a person pressing Check now.'],
  ['Verdict', 'The safety engine\'s answer to a proposal: allowed, modified (for example a shorter irrigation), blocked, or needs a human.'],
  ['Replayed data', 'Readings from public research datasets played back as if they were happening now, always labelled as replayed. Solarda has no live farm sensors yet.'],
  ['Crop simulation (twin)', 'AquaCrop, a crop model from the FAO, run with real weather to test irrigation options before acting.'],
  ['E-stop', 'Emergency stop. Anyone can press it; while it is on, every action is blocked. Only an agronomist or admin can clear it.'],
  ['Audit log', 'An append-only record of every proposal, verdict, approval and action. Each entry includes a fingerprint (hash) of the one before, so editing an earlier entry is detected.'],
  ['Abstain', 'When the leaf model is not confident enough, it refuses to guess and asks for a better photo.'],
];

const H2: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="scroll-mt-20 font-display text-2xl font-bold text-leaf-950">{children}</h2>
);

export const Guide: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-10 border-b border-leaf-100 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-5 py-3">
          <Link to="/"><Logo /></Link>
          <Link to={user ? '/app' : '/login'} className="ml-auto rounded-full bg-leaf-700 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-800">
            {user ? 'Open dashboard' : 'Try the demo'}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-12 px-5 py-10">
        <section>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-leaf-950">How Solarda works</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink/75">
            Solarda puts AI agents in charge of noticing problems on a farm and suggesting what to do. It does not let them act
            on their own judgement: a fixed set of safety rules decides, and anything risky waits for a qualified person.
          </p>
          <nav className="mt-5 flex flex-wrap gap-2 text-sm" aria-label="On this page">
            {[['flow', 'One decision'], ['roles', 'Roles'], ['levels', 'Autonomy levels'], ['verdicts', 'Verdicts'], ['data', 'Where data comes from'], ['scenarios', 'Scenarios'], ['glossary', 'Glossary']].map(([id, t]) => (
              <a key={id} href={`#${id}`} className="rounded-full border border-leaf-200 bg-white px-3 py-1 hover:border-leaf-600">{t}</a>
            ))}
          </nav>
        </section>

        <section className="space-y-4">
          <H2 id="flow">One decision, from start to finish</H2>
          <ol className="space-y-4">
            {FLOW.map(([t, b], i) => (
              <li key={t} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-leaf-700 font-display font-bold text-white">{i + 1}</span>
                <div><div className="font-semibold">{t}</div><p className="text-ink/75">{b}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <H2 id="roles">Roles</H2>
          <dl className="grid gap-3 sm:grid-cols-3">
            {ROLES.map(([t, b]) => <div key={t} className="rounded-xl border border-leaf-100 bg-white p-4"><dt className="font-semibold">{t}</dt><dd className="mt-1 text-[15px] text-ink/70">{b}</dd></div>)}
          </dl>
        </section>

        <section className="space-y-4">
          <H2 id="levels">Autonomy levels</H2>
          <p className="text-ink/75">The farmer chooses how much the agent may do by itself. Safety rules apply at every level.</p>
          <dl className="grid gap-3 sm:grid-cols-3">
            {LEVELS.map(([t, b]) => <div key={t} className="rounded-xl border border-leaf-100 bg-white p-4"><dt className="font-semibold">{t}</dt><dd className="mt-1 text-[15px] text-ink/70">{b}</dd></div>)}
          </dl>
        </section>

        <section className="space-y-4">
          <H2 id="verdicts">Verdicts</H2>
          <div className="grid gap-4 sm:grid-cols-2">
            {([['allow', 'The action is inside every limit and goes ahead.'], ['modify', 'The action goes ahead in a safer form, for example a shorter irrigation.'], ['veto', 'The action breaks a rule. Nothing is sent, and the rule is named.'], ['needs_human', 'The action may be fine, but a person must decide. It waits in Approvals.']] as const).map(([v, b]) => (
              <div key={v} className="flex items-start gap-4 rounded-xl border border-leaf-100 bg-white p-4"><VerdictStamp verdict={v} className="shrink-0 text-base" /><p className="text-[15px] text-ink/75">{b}</p></div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <H2 id="data">Where the data comes from</H2>
          <p className="text-ink/75">Every number on screen carries one of these labels.</p>
          <ul className="space-y-3 text-[15px]">
            <li className="flex items-start gap-3"><SourceBadge source="replay" className="shrink-0" /><span>Public research datasets (EDEN ISS greenhouse, HydroGrowNet) played back in time. Not your farm.</span></li>
            <li className="flex items-start gap-3"><SourceBadge source="sim" className="shrink-0" /><span>Computed by the crop simulation or added by a scenario, such as an extra heat spike.</span></li>
            <li className="flex items-start gap-3"><SourceBadge source="live" className="shrink-0" /><span>Real and current, such as today's weather forecast. Farm sensors will appear here once connected.</span></li>
            <li className="flex items-start gap-3"><SourceBadge source="sample" className="shrink-0" /><span>Example content that shows how a screen will look, such as community posts.</span></li>
          </ul>
        </section>

        <section className="space-y-4">
          <H2 id="scenarios">Scenarios in the Agent console</H2>
          <dl className="space-y-3">
            {SCENARIOS.map(([t, b]) => <div key={t}><dt className="font-mono text-sm font-semibold text-leaf-800">{t}</dt><dd className="text-[15px] text-ink/75">{b}</dd></div>)}
          </dl>
        </section>

        <section className="space-y-4">
          <H2 id="glossary">Glossary</H2>
          <dl className="divide-y divide-leaf-100 rounded-xl border border-leaf-100 bg-white">
            {GLOSSARY.map(([t, b]) => <div key={t} className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]"><dt className="font-semibold">{t}</dt><dd className="text-[15px] text-ink/75">{b}</dd></div>)}
          </dl>
        </section>
      </main>
    </div>
  );
};
