import React from 'react';
import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { playKeyClick } from '../../utils/audio';

interface KioskModalProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** White kiosk modal with the brand-green title bar (library modal pattern). */
export const KioskModal: React.FC<KioskModalProps> = ({ icon: Icon, title, subtitle, onClose, footer, children }) => {
  const close = () => {
    playKeyClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94dvh] text-slate-800">
        <div className="snc-modal-header px-5 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/10 text-snc-neon flex items-center justify-center border border-white/25 shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">{title}</h2>
              {subtitle && <p className="text-xs text-emerald-100/80 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm">{children}</div>

        {footer && (
          <div className="border-t border-slate-200 bg-slate-50 px-5 sm:px-6 py-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/** Shared kiosk modal buttons. */
export const btnPrimary =
  'kiosk-cta inline-flex items-center justify-center gap-2 rounded-full bg-snc-green hover:bg-snc-green-mid px-6 py-3 text-xs uppercase text-white transition-colors active:scale-95 disabled:opacity-60 cursor-pointer';
export const btnSecondary =
  'kiosk-cta inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white hover:bg-slate-100 px-6 py-3 text-xs uppercase text-slate-700 transition-colors cursor-pointer';
