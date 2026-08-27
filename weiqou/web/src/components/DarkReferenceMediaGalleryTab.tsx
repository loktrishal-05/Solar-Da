import React from 'react';
import { ReferenceMediaGallery } from './ReferenceMediaGallery';

export const DarkReferenceMediaGalleryTab: React.FC = () => {
  return (
    <div className="relative space-y-6">
      {/* Video Background #2 — Darkened Motion Background */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
        <video
          src="/media/STYLE_BIBLE_ABOVE___Using_the (2).mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover filter brightness-[0.2] opacity-20"
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/90" />
      </div>

      <div className="relative z-10">
        <ReferenceMediaGallery />
      </div>
    </div>
  );
};
