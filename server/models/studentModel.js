import { pool } from "../config/database.js";
import { EXAM_TERMS, round2 } from "../utils/helpers.js";

const TERM_KEY = { Prelim: "prelim", Midterm: "midterm", Prefinal: "prefinal", Finals: "finals" };

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const list = map.get(row[key]) ?? [];
    list.push(row);
    map.set(row[key], list);
  }
  return map;
}

/** Ledger totals + per-term dues. Payments fill the terms in exam order. */
export function buildLedger(assessment, items, payments) {
  const tuitionFee = assessment?.TUITION_FEE ?? 0;
  const laboratoryFee = assessment?.LAB_FEE ?? 0;
  const miscellaneousFee = assessment?.MISC_FEE ?? 0;
  const previousBalance = assessment?.PREVIOUS_BALANCE ?? 0;

  const otherFees = items
    .filter((i) => i.ITEM_TYPE === "fee")
    .map((i) => ({ name: i.ITEM_NAME, amount: i.AMOUNT, category: "other" }));
  const discounts = items
    .filter((i) => i.ITEM_TYPE === "discount")
    .map((i) => ({ name: i.ITEM_NAME, amount: i.AMOUNT, category: "discount" }));

  const totalAssessed = round2(
    tuitionFee +
      laboratoryFee +
      miscellaneousFee +
      previousBalance +
      otherFees.reduce((s, f) => s + f.amount, 0) -
      discounts.reduce((s, f) => s + f.amount, 0)
  );
  const totalPaid = round2(payments.reduce((s, p) => s + p.AMOUNT, 0));
  const outstandingBalance = round2(Math.max(0, totalAssessed - totalPaid));

  const termDue = round2(totalAssessed / EXAM_TERMS.length);
  const termBreakdown = {};
  EXAM_TERMS.forEach((term, i) => {
    const paid = round2(Math.min(termDue, Math.max(0, totalPaid - termDue * i)));
    termBreakdown[TERM_KEY[term]] = { due: termDue, paid, cleared: paid >= termDue - 0.01 };
  });

  return {
    tuitionFee,
    laboratoryFee,
    miscellaneousFee,
    otherFees,
    previousBalance,
    discounts,
    totalAssessed,
    totalPaid,
    outstandingBalance,
    termBreakdown,
    payments: payments.map((p) => ({
      id: p.IDNo,
      orNumber: p.OR_NUMBER,
      date: p.PAYMENT_DT,
      term: p.ALLOCATION || "",
      amount: p.AMOUNT,
      paymentMethod: p.PAYMENT_METHOD,
      remarks: p.REMARKS || "",
    })),
  };
}

/**
 * Full student profiles (info + SOA ledger + permits + subjects) for one semester.
 * Batched: one query per table, assembled in JS.
 */
export async function findProfiles(period, studentId = null) {
  const byStudent = studentId ? " AND x.STUDENT_ID = ?" : "";
  const sParams = studentId ? [period.id, studentId] : [period.id];

  const [students] = await pool.execute(
    `SELECT * FROM student WHERE ACTIVE = 1 ${studentId ? "AND IDNo = ?" : ""} ORDER BY LASTNAME, FIRSTNAME`,
    studentId ? [studentId] : []
  );
  if (students.length === 0) return [];

  const [assessments] = await pool.execute(
    `SELECT * FROM assessment x WHERE x.PERIOD_ID = ?${byStudent}`,
    sParams
  );
  const [items] = await pool.execute(
    `SELECT i.*, x.STUDENT_ID FROM assessment_item i
     JOIN assessment x ON x.IDNo = i.ASSESSMENT_ID
     WHERE x.PERIOD_ID = ?${byStudent} ORDER BY i.ITEM_TYPE, i.IDNo`,
    sParams
  );
  const [payments] = await pool.execute(
    `SELECT * FROM payment x WHERE x.PERIOD_ID = ?${byStudent} ORDER BY x.PAYMENT_DT DESC, x.IDNo DESC`,
    sParams
  );
  const [permits] = await pool.execute(
    `SELECT * FROM exam_permit x WHERE x.PERIOD_ID = ?${byStudent}`,
    sParams
  );
  const [subjects] = await pool.execute(
    `SELECT x.STUDENT_ID, x.INSTRUCTOR, x.SCHEDULE, s.CODE, s.DESCRIPTION, s.UNITS
     FROM student_subject x JOIN subject s ON s.IDNo = x.SUBJECT_ID
     WHERE x.PERIOD_ID = ?${byStudent} ORDER BY s.CODE`,
    sParams
  );

  const assessmentBy = new Map(assessments.map((a) => [a.STUDENT_ID, a]));
  const itemsBy = groupBy(items, "STUDENT_ID");
  const paymentsBy = groupBy(payments, "STUDENT_ID");
  const permitsBy = groupBy(permits, "STUDENT_ID");
  const subjectsBy = groupBy(subjects, "STUDENT_ID");

  return students.map((s) => {
    const permitRows = permitsBy.get(s.IDNo) ?? [];
    const studentPermits = {};
    for (const term of EXAM_TERMS) {
      const row = permitRows.find((p) => p.EXAM_TERM === term);
      studentPermits[TERM_KEY[term]] = {
        status: row?.STATUS ?? "locked",
        permitNumber: row?.PERMIT_NUMBER ?? "",
        issuedAt: row?.ISSUED_DT ?? undefined,
      };
    }

    return {
      id: s.IDNo,
      lrn: s.LRN,
      studentId: s.STUDENT_NUMBER,
      rfid: s.RFID,
      fullName: `${s.FIRSTNAME} ${s.LASTNAME}`,
      firstName: s.FIRSTNAME,
      lastName: s.LASTNAME,
      program: s.COURSE,
      department: s.DEPARTMENT || "",
      yearLevel: s.YEAR_LEVEL,
      section: s.SECTION,
      contactNumber: s.CONTACTNo || "",
      email: s.EMAIL || "",
      parentGuardian: s.GUARDIAN_NAME || "",
      parentContact: s.GUARDIAN_CONTACT || "",
      address: s.ADDRESS || "",
      academicYear: period.academicYear,
      semester: period.semester,
      ledger: buildLedger(
        assessmentBy.get(s.IDNo),
        itemsBy.get(s.IDNo) ?? [],
        paymentsBy.get(s.IDNo) ?? []
      ),
      permits: studentPermits,
      subjects: (subjectsBy.get(s.IDNo) ?? []).map((sub) => ({
        code: sub.CODE,
        description: sub.DESCRIPTION,
        units: sub.UNITS,
        instructor: sub.INSTRUCTOR || "",
        schedule: sub.SCHEDULE || "",
      })),
    };
  });
}

export async function findProfile(period, studentId) {
  const [profile] = await findProfiles(period, studentId);
  return profile ?? null;
}

/** Kiosk sign-in: LRN, student number, or school ID card (RFID). */
export async function findStudentIdByLookup(value) {
  const [rows] = await pool.execute(
    `SELECT IDNo FROM student
     WHERE (LRN = ? OR STUDENT_NUMBER = ? OR RFID = ?) AND ACTIVE = 1
     LIMIT 1`,
    [value, value, value]
  );
  return rows[0]?.IDNo ?? null;
}

/* ---------- File maintenance: student records ---------- */

/** Editable record for the admin form (info + current-semester assessment, fee items, and subjects). */
export async function findRecord(periodId, studentId) {
  const [students] = await pool.execute("SELECT * FROM student WHERE IDNo = ? AND ACTIVE = 1", [studentId]);
  const s = students[0];
  if (!s) return null;
  const [assessments] = await pool.execute(
    "SELECT * FROM assessment WHERE STUDENT_ID = ? AND PERIOD_ID = ?",
    [studentId, periodId]
  );
  const a = assessments[0];
  const [items] = a
    ? await pool.execute("SELECT ITEM_NAME, AMOUNT, ITEM_TYPE FROM assessment_item WHERE ASSESSMENT_ID = ? ORDER BY IDNo", [a.IDNo])
    : [[]];
  const [subjects] = await pool.execute(
    "SELECT SUBJECT_ID, INSTRUCTOR, SCHEDULE FROM student_subject WHERE STUDENT_ID = ? AND PERIOD_ID = ?",
    [studentId, periodId]
  );
  return {
    id: s.IDNo,
    lrn: s.LRN,
    student_number: s.STUDENT_NUMBER,
    rfid: s.RFID ?? "",
    first_name: s.FIRSTNAME,
    last_name: s.LASTNAME,
    course: s.COURSE,
    year_level: s.YEAR_LEVEL,
    section: s.SECTION,
    contact: s.CONTACTNo ?? "",
    email: s.EMAIL ?? "",
    guardian_name: s.GUARDIAN_NAME ?? "",
    guardian_contact: s.GUARDIAN_CONTACT ?? "",
    address: s.ADDRESS ?? "",
    assessment: {
      tuition_fee: a?.TUITION_FEE ?? 0,
      lab_fee: a?.LAB_FEE ?? 0,
      misc_fee: a?.MISC_FEE ?? 0,
      previous_balance: a?.PREVIOUS_BALANCE ?? 0,
    },
    items: items.map((i) => ({ name: i.ITEM_NAME, amount: i.AMOUNT, type: i.ITEM_TYPE })),
    subjects: subjects.map((x) => ({ subject_id: x.SUBJECT_ID, instructor: x.INSTRUCTOR ?? "", schedule: x.SCHEDULE ?? "" })),
  };
}

/**
 * Creates or updates a student's personal info.
 * New student, or a changed course: the current-semester subjects of the old course are swapped
 * for the new course's subjects (general and hand-picked subjects are kept).
 */
export async function saveStudentInfo(periodId, data, userId, studentId = null) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [courseRows] = await conn.execute("SELECT IDNo, DEPARTMENT FROM course WHERE NAME = ? LIMIT 1", [data.course]);
    const department = courseRows[0]?.DEPARTMENT ?? null;
    const info = [
      data.lrn,
      data.student_number,
      data.rfid,
      data.first_name,
      data.last_name,
      data.course,
      department,
      data.year_level,
      data.section,
      data.contact,
      data.email,
      data.guardian_name,
      data.guardian_contact,
      data.address,
    ];

    let id = studentId;
    let previousCourse = null;
    if (id) {
      const [[current]] = await conn.execute("SELECT COURSE FROM student WHERE IDNo = ? AND ACTIVE = 1", [id]);
      if (!current) {
        await conn.rollback();
        return null;
      }
      previousCourse = current.COURSE;
      await conn.execute(
        `UPDATE student SET LRN = ?, STUDENT_NUMBER = ?, RFID = ?, FIRSTNAME = ?, LASTNAME = ?, COURSE = ?,
           DEPARTMENT = ?, YEAR_LEVEL = ?, SECTION = ?, CONTACTNo = ?, EMAIL = ?, GUARDIAN_NAME = ?,
           GUARDIAN_CONTACT = ?, ADDRESS = ?, EDITED_BY = ?
         WHERE IDNo = ?`,
        [...info, userId, id]
      );
    } else {
      const [result] = await conn.execute(
        `INSERT INTO student (LRN, STUDENT_NUMBER, RFID, FIRSTNAME, LASTNAME, COURSE, DEPARTMENT, YEAR_LEVEL,
           SECTION, CONTACTNo, EMAIL, GUARDIAN_NAME, GUARDIAN_CONTACT, ADDRESS, ENCODED_BY)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...info, userId]
      );
      id = result.insertId;
    }

    if (!studentId || previousCourse !== data.course) {
      if (previousCourse) {
        await conn.execute(
          `DELETE x FROM student_subject x
           JOIN subject_course sc ON sc.SUBJECT_ID = x.SUBJECT_ID
           JOIN course c ON c.IDNo = sc.COURSE_ID
           WHERE x.STUDENT_ID = ? AND x.PERIOD_ID = ? AND c.NAME = ?`,
          [id, periodId, previousCourse]
        );
      }
      const newCourseId = courseRows[0]?.IDNo;
      if (newCourseId) {
        await conn.execute(
          `INSERT IGNORE INTO student_subject (STUDENT_ID, PERIOD_ID, SUBJECT_ID)
           SELECT ?, ?, s.IDNo FROM subject s
           JOIN subject_course sc ON sc.SUBJECT_ID = s.IDNo
           WHERE sc.COURSE_ID = ? AND s.ACTIVE = 1`,
          [id, periodId, newCourseId]
        );
      }
    }

    await conn.commit();
    return id;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/** Replaces a student's current-semester assessment (fees, other fees/discounts) and enrolled subjects. */
export async function saveAssessment(periodId, studentId, data, userId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[student]] = await conn.execute("SELECT IDNo FROM student WHERE IDNo = ? AND ACTIVE = 1", [studentId]);
    if (!student) {
      await conn.rollback();
      return false;
    }

    const a = data.assessment;
    await conn.execute(
      `INSERT INTO assessment (STUDENT_ID, PERIOD_ID, TUITION_FEE, LAB_FEE, MISC_FEE, PREVIOUS_BALANCE, ENCODED_BY)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE TUITION_FEE = VALUES(TUITION_FEE), LAB_FEE = VALUES(LAB_FEE),
         MISC_FEE = VALUES(MISC_FEE), PREVIOUS_BALANCE = VALUES(PREVIOUS_BALANCE)`,
      [studentId, periodId, a.tuition_fee, a.lab_fee, a.misc_fee, a.previous_balance, userId]
    );
    const [[assessment]] = await conn.execute(
      "SELECT IDNo FROM assessment WHERE STUDENT_ID = ? AND PERIOD_ID = ?",
      [studentId, periodId]
    );
    await conn.execute("DELETE FROM assessment_item WHERE ASSESSMENT_ID = ?", [assessment.IDNo]);
    for (const item of data.items) {
      await conn.execute(
        "INSERT INTO assessment_item (ASSESSMENT_ID, ITEM_NAME, AMOUNT, ITEM_TYPE) VALUES (?, ?, ?, ?)",
        [assessment.IDNo, item.name, item.amount, item.type]
      );
    }

    await conn.execute("DELETE FROM student_subject WHERE STUDENT_ID = ? AND PERIOD_ID = ?", [studentId, periodId]);
    for (const sub of data.subjects) {
      await conn.execute(
        "INSERT INTO student_subject (STUDENT_ID, PERIOD_ID, SUBJECT_ID, INSTRUCTOR, SCHEDULE) VALUES (?, ?, ?, ?, ?)",
        [studentId, periodId, sub.subject_id, sub.instructor, sub.schedule]
      );
    }

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/** All student records (active and deactivated) for the Student Records table. */
export async function findRecordList(periodId) {
  const [rows] = await pool.execute(
    `SELECT s.IDNo, s.LRN, s.STUDENT_NUMBER, s.FIRSTNAME, s.LASTNAME, s.COURSE, s.YEAR_LEVEL, s.SECTION,
            s.GUARDIAN_NAME, s.GUARDIAN_CONTACT, s.ACTIVE,
            a.TUITION_FEE + a.LAB_FEE + a.MISC_FEE + a.PREVIOUS_BALANCE
              + COALESCE((SELECT SUM(IF(i.ITEM_TYPE = 'discount', -i.AMOUNT, i.AMOUNT))
                          FROM assessment_item i WHERE i.ASSESSMENT_ID = a.IDNo), 0) AS ASSESSED,
            (SELECT COUNT(*) FROM student_subject x WHERE x.STUDENT_ID = s.IDNo AND x.PERIOD_ID = ?) AS SUBJECTS,
            (SELECT COALESCE(SUM(sb.UNITS), 0) FROM student_subject x JOIN subject sb ON sb.IDNo = x.SUBJECT_ID
              WHERE x.STUDENT_ID = s.IDNo AND x.PERIOD_ID = ?) AS UNITS
     FROM student s
     LEFT JOIN assessment a ON a.STUDENT_ID = s.IDNo AND a.PERIOD_ID = ?
     ORDER BY s.ACTIVE DESC, s.LASTNAME, s.FIRSTNAME`,
    [periodId, periodId, periodId]
  );
  return rows.map((s) => ({
    id: s.IDNo,
    lrn: s.LRN,
    studentNumber: s.STUDENT_NUMBER,
    fullName: `${s.FIRSTNAME} ${s.LASTNAME}`,
    course: s.COURSE,
    yearLevel: s.YEAR_LEVEL,
    section: s.SECTION,
    guardian: s.GUARDIAN_NAME || "",
    guardianContact: s.GUARDIAN_CONTACT || "",
    assessed: Number(s.ASSESSED) || 0,
    subjects: Number(s.SUBJECTS) || 0,
    units: Number(s.UNITS) || 0,
    active: s.ACTIVE === 1,
  }));
}

export async function restoreStudent(id) {
  const [result] = await pool.execute("UPDATE student SET ACTIVE = 1 WHERE IDNo = ? AND ACTIVE = 0", [id]);
  return result.affectedRows;
}

export async function softDeleteStudent(id) {
  const [result] = await pool.execute("UPDATE student SET ACTIVE = 0 WHERE IDNo = ? AND ACTIVE = 1", [id]);
  return result.affectedRows;
}
