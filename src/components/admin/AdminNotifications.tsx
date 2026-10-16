import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Bell, FileSignature, LogIn, Printer, X } from 'lucide-react';
import { useApp, LiveNotification } from '../../context/AppContext';

const KIOSK_UI: Record<string, { label: string; icon: LucideIcon; tone: string }> = {
  kiosk_login: { label: 'Signed in at the kiosk', icon: LogIn, tone: 'bg-sky-50 text-sky-600' },
  promissory_submit: { label: 'New promissory note', icon: FileSignature, tone: 'bg-amber-50 text-amber-600' },
  soa_print: { label: 'Printed SOA', icon: Printer, tone: 'bg-slate-100 text-slate-600' },
  permit_print: { label: 'Printed exam permit', icon: Printer, tone: 'bg-slate-100 text-slate-600' },
  promissory_print: { label: 'Printed PN receipt', icon: Printer, tone: 'bg-slate-100 text-slate-600' }
};
const FALLBACK = { label: 'Kiosk activity', icon: Bell, tone: 'bg-slate-100 text-slate-600' };

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const Item: React.FC<{ n: LiveNotification }> = ({ n }) => {
  const ui = KIOSK_UI[n.action] ?? FALLBACK;
  return (
    <div className="flex items-start gap-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ui.tone}`}>
        <ui.icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-900">
          <span className="font-semibold">{n.studentName ?? 'A student'}</span> · {ui.label}
        </p>
        <p className="truncate text-xs text-slate-500">{n.description}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.timestamp)}</p>
      </div>
    </div>
  );
};

/** Bell with unread count and a dropdown of kiosk activity received in real time. */
export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAllRead } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllRead();
        }}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} new)` : ''}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="font-semibold text-slate-900">Notifications</span>
            <span className="text-xs text-slate-400">Live from the kiosk</span>
          </div>
          <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">No kiosk activity yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="px-4 py-3">
                  <Item n={n} />
                </div>
              ))
            )}
          </div>
          <Link
            to="/admin/logs"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-snc-green-mid hover:bg-slate-50"
          >
            View all activity
          </Link>
        </div>
      )}
    </div>
  );
};

/** Pop-up cards (bottom-right) for new kiosk activity. */
export const LiveToasts: React.FC = () => {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-96 flex-col gap-3" aria-live="polite">
      {toasts.map((n) => (
        <div key={n.id} className="admin-toast pointer-events-auto relative rounded-2xl bg-white p-4 pr-10 shadow-2xl ring-1 ring-slate-200">
          <Item n={n} />
          <button
            type="button"
            onClick={() => dismissToast(n.id)}
            aria-label="Dismiss"
            className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
