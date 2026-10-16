import { Router } from "express";
import * as permitController from "../controllers/permitController.js";

const router = Router();

router.put("/", permitController.override);

export default router;
