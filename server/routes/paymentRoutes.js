import { Router } from "express";
import * as paymentController from "../controllers/paymentController.js";

const router = Router();

router.post("/", paymentController.create);
router.post("/kiosk", paymentController.kioskCreate);

export default router;
