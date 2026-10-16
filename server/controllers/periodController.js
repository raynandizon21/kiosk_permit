import * as periodModel from "../models/periodModel.js";
import * as logModel from "../models/logModel.js";
import { findUserName } from "../models/authModel.js";
import { encodedBy, getErrorMessage, isExamTerm } from "../utils/helpers.js";

/** Loads the current semester or answers 503; controllers return early on null. */
export async function requirePeriod(res) {
  const period = await periodModel.findCurrentPeriod();
  if (!period) {
    res.status(503).json({ error: "No current academic period. Run database/seed.sql or set one in academic_period." });
    return null;
  }
  return period;
}

export async function getCurrent(_req, res) {
  try {
    const period = await requirePeriod(res);
    if (period) res.json(period);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function updateActiveTerm(req, res) {
  try {
    const { active_term } = req.body;
    if (!isExamTerm(active_term)) {
      return res.status(400).json({ error: "Invalid examination term" });
    }
    const period = await requirePeriod(res);
    if (!period) return;

    await periodModel.updateActiveTerm(period.id, active_term);
    await logModel.addLog({
      action: "term_change",
      description: `Active examination term changed from ${period.activeTerm} to ${active_term}`,
      actor: await findUserName(encodedBy(req.body)),
    });
    res.json({ ...period, activeTerm: active_term });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
