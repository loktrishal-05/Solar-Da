import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { Link, usePath } from './router';

// Plain-language help shown at the top of every app page. One place, so the wording stays consistent.
type Intro = { what: string; can: string[]; tip?: string };

export const INTROS: Record<string, Intro> = {
  '/app': {
    what: 'Your farm at a glance: what the agent did, what the safety engine blocked, what is waiting for an agronomist, and whether each part of Solarda is running.',
    can: ['See the latest agent runs and how many actions were blocked', 'Jump to the approvals waiting for a person', 'Check that the safety engine, agents and models are running'],
    tip: 'Nothing here yet? Open the Agent console and start a scenario.',
  },
  '/app/console': {
    what: 'Watch the AI agents work. Pick a recorded farm situation and play it back; each time something happens, the agents wake up, propose actions, and the safety engine decides.',
    can: ['Choose a scenario, a playback speed and how much the agent may do on its own (L0 explain only, L1 ask first, L2 act within safe limits)', 'Open a run to see every step: what triggered it, what each specialist proposed, what the safety engine said', 'Press Check now to make the agent look at the farm immediately'],
    tip: 'Try "ph_excursion" at 1440x: the agent keeps asking to add acid and the safety engine stops it.',
  },
  '/app/approvals': {
    what: 'Actions the safety engine will not allow without a person: treatments, large doses, and everything at autonomy level L1.',
    can: ['Read why the agent wants each action and what the safety engine said', 'Approve or reject it if you are an agronomist or admin; your name is recorded', 'See every past decision and who made it'],
    tip: 'Run the "diseased_leaf_rain" scenario to see a treatment arrive here.',
  },
  '/app/doctor': {
    what: 'Check a leaf for disease. The model gives a calibrated confidence, and asks for a better photo instead of guessing when it is not sure.',
    can: ['Upload a photo, use the camera, or pick a sample leaf', 'See the top diagnoses with their confidence', 'Open the agent console to see how a treatment proposal waits for an agronomist'],
    tip: 'A blurry or unusual photo should be refused. That is the model working as designed.',
  },
  '/app/assistant': {
    what: 'Ask about your farm in Tamil, Hindi, Telugu, Kannada, Malayalam or English, by typing or by voice. It reads farm data and approved sources.',
    can: ['Ask how the farm is doing, what the agent did, or what the weather will be', 'Use the microphone for voice questions and spoken answers', 'Use the offline advisor when there is no internet'],
    tip: 'It never gives chemical doses. Ask for one and it will send you to an expert.',
  },
  '/app/redteam': {
    what: 'Try to make Solarda do something unsafe. Two layers stop you: the assistant refuses unsafe advice, and the safety engine blocks unsafe actions even if the AI is fooled.',
    can: ['Send prompt-injection or jailbreak messages to the assistant, in English or Tamil', 'Force a dangerous action (acid dump, fake sensor, flood before rain) and watch the safety engine block it', 'Change the dose or duration with the slider and try again'],
  },
  '/app/insights': {
    what: 'How much water the agent saves compared with a fixed schedule and a standard evapotranspiration (ET) controller, in a crop simulation with real Chennai weather, plus the market outlook.',
    can: ['Compare water used, stress days and yield per year', 'See the cases where the agent did no better', 'Read the onion price outlook and the sample crop recommendations'],
  },
  '/app/alerts': {
    what: 'Every action the safety engine blocks becomes an alert. Alerts go to a demo SMS outbox, and to Telegram when a bot is connected.',
    can: ['Read recent blocks with their safety rule', 'Send a test alert', 'Choose which kinds of alerts you want'],
  },
  '/app/community': {
    what: 'A preview of the farmer community: group buying and questions to experts. The posts and members shown are sample content.',
    can: ['Browse example threads and co-op groups'],
  },
  '/app/settings': {
    what: 'Choose your farm type. The safety engine loads the limits for it (moisture targets for soil beds, pH and EC limits for hydroponic tanks).',
    can: ['Switch between soil or substrate beds and hydroponic towers'],
  },
  '/app/admin': {
    what: 'Manage who can do what. Everyone who signs up starts as a farmer.',
    can: ['Give the agronomist role to people qualified to approve treatments', 'Make another admin', 'The last admin cannot be removed, so the site never locks itself out'],
  },
};

const KEY = (p: string) => `solarda.intro.${p}`;
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private window: just don't remember */ } };

export const PageIntro: React.FC = () => {
  const path = usePath();
  const intro = INTROS[path];
  const [open, setOpen] = useState(() => read(KEY(path)) !== 'closed');
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) { setLastPath(path); setOpen(read(KEY(path)) !== 'closed'); }
  if (!intro) return null;
  const toggle = () => { write(KEY(path), open ? 'closed' : 'open'); setOpen(!open); };
  return (
    <section className="mb-6 rounded-xl border border-leaf-100 bg-leaf-50/60" aria-label="About this page">
      <button onClick={toggle} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-leaf-900">
        <Info className="h-4 w-4" aria-hidden /> About this page
        <ChevronDown className={`ml-auto h-4 w-4 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="grid gap-4 px-4 pb-4 text-[15px] md:grid-cols-[1.2fr_1fr]">
          <p className="text-ink/80">{intro.what}</p>
          <div>
            <div className="text-sm font-semibold text-ink/60">You can</div>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink/80">{intro.can.map((c) => <li key={c}>{c}</li>)}</ul>
            {intro.tip && <p className="mt-2 text-sm text-leaf-800">{intro.tip}</p>}
            <p className="mt-2 text-sm"><Link to="/guide" className="text-leaf-700 underline">How Solarda works</Link></p>
          </div>
        </div>
      )}
    </section>
  );
};
