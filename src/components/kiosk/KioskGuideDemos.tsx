import React, { useEffect, useState } from 'react';
import { ArrowRight, FileCheck2, FileSignature, FileText, Pointer } from 'lucide-react';

/**
 * Tiny animated demos for the Quick Guide carousel. Each one mounts only while its slide
 * is active, so the CSS animations (see .demo-* in index.css) restart every time.
 */

/** Dark mini "kiosk screen" frame the demos play inside. */
const Screen: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`demo-screen relative mx-auto flex h-36 w-64 items-center justify-center overflow-hidden rounded-2xl ${className}`}>
    {children}
  </div>
);

const Hand: React.FC<{ className: string }> = ({ className }) => (
  <Pointer className={`demo-hand absolute h-8 w-8 fill-white text-snc-green-dark drop-shadow-lg ${className}`} strokeWidth={1.5} aria-hidden />
);

export const DemoTapProceed: React.FC = () => (
  <Screen>
    <span className="demo-press relative inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-black shadow-[0_6px_20px_rgba(57,255,20,0.3)]">
      Click here to proceed <ArrowRight className="h-3 w-3" />
      <span className="demo-ripple absolute inset-0 rounded-full border-2 border-snc-neon" aria-hidden />
    </span>
    <Hand className="demo-hand--tap left-[58%] top-[52%]" />
  </Screen>
);

const SAMPLE_LRN = '109283746501';

export const DemoEnterLrn: React.FC = () => {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(SAMPLE_LRN.slice(0, i));
      if (i >= SAMPLE_LRN.length) window.clearInterval(id);
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  const done = typed.length === SAMPLE_LRN.length;

  return (
    <Screen className="flex-col gap-3 px-4">
      <div className="flex w-full items-center gap-2 rounded-xl border border-snc-neon/40 bg-black/40 px-3 py-2">
        <span className="flex-1 truncate font-mono-code text-sm font-bold tracking-wider text-emerald-50">
          {typed}
          <span className="demo-caret ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-snc-neon" />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${
            done ? 'bg-snc-neon text-snc-green-dark shadow-[0_0_14px_rgba(57,255,20,0.7)]' : 'bg-white text-black'
          }`}
        >
          Enter
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {['1', '2', '3', '4', '5'].map((k) => (
          <span
            key={k}
            className={`flex h-6 w-8 items-center justify-center rounded-md border border-white/15 bg-white/10 font-mono-code text-[10px] font-bold text-white ${
              typed.endsWith(k) && !done ? 'border-snc-neon/70 bg-snc-neon/30' : ''
            }`}
          >
            {k}
          </span>
        ))}
      </div>
    </Screen>
  );
};

const TILES = [
  { icon: FileText, label: 'SOA' },
  { icon: FileCheck2, label: 'Permit' },
  { icon: FileSignature, label: 'Note' }
];

export const DemoChooseService: React.FC = () => (
  <Screen className="gap-2 px-3">
    {TILES.map(({ icon: Icon, label }, i) => (
      <span
        key={label}
        className={`flex h-20 w-[4.6rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 text-white ${
          i === 1 ? 'demo-pick' : ''
        }`}
      >
        <Icon className="h-5 w-5 text-snc-neon" strokeWidth={1.7} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </span>
    ))}
    <Hand className="demo-hand--pick left-1/2 top-[58%]" />
  </Screen>
);

export const DemoPrintSlip: React.FC = () => (
  <div className="relative mx-auto flex h-36 w-64 flex-col items-center">
    {/* Printer */}
    <div className="relative z-10 flex h-14 w-40 items-end justify-center rounded-2xl bg-gradient-to-br from-snc-green-mid to-snc-green shadow-[0_10px_24px_rgba(0,77,0,0.35)]">
      <span className="absolute right-4 top-3 h-2 w-2 rounded-full bg-snc-neon shadow-[0_0_8px_rgba(57,255,20,0.9)] demo-blink" />
      <span className="mb-2 h-1.5 w-28 rounded-full bg-black/40" />
    </div>
    {/* Slip coming out of the slot */}
    <div className="relative -mt-2 h-24 w-28 overflow-hidden">
      <div className="demo-slip absolute inset-x-0 top-0 rounded-b-lg border border-slate-200 bg-white px-3 pb-3 pt-4 shadow-md">
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-slate-200" />
          <div className="h-1.5 w-4/5 rounded-full bg-slate-200" />
          <div className="h-1.5 w-3/5 rounded-full bg-slate-200" />
        </div>
        <span className="demo-stamp mt-2 inline-block rounded border-2 border-emerald-600 px-1.5 text-[9px] font-extrabold tracking-[0.15em] text-emerald-600">
          CLEARED
        </span>
      </div>
    </div>
  </div>
);

export const GUIDE_DEMOS = [DemoTapProceed, DemoEnterLrn, DemoChooseService, DemoPrintSlip];
