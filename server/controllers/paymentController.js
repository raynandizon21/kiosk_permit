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

/**
 * Self-service kiosk payment: no cashier involved, so there is no O.R. number to type in —
 * the kiosk generates one and posts the payment straight to the ledger as "Cash".
 * (Stand-in for a future bill-acceptor/biller device; see KioskPayBalanceSection.)
 *
 * apply_to: "dues" (default) settles the outstanding balance and may clear permits.
 * apply_to: "deposit" instead holds the amount as account credit (payment.IS_DEPOSIT) —
 * it does not touch dues or permits, and is later cashed out via a withdrawal_request.
 */
export async function kioskCreate(req, res) {
  try {
    const { student_id } = req.body;
    const amount = round2(req.body.amount);
    const applyTo = req.body.apply_to === "deposit" ? "deposit" : "dues";

    if (!student_id) return res.status(400).json({ error: "Session expired. Please sign in again." });
    if (!(amount > 0)) return res.status(400).json({ error: "Payment amount must be greater than ₱0" });

    const period = await requirePeriod(res);
    if (!period) return;

    const before = await studentModel.findProfile(period, Number(student_id));
    if (!before) return res.status(404).json({ error: "Student not found" });
    if (applyTo === "dues" && amount > before.ledger.outstandingBalance + 0.01) {
      return res.status(400).json({ error: "Amount exceeds your outstanding balance" });
    }

    // OR_NUMBER is unique, so reserve the row with a throwaway value, then stamp it
    // with a proper sequential invoice number once the row's own auto-increment id exists.
    const placeholder = `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const paymentId = await paymentModel.createPayment({
      student_id: before.id,
      period_id: period.id,
      or_number: placeholder,
      amount,
      payment_method: "Cash",
      allocation: null,
      remarks: applyTo === "deposit" ? "Self-service kiosk deposit" : "Self-service kiosk payment",
      is_deposit: applyTo === "deposit",
      encoded_by: null,
    });
    const or_number = `${new Date().getFullYear()}-${String(paymentId).padStart(6, "0")}`;
    await paymentModel.updateOrNumber(paymentId, or_number);

    const after = await studentModel.findProfile(period, before.id);
    const cleared = applyTo === "dues" ? await permitModel.clearPaidTerms(after, period.id, null) : [];

    await logModel.addLog({
      action: "payment",
      description:
        applyTo === "deposit"
          ? `Self-service kiosk deposit of ₱${amount.toLocaleString()} (Cash) with ${or_number}`
          : `Self-service kiosk payment of ₱${amount.toLocaleString()} (Cash) with ${or_number}` +
            (cleared.length ? `. Permits cleared: ${cleared.join(", ")}` : ""),
      actor: "Student (Kiosk)",
      studentId: before.id,
    });

    res.status(201).json(await studentModel.findProfile(period, before.id));
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(500).json({ error: "Could not process your payment. Please try again." });
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

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
