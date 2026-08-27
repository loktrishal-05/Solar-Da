import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, ShieldCheck, CheckCircle2, Search, PlusCircle, Paperclip, Users, Send } from 'lucide-react';

export const DarkCommunityTab: React.FC = () => {
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
    <div className="relative space-y-8 text-slate-100 font-sans">
      {/* Video Background #6 — Darkened Farm Community Footage */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
        <video
          src="/media/STYLE_BIBLE_ABOVE___Using_the.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover filter brightness-[0.2] opacity-20"
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/90" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-teal-400" />
              <h2 className="font-display text-2xl font-extrabold text-white">Farmer Community & Co-op Exchange</h2>
            </div>
            <p className="text-xs text-slate-400 font-light">
              Connect with verified agronomists, form bulk input co-ops, and share crop observation logs.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">● 3 Agronomists Online</span>
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs font-mono">
          {['ALL', 'MY CROPS', 'MARKET TALK', 'EQUIPMENT', 'ASK EXPERT'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition ${
                filterTab === tab
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Grid: Feed + Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CENTER FEED (Threads List) */}
          <div className="lg:col-span-8 space-y-4">
            {threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveThreadId(activeThreadId === t.id ? null : t.id)}
                className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-3 hover:border-teal-500/30 transition-all cursor-pointer"
              >
                {/* Author Info */}
                <div className="flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-500 text-slate-950 font-bold flex items-center justify-center font-sans text-xs">
                      {t.author[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 font-sans">
                        <span className="font-bold text-white text-xs">{t.author}</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 font-mono text-[10px]">{t.role}</span>
                        {t.verified && (
                          <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30 font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-teal-400" /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-[10px]">{t.timestamp}</span>
                </div>

                <h3 className="font-bold text-white text-sm font-sans">{t.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-light">{t.preview}</p>

                {/* Footer Controls: Upvote, Replies, Attachments */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={(e) => handleUpvote(t.id, e)}
                      className="flex items-center space-x-1.5 px-3 py-1 bg-teal-950/60 hover:bg-teal-900/80 text-teal-300 border border-teal-500/40 rounded-full font-bold transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{upvotesMap[t.id] || 0} Upvotes</span>
                    </button>

                    <span className="flex items-center space-x-1 text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.replies} Replies</span>
                    </span>

                    {t.attachments > 0 && (
                      <span className="flex items-center space-x-1 text-slate-400">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.attachments} Attached</span>
                      </span>
                    )}
                  </div>

                  <span className="text-teal-400 font-bold text-[11px] font-sans">View Thread →</span>
                </div>

                {/* Inline Expanded Thread & Replies */}
                {activeThreadId === t.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-white/10 space-y-3 bg-slate-950/60 p-4 rounded-2xl cursor-default"
                  >
                    <span className="font-bold text-xs text-white font-mono block">Thread Replies</span>

                    {(threadReplies[t.id] || []).map((r, i) => (
                      <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 border-l-4 border-l-teal-400">
                        <div className="flex justify-between text-[11px] font-mono text-teal-300 font-bold">
                          <span>{r.author} ({r.role})</span>
                          <span className="text-slate-400">{r.time}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-light leading-relaxed">{r.text}</p>
                      </div>
                    ))}

                    {/* Inline Reply Input */}
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddReply(t.id)}
                        className="flex-1 bg-slate-900 border border-white/10 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                      />
                      <button
                        onClick={() => handleAddReply(t.id)}
                        className="p-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-full shadow transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* RIGHT SIDEBAR (Desktop) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Trending This Week */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3 text-xs font-mono">
              <span className="font-bold text-white font-sans uppercase block text-xs">Trending Topics</span>
              <ol className="space-y-2 text-slate-300 font-sans">
                <li className="hover:text-teal-400 cursor-pointer">1. Gelatin safety prohibition rule update</li>
                <li className="hover:text-teal-400 cursor-pointer">2. Chennai mandi Methi price rally (+12%)</li>
                <li className="hover:text-teal-400 cursor-pointer">3. ESP32 firmware v3.2 pulse logic patch</li>
              </ol>
            </div>

            {/* Co-op Buying Groups */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3 text-xs">
              <span className="font-bold text-white font-mono uppercase text-[11px] block">Co-op Bulk Buying Groups</span>
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/10 space-y-2 font-mono">
                <span className="font-bold text-white block text-xs">Ranipet Fish Gelatin Co-op</span>
                <span className="text-[11px] text-slate-400 block">34 Members • 1.2 Tons Order</span>
                <button className="w-full mt-2 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-full transition shadow-lg shadow-teal-500/20">
                  Join Order (22% Bulk Discount)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
