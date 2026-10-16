import * as studentModel from "../models/studentModel.js";
import * as logModel from "../models/logModel.js";
import { requirePeriod } from "./periodController.js";
import * as permitModel from "../models/permitModel.js";
import { findUserName } from "../models/authModel.js";
import { encodedBy, getErrorMessage, isDuplicateKeyError } from "../utils/helpers.js";

/**
 * GET /api/students            → all profiles (admin)
 * GET /api/students?lookup=X   → kiosk sign-in by LRN, student number, or ID card
 */
export async function list(req, res) {
  try {
    const period = await requirePeriod(res);
    if (!period) return;

    const lookup = String(req.query.lookup ?? "").trim();
    if (lookup) {
      const id = await studentModel.findStudentIdByLookup(lookup);
      if (!id) {
        return res.status(404).json({ error: "Student Number or LRN not found. Please verify with the Accounting Office." });
      }
      const profile = await studentModel.findProfile(period, id);
      await logModel.addLog({
        action: "kiosk_login",
        description: "Signed in at the self-service kiosk",
        actor: "Kiosk",
        studentId: id,
      });
      return res.json(profile);
    }

    res.json(await studentModel.findProfiles(period));
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function getOne(req, res) {
  try {
    const period = await requirePeriod(res);
    if (!period) return;
    const profile = await studentModel.findProfile(period, Number(req.params.id));
    if (!profile) return res.status(404).json({ error: "Student not found" });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

/* ---------- File maintenance: student records ---------- */

const money = (v) => Math.round(Math.max(0, Number(v) || 0) * 100) / 100;
const text = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Validates the admin student form. Throws a user-facing Error. */
function cleanStudent(body) {
  const data = {
    lrn: text(body.lrn),
    student_number: text(body.student_number)?.toUpperCase() ?? null,
    rfid: text(body.rfid),
    first_name: text(body.first_name),
    last_name: text(body.last_name),
    course: text(body.course),
    year_level: text(body.year_level),
    section: text(body.section),
    contact: text(body.contact),
    email: text(body.email),
    guardian_name: text(body.guardian_name),
    guardian_contact: text(body.guardian_contact),
    address: text(body.address),
  };
  const required = { lrn: "LRN", student_number: "Student number", first_name: "First name", last_name: "Last name", course: "Course", year_level: "Year level", section: "Section" };
  for (const [key, label] of Object.entries(required)) {
    if (!data[key]) throw new Error(`${label} is required`);
  }
  if (!/^\d{6,20}$/.test(data.lrn)) throw new Error("LRN must be 6–20 digits");
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) throw new Error("Email address is not valid");
  return data;
}

/** Validates the assessment form (fees, other fees/discounts, subjects). Throws a user-facing Error. */
function cleanAssessment(body) {
  const data = {};
  const a = body.assessment ?? {};
  data.assessment = {
    tuition_fee: money(a.tuition_fee),
    lab_fee: money(a.lab_fee),
    misc_fee: money(a.misc_fee),
    previous_balance: money(a.previous_balance),
  };
  data.items = (Array.isArray(body.items) ? body.items : [])
    .map((i) => ({ name: text(i?.name), amount: money(i?.amount), type: i?.type === "discount" ? "discount" : "fee" }))
    .filter((i) => i.name || i.amount);
  if (data.items.some((i) => !i.name || !(i.amount > 0))) {
    throw new Error("Each other fee / discount needs a name and an amount");
  }
  const seen = new Set();
  data.subjects = (Array.isArray(body.subjects) ? body.subjects : [])
    .map((s) => ({ subject_id: Number(s?.subject_id), instructor: text(s?.instructor), schedule: text(s?.schedule) }))
    .filter((s) => Number.isInteger(s.subject_id) && s.subject_id > 0 && !seen.has(s.subject_id) && seen.add(s.subject_id));
  return data;
}

export async function listRecords(_req, res) {
  try {
    const period = await requirePeriod(res);
    if (!period) return;
    res.json(await studentModel.findRecordList(period.id));
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function restore(req, res) {
  try {
    const id = Number(req.params.id);
    const affected = await studentModel.restoreStudent(id);
    if (affected === 0) return res.status(404).json({ error: "Student not found or already active" });
    await logModel.addLog({
      action: "student_restore",
      description: "Student record restored",
      actor: await findUserName(encodedBy(req.body ?? {})),
      studentId: id,
    });
    res.json({ message: "Student restored" });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(400).json({ error: "LRN, student number, or ID card is already used by another student" });
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function getRecord(req, res) {
  try {
    const period = await requirePeriod(res);
    if (!period) return;
    const record = await studentModel.findRecord(period.id, Number(req.params.id));
    if (!record) return res.status(404).json({ error: "Student not found" });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

async function save(req, res, studentId) {
  let data;
  try {
    data = cleanStudent(req.body);
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
  try {
    const period = await requirePeriod(res);
    if (!period) return;
    const userId = encodedBy(req.body);
    const id = await studentModel.saveStudentInfo(period.id, data, userId, studentId);
    if (!id) return res.status(404).json({ error: "Student not found" });

    await logModel.addLog({
      action: studentId ? "student_update" : "student_add",
      description: `${studentId ? "Updated" : "Added"} student record ${data.student_number} — ${data.first_name} ${data.last_name}`,
      actor: await findUserName(userId),
      studentId: id,
    });
    res.status(studentId ? 200 : 201).json({ id });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(400).json({ error: "LRN, student number, or ID card is already used by another student" });
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

/** PUT /api/students/:id/assessment — fees, other fees/discounts, and enrolled subjects. */
export async function updateAssessment(req, res) {
  let data;
  try {
    data = cleanAssessment(req.body);
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
  try {
    const period = await requirePeriod(res);
    if (!period) return;
    const id = Number(req.params.id);
    const userId = encodedBy(req.body);
    const ok = await studentModel.saveAssessment(period.id, id, data, userId);
    if (!ok) return res.status(404).json({ error: "Student not found" });

    // A lower assessment can make terms fully paid — clear those permits (never locks any)
    const profile = await studentModel.findProfile(period, id);
    await permitModel.clearPaidTerms(profile, period.id, userId);

    await logModel.addLog({
      action: "assessment_update",
      description: `Updated assessment: ₱${profile.ledger.totalAssessed.toLocaleString()} total, ${data.subjects.length} subject(s)`,
      actor: await findUserName(userId),
      studentId: id,
    });
    res.json({ message: "Assessment saved" });
  } catch (error) {
    if (error?.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ error: "A selected subject no longer exists" });
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export const create = (req, res) => save(req, res, null);
export const update = (req, res) => save(req, res, Number(req.params.id));

export async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    const affected = await studentModel.softDeleteStudent(id);
    if (affected === 0) return res.status(404).json({ error: "Student not found" });
    await logModel.addLog({
      action: "student_deactivate",
      description: "Student record deactivated",
      actor: await findUserName(encodedBy(req.body ?? {})),
      studentId: id,
    });
    res.json({ message: "Student deactivated" });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
