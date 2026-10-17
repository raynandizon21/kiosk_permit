import { Router } from "express";
import * as withdrawalController from "../controllers/withdrawalController.js";

const router = Router();

router.get("/", withdrawalController.list);
router.post("/", withdrawalController.create);
router.put("/:id/review", withdrawalController.review);

export default router;
