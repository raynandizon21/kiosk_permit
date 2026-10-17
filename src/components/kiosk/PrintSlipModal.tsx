import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { useApp, TERM_KEY_MAP } from '../../context/AppContext';
import { playKeyClick } from '../../utils/audio';
import { formatDate, formatDateTime, peso } from '../../utils/format';
import { SCHOOL_LOGO } from '../common/CollegeSeal';

const TITLES = {
  soa: 'Statement of Account',
  permit: 'Examination Permit',
  promissory_receipt: 'Promissory Note Receipt',
  payment_slip: 'Payment Receipt'
};

const Line: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
  <div className={`flex justify-between gap-3 ${strong ? 'font-bold text-slate-950' : ''}`}>
    <span className="text-slate-500">{label}</span>
    <span className="text-right">{value}</span>
  </div>
);

/** Printable slip — window.print() prints only .printable-area (see index.css). */
export const PrintSlipModal: React.FC = () => {
  const { printedSlip, dismissPrintSlip } = useApp();
  if (!printedSlip) return null;

  const { type, student, term, promissoryNote: note, timestamp, reference, amount, paymentDate, isReprint } = printedSlip;
  const permit = term ? student.permits[TERM_KEY_MAP[term]] : undefined;

  if (type === 'permit' && permit) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <div className="printable-area bg-white text-slate-900 rounded-2xl shadow-2xl p-5 sm:p-6 text-xs">
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="flex items-center justify-center gap-2">
                <img src={SCHOOL_LOGO} alt="" className="w-8 h-8 object-contain" />
                <div className="text-xs font-bold tracking-widest text-snc-green uppercase">
                  St. Nicolas College of Business and Technology
                </div>
              </div>
              <div className="mt-1 text-base font-bold text-slate-900 uppercase">
                {term} Examination Permit
                {isReprint && <span className="ml-1.5 text-[10px] font-bold text-amber-600">(REPRINT)</span>}
              </div>
              <div className="text-xs text-slate-500">
                No. <span className="font-mono-code font-bold text-slate-800">{permit.permitNumber}</span>
                {permit.status === 'promissory_cleared' && ' • Cleared via promissory note'}
                {permit.issuedAt && ` • Issued ${formatDateTime(permit.issuedAt)}`}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-200 text-xs">
              <div><span className="block text-[10px] uppercase text-slate-500">Student</span><span className="font-bold text-slate-900">{student.fullName}</span></div>
              <div><span className="block text-[10px] uppercase text-slate-500">LRN / ID</span><span className="font-mono-code">{student.lrn}</span><span className="block text-slate-500">{student.studentId}</span></div>
              <div><span className="block text-[10px] uppercase text-slate-500">Program</span>{student.program}</div>
              <div><span className="block text-[10px] uppercase text-slate-500">Year & Section</span>{student.yearLevel} • {student.section}</div>
            </div>

            <table className="w-full text-left text-xs mt-4">
              <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 pr-2">Code</th>
                  <th className="py-2 pr-2">Subject</th>
                  <th className="py-2 pr-2 text-center">Units</th>
                  <th className="py-2 pr-2">Instructor</th>
                  <th className="py-2 text-center">Proctor Sign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {student.subjects.map((sub) => (
                  <tr key={sub.code}>
                    <td className="py-2 pr-2 font-mono-code font-bold">{sub.code}</td>
                    <td className="py-2 pr-2">{sub.description}</td>
                    <td className="py-2 pr-2 text-center">{sub.units}</td>
                    <td className="py-2 pr-2 text-slate-600">{sub.instructor}</td>
                    <td className="py-2"><span className="block mx-auto w-20 border-b border-dashed border-slate-300 h-4" /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 flex justify-center text-center text-[10px] uppercase tracking-wider text-slate-500">
              <div className="w-64 border-t border-slate-300 pt-1">Business Office / Registrar</div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => { playKeyClick(); dismissPrintSlip(); }}
              className="kiosk-cta flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/30 px-4 py-3 text-xs uppercase text-white hover:bg-white/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Done
            </button>
            <button
              onClick={() => { playKeyClick(); window.print(); }}
              className="kiosk-cta flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-xs uppercase text-black hover:opacity-90 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm">
        <div className="printable-area relative bg-white text-slate-900 rounded-2xl shadow-2xl p-6 text-xs space-y-4 font-mono-code">
          {type === 'payment_slip' && reference && (
            <div className="absolute right-6 top-6 text-right">
              <span className="block text-[9px] uppercase tracking-wide text-slate-400">Invoice Number</span>
              <span className="block font-bold text-red-600">{reference}</span>
            </div>
          )}

          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <img src={SCHOOL_LOGO} alt="" className="w-12 h-12 mx-auto object-contain" />
            <div className="font-bold text-sm">ST. NICOLAS COLLEGE</div>
            <div className="text-[10px] text-slate-500">City of San Fernando, Pampanga</div>
            <div className="pt-1 font-bold uppercase">
              {TITLES[type]}
              {isReprint && <span className="ml-1.5 text-[10px] font-bold text-amber-600">(REPRINT)</span>}
            </div>
            <div className="text-[10px] text-slate-500">{timestamp}</div>
          </div>

          <div className="space-y-1 pb-3 border-b border-dashed border-slate-300">
            <Line label="Student" value={<strong>{student.fullName}</strong>} />
            <Line label="LRN" value={student.lrn} />
            <Line label="Program" value={student.program} />
            <Line label="Year/Sec" value={`${student.yearLevel} • ${student.section}`} />
            <Line label="Term" value={`${student.academicYear} ${student.semester}`} />
          </div>

          {type === 'soa' && (
            <div className="space-y-1">
              <Line label="Total assessed" value={peso(student.ledger.totalAssessed, true)} />
              <Line label="Total paid" value={peso(student.ledger.totalPaid, true)} />
              <Line label="BALANCE" value={peso(student.ledger.outstandingBalance, true)} strong />
            </div>
          )}

          {type === 'promissory_receipt' && note && (
            <div className="space-y-1">
              <Line label="Reference" value={<strong>{note.referenceNo}</strong>} />
              <Line label="Exam" value={note.term} />
              <Line label="Promised amount" value={peso(note.committedAmount, true)} />
              <Line label="Pay on" value={formatDate(note.committedPaymentDate)} />
              <Line label="Status" value="Pending Accounting review" />
            </div>
          )}

          {type === 'payment_slip' && (
            <div className="space-y-2">
              <Line label="Amount paid" value={peso(amount ?? 0, true)} strong />
              <Line label="Mode of payment" value="Cash" />
              {paymentDate && <Line label="Paid on" value={formatDate(paymentDate)} />}
              <Line label="Current balance" value={peso(student.ledger.outstandingBalance, true)} />
              <Line label="Status" value="PAID" />
            </div>
          )}

          <p className="pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500">
            {isReprint ? 'Reprinted copy of a self-service kiosk receipt.' : 'Self-service kiosk document. Present with your school ID.'}
          </p>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => { playKeyClick(); dismissPrintSlip(); }}
            className="kiosk-cta flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/30 px-4 py-3 text-xs uppercase text-white hover:bg-white/20 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> Done
          </button>
          <button
            onClick={() => { playKeyClick(); window.print(); }}
            className="kiosk-cta flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-xs uppercase text-black hover:opacity-90 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>
    </div>
  );
};
