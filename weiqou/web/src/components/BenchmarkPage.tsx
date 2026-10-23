import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Benchmark page: every number comes from bench/results (simulation), names its baseline and weather years,
// and shows the cases where the agent does no better.

type Row = { policy: string; year: string; water_mm: string; events: string; stress_days: string; dry_yield_t_ha: string };
type Results = { irrigation: Row[]; advisor: Record<string, any> | null; vision: Record<string, any> | null; summary_md: string };

const POLICIES = ['fixed_schedule', 'et_controller', 'agent', 'agent_no_forecast'];
const COLORS: Record<string, string> = { fixed_schedule: '#9CA3AF', et_controller: '#60A5FA', agent: '#1B4332', agent_no_forecast: '#7CB342' };

export const BenchmarkPage: React.FC<{ lowBandwidth: boolean }> = ({ lowBandwidth }) => {
  const [r, setR] = useState<Results | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { fetch('/agents/bench/results').then((x) => x.json()).then(setR).catch(() => setErr('Agent runtime not reachable.')); }, []);

  const byYear = (key: keyof Row) => {
    const years = [...new Set((r?.irrigation ?? []).map((x) => x.year))];
    return years.map((y) => Object.fromEntries([['year', y], ...POLICIES.map((p) => [p, Number(r!.irrigation.find((x) => x.year === y && x.policy === p)?.[key] ?? 0)])]));
  };
  const noGain = useMemo(() => {
    const m = r?.summary_md.split('## Cases where the agent does no better')[1]?.split('\n\n')[1] ?? '';
    return m.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
  }, [r]);

  if (err) return <div className="text-xs text-red-700">{err}</div>;
  if (!r) return <div className="text-xs text-gray-500">Loading benchmark…</div>;
  const v = r.vision;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        Simulation results: AquaCrop-OSPy twin with the Open-Meteo archive for Chennai (2021, 2022, 2023), tomato planted 15 Jan.
        Not a field trial. Agent forecasts are the archive's actual next-2-day rain (a perfect forecast, which is optimistic).
        Reproduce with <code>bench/run_bench.py</code>.
      </div>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#1B4332] mb-3">Irrigation: agent vs fixed schedule vs rule-based ET controller</h3>
        {!lowBandwidth && (
          <div className="grid md:grid-cols-3 gap-4">
            {([['water_mm', 'Water applied (mm)'], ['stress_days', 'Water-stress days'], ['dry_yield_t_ha', 'Dry yield (t/ha)']] as const).map(([k, title]) => (
              <div key={k} className="h-56">
                <div className="text-[11px] font-bold text-gray-600 mb-1">{title}</div>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={byYear(k)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
                    {POLICIES.map((p) => <Bar key={p} dataKey={p} fill={COLORS[p]} />)}
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}
        <table className="w-full text-xs font-mono mt-3">
          <thead><tr className="text-left text-gray-500"><th>Year</th><th>Policy</th><th>Water mm</th><th>Events</th><th>Stress days</th><th>Dry yield t/ha</th></tr></thead>
          <tbody>{r.irrigation.map((x) => (
            <tr key={x.year + x.policy} className={x.policy === 'agent' ? 'font-bold' : ''}><td>{x.year}</td><td>{x.policy}</td><td>{Number(x.water_mm).toFixed(0)}</td><td>{x.events}</td><td>{x.stress_days}</td><td>{Number(x.dry_yield_t_ha).toFixed(2)}</td></tr>
          ))}</tbody>
        </table>
        <div className="mt-3 text-xs">
          <div className="font-bold text-red-800">Where the agent does no better</div>
          <ul className="list-disc ml-5 text-gray-700">{noGain.length ? noGain.map((n) => <li key={n}>{n}</li>) : <li>none recorded in this run</li>}</ul>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-5">
        <section className="rounded-2xl border bg-white p-4 shadow-sm text-xs">
          <h3 className="font-black uppercase tracking-wider text-[#1B4332] mb-2">Disease model: lab vs field</h3>
          {v ? (
            <ul className="space-y-1 font-mono">
              <li>Lab (PlantVillage test, n={v.lab_plantvillage_test_n}): accuracy {(v.lab_plantvillage_test_accuracy * 100).toFixed(1)}%</li>
              <li>Field (PlantDoc test, n={v.field_plantdoc_test_n}): accuracy {(v.field_plantdoc_test_accuracy * 100).toFixed(1)}%</li>
              <li>Field abstain rate at {(v.abstain_threshold * 100).toFixed(0)}%: {(v.field_plantdoc_test_abstain_rate * 100).toFixed(1)}%; accuracy when it answers {(v.field_plantdoc_test_accuracy_when_answered * 100).toFixed(1)}%</li>
              <li>Calibration error (ECE) field: {v.field_plantdoc_test_ece_raw} raw → {v.field_plantdoc_test_ece_calibrated} after temperature {v.temperature.toFixed(2)}</li>
              <li className="text-gray-500 font-sans">{v.note}</li>
            </ul>
          ) : <p className="text-gray-500">Model metrics not installed yet.</p>}
        </section>
        <section className="rounded-2xl border bg-white p-4 shadow-sm text-xs">
          <h3 className="font-black uppercase tracking-wider text-[#1B4332] mb-2">Advisor: golden questions</h3>
          {r.advisor ? (
            <ul className="space-y-1 font-mono">
              <li>Score: {(r.advisor.score * 100).toFixed(0)}% of {r.advisor.n}</li>
              <li>Unsafe/out-of-scope questions escalated: {(r.advisor.unsafe_or_out_of_scope_escalated * 100).toFixed(0)}%</li>
              <li>Answerable questions answered from the right source: {(r.advisor.answerable_answered_with_right_source * 100).toFixed(0)}%</li>
              <li className="text-gray-500 font-sans">LLM: {r.advisor.llm}. Plain-LLM baseline: {r.advisor.baseline_plain_llm}.</li>
            </ul>
          ) : <p className="text-gray-500">Run bench/eval_advisor.py.</p>}
        </section>
      </div>
    </div>
  );
};
