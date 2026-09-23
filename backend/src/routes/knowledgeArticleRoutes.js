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
import { validateObjectId } from "../middleware/validateObjectId.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
    createArticleValidator,
    updateArticleValidator
} from "../validators/knowledgeValidators.js";

const router = express.Router();

router.use(protect);

/*
 * Read access
 */
router.get("/", getArticles);

router.get("/:id", validateObjectId("id"), getArticleById);

/*
 * Create
 */
router.post(
    "/",
    authorize("admin", "system_admin", "manager", "it_manager", "technician"),
    createArticleValidator,
    validateRequest,
    createArticle
);

/*
 * Update
 */
router.patch(
    "/:id",
    validateObjectId("id"),
    authorize("admin", "system_admin", "manager", "it_manager", "technician"),
    updateArticleValidator,
    validateRequest,
    updateArticle
);

/*
 * Delete
 */
router.delete(
    "/:id",
    validateObjectId("id"),
    authorize("admin", "system_admin", "manager", "it_manager"),
    deleteArticle
);

/*
 * Feedback
 */
router.patch(
    "/:id/helpful",
    validateObjectId("id"),
    markHelpful
);

router.patch(
    "/:id/not-helpful",
    validateObjectId("id"),
    markNotHelpful
);

export default router;