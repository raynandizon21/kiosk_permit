import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SCHOOL_LOGO } from '../common/CollegeSeal';
import SystemStatusBadge from '../common/SystemStatusBadge';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** Kiosk header: school mark, live clock, active exam period, server status. */
export const KioskTopBar: React.FC = () => {
  const { period } = useApp();
  const now = useNow();

  return (
    <header className="kiosk-topbar relative z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <img src={SCHOOL_LOGO} alt="" className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11" />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-xs font-bold uppercase tracking-[0.18em] text-white sm:text-sm">St. Nicolas College</div>
          <div className="truncate text-[10px] uppercase tracking-[0.2em] text-emerald-200/70 sm:text-[11px]">Self-Service Kiosk</div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {period && (
          <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/85 md:flex">
            <CalendarDays className="h-3.5 w-3.5 text-snc-neon" />
            <span className="font-bold uppercase tracking-wider text-white">{period.activeTerm} Exams</span>
            <span className="text-white/40">•</span>
            <span>{period.academicYear} {period.semester}</span>
          </div>
        )}
        <div className="whitespace-nowrap text-right leading-tight">
          <div className="font-mono-code text-base font-bold tabular-nums text-white sm:text-xl">
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/60 sm:text-[11px]">
            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="hidden sm:block">
          <SystemStatusBadge />
        </div>
      </div>
    </header>
  );
};
