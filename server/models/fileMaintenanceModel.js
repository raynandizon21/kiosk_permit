import bcrypt from "bcrypt";
import { pool } from "../config/database.js";
import { EXAM_TERMS } from "../utils/helpers.js";

/**
 * File maintenance tables. `fields` maps API keys → columns.
 * Every table soft-deletes with ACTIVE = 0 (same pattern as library_rfid).
 */
const TYPES = {
  courses: {
    table: "course",
    label: "course",
    fields: { code: "CODE", name: "NAME", department: "DEPARTMENT" },
    required: ["code", "name"],
    order: "NAME ASC",
    describe: (d) => `${d.code} — ${d.name}`,
  },
  subjects: {
    table: "subject",
    label: "subject",
    fields: { code: "CODE", description: "DESCRIPTION", units: "UNITS" },
    // Linked courses (subject_course). None = general subject for all courses.
    extra: [
      `(SELECT GROUP_CONCAT(c.CODE ORDER BY c.CODE SEPARATOR ', ') FROM subject_course sc
        JOIN course c ON c.IDNo = sc.COURSE_ID WHERE sc.SUBJECT_ID = subject.IDNo) AS course_codes`,
      "(SELECT GROUP_CONCAT(sc.COURSE_ID) FROM subject_course sc WHERE sc.SUBJECT_ID = subject.IDNo) AS course_ids",
    ],
    required: ["code", "description", "units"],
    order: "CODE ASC",
    describe: (d) => `${d.code} — ${d.description}`,
  },
  periods: {
    table: "academic_period",
    label: "school year / semester",
    fields: {
      academic_year: "ACADEMIC_YEAR",
      semester: "SEMESTER",
      active_term: "ACTIVE_TERM",
      start_date: "START_DATE",
      end_date: "END_DATE",
    },
    extra: ["IS_CURRENT AS is_current"],
    required: ["academic_year", "semester", "active_term"],
    order: "ACADEMIC_YEAR DESC, SEMESTER DESC",
    describe: (d) => `${d.academic_year} ${d.semester}`,
  },
  users: {
    table: "user_info",
    label: "admin user",
    fields: { first_name: "FIRST_NAME", last_name: "LAST_NAME", position: "POSITION", username: "USERNAME" },
    required: ["first_name", "last_name", "username"],
    order: "LAST_NAME ASC, FIRST_NAME ASC",
    describe: (d) => `${d.first_name} ${d.last_name} (${d.username})`,
  },
};

export function getType(type) {
  const config = TYPES[type];
  if (!config) throw new Error("Invalid maintenance type");
  return config;
}

/** Trims strings and validates required + type-specific rules. Throws a user-facing Error. */
export function cleanInput(type, body, { isCreate }) {
  const config = getType(type);
  const data = {};
  for (const key of Object.keys(config.fields)) {
    const value = body[key];
    data[key] = typeof value === "string" ? value.trim() : value ?? null;
    if (data[key] === "") data[key] = null;
  }
  for (const key of config.required) {
    if (data[key] === null || data[key] === undefined) {
      throw new Error(`${key.replace("_", " ")} is required`);
    }
  }
  if (type === "subjects") {
    const units = Number(data.units);
    if (!(units > 0 && units <= 12)) throw new Error("Units must be between 0.5 and 12");
    data.units = units;
    data.code = data.code.toUpperCase();
    // No courses = general subject offered to every course
    const raw = Array.isArray(body.course_ids) ? body.course_ids : String(body.course_ids ?? "").split(",");
    data.course_ids = [...new Set(raw.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  }
  if (type === "courses") data.code = data.code.toUpperCase();
  if (type === "periods") {
    if (!/^\d{4}-\d{4}$/.test(data.academic_year)) throw new Error("School year must look like 2024-2025");
    if (!EXAM_TERMS.includes(data.active_term)) throw new Error("Invalid examination term");
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (data.start_date && !dateRe.test(data.start_date)) throw new Error("Invalid start date");
    if (data.end_date && !dateRe.test(data.end_date)) throw new Error("Invalid end date");
    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      throw new Error("End date must be on or after the start date");
    }
  }
  if (type === "users") {
    const password = String(body.password ?? "");
    if (isCreate && password.length < 6) throw new Error("Password must be at least 6 characters");
    if (!isCreate && password && password.length < 6) throw new Error("Password must be at least 6 characters");
    data.password = password || null;
  }
  return data;
}

export async function findAll(type) {
  const config = getType(type);
  const cols = Object.entries(config.fields).map(([key, col]) => `${col} AS ${key}`);
  const [rows] = await pool.query(
    `SELECT IDNo AS id, ${[...cols, ...(config.extra ?? [])].join(", ")}, ACTIVE AS active
     FROM ${config.table} ORDER BY ACTIVE DESC, ${config.order}`
  );
  return rows.map((r) => ({
    ...r,
    active: r.active === 1,
    ...("is_current" in r ? { is_current: r.is_current === 1 } : {}),
  }));
}

export async function findById(type, id) {
  const config = getType(type);
  const cols = Object.entries(config.fields).map(([key, col]) => `${col} AS ${key}`);
  const [rows] = await pool.query(
    `SELECT IDNo AS id, ${[...cols, ...(config.extra ?? [])].join(", ")} FROM ${config.table} WHERE IDNo = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function create(type, data) {
  const config = getType(type);
  const keys = Object.keys(config.fields);
  const cols = keys.map((k) => config.fields[k]);
  const values = keys.map((k) => data[k]);
  if (type === "users") {
    cols.push("PASSWORD");
    values.push(await bcrypt.hash(data.password, 10));
  }
  const [result] = await pool.query(
    `INSERT INTO ${config.table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    values
  );
  if (type === "subjects") await setSubjectCourses(result.insertId, data.course_ids);
  return result.insertId;
}

/** Replaces the courses a subject belongs to. */
async function setSubjectCourses(subjectId, courseIds) {
  await pool.query("DELETE FROM subject_course WHERE SUBJECT_ID = ?", [subjectId]);
  if (courseIds.length === 0) return;
  await pool.query("INSERT INTO subject_course (SUBJECT_ID, COURSE_ID) VALUES ?", [
    courseIds.map((courseId) => [subjectId, courseId]),
  ]);
}

export async function update(type, id, data) {
  const config = getType(type);
  const keys = Object.keys(config.fields);
  const sets = keys.map((k) => `${config.fields[k]} = ?`);
  const values = keys.map((k) => data[k]);
  if (type === "users" && data.password) {
    sets.push("PASSWORD = ?");
    values.push(await bcrypt.hash(data.password, 10));
  }
  const [result] = await pool.query(
    `UPDATE ${config.table} SET ${sets.join(", ")} WHERE IDNo = ?`,
    [...values, id]
  );
  if (type === "subjects" && result.affectedRows > 0) await setSubjectCourses(id, data.course_ids);
  return result.affectedRows;
}

export async function softDelete(type, id) {
  const config = getType(type);
  const [result] = await pool.query(`UPDATE ${config.table} SET ACTIVE = 0 WHERE IDNo = ? AND ACTIVE = 1`, [id]);
  return result.affectedRows;
}

export async function restore(type, id) {
  const config = getType(type);
  const [result] = await pool.query(`UPDATE ${config.table} SET ACTIVE = 1 WHERE IDNo = ? AND ACTIVE = 0`, [id]);
  return result.affectedRows;
}

export async function countActive(type) {
  const config = getType(type);
  const [rows] = await pool.query(`SELECT COUNT(*) AS n FROM ${config.table} WHERE ACTIVE = 1`);
  return rows[0].n;
}

/** Makes one school year / semester the current one used by the kiosk. */
export async function setCurrentPeriod(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT IDNo FROM academic_period WHERE IDNo = ? AND ACTIVE = 1", [id]);
    if (rows.length === 0) {
      await conn.rollback();
      return false;
    }
    await conn.query("UPDATE academic_period SET IS_CURRENT = 0");
    await conn.query("UPDATE academic_period SET IS_CURRENT = 1 WHERE IDNo = ?", [id]);
    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
