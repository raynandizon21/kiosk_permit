import React, { useState } from 'react';
import { FileText, Printer } from 'lucide-react';
import { useApp, ALL_EXAM_TERMS, TERM_KEY_MAP } from '../../context/AppContext';
import { playKeyClick } from '../../utils/audio';
import { formatDate, peso } from '../../utils/format';
import { KioskModal, btnPrimary, btnSecondary } from './KioskModal';
import { KioskPayBalanceSection } from './KioskPayBalanceSection';
import { KioskWithdrawCreditSection } from './KioskWithdrawCreditSection';

interface KioskSoaModalProps {
  onClose: () => void;
}

const Row: React.FC<{ label: string; amount: number; tone?: string; negative?: boolean }> = ({ label, amount, tone = 'text-slate-700', negative }) => (
  <div className={`flex justify-between py-1 border-b border-slate-100 ${tone}`}>
    <span>{label}</span>
    <span className="font-mono-code font-semibold">{negative ? '−' : ''}{peso(amount, true)}</span>
  </div>
);

const WITHDRAWAL_STATUS: Record<string, string> = {
  pending: 'text-amber-700 bg-amber-50',
  released: 'text-emerald-700 bg-emerald-50',
  declined: 'text-red-700 bg-red-50'
};

export const KioskSoaModal: React.FC<KioskSoaModalProps> = ({ onClose }) => {
  const { activeStudent, triggerPrint, studentWithdrawals } = useApp();
  const [activeTab, setActiveTab] = useState<'payments' | 'withdrawals'>('payments');
  if (!activeStudent) return null;

  const { ledger, academicYear, semester } = activeStudent;
  const isPaid = ledger.outstandingBalance === 0;
  const hasCredit = ledger.availableCredit > 0;

  return (
    <KioskModal
      icon={FileText}
      title="Statement of Account"
      subtitle={`${academicYear} • ${semester}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={() => { playKeyClick(); onClose(); }} className={btnSecondary}>
            Back
          </button>
          <button onClick={() => { playKeyClick(); triggerPrint('soa', activeStudent); }} className={btnPrimary}>
            <Printer className="w-4 h-4" /> Print SOA
          </button>
        </>
      }
    >
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 ${hasCredit ? 'lg:grid-cols-4' : ''}`}>
        <div className="rounded-xl border border-slate-200 p-3">
          <span className="text-xs text-slate-500">Total Assessed</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{peso(ledger.totalAssessed, true)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <span className="text-xs text-slate-500">Total Paid</span>
          <div className="text-xl font-bold text-snc-green mt-0.5">{peso(ledger.totalPaid, true)}</div>
        </div>
        <div className={`rounded-xl border p-3 ${isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <span className="text-xs text-slate-500">Remaining Balance</span>
          <div className={`text-xl font-bold mt-0.5 ${isPaid ? 'text-emerald-700' : 'text-amber-800'}`}>
            {peso(ledger.outstandingBalance, true)}
          </div>
        </div>
        {hasCredit && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
            <span className="text-xs text-slate-500">Available Credit</span>
            <div className="text-xl font-bold text-sky-700 mt-0.5">{peso(ledger.availableCredit, true)}</div>
          </div>
        )}
      </div>

      {!isPaid && <KioskPayBalanceSection student={activeStudent} />}
      <KioskWithdrawCreditSection student={activeStudent} />

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Assessment</h3>
        <div className="text-xs">
          <Row label="Tuition Fee" amount={ledger.tuitionFee} />
          <Row label="Laboratory Fee" amount={ledger.laboratoryFee} />
          <Row label="Miscellaneous Fee" amount={ledger.miscellaneousFee} />
          {ledger.otherFees.map((fee) => (
            <Row key={fee.name} label={fee.name} amount={fee.amount} />
          ))}
          {ledger.previousBalance > 0 && (
            <Row label="Previous Balance" amount={ledger.previousBalance} tone="text-amber-800" />
          )}
          {ledger.discounts.map((d) => (
            <Row key={d.name} label={`Discount: ${d.name}`} amount={d.amount} tone="text-emerald-700" negative />
          ))}
          <div className="flex justify-between pt-1.5 text-sm font-bold text-slate-900">
            <span>Total</span>
            <span className="font-mono-code">{peso(ledger.totalAssessed, true)}</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Exam Dues</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {ALL_EXAM_TERMS.map((term) => {
            const due = ledger.termBreakdown[TERM_KEY_MAP[term]];
            return (
              <div key={term} className="rounded-xl border border-slate-200 p-2.5">
                <div className="font-bold text-slate-900">{term}</div>
                <div className="text-slate-500 mt-0.5">Due {peso(due.due, true)}</div>
                <div className={`mt-0.5 font-semibold ${due.cleared ? 'text-emerald-700' : 'text-amber-800'}`}>
                  {due.cleared ? 'Paid' : `${peso(due.due - due.paid, true)} left`}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-1.5 flex gap-1 rounded-full bg-slate-100 p-1 w-fit">
          <button
            type="button"
            onClick={() => { playKeyClick(); setActiveTab('payments'); }}
            className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${activeTab === 'payments' ? 'bg-snc-green text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Payments
          </button>
          <button
            type="button"
            onClick={() => { playKeyClick(); setActiveTab('withdrawals'); }}
            className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${activeTab === 'withdrawals' ? 'bg-snc-green text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Withdrawal Requests
          </button>
        </div>

        {activeTab === 'payments' ? (
          ledger.payments.length === 0 ? (
            <p className="text-xs text-slate-500">No payments recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {ledger.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase text-slate-400">O.R. </span>
                    <span className="font-mono-code font-bold text-slate-900">{p.orNumber}</span>
                    <span className="text-slate-500"> · {formatDate(p.date)} · {p.paymentMethod}</span>
                    {p.isDeposit && (
                      <span className="ml-1.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">Deposit</span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`font-mono-code font-bold ${p.isDeposit ? 'text-sky-700' : 'text-snc-green'}`}>{peso(p.amount, true)}</span>
                    <button
                      type="button"
                      onClick={() => { playKeyClick(); triggerPrint(p.isDeposit ? 'deposit_slip' : 'payment_slip', activeStudent, undefined, undefined, p, true); }}
                      aria-label={`Reprint receipt ${p.orNumber}`}
                      title="Reprint receipt"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-snc-green hover:text-snc-green cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : studentWithdrawals.length === 0 ? (
          <p className="text-xs text-slate-500">No withdrawal requests yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {studentWithdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-2 py-1.5">
                <div className="min-w-0">
                  <span className="font-mono-code font-bold text-slate-900">{w.referenceNo}</span>
                  <span className="text-slate-500"> · {formatDate(w.requestedAt)}</span>
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${WITHDRAWAL_STATUS[w.status]}`}>
                    {w.status}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono-code font-bold text-sky-700">{peso(w.amount, true)}</span>
                  <button
                    type="button"
                    onClick={() => { playKeyClick(); triggerPrint('withdrawal_slip', activeStudent, undefined, undefined, undefined, true, w); }}
                    aria-label={`Reprint withdrawal receipt ${w.referenceNo}`}
                    title="Reprint receipt"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-sky-600 hover:text-sky-600 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </KioskModal>
  );
};
