import express from "express";

import {
    analyzeTicket,
    suggestKnowledgeArticles
} from "../controllers/aiController.js";

import {
    protect,
    authorize
} from "../middleware/authMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.post(
    "/tickets/:id/analyze",
    validateObjectId("id"),
    authorize("technician", "it_manager", "manager", "system_admin", "admin"),
    analyzeTicket
);

router.post(
    "/tickets/:id/knowledge-suggestions",
    validateObjectId("id"),
    authorize("technician", "it_manager", "manager", "system_admin", "admin"),
    suggestKnowledgeArticles
);

export default router;