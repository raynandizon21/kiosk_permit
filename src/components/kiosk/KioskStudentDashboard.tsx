import React, { useState } from 'react';
import {
  ChevronRight,
  FileCheck2,
  FileSignature,
  FileText,
  LogOut
} from 'lucide-react';
import { useApp, TERM_KEY_MAP } from '../../context/AppContext';
import { playKeyClick } from '../../utils/audio';
import { peso } from '../../utils/format';
import { KioskSoaModal } from './KioskSoaModal';
import { KioskPermitModal } from './KioskPermitModal';
import { KioskPromissoryNoteModal } from './KioskPromissoryNoteModal';
import { StudentAvatar } from '../common/StudentAvatar';

type Modal = 'soa' | 'permit' | 'promissory' | null;

const CHIP = {
  ok: 'text-emerald-50 bg-emerald-950/75 border-emerald-500/45',
  warn: 'text-amber-50 bg-amber-950/70 border-amber-400/45',
  bad: 'text-red-50 bg-red-950/80 border-red-500/45',
  neutral: 'text-white/80 bg-white/10 border-white/20'
};

export const KioskStudentDashboard: React.FC = () => {
  const { activeStudent, logoutKiosk, currentExamTerm, studentNotes } = useApp();
  const [activeModal, setActiveModal] = useState<Modal>(null);
  if (!activeStudent) return null;

  const { fullName, lrn, program, yearLevel, section, ledger, permits } = activeStudent;
  const permitStatus = permits[TERM_KEY_MAP[currentExamTerm]]?.status ?? 'locked';
  const pendingNote = studentNotes.find((n) => n.status === 'pending');
  const approvedNote = studentNotes.find((n) => n.status === 'approved' && n.term === currentExamTerm);
  const hasBalance = ledger.outstandingBalance > 0;

  const open = (modal: Modal) => {
    playKeyClick();
    setActiveModal(modal);
  };

  const services = [
    {
      key: 'soa' as const,
      icon: FileText,
      title: 'Statement of Account',
      body: 'View your assessed fees, payments, and remaining balance.',
      chip: hasBalance
        ? { tone: CHIP.warn, label: `Balance ${peso(ledger.outstandingBalance)}` }
        : { tone: CHIP.ok, label: 'Fully paid' }
    },
    {
      key: 'permit' as const,
      icon: FileCheck2,
      title: 'Examination Permit',
      body: `View and print your ${currentExamTerm} examination permit.`,
      chip:
        permitStatus === 'cleared'
          ? { tone: CHIP.ok, label: 'Ready to print' }
          : permitStatus === 'promissory_cleared'
            ? { tone: CHIP.warn, label: 'Cleared via promissory note' }
            : { tone: CHIP.bad, label: 'Payment required' }
    },
    {
      key: 'promissory' as const,
      icon: FileSignature,
      title: 'Promissory Note',
      body: 'Ask Accounting to let you take the exam before full payment.',
      chip: pendingNote
        ? { tone: CHIP.warn, label: 'Pending review' }
        : approvedNote
          ? { tone: CHIP.ok, label: 'Approved' }
          : { tone: CHIP.neutral, label: `Apply for ${currentExamTerm}` }
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5">
      {/* Student card: identity, account snapshot, end session */}
      <div className="kiosk-id-card overflow-hidden rounded-3xl">
        <div className="kiosk-id-card__strip px-5 py-2.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white">Student Account</span>
        </div>
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <StudentAvatar name={fullName} className="kiosk-avatar-ring h-16 w-16 text-xl" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/75">Hello,</p>
              <h1 className="truncate text-2xl font-bold text-white">{activeStudent.firstName}!</h1>
              <p className="truncate text-xs text-white/70">
                <span className="font-medium text-emerald-300">{program}</span> · {yearLevel} ({section}) · <span className="font-mono-code">LRN {lrn}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-80">
            <div className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-white/55">Balance</div>
              <div className={`font-mono-code text-lg font-bold ${hasBalance ? 'text-amber-200' : 'text-snc-neon'}`}>{peso(ledger.outstandingBalance)}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-white/55">{currentExamTerm} permit</div>
              <div className={`text-sm font-bold ${permitStatus === 'locked' ? 'text-red-300' : permitStatus === 'cleared' ? 'text-snc-neon' : 'text-amber-200'}`}>
                {permitStatus === 'locked' ? 'On hold' : permitStatus === 'cleared' ? 'Cleared' : 'Cleared (PN)'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playKeyClick();
              logoutKiosk();
            }}
            className="kiosk-cta flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-[11px] uppercase text-white transition-colors hover:bg-white/20 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> End Session
          </button>
        </div>
      </div>

      <div className="text-center">
        <p className="kiosk-eyebrow">Student Services</p>
        <h2 className="kiosk-title kiosk-title--sm mt-1">What would you like to do?</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {services.map(({ key, icon: Icon, title, body, chip }) => (
          <button
            key={key}
            onClick={() => open(key)}
            className="kiosk-action-card group text-left rounded-3xl p-6 flex flex-col cursor-pointer"
          >
            <div className="kiosk-action-card__icon-wrap mb-4">
              <Icon className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold uppercase tracking-wide text-white">{title}</h3>
            <p className="text-sm text-white/65 leading-relaxed mt-2 flex-1">{body}</p>
            <div className="mt-5 flex items-center justify-between gap-2">
              <span className={`text-[11px] font-bold border px-2.5 py-1 rounded-full ${chip.tone}`}>{chip.label}</span>
              <ChevronRight className="w-5 h-5 text-snc-neon group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {activeModal === 'soa' && <KioskSoaModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'permit' && (
        <KioskPermitModal onClose={() => setActiveModal(null)} onOpenPromissory={() => setActiveModal('promissory')} />
      )}
      {activeModal === 'promissory' && (
        <KioskPromissoryNoteModal onClose={() => setActiveModal(null)} onOpenPermit={() => setActiveModal('permit')} />
      )}
    </div>
  );
};
