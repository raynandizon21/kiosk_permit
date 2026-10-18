import { FormEvent, useEffect, useRef, useState } from 'react';
import { Database, Link2, Monitor, Server, X } from 'lucide-react';
import { api, fetchHealth, isNativeApp, serverUrl, setServerUrl } from '../../lib/api';

type SystemStatus = 'checking' | 'online' | 'offline';

type ServerInfo = { hostname: string; port: number; database: boolean; addresses: string[] };

const POLL_MS = 10_000;

const STATUS_UI: Record<SystemStatus, { label: string; dotClass: string; badgeClass: string; lightClass: string }> = {
  checking: {
    label: 'Checking…',
    dotClass: 'bg-white/50 animate-pulse',
    badgeClass: 'border-white/20 bg-black/40 text-white/80',
    lightClass: 'border-slate-200 bg-slate-50 text-slate-500',
  },
  online: {
    label: 'System Online',
    dotClass: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]',
    badgeClass: 'border-emerald-500/45 bg-emerald-950/75 text-emerald-50',
    lightClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  offline: {
    label: 'System Offline',
    dotClass: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]',
    badgeClass: 'border-red-500/45 bg-red-950/80 text-red-50',
    lightClass: 'border-red-200 bg-red-50 text-red-600',
  },
};

/** "192.168.1.5", "192.168.1.5:3200" or a full URL → base URL like http://192.168.1.5:3200 */
function toServerUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw || /\s/.test(raw)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `http://${raw}`);
    if (!/^[a-z0-9.-]+$/i.test(url.hostname)) return null;
    if (!url.port && !/^https?:\/\//i.test(raw)) url.port = (!isNativeApp() && window.location.port) || '3200';
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Same badge as the library kiosk — polls /api/health (server + database).
 * Tap it to see which server PC this device is connected to, or to switch to another server IP.
 */
export default function SystemStatusBadge({ className = '', variant = 'dark' }: { className?: string; variant?: 'dark' | 'light' }) {
  const [status, setStatus] = useState<SystemStatus>('checking');
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const runCheck = async () => {
      const online = await fetchHealth();
      if (!cancelled) setStatus(online ? 'online' : 'offline');
    };
    runCheck();
    const interval = window.setInterval(runCheck, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setError('');
    api<ServerInfo>('/api/server-info')
      .then(setInfo)
      .catch(() => setInfo(null));
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const connect = (e: FormEvent) => {
    e.preventDefault();
    const base = toServerUrl(address);
    if (!base) {
      setError('Enter an IP address, e.g. 192.168.1.10');
      return;
    }
    if (isNativeApp()) {
      // APK: the UI is bundled, only the API server changes
      setServerUrl(base);
      window.location.reload();
      return;
    }
    window.location.href = `${base}${window.location.pathname}`;
  };

  const ui = STATUS_UI[status];

  return (
    <div ref={wrapRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="Server connection"
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur-md transition-opacity hover:opacity-90 cursor-pointer ${variant === 'light' ? ui.lightClass : ui.badgeClass}`}
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ui.dotClass}`} aria-hidden />
        <span className="whitespace-nowrap" role="status" aria-live="polite">{ui.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl bg-white text-left text-slate-800 shadow-2xl ring-1 ring-black/5">
          <div className="snc-modal-header flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              <Server className="h-4 w-4 text-snc-neon" /> Server connection
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-4 text-sm">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Connected to</div>
              <div className="mt-1 flex items-center gap-2 font-mono-code text-sm font-semibold text-slate-900">
                <Link2 className="h-4 w-4 shrink-0 text-snc-green-mid" />
                {serverUrl()}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${status === 'online' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  <Server className="h-3 w-3" /> Server {status === 'online' ? 'online' : 'offline'}
                </span>
                {info && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${info.database ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    <Database className="h-3 w-3" /> Database {info.database ? 'online' : 'offline'}
                  </span>
                )}
              </div>
            </div>

            {info && info.addresses.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Server PC on this network
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Monitor className="h-3.5 w-3.5" /> {info.hostname}
                </div>
                <ul className="mt-1.5 space-y-1">
                  {info.addresses.map((a) => (
                    <li key={a} className="rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono-code text-xs text-slate-800">
                      {a}
                      {window.location.pathname}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[11px] text-slate-400">Open this address on the tablet's browser.</p>
              </div>
            )}

            <form onSubmit={connect} className="border-t border-slate-100 pt-3">
              <label htmlFor="server-address" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Connect to another server
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="server-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setError('');
                  }}
                  placeholder="192.168.1.10"
                  inputMode="url"
                  autoComplete="off"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 font-mono-code text-sm focus:border-snc-green focus:outline-none focus:ring-2 focus:ring-snc-green/15"
                />
                <button type="submit" className="admin-btn-primary rounded-lg px-3 text-sm font-semibold cursor-pointer">
                  Connect
                </button>
              </div>
              {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
