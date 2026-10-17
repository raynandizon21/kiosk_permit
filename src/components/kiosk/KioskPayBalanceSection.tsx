import React, { useEffect, useState } from 'react';
import { Loader2, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playErrorBuzz, playKeyClick } from '../../utils/audio';
import { peso } from '../../utils/format';
import { Student } from '../../types';
import { btnPrimary } from './KioskModal';

interface KioskPayBalanceSectionProps {
  student: Student;
}

/** Amount entry for a self-service cash payment; posts straight to the ledger and prints the receipt. */
export const KioskPayBalanceSection: React.FC<KioskPayBalanceSectionProps> = ({ student }) => {
  const { payBalance } = useApp();
  const balance = student.ledger.outstandingBalance;
  const [amount, setAmount] = useState(String(balance));
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');

  // Re-sync to the new balance once a payment posts (or any other ledger change), instead of leaving a stale amount typed in.
  useEffect(() => {
    setAmount(String(balance));
  }, [balance]);

  if (balance <= 0) return null;

  const parsed = Number(amount);
  const isValid = Number.isFinite(parsed) && parsed > 0 && parsed <= balance;

  const handlePay = async () => {
    if (!isValid || isPaying) return;
    playKeyClick();
    setIsPaying(true);
    setError('');
    const res = await payBalance(parsed);
    setIsPaying(false);
    if (res.message) {
      setError(res.message);
      playErrorBuzz();
    }
  };

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 sm:p-3.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Pay Balance (Cash)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] sm:items-end gap-2.5">
        <div>
          <label htmlFor="pay-amount" className="block text-xs text-slate-500 mb-1">Amount to pay</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono-code font-bold text-slate-400">₱</span>
            <input
              id="pay-amount"
              type="number"
              inputMode="decimal"
              min={1}
              max={balance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-300 pl-9 pr-4 font-mono-code font-bold text-base text-slate-900 outline-none focus:border-snc-green focus:ring-2 focus:ring-snc-green/20"
            />
          </div>
        </div>
        <button
          type="button"
          disabled={!isValid || isPaying}
          onClick={handlePay}
          className={`${btnPrimary} h-11 shrink-0 disabled:opacity-50 disabled:pointer-events-none`}
        >
          {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
          {isPaying ? 'Processing…' : 'Pay Now (Cash)'}
        </button>
      </div>
      {!isValid && (
        <p className="mt-1 text-[11px] text-red-600">Enter an amount from ₱1 up to your balance ({peso(balance, true)}).</p>
      )}
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
      <p className="mt-1.5 text-[11px] text-slate-500">This posts to your account immediately and prints a receipt.</p>
    </section>
  );
};
