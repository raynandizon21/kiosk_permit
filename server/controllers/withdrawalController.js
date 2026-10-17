import * as withdrawalModel from "../models/withdrawalModel.js";
import * as studentModel from "../models/studentModel.js";
import * as logModel from "../models/logModel.js";
import { findUserName } from "../models/authModel.js";
import { requirePeriod } from "./periodController.js";
import { encodedBy, getErrorMessage, round2 } from "../utils/helpers.js";

export async function list(req, res) {
  try {
    const period = await requirePeriod(res);
    if (!period) return;
    const studentId = req.query.student_id ? Number(req.query.student_id) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    res.json(await withdrawalModel.findRequests(period.id, { studentId, status }));
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

/** POST /api/withdrawals — the student asks, at the kiosk, to cash out deposited credit. */
export async function create(req, res) {
  try {
    const { student_id } = req.body;
    const amount = round2(req.body.amount);

    if (!student_id) return res.status(400).json({ error: "Session expired. Please sign in again." });
    if (!(amount > 0)) return res.status(400).json({ error: "Withdrawal amount must be greater than ₱0" });

    const period = await requirePeriod(res);
    if (!period) return;

    const profile = await studentModel.findProfile(period, Number(student_id));
    if (!profile) return res.status(404).json({ error: "Student not found" });
    if (amount > profile.ledger.availableCredit + 0.01) {
      return res.status(400).json({ error: "Amount exceeds your available credit" });
    }
    if (await withdrawalModel.hasPendingRequest(profile.id, period.id)) {
      return res.status(400).json({ error: "You already have a pending withdrawal request. Present it to the Cashier." });
    }

    const id = await withdrawalModel.createRequest({ student_id: profile.id, period_id: period.id, amount });
    const request = await withdrawalModel.findRequestById(id);

    await logModel.addLog({
      action: "wd_submit",
      description: `Requested withdrawal of ₱${amount.toLocaleString()} (${request.referenceNo})`,
      actor: "Kiosk",
      studentId: profile.id,
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

/** PUT /api/withdrawals/:id/review — accounting releases the cash or declines the request. */
export async function review(req, res) {
  try {
    const { status } = req.body;
    const remarks = String(req.body.remarks ?? "").trim();
    if (!["released", "declined"].includes(status)) {
      return res.status(400).json({ error: "Status must be released or declined" });
    }
    if (status === "declined" && !remarks) {
      return res.status(400).json({ error: "Please give the reason for declining" });
    }

    const userId = encodedBy(req.body);
    const request = await withdrawalModel.findRequestById(Number(req.params.id));
    if (!request) return res.status(404).json({ error: "Withdrawal request not found" });

    const finalRemarks = remarks || "Released at the Cashier.";
    const affected = await withdrawalModel.reviewRequest(request.id, {
      status,
      remarks: finalRemarks,
      reviewed_by: userId,
    });
    if (affected === 0) return res.status(400).json({ error: "This request was already reviewed" });

    await logModel.addLog({
      action: status === "released" ? "wd_release" : "wd_decline",
      description: `Withdrawal ${request.referenceNo} (₱${request.amount.toLocaleString()}) ${status}. ${finalRemarks}`,
      actor: await findUserName(userId),
      studentId: request.studentPk,
    });

    res.json(await withdrawalModel.findRequestById(request.id));
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
