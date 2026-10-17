import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Delete, Hand, Keyboard, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playKeyClick, playErrorBuzz } from '../../utils/audio';
import { CollegeSeal } from '../common/CollegeSeal';
import { KioskSteps } from './KioskSlideshow';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
/** Go back to the welcome button if nobody types for this long. */
const IDLE_RESET_MS = 60_000;

/** Welcome screen → "Click here to proceed" → Student Number / LRN entry. */
export const KioskLrnInput: React.FC = () => {
  const { loginKiosk } = useApp();
  const [step, setStep] = useState<'welcome' | 'entry'>('welcome');
  const [value, setValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showKeypad, setShowKeypad] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const backToWelcome = () => {
    setStep('welcome');
    setValue('');
    setErrorMessage('');
    setShowKeypad(true);
  };

  useEffect(() => {
    if (step !== 'entry') return;
    inputRef.current?.focus();
    const timer = window.setTimeout(backToWelcome, IDLE_RESET_MS);
    return () => window.clearTimeout(timer);
  }, [step, value]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (isVerifying) return;
    if (!trimmed) {
      setErrorMessage('Please enter your Student Number or LRN.');
      return;
    }
    setIsVerifying(true);
    setErrorMessage('');
    const res = await loginKiosk(trimmed);
    setIsVerifying(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Student not found.');
      setValue('');
      playErrorBuzz();
      inputRef.current?.focus();
    }
  };

  const press = (next: string) => {
    playKeyClick();
    setErrorMessage('');
    setValue(next.slice(0, 20));
  };

  if (step === 'welcome') {
    return (
      <div className="grid w-full flex-1 select-none items-center gap-12 py-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: welcome + call to action */}
        <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="kiosk-eyebrow mb-3">Welcome to</p>
          <h1 className="kiosk-hero-title" style={{ fontSize: 'clamp(1.55rem, 5.6vw, 3.6rem)' }}>St. Nicolas College</h1>
          <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
            Your self-service kiosk for <span className="font-semibold text-white">examination permits</span>,{' '}
            <span className="font-semibold text-white">promissory notes</span>, and your{' '}
            <span className="font-semibold text-white">statement of account</span>.
          </p>

          <button
            type="button"
            onClick={() => {
              playKeyClick();
              setStep('entry');
            }}
            className="kiosk-cta kiosk-cta-ring mt-10 inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-full bg-white px-9 py-5 uppercase text-black shadow-[0_10px_40px_rgba(57,255,20,0.25)] transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Hand className="h-5 w-5" /> Click here to proceed <ArrowRight className="h-5 w-5" />
          </button>

          <p className="mt-8 text-xs text-white/45 lg:hidden">Need help? Visit the Accounting Office, Window 1–3.</p>
        </section>

        {/* Right: how-to guide */}
        <KioskSteps />
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-6 px-2 sm:px-4 select-none text-center ${showKeypad ? "" : "mb-[18vh]"}`}>
      {/* Compact header so the keypad fits on screen */}
      <div className="mb-5 flex flex-col items-center gap-2">
        <CollegeSeal size="xl" />
        <h1 className="kiosk-hero-title !text-2xl md:!text-3xl">St. Nicolas College</h1>
      </div>

      <p className="kiosk-instruction text-white mb-4">Enter or scan your Student Number / LRN</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="kiosk-guide-glass w-full rounded-2xl p-4 sm:p-6 space-y-4 text-left"
      >
        <div className="relative flex items-center">
          <label htmlFor="student-input" className="sr-only">Student Number or LRN</label>
          <input
            id="student-input"
            ref={inputRef}
            type="text"
            autoComplete="off"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setErrorMessage('');
            }}
            placeholder="Student Number or LRN"
            className="kiosk-input w-full h-16 rounded-2xl pl-5 pr-36 font-mono-code text-lg sm:text-xl font-bold tracking-wider"
          />
          <button
            type="submit"
            disabled={isVerifying}
            className="kiosk-cta absolute right-2 h-12 px-6 rounded-full bg-snc-green hover:bg-snc-green-mid text-white uppercase flex items-center gap-1.5 shadow-lg transition-colors active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enter <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        {errorMessage && (
          <div className="text-red-600 text-sm flex items-center gap-2 bg-red-50 border border-red-200 py-2.5 px-4 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => {
              playKeyClick();
              backToWelcome();
            }}
            className="flex items-center gap-1.5 py-1 font-medium hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            type="button"
            onClick={() => {
              playKeyClick();
              setShowKeypad((prev) => !prev);
            }}
            className="flex items-center gap-1.5 py-1 font-medium hover:text-slate-900 cursor-pointer"
          >
            <Keyboard className="w-4 h-4 text-snc-green-mid" />
            {showKeypad ? 'Hide keypad' : 'Use touch keypad'}
          </button>
        </div>

        {showKeypad && (
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            {KEYS.map((digit) => (
              <button key={digit} type="button" onClick={() => press(value + digit)} className="kiosk-key h-16 rounded-xl font-mono-code font-bold text-2xl cursor-pointer">
                {digit}
              </button>
            ))}
            <button type="button" onClick={() => press(value.slice(0, -1))} aria-label="Backspace" className="kiosk-key h-16 rounded-xl flex items-center justify-center cursor-pointer">
              <Delete className="w-6 h-6" />
            </button>
            <button type="button" onClick={() => press(value + '0')} className="kiosk-key h-16 rounded-xl font-mono-code font-bold text-2xl cursor-pointer">
              0
            </button>
            <button type="button" onClick={() => press('')} className="kiosk-key h-16 rounded-xl text-sm font-bold uppercase tracking-wider cursor-pointer">
              Clear
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
