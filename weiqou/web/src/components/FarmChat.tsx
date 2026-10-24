import React, { useEffect, useRef, useState } from 'react';
import { Copy, Headphones, Mic, MicOff, Send, ShieldAlert, Square, Volume2, VolumeX, Wrench } from 'lucide-react';

// Farm assistant: streaming multi-turn chat (Gemini via services/agents /chat/stream) with read-only farm tools,
// six languages plus romanised/code-mixed input, and browser voice (speech in, sentence-by-sentence speech out,
// barge-in, hands-free conversation). Dose/pesticide questions are routed to the approved-source advisor server-side.

type Lang = 'auto' | 'en' | 'ta' | 'hi' | 'te' | 'kn' | 'ml';
type Msg = {
  role: 'user' | 'assistant'; content: string; tools?: string[]; citations?: string[]; escalated?: boolean;
  model?: string; risk?: string; language?: string; pending?: boolean;
};

const LANGS: { k: Lang; label: string; bcp: string }[] = [
  { k: 'auto', label: 'Auto', bcp: 'en-IN' }, { k: 'ta', label: 'தமிழ்', bcp: 'ta-IN' }, { k: 'en', label: 'English', bcp: 'en-IN' },
  { k: 'hi', label: 'हिन्दी', bcp: 'hi-IN' }, { k: 'te', label: 'తెలుగు', bcp: 'te-IN' }, { k: 'kn', label: 'ಕನ್ನಡ', bcp: 'kn-IN' },
  { k: 'ml', label: 'മലയാളം', bcp: 'ml-IN' },
];
const bcpOf = (l: string | undefined) => LANGS.find((x) => x.k === l)?.bcp ?? 'en-IN';
const TOOL_LABEL: Record<string, string> = {
  farm_status: 'read farm status', alerts_and_approvals: 'checked alerts & approvals', sensor_forecast: 'read sensor forecasts',
  search_knowledge: 'searched approved sources', price_outlook: 'read price outlook', request_farm_check: 'asked the agent to check',
};
const SUGGEST: Record<string, string[]> = {
  en: ['How is my farm right now?', 'Will the tank pH go out of range soon?', 'Why are my tomato leaves yellow?', 'Should I store onions or sell?'],
  ta: ['என் பண்ணை இப்போது எப்படி இருக்கிறது?', 'தக்காளி இலை ஏன் மஞ்சளாகிறது?', 'pH sari ah iruka?'],
  hi: ['मेरे खेत का हाल क्या है?', 'tamatar ke patte peele kyu ho rahe hain?'],
  te: ['నా పొలం పరిస్థితి ఎలా ఉంది?'], kn: ['ನನ್ನ ಹೊಲದ ಸ್ಥಿತಿ ಹೇಗಿದೆ?'], ml: ['എന്റെ കൃഷിയുടെ അവസ്ഥ എന്താണ്?'],
};
const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const plainForSpeech = (s: string) => s.replace(/\*\*|__|`|#+\s|\[[^\]]*\]/g, '').replace(/^\s*[-*]\s+/gm, '');

// Minimal markdown: **bold**, "- " / "1. " lists, paragraphs.
const Rich: React.FC<{ text: string }> = ({ text }) => (
  <div className="space-y-1.5">
    {text.split(/\n{2,}/).map((block, i) => {
      const lines = block.split('\n');
      const isList = lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l) || !l.trim());
      const inline = (l: string) => l.split(/(\*\*[^*]+\*\*)/g).map((p, j) => p.startsWith('**') ? <b key={j}>{p.slice(2, -2)}</b> : <React.Fragment key={j}>{p}</React.Fragment>);
      return isList
        ? <ul key={i} className="list-disc ml-5 space-y-0.5">{lines.filter((l) => l.trim()).map((l, j) => <li key={j}>{inline(l.replace(/^\s*([-*]|\d+\.)\s+/, ''))}</li>)}</ul>
        : <p key={i} className="whitespace-pre-wrap">{inline(block)}</p>;
    })}
  </div>
);

export const FarmChat: React.FC<{ lowBandwidth: boolean; fill?: boolean }> = ({ lowBandwidth, fill }) => {
  const [lang, setLang] = useState<Lang>('auto');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState(false);
  const [speakOn, setSpeakOn] = useState(!lowBandwidth);
  const [handsFree, setHandsFree] = useState(false);
  const [listening, setListening] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const recRef = useRef<any>(null);
  const speakQueue = useRef<string>('');
  const lastLang = useRef<string>('en');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    load();
    window.speechSynthesis?.addEventListener?.('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', load);
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [msgs]);

  const voiceFor = (l: string) => voices.find((v) => v.lang.toLowerCase().startsWith(l === 'auto' ? 'en' : l));
  const canSpeak = (l: string) => !lowBandwidth && speakOn && !!voiceFor(l);

  // Speak complete sentences while the answer is still streaming.
  const speakChunk = (l: string, chunk: string, flush = false) => {
    if (!canSpeak(l)) return;
    speakQueue.current += chunk;
    const parts = speakQueue.current.split(/(?<=[.!?।\n])\s+/);
    const ready = flush ? parts : parts.slice(0, -1);
    speakQueue.current = flush ? '' : parts[parts.length - 1] ?? '';
    ready.map(plainForSpeech).filter((s) => s.trim()).forEach((s) => {
      const u = new SpeechSynthesisUtterance(s);
      u.voice = voiceFor(l)!; u.lang = u.voice.lang; u.rate = 1.0;
      window.speechSynthesis.speak(u);
    });
  };
  const stopSpeaking = () => { window.speechSynthesis?.cancel(); speakQueue.current = ''; };

  const send = async (q: string) => {
    if (!q.trim() || busy) return;
    stopSpeaking();
    const history = [...msgs.filter((m) => !m.pending).map(({ role, content }) => ({ role, content })), { role: 'user' as const, content: q }];
    setMsgs((m) => [...m, { role: 'user', content: q }, { role: 'assistant', content: '', pending: true, tools: [] }]);
    setText(''); setBusy(true);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    const update = (f: (m: Msg) => Msg) => setMsgs((all) => all.map((m, i) => (i === all.length - 1 ? f(m) : m)));
    let replyLang = lang === 'auto' ? lastLang.current : lang;
    try {
      const r = await fetch('/agents/chat/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
        body: JSON.stringify({ messages: history.slice(-12), language: lang === 'auto' ? null : lang, mode: guide ? 'guide' : 'chat' }),
      });
      if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);
      const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const frames = buf.split('\n\n'); buf = frames.pop() ?? '';
        for (const f of frames) {
          const type = /^event: (.+)$/m.exec(f)?.[1]; const data = /^data: (.+)$/m.exec(f)?.[1];
          if (!type || !data) continue;
          const d = JSON.parse(data);
          if (type === 'meta') { replyLang = lang === 'auto' ? d.language : lang; lastLang.current = d.language; update((m) => ({ ...m, risk: d.risk, language: d.language })); }
          if (type === 'tool') update((m) => ({ ...m, tools: [...(m.tools ?? []), d.name] }));
          if (type === 'token') { update((m) => ({ ...m, content: m.content + d.text })); speakChunk(replyLang, d.text); }
          if (type === 'retract') { stopSpeaking(); update((m) => ({ ...m, content: d.answer, escalated: true })); speakChunk(replyLang, d.answer, true); }
          if (type === 'done') { update((m) => ({ ...m, content: d.answer || m.content, citations: d.citations, escalated: d.escalated, model: d.model, pending: false })); speakChunk(replyLang, '', true); }
          if (type === 'error') update((m) => ({ ...m, content: m.content || 'Sorry, the assistant failed. Please try again.', pending: false }));
        }
      }
    } catch (e: any) {
      update((m) => ({ ...m, content: m.content || (e?.name === 'AbortError' ? '(stopped)' : 'Assistant not reachable. Is services/agents running?'), pending: false }));
    } finally {
      setBusy(false); abortRef.current = null;
      update((m) => ({ ...m, pending: false }));
    }
  };

  const listen = () => {
    if (!SpeechRecognition || lowBandwidth) return;
    if (listening) { recRef.current?.stop(); return; }
    stopSpeaking(); // barge-in: the farmer talks over the answer
    const rec = new SpeechRecognition();
    rec.lang = bcpOf(lang === 'auto' ? lastLang.current : lang);
    rec.interimResults = true;
    rec.onspeechstart = stopSpeaking;
    rec.onresult = (e: any) => {
      const r = e.results[e.results.length - 1];
      setText(r[0].transcript);
      if (r.isFinal) { rec.stop(); send(r[0].transcript); }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec; setListening(true); rec.start();
  };

  // Hands-free: listen again once the answer has been spoken.
  useEffect(() => {
    if (!handsFree || busy || listening) return;
    const t = setInterval(() => { if (!window.speechSynthesis?.speaking) { clearInterval(t); listen(); } }, 400);
    return () => clearInterval(t);
  }, [handsFree, busy, listening]); // eslint-disable-line react-hooks/exhaustive-deps

  const plain = (m: Msg, q?: string) => `${q ? `Q: ${q}\n` : ''}A: ${m.content}\n${m.citations?.length ? 'Sources: ' + m.citations.join('; ') : ''}\n(Solarda assistant; farm data is replayed/simulated)`;
  const effLang = lang === 'auto' ? lastLang.current : lang;

  return (
    <section className={`rounded-2xl border border-[#E5E7EB] bg-white shadow-sm flex flex-col ${fill ? 'h-full' : 'h-[70vh] min-h-[480px]'}`}>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b text-xs">
        <h3 className="font-black uppercase tracking-wider text-[#1B4332] mr-auto">Farm assistant</h3>
        <div className="flex flex-wrap rounded-full border overflow-hidden">
          {LANGS.map((l) => (
            <button key={l.k} onClick={() => setLang(l.k)} className={`px-2.5 py-1 ${lang === l.k ? 'bg-[#1B4332] text-white' : 'bg-white hover:bg-gray-50'}`}>{l.label}</button>
          ))}
        </div>
        <label className="flex items-center gap-1" title="One step at a time, for doing a task with your hands busy">
          <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} /> Guide me step by step
        </label>
        {!lowBandwidth && (
          <button onClick={() => { setSpeakOn(!speakOn); stopSpeaking(); }} className="p-1.5 rounded-full border" title={speakOn ? 'Voice answers on' : 'Voice answers off'}>
            {speakOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        )}
        {!lowBandwidth && SpeechRecognition && (
          <button onClick={() => setHandsFree(!handsFree)} className={`p-1.5 rounded-full border ${handsFree ? 'bg-emerald-50 border-emerald-300' : ''}`} title="Hands-free conversation">
            <Headphones className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
        {!msgs.length && (
          <div className="text-xs text-gray-600 space-y-2">
            <p>Ask about your farm, crops, water, sensors, weather or prices, in any of six languages or mixed (Tanglish, Hinglish…).
              Readings are <b>replayed</b> or <b>simulated</b>, not live. Pesticide doses and spray rates always go to a human expert.</p>
            {!lowBandwidth && !voiceFor(effLang) && <p className="text-amber-700">This browser has no {LANGS.find((l) => l.k === effLang)?.label} voice: answers are text only.</p>}
            <div className="flex flex-wrap gap-1.5">
              {(SUGGEST[effLang] ?? SUGGEST.en).map((s) => <button key={s} onClick={() => send(s)} className="px-2.5 py-1 rounded-full border bg-gray-50 hover:bg-gray-100">{s}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className={`rounded-2xl px-3 py-2 max-w-[85%] ${m.role === 'user' ? 'bg-[#1B4332] text-white' : m.escalated ? 'border border-amber-300 bg-amber-50' : 'border border-gray-200 bg-white'}`}>
              {m.role === 'assistant' && !!m.tools?.length && (
                <div className="flex flex-wrap gap-1 mb-1">{[...new Set(m.tools)].map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 rounded-full border border-gray-200 text-gray-500 flex items-center gap-0.5"><Wrench className="w-2.5 h-2.5" />{TOOL_LABEL[t] ?? t}</span>
                ))}</div>
              )}
              {m.escalated && <div className="text-xs font-bold text-amber-800 flex items-center gap-1 mb-1"><ShieldAlert className="w-3.5 h-3.5" /> Passed to a human expert</div>}
              {m.role === 'assistant' ? (m.content ? <Rich text={m.content} /> : <span className="text-gray-400 text-xs">thinking…</span>) : m.content}
              {m.role === 'assistant' && !!m.citations?.length && (
                <ol className="mt-2 text-[11px] text-gray-500 list-decimal ml-4">{m.citations.map((c) => <li key={c}>{c}</li>)}</ol>
              )}
              {m.role === 'assistant' && !m.pending && m.content && (
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                  <button onClick={() => navigator.clipboard?.writeText(plain(m, msgs[i - 1]?.content))} className="flex items-center gap-0.5 hover:text-gray-800"><Copy className="w-3 h-3" /> copy (SMS/WhatsApp)</button>
                  {canSpeak(m.language ?? effLang) && <button onClick={() => { stopSpeaking(); speakChunk(m.language ?? effLang, m.content, true); }} className="flex items-center gap-0.5 hover:text-gray-800"><Volume2 className="w-3 h-3" /> read aloud</button>}
                  {m.model && <span className="ml-auto font-mono">{m.model}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2 p-3 border-t">
        <input value={text} onChange={(e) => setText(e.target.value)} aria-label="Message"
               placeholder={effLang === 'ta' ? 'உங்கள் கேள்வியை எழுதுங்கள்…' : effLang === 'hi' ? 'अपना सवाल लिखें…' : 'Type or speak your question…'}
               className="flex-1 border rounded-full px-4 py-2 text-sm" />
        {!lowBandwidth && SpeechRecognition && (
          <button type="button" onClick={listen} className={`p-2 rounded-full border ${listening ? 'bg-red-50 border-red-300 animate-pulse' : ''}`} title="Speak">
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
        {busy
          ? <button type="button" onClick={() => { abortRef.current?.abort(); stopSpeaking(); }} className="px-4 py-2 rounded-full border font-bold flex items-center gap-1"><Square className="w-3.5 h-3.5" /> Stop</button>
          : <button className="px-4 py-2 rounded-full bg-[#1B4332] text-white font-bold flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Send</button>}
      </form>
    </section>
  );
};
