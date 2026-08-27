import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  detail: string;
}

interface DarkToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const DarkToastContainer: React.FC<DarkToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-6 z-50 space-y-2.5 max-w-sm w-full font-sans pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-slate-900/95 border-l-4 border-l-teal-400 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-start justify-between space-x-3 pointer-events-auto animate-in slide-in-from-right duration-200"
        >
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs font-mono">
              <span className="font-bold text-white font-sans text-xs block">{toast.title}</span>
              <span className="text-slate-400 text-[11px] block">{toast.detail}</span>
            </div>
          </div>

          <button onClick={() => onDismiss(toast.id)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
