import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, PiggyBank, Wallet } from 'lucide-react';
import { ALL_EXAM_TERMS, TERM_KEY_MAP, useApp } from '../../context/AppContext';
import { playErrorBuzz, playKeyClick } from '../../utils/audio';
import { formatAmountInput, parseAmountInput, peso } from '../../utils/format';
import { Student } from '../../types';
import { btnPrimary, btnSecondary } from './KioskModal';

interface KioskPayBalanceSectionProps {
  student: Student;
}

/** Amount entry for a self-service cash payment; posts straight to the ledger and prints the receipt. */
export const KioskPayBalanceSection: React.FC<KioskPayBalanceSectionProps> = ({ student }) => {
  const { payBalance, payBalanceSplit } = useApp();
  const balance = student.ledger.outstandingBalance;
  const [amount, setAmount] = useState('');
  const [changeChoice, setChangeChoice] = useState<'rollover' | 'deposit'>('rollover');
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Clear the field once a payment posts (or any other ledger change) instead of leaving a stale amount typed in.
  useEffect(() => {
    setAmount('');
  }, [balance]);

  if (balance <= 0) return null;

  const parsed = parseAmountInput(amount);
  const isValid = Number.isFinite(parsed) && parsed > 0;
  // Beyond the full remaining balance there is no further due left to "roll into" — the whole
  // excess can only be a deposit, so force that choice instead of letting the student pick an
  // option that would fail (apply_to: 'dues' rejects amounts over the outstanding balance).
  const exceedsBalance = isValid && parsed > balance;

  // Payments always fill terms in order, so the next due is the first one not yet cleared —
  // not necessarily whichever term the admin currently has "active" for permits. How much is
  // still needed to be fully caught up through that term: anything the student pays beyond
  // this is "change" that would otherwise roll into a later term's due. See
  // KioskWithdrawCreditSection for withdrawing deposited credit.
  const nextDueIndex = ALL_EXAM_TERMS.findIndex((term) => !student.ledger.termBreakdown[TERM_KEY_MAP[term]].cleared);
  const nextDueTerm = ALL_EXAM_TERMS[nextDueIndex === -1 ? ALL_EXAM_TERMS.length - 1 : nextDueIndex];
  const neededForCurrentTerm = ALL_EXAM_TERMS.slice(0, nextDueIndex === -1 ? ALL_EXAM_TERMS.length : nextDueIndex + 1).reduce((sum, term) => {
    const due = student.ledger.termBreakdown[TERM_KEY_MAP[term]];
    return sum + Math.max(0, due.due - due.paid);
  }, 0);
  // Beyond the full balance there is nothing left to roll forward into, so that whole case pays
  // off every remaining term (the full balance) and only the true overpay becomes a deposit —
  // not just the next single term, otherwise the other terms would wrongly stay unpaid.
  const changeAmount = !isValid ? 0 : exceedsBalance ? Math.round((parsed - balance) * 100) / 100 : Math.max(0, parsed - neededForCurrentTerm);
  const hasChange = changeAmount > 0.01;
  const appliedToDue = !isValid ? 0 : exceedsBalance ? balance : Math.min(parsed, neededForCurrentTerm);
  // Beyond the full balance, "apply to next due" isn't a real option — force deposit for that portion.
  const effectiveChoice = exceedsBalance ? 'deposit' : changeChoice;

  const openConfirm = () => {
    if (!isValid || isPaying) return;
    playKeyClick();
    setError('');
    setShowConfirm(true);
  };

  const confirmPay = async () => {
    if (isPaying) return;
    playKeyClick();
    setIsPaying(true);
    const res =
      hasChange && effectiveChoice === 'deposit'
        ? await payBalanceSplit(appliedToDue, changeAmount)
        : await payBalance(parsed, 'dues');
    setIsPaying(false);
    setShowConfirm(false);
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
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(formatAmountInput(e.target.value))}
              className="w-full h-11 rounded-xl border border-slate-300 bg-white pl-9 pr-4 font-mono-code font-bold text-base text-slate-900 outline-none placeholder:text-slate-300 focus:border-snc-green focus:ring-2 focus:ring-snc-green/20"
            />
          </div>
        </div>
        <button
          type="button"
          disabled={!isValid || isPaying}
          onClick={openConfirm}
          className={`${btnPrimary} h-11 shrink-0 disabled:opacity-50 disabled:pointer-events-none`}
        >
          {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
          {isPaying ? 'Processing…' : 'Pay Now (Cash)'}
        </button>
      </div>
      {!isValid && amount !== '' && (
        <p className="mt-1 text-[11px] text-red-600">Enter an amount of at least ₱1.</p>
      )}
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}

      {hasChange && (
        <div className="mt-2.5 rounded-xl border border-sky-200 bg-sky-50 p-2.5">
          <p className="text-[11px] text-sky-900">
            {exceedsBalance ? (
              <>This fully settles your remaining balance, with <strong>{peso(changeAmount, true)}</strong> left over.</>
            ) : (
              <>You have <strong>{peso(changeAmount, true)}</strong> of change beyond your {nextDueTerm} due. What should we do with it?</>
            )}
          </p>
          {exceedsBalance ? (
            <p className="mt-1.5 text-[11px] text-sky-800">
              There's no further due to apply that to — it will automatically be <strong>deposited</strong> as account credit.
            </p>
          ) : (
            <div className="mt-1.5 flex rounded-full bg-white border border-sky-200 p-0.5 text-[11px] font-semibold w-fit">
              <button
                type="button"
                onClick={() => { playKeyClick(); setChangeChoice('rollover'); }}
                className={`rounded-full px-2.5 py-1 cursor-pointer ${changeChoice === 'rollover' ? 'bg-sky-700 text-white' : 'text-slate-500'}`}
              >
                Apply to next due
              </button>
              <button
                type="button"
                onClick={() => { playKeyClick(); setChangeChoice('deposit'); }}
                className={`rounded-full px-2.5 py-1 cursor-pointer ${changeChoice === 'deposit' ? 'bg-sky-700 text-white' : 'text-slate-500'}`}
              >
                <PiggyBank className="inline w-3 h-3 mr-1 -mt-0.5" /> Deposit the change instead
              </button>
            </div>
          )}
          {effectiveChoice === 'deposit' && (
            <p className="mt-1.5 text-[11px] text-sky-800">
              Prints two receipts: {peso(appliedToDue, true)} {exceedsBalance ? 'for your full remaining balance' : `for your ${nextDueTerm} due`}, then {peso(changeAmount, true)} as account credit (withdraw it anytime from the SOA).
            </p>
          )}
        </div>
      )}

      <p className="mt-1.5 text-[11px] text-slate-500">This posts to your account immediately and prints a receipt.</p>

      {showConfirm && (
        <div className="fixed inset-0 z-[65] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden text-slate-800">
            <div className="snc-modal-header px-5 py-3">
              <h3 className="text-sm font-bold text-white">Confirm Payment</h3>
              <p className="text-xs text-emerald-100/80">Are you sure you want to pay this amount?</p>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount to pay</span>
                <span className="font-mono-code font-bold text-slate-900">{peso(parsed, true)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Applied to {exceedsBalance ? 'full remaining balance' : `${nextDueTerm} due`}</span>
                <span className="font-mono-code font-semibold text-emerald-700">{peso(appliedToDue, true)}</span>
              </div>
              {hasChange && (
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Change — {effectiveChoice === 'deposit' ? 'deposit to account' : 'apply to next due'}
                  </span>
                  <span className="font-mono-code font-semibold text-sky-700">{peso(changeAmount, true)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                <span>Total</span>
                <span className="font-mono-code">{peso(parsed, true)}</span>
              </div>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => { playKeyClick(); setShowConfirm(false); }}
                disabled={isPaying}
                className={`${btnSecondary} px-5 py-2.5 text-[11px] disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPay}
                disabled={isPaying}
                className={`${btnPrimary} px-5 py-2.5 text-[11px] disabled:opacity-60`}
              >
                {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isPaying ? 'Processing…' : 'Yes, Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
