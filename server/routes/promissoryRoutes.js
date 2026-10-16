import { Router } from "express";
import * as promissoryController from "../controllers/promissoryController.js";

const router = Router();

router.get("/", promissoryController.list);
router.post("/", promissoryController.create);
router.put("/:id/review", promissoryController.review);

export default router;
