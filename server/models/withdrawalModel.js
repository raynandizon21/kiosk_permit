import { pool } from "../config/database.js";

const SELECT_REQUESTS = `
  SELECT w.*, s.LRN, s.STUDENT_NUMBER, s.FIRSTNAME, s.LASTNAME, s.COURSE, s.SECTION,
         CONCAT(u.FIRST_NAME, ' ', u.LAST_NAME) AS REVIEWER_NAME
  FROM withdrawal_request w
  JOIN student s ON s.IDNo = w.STUDENT_ID
  LEFT JOIN user_info u ON u.IDNo = w.REVIEWED_BY`;

function mapRequestRow(w) {
  return {
    id: w.IDNo,
    referenceNo: w.REFERENCE_NO,
    studentPk: w.STUDENT_ID,
    studentLrn: w.LRN,
    studentId: w.STUDENT_NUMBER,
    studentName: `${w.FIRSTNAME} ${w.LASTNAME}`,
    program: w.COURSE,
    yearSection: w.SECTION,
    amount: w.AMOUNT,
    status: w.STATUS,
    requestedAt: w.REQUESTED_DT,
    reviewedBy: w.REVIEWER_NAME || undefined,
    reviewedAt: w.REVIEWED_DT || undefined,
    reviewRemarks: w.REMARKS || undefined,
  };
}

export async function findRequests(periodId, { studentId, status } = {}) {
  const where = ["w.PERIOD_ID = ?"];
  const params = [periodId];
  if (studentId) {
    where.push("w.STUDENT_ID = ?");
    params.push(studentId);
  }
  if (status) {
    where.push("w.STATUS = ?");
    params.push(status);
  }
  const [rows] = await pool.execute(
    `${SELECT_REQUESTS} WHERE ${where.join(" AND ")} ORDER BY w.REQUESTED_DT DESC, w.IDNo DESC`,
    params
  );
  return rows.map(mapRequestRow);
}

export async function findRequestById(id) {
  const [rows] = await pool.execute(`${SELECT_REQUESTS} WHERE w.IDNo = ?`, [id]);
  return rows[0] ? mapRequestRow(rows[0]) : null;
}

export async function hasPendingRequest(studentId, periodId) {
  const [rows] = await pool.execute(
    `SELECT IDNo FROM withdrawal_request WHERE STUDENT_ID = ? AND PERIOD_ID = ? AND STATUS = 'pending' LIMIT 1`,
    [studentId, periodId]
  );
  return rows.length > 0;
}

export async function createRequest({ student_id, period_id, amount }) {
  const [result] = await pool.execute(
    `INSERT INTO withdrawal_request (STUDENT_ID, PERIOD_ID, AMOUNT) VALUES (?, ?, ?)`,
    [student_id, period_id, amount]
  );
  const id = result.insertId;
  const referenceNo = `SNC-WD-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`;
  await pool.execute("UPDATE withdrawal_request SET REFERENCE_NO = ? WHERE IDNo = ?", [referenceNo, id]);
  return id;
}

export async function reviewRequest(id, { status, remarks, reviewed_by }) {
  const [result] = await pool.execute(
    `UPDATE withdrawal_request
     SET STATUS = ?, REMARKS = ?, REVIEWED_BY = ?, REVIEWED_DT = NOW()
     WHERE IDNo = ? AND STATUS = 'pending'`,
    [status, remarks, reviewed_by, id]
  );
  return result.affectedRows;
}
