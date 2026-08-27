import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  detail: string;
}

interface LightToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const LightToastContainer: React.FC<LightToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-6 z-50 space-y-2.5 max-w-sm w-full font-sans pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border-2 border-[#059669] rounded-2xl p-4 shadow-xl flex items-start justify-between space-x-3 pointer-events-auto animate-in slide-in-from-right duration-200"
        >
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs font-mono">
              <span className="font-bold text-gray-900 font-sans text-xs block">{toast.title}</span>
              <span className="text-gray-600 text-[11px] block">{toast.detail}</span>
            </div>
          </div>

          <button onClick={() => onDismiss(toast.id)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
