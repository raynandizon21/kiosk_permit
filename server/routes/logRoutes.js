import { Router } from "express";
import * as logController from "../controllers/logController.js";

const router = Router();

router.get("/", logController.list);
router.post("/", logController.create);

export default router;
