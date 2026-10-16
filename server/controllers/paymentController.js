import * as paymentModel from "../models/paymentModel.js";
import * as studentModel from "../models/studentModel.js";
import * as permitModel from "../models/permitModel.js";
import * as logModel from "../models/logModel.js";
import { findUserName } from "../models/authModel.js";
import { requirePeriod } from "./periodController.js";
import {
  encodedBy,
  getErrorMessage,
  isDuplicateKeyError,
  PAYMENT_METHODS,
  round2,
} from "../utils/helpers.js";

export async function create(req, res) {
  try {
    const { student_id, payment_method, allocation, remarks } = req.body;
    const amount = round2(req.body.amount);
    const or_number = String(req.body.or_number ?? "").trim();

    if (!student_id) return res.status(400).json({ error: "Please select a student" });
    if (!(amount > 0)) return res.status(400).json({ error: "Payment amount must be greater than ₱0" });
    if (!or_number) return res.status(400).json({ error: "Official Receipt (O.R.) number is required" });
    if (!PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    const period = await requirePeriod(res);
    if (!period) return;
    const userId = encodedBy(req.body);

    const before = await studentModel.findProfile(period, Number(student_id));
    if (!before) return res.status(404).json({ error: "Student not found" });

    await paymentModel.createPayment({
      student_id: before.id,
      period_id: period.id,
      or_number,
      amount,
      payment_method,
      allocation: allocation?.trim() || null,
      remarks: remarks?.trim() || null,
      encoded_by: userId,
    });

    const after = await studentModel.findProfile(period, before.id);
    const cleared = await permitModel.clearPaidTerms(after, period.id, userId);

    await logModel.addLog({
      action: "payment",
      description:
        `Recorded ₱${amount.toLocaleString()} (${payment_method}) with ${or_number}` +
        (cleared.length ? `. Permits cleared: ${cleared.join(", ")}` : ""),
      actor: await findUserName(userId),
      studentId: before.id,
    });

    res.status(201).json(await studentModel.findProfile(period, before.id));
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(400).json({ error: "That O.R. number was already recorded" });
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
