import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  AcademicPeriod,
  AuditLog,
  ExamTerm,
  PaymentMethod,
  PermitStatus,
  PrintedSlip,
  PromissoryNote,
  ReasonCategory,
  Student,
  TermKey
} from '../types';
import { api, errorMessage } from '../lib/api';
import { useAuth } from './AuthContext';
import { playPrinterSound, playSuccessChime } from '../utils/audio';

export const TERM_KEY_MAP: Record<ExamTerm, TermKey> = {
  Prelim: 'prelim',
  Midterm: 'midterm',
  Prefinal: 'prefinal',
  Finals: 'finals'
};

export const ALL_EXAM_TERMS: ExamTerm[] = ['Prelim', 'Midterm', 'Prefinal', 'Finals'];

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
  loginKiosk: (lookup: string) => Promise<{ success: boolean; message?: string }>;
  logoutKiosk: () => void;
  submitPromissoryNote: (input: PromissoryInput) => Promise<{ note?: PromissoryNote; message?: string }>;
  printedSlip: PrintedSlip | null;
  triggerPrint: (type: PrintedSlip['type'], student: Student, term?: ExamTerm, note?: PromissoryNote) => void;
  dismissPrintSlip: () => void;

  // Admin
  students: Student[];
  promissoryNotes: PromissoryNote[];
  auditLogs: AuditLog[];
  adminLoading: boolean;
  loadAdminData: () => Promise<void>;
  setActiveTerm: (term: ExamTerm) => ActionResult;
  reviewPromissoryNote: (noteId: number, status: 'approved' | 'rejected', remarks: string) => ActionResult;
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
  promissory_receipt: 'promissory_print'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const encodedBy = user?.id;

  const [period, setPeriod] = useState<AcademicPeriod | null>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [studentNotes, setStudentNotes] = useState<PromissoryNote[]>([]);
  const [printedSlip, setPrintedSlip] = useState<PrintedSlip | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [promissoryNotes, setPromissoryNotes] = useState<PromissoryNote[]>([]);
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

  const loginKiosk = async (lookup: string) => {
    try {
      const student = await api<Student>(`/api/students?lookup=${encodeURIComponent(lookup.trim())}`);
      await Promise.all([loadStudentNotes(student.id), loadPeriod()]);
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
    setPrintedSlip(null);
  }, []);

  const triggerPrint: AppContextType['triggerPrint'] = (type, student, term, note) => {
    playPrinterSound();
    setPrintedSlip({
      type,
      student,
      term,
      promissoryNote: note,
      timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    });
    const what = type === 'permit' ? `${term} examination permit` : type === 'soa' ? 'statement of account' : `promissory note receipt ${note?.referenceNo ?? ''}`;
    api('/api/logs', {
      method: 'POST',
      body: { action: PRINT_LOG[type], description: `Printed ${what}`, student_id: student.id }
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

  // ---------- Admin ----------

  const loadAdminData = useCallback(async () => {
    setAdminLoading(true);
    try {
      const [p, s, n, l] = await Promise.all([
        api<AcademicPeriod>('/api/period'),
        api<Student[]>('/api/students'),
        api<PromissoryNote[]>('/api/promissory-notes'),
        api<AuditLog[]>('/api/logs?limit=200')
      ]);
      setPeriod(p);
      setStudents(s);
      setPromissoryNotes(n);
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
        loginKiosk,
        logoutKiosk,
        submitPromissoryNote,
        printedSlip,
        triggerPrint,
        dismissPrintSlip: () => setPrintedSlip(null),
        students,
        promissoryNotes,
        auditLogs,
        adminLoading,
        loadAdminData,
        setActiveTerm,
        reviewPromissoryNote,
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
