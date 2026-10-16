import * as fileMaintenanceModel from "../models/fileMaintenanceModel.js";
import * as logModel from "../models/logModel.js";
import { findUserName } from "../models/authModel.js";
import { encodedBy, getErrorMessage, isDuplicateKeyError } from "../utils/helpers.js";

const DUPLICATE_MESSAGE = {
  courses: "A course with that code or name already exists",
  subjects: "A subject with that code already exists",
  periods: "That school year and semester already exists",
  users: "That username is already taken",
};

async function log(req, description) {
  await logModel.addLog({
    action: "maintenance",
    description,
    actor: await findUserName(encodedBy(req.body ?? {})),
  });
}

export async function list(req, res) {
  try {
    res.json(await fileMaintenanceModel.findAll(req.params.type));
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}

export async function create(req, res) {
  const { type } = req.params;
  let data;
  try {
    data = fileMaintenanceModel.cleanInput(type, req.body, { isCreate: true });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
  try {
    const config = fileMaintenanceModel.getType(type);
    const id = await fileMaintenanceModel.create(type, data);
    await log(req, `Added ${config.label} ${config.describe(data)}`);
    res.status(201).json({ id });
  } catch (error) {
    if (isDuplicateKeyError(error)) return res.status(400).json({ error: DUPLICATE_MESSAGE[type] });
    if (error?.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ error: "The selected course does not exist" });
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function update(req, res) {
  const { type, id } = req.params;
  let data;
  try {
    data = fileMaintenanceModel.cleanInput(type, req.body, { isCreate: false });
  } catch (error) {
    return res.status(400).json({ error: getErrorMessage(error) });
  }
  try {
    const config = fileMaintenanceModel.getType(type);
    const affected = await fileMaintenanceModel.update(type, Number(id), data);
    if (affected === 0) return res.status(404).json({ error: "Record not found" });
    await log(req, `Updated ${config.label} ${config.describe(data)}`);
    res.json({ message: "Updated" });
  } catch (error) {
    if (isDuplicateKeyError(error)) return res.status(400).json({ error: DUPLICATE_MESSAGE[type] });
    if (error?.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ error: "The selected course does not exist" });
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function remove(req, res) {
  const { type } = req.params;
  const id = Number(req.params.id);
  try {
    const config = fileMaintenanceModel.getType(type);
    const row = await fileMaintenanceModel.findById(type, id);
    if (!row) return res.status(404).json({ error: "Record not found" });

    if (type === "periods" && row.is_current === 1) {
      return res.status(400).json({ error: "You can't remove the current school year. Set another one as current first." });
    }
    if (type === "users") {
      if (id === encodedBy(req.body ?? {})) {
        return res.status(400).json({ error: "You can't deactivate your own account" });
      }
      if ((await fileMaintenanceModel.countActive("users")) <= 1) {
        return res.status(400).json({ error: "At least one admin account must stay active" });
      }
    }

    await fileMaintenanceModel.softDelete(type, id);
    await log(req, `Deactivated ${config.label} ${config.describe(row)}`);
    res.json({ message: "Deactivated" });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function restore(req, res) {
  const { type } = req.params;
  const id = Number(req.params.id);
  try {
    const config = fileMaintenanceModel.getType(type);
    const affected = await fileMaintenanceModel.restore(type, id);
    if (affected === 0) return res.status(404).json({ error: "Record not found or already active" });
    const row = await fileMaintenanceModel.findById(type, id);
    await log(req, `Restored ${config.label} ${config.describe(row)}`);
    res.json({ message: "Restored" });
  } catch (error) {
    if (isDuplicateKeyError(error)) return res.status(400).json({ error: DUPLICATE_MESSAGE[type] });
    if (error?.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ error: "The selected course does not exist" });
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function setCurrentPeriod(req, res) {
  try {
    const id = Number(req.params.id);
    const ok = await fileMaintenanceModel.setCurrentPeriod(id);
    if (!ok) return res.status(404).json({ error: "School year not found" });
    const row = await fileMaintenanceModel.findById("periods", id);
    await log(req, `Set ${row.academic_year} ${row.semester} as the current school year`);
    res.json({ message: "Current school year updated" });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
