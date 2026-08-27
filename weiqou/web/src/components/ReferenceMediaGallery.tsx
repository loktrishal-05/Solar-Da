import React, { useState } from 'react';
import { Film, Image as ImageIcon, Play, Pause, Maximize2, X, CheckCircle2, Eye } from 'lucide-react';

export interface ReferenceMediaItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  category: 'TERRASUB' | 'SOLAR_DA' | 'DISEASE_SCAN' | 'STYLE_BIBLE' | 'IRRIGATION';
  src: string;
  description: string;
}

export const REFERENCE_MEDIA_ITEMS: ReferenceMediaItem[] = [
  {
    id: 'ref_disease_scan',
    type: 'image',
    title: 'On-Device Disease Diagnostic (Early Leaf Spot)',
    category: 'DISEASE_SCAN',
    src: '/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg',
    description: 'Field scan demonstrating 82% confidence diagnosis for Early Leaf Spot with Neem Oil cure steps.',
  },
  {
    id: 'ref_substrate_calc',
    type: 'image',
    title: 'Substrate Recipe Calculator (2L Reference Batch)',
    category: 'TERRASUB',
    src: '/media/8ad1f6dd-2cd4-42ed-ae21-0114beab7d80.jpg',
    description: 'Greenhouse view of 2L substrate batch calculator with fish/poultry gelatin safety warning.',
  },
  {
    id: 'ref_irrigation_popup',
    type: 'image',
    title: 'Automated Moisture-Pulse Irrigation Notification',
    category: 'IRRIGATION',
    src: '/media/a7e67a16-b33a-46dc-ae20-f3c976c4d8b1.jpg',
    description: 'Real-time 12s pulse trigger pop-up triggered by soil moisture falling below 35% threshold.',
  },
  {
    id: 'ref_crop_recommendations',
    type: 'image',
    title: 'Agmarknet Recommended Crops & Assistant Chat',
    category: 'TERRASUB',
    src: '/media/831f72ec-b82d-4b7d-be7f-b9598aaf30e6.jpg',
    description: 'Methi, Palak, and Arai Keerai market score ranking with assistant EC inquiry response.',
  },
  {
    id: 'ref_substrate_batch_alt',
    type: 'image',
    title: 'Substrate Batch Logger Field View',
    category: 'TERRASUB',
    src: '/media/73129ae4-3f91-425d-ab49-a114d8cf176f.jpg',
    description: 'Field device view showing confirmed 2L mix formula log in greenhouse grow gutters.',
  },
  {
    id: 'vid_style_bible_1',
    type: 'video',
    title: 'Style Bible Motion — Automated Dosing Loop',
    category: 'STYLE_BIBLE',
    src: '/media/STYLE_BIBLE_ABOVE___Using_the (1).mp4',
    description: 'Cinematic video demonstrating the fixed fertigation loop & pulse sequence in action.',
  },
  {
    id: 'vid_style_bible_2',
    type: 'video',
    title: 'Style Bible Motion — Substrate Hydration',
    category: 'STYLE_BIBLE',
    src: '/media/STYLE_BIBLE_ABOVE___Using_the (2).mp4',
    description: 'Cinematic video illustrating coco coir expansion & gelatin solution folding.',
  },
  {
    id: 'vid_style_bible_main',
    type: 'video',
    title: 'Style Bible Motion — Greenhouse Overview',
    category: 'STYLE_BIBLE',
    src: '/media/STYLE_BIBLE_ABOVE___Using_the.mp4',
    description: 'Overview clip of horizontal grow gutters and sensor telemetry integration.',
  },
  {
    id: 'vid_djhm',
    type: 'video',
    title: 'Solar-Da v3 Tower Flow & Circulation',
    category: 'SOLAR_DA',
    src: '/media/djhm.mp4',
    description: 'Recirculating vertical tower solution flow with minimum circulation duty cycle.',
  },
  {
    id: 'vid_yrdr',
    type: 'video',
    title: 'Crop Doctor Scanning & Root Inoculation',
    category: 'DISEASE_SCAN',
    src: '/media/yrdr.mp4',
    description: 'Root net-port inspection video loop highlighting Pythium prevention.',
  },
];

export const ReferenceMediaGallery: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<ReferenceMediaItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const filteredItems = activeCategory === 'ALL'
    ? REFERENCE_MEDIA_ITEMS
    : REFERENCE_MEDIA_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="bg-[#090b10] rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Film className="w-6 h-6 text-emerald-400" />
            <h2 className="font-display text-2xl font-extrabold text-white">Reference Field Media & Motion Gallery</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real greenhouse device mockups, PlantVillage disease scans, and motion video reference clips.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {['ALL', 'TERRASUB', 'SOLAR_DA', 'DISEASE_SCAN', 'IRRIGATION', 'STYLE_BIBLE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                activeCategory === cat ? 'bg-white text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Media Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedMedia(item)}
            className="group glass-card rounded-2xl p-3 border border-white/10 hover:border-emerald-500/50 transition duration-300 cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-white/5">
              {item.type === 'image' ? (
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              ) : (
                <video
                  src={item.src}
                  muted
                  loop
                  playsInline
                  autoPlay
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur text-[10px] font-mono text-emerald-400 border border-white/10 flex items-center space-x-1">
                {item.type === 'video' ? <Film className="w-3 h-3 text-cyan-400" /> : <ImageIcon className="w-3 h-3 text-emerald-400" />}
                <span>{item.type.toUpperCase()}</span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">{item.title}</h3>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-light">{item.description}</p>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/5 font-mono">
              <span>Category: {item.category}</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 group-hover:underline">
                <Eye className="w-3 h-3" /> Expand
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Popup Viewer */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="eyebrow-quiet">{selectedMedia.category} REFERENCE MEDIA</span>
              <h3 className="font-display text-xl font-bold text-white">{selectedMedia.title}</h3>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 max-h-[60vh] flex items-center justify-center">
              {selectedMedia.type === 'image' ? (
                <img src={selectedMedia.src} alt={selectedMedia.title} className="max-h-[60vh] w-auto object-contain" />
              ) : (
                <video src={selectedMedia.src} controls autoPlay className="max-h-[60vh] w-full object-contain" />
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-white/5 font-light">
              {selectedMedia.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
