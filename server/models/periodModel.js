import { pool } from "../config/database.js";

function mapPeriodRow(p) {
  return {
    id: p.IDNo,
    academicYear: p.ACADEMIC_YEAR,
    semester: p.SEMESTER,
    activeTerm: p.ACTIVE_TERM,
  };
}

export async function findCurrentPeriod() {
  const [rows] = await pool.execute(
    "SELECT * FROM academic_period WHERE IS_CURRENT = 1 AND ACTIVE = 1 ORDER BY IDNo DESC LIMIT 1"
  );
  return rows[0] ? mapPeriodRow(rows[0]) : null;
}

export async function updateActiveTerm(periodId, term) {
  const [result] = await pool.execute(
    "UPDATE academic_period SET ACTIVE_TERM = ? WHERE IDNo = ?",
    [term, periodId]
  );
  return result.affectedRows;
}
