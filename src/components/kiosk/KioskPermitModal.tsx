import React, { useState } from 'react';
import { CheckCircle2, FileCheck2, FileSignature, Lock, Printer } from 'lucide-react';
import { useApp, TERM_KEY_MAP, ALL_EXAM_TERMS } from '../../context/AppContext';
import { ExamTerm } from '../../types';
import { playKeyClick } from '../../utils/audio';
import { formatDateTime, peso } from '../../utils/format';
import { KioskModal, btnPrimary, btnSecondary } from './KioskModal';
import { KioskPayBalanceSection } from './KioskPayBalanceSection';

interface KioskPermitModalProps {
  onClose: () => void;
  onOpenPromissory: () => void;
}

export const KioskPermitModal: React.FC<KioskPermitModalProps> = ({ onClose, onOpenPromissory }) => {
  const { activeStudent, currentExamTerm, triggerPrint } = useApp();
  const [selectedTerm, setSelectedTerm] = useState<ExamTerm>(currentExamTerm);

  if (!activeStudent) return null;

  const { permits, subjects, fullName, lrn, studentId, program, yearLevel, section, academicYear, semester, ledger } = activeStudent;
  const permit = permits[TERM_KEY_MAP[selectedTerm]];
  const isLocked = permit.status === 'locked';

  return (
    <KioskModal
      icon={FileCheck2}
      title="Examination Permit"
      subtitle={`${academicYear} • ${semester}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={() => { playKeyClick(); onClose(); }} className={btnSecondary}>
            Back
          </button>
          {!isLocked && (
            <button
              onClick={() => { playKeyClick(); triggerPrint('permit', activeStudent, selectedTerm); }}
              className={btnPrimary}
            >
              <Printer className="w-4 h-4" /> Print Permit
            </button>
          )}
        </>
      }
    >
      {/* Term tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {ALL_EXAM_TERMS.map((term) => {
          const status = permits[TERM_KEY_MAP[term]].status;
          const active = selectedTerm === term;
          return (
            <button
              key={term}
              onClick={() => { playKeyClick(); setSelectedTerm(term); }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                active ? 'bg-snc-green text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {term}
              {status === 'locked' ? (
                <Lock className="w-3.5 h-3.5 opacity-70" />
              ) : (
                <CheckCircle2 className={`w-3.5 h-3.5 ${active ? 'text-snc-neon' : 'text-emerald-600'}`} />
              )}
            </button>
          );
        })}
      </div>

      {isLocked ? (
        <>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <Lock className="w-10 h-10 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">{selectedTerm} permit is on hold</h3>
            <p className="text-sm text-red-700 mt-1">
              Remaining balance: <strong className="font-mono-code">{peso(ledger.outstandingBalance, true)}</strong>
            </p>
            <p className="text-xs text-slate-600 mt-1">Pay below, or apply for a promissory note.</p>
          </div>

          <KioskPayBalanceSection student={activeStudent} />

          <div className="text-center">
            <button
              onClick={() => { playKeyClick(); onOpenPromissory(); }}
              className={btnPrimary}
            >
              <FileSignature className="w-4 h-4" /> Apply for Promissory Note Instead
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border-2 border-slate-200 p-5 sm:p-6">
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="text-xs font-bold tracking-widest text-snc-green uppercase">
              St. Nicolas College of Business and Technology
            </div>
            <div className="mt-1 text-base font-bold text-slate-900 uppercase">
              {selectedTerm} Examination Permit
            </div>
            <div className="text-xs text-slate-500">
              No. <span className="font-mono-code font-bold text-red-600">{permit.permitNumber}</span>
              {permit.status === 'promissory_cleared' && ' • Cleared via promissory note'}
              {permit.issuedAt && ` • Issued ${formatDateTime(permit.issuedAt)}`}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-200 text-xs">
            <div><span className="block text-[10px] uppercase text-slate-500">Student</span><span className="font-bold text-slate-900">{fullName}</span></div>
            <div><span className="block text-[10px] uppercase text-slate-500">LRN / ID</span><span className="font-mono-code">{lrn}</span><span className="block text-slate-500">{studentId}</span></div>
            <div><span className="block text-[10px] uppercase text-slate-500">Program</span>{program}</div>
            <div><span className="block text-[10px] uppercase text-slate-500">Year & Section</span>{yearLevel} • {section}</div>
          </div>

          <table className="w-full text-left text-xs mt-4">
            <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 pr-2">Code</th>
                <th className="py-2 pr-2">Subject</th>
                <th className="py-2 text-center">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => (
                <tr key={sub.code}>
                  <td className="py-2 pr-2 font-mono-code font-bold">{sub.code}</td>
                  <td className="py-2 pr-2">{sub.description}</td>
                  <td className="py-2 text-center">{sub.units}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 flex justify-center text-center text-[10px] uppercase tracking-wider text-slate-500">
            <div className="w-64 border-t border-slate-300 pt-1">Business Office / Registrar</div>
          </div>
        </div>
      )}
    </KioskModal>
  );
};
