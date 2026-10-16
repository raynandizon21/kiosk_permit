import { Router } from "express";
import * as fileMaintenanceController from "../controllers/fileMaintenanceController.js";

const router = Router();

router.put("/periods/:id/current", fileMaintenanceController.setCurrentPeriod);
router.put("/:type/:id/restore", fileMaintenanceController.restore);
router.get("/:type", fileMaintenanceController.list);
router.post("/:type", fileMaintenanceController.create);
router.put("/:type/:id", fileMaintenanceController.update);
router.delete("/:type/:id", fileMaintenanceController.remove);

export default router;
