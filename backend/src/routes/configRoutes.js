import express from "express";
import { getConfig, updateConfig } from "../controllers/configController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("system_admin", "admin"));

router.get("/", getConfig);
router.patch("/", updateConfig);

export default router;
