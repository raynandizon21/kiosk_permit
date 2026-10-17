export const EXAM_TERMS = ["Long Test Prelim", "Prelim", "Long Test Midterm", "Midterm", "Prefinal", "Finals"];

export const PAYMENT_METHODS = [
  "Cash",
  "GCash",
  "Bank Transfer",
  "Debit/Credit Card",
  "Scholarship Voucher",
];

export const REASON_CATEGORIES = [
  "Family Emergency",
  "Delayed Remittance",
  "Salary/Payday Timing",
  "Pending Scholarship",
  "Medical Expense",
  "Other",
];

export function isDuplicateKeyError(error) {
  return error?.code === "ER_DUP_ENTRY";
}

export function encodedBy(body) {
  const id = Number(body.encoded_by);
  return Number.isFinite(id) && id > 0 ? id : 1;
}

export function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export function isExamTerm(value) {
  return EXAM_TERMS.includes(value);
}

export function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** Permit number is unique per student + semester + term. */
export function permitNumberFor(term, studentId, periodId, kind = "") {
  const prefix = {
    "Long Test Prelim": "LP",
    Prelim: "PR",
    "Long Test Midterm": "LM",
    Midterm: "MT",
    Prefinal: "PF",
    Finals: "FN",
  }[term] || "EX";
  const base = `SNC-${prefix}-${periodId}${String(studentId).padStart(4, "0")}`;
  return kind ? `${base}-${kind}` : base;
}
