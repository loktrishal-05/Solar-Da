import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ClipboardCheck, Code2, ShieldCheck, Sprout } from 'lucide-react';
import { Link } from '../router';
import { useAuth } from '../auth';
import { Logo, VerdictStamp, type VerdictKind } from '../ui';

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Story: four moments of one rulebook, pinned while the page scrolls ----------
type Moment = { step: string; title: string; body: string; card: { who: string; head: string; detail: string; rule?: string; verdict?: VerdictKind; by?: string } };
const MOMENTS: Moment[] = [
  {
    step: 'Notice', title: 'Something changes on the farm',
    body: 'The nutrient tank pH climbs past its target. Solarda does not wait for the next scheduled check: the reading itself wakes the agents.',
    card: { who: 'Trigger · tank 1', head: 'pH 6.9 and rising', detail: 'Target 5.5 to 6.5. Backup probe reads 11.4, which no real tank can, so it is ignored.' },
  },
  {
    step: 'Propose', title: 'An agent suggests what to do',
    body: 'The fertigation agent proposes a pH-down dose and explains why. It can propose as often as it likes. It cannot act.',
    card: { who: 'Fertigation agent proposes', head: 'Add 12 ml pH-down to tank 1', detail: 'Reason: pH 6.9 above 6.5. Expected: about −0.2 pH in 30 minutes.' },
  },
  {
    step: 'Decide', title: 'Plain code decides, not the AI',
    body: 'The safety engine checks 13 rules. 46 ml already went in this hour; another 12 ml would pass the 50 ml cap. Blocked, nothing reaches the pump, and the reason is logged.',
    card: { who: 'Safety engine', head: 'Add 12 ml pH-down to tank 1', detail: '46 ml dosed in the last hour + 12 ml > 50 ml.', rule: 'MAX_DOSE_PER_HOUR', verdict: 'veto' },
  },
  {
    step: 'Approve', title: 'Risky actions wait for a person',
    body: 'A leaf photo shows late blight. The agent proposes treatment, but treatments always need an agronomist. She signs in, reads the evidence and decides. Her name goes into the record.',
    card: { who: 'Disease agent · bed 1', head: 'Treat for late blight', detail: 'Leaf photo: late blight at 99% confidence. No product or dose is chosen by the agent.', verdict: 'needs_human', by: 'Approved by Dr. Priya S, agronomist' },
  },
];

// One small picture per moment, so the card shows the idea, not just text.
const Visual: React.FC<{ k: number; active: boolean }> = ({ k, active }) => {
  if (k === 0) return (
    <svg viewBox="0 0 320 110" className="mt-5 w-full" role="img" aria-label="pH rising above the 5.5 to 6.5 target band">
      <rect x="0" y="38" width="320" height="44" fill="#E3EFE6" />
      <text x="6" y="52" fontSize="10" fill="#1F5A3F">target 5.5–6.5</text>
      <polyline fill="none" stroke="#B3401F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        points="0,70 40,68 80,66 120,62 160,55 200,46 240,34 280,22 310,14"
        style={{ strokeDasharray: 400, strokeDashoffset: active ? 0 : 400, transition: 'stroke-dashoffset 1.4s ease-out' }} />
      <circle cx="310" cy="14" r="6" fill="#B3401F" className={active ? 'animate-ping origin-center' : ''} style={{ transformBox: 'fill-box' }} />
      <circle cx="310" cy="14" r="4" fill="#B3401F" />
    </svg>
  );
  if (k === 1) return (
    <ul className="mt-5 grid grid-cols-2 gap-2 text-sm">
      {[['Irrigation', 'no action'], ['Climate', 'no action'], ['Disease', 'no action'], ['Fertigation', 'dose 12 ml']].map(([a, b], n) => (
        <li key={a} className={`rounded-lg border px-3 py-2 transition-all duration-500 ${n === 3 ? 'border-leaf-600 bg-leaf-50 font-semibold' : 'border-leaf-100 text-ink/50'}`}
            style={{ transitionDelay: active ? `${n * 120}ms` : '0ms', opacity: active ? 1 : 0 }}>{a}: {b}</li>
      ))}
    </ul>
  );
  if (k === 2) return (
    <ul className="mt-5 space-y-1.5 text-sm">
      {[['E-stop is off', true], ['Reading is plausible', true], ['Dose pushes pH the right way', true], ['Mixing delay has passed', true], ['Hourly dose cap: 46 + 12 > 50 ml', false]].map(([t, ok], n) => (
        <li key={String(t)} className={`flex items-center gap-2 transition-all duration-300 ${ok ? 'text-ink/60' : 'font-semibold text-veto'}`}
            style={{ transitionDelay: active ? `${n * 110}ms` : '0ms', opacity: active ? 1 : 0, transform: active ? 'none' : 'translateX(-8px)' }}>
          <span className={`grid h-5 w-5 place-items-center rounded-full text-xs text-white ${ok ? 'bg-allow' : 'bg-veto'}`}>{ok ? '✓' : '✕'}</span>{t}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="mt-5 flex items-center gap-4">
      <img src="/media/plant-samples/potato-late-blight.jpg" alt="Leaf with late blight (PlantVillage sample)" className="h-20 w-20 rounded-xl object-cover ring-1 ring-leaf-100" loading="lazy" />
      <div className="text-sm text-ink/60">Disease agent → safety engine → <span className="font-semibold text-human">needs a human</span> → agronomist</div>
    </div>
  );
};

const StoryCard: React.FC<{ m: Moment; k: number; active: boolean; stacked?: boolean }> = ({ m, k, active, stacked }) => (
  <div className={`${stacked ? 'relative' : 'absolute inset-0'} transition-all duration-500 ${active ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-6'}`} aria-hidden={!active}>
    <div className="relative h-full rounded-3xl bg-white p-7 pb-24 shadow-[0_40px_80px_-40px_rgba(12,38,28,0.55)] ring-1 ring-leaf-100">
      <div className="text-sm font-semibold text-leaf-700">{m.card.who}</div>
      <div className="mt-2 font-display text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold leading-tight text-leaf-950">{m.card.head}</div>
      <p className="mt-2 text-[15px] text-ink/70">{m.card.detail}</p>
      <Visual k={k} active={active} />
      {m.card.rule && <p className="mt-4 font-mono text-sm text-veto">{m.card.rule}</p>}
      {m.card.by && <p className="mt-4 text-[15px] font-semibold text-allow">{m.card.by}</p>}
      <p className="mt-5 max-w-[55%] text-xs text-ink/45">Example from the replayed demo scenarios</p>
      {m.card.verdict && (
        <div className={`absolute bottom-7 right-7 transition-all delay-200 duration-300 ${active ? 'scale-100 opacity-100' : 'scale-150 opacity-0'}`}>
          <VerdictStamp verdict={m.card.verdict} className="bg-white/90 text-3xl" />
        </div>
      )}
    </div>
  </div>
);

const Story: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  // Pinned scrolling only on wide screens with motion allowed; phones and reduced motion get the stacked version.
  const canPin = () => !reducedMotion() && window.matchMedia('(min-width: 1024px)').matches;
  const [pinned, setPinned] = useState(canPin);
  useEffect(() => {
    if (!pinned) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const progress = Math.min(0.999, Math.max(0, -r.top / (r.height - window.innerHeight)));
        setI(Math.floor(progress * MOMENTS.length));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [pinned]);
  useEffect(() => {
    const qs = [window.matchMedia('(prefers-reduced-motion: reduce)'), window.matchMedia('(min-width: 1024px)')];
    const f = () => setPinned(canPin());
    qs.forEach((q) => q.addEventListener('change', f));
    return () => qs.forEach((q) => q.removeEventListener('change', f));
  }, []);

  if (!pinned) {
    return (
      <section id="story" className="mx-auto max-w-6xl space-y-12 px-5 py-20">
        <h2 className="font-display text-4xl font-bold text-leaf-950">Four moments, one rulebook</h2>
        {MOMENTS.map((m, k) => (
          <div key={m.step} className="grid gap-6 md:grid-cols-2">
            <div><div className="text-sm font-semibold text-leaf-700">Step {k + 1} · {m.step}</div><h3 className="mt-1 font-display text-2xl font-bold">{m.title}</h3><p className="mt-2 text-ink/70">{m.body}</p></div>
            <StoryCard m={m} k={k} active stacked />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section id="story" ref={ref} className="relative" style={{ height: `${MOMENTS.length * 90 + 30}vh` }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.05] text-leaf-950">Four moments,<br />one rulebook</h2>
            <ol className="mt-8 space-y-1" aria-label="Steps">
              {MOMENTS.map((m, k) => (
                <li key={m.step} className={`border-l-2 py-3 pl-5 transition-all duration-500 ${k === i ? 'border-leaf-700' : 'border-leaf-100'}`}>
                  <div className={`text-sm font-semibold transition-colors ${k === i ? 'text-leaf-700' : 'text-ink/35'}`}>Step {k + 1} · {m.step}</div>
                  <div className={`grid transition-all duration-500 ${k === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <h3 className="mt-1 font-display text-2xl font-bold text-leaf-950">{m.title}</h3>
                      <p className="mt-2 max-w-md text-[16px] leading-relaxed text-ink/70">{m.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative h-[min(30rem,70vh)]">
            {MOMENTS.map((m, k) => <StoryCard key={m.step} m={m} k={k} active={k === i} />)}
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------- Product screens ----------
const SCREENS = [
  ['console_ph_veto', 'Agent console', 'Every run, step by step: trigger, specialists, safety verdict, audit.'],
  ['approvals_needs_human', 'Approvals', 'Treatments wait here for an agronomist. Who decided is recorded.'],
  ['try_to_break_it', 'Try to break it', 'Prompt injections and unsafe actions, blocked live.'],
  ['overview', 'Overview', 'What the agent did, what was blocked, what is waiting.'],
] as const;

const Screens: React.FC = () => {
  const [k, setK] = useState(0);
  return (
    <section className="bg-leaf-950 py-24 text-leaf-100">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="max-w-2xl font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.05] text-white">A working product, not a mock-up</h2>
        <p className="mt-3 max-w-xl text-leaf-100/70">These are screenshots of the running system. Sign in as a farmer, an agronomist or an admin and try it yourself.</p>
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Product screens">
          {SCREENS.map(([id, t], n) => (
            <button key={id} role="tab" aria-selected={k === n} onClick={() => setK(n)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${k === n ? 'bg-sprout text-leaf-950' : 'bg-white/5 text-leaf-100 hover:bg-white/10'}`}>{t}</button>
          ))}
        </div>
        <figure className="mt-6">
          <div className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" /><span className="h-2.5 w-2.5 rounded-full bg-white/20" /><span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="ml-3 truncate text-xs text-leaf-100/50">localhost:3000 · {SCREENS[k][1]}</span>
            </div>
            <img key={SCREENS[k][0]} src={`/media/screens/${SCREENS[k][0]}.webp`} alt={`${SCREENS[k][1]} screen`} loading="lazy" width={1400} height={701}
                 className="block w-full animate-[fadeIn_300ms_ease-out]" />
          </div>
          <figcaption className="mt-3 text-[15px] text-leaf-100/75">{SCREENS[k][2]}</figcaption>
        </figure>
      </div>
    </section>
  );
};

// ---------- Page ----------
const RESULTS: Array<[string, string, string]> = [
  ['19–32%', 'less irrigation water than an ET-based schedule, at the same yield', 'Crop simulation, Chennai weather 2021–2023'],
  ['30 / 30', 'attacks blocked: prompt injection, unsafe doses, fake sensor data, Tamil jailbreaks', 'Red-team suite in the repository'],
  ['87%', 'right on field leaf photos it accepts; it asks for a retake on the rest', 'PlantDoc field test; 98.2% on lab photos'],
  ['6', 'languages by text or voice; every unsafe question escalated in testing', 'Tamil, Hindi, Telugu, Kannada, Malayalam, English'],
];

const ROLES: Array<[React.ElementType, string, string]> = [
  [Sprout, 'Farmers', 'See what the agent noticed and did, ask in their own language, check a leaf. They set how much the agent may do alone.'],
  [ClipboardCheck, 'Agronomists', 'Approve or reject the treatments and large doses the safety engine sends to a person, with the evidence in front of them.'],
  [ShieldCheck, 'Admins', 'Decide who is an agronomist. Every proposal, verdict and approval lands in a hash-chained audit log.'],
];

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const cta = user ? '/app' : '/login';
  const [solid, setSolid] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const still = reducedMotion();
  useEffect(() => {
    const f = () => setSolid(window.scrollY > window.innerHeight * 0.75);
    f(); window.addEventListener('scroll', f, { passive: true });
    const t = setTimeout(() => setLoaded(true), 60);
    return () => { window.removeEventListener('scroll', f); clearTimeout(t); };
  }, []);
  const rise = `transition-all duration-1000 ease-out ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`;
  const delay = (d: number) => ({ transitionDelay: `${d}ms` });

  return (
    <div className="bg-paper text-ink">
      <header className={`fixed inset-x-0 top-0 z-30 transition-colors duration-300 ${solid ? 'bg-paper/90 shadow-sm backdrop-blur' : 'bg-transparent'}`}>
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
          <Link to="/" aria-label="Solarda home"><Logo light={!solid} /></Link>
          <nav className={`ml-auto hidden items-center gap-6 text-[15px] md:flex ${solid ? 'text-ink/75' : 'text-white/85'}`} aria-label="Sections">
            <a href="#story" className="hover:underline">How it decides</a>
            <a href="#results" className="hover:underline">Results</a>
            <Link to="/guide" className="hover:underline">Guide</Link>
          </nav>
          <Link to={cta} className={`ml-auto rounded-full px-4 py-2 text-sm font-semibold transition md:ml-0 ${solid ? 'bg-leaf-700 text-white hover:bg-leaf-800' : 'bg-white text-leaf-950 hover:bg-sprout'}`}>
            {user ? 'Open dashboard' : 'Try the demo'}
          </Link>
        </div>
      </header>

      <section className="relative flex h-[100svh] min-h-[560px] items-end overflow-hidden bg-leaf-950">
        {still
          ? <img src="/media/hero-soil.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          : <video className="absolute inset-0 h-full w-full object-cover" src="/media/hero-soil.mp4" poster="/media/hero-soil.jpg" autoPlay muted loop playsInline aria-hidden />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,38,28,0.55)_0%,rgba(12,38,28,0.15)_35%,rgba(12,38,28,0.85)_78%,#0C261C_100%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 sm:pb-20">
          <h1 className="max-w-4xl font-display text-[clamp(2.8rem,8.5vw,7rem)] font-extrabold leading-[0.95] tracking-tight text-white">
            <span className={`block ${rise}`} style={delay(0)}>Farm agents</span>
            <span className={`block ${rise}`} style={delay(140)}>that ask before</span>
            <span className={`block text-sprout ${rise}`} style={delay(280)}>they act.</span>
          </h1>
          <div className={`mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between ${rise}`} style={delay(450)}>
            <p className="max-w-lg text-lg leading-relaxed text-white/85">
              Solarda's AI agents watch the farm and propose what to do. A safety engine decides, and anything risky waits for an agronomist.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={cta} className="rounded-full bg-sprout px-6 py-3 font-semibold text-leaf-950 hover:bg-white">Try the demo</Link>
              <a href="#story" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10">
                See how it decides <ArrowDown className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </div>
        <span className="absolute bottom-3 right-4 text-[11px] text-white/45">Illustrative footage</span>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
        <p className="max-w-4xl font-display text-[clamp(1.8rem,3.6vw,3rem)] font-bold leading-[1.15] text-leaf-950">
          Small farms make dozens of decisions a day about water, nutrients and disease, usually with no agronomist nearby.
          <span className="text-ink/40"> AI could help, but only if it can never be trusted with a valve on its own.</span>
        </p>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {[
            ['Events cannot wait', 'A heat spike, a failing probe or a diseased leaf needs a response in minutes, not at the next scheduled check.'],
            ['Models can be fooled', 'A language model can be wrong or manipulated. A pump or a chemical dose cannot depend on its answer alone.'],
            ['Farmers speak many languages', 'Advice has to come in Tamil, Hindi or Telugu, by voice, and say honestly where every number came from.'],
          ].map(([t, b]) => (
            <div key={t} className="border-t border-leaf-200 pt-5">
              <h3 className="font-display text-xl font-bold text-leaf-950">{t}</h3>
              <p className="mt-2 leading-relaxed text-ink/70">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <Story />

      <Screens />

      <section id="results" className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
        <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.05] text-leaf-950">Results you can re-run</h2>
        <p className="mt-3 max-w-2xl text-ink/70">From simulation and replayed public datasets, not field trials. Every number has a source file and a command in the repository.</p>
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {RESULTS.map(([n, what, src]) => (
            <div key={n}>
              <div className="font-display text-[clamp(3rem,5vw,4.2rem)] font-extrabold leading-none text-leaf-800">{n}</div>
              <p className="mt-3 text-[16px] leading-snug">{what}</p>
              <p className="mt-2 text-sm text-ink/50">{src}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-leaf-100 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.05] text-leaf-950">Built for the people on the farm</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {ROLES.map(([Icon, t, b]) => (
              <div key={t}>
                <Icon className="h-8 w-8 text-leaf-700" aria-hidden />
                <h3 className="mt-4 font-display text-2xl font-bold">{t}</h3>
                <p className="mt-2 leading-relaxed text-ink/70">{b}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link to={cta} className="rounded-full bg-leaf-700 px-6 py-3 font-semibold text-white hover:bg-leaf-800">Try it as any of them</Link>
            <Link to="/guide" className="font-semibold text-leaf-700 underline">Read how Solarda works</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl font-bold text-leaf-950">Under the hood</h2>
            <p className="mt-3 text-ink/70">Five services behind one entry point, started on a laptop with one command. Only the safety engine can allow an action.</p>
          </div>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 text-[15px]">
            {[
              ['Safety engine', 'TypeScript rules, the only part that can allow an action'],
              ['Agent runtime', 'Python, FastAPI, LangGraph, Gemini with an offline advisor'],
              ['Crop twin', 'AquaCrop-OSPy with real Open-Meteo weather'],
              ['Vision', 'EfficientNetV2 on ONNX Runtime, calibrated, abstains when unsure'],
              ['Web app', 'React, TypeScript, Tailwind; sign-in with roles'],
              ['Audit log', 'Append-only and hash-chained; edits are detected'],
            ].map(([t, b]) => <div key={t} className="border-t border-leaf-100 pt-3"><dt className="font-semibold">{t}</dt><dd className="mt-0.5 text-ink/65">{b}</dd></div>)}
          </dl>
        </div>
      </section>

      <footer className="bg-leaf-950 text-leaf-100/75">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-sm text-sm">No live farm sensors are connected yet. Readings come from public datasets (EDEN ISS, HydroGrowNet) or simulation and are always labelled as such.</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm" aria-label="Footer">
            <Link to="/guide" className="hover:text-white">How Solarda works</Link>
            <Link to="/login" className="hover:text-white">Sign in or try the demo</Link>
            <a href="https://github.com/loktrishal-05/Solar-Da" className="inline-flex items-center gap-1.5 hover:text-white"><Code2 className="h-4 w-4" aria-hidden /> Source code</a>
          </nav>
          <div className="text-sm">
            <div className="font-semibold text-white">Team Unexpectedly_Qualified</div>
            <p className="mt-1">Harshavardhan K, Kinnera Cholan, Loktrishal K, Sanjjith B</p>
            <p className="mt-1">R M K College of Engineering and Technology · Agentic AI Hackathon 2026 · T046</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
