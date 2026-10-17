import { pool } from "../config/database.js";

function mapPeriodRow(p) {
  return {
    id: p.IDNo,
    academicYear: p.ACADEMIC_YEAR,
    semester: p.SEMESTER,
    activeTerm: p.ACTIVE_TERM,
  };
}

/**
 * If an active period has a From/To range and today falls inside it, that period
 * becomes the current one automatically — no admin click needed. If no period's
 * range covers today (no dates set, or a gap between semesters), the last
 * manually-set current period is left alone.
 */
export async function syncCurrentPeriodByDate() {
  const [matches] = await pool.query(
    `SELECT IDNo FROM academic_period
     WHERE ACTIVE = 1 AND START_DATE IS NOT NULL AND END_DATE IS NOT NULL
       AND CURDATE() BETWEEN START_DATE AND END_DATE
     ORDER BY START_DATE DESC LIMIT 1`
  );
  const match = matches[0];
  if (!match) return;

  const [currentRows] = await pool.query("SELECT IDNo FROM academic_period WHERE IS_CURRENT = 1 LIMIT 1");
  if (currentRows[0]?.IDNo === match.IDNo) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("UPDATE academic_period SET IS_CURRENT = 0");
    await conn.query("UPDATE academic_period SET IS_CURRENT = 1 WHERE IDNo = ?", [match.IDNo]);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function findCurrentPeriod() {
  await syncCurrentPeriodByDate();
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
