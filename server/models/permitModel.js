import { pool } from "../config/database.js";
import { EXAM_TERMS, permitNumberFor } from "../utils/helpers.js";

export async function upsertPermit({ studentId, periodId, term, status, permitNumber, issuedBy }) {
  await pool.execute(
    `INSERT INTO exam_permit (STUDENT_ID, PERIOD_ID, EXAM_TERM, STATUS, PERMIT_NUMBER, ISSUED_DT, ISSUED_BY)
     VALUES (?, ?, ?, ?, ?, IF(? = 'locked', NULL, NOW()), ?)
     ON DUPLICATE KEY UPDATE
       STATUS = VALUES(STATUS),
       PERMIT_NUMBER = VALUES(PERMIT_NUMBER),
       ISSUED_DT = VALUES(ISSUED_DT),
       ISSUED_BY = VALUES(ISSUED_BY)`,
    [studentId, periodId, term, status, permitNumber, status, issuedBy]
  );
}

/**
 * After a payment: clear every locked term whose cumulative due is now covered.
 * Never downgrades a permit that is already cleared or cleared by promissory note.
 */
export async function clearPaidTerms(profile, periodId, issuedBy) {
  const keys = ["longTestPrelim", "prelim", "longTestMidterm", "midterm", "prefinal", "finals"];
  const newlyCleared = [];
  for (const [i, term] of EXAM_TERMS.entries()) {
    const due = profile.ledger.termBreakdown[keys[i]];
    if (!due.cleared || profile.permits[keys[i]].status !== "locked") continue;
    await upsertPermit({
      studentId: profile.id,
      periodId,
      term,
      status: "cleared",
      permitNumber: permitNumberFor(term, profile.id, periodId),
      issuedBy,
    });
    newlyCleared.push(term);
  }
  return newlyCleared;
}
