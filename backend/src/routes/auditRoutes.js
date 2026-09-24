import express from "express";
import { getAuditLogs } from "../controllers/auditController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("system_admin", "admin"));

router.get("/", getAuditLogs);

export default router;
