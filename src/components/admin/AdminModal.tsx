import React from 'react';
import { X } from 'lucide-react';

interface AdminModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}

export const AdminModal: React.FC<AdminModalProps> = ({ title, subtitle, onClose, wide, children }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className={`admin-card w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-hidden rounded-2xl flex flex-col shadow-2xl`}>
      <div className="snc-modal-header px-5 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-white truncate">{title}</h3>
          {subtitle && <p className="text-xs text-emerald-100/80 truncate">{subtitle}</p>}
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5 overflow-y-auto">{children}</div>
    </div>
  </div>
);

export const adminInput =
  'admin-input w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900';
export const adminBtnPrimary =
  'admin-btn-primary inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60 cursor-pointer';
export const adminBtnSecondary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer';
