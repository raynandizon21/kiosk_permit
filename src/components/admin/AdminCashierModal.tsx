import React, { useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, Student } from '../../types';
import { peso } from '../../utils/format';
import { AdminModal, adminBtnPrimary, adminBtnSecondary, adminInput } from './AdminModal';

interface AdminCashierModalProps {
  initialStudent?: Student | null;
  onClose: () => void;
}

const METHODS: PaymentMethod[] = ['Cash', 'GCash', 'Bank Transfer', 'Debit/Credit Card', 'Scholarship Voucher'];

export const AdminCashierModal: React.FC<AdminCashierModalProps> = ({ initialStudent, onClose }) => {
  const { students, recordCashierPayment, currentExamTerm } = useApp();

  const [studentId, setStudentId] = useState<number>(initialStudent?.id ?? 0);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [allocation, setAllocation] = useState(`${currentExamTerm} Examination Dues`);
  const [orNumber, setOrNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const student = students.find((s) => s.id === studentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!student) return setError('Please select a student.');
    if (amount <= 0) return setError('Payment amount must be greater than ₱0.');
    if (!orNumber.trim()) return setError('Official Receipt (O.R.) number is required.');

    setSaving(true);
    const err = await recordCashierPayment({
      studentId: student.id,
      amount,
      paymentMethod,
      allocation,
      orNumber: orNumber.trim(),
      remarks
    });
    setSaving(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <AdminModal title="Record Payment" subtitle="Updates the SOA and clears paid exam permits" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <label className="block">
          <span className="mb-1 block font-medium text-slate-700">Student</span>
          <select value={studentId} onChange={(e) => setStudentId(Number(e.target.value))} className={adminInput}>
            <option value={0}>Select a student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.studentId})
              </option>
            ))}
          </select>
        </label>

        {student && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
            <span className="text-slate-600">{student.program} • {student.yearLevel}</span>
            <span>
              Balance <strong className="font-mono-code text-red-600">{peso(student.ledger.outstandingBalance, true)}</strong>
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block font-medium text-slate-700">Amount (₱)</span>
            <input type="number" min={1} step="0.01" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className={`${adminInput} font-mono-code`} />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium text-slate-700">Method</span>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={adminInput}>
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-medium text-slate-700">O.R. Number</span>
            <input type="text" value={orNumber} onChange={(e) => setOrNumber(e.target.value)} className={`${adminInput} font-mono-code`} placeholder="OR-2024-0001" />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium text-slate-700">Allocation</span>
            <input type="text" value={allocation} onChange={(e) => setAllocation(e.target.value)} className={adminInput} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block font-medium text-slate-700">Remarks (optional)</span>
          <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className={adminInput} />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={adminBtnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} className={adminBtnPrimary}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Payment
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
