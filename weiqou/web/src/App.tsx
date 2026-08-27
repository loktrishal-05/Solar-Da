import React, { useState, useEffect, useCallback } from 'react';
import { ProductMode, ActuatorCommandProposal } from '@terrasub-solarda/engine';
import { Sparkles, X, ArrowLeft } from 'lucide-react';
import { LightNavbar } from './components/LightNavbar';
import { LightHeroSection } from './components/LightHeroSection';
import { LightProductShowcaseSection } from './components/LightProductShowcaseSection';
import { LightBentoGridSection } from './components/LightBentoGridSection';
import { LightLiveDashboardSection } from './components/LightLiveDashboardSection';
import { LightIrrigationSection } from './components/LightIrrigationSection';
import { LightCropDoctorSection } from './components/LightCropDoctorSection';
import { LightMarketSection } from './components/LightMarketSection';
import { LightCommunitySection } from './components/LightCommunitySection';
import { LightSmsAlertsSection } from './components/LightSmsAlertsSection';
import { LightAssistantDrawer } from './components/LightAssistantDrawer';
import { LightSafetyModal } from './components/LightSafetyModal';
import { LightToastContainer } from './components/LightToastContainer';
import { LightFooter } from './components/LightFooter';

export type FocusedSection =
  | 'live-dashboard'
  | 'irrigation'
  | 'crop-doctor'
  | 'market'
  | 'community'
  | 'sms-alerts'
  | null;

export const App: React.FC = () => {
  const [mode, setMode] = useState<ProductMode>('TERRASUB_MVP');
  const [eStopActive, setEStopActive] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [modalActionType, setModalActionType] = useState<'IRRIGATE' | 'DOSE' | 'ADJUST' | 'FAN' | 'MIST' | 'REBOOT' | null>(null);
  const [focusedSection, setFocusedSection] = useState<FocusedSection>(null);

  const [toasts, setToasts] = useState<Array<{ id: string; title: string; detail: string }>>([]);
  const [proposals, setProposals] = useState<ActuatorCommandProposal[]>([]);

  const [alerts, setAlerts] = useState<Array<{ id: string; type: 'CRITICAL' | 'WARNING' | 'INFO'; message: string; timestamp: string }>>([
    { id: 'a1', type: 'CRITICAL', message: 'Reservoir R-02 pH 8.9 (ceiling 8.5)', timestamp: '14:32:10' },
    { id: 'a2', type: 'WARNING', message: 'G-07 moisture sensor stale 12 min', timestamp: '14:20:00' },
    { id: 'a3', type: 'INFO', message: 'Market price alert: Methi +12% this week', timestamp: '08:00:00' },
  ]);

  const [eventLogs, setEventLogs] = useState<Array<{ id: string; time: string; unit: string; action: string; trigger: 'AUTO' | 'MANUAL' | 'SYSTEM'; status: string }>>([
    { id: 'e1', time: '14:32:05', unit: 'G-04', action: 'Irrigate 12s', trigger: 'AUTO', status: '✓ Success' },
    { id: 'e2', time: '14:15:22', unit: 'G-04', action: 'Dose 15ml', trigger: 'MANUAL', status: '✓ Success' },
    { id: 'e3', time: '13:48:10', unit: 'G-07', action: 'Irrigate 12s', trigger: 'AUTO', status: '✓ Success' },
    { id: 'e4', time: '13:20:00', unit: 'G-04', action: 'Alert: Low', trigger: 'SYSTEM', status: '⚠ Warning' },
  ]);

  useEffect(() => {
    if (focusedSection) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [focusedSection]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusedSection) {
        setFocusedSection(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusedSection]);

  useEffect(() => {
    fetch('/api/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    }).catch(() => {});
  }, [mode]);

  const toggleEStop = async () => {
    const nextState = !eStopActive;
    setEStopActive(nextState);
    try {
      await fetch('/api/estop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextState }),
      });
    } catch (err) {}
  };

  const handleActionClick = (actionType: 'IRRIGATE' | 'DOSE' | 'ADJUST' | 'FAN' | 'MIST' | 'REBOOT') => {
    setModalActionType(actionType);
  };

  const handleModalConfirm = (title: string, detail: string) => {
    const newLog = {
      id: `log_${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      unit: 'G-04',
      action: title,
      trigger: 'MANUAL' as const,
      status: '✓ Success',
    };
    setEventLogs((prev) => [newLog, ...prev]);

    const toastId = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id: toastId, title: `✓ ${title} Complete`, detail }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4000);
  };

  const openSection = useCallback((id: FocusedSection) => {
    if (!id) return;
    setFocusedSection(id);
  }, []);

  const closeSection = useCallback(() => {
    setFocusedSection(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] flex flex-col font-sans antialiased selection:bg-[#7CB342]/30 selection:text-[#1B4332]">
      {/* 1. STICKY NAVBAR */}
      <LightNavbar
        mode={mode}
        setMode={setMode}
        eStopActive={eStopActive}
        onToggleEStop={toggleEStop}
        unreadAlertsCount={alerts.length}
        onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
        alerts={alerts}
        onDismissAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
        activeSection={focusedSection}
        onOpenSection={openSection}
      />

      {/* ANCHORED SECTIONS IN ORDER */}
      <main className="flex-1 w-full space-y-0">
        {!focusedSection && (
          <>
            {/* 2. HERO SECTION (Video Background #1) */}
            <LightHeroSection mode={mode} eStopActive={eStopActive} onOpenSection={openSection} />

            {/* 3. PRODUCT MODE SHOWCASE (Video Background #2 & #3) */}
            <LightProductShowcaseSection />

            {/* 4. FEATURE BENTO GRID (The Six Pillars) */}
            <LightBentoGridSection onOpenSection={openSection} />

            {/* 5. LIVE DASHBOARD / PLANT MONITORING */}
            <LightLiveDashboardSection onActionClick={handleActionClick} />

            {/* 6. IRRIGATION AUTOMATION CONTROL CENTER */}
            <LightIrrigationSection onActionClick={handleActionClick} eventLogs={eventLogs} />

            {/* 7. CROP DOCTOR — PLANT DISEASE PREDICTION */}
            <LightCropDoctorSection onCreateProposal={() => handleActionClick('DOSE')} />

            {/* 8. SMS NOTIFICATIONS & ALERTS CENTER */}
            <LightSmsAlertsSection
              alerts={alerts}
              onDismissAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
            />

            {/* 9. MARKET DEMAND INTELLIGENCE */}
            <LightMarketSection />

            {/* 10. FARMER COMMUNITY & CO-OPERATIVE FORMATION */}
            <LightCommunitySection />
          </>
        )}

        {focusedSection === 'live-dashboard' && (
          <FullscreenSection title="Live Dashboard" onClose={closeSection}>
            <LightLiveDashboardSection onActionClick={handleActionClick} />
          </FullscreenSection>
        )}

        {focusedSection === 'irrigation' && (
          <FullscreenSection title="Irrigation Control" onClose={closeSection}>
            <LightIrrigationSection onActionClick={handleActionClick} eventLogs={eventLogs} />
          </FullscreenSection>
        )}

        {focusedSection === 'crop-doctor' && (
          <FullscreenSection title="Crop Doctor — Plant Disease AI" onClose={closeSection}>
            <LightCropDoctorSection onCreateProposal={() => handleActionClick('DOSE')} />
          </FullscreenSection>
        )}

        {focusedSection === 'market' && (
          <FullscreenSection title="Market Intelligence" onClose={closeSection}>
            <LightMarketSection />
          </FullscreenSection>
        )}

        {focusedSection === 'community' && (
          <FullscreenSection title="Farmer Community" onClose={closeSection}>
            <LightCommunitySection />
          </FullscreenSection>
        )}

        {focusedSection === 'sms-alerts' && (
          <FullscreenSection title="SMS Notifications & Alerts" onClose={closeSection}>
            <LightSmsAlertsSection
              alerts={alerts}
              onDismissAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
            />
          </FullscreenSection>
        )}
      </main>

      {/* FLOATING FAB FOR GEMINI ASSISTANT (Bottom Right) */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1B4332] hover:bg-[#143326] text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition group border-2 border-[#7CB342]/40"
        title="Open Gemini AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-yellow-300 group-hover:scale-110 transition" />
      </button>

      {/* 11. GEMINI MULTIMODAL ASSISTANT SLIDE-OUT PANEL */}
      <LightAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onNewProposal={(p) => setProposals((prev) => [p, ...prev])}
      />

      {/* 12. SAFETY CONFIRMATION MODAL */}
      <LightSafetyModal
        isOpen={!!modalActionType}
        actionType={modalActionType}
        onClose={() => setModalActionType(null)}
        onConfirm={handleModalConfirm}
      />

      {/* TOAST NOTIFICATIONS */}
      <LightToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* FOOTER */}
      <LightFooter />
    </div>
  );
};

interface FullscreenSectionProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const FullscreenSection: React.FC<FullscreenSectionProps> = ({ title, onClose, children }) => {
  return (
    <div
      className="fixed inset-0 top-0 z-30 bg-[#FAFAF8] overflow-y-auto animate-[fadeIn_200ms_ease-out]"
      style={{ paddingTop: '64px' }}
    >
      <div className="sticky top-[64px] z-10 bg-[#1B4332] text-white border-b border-[#143326] px-4 lg:px-8 py-3 flex items-center justify-between shadow-md">
        <button
          onClick={onClose}
          className="flex items-center space-x-2 text-sm font-bold text-white hover:text-[#7CB342] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </button>
        <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};

export default App;
