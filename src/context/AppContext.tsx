import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  AcademicPeriod,
  AuditLog,
  ExamTerm,
  PaymentMethod,
  PaymentRecord,
  PermitStatus,
  PrintedSlip,
  PromissoryNote,
  ReasonCategory,
  Student,
  TermKey,
  WithdrawalRequest
} from '../types';
import { api, errorMessage } from '../lib/api';
import { useAuth } from './AuthContext';
import { playPrinterSound, playSuccessChime } from '../utils/audio';
import { peso } from '../utils/format';

export const TERM_KEY_MAP: Record<ExamTerm, TermKey> = {
  'Long Test Prelim': 'longTestPrelim',
  Prelim: 'prelim',
  'Long Test Midterm': 'longTestMidterm',
  Midterm: 'midterm',
  Prefinal: 'prefinal',
  Finals: 'finals'
};

export const ALL_EXAM_TERMS: ExamTerm[] = ['Long Test Prelim', 'Prelim', 'Long Test Midterm', 'Midterm', 'Prefinal', 'Finals'];

export interface PromissoryInput {
  term: ExamTerm;
  committedAmount: number;
  committedDate: string;
  reasonCategory: ReasonCategory;
  reasonDetails: string;
  guardianName: string;
  guardianContact: string;
  signature: string;
}

export interface PaymentInput {
  studentId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  allocation: string;
  orNumber: string;
  remarks: string;
}

/** Admin actions resolve to an error message, or null on success. */
type ActionResult = Promise<string | null>;

interface AppContextType {
  period: AcademicPeriod | null;
  currentExamTerm: ExamTerm;

  // Kiosk
  activeStudent: Student | null;
  studentNotes: PromissoryNote[];
  studentWithdrawals: WithdrawalRequest[];
  loginKiosk: (lookup: string) => Promise<{ success: boolean; message?: string }>;
  logoutKiosk: () => void;
  submitPromissoryNote: (input: PromissoryInput) => Promise<{ note?: PromissoryNote; message?: string }>;
  payBalance: (amount: number, applyTo?: 'dues' | 'deposit') => Promise<{ message?: string }>;
  /** Splits a payment with change beyond the current due into two receipts: the due amount, then the excess as a deposit. */
  payBalanceSplit: (dueAmount: number, depositAmount: number) => Promise<{ message?: string }>;
  requestWithdrawal: (amount: number) => Promise<{ message?: string }>;
  printedSlip: PrintedSlip | null;
  triggerPrint: (
    type: PrintedSlip['type'],
    student: Student,
    term?: ExamTerm,
    note?: PromissoryNote,
    payment?: PaymentRecord,
    isReprint?: boolean,
    withdrawal?: WithdrawalRequest
  ) => void;
  dismissPrintSlip: () => void;

  // Admin
  students: Student[];
  promissoryNotes: PromissoryNote[];
  withdrawalRequests: WithdrawalRequest[];
  auditLogs: AuditLog[];
  adminLoading: boolean;
  loadAdminData: () => Promise<void>;
  setActiveTerm: (term: ExamTerm) => ActionResult;
  reviewPromissoryNote: (noteId: number, status: 'approved' | 'rejected', remarks: string) => ActionResult;
  reviewWithdrawal: (requestId: number, status: 'released' | 'declined', remarks: string) => ActionResult;
  recordCashierPayment: (input: PaymentInput) => ActionResult;
  overrideStudentPermit: (studentId: number, term: ExamTerm, status: PermitStatus) => ActionResult;

  // Real-time
  /** Increments on every server change — pages that load their own data add it to their effect deps. */
  liveTick: number;
  notifications: LiveNotification[];
  unreadCount: number;
  markAllRead: () => void;
  toasts: LiveNotification[];
  dismissToast: (id: number) => void;
}

/** A change pushed by the server (every audit-log entry). */
export interface LiveEvent {
  id: number;
  action: string;
  description: string;
  actor: string;
  studentId: number | null;
  studentName: string | null;
  timestamp: string;
}

export type LiveNotification = LiveEvent & { read: boolean };

const TOAST_MS = 6000;
const MAX_NOTIFICATIONS = 30;

const AppContext = createContext<AppContextType | undefined>(undefined);

const PRINT_LOG: Record<PrintedSlip['type'], string> = {
  soa: 'soa_print',
  permit: 'permit_print',
  promissory_receipt: 'promissory_print',
  payment_slip: 'payment_slip_print',
  deposit_slip: 'deposit_slip_print',
  withdrawal_slip: 'withdrawal_slip_print'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const encodedBy = user?.id;

  const [period, setPeriod] = useState<AcademicPeriod | null>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [studentNotes, setStudentNotes] = useState<PromissoryNote[]>([]);
  const [studentWithdrawals, setStudentWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [printedSlip, setPrintedSlip] = useState<PrintedSlip | null>(null);
  // Holds one queued triggerPrint call (see payBalanceSplit) to show right after the current slip is dismissed.
  const printQueueRef = useRef<Parameters<AppContextType['triggerPrint']> | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [promissoryNotes, setPromissoryNotes] = useState<PromissoryNote[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const loadPeriod = useCallback(async () => {
    try {
      setPeriod(await api<AcademicPeriod>('/api/period'));
    } catch {
      // kiosk shows the System Offline badge
    }
  }, []);

  useEffect(() => {
    loadPeriod();
  }, [loadPeriod]);

  const currentExamTerm: ExamTerm = period?.activeTerm ?? 'Prelim';

  // ---------- Kiosk ----------

  const loadStudentNotes = async (studentId: number) => {
    setStudentNotes(await api<PromissoryNote[]>(`/api/promissory-notes?student_id=${studentId}`));
  };

  const loadStudentWithdrawals = async (studentId: number) => {
    setStudentWithdrawals(await api<WithdrawalRequest[]>(`/api/withdrawals?student_id=${studentId}`));
  };

  const loginKiosk = async (lookup: string) => {
    try {
      const student = await api<Student>(`/api/students?lookup=${encodeURIComponent(lookup.trim())}`);
      await Promise.all([loadStudentNotes(student.id), loadStudentWithdrawals(student.id), loadPeriod()]);
      setActiveStudent(student);
      playSuccessChime();
      return { success: true };
    } catch (err) {
      return { success: false, message: errorMessage(err) };
    }
  };

  const logoutKiosk = useCallback(() => {
    setActiveStudent(null);
    setStudentNotes([]);
    setStudentWithdrawals([]);
    printQueueRef.current = null;
    setPrintedSlip(null);
  }, []);

  const triggerPrint: AppContextType['triggerPrint'] = (type, student, term, note, payment, isReprint, withdrawal) => {
    playPrinterSound();
    const now = Date.now();
    const isMoneySlip = type === 'payment_slip' || type === 'deposit_slip';
    setPrintedSlip({
      type,
      student,
      term,
      promissoryNote: note,
      timestamp: new Date(now).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      reference: isMoneySlip ? payment?.orNumber : undefined,
      amount: isMoneySlip ? payment?.amount : undefined,
      paymentDate: isMoneySlip ? payment?.date : undefined,
      isReprint: isMoneySlip ? isReprint : undefined,
      withdrawal: type === 'withdrawal_slip' ? withdrawal : undefined
    });
    const what =
      type === 'permit'
        ? `${term} examination permit`
        : type === 'soa'
          ? 'statement of account'
          : type === 'payment_slip'
            ? `payment receipt ${payment?.orNumber ?? ''} (cash, ${peso(payment?.amount ?? 0, true)})`
            : type === 'deposit_slip'
              ? `deposit receipt ${payment?.orNumber ?? ''} (cash, ${peso(payment?.amount ?? 0, true)})`
              : type === 'withdrawal_slip'
                ? `withdrawal receipt ${withdrawal?.referenceNo ?? ''} (${peso(withdrawal?.amount ?? 0, true)})`
                : `promissory note receipt ${note?.referenceNo ?? ''}`;
    api('/api/logs', {
      method: 'POST',
      body: { action: PRINT_LOG[type], description: `${isReprint ? 'Reprinted' : 'Printed'} ${what}`, student_id: student.id }
    }).catch(() => undefined);
  };

  const submitPromissoryNote = async (input: PromissoryInput) => {
    if (!activeStudent) return { message: 'Session expired. Please sign in again.' };
    try {
      const note = await api<PromissoryNote>('/api/promissory-notes', {
        method: 'POST',
        body: {
          student_id: activeStudent.id,
          term: input.term,
          committed_amount: input.committedAmount,
          committed_date: input.committedDate,
          reason_category: input.reasonCategory,
          reason_details: input.reasonDetails,
          guardian_name: input.guardianName,
          guardian_contact: input.guardianContact,
          signature: input.signature
        }
      });
      await loadStudentNotes(activeStudent.id);
      triggerPrint('promissory_receipt', activeStudent, input.term, note);
      return { note };
    } catch (err) {
      return { message: errorMessage(err) };
    }
  };

  /**
   * Self-service cash payment: posts straight to the ledger (see server kioskCreate), then prints
   * the receipt. applyTo 'dues' (default) settles the balance; 'deposit' holds it as account credit
   * instead (see requestWithdrawal) and prints a deposit receipt rather than a payment receipt.
   */
  const payBalance = async (amount: number, applyTo: 'dues' | 'deposit' = 'dues') => {
    if (!activeStudent) return { message: 'Session expired. Please sign in again.' };
    try {
      const updated = await api<Student>('/api/payments/kiosk', {
        method: 'POST',
        body: { student_id: activeStudent.id, amount, apply_to: applyTo }
      });
      setActiveStudent(updated);
      // payments are ordered newest-first, so index 0 is the one that was just posted
      triggerPrint(applyTo === 'deposit' ? 'deposit_slip' : 'payment_slip', updated, undefined, undefined, updated.ledger.payments[0]);
      return {};
    } catch (err) {
      return { message: errorMessage(err) };
    }
  };

  /**
   * When the amount a student wants to pay exceeds what's currently due (change), this posts it
   * as two separate payments instead of one: dueAmount settles the balance as usual, and
   * depositAmount is held as account credit. Prints the payment receipt first; the deposit receipt
   * is queued and shown automatically once that one is dismissed (see dismissPrintSlip).
   */
  const payBalanceSplit = async (dueAmount: number, depositAmount: number) => {
    if (!activeStudent) return { message: 'Session expired. Please sign in again.' };
    try {
      let updated = activeStudent;
      let duePayment: PaymentRecord | undefined;
      if (dueAmount > 0) {
        updated = await api<Student>('/api/payments/kiosk', {
          method: 'POST',
          body: { student_id: activeStudent.id, amount: dueAmount, apply_to: 'dues' }
        });
        duePayment = updated.ledger.payments[0];
      }
      updated = await api<Student>('/api/payments/kiosk', {
        method: 'POST',
        body: { student_id: activeStudent.id, amount: depositAmount, apply_to: 'deposit' }
      });
      const depositPayment = updated.ledger.payments[0];
      setActiveStudent(updated);
      if (duePayment) {
        printQueueRef.current = ['deposit_slip', updated, undefined, undefined, depositPayment];
        triggerPrint('payment_slip', updated, undefined, undefined, duePayment);
      } else {
        triggerPrint('deposit_slip', updated, undefined, undefined, depositPayment);
      }
      return {};
    } catch (err) {
      return { message: errorMessage(err) };
    }
  };

  /** Kiosk request to cash out deposited credit; prints a receipt to present to the Cashier. */
  const requestWithdrawal = async (amount: number) => {
    if (!activeStudent) return { message: 'Session expired. Please sign in again.' };
    try {
      const request = await api<WithdrawalRequest>('/api/withdrawals', {
        method: 'POST',
        body: { student_id: activeStudent.id, amount }
      });
      await loadStudentWithdrawals(activeStudent.id);
      triggerPrint('withdrawal_slip', activeStudent, undefined, undefined, undefined, false, request);
      return {};
    } catch (err) {
      return { message: errorMessage(err) };
    }
  };

  // ---------- Admin ----------

  const loadAdminData = useCallback(async () => {
    setAdminLoading(true);
    try {
      const [p, s, n, w, l] = await Promise.all([
        api<AcademicPeriod>('/api/period'),
        api<Student[]>('/api/students'),
        api<PromissoryNote[]>('/api/promissory-notes'),
        api<WithdrawalRequest[]>('/api/withdrawals'),
        api<AuditLog[]>('/api/logs?limit=200')
      ]);
      setPeriod(p);
      setStudents(s);
      setPromissoryNotes(n);
      setWithdrawalRequests(w);
      setAuditLogs(l);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  // ---------- Real-time (Server-Sent Events) ----------

  const [liveTick, setLiveTick] = useState(0);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [toasts, setToasts] = useState<LiveNotification[]>([]);

  // Latest values for the long-lived EventSource handler
  const activeStudentRef = useRef(activeStudent);
  activeStudentRef.current = activeStudent;
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const source = new EventSource('/api/events');
    let adminReload: number | undefined;

    source.onmessage = (msg) => {
      let event: LiveEvent;
      try {
        event = JSON.parse(msg.data);
      } catch {
        return;
      }
      setLiveTick((t) => t + 1);
      loadPeriod();

      // Kiosk: refresh the signed-in student when their record (or something global) changed
      const current = activeStudentRef.current;
      if (current && (event.studentId === null || event.studentId === current.id)) {
        api<Student>(`/api/students/${current.id}`)
          .then((fresh) => {
            if (activeStudentRef.current?.id === fresh.id) setActiveStudent(fresh);
          })
          .catch(() => undefined);
        loadStudentNotes(current.id).catch(() => undefined);
        loadStudentWithdrawals(current.id).catch(() => undefined);
      }

      // Admin: reload data (debounced) and notify about kiosk activity
      if (userRef.current) {
        window.clearTimeout(adminReload);
        adminReload = window.setTimeout(() => loadAdminData().catch(() => undefined), 300);
        if (event.actor === 'Kiosk') {
          const note: LiveNotification = { ...event, read: false };
          setNotifications((list) => [note, ...list].slice(0, MAX_NOTIFICATIONS));
          setToasts((list) => [note, ...list].slice(0, 3));
          window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== note.id)), TOAST_MS);
        }
      }
    };

    return () => {
      window.clearTimeout(adminReload);
      source.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPeriod, loadAdminData]);

  const markAllRead = useCallback(() => setNotifications((list) => list.map((n) => ({ ...n, read: true }))), []);
  const dismissToast = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const runAdmin = async (request: () => Promise<unknown>): ActionResult => {
    try {
      await request();
      await loadAdminData();
      return null;
    } catch (err) {
      return errorMessage(err);
    }
  };

  const setActiveTerm = (term: ExamTerm) =>
    runAdmin(() => api('/api/period', { method: 'PUT', body: { active_term: term, encoded_by: encodedBy } }));

  const reviewPromissoryNote = (noteId: number, status: 'approved' | 'rejected', remarks: string) =>
    runAdmin(() =>
      api(`/api/promissory-notes/${noteId}/review`, {
        method: 'PUT',
        body: { status, remarks, encoded_by: encodedBy }
      })
    );

  const reviewWithdrawal = (requestId: number, status: 'released' | 'declined', remarks: string) =>
    runAdmin(() =>
      api(`/api/withdrawals/${requestId}/review`, {
        method: 'PUT',
        body: { status, remarks, encoded_by: encodedBy }
      })
    );

  const recordCashierPayment = (input: PaymentInput) =>
    runAdmin(() =>
      api('/api/payments', {
        method: 'POST',
        body: {
          student_id: input.studentId,
          amount: input.amount,
          payment_method: input.paymentMethod,
          allocation: input.allocation,
          or_number: input.orNumber,
          remarks: input.remarks,
          encoded_by: encodedBy
        }
      })
    );

  const overrideStudentPermit = (studentId: number, term: ExamTerm, status: PermitStatus) =>
    runAdmin(() =>
      api('/api/permits', { method: 'PUT', body: { student_id: studentId, term, status, encoded_by: encodedBy } })
    );

  return (
    <AppContext.Provider
      value={{
        period,
        currentExamTerm,
        activeStudent,
        studentNotes,
        studentWithdrawals,
        loginKiosk,
        logoutKiosk,
        submitPromissoryNote,
        payBalance,
        payBalanceSplit,
        requestWithdrawal,
        printedSlip,
        triggerPrint,
        dismissPrintSlip: () => {
          const queued = printQueueRef.current;
          printQueueRef.current = null;
          if (queued) triggerPrint(...queued);
          else setPrintedSlip(null);
        },
        students,
        promissoryNotes,
        withdrawalRequests,
        auditLogs,
        adminLoading,
        loadAdminData,
        setActiveTerm,
        reviewPromissoryNote,
        reviewWithdrawal,
        recordCashierPayment,
        overrideStudentPermit,
        liveTick,
        notifications,
        unreadCount,
        markAllRead,
        toasts,
        dismissToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
