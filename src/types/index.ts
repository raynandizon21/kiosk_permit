export type ExamTerm = 'Long Test Prelim' | 'Prelim' | 'Long Test Midterm' | 'Midterm' | 'Prefinal' | 'Finals';

export type TermKey = 'longTestPrelim' | 'prelim' | 'longTestMidterm' | 'midterm' | 'prefinal' | 'finals';

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
  /** Held as account credit instead of applied to a term due; see availableCredit. */
  isDeposit?: boolean;
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
  /** Deposited payments not yet withdrawn (sum of deposits minus released withdrawals). */
  availableCredit: number;
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

export interface WithdrawalRequest {
  id: number;
  referenceNo: string;
  studentPk: number;
  studentLrn: string;
  studentId: string;
  studentName: string;
  program: string;
  yearSection: string;
  amount: number;
  status: 'pending' | 'released' | 'declined';
  requestedAt: string;
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
  type: 'soa' | 'permit' | 'promissory_receipt' | 'payment_slip' | 'deposit_slip' | 'withdrawal_slip';
  student: Student;
  term?: ExamTerm;
  promissoryNote?: PromissoryNote;
  timestamp: string;
  /** O.R. number of the cash payment this receipt is for (payment_slip/deposit_slip only) — same one listed under Payments on the SOA. */
  reference?: string;
  /** Amount paid or deposited (payment_slip/deposit_slip only). */
  amount?: number;
  /** Date the payment was recorded (payment_slip/deposit_slip only); lets a past payment be reprinted with its original date, not today's. */
  paymentDate?: string;
  /** True when this is a reprint of a past payment from the Payments list, not the receipt for a payment just made. */
  isReprint?: boolean;
  /** The withdrawal request this receipt is for (withdrawal_slip only). */
  withdrawal?: WithdrawalRequest;
}
