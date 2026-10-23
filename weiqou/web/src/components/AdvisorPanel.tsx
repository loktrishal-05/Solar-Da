import React, { useEffect, useRef, useState } from 'react';
import { Copy, Mic, MicOff, Send, ShieldAlert, Volume2 } from 'lucide-react';

// Farmer advisor: Tamil-first text chat over approved sources. Voice uses the browser speech APIs only when the
// browser has a Tamil (ta-IN) voice / recognizer; otherwise it stays text. Low-bandwidth mode drops charts and media.

type Turn = { q: string; answer: string; escalated: boolean; citations: string[]; risk: string; language: string };

const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const AdvisorPanel: React.FC<{ lowBandwidth: boolean }> = ({ lowBandwidth }) => {
  const [lang, setLang] = useState<'ta' | 'en'>('ta');
  const [text, setText] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    load();
    window.speechSynthesis?.addEventListener?.('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', load);
  }, []);

  const bcp47 = lang === 'ta' ? 'ta-IN' : 'en-IN';
  const voice = voices.find((v) => v.lang.toLowerCase().startsWith(lang));
  const canSpeak = !lowBandwidth && !!voice;
  const canListen = !lowBandwidth && !!SpeechRecognition;

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await fetch('/agents/advisor/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: q, language: lang }) });
      const d = await r.json();
      setTurns((t) => [{ q, ...d }, ...t]);
      setText('');
    } finally {
      setBusy(false);
    }
  };

  const listen = () => {
    if (!canListen) return;
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SpeechRecognition();
    rec.lang = bcp47;
    rec.interimResults = false;
    rec.onresult = (e: any) => { const said = e.results[0][0].transcript; setText(said); ask(said); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const speak = (s: string) => {
    if (!canSpeak) return;
    const u = new SpeechSynthesisUtterance(s);
    u.voice = voice!;
    u.lang = voice!.lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const plain = (t: Turn) =>
    `Q: ${t.q}\nA: ${t.answer}\n${t.citations.length ? 'Sources: ' + t.citations.join('; ') : 'Escalated to a human expert.'}\n(Solarda advisor; replayed/simulated data, not your farm)`;

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <h3 className="font-black uppercase tracking-wider text-[#1B4332] mr-auto">Farmer advisor</h3>
        <div className="flex rounded-full border overflow-hidden font-mono">
          {(['ta', 'en'] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 ${lang === l ? 'bg-[#1B4332] text-white' : 'bg-white'}`}>{l === 'ta' ? 'தமிழ்' : 'English'}</button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-gray-600">
        Answers only from approved sources, with citations. Pesticide doses, spray rates and withholding periods are always passed to a human expert.
        {!lowBandwidth && !voice && ` Voice output is off: this browser has no ${lang === 'ta' ? 'Tamil' : 'English'} voice.`}
        {!lowBandwidth && !SpeechRecognition && ' Voice input is not supported in this browser; type instead.'}
      </p>
      <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={lang === 'ta' ? 'உங்கள் கேள்வியை இங்கே எழுதுங்கள்…' : 'Type your question…'}
               className="flex-1 border rounded-full px-4 py-2 text-sm" aria-label="Question" />
        {canListen && (
          <button type="button" onClick={listen} className={`p-2 rounded-full border ${listening ? 'bg-red-50 border-red-300' : ''}`} title="Speak">
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
        <button disabled={busy} className="px-4 py-2 rounded-full bg-[#1B4332] text-white font-bold flex items-center gap-1 disabled:opacity-50"><Send className="w-3.5 h-3.5" /> {lang === 'ta' ? 'கேள்' : 'Ask'}</button>
      </form>
      <div className="space-y-2">
        {turns.map((t, i) => (
          <div key={i} className={`rounded-xl border p-3 text-sm ${t.escalated ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
            <div className="text-xs text-gray-500 mb-1">{t.q}</div>
            {t.escalated && <div className="text-xs font-bold text-amber-800 flex items-center gap-1 mb-1"><ShieldAlert className="w-3.5 h-3.5" /> Escalated to a human ({t.risk})</div>}
            <div className="whitespace-pre-wrap">{t.answer}</div>
            {t.citations.length > 0 && <ol className="mt-2 text-[11px] text-gray-500 list-decimal ml-4">{t.citations.map((c) => <li key={c}>{c}</li>)}</ol>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => navigator.clipboard?.writeText(plain(t))} className="text-[11px] flex items-center gap-1 text-gray-600 hover:text-gray-900"><Copy className="w-3 h-3" /> Copy plain text (forward by SMS/WhatsApp)</button>
              {canSpeak && <button onClick={() => speak(t.answer)} className="text-[11px] flex items-center gap-1 text-gray-600 hover:text-gray-900"><Volume2 className="w-3 h-3" /> Read aloud</button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
