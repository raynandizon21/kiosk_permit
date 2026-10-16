import { pool } from "../config/database.js";
import { broadcast } from "../utils/events.js";

/** Records an activity and pushes it to every connected kiosk/admin screen. */
export async function addLog({ action, description, actor, studentId = null }) {
  const text = description.slice(0, 500);
  const [result] = await pool.execute(
    "INSERT INTO audit_log (ACTION, DESCRIPTION, ACTOR, STUDENT_ID) VALUES (?, ?, ?, ?)",
    [action, text, actor, studentId]
  );
  let studentName = null;
  if (studentId) {
    const [rows] = await pool.execute("SELECT CONCAT(FIRSTNAME, ' ', LASTNAME) AS NAME FROM student WHERE IDNo = ?", [studentId]);
    studentName = rows[0]?.NAME ?? null;
  }
  broadcast({
    id: result.insertId,
    action,
    description: text,
    actor,
    studentId,
    studentName,
    timestamp: new Date().toISOString(),
  });
}

export async function findLogs(limit = 200) {
  const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 1000);
  const [rows] = await pool.query(
    `SELECT l.*, s.LRN, CONCAT(s.FIRSTNAME, ' ', s.LASTNAME) AS STUDENT_NAME
     FROM audit_log l LEFT JOIN student s ON s.IDNo = l.STUDENT_ID
     ORDER BY l.LOG_DT DESC, l.IDNo DESC LIMIT ${safeLimit}`
  );
  return rows.map((l) => ({
    id: l.IDNo,
    timestamp: l.LOG_DT,
    action: l.ACTION,
    description: l.DESCRIPTION,
    actor: l.ACTOR,
    studentLrn: l.LRN || undefined,
    studentName: l.STUDENT_NAME || undefined,
  }));
}
