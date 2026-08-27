import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, ShieldCheck, CheckCircle2, Search, PlusCircle, Share2, Bookmark, Paperclip, Users } from 'lucide-react';

export const OperationalForumSection: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [upvotesMap, setUpvotesMap] = useState<Record<string, number>>({
    thread_01: 42,
    thread_02: 29,
  });

  const [activeThreadDetail, setActiveThreadDetail] = useState<string | null>(null);

  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpvotesMap((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const threads = [
    {
      id: 'thread_01',
      author: 'Kavitha R.',
      role: 'Agronomist',
      verified: true,
      timestamp: '2h ago',
      title: 'Optimal Gelatin Dissolution Temperature for Substrate Nitrogen Binding',
      preview: 'Ensure warm water stays strictly between 55°C and 70°C. Extreme heat denatures the gelatin collagen matrix, preventing effective nitrogen encapsulation...',
      replies: 18,
      category: 'ASK_EXPERT',
      attachments: 2,
    },
    {
      id: 'thread_02',
      author: 'Shanmugam P.',
      role: 'Grower',
      verified: false,
      timestamp: '5h ago',
      title: 'Methi Fenugreek Germination Success on Day 4 (Tray C Formula)',
      preview: 'Logged 94% germination rate using the 2L reference batch recipe (coco coir + vermicompost + biochar + neem + fish gelatin). Photo comparison attached...',
      replies: 12,
      category: 'MY_CROPS',
      attachments: 1,
    },
  ];

  return (
    <section id="operational-forum" className="bg-[#FAFAF8] py-12 px-4 lg:px-6 border-b border-gray-200 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Agronomy & Co-op Forum</span>
            <h2 className="text-2xl font-extrabold text-[#1A1A1A]">Farmer Community Operational Forum</h2>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-[#059669]">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-ping" />
            <span className="font-bold">● 3 Regional Agronomists Online Now</span>
          </div>
        </div>

        {/* 3-Column Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN — NAVIGATION & FILTERS (240px fixed) */}
          <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-gray-200 rounded-full pl-9 pr-3 py-1.5 text-xs text-gray-900 focus:outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="space-y-1 font-semibold text-gray-700">
              {['ALL', 'MY CROPS', 'MARKET TALK', 'EQUIPMENT', 'ASK EXPERT'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition ${
                    filterCategory === cat ? 'bg-[#1B4332] text-white font-bold' : 'hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Popular Tags */}
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <span className="font-bold text-gray-900 uppercase font-mono text-[10px]">Popular Tags</span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                {['#substrate', '#irrigation', '#disease', '#methi', '#solar-da'].map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <button className="w-full py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-bold rounded-full shadow-sm transition flex items-center justify-center space-x-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>Start New Discussion</span>
            </button>
          </div>

          {/* CENTER COLUMN — DISCUSSION FEED (Fluid Width) */}
          <div className="lg:col-span-6 space-y-4">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setActiveThreadDetail(activeThreadDetail === thread.id ? null : thread.id)}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3 card-hover-lift cursor-pointer"
              >
                {/* Author Info & Verified Badge */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-[#1B4332] text-white font-bold flex items-center justify-center text-xs">
                      {thread.author[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-gray-900">{thread.author}</span>
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[10px]">{thread.role}</span>
                        {thread.verified && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[#059669] font-bold text-[10px] flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{thread.timestamp}</span>
                </div>

                <h3 className="font-bold text-gray-900 text-sm">{thread.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">{thread.preview}</p>

                {/* Footer Controls: Upvote, Replies, Attachments */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs font-mono">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => handleUpvote(thread.id, e)}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#059669] rounded-full font-bold transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{upvotesMap[thread.id] || 0} Upvotes</span>
                    </button>

                    <span className="flex items-center space-x-1 text-gray-500">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{thread.replies} Replies</span>
                    </span>

                    {thread.attachments > 0 && (
                      <span className="flex items-center space-x-1 text-gray-500">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{thread.attachments} Attached</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[#1B4332] font-bold text-[11px]">View Thread →</span>
                </div>

                {/* Thread Detail Expansion */}
                {activeThreadDetail === thread.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 bg-[#FAFAF8] p-3 rounded-xl">
                    <span className="font-bold text-xs text-gray-900 font-mono">Thread Replies ({thread.replies})</span>
                    <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-1 border-l-4 border-l-[#059669]">
                      <div className="flex justify-between text-[11px] font-bold text-gray-900">
                        <span>Dr. Kavitha R. (Agronomist)</span>
                        <span className="text-[#059669]">Verified Solution</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        "Correct. Saturated collagen crosslinks at 65°C. Maintain temperature for 10 minutes before adding coir matrix."
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* RIGHT COLUMN — SIDEBAR (280px fixed) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Trending This Week */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3 text-xs font-mono">
              <span className="font-bold text-gray-900 font-sans uppercase text-xs block">Trending This Week</span>
              <ol className="space-y-2 text-gray-700 font-sans">
                <li className="hover:text-[#1B4332] cursor-pointer">1. Gelatin safety prohibition list update</li>
                <li className="hover:text-[#1B4332] cursor-pointer">2. Chennai mandi Methi price rally (+12%)</li>
                <li className="hover:text-[#1B4332] cursor-pointer">3. ESP32 firmware v3.2 pulse logic patch</li>
              </ol>
            </div>

            {/* Co-op Buying Groups */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3 text-xs">
              <span className="font-bold text-gray-900 uppercase font-mono text-[11px] block">Co-op Bulk Buying Groups</span>
              <div className="p-3 bg-[#FAFAF8] rounded-xl border border-gray-200 space-y-1 font-mono">
                <span className="font-bold text-gray-900 block text-xs">Ranipet Fish Gelatin Group</span>
                <span className="text-[11px] text-gray-500 block">34 Members • 1.2 Tons Order</span>
                <button className="w-full mt-2 py-1.5 bg-[#E8F5E9] hover:bg-[#A5D6A7] text-[#1B4332] font-bold rounded-full border border-[#A5D6A7] transition">
                  Join Bulk Order (22% Off)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
