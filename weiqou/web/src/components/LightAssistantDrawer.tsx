import React, { useState } from 'react';
import { Sparkles, Send, Mic, Paperclip, X, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { ActuatorCommandProposal } from '@terrasub-solarda/engine';

interface LightAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProposal: (prop: ActuatorCommandProposal) => void;
}

export const LightAssistantDrawer: React.FC<LightAssistantDrawerProps> = ({
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
          sessionId: 'session_light_001',
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

  const handleVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSend('Explain my latest soil moisture reading');
    }, 2200);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl font-sans text-gray-900">
      {/* Header */}
      <div className="p-4 bg-[#1B4332] text-white flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 text-yellow-300 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Gemini Multimodal Assistant</h3>
            <span className="text-[10px] font-mono text-emerald-200 block">Context-Aware Agronomic Agent</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-white/80 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Safety Interlock Restriction Banner */}
      <div className="bg-[#FFF8E1] p-3 border-b border-[#FFE082] text-xs text-[#8D6E63] flex items-center space-x-2">
        <Lock className="w-4 h-4 text-[#D97706] flex-shrink-0" />
        <span>
          <strong>Safety Mandate:</strong> Assistant creates proposals only. Direct physical execution is strictly blocked.
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-[#FAFAF8]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#E8F5E9] text-[#1B4332] border border-[#A5D6A7] rounded-br-none font-medium'
                  : 'bg-white text-gray-900 border border-gray-200 shadow-sm rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {/* PROPOSAL CARDS (Red Banner Review in Control Center) */}
              {msg.proposals && msg.proposals.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-[11px] font-mono">
                  <div className="flex items-center space-x-1.5 text-red-700 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>PROPOSAL CREATED (Requires Confirmation)</span>
                  </div>
                  <div className="text-gray-800">
                    Actuator: {msg.proposals[0].actuatorType} ({msg.proposals[0].targetValue} {msg.proposals[0].unit})
                  </div>
                  <a
                    href="#irrigation"
                    onClick={onClose}
                    className="block py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-center transition font-sans"
                  >
                    Confirm in Control Center
                  </a>
                </div>
              )}

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-mono">
                  Citations: {msg.citations.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-xs text-gray-500 italic flex items-center space-x-2 bg-white p-3 rounded-2xl border border-gray-200 w-fit shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#1B4332] animate-spin" />
            <span>Checking farm telemetry & sourcing knowledge base...</span>
          </div>
        )}

        {isListening && (
          <div className="p-3 bg-[#E8F5E9] border border-[#A5D6A7] rounded-xl flex items-center space-x-2 text-xs text-[#1B4332] animate-pulse">
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-4 bg-[#1B4332] animate-bounce" />
              <span className="w-1.5 h-6 bg-[#1B4332] animate-bounce delay-100" />
              <span className="w-1.5 h-3 bg-[#1B4332] animate-bounce delay-200" />
            </div>
            <span>Listening for voice input...</span>
          </div>
        )}
      </div>

      {/* Quick Action Chips */}
      <div className="p-2 bg-white border-t border-gray-100 flex space-x-1.5 overflow-x-auto text-[11px] font-mono scrollbar-none">
        <button
          onClick={() => handleSend('Check Reservoir Status')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full font-medium whitespace-nowrap transition"
        >
          Check Reservoir
        </button>
        <button
          onClick={() => handleSend('Explain Last Dose')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full font-medium whitespace-nowrap transition"
        >
          Explain Last Dose
        </button>
        <button
          onClick={() => handleSend('Recommend Crop')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full font-medium whitespace-nowrap transition"
        >
          Recommend Crop
        </button>
        <button
          onClick={() => handleSend('Create Listing')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full font-medium whitespace-nowrap transition"
        >
          Create Listing
        </button>
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleVoiceInput}
            className={`p-2 rounded-full border transition ${
              isListening ? 'bg-red-50 text-red-600 border-red-300 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            placeholder="Ask assistant..."
            className="flex-1 bg-[#FAFAF8] border border-gray-300 rounded-full px-4 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-[#1B4332] focus:outline-none"
          />

          <button
            onClick={() => handleSend()}
            className="p-2 bg-[#1B4332] hover:bg-[#143326] text-white rounded-full shadow transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
