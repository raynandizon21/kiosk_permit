import { Router } from "express";
import * as periodController from "../controllers/periodController.js";

const router = Router();

router.get("/", periodController.getCurrent);
router.put("/", periodController.updateActiveTerm);

export default router;
