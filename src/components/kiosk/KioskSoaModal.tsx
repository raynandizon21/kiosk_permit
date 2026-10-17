import React from 'react';
import { FileText, Printer } from 'lucide-react';
import { useApp, ALL_EXAM_TERMS, TERM_KEY_MAP } from '../../context/AppContext';
import { playKeyClick } from '../../utils/audio';
import { formatDate, peso } from '../../utils/format';
import { KioskModal, btnPrimary, btnSecondary } from './KioskModal';
import { KioskPayBalanceSection } from './KioskPayBalanceSection';

interface KioskSoaModalProps {
  onClose: () => void;
}

const Row: React.FC<{ label: string; amount: number; tone?: string; negative?: boolean }> = ({ label, amount, tone = 'text-slate-700', negative }) => (
  <div className={`flex justify-between py-1 border-b border-slate-100 ${tone}`}>
    <span>{label}</span>
    <span className="font-mono-code font-semibold">{negative ? '−' : ''}{peso(amount, true)}</span>
  </div>
);

export const KioskSoaModal: React.FC<KioskSoaModalProps> = ({ onClose }) => {
  const { activeStudent, triggerPrint } = useApp();
  if (!activeStudent) return null;

  const { ledger, academicYear, semester } = activeStudent;
  const isPaid = ledger.outstandingBalance === 0;

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
      </div>

      {!isPaid && <KioskPayBalanceSection student={activeStudent} />}

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Payments</h3>
        {ledger.payments.length === 0 ? (
          <p className="text-xs text-slate-500">No payments recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {ledger.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 py-1.5">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase text-slate-400">O.R. </span>
                  <span className="font-mono-code font-bold text-slate-900">{p.orNumber}</span>
                  <span className="text-slate-500"> · {formatDate(p.date)} · {p.paymentMethod}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono-code font-bold text-snc-green">{peso(p.amount, true)}</span>
                  <button
                    type="button"
                    onClick={() => { playKeyClick(); triggerPrint('payment_slip', activeStudent, undefined, undefined, p, true); }}
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
        )}
      </section>
    </KioskModal>
  );
};
