import React, { useEffect, useState } from 'react';
import { Banknote, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playErrorBuzz, playKeyClick } from '../../utils/audio';
import { formatAmountInput, parseAmountInput, peso } from '../../utils/format';
import { Student } from '../../types';
import { btnPrimary } from './KioskModal';

interface KioskWithdrawCreditSectionProps {
  student: Student;
}

/** Lets a student with deposited credit ask to cash it out; prints a receipt to present to the Cashier. */
export const KioskWithdrawCreditSection: React.FC<KioskWithdrawCreditSectionProps> = ({ student }) => {
  const { studentWithdrawals, requestWithdrawal } = useApp();
  const credit = student.ledger.availableCredit;
  const [amount, setAmount] = useState(formatAmountInput(String(credit)));
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAmount(formatAmountInput(String(credit)));
  }, [credit]);

  const pending = studentWithdrawals.find((w) => w.status === 'pending');

  if (credit <= 0 && !pending) return null;

  const parsed = parseAmountInput(amount);
  const isValid = Number.isFinite(parsed) && parsed > 0 && parsed <= credit;

  const handleRequest = async () => {
    if (!isValid || isRequesting || pending) return;
    playKeyClick();
    setIsRequesting(true);
    setError('');
    const res = await requestWithdrawal(parsed);
    setIsRequesting(false);
    if (res.message) {
      setError(res.message);
      playErrorBuzz();
    }
  };

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3 sm:p-3.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
        Available Credit: {peso(credit, true)}
      </h3>

      {pending ? (
        <p className="text-xs text-sky-800">
          You have a pending withdrawal request (<span className="font-mono-code font-bold">{pending.referenceNo}</span>, {peso(pending.amount, true)}).
          Present your receipt to the Cashier, or wait for it to be processed before requesting another.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] sm:items-end gap-2.5">
            <div>
              <label htmlFor="withdraw-amount" className="block text-xs text-slate-500 mb-1">Amount to withdraw</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono-code font-bold text-slate-400">₱</span>
                <input
                  id="withdraw-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                  className="w-full h-11 rounded-xl border border-slate-300 bg-white pl-9 pr-4 font-mono-code font-bold text-base text-slate-900 outline-none placeholder:text-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={!isValid || isRequesting}
              onClick={handleRequest}
              className={`${btnPrimary} h-11 shrink-0 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 disabled:pointer-events-none`}
            >
              {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
              {isRequesting ? 'Requesting…' : 'Request Withdrawal'}
            </button>
          </div>
          {!isValid && (
            <p className="mt-1 text-[11px] text-red-600">Enter an amount from ₱1 up to your available credit ({peso(credit, true)}).</p>
          )}
          {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
          <p className="mt-1.5 text-[11px] text-slate-500">
            Prints a receipt — present it to the Cashier to claim your cash once Accounting releases it.
          </p>
        </>
      )}
    </section>
  );
};
