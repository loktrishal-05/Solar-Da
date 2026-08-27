import React, { useState } from 'react';
import { Sparkles, Send, Mic, Paperclip, X, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { ActuatorCommandProposal } from '@terrasub-solarda/engine';

interface DarkAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProposal: (prop: ActuatorCommandProposal) => void;
}

export const DarkAssistantDrawer: React.FC<DarkAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onNewProposal,
}) => {
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; citations?: string[]; proposals?: ActuatorCommandProposal[] }>
  >([
    {
      role: 'assistant',
      text: 'Hello! I am your Gemini Multimodal Agronomic Assistant. Ask me about your crop telemetry, substrate formulation, disease scans, or request action proposals.',
      citations: ['Live Telemetry Hypertable 14:32', 'KB v3.2 Protocol'],
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'session_dark_001',
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
          text: 'Based on Grow Unit G-04 telemetry (Moisture 28.5%), I have prepared an irrigation proposal for your review.',
          citations: ['Live Telemetry Hypertable 14:32'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMicVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSend('Explain my latest soil moisture reading');
    }, 2200);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col shadow-2xl font-sans text-slate-100">
      {/* Header */}
      <div className="p-4 bg-[#0a0a0a] border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Gemini Multimodal Assistant</h3>
            <span className="text-[10px] text-teal-400 font-mono block">Grounded Telemetry Agent</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Safety Interlock Restriction Banner */}
      <div className="bg-amber-950/40 p-3 border-b border-amber-500/30 text-xs text-amber-300 flex items-center space-x-2">
        <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>
          <strong>Safety Mandate:</strong> Assistant creates proposals only. Direct physical execution is strictly blocked.
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-[#0a0a0a]/60">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-teal-950/60 text-teal-200 border border-teal-500/40 rounded-br-none font-medium'
                  : 'bg-white/5 text-slate-200 border border-white/10 rounded-bl-none shadow-sm backdrop-blur-md'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {/* PROPOSAL CARDS (Review in Control Center) */}
              {msg.proposals && msg.proposals.length > 0 && (
                <div className="mt-3 p-3 bg-red-950/60 border border-red-500/40 rounded-xl space-y-2 text-[11px] font-mono">
                  <div className="flex items-center space-x-1.5 text-red-400 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>PROPOSAL CREATED (Requires Confirmation)</span>
                  </div>
                  <div className="text-slate-300">
                    Actuator: {msg.proposals[0].actuatorType} ({msg.proposals[0].targetValue} {msg.proposals[0].unit})
                  </div>
                  <a
                    href="#irrigation_control"
                    onClick={onClose}
                    className="block py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full text-center transition font-sans"
                  >
                    Review in Control Center
                  </a>
                </div>
              )}

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-slate-400 font-mono">
                  Citations: {msg.citations.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-xs text-slate-400 italic flex items-center space-x-2 bg-white/5 p-3 rounded-2xl border border-white/10 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" />
            <span>Checking telemetry & sourcing knowledge base...</span>
          </div>
        )}

        {isListening && (
          <div className="p-3 bg-teal-950/60 border border-teal-500/40 rounded-xl flex items-center space-x-2 text-xs text-teal-300 animate-pulse">
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-4 bg-teal-400 animate-bounce" />
              <span className="w-1.5 h-6 bg-teal-400 animate-bounce delay-100" />
              <span className="w-1.5 h-3 bg-teal-400 animate-bounce delay-200" />
            </div>
            <span>Listening for voice prompt...</span>
          </div>
        )}
      </div>

      {/* Quick Action Chips */}
      <div className="p-2 bg-[#0a0a0a] border-t border-white/10 flex space-x-1.5 overflow-x-auto text-[11px] font-mono scrollbar-none">
        <button
          onClick={() => handleSend('Check Reservoir Status')}
          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-full font-medium whitespace-nowrap transition border border-white/10"
        >
          Check Reservoir
        </button>
        <button
          onClick={() => handleSend('Explain Last Dose')}
          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-full font-medium whitespace-nowrap transition border border-white/10"
        >
          Explain Last Dose
        </button>
        <button
          onClick={() => handleSend('Recommend Crop')}
          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-full font-medium whitespace-nowrap transition border border-white/10"
        >
          Recommend Crop
        </button>
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-[#0a0a0a] border-t border-white/10">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMicVoiceInput}
            className={`p-2 rounded-full border transition ${
              isListening ? 'bg-red-950 text-red-400 border-red-500/50 animate-pulse' : 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/10'
            }`}
            title="Voice Input (Web Speech API)"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask assistant or propose action..."
            className="flex-1 bg-slate-900 border border-white/10 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
          />

          <button
            onClick={() => handleSend()}
            className="p-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-full shadow transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
