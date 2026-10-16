import { pool } from "../config/database.js";

const SELECT_NOTES = `
  SELECT pn.*, s.LRN, s.STUDENT_NUMBER, s.FIRSTNAME, s.LASTNAME, s.COURSE, s.SECTION,
         CONCAT(u.FIRST_NAME, ' ', u.LAST_NAME) AS REVIEWER_NAME
  FROM promissory_note pn
  JOIN student s ON s.IDNo = pn.STUDENT_ID
  LEFT JOIN user_info u ON u.IDNo = pn.REVIEWED_BY`;

export function mapNoteRow(n) {
  return {
    id: n.IDNo,
    referenceNo: n.REFERENCE_NO,
    studentPk: n.STUDENT_ID,
    studentLrn: n.LRN,
    studentId: n.STUDENT_NUMBER,
    studentName: `${n.FIRSTNAME} ${n.LASTNAME}`,
    program: n.COURSE,
    yearSection: n.SECTION,
    term: n.EXAM_TERM,
    balanceAmount: n.BALANCE_AMOUNT,
    committedAmount: n.COMMITTED_AMOUNT,
    committedPaymentDate: n.COMMITTED_DATE,
    reasonCategory: n.REASON_CATEGORY,
    reasonDetails: n.REASON_DETAILS || "",
    parentGuardian: n.GUARDIAN_NAME,
    parentContact: n.GUARDIAN_CONTACT,
    signatureDataUrl: n.SIGNATURE || "",
    submittedAt: n.SUBMITTED_DT,
    status: n.STATUS,
    reviewedBy: n.REVIEWER_NAME || undefined,
    reviewedAt: n.REVIEWED_DT || undefined,
    reviewRemarks: n.REVIEW_REMARKS || undefined,
  };
}

export async function findNotes(periodId, { studentId, status } = {}) {
  const where = ["pn.PERIOD_ID = ?"];
  const params = [periodId];
  if (studentId) {
    where.push("pn.STUDENT_ID = ?");
    params.push(studentId);
  }
  if (status) {
    where.push("pn.STATUS = ?");
    params.push(status);
  }
  const [rows] = await pool.execute(
    `${SELECT_NOTES} WHERE ${where.join(" AND ")} ORDER BY pn.SUBMITTED_DT DESC, pn.IDNo DESC`,
    params
  );
  return rows.map(mapNoteRow);
}

export async function findNoteById(id) {
  const [rows] = await pool.execute(`${SELECT_NOTES} WHERE pn.IDNo = ?`, [id]);
  return rows[0] ? mapNoteRow(rows[0]) : null;
}

export async function hasPendingNote(studentId, periodId, term) {
  const [rows] = await pool.execute(
    `SELECT IDNo FROM promissory_note
     WHERE STUDENT_ID = ? AND PERIOD_ID = ? AND EXAM_TERM = ? AND STATUS = 'pending' LIMIT 1`,
    [studentId, periodId, term]
  );
  return rows.length > 0;
}

export async function createNote(data) {
  const [result] = await pool.execute(
    `INSERT INTO promissory_note
     (STUDENT_ID, PERIOD_ID, EXAM_TERM, BALANCE_AMOUNT, COMMITTED_AMOUNT, COMMITTED_DATE,
      REASON_CATEGORY, REASON_DETAILS, GUARDIAN_NAME, GUARDIAN_CONTACT, SIGNATURE)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.student_id,
      data.period_id,
      data.term,
      data.balance_amount,
      data.committed_amount,
      data.committed_date,
      data.reason_category,
      data.reason_details,
      data.guardian_name,
      data.guardian_contact,
      data.signature,
    ]
  );
  const id = result.insertId;
  const referenceNo = `SNC-PN-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`;
  await pool.execute("UPDATE promissory_note SET REFERENCE_NO = ? WHERE IDNo = ?", [referenceNo, id]);
  return id;
}

export async function reviewNote(id, { status, remarks, reviewed_by }) {
  const [result] = await pool.execute(
    `UPDATE promissory_note
     SET STATUS = ?, REVIEW_REMARKS = ?, REVIEWED_BY = ?, REVIEWED_DT = NOW()
     WHERE IDNo = ? AND STATUS = 'pending'`,
    [status, remarks, reviewed_by, id]
  );
  return result.affectedRows;
}
