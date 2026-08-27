import React, { useState } from 'react';
import { Sparkles, Send, ShieldAlert, X, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { ActuatorCommandProposal } from '@terrasub-solarda/engine';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProposal: (prop: ActuatorCommandProposal) => void;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({ isOpen, onClose, onNewProposal }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; citations?: string[]; proposals?: ActuatorCommandProposal[] }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your Gemini Agronomic Intelligence Assistant. Ask me about crop uptake, substrate recipe, disease photo scans, or propose dosage adjustments.',
      citations: ['Platform Rules v3'],
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user' as const, text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customMessage) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'session_web_001',
          content: textToSend,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.assistantResponse,
          citations: data.citationSources,
          proposals: data.proposalsGenerated,
        },
      ]);

      if (data.proposalsGenerated && data.proposalsGenerated.length > 0) {
        data.proposalsGenerated.forEach((p: ActuatorCommandProposal) => onNewProposal(p));
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Error connecting to Gemini API Gateway.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-700 z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <h3 className="text-sm font-bold text-white">Gemini Agronomic Assistant</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Policy Boundary Notice */}
      <div className="bg-slate-950 p-2.5 border-b border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
        <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>In-Process Gateway Policy: Tools ONLY produce proposals. Execution requires human confirmation.</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none font-medium'
                  : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-slate-400 font-mono">
                  Sourced from: {msg.citations.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-400 italic">Gemini is reasoning and checking policy...</div>}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-800 border-t border-slate-700 space-y-2">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask assistant or propose action..."
            className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
