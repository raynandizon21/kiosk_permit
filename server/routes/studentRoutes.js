import { Router } from "express";
import * as studentController from "../controllers/studentController.js";

const router = Router();

router.get("/", studentController.list);
router.get("/records", studentController.listRecords);
router.get("/:id", studentController.getOne);
router.get("/:id/record", studentController.getRecord);
router.put("/:id/assessment", studentController.updateAssessment);
router.post("/", studentController.create);
router.put("/:id", studentController.update);
router.delete("/:id", studentController.remove);
router.put("/:id/restore", studentController.restore);

export default router;
