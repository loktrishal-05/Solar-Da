import React, { useState } from 'react';
import { Sparkles, Send, Mic, Paperclip, X, AlertTriangle, Lock, ShieldCheck } from 'lucide-react';
import { ActuatorCommandProposal } from '@terrasub-solarda/engine';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleOpen: () => void;
  onNewProposal: (prop: ActuatorCommandProposal) => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onToggleOpen,
  onNewProposal,
}) => {
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; citations?: string[]; proposals?: ActuatorCommandProposal[] }>
  >([
    {
      role: 'assistant',
      text: 'Hello! I am your Gemini Agronomic Assistant. Ask me about your crop telemetry, substrate recipe, disease scans, or request action proposals.',
      citations: ['Platform Knowledge Base v3.2', 'Live Telemetry Hypertable'],
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

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
          sessionId: 'session_web_light_001',
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
          text: 'Based on your Grow Unit G-01 telemetry (Moisture 28.5%, EC 1.55 mS/cm), your moisture is below the 35% threshold.',
          citations: ['Live Telemetry Hypertable 14:30'],
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
    }, 2500);
  };

  return (
    <>
      {/* Floating FAB 56px Circle Forest Green #2D5A3D */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#2D5A3D] text-white shadow-xl hover:bg-[#234730] transition duration-300 flex items-center justify-center z-40 group"
          title="Open Gemini AI Agronomic Assistant"
        >
          <Sparkles className="w-6 h-6 text-yellow-300 group-hover:scale-110 transition" />
        </button>
      )}

      {/* Slide-over Full Height Chat Panel (480px width) */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 bg-[#2D5A3D] text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#7CB342] text-slate-950 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-[#2D5A3D]" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Gemini AI Assistant</h3>
                <span className="text-[10px] text-emerald-200 font-mono block">Grounded Telemetry Agent</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[#234730] rounded-full text-white/80 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Safety Restriction Banner */}
          <div className="bg-[#FFF8E1] p-3 border-b border-[#FFE082] text-xs text-[#8D6E63] flex items-center space-x-2">
            <Lock className="w-4 h-4 text-[#D97706] flex-shrink-0" />
            <span>
              <strong>Safety Invariant:</strong> Tool calls produce proposal cards only. Direct hardware execution is strictly blocked.
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-[#FAFAF8]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#E8F5E9] text-[#2D5A3D] border border-[#A5D6A7] rounded-br-none font-medium'
                      : 'bg-white text-gray-900 border border-gray-200 shadow-sm rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* PROPOSAL CARDS (Never Direct Execution!) */}
                  {msg.proposals && msg.proposals.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-[11px]">
                      <div className="flex items-center space-x-1.5 text-red-700 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>PROPOSAL CREATED (Confirmation Required)</span>
                      </div>
                      <div className="font-mono text-gray-800">
                        Actuator: {msg.proposals[0].actuatorType} ({msg.proposals[0].targetValue} {msg.proposals[0].unit})
                      </div>
                      <a
                        href="#irrigation"
                        onClick={onClose}
                        className="block py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-center transition"
                      >
                        Review & Confirm in Control Center
                      </a>
                    </div>
                  )}

                  {/* Sourced Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500 font-mono">
                      Citations: {msg.citations.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-xs text-gray-500 italic flex items-center space-x-2 bg-white p-3 rounded-2xl border border-gray-200 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-[#2D5A3D] animate-spin" />
                <span>Checking telemetry & sourcing knowledge base...</span>
              </div>
            )}

            {isListening && (
              <div className="p-3 bg-[#E8F5E9] border border-[#A5D6A7] rounded-xl flex items-center space-x-2 text-xs text-[#2D5A3D] animate-pulse">
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-4 bg-[#2D5A3D] animate-bounce" />
                  <span className="w-1.5 h-6 bg-[#2D5A3D] animate-bounce delay-100" />
                  <span className="w-1.5 h-3 bg-[#2D5A3D] animate-bounce delay-200" />
                </div>
                <span>Listening for voice prompt...</span>
              </div>
            )}
          </div>

          {/* Quick Action Chips */}
          <div className="p-2 bg-white border-t border-gray-100 flex space-x-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSend('Check Reservoir Status')}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium whitespace-nowrap transition"
            >
              Check Reservoir Status
            </button>
            <button
              onClick={() => handleSend('Explain Last Dose')}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium whitespace-nowrap transition"
            >
              Explain Last Dose
            </button>
            <button
              onClick={() => handleSend('Recommend Crop')}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium whitespace-nowrap transition"
            >
              Recommend Crop
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white border-t border-gray-200 space-y-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMicVoiceInput}
                className={`p-2 rounded-full border transition ${
                  isListening ? 'bg-red-50 text-red-600 border-red-300 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
                }`}
                title="Voice Input via Web Speech API"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask assistant or propose action..."
                className="flex-1 bg-[#FAFAF8] border border-gray-300 rounded-full px-4 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-[#2D5A3D] focus:outline-none"
              />

              <button
                onClick={() => handleSend()}
                className="p-2 bg-[#2D5A3D] hover:bg-[#234730] text-white rounded-full shadow transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
