import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { FileCheck2, FileSignature, FileText, Hand, Info, LayoutGrid, Printer, ScanLine } from 'lucide-react';
import { SCHOOL_LOGO } from '../common/CollegeSeal';
import { GUIDE_DEMOS } from './KioskGuideDemos';

export interface KioskSlide {
  icon: LucideIcon;
  title: string;
  text: string;
  /** Aurora glow for this slide's backdrop. */
  aurora: string;
}

/** Kiosk services; each also tints the backdrop aurora in turn. */
export const KIOSK_SLIDES: KioskSlide[] = [
  {
    icon: FileText,
    title: 'Statement of Account',
    text: 'Check your fees, payments, and remaining balance.',
    aurora:
      'radial-gradient(40% 45% at 72% 40%, rgba(57,255,20,0.22), transparent 70%), radial-gradient(35% 40% at 20% 75%, rgba(0,120,40,0.35), transparent 70%)'
  },
  {
    icon: FileCheck2,
    title: 'Examination Permit',
    text: 'View and print your exam permit once cleared.',
    aurora:
      'radial-gradient(45% 45% at 78% 60%, rgba(16,185,129,0.28), transparent 70%), radial-gradient(35% 40% at 15% 25%, rgba(57,255,20,0.14), transparent 70%)'
  },
  {
    icon: FileSignature,
    title: 'Promissory Note',
    text: 'Request to take the exam before full payment.',
    aurora:
      'radial-gradient(42% 45% at 70% 30%, rgba(234,179,8,0.16), transparent 70%), radial-gradient(40% 45% at 25% 70%, rgba(0,110,40,0.35), transparent 70%)'
  }
];

export const SLIDE_MS = 7000;

/** Advances through the slides while `running` is true. */
export function useSlideIndex(running: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % KIOSK_SLIDES.length), SLIDE_MS);
    return () => window.clearInterval(id);
  }, [running]);
  return index;
}

/** Full-screen branded backdrop: shifting aurora glow, dot grid, faint school seal. */
export const KioskSlideshow: React.FC<{ index: number }> = ({ index }) => (
  <div className="kiosk-backdrop absolute inset-0 overflow-hidden" aria-hidden>
    {KIOSK_SLIDES.map((slide, i) => (
      <div
        key={slide.title}
        className={`kiosk-aurora ${i === index ? 'kiosk-aurora--active' : ''}`}
        style={{ background: slide.aurora }}
      />
    ))}
    <div className="kiosk-dotgrid" />
    <img src={SCHOOL_LOGO} alt="" className="kiosk-seal-watermark" />
  </div>
);

const STEPS: { icon: LucideIcon; title: string; text: string; detail: string }[] = [
  {
    icon: Hand,
    title: 'Tap Proceed',
    text: 'Start a new session',
    detail: 'Press the white “Click here to proceed” button on the left to begin.'
  },
  {
    icon: ScanLine,
    title: 'Enter your Student No. / LRN',
    text: 'Type it or scan your ID',
    detail: 'Type your student number or LRN, or scan / tap your school ID card.'
  },
  {
    icon: LayoutGrid,
    title: 'Choose a service',
    text: 'SOA, exam permit, or promissory note',
    detail: 'View your Statement of Account, print your exam permit, or request a promissory note.'
  },
  {
    icon: Printer,
    title: 'Print your slip',
    text: 'Present it with your school ID',
    detail: 'Get your printed slip and present it with your school ID when needed.'
  }
];

/** Slide 0 is the summary list; slides 1–4 feature one step each. */
const GUIDE_SLIDES = STEPS.length + 1;
const SUMMARY_MS = 3000;
const STEP_MS = 2800;

/** Right side: "how it works" card — green title band, then an auto-sliding summary → step-by-step carousel. */
export const KioskSteps: React.FC = () => {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setSlide((s) => (s + 1) % GUIDE_SLIDES), slide === 0 ? SUMMARY_MS : STEP_MS);
    return () => window.clearTimeout(id);
  }, [slide]);

  return (
    <aside
      className="kiosk-guide-glass hidden w-full max-w-md justify-self-end overflow-hidden rounded-[1.75rem] lg:block"
    >
      {/* Green title band */}
      <div className="snc-modal-header flex items-center gap-4 px-7 py-4">
        <img src={SCHOOL_LOGO} alt="" className="h-16 w-16 shrink-0 object-contain drop-shadow-lg" />
        <div className="leading-tight">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-snc-neon">Quick guide</p>
          <h2 className="text-xl font-bold text-white">How to use the kiosk</h2>
        </div>
      </div>

      {/* Sliding track */}
      <div className="overflow-hidden">
        <div className="kiosk-guide-track flex" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {/* Summary */}
          <div className="w-full shrink-0 px-7 pt-2" aria-hidden={slide !== 0}>
            <ol className="divide-y divide-slate-200/80">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="flex items-center gap-4 py-4">
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-snc-green-mid to-snc-green text-white shadow-[0_8px_18px_rgba(0,77,0,0.3)]">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-snc-neon text-[11px] font-bold text-snc-green-dark ring-2 ring-white">
                      {i + 1}
                    </span>
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-slate-900">{title}</span>
                    <span className="mt-0.5 block text-sm text-slate-500">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* One slide per step, each with a short animated demo */}
          {STEPS.map(({ title, detail }, i) => {
            const active = slide === i + 1;
            const Demo = GUIDE_DEMOS[i];
            return (
              <div
                key={title}
                className={`kiosk-guide-step-slide flex w-full shrink-0 flex-col items-center justify-center px-7 py-3 text-center ${active ? 'kiosk-guide-step-slide--active' : ''}`}
                aria-hidden={!active}
              >
                <div className="h-36 w-full">{active && <Demo />}</div>
                <p className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-snc-green-mid">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-snc-neon text-[11px] tracking-normal text-snc-green-dark">{i + 1}</span>
                  Step {i + 1} of {STEPS.length}
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{title}</h3>
                <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500">{detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots: summary + each step */}
      <div className="flex items-center justify-center gap-2 px-7 pt-3">
        {Array.from({ length: GUIDE_SLIDES }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSlide(i)}
            aria-label={i === 0 ? 'Show summary' : `Show step ${i}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${slide === i ? 'w-6 bg-snc-green-mid' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
          />
        ))}
      </div>

      <p className="mx-7 mb-6 mt-4 flex items-center gap-2 border-t border-slate-200/80 pt-4 text-xs text-slate-500">
        <Info className="h-4 w-4 shrink-0 text-snc-green-mid" /> Need help? Visit the Accounting Office, Window 1–3.
      </p>
    </aside>
  );
};
