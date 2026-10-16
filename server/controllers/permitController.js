import * as permitModel from "../models/permitModel.js";
import * as studentModel from "../models/studentModel.js";
import * as logModel from "../models/logModel.js";
import { findUserName } from "../models/authModel.js";
import { requirePeriod } from "./periodController.js";
import { encodedBy, getErrorMessage, isExamTerm, permitNumberFor } from "../utils/helpers.js";

const STATUSES = ["cleared", "promissory_cleared", "locked"];

/** PUT /api/permits — registrar manually clears or locks a term permit. */
export async function override(req, res) {
  try {
    const { student_id, term, status } = req.body;
    if (!isExamTerm(term)) return res.status(400).json({ error: "Invalid examination term" });
    if (!STATUSES.includes(status)) return res.status(400).json({ error: "Invalid permit status" });

    const period = await requirePeriod(res);
    if (!period) return;
    const userId = encodedBy(req.body);

    const profile = await studentModel.findProfile(period, Number(student_id));
    if (!profile) return res.status(404).json({ error: "Student not found" });

    await permitModel.upsertPermit({
      studentId: profile.id,
      periodId: period.id,
      term,
      status,
      permitNumber: status === "locked" ? null : permitNumberFor(term, profile.id, period.id, "M"),
      issuedBy: userId,
    });

    await logModel.addLog({
      action: "permit_override",
      description: `${term} permit manually set to ${status.replace("_", " ")}`,
      actor: await findUserName(userId),
      studentId: profile.id,
    });

    res.json(await studentModel.findProfile(period, profile.id));
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
