import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, CheckCircle2, Users, Send, Paperclip } from 'lucide-react';

export const LightCommunitySection: React.FC = () => {
  const [filterTab, setFilterTab] = useState<string>('ALL');
  const [upvotesMap, setUpvotesMap] = useState<Record<string, number>>({
    t1: 42,
    t2: 29,
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState<string>('');

  const [threadReplies, setThreadReplies] = useState<Record<string, Array<{ author: string; role: string; text: string; time: string }>>>({
    t1: [
      {
        author: 'Dr. Kavitha R.',
        role: 'Agronomist (Verified)',
        text: 'Correct. Warm water bloom must stay strictly between 55°C and 70°C. Extreme heat denatures the gelatin collagen matrix, preventing effective nitrogen encapsulation.',
        time: '1h ago',
      },
    ],
    t2: [],
  });

  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpvotesMap((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleAddReply = (threadId: string) => {
    if (!replyInput.trim()) return;
    setThreadReplies((prev) => ({
      ...prev,
      [threadId]: [
        ...(prev[threadId] || []),
        {
          author: 'Murugan (Grower)',
          role: 'Grower',
          text: replyInput,
          time: 'Just now',
        },
      ],
    }));
    setReplyInput('');
  };

  const threads = [
    {
      id: 't1',
      author: 'Kavitha R.',
      role: 'Agronomist',
      verified: true,
      timestamp: '2h ago',
      title: 'Optimal Gelatin Dissolution Temperature for Substrate Nitrogen Binding',
      preview: 'Ensure warm water stays strictly between 55°C and 70°C. Extreme heat denatures the gelatin collagen matrix, preventing effective nitrogen encapsulation...',
      replies: 18,
      attachments: 2,
    },
    {
      id: 't2',
      author: 'Shanmugam P.',
      role: 'Grower',
      verified: false,
      timestamp: '5h ago',
      title: 'Methi Fenugreek Germination Success on Day 4 (Tray C Formula)',
      preview: 'Logged 94% germination rate using the 2L reference batch recipe (coco coir + vermicompost + biochar + neem + fish gelatin). Photo comparison attached...',
      replies: 12,
      attachments: 1,
    },
  ];

  return (
    <section id="community" className="relative bg-white py-20 px-4 lg:px-8 border-b border-[#E5E7EB] font-sans overflow-hidden">
      {/* Video Background #6 — Subtle Mandi Market Video with 92% White Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/media/STYLE_BIBLE_ABOVE___Using_the.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover filter saturate-[0.8] opacity-15"
        />
        <div className="absolute inset-0 bg-white/92" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-[#1B4332]" />
              <h2 className="font-display text-2xl font-extrabold text-[#1A1A1A]">Farmer Community & Co-operative Forum</h2>
            </div>
            <p className="text-xs text-gray-500 font-normal">
              Connect with verified agronomists, form bulk input co-ops, and share crop observation logs.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-[#059669]">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-ping" />
            <span className="font-bold">● 3 Agronomists Online</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs font-mono">
          {['ALL', 'MY CROPS', 'MARKET TALK', 'EQUIPMENT', 'ASK EXPERT'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition ${
                filterTab === tab
                  ? 'bg-[#1B4332] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CENTER FEED */}
          <div className="lg:col-span-8 space-y-4">
            {threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveThreadId(activeThreadId === t.id ? null : t.id)}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white font-bold flex items-center justify-center font-sans text-xs">
                      {t.author[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 font-sans">
                        <span className="font-bold text-gray-900 text-xs">{t.author}</span>
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[10px]">{t.role}</span>
                        {t.verified && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200 font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-400 text-[10px]">{t.timestamp}</span>
                </div>

                <h3 className="font-extrabold text-gray-900 text-sm">{t.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">{t.preview}</p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs font-mono">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={(e) => handleUpvote(t.id, e)}
                      className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#059669] border border-emerald-200 rounded-full font-bold transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{upvotesMap[t.id] || 0} Upvotes</span>
                    </button>

                    <span className="flex items-center space-x-1 text-gray-500">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t.replies} Replies</span>
                    </span>

                    {t.attachments > 0 && (
                      <span className="flex items-center space-x-1 text-gray-500">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{t.attachments} Attached</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[#1B4332] font-bold text-[11px] font-sans">View Thread →</span>
                </div>

                {/* Inline Replies */}
                {activeThreadId === t.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-gray-200 space-y-3 bg-[#FAFAF8] p-4 rounded-xl cursor-default"
                  >
                    <span className="font-bold text-xs text-gray-900 font-mono block">Thread Replies</span>

                    {(threadReplies[t.id] || []).map((r, i) => (
                      <div key={i} className="p-3 bg-white border border-gray-200 rounded-xl space-y-1 border-l-4 border-l-[#1B4332]">
                        <div className="flex justify-between text-[11px] font-mono text-[#1B4332] font-bold">
                          <span>{r.author} ({r.role})</span>
                          <span className="text-gray-400">{r.time}</span>
                        </div>
                        <p className="text-xs text-gray-700 font-normal leading-relaxed">{r.text}</p>
                      </div>
                    ))}

                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddReply(t.id)}
                        className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                      />
                      <button
                        onClick={() => handleAddReply(t.id)}
                        className="p-2 bg-[#1B4332] hover:bg-[#143326] text-white rounded-full shadow transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3 text-xs font-mono">
              <span className="font-bold text-gray-900 font-sans uppercase block text-xs">Trending Topics</span>
              <ol className="space-y-2 text-gray-700 font-sans">
                <li className="hover:text-[#1B4332] cursor-pointer">1. Gelatin safety prohibition rule update</li>
                <li className="hover:text-[#1B4332] cursor-pointer">2. Chennai mandi Methi price rally (+12%)</li>
                <li className="hover:text-[#1B4332] cursor-pointer">3. ESP32 firmware v3.2 pulse logic patch</li>
              </ol>
            </div>

            <div className="bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3 text-xs">
              <span className="font-bold text-gray-900 font-mono uppercase text-[11px] block">Co-op Bulk Buying Groups</span>
              <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2 font-mono">
                <span className="font-bold text-gray-900 block text-xs">Ranipet Fish Gelatin Co-op</span>
                <span className="text-[11px] text-gray-500 block">34 Members • 1.2 Tons Order</span>
                <button className="w-full mt-2 py-2 bg-[#1B4332] hover:bg-[#143326] text-white font-extrabold rounded-full transition shadow-sm">
                  Join Group (22% Bulk Discount)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
