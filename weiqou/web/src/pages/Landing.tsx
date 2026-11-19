import React, { useEffect, useState } from 'react';
import { Link } from '../router';
import { useAuth } from '../auth';
import { Logo, VerdictStamp, type VerdictKind } from '../ui';

// Three real outcomes of the safety engine (see packages/engine/src/agent_safety.ts and the red-team fixtures).
const DECISIONS: Array<{ agent: string; action: string; why: string; rule: string; verdict: VerdictKind }> = [
  {
    agent: 'Irrigation agent', action: 'Irrigate bed 2 for 12 minutes tonight',
    why: 'Soil water below target; crop twin shows less stress than waiting',
    rule: 'Inside the daily water budget, no rain forecast', verdict: 'allow',
  },
  {
    agent: 'Fertigation agent', action: 'Add 40 ml pH-down to tank 1',
    why: 'pH reads 6.9, target 5.5 to 6.5',
    rule: 'A dose went in 10 minutes ago and takes 30 to show. Mixing delay in progress', verdict: 'veto',
  },
  {
    agent: 'Disease agent', action: 'Treat tomato bed 1 for late blight',
    why: 'Leaf photo classified late blight at 0.99 confidence',
    rule: 'Treatments always need an agronomist, at every autonomy level', verdict: 'needs_human',
  },
];

const DecisionDemo: React.FC = () => {
  const [i, setI] = useState(1);
  const [stamped, setStamped] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setStamped(true); return; }
    setStamped(false);
    const s = setTimeout(() => setStamped(true), 1400);
    const n = setTimeout(() => setI((x) => (x + 1) % DECISIONS.length), 4600);
    return () => { clearTimeout(s); clearTimeout(n); };
  }, [i]);
  const d = DECISIONS[i];
  return (
    <div className="relative" aria-live="polite">
      <div className="rounded-2xl bg-white p-6 shadow-[0_30px_60px_-30px_rgba(12,38,28,0.45)] ring-1 ring-leaf-100">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-leaf-800">{d.agent} proposes</span>
          <span className="text-ink/50">replayed scenario</span>
        </div>
        <p className="mt-2 font-display text-2xl font-bold leading-snug text-leaf-950">{d.action}</p>
        <p className="mt-1 text-[15px] text-ink/70">{d.why}</p>
        <div className="mt-5 border-t border-dashed border-leaf-200 pt-4 pb-14">
          <div className="text-sm font-semibold text-ink/60">Safety engine</div>
          <p className={`mt-1 text-[15px] transition-opacity duration-500 ${stamped ? 'opacity-100' : 'opacity-0'}`}>{d.rule}</p>
        </div>
        <div className={`absolute right-6 bottom-5 transition-all duration-300 ${stamped ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}>
          <VerdictStamp verdict={d.verdict} className="bg-white/90 text-2xl" />
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {DECISIONS.map((x, k) => (
          <button key={k} onClick={() => setI(k)} aria-label={`Show: ${x.action}`}
                  className={`h-2 rounded-full transition-all ${k === i ? 'w-8 bg-leaf-700' : 'w-2 bg-leaf-200'}`} />
        ))}
      </div>
    </div>
  );
};

const STEPS = [
  ['Propose', 'Specialist agents for irrigation, nutrients, climate and disease read the last 24 hours of data and suggest what to do, with reasons.'],
  ['Check', 'A rule-based safety engine with 13 rules allows, trims or blocks each action. The language model cannot override it.'],
  ['Approve', 'Treatments and anything outside the safe range wait for an agronomist. Their name goes into the record.'],
  ['Act and log', 'The action is sent exactly once and written to a tamper-evident audit log. If any part is down, nothing is sent.'],
];

const COMPARE: Array<[string, string, string]> = [
  ['Who decides', 'The AI model', 'Safety engine, then a person for anything risky'],
  ['Data on screen', 'Shown as live', 'Tagged: replayed, simulated or live'],
  ['Unclear leaf photo', 'Guesses a disease', 'Asks for a better photo'],
  ['Chemical doses in chat', 'Answers', 'Refuses and sends the question to an expert'],
  ['Results', 'Claims', 'Every number has a source file and a command to re-run it'],
];

const RESULTS: Array<[string, string, string]> = [
  ['19 to 32%', 'less irrigation water than an ET-based schedule, at the same yield', 'Crop simulation, Chennai weather 2021 to 2023'],
  ['30 of 30', 'attacks blocked: prompt injection, unsafe doses, fake sensor data, Tamil jailbreaks', 'Red-team suite in the repo'],
  ['87%', 'right on field leaf photos it accepts. It asks for a retake on the rest', 'PlantDoc field test; 98.2% on lab photos'],
  ['6 languages', 'Tamil, Hindi, Telugu, Kannada, Malayalam and English, by text or voice', '100% of unsafe questions escalated in testing'],
];

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const cta = user ? '/app' : '/login';
  return (
    <div className="bg-paper text-ink">
      <header className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-5">
        <Logo />
        <nav className="ml-auto hidden md:flex items-center gap-6 text-[15px] text-ink/75" aria-label="Sections">
          <a href="#how" className="hover:text-leaf-800">How it works</a>
          <a href="#results" className="hover:text-leaf-800">Results</a>
          <a href="#team" className="hover:text-leaf-800">Team</a>
        </nav>
        <div className="ml-auto md:ml-0 flex items-center gap-2">
          {!user && <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-leaf-800 hover:bg-leaf-100">Sign in</Link>}
          <Link to={user ? '/app' : '/signup'} className="rounded-full bg-leaf-700 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-800">
            {user ? 'Open dashboard' : 'Create account'}
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div>
          <h1 className="font-display text-[clamp(2.4rem,5.5vw,4.4rem)] font-extrabold leading-[1.02] tracking-tight text-leaf-950">
            Farm agents that ask before they act
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
            Solarda watches farm data, proposes irrigation, nutrient and disease actions, and explains each one.
            A rule-based safety engine checks every action, and anything risky waits for an agronomist.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={cta} className="rounded-full bg-leaf-700 px-6 py-3 font-semibold text-white hover:bg-leaf-800">Open the live demo</Link>
            <a href="#how" className="rounded-full border border-leaf-200 bg-white px-6 py-3 font-semibold text-leaf-900 hover:border-leaf-600">See how it decides</a>
          </div>
          <p className="mt-6 text-sm text-ink/55">Runs on replayed public farm datasets. Nothing replayed is shown as live.</p>
        </div>
        <DecisionDemo />
      </section>

      <section className="bg-leaf-950 text-leaf-100">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3">
          {[
            ['Decisions by habit', 'Small farms decide irrigation, fertiliser and treatments with few sensors and no agronomist nearby. Mistakes waste water and can lose a crop.'],
            ['Events cannot wait', 'A heat spike, a failing probe or a diseased leaf needs a response in minutes, not at the next scheduled check.'],
            ['An AI with a valve is a risk', 'Language models can be wrong or manipulated. A pump or a chemical dose cannot depend on a model answer alone.'],
          ].map(([t, b]) => (
            <div key={t}>
              <h2 className="font-display text-xl font-bold text-white">{t}</h2>
              <p className="mt-2 leading-relaxed text-leaf-100/75">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-4xl font-bold tracking-tight text-leaf-950">One event, four steps</h2>
        <p className="mt-3 max-w-2xl text-lg text-ink/70">A reading crosses a limit, a probe fails, a forecast changes or a farmer sends a photo. The agent runs at once and every step is recorded.</p>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {STEPS.map(([t, b], k) => (
            <li key={t} className="border-t-2 border-leaf-700 pt-4">
              <div className="font-display text-sm font-bold text-leaf-700">Step {k + 1}</div>
              <h3 className="mt-1 font-display text-xl font-bold text-leaf-950">{t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{b}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="font-display text-3xl font-bold tracking-tight text-leaf-950">What is different</h2>
        <div className="mt-6 overflow-x-auto rounded-xl border border-leaf-100 bg-white">
          <table className="w-full min-w-[560px] text-left text-[15px]">
            <thead className="bg-leaf-50 text-sm text-ink/70">
              <tr><th className="px-5 py-3 font-medium" /><th className="px-5 py-3 font-medium">Typical farm chatbot</th><th className="px-5 py-3 font-semibold text-leaf-900">Solarda</th></tr>
            </thead>
            <tbody>
              {COMPARE.map(([k, a, b]) => (
                <tr key={k} className="border-t border-leaf-100">
                  <th className="px-5 py-3 font-semibold">{k}</th><td className="px-5 py-3 text-ink/60">{a}</td><td className="px-5 py-3 font-medium text-leaf-900">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="results" className="border-y border-leaf-100 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight text-leaf-950">Results you can re-run</h2>
          <p className="mt-3 max-w-2xl text-ink/70">From simulation and replayed public datasets, not field trials. Each number links to a file and a command in the repository.</p>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {RESULTS.map(([n, what, src]) => (
              <div key={n}>
                <div className="font-display text-4xl font-extrabold text-leaf-800">{n}</div>
                <p className="mt-2 text-[15px] leading-snug">{what}</p>
                <p className="mt-2 text-sm text-ink/55">{src}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-3xl font-bold tracking-tight text-leaf-950">Under the hood</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-[15px]">
          {[
            ['Web app', 'React, TypeScript, Tailwind'],
            ['Safety engine', 'TypeScript rules. The only part that can allow an action'],
            ['Agent runtime', 'Python, FastAPI, LangGraph, Gemini'],
            ['Crop twin', 'AquaCrop-OSPy with Open-Meteo weather'],
            ['Vision', 'EfficientNetV2 on ONNX Runtime, calibrated'],
          ].map(([t, b]) => (
            <div key={t} className="rounded-xl border border-leaf-100 bg-white p-4">
              <div className="font-semibold text-leaf-900">{t}</div>
              <div className="mt-1 text-ink/65">{b}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="team" className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="font-display text-3xl font-bold tracking-tight text-leaf-950">Team Unexpectedly_Qualified</h2>
        <p className="mt-2 text-ink/70">R M K College of Engineering and Technology, India. Agentic AI Hackathon 2026, team T046.</p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {['Harshavardhan K', 'Kinnera Cholan', 'Loktrishal K', 'Sanjjith B'].map((n) => (
            <li key={n} className="rounded-full border border-leaf-200 bg-white px-4 py-2 font-medium">{n}</li>
          ))}
        </ul>
      </section>

      <footer className="bg-leaf-950 text-leaf-100/75">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-8 text-sm">
          <Logo light />
          <span>No live farm sensors are connected. Readings come from public datasets (EDEN ISS, HydroGrowNet) or simulation and are labelled as such.</span>
        </div>
      </footer>
    </div>
  );
};
