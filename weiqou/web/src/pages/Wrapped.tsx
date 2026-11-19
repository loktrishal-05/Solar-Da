// Pages that wrap the existing, working feature components inside the app shell.
import React, { useEffect, useState } from 'react';
import { ProductMode } from '@terrasub-solarda/engine';
import { navigate } from '../router';
import { PageHeader, SourceBadge, Card } from '../ui';
import { LightCropDoctorSection } from '../components/LightCropDoctorSection';
import { FarmChat } from '../components/FarmChat';
import { AdvisorPanel } from '../components/AdvisorPanel';
import { BenchmarkPage } from '../components/BenchmarkPage';
import { LightMarketSection } from '../components/LightMarketSection';
import { LightSmsAlertsSection } from '../components/LightSmsAlertsSection';
import { LightCommunitySection } from '../components/LightCommunitySection';

export const DoctorPage: React.FC = () => (
  <>
    <PageHeader title="Crop doctor" subtitle="Upload a leaf photo. The model answers with a calibrated confidence, or asks for a better photo when it is not sure. Treatments always go to an agronomist." />
    <LightCropDoctorSection onCreateProposal={() => navigate('/app/console')} />
  </>
);

export const AssistantPage: React.FC = () => {
  const [tab, setTab] = useState<'chat' | 'advisor'>('chat');
  const [low, setLow] = useState(false);
  return (
    <>
      <PageHeader
        title="Farm assistant"
        subtitle="Ask by text or voice in Tamil, Hindi, Telugu, Kannada, Malayalam or English. It reads farm data but never gives chemical doses: those go to an expert."
        actions={<label className="flex items-center gap-2 text-sm text-ink/70"><input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} /> Low-bandwidth mode</label>}
      />
      <div className="mb-4 inline-flex rounded-full border border-leaf-200 bg-white p-1 text-sm">
        {([['chat', 'Assistant (chat and voice)'], ['advisor', 'Offline advisor (works without internet)']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-3 py-1.5 font-medium ${tab === k ? 'bg-leaf-700 text-white' : 'text-ink/70'}`}>{label}</button>
        ))}
      </div>
      {tab === 'chat' ? <FarmChat lowBandwidth={low} /> : <AdvisorPanel lowBandwidth={low} />}
    </>
  );
};

export const InsightsPage: React.FC = () => (
  <>
    <PageHeader title="Water and market" subtitle="How much water the agent saves against fixed and ET-based schedules in a crop simulation, and the market outlook." actions={<SourceBadge source="sim" />} />
    <BenchmarkPage lowBandwidth={false} />
    <div className="mt-8"><LightMarketSection /></div>
  </>
);

type Alert = { id: string; type: 'CRITICAL' | 'WARNING' | 'INFO'; message: string; timestamp: string };
const SAMPLE_ALERTS: Alert[] = [
  { id: 'a1', type: 'CRITICAL', message: '(sample) Reservoir R-02 pH 8.9 (ceiling 8.5)', timestamp: '14:32:10' },
  { id: 'a2', type: 'WARNING', message: '(sample) G-07 moisture sensor stale 12 min', timestamp: '14:20:00' },
];

export const AlertsPage: React.FC = () => {
  const [vetoes, setVetoes] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    let stop = false;
    const pull = async () => {
      try {
        const audit = await fetch('/api/audit').then((r) => r.json());
        if (stop) return;
        setVetoes((audit.entries ?? []).filter((e: any) => e.type === 'verdict' && e.verdict?.verdict === 'veto').slice(-8).reverse()
          .map((e: any) => ({ id: e.proposal.id, type: 'WARNING' as const, timestamp: `${e.sim_time.slice(11, 19)} replay`,
            message: `Blocked ${e.proposal.kind} at ${e.proposal.zone}: ${e.verdict.invariant ?? 'safety rule'} (replayed data)` })));
      } catch { /* backend down: shell shows the banner */ }
    };
    pull();
    const t = setInterval(pull, 8000);
    return () => { stop = true; clearInterval(t); };
  }, []);
  const alerts = [...vetoes, ...SAMPLE_ALERTS].filter((a) => !dismissed.includes(a.id));
  return (
    <>
      <PageHeader title="Alerts" subtitle="Every safety block becomes an alert. Messages go to a demo SMS outbox, and to Telegram when a bot token is set." />
      <LightSmsAlertsSection alerts={alerts} onDismissAlert={(id) => setDismissed((d) => [...d, id])} />
    </>
  );
};

export const CommunityPage: React.FC = () => (
  <>
    <PageHeader title="Community" subtitle="Group buying and expert questions. This screen shows how it would look; posts and members are sample content." actions={<SourceBadge source="sample" />} />
    <LightCommunitySection />
  </>
);

export const SettingsPage: React.FC = () => {
  const [mode, setMode] = useState<ProductMode>('TERRASUB_MVP');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { fetch('/api/health').then((r) => r.json()).then((h) => h.activeMode && setMode(h.activeMode)).catch(() => {}); }, []);
  const choose = async (m: ProductMode) => {
    setMsg(null);
    try {
      const r = await fetch('/api/mode', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: m }) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error ?? `HTTP ${r.status}`);
      setMode(m);
      setMsg({ ok: true, text: 'Saved. The safety engine now uses the limits for this farm type.' });
    } catch (e) {
      setMsg({ ok: false, text: `Not saved: ${(e as Error).message}` });
    }
  };
  return (
    <>
      <PageHeader title="Settings" />
      <Card className="max-w-2xl">
        <h2 className="font-display text-lg font-semibold">Farm type</h2>
        <p className="text-sm text-ink/65">Changes which safety limits the engine loads. The rules themselves stay the same.</p>
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mt-3 text-sm ${msg.ok ? 'text-leaf-800' : 'text-veto'}`}>{msg.text}</p>}
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {([['TERRASUB_MVP', 'Soil and substrate beds', 'Pulse irrigation, moisture targets'], ['SOLARDA_V3', 'Hydroponic towers', 'Nutrient tank, pH and EC dosing, solar pump']] as const).map(([m, t, d]) => (
            <button key={m} onClick={() => choose(m as ProductMode)} aria-pressed={mode === m}
                    className={`rounded-lg border px-4 py-3 text-left ${mode === m ? 'border-leaf-600 bg-leaf-50' : 'border-leaf-100 bg-white'}`}>
              <div className="font-semibold">{t}</div><div className="text-sm text-ink/60">{d}</div>
            </button>
          ))}
        </div>
      </Card>
    </>
  );
};
