import express from "express";

import {
    analyzeTicket,
    suggestKnowledgeArticles
} from "../controllers/aiController.js";

import { protect,
         authorize
 } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post(
    "/tickets/:id/analyze",
    authorize("technician", "it_manager", "manager", "system_admin", "admin"),
    analyzeTicket
);

router.post(
    "/tickets/:id/knowledge-suggestions",
    authorize("technician", "it_manager", "manager", "system_admin", "admin"),
    suggestKnowledgeArticles
);

export default router;