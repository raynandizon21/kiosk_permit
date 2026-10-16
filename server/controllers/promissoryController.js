import * as promissoryModel from "../models/promissoryModel.js";
import * as studentModel from "../models/studentModel.js";
import * as permitModel from "../models/permitModel.js";
import * as logModel from "../models/logModel.js";
import { findUserName } from "../models/authModel.js";
import { requirePeriod } from "./periodController.js";
import {
  encodedBy,
  getErrorMessage,
  isExamTerm,
  permitNumberFor,
  REASON_CATEGORIES,
  round2,
} from "../utils/helpers.js";

const TERM_KEY = { Prelim: "prelim", Midterm: "midterm", Prefinal: "prefinal", Finals: "finals" };

export async function list(req, res) {
  try {
    const period = await requirePeriod(res);
    if (!period) return;
    const studentId = req.query.student_id ? Number(req.query.student_id) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    res.json(await promissoryModel.findNotes(period.id, { studentId, status }));
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

/** POST /api/promissory-notes — submitted by the student at the kiosk. */
export async function create(req, res) {
  try {
    const {
      student_id,
      term,
      committed_date,
      reason_category,
      reason_details,
      guardian_name,
      guardian_contact,
      signature,
    } = req.body;
    const committed_amount = round2(req.body.committed_amount);

    if (!isExamTerm(term)) return res.status(400).json({ error: "Invalid examination term" });
    if (!(committed_amount > 0)) {
      return res.status(400).json({ error: "Committed payment amount must be greater than ₱0" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(committed_date ?? ""))) {
      return res.status(400).json({ error: "Please select a committed payment date" });
    }
    if (!REASON_CATEGORIES.includes(reason_category)) {
      return res.status(400).json({ error: "Invalid reason category" });
    }
    if (!guardian_name?.trim() || !guardian_contact?.trim()) {
      return res.status(400).json({ error: "Parent/guardian name and contact number are required" });
    }
    if (!String(signature ?? "").startsWith("data:image/")) {
      return res.status(400).json({ error: "Please sign on the signature pad" });
    }

    const period = await requirePeriod(res);
    if (!period) return;

    const profile = await studentModel.findProfile(period, Number(student_id));
    if (!profile) return res.status(404).json({ error: "Student not found" });

    if (profile.ledger.outstandingBalance <= 0) {
      return res.status(400).json({ error: "Your account has no outstanding balance." });
    }
    if (profile.permits[TERM_KEY[term]].status !== "locked") {
      return res.status(400).json({ error: `Your ${term} permit is already cleared.` });
    }
    if (await promissoryModel.hasPendingNote(profile.id, period.id, term)) {
      return res.status(400).json({ error: `You already have a pending promissory note for ${term}.` });
    }

    const id = await promissoryModel.createNote({
      student_id: profile.id,
      period_id: period.id,
      term,
      balance_amount: profile.ledger.outstandingBalance,
      committed_amount,
      committed_date,
      reason_category,
      reason_details: reason_details?.trim() || null,
      guardian_name: guardian_name.trim(),
      guardian_contact: guardian_contact.trim(),
      signature,
    });
    const note = await promissoryModel.findNoteById(id);

    await logModel.addLog({
      action: "promissory_submit",
      description: `Applied for ${term} promissory note ${note.referenceNo}: ₱${committed_amount.toLocaleString()} on ${committed_date}`,
      actor: "Kiosk",
      studentId: profile.id,
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

/** PUT /api/promissory-notes/:id/review — accounting approves or declines. */
export async function review(req, res) {
  try {
    const { status } = req.body;
    const remarks = String(req.body.remarks ?? "").trim();
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be approved or rejected" });
    }
    if (status === "rejected" && !remarks) {
      return res.status(400).json({ error: "Please give the reason for declining" });
    }

    const period = await requirePeriod(res);
    if (!period) return;
    const userId = encodedBy(req.body);

    const note = await promissoryModel.findNoteById(Number(req.params.id));
    if (!note) return res.status(404).json({ error: "Promissory note not found" });

    const finalRemarks =
      remarks ||
      `Approved for ${note.term} Examination. Balance to be settled on or before ${note.committedPaymentDate}.`;
    const affected = await promissoryModel.reviewNote(note.id, {
      status,
      remarks: finalRemarks,
      reviewed_by: userId,
    });
    if (affected === 0) return res.status(400).json({ error: "This note was already reviewed" });

    if (status === "approved") {
      const profile = await studentModel.findProfile(period, note.studentPk);
      if (profile && profile.permits[TERM_KEY[note.term]].status === "locked") {
        await permitModel.upsertPermit({
          studentId: note.studentPk,
          periodId: period.id,
          term: note.term,
          status: "promissory_cleared",
          permitNumber: permitNumberFor(note.term, note.studentPk, period.id, "PN"),
          issuedBy: userId,
        });
      }
    }

    await logModel.addLog({
      action: status === "approved" ? "pn_approve" : "pn_reject",
      description: `Promissory note ${note.referenceNo} (${note.term}) ${status}. ${finalRemarks}`,
      actor: await findUserName(userId),
      studentId: note.studentPk,
    });

    res.json(await promissoryModel.findNoteById(note.id));
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
