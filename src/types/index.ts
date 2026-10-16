export type ExamTerm = 'Prelim' | 'Midterm' | 'Prefinal' | 'Finals';

export type TermKey = 'prelim' | 'midterm' | 'prefinal' | 'finals';

export type PermitStatus = 'cleared' | 'locked' | 'promissory_cleared';

export type PaymentMethod =
  | 'Cash'
  | 'GCash'
  | 'Bank Transfer'
  | 'Debit/Credit Card'
  | 'Scholarship Voucher';

export interface AcademicPeriod {
  id: number;
  academicYear: string;
  semester: string;
  activeTerm: ExamTerm;
}

export interface EnrolledSubject {
  code: string;
  description: string;
  units: number;
  instructor: string;
  schedule: string;
}

export interface PaymentRecord {
  id: number;
  orNumber: string;
  date: string;
  term: string;
  amount: number;
  paymentMethod: PaymentMethod;
  remarks?: string;
}

export interface TermDue {
  due: number;
  paid: number;
  cleared: boolean;
}

export interface FeeItem {
  name: string;
  amount: number;
  category: 'other' | 'discount';
}

export interface StudentLedger {
  tuitionFee: number;
  laboratoryFee: number;
  miscellaneousFee: number;
  otherFees: FeeItem[];
  previousBalance: number;
  discounts: FeeItem[];
  totalAssessed: number;
  totalPaid: number;
  outstandingBalance: number;
  termBreakdown: Record<TermKey, TermDue>;
  payments: PaymentRecord[];
}

export interface PermitInfo {
  status: PermitStatus;
  permitNumber: string;
  issuedAt?: string;
}

export type StudentPermits = Record<TermKey, PermitInfo>;

export interface Student {
  id: number;
  lrn: string;
  studentId: string; // student number, e.g. SNC-2023-0192
  rfid: string | null;
  fullName: string;
  firstName: string;
  lastName: string;
  program: string;
  department: string;
  yearLevel: string;
  section: string;
  contactNumber: string;
  email: string;
  parentGuardian: string;
  parentContact: string;
  address: string;
  academicYear: string;
  semester: string;
  ledger: StudentLedger;
  permits: StudentPermits;
  subjects: EnrolledSubject[];
}

export type ReasonCategory =
  | 'Family Emergency'
  | 'Delayed Remittance'
  | 'Salary/Payday Timing'
  | 'Pending Scholarship'
  | 'Medical Expense'
  | 'Other';

export interface PromissoryNote {
  id: number;
  referenceNo: string;
  studentPk: number;
  studentLrn: string;
  studentId: string;
  studentName: string;
  program: string;
  yearSection: string;
  term: ExamTerm;
  balanceAmount: number;
  committedAmount: number;
  committedPaymentDate: string;
  reasonCategory: ReasonCategory;
  reasonDetails: string;
  parentGuardian: string;
  parentContact: string;
  signatureDataUrl: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  action: string;
  description: string;
  actor: string;
  studentLrn?: string;
  studentName?: string;
}

export interface PrintedSlip {
  type: 'soa' | 'permit' | 'promissory_receipt';
  student: Student;
  term?: ExamTerm;
  promissoryNote?: PromissoryNote;
  timestamp: string;
}
