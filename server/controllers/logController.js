import * as logModel from "../models/logModel.js";
import { getErrorMessage } from "../utils/helpers.js";

/** Actions the kiosk itself may record (everything else is logged server-side). */
const KIOSK_ACTIONS = ["soa_print", "permit_print", "promissory_print", "payment_slip_print"];

export async function list(req, res) {
  try {
    res.json(await logModel.findLogs(req.query.limit));
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function create(req, res) {
  try {
    const { action, description, student_id } = req.body;
    if (!KIOSK_ACTIONS.includes(action)) {
      return res.status(400).json({ error: "Invalid log action" });
    }
    await logModel.addLog({
      action,
      description: String(description ?? action),
      actor: "Kiosk",
      studentId: Number(student_id) || null,
    });
    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
