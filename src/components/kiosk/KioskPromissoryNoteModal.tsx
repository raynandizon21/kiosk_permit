import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Eraser, FileSignature, Loader2, Printer, XCircle } from 'lucide-react';
import { useApp, ALL_EXAM_TERMS, TERM_KEY_MAP } from '../../context/AppContext';
import { ExamTerm, PromissoryNote, ReasonCategory } from '../../types';
import { playKeyClick, playSuccessChime, playErrorBuzz } from '../../utils/audio';
import { formatDate, formatDateTime, peso } from '../../utils/format';
import { KioskModal, btnPrimary, btnSecondary } from './KioskModal';

interface KioskPromissoryNoteModalProps {
  onClose: () => void;
  onOpenPermit?: () => void;
}

const REASONS: { value: ReasonCategory; label: string }[] = [
  { value: 'Delayed Remittance', label: 'Delayed remittance (OFW / provincial)' },
  { value: 'Salary/Payday Timing', label: 'Salary / payday timing' },
  { value: 'Family Emergency', label: 'Family emergency' },
  { value: 'Pending Scholarship', label: 'Pending scholarship / voucher' },
  { value: 'Medical Expense', label: 'Medical expense' },
  { value: 'Other', label: 'Other' }
];

const field =
  'w-full h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:border-snc-green focus:ring-4 focus:ring-snc-green/10';

const STATUS_UI: Record<PromissoryNote['status'], { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'Pending review', className: 'text-amber-800 bg-amber-50 border-amber-200', icon: Clock },
  approved: { label: 'Approved', className: 'text-emerald-800 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  rejected: { label: 'Declined', className: 'text-red-700 bg-red-50 border-red-200', icon: XCircle }
};

function twoWeeksFromNow() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export const KioskPromissoryNoteModal: React.FC<KioskPromissoryNoteModalProps> = ({ onClose, onOpenPermit }) => {
  const { activeStudent, currentExamTerm, studentNotes, submitPromissoryNote, triggerPrint } = useApp();

  const lockedTerms = activeStudent
    ? ALL_EXAM_TERMS.filter((t) => activeStudent.permits[TERM_KEY_MAP[t]].status === 'locked')
    : [];
  const balance = activeStudent?.ledger.outstandingBalance ?? 0;
  const canApply = balance > 0 && lockedTerms.length > 0;

  const [tab, setTab] = useState<'apply' | 'status'>(canApply ? 'apply' : 'status');
  const [term, setTerm] = useState<ExamTerm>(lockedTerms.includes(currentExamTerm) ? currentExamTerm : lockedTerms[0] ?? currentExamTerm);
  const [amount, setAmount] = useState<number>(Math.max(100, Math.round(balance / 2)));
  const [date, setDate] = useState(twoWeeksFromNow);
  const [reason, setReason] = useState<ReasonCategory>('Delayed Remittance');
  const [details, setDetails] = useState('');
  const [guardian, setGuardian] = useState(activeStudent?.parentGuardian ?? '');
  const [guardianContact, setGuardianContact] = useState(activeStudent?.parentContact ?? '');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [tab]);

  if (!activeStudent) return null;

  /** Canvas is drawn at 600x140 but displayed responsive — scale pointer coordinates. */
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const clearSignature = () => {
    playKeyClick();
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const fail = (message: string) => {
    setError(message);
    playErrorBuzz();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (amount <= 0) return fail('Enter the amount you promise to pay.');
    if (!date) return fail('Choose the date you will pay.');
    if (!guardian.trim() || !guardianContact.trim()) return fail('Enter your parent/guardian name and contact number.');
    if (!hasSignature || !canvasRef.current) return fail('Please sign in the signature box.');
    if (!agreed) return fail('Please agree to the promissory terms.');

    setSubmitting(true);
    const result = await submitPromissoryNote({
      term,
      committedAmount: amount,
      committedDate: date,
      reasonCategory: reason,
      reasonDetails: details.trim(),
      guardianName: guardian.trim(),
      guardianContact: guardianContact.trim(),
      signature: canvasRef.current.toDataURL('image/png')
    });
    setSubmitting(false);

    if (result.note) {
      playSuccessChime();
      setSubmittedRef(result.note.referenceNo);
      setTab('status');
    } else {
      fail(result.message || 'Submission failed.');
    }
  };

  const tabBtn = (key: 'apply' | 'status', label: string) => (
    <button
      type="button"
      onClick={() => { playKeyClick(); setTab(key); }}
      className={`rounded-full px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
        tab === key ? 'bg-snc-green text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <KioskModal
      icon={FileSignature}
      title="Promissory Note"
      subtitle={`Remaining balance: ${peso(balance, true)}`}
      onClose={onClose}
    >
      <div className="flex gap-2">
        {canApply && tabBtn('apply', 'Apply')}
        {tabBtn('status', `My Requests${studentNotes.length ? ` (${studentNotes.length})` : ''}`)}
      </div>

      {submittedRef && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm">
              Submitted to Accounting. Reference <strong className="font-mono-code">{submittedRef}</strong>
            </span>
          </div>
          {onOpenPermit && (
            <button onClick={onOpenPermit} className={btnSecondary}>View Permits</button>
          )}
        </div>
      )}

      {tab === 'status' ? (
        studentNotes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="font-semibold text-slate-800">No promissory notes yet</p>
            {!canApply && <p className="text-xs mt-1">You have no locked permit that needs a promissory note.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {studentNotes.map((note) => {
              const ui = STATUS_UI[note.status];
              return (
                <div key={note.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-mono-code font-bold text-slate-900">{note.referenceNo}</span>
                      <span className="text-slate-500"> · {note.term}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${ui.className}`}>
                        <ui.icon className="w-3.5 h-3.5" /> {ui.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => { playKeyClick(); triggerPrint('promissory_receipt', activeStudent, note.term, note, undefined, true); }}
                        aria-label={`Reprint promissory note ${note.referenceNo}`}
                        title="Print"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-snc-green hover:text-snc-green cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">
                    Promised <strong>{peso(note.committedAmount)}</strong> on {formatDate(note.committedPaymentDate)} · {note.reasonCategory} · Submitted {formatDateTime(note.submittedAt)}
                  </p>
                  {note.reviewRemarks && (
                    <p className="text-xs rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-slate-700">
                      <span className="font-semibold">Accounting:</span> {note.reviewRemarks}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">Exam to clear</span>
              <select value={term} onChange={(e) => setTerm(e.target.value as ExamTerm)} className={field}>
                {lockedTerms.map((t) => (
                  <option key={t} value={t}>{t} Examination</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">Amount you will pay (₱)</span>
              <input type="number" min={1} max={balance} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className={`${field} font-mono-code font-bold`} />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">Date you will pay</span>
              <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className={field} />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">Reason</span>
              <select value={reason} onChange={(e) => setReason(e.target.value as ReasonCategory)} className={field}>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">Details (optional)</span>
              <textarea rows={2} value={details} onChange={(e) => setDetails(e.target.value)} className={`${field} h-auto py-2.5 resize-none`} />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">Parent / guardian name</span>
              <input type="text" value={guardian} onChange={(e) => setGuardian(e.target.value)} className={field} />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">Parent / guardian contact</span>
              <input type="tel" value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)} className={`${field} font-mono-code`} />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Signature</span>
              <button type="button" onClick={clearSignature} className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer">
                <Eraser className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
            <div className="relative rounded-xl border-2 border-dashed border-slate-300 overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={140}
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={() => (drawing.current = false)}
                onPointerLeave={() => (drawing.current = false)}
                className="block w-full h-32 touch-none cursor-crosshair"
              />
              {!hasSignature && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm italic text-slate-400">
                  Sign here with your finger
                </span>
              )}
            </div>
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#004d00]" />
            <span>
              I promise to pay the amount above on or before the date I chose. I understand that if I do not, my next examination permits may be withheld.
            </span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={() => { playKeyClick(); onClose(); }} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
              Submit Request
            </button>
          </div>
        </form>
      )}
    </KioskModal>
  );
};
