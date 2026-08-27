import React, { useState } from 'react';
import { Users, MessageSquare, ThumbsUp, ShieldCheck, CheckCircle2, UserCheck, PlusCircle } from 'lucide-react';

export const FarmerCommunity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const threads = [
    {
      id: 'thread_01',
      author: 'Kavitha R.',
      role: 'Agronomist',
      verified: true,
      timestamp: '2 hours ago',
      title: 'Optimal Gelatin Dissolution Temperature for Substrate Nitrogen Binding',
      preview: 'Ensure warm water stays strictly between 55°C and 70°C. Extreme heat denatures the gelatin collagen matrix, preventing effective nitrogen encapsulation...',
      replies: 18,
      upvotes: 42,
      category: 'Ask Expert',
    },
    {
      id: 'thread_02',
      author: 'Shanmugam P.',
      role: 'Grower',
      verified: false,
      timestamp: '5 hours ago',
      title: 'Methi Fenugreek Germination Success on Day 4 (Tray C Formula)',
      preview: 'Logged 94% germination rate using the 2L reference batch recipe (coco coir + vermicompost + biochar + neem + fish gelatin). Photo comparison attached...',
      replies: 12,
      upvotes: 29,
      category: 'My Crops',
    },
  ];

  const coops = [
    {
      id: 'coop_01',
      name: 'Vellore-Ranipet Fish Gelatin Buying Co-op',
      members: 34,
      activeOrders: '1.2 Tons Certified Fish Collagen',
      savings: '22% Bulk Discount',
    },
    {
      id: 'coop_02',
      name: 'Chennai Organic Coco Coir Bulk Group',
      members: 58,
      activeOrders: '500 Blocks Hydrated Coir',
      savings: '18% Bulk Discount',
    },
  ];

  return (
    <section id="community" className="relative py-20 px-4 lg:px-8 bg-[#FAFAF8] border-t border-gray-200">
      {/* Background Video #6 with 92% White Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/media/STYLE_BIBLE_ABOVE___Using_the.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover bg-video-desaturated opacity-15"
        />
        <div className="absolute inset-0 bg-white/92" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Co-operative Knowledge Exchange</span>
            <h2 className="text-3xl font-extrabold text-[#1A1A1A]">Farmer Community & Co-op Purchasing</h2>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3.5 py-1.5 bg-[#E8F5E9] text-[#2D5A3D] border border-[#A5D6A7] text-xs font-bold rounded-full flex items-center gap-1.5 font-mono">
              <Users className="w-4 h-4 text-[#7CB342]" />
              <span>1,240 Verified Regional Growers</span>
            </span>
          </div>
        </div>

        {/* Pinned "Ask an Agronomist" Banner */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-[#2D5A3D]">
              <ShieldCheck className="w-5 h-5 text-[#059669]" />
              <span className="font-bold text-sm">Ask an Agronomist Pinned Desk</span>
            </div>
            <p className="text-xs text-gray-600 font-normal">
              Direct verification from certified regional agronomists. All cure protocols are cross-checked against lab standards.
            </p>
          </div>

          <button className="px-5 py-2.5 bg-[#2D5A3D] hover:bg-[#234730] text-white text-xs font-bold rounded-full shadow transition flex items-center space-x-2 whitespace-nowrap">
            <PlusCircle className="w-4 h-4" />
            <span>Post Agronomy Question</span>
          </button>
        </div>

        {/* Co-operative Buying Groups Cards */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Active Co-operative Purchasing Groups</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coops.map((coop) => (
              <div key={coop.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-900 text-xs">{coop.name}</h4>
                  <div className="text-[11px] text-gray-500 font-mono">
                    {coop.members} Members • Order: {coop.activeOrders}
                  </div>
                  <span className="text-[10px] font-bold text-[#059669] block">{coop.savings}</span>
                </div>

                <button className="px-4 py-2 bg-[#E8F5E9] hover:bg-[#A5D6A7] text-[#2D5A3D] text-xs font-bold rounded-full transition border border-[#A5D6A7] whitespace-nowrap">
                  Join Co-op
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Forum Discussions Feed */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3 overflow-x-auto text-xs">
            {['ALL', 'MY_CROPS', 'MARKET_TALK', 'EQUIPMENT', 'ASK_EXPERT'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-full font-semibold transition ${
                  activeTab === tab ? 'bg-[#2D5A3D] text-white shadow-sm font-bold' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Thread Cards Feed */}
          <div className="space-y-4">
            {threads.map((thread) => (
              <div key={thread.id} className="p-5 rounded-xl border border-gray-200 bg-[#FAFAF8] space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#2D5A3D] text-white font-bold text-xs flex items-center justify-center">
                      {thread.author[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-gray-900 text-xs">{thread.author}</span>
                        <span className="px-2 py-0.5 rounded bg-white text-gray-600 border border-gray-200 font-mono text-[10px]">
                          {thread.role}
                        </span>
                        {thread.verified && (
                          <span className="px-2 py-0.5 rounded bg-[#E8F5E9] text-[#059669] font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Verified Expert
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{thread.timestamp}</span>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-gray-900 text-sm">{thread.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">{thread.preview}</p>

                <div className="flex items-center space-x-4 pt-2 border-t border-gray-200/60 text-xs font-mono text-gray-500">
                  <span className="flex items-center space-x-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-[#2D5A3D]" />
                    <span>{thread.upvotes} Upvotes</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                    <span>{thread.replies} Replies</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
