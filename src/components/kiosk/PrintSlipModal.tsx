import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { useApp, TERM_KEY_MAP } from '../../context/AppContext';
import { playKeyClick } from '../../utils/audio';
import { formatDate, peso } from '../../utils/format';
import { SCHOOL_LOGO } from '../common/CollegeSeal';

const TITLES = {
  soa: 'Statement of Account',
  permit: 'Examination Permit',
  promissory_receipt: 'Promissory Note Receipt'
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

  const { type, student, term, promissoryNote: note, timestamp } = printedSlip;
  const permit = term ? student.permits[TERM_KEY_MAP[term]] : undefined;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm">
        <div className="printable-area bg-white text-slate-900 rounded-2xl shadow-2xl p-6 text-xs space-y-4 font-mono-code">
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <img src={SCHOOL_LOGO} alt="" className="w-12 h-12 mx-auto object-contain" />
            <div className="font-bold text-sm">ST. NICOLAS COLLEGE</div>
            <div className="text-[10px] text-slate-500">City of San Fernando, Pampanga</div>
            <div className="pt-1 font-bold uppercase">
              {type === 'permit' ? `${term} ${TITLES.permit}` : TITLES[type]}
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

          {type === 'permit' && permit && (
            <div className="space-y-2">
              <div className="rounded border border-slate-300 p-2 text-center">
                <span className="block text-[10px] text-slate-500">PERMIT NO.</span>
                <span className="block font-bold tracking-widest">{permit.permitNumber}</span>
              </div>
              {student.subjects.map((sub) => (
                <Line key={sub.code} label={sub.code} value={`${sub.units}u  ________`} />
              ))}
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

          <p className="pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500">
            Self-service kiosk document. Present with your school ID.
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
