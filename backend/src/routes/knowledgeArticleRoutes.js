import express from "express";

import {
    createArticle,
    getArticles,
    getArticleById,
    updateArticle,
    deleteArticle,
    markHelpful,
    markNotHelpful
} from "../controllers/knowledgeArticleController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

/*
 * Read access
 */
router.get("/", getArticles);

router.get("/:id", getArticleById);

/*
 * Create
 */
router.post(
    "/",
    authorize("admin", "manager", "technician"),
    createArticle
);

/*
 * Update
 */
router.patch(
    "/:id",
    authorize("admin", "manager", "technician"),
    updateArticle
);

/*
 * Delete
 */
router.delete(
    "/:id",
    authorize("admin", "manager"),
    deleteArticle
);

/*
 * Feedback
 */
router.patch(
    "/:id/helpful",
    markHelpful
);

router.patch(
    "/:id/not-helpful",
    markNotHelpful
);

export default router;